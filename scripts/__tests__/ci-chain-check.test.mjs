import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { hashAuditSummary } from "../../core/audit-summary-carrier.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { captureWorkspaceSnapshot } from "../../core/canonical-receipt-writer.mjs";
import { createTask } from "../../core/task-handle.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { bootstrapStage } from "../../core/stage-context.mjs";
import { acceptStageAttempt, runStage } from "../../core/stage-runner.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { requiresHumanConfirmation } from "../../core/stage-acceptance-policy.mjs";

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
  const oid=execFileSync("git",["rev-parse","HEAD"],{cwd:repo,encoding:"utf8"}).trim();
  const tree=execFileSync("git",["rev-parse","HEAD^{tree}"],{cwd:repo,encoding:"utf8"}).trim(), hash="a".repeat(64);
  const acceptanceCoverage={snapshot_tree:tree,accepted_criterion_ids:["AC-1"],items:[{acceptance_criterion_id:"AC-1",status:"unknown",evidence_refs:[]}]};
  const testFacts=(prefix)=>({command:"npm test",exit_code:0,command_hash:hash,snapshot_head:oid,snapshot_tree:tree,snapshot_commit:oid,started_at:"2026-07-16T00:00:00.000Z",completed_at:"2026-07-16T00:00:01.000Z",receipt_ref:`evidence/${prefix}-receipt.json`,receipt_hash:hash,output_ref:`evidence/${prefix}-output.txt`,output_hash:hash});
  const reviewFacts=(stage)=>({verdict:"pass",result_ref:`reviews/results/${stage}.json`,result_hash:hash,snapshot_tree:tree});
  const task = createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: projectName, task_id: taskId,
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs: {},
  } });
  const contextFor=(stage)=>bootstrapStage(stage,{
    mode:"sidecar",taskPath,projectName,taskId,
    ...(stage==="make-decision"?{workspaceLifecycle:"prepare"}:{}),
  });
  const execute=async(stage,handler)=>{
    const context=contextFor(stage);
    context.kernel.startStageRun(stage,{reason:`${stage} ci-chain fixture`});
    const attempt=await runStage(stage,context,async(ctx)=>{
      const result=await handler(ctx);
      const active=context.kernel.activeStageRun(stage);
      if(stage==="make-decision"){
        const decisionLog="# Decision\n\nProceed.\n";
        ArtifactDir.open(ctx.candidateWorkspace.worktreeRoot, task).writeAtomic("decision-log.md",decisionLog);
        const decisionHash=createHash("sha256").update(decisionLog).digest("hex");
        const decisionRef=`receipts/decision-log/${decisionHash}.md`;
        context.kernel.publishCanonicalRecord(decisionRef,decisionLog);
        result.facts={...result.facts,snapshot_tree:ctx.candidateWorkspace.captureSnapshot().tree,decision_ref:decisionRef,decision_hash:decisionHash};
      }
      const snapshotTree=ctx.candidateWorkspace
        ? ctx.candidateWorkspace.captureSnapshot().tree
        : captureWorkspaceSnapshot(ctx.workspace).tree;
      const kind=`${stage}.ci-chain-fixture`;
      const content={
        schema_version:"stage-content-evidence.v1",kind,task_id:task.identity.taskId,
        stage,workflow_run_id:active.run.workflow_run_id,snapshot_tree:snapshotTree,
      };
      const contentRaw=`${JSON.stringify(content,null,2)}\n`;
      const contentHash=createHash("sha256").update(contentRaw).digest("hex");
      const contentRef=`evidence/stage-content/${contentHash}/${stage}-ci-chain-fixture.json`;
      context.kernel.publishCanonicalRecord(contentRef,contentRaw);
      const contentEvidenceRefs=[{kind,ref:contentRef,hash:contentHash}];
      const unsignedSummary={
        schema_version:"stage-audit-summary.v1",task_id:task.identity.taskId,stage_slug:stage,
        workflow_run_id:active.run.workflow_run_id,snapshot_tree:snapshotTree,
        verdict:"pass",content_evidence_refs:contentEvidenceRefs,
      };
      const summaryHash=hashAuditSummary(unsignedSummary);
      const summaryRef=`evidence/audits/${stage}/${summaryHash}.json`;
      context.kernel.publishCanonicalRecord(summaryRef,`${JSON.stringify({...unsignedSummary,summary_hash:summaryHash},null,2)}\n`);
      return{...result,facts:{
        ...result.facts,audit_contract_version:"v1",audit_summary_ref:summaryRef,
        audit_summary_hash:summaryHash,audit_verdict:"pass",content_evidence_refs:contentEvidenceRefs,
      }};
    });
    const request={attemptRef:attempt.attempt_ref};
    if(requiresHumanConfirmation(stage))request.humanConfirmationRef=writeHumanConfirmation(context.kernel,stage,attempt);
    acceptStageAttempt(stage,context,request);
  };
  await execute("make-decision",async(ctx)=>({facts:{
    worktree_root:ctx.candidateWorkspace.worktreeRoot,
    baseline_commit:ctx.candidateWorkspace.baselineCommit,
  }}));
  await execute("build-spec",async(ctx)=>{ctx.artifacts.writeAtomic("spec.md","spec\n");const checkpoint=ctx.createCheckpoint("build-spec");return{facts:{spec_ref:"specs/demo-task/spec.md",checkpoint}};});
  await execute("build-plan",async(ctx)=>{ctx.artifacts.writeAtomic("plan.md","plan\n");ctx.artifacts.writeAtomic("tasks.md","tasks\n");const checkpoint=ctx.createCheckpoint("build-plan");return{facts:{plan_ref:"specs/demo-task/plan.md",tasks_ref:"specs/demo-task/tasks.md",checkpoint}};});
  await execute("build-code",async()=>({facts:{
    changed:[],tests:testFacts("build"),review:reviewFacts("build-code"),
    phase_completion:{
      status:"completed",evidence_ref:"evidence/ci-chain-phase.json",evidence_hash:hash,
      integration_review:{ref:"reviews/results/build-code.json",sha256:hash},
      formal_record_status:{status:"unavailable",reason:"ci-chain fixture has no Phase history"},
    },
    acceptance_coverage:acceptanceCoverage,
  }}));
  await execute("verify-code",async()=>({facts:{tests:testFacts("verify"),review:reviewFacts("verify-code"),evidence_refs:[]}}));
  if(reverseLast){const acceptedRef="results/verify-code/accepted.json";const accepted=JSON.parse(task.readRecord(acceptedRef));const attemptRef=`results/verify-code/${accepted.attempt_ref}`;const attempt=JSON.parse(task.readRecord(attemptRef));attempt.created_at="2000-01-01T00:00:00.000Z";const raw=`${JSON.stringify(attempt)}\n`;writeFileSync(join(task.taskPath,attemptRef),raw);accepted.integrity_hash=createHash("sha256").update(raw).digest("hex");writeFileSync(join(task.taskPath,acceptedRef),`${JSON.stringify(accepted)}\n`);}
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
