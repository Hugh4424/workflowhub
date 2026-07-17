import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { createTask } from "../../core/task-handle.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { bootstrapStage, prepareMakeDecisionWorkspace } from "../../core/stage-context.mjs";
import { acceptStageAttempt, runStage } from "../../core/stage-runner.mjs";
import { testConfirmationVerification, writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { requiresHumanConfirmation } from "../../core/stage-acceptance-policy.mjs";
import { captureTaskSnapshotV1Sync } from "../../core/task-snapshot.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const script = join(root, "scripts/ci-chain-check.mjs");
const temporary = [];
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

async function fixture({ reverseLast = false, tamper = false } = {}) {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "ci-chain-task-v1-")));
  temporary.push(storageRoot);
  const taskId = "demo-task";
  const projectName = "Demo";
  const taskPath = join(storageRoot, "Projects", projectName, "tasks", taskId);
  const repo = join(storageRoot,"repo"); mkdirSync(repo);
  execFileSync("git",["init","-q"],{cwd:repo}); execFileSync("git",["config","user.email","t@example.com"],{cwd:repo}); execFileSync("git",["config","user.name","Test"],{cwd:repo}); execFileSync("git",["commit","--allow-empty","-qm","base"],{cwd:repo});
  const task = createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: projectName, task_id: taskId,
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs: {},
  } });
  const decisionContext=prepareMakeDecisionWorkspace(bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName,taskId,confirmationVerification:testConfirmationVerification}));
  const worktree=decisionContext.candidateWorkspace.worktreeRoot, oid=decisionContext.candidateWorkspace.baselineCommit;
  const tree=decisionContext.candidateWorkspace.captureSnapshot().tree, hash="a".repeat(64);
  const testFacts=(prefix,snapshotTree)=>({command:"npm test",exit_code:0,command_hash:hash,snapshot_head:oid,snapshot_tree:snapshotTree,snapshot_commit:oid,started_at:"2026-07-16T00:00:00.000Z",completed_at:"2026-07-16T00:00:01.000Z",receipt_ref:`evidence/${prefix}-receipt.json`,receipt_hash:hash,output_ref:`evidence/${prefix}-output.txt`,output_hash:hash});
  const reviewFacts=(stage,snapshotTree)=>({verdict:"pass",result_ref:`reviews/results/${stage}.json`,result_hash:hash,snapshot_tree:snapshotTree});
  const contextFor=(stage)=>stage==="make-decision"?decisionContext:bootstrapStage(stage,{mode:"sidecar",taskPath,projectName,taskId,confirmationVerification:testConfirmationVerification});
  const execute=async(stage,handler)=>{const context=contextFor(stage);const attempt=await runStage(stage,context,handler);const request={attemptRef:attempt.attempt_ref};if(requiresHumanConfirmation(stage))request.humanConfirmationRef=writeHumanConfirmation(context.kernel,stage,attempt);acceptStageAttempt(stage,context,request);};
  await execute("make-decision",async()=>({facts:{worktree_root:worktree,baseline_commit:oid,snapshot_tree:tree}}));
  await execute("build-spec",async(ctx)=>{ctx.artifacts.writeAtomic("spec.md","spec\n");const checkpoint=ctx.createCheckpoint("build-spec");return{facts:{spec_ref:"specs/demo-task/spec.md",checkpoint}};});
  await execute("build-plan",async(ctx)=>{ctx.artifacts.writeAtomic("plan.md","plan\n");ctx.artifacts.writeAtomic("tasks.md","tasks\n");const checkpoint=ctx.createCheckpoint("build-plan");return{facts:{plan_ref:"specs/demo-task/plan.md",tasks_ref:"specs/demo-task/tasks.md",checkpoint}};});
  await execute("build-code",async(ctx)=>{const live=captureTaskSnapshotV1Sync({taskId,workspaceRoot:ctx.workspace.worktreeRoot,baselineCommit:ctx.workspace.baselineCommit}).tree_oid;return{facts:{changed:[],tests:testFacts("build",live),review:reviewFacts("build-code",live),phase_completion:true}};});
  await execute("verify-code",async(ctx)=>{const live=captureTaskSnapshotV1Sync({taskId,workspaceRoot:ctx.workspace.worktreeRoot,baselineCommit:ctx.workspace.baselineCommit}).tree_oid;return{facts:{tests:testFacts("verify",live),review:reviewFacts("verify-code",live),evidence_refs:[]}};});
  if(reverseLast){const acceptedRef="results/verify-code/accepted.json";const accepted=JSON.parse(task.readRecord(acceptedRef));const attemptRef=accepted.attempt_ref;const attempt=JSON.parse(task.readRecord(attemptRef));attempt.created_at="2000-01-01T00:00:00.000Z";const raw=`${JSON.stringify(attempt)}\n`;writeFileSync(join(task.taskPath,attemptRef),raw);accepted.attempt_hash=createHash("sha256").update(raw).digest("hex");writeFileSync(join(task.taskPath,acceptedRef),`${JSON.stringify(accepted)}\n`);}
  if (tamper) writeFileSync(join(task.taskPath,"results/build-code/attempt-0001.json"), "{}\n");
  return { taskPath, projectName, taskId };
}

function run(item) {
  return spawnSync(process.execPath, [script, `--task-path=${item.taskPath}`, `--project=${item.projectName}`, `--task=${item.taskId}`], { encoding: "utf8" });
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("ci-chain-check task-v1", () => {
  it("accepts one complete integrity-verified accepted chain", async () => {
    const result = run(await fixture());
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("accepted stage chain");
  });

  it("fails when an accepted attempt hash is stale", async () => {
    const result = run(await fixture({ tamper: true }));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/integrity hash mismatch/i);
  });

  it("fails when accepted stage chronology goes backwards", async () => {
    const result = run(await fixture({ reverseLast: true }));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/predates/i);
  });
});
