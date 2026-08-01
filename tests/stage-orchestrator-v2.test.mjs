import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../core/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";
import { requiresHumanConfirmation } from "../runtime/stage/stage-acceptance-policy.mjs";
import { hashAuditSummary } from "../runtime/evidence/audit-summary-carrier.mjs";

const temporary = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runner-"))); temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "repo-chain-task"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo }); execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo }); execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  const oid = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(); execFileSync("git", ["worktree", "add", "-q", "-b", "task/Demo/chain-task", worktree, oid], { cwd: repo });
  const taskPath = join(root, "Projects", "Demo", "tasks", "chain-task");
  // Deliberately omit record_model: these tests cover the historical attempt
  // orchestrator and its fail-loud boundaries, not vNext single-write records.
  const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "chain-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  return { root, repo, task, taskPath, worktree, oid };
}
function publishFailure(kernel, evidenceRef, acceptanceCriterionId) {
  const detailRef = evidenceRef.replace(/\.json$/, ".txt"), detail = `${acceptanceCriterionId} failed\n`;
  kernel.publishCanonicalRecord(detailRef, detail);
  const raw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: acceptanceCriterionId, result: "fail", refs: [{ ref: detailRef, sha256: createHash("sha256").update(detail).digest("hex") }] }, null, 2)}\n`;
  kernel.publishCanonicalRecord(evidenceRef, raw);
  return { raw, hash: createHash("sha256").update(raw).digest("hex") };
}
function acceptanceCoverage(snapshotTree) {
  return { snapshot_tree: snapshotTree, accepted_criterion_ids: ["AC-1"], items: [{ acceptance_criterion_id: "AC-1", status: "unknown", evidence_refs: [] }] };
}
async function runStage(stage, context, handler, publication) {
  if (stage === "build-spec" && context.kernel.activeStageRun(stage, { required: false }) === null) {
    context.kernel.startStageRun(stage, { reason: "legacy stage orchestrator fixture publication" });
  }
  const runtimeContext = stage === "build-spec"
    ? (await import("../core/stage-context.mjs")).bootstrapStage(stage, {
        mode: "sidecar",
        taskPath: context.task.taskPath,
        projectName: context.identity.projectName,
        taskId: context.identity.taskId,
      })
    : context;
  const wrapped = async (...args) => {
    const result = await handler(...args);
    if (stage !== "make-decision") {
      let facts = result.facts;
      if (stage === "build-code" && typeof facts?.phase_completion === "boolean") {
        const activeWorkspace = args[0].candidateWorkspace ?? args[0].workspace;
        const tasksRef = `specs/${context.identity.taskId}/tasks.md`;
        const tasksRaw = readFileSync(join(activeWorkspace.worktreeRoot, tasksRef), "utf8");
        facts = {
          ...facts,
          phase_completion: {
            status: facts.phase_completion ? "completed" : "incomplete",
            evidence_ref: tasksRef,
            evidence_hash: createHash("sha256").update(tasksRaw).digest("hex"),
            integration_review: {
              ref: facts.review.result_ref,
              sha256: facts.review.result_hash,
            },
            formal_record_status: { status: "unavailable", reason: "legacy fixture has no Phase history" },
          },
        };
      }
      if (stage === "verify-code") {
        const activeWorkspace = args[0].candidateWorkspace ?? args[0].workspace;
        const snapshot = captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
        const content = {
          schema_version: "stage-content-evidence.v1",
          kind: "verify-code.fixture",
          task_id: context.identity.taskId,
          stage,
          workflow_run_id: context.workflowRunId,
          snapshot_tree: snapshot.tree,
        };
        const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
        const contentHash = createHash("sha256").update(contentRaw).digest("hex");
        const contentRef = `evidence/stage-content/${contentHash}/verify-code-fixture.json`;
        try {
      runtimeContext.kernel.publishCanonicalRecord(contentRef, contentRaw);
        } catch (error) {
          if (error?.code !== "EEXIST" || runtimeContext.task.readRecord(contentRef) !== contentRaw) throw error;
        }
        const contentEvidenceRefs = [{ kind: content.kind, ref: contentRef, hash: contentHash }];
        const unsigned = {
          schema_version: "stage-audit-summary.v1",
          task_id: context.identity.taskId,
          stage_slug: stage,
          workflow_run_id: runtimeContext.workflowRunId,
          snapshot_tree: snapshot.tree,
          verdict: "pass",
          content_evidence_refs: contentEvidenceRefs,
        };
        const auditHash = hashAuditSummary(unsigned);
        const auditRef = `evidence/audits/${stage}/${auditHash}.json`;
        const auditRaw = `${JSON.stringify({ ...unsigned, summary_hash: auditHash }, null, 2)}\n`;
        try {
          runtimeContext.kernel.publishCanonicalRecord(auditRef, auditRaw);
        } catch (error) {
          if (error?.code !== "EEXIST" || runtimeContext.task.readRecord(auditRef) !== auditRaw) throw error;
        }
        facts = {
          ...facts,
          audit_contract_version: "v1",
          audit_summary_ref: auditRef,
          audit_summary_hash: auditHash,
          audit_verdict: "pass",
          content_evidence_refs: contentEvidenceRefs,
        };
        return { ...result, facts };
      }
      return { ...result, facts, missing_items: [...new Set([...(result.missing_items ?? []), "support:audit"])] };
    }
    const decisionRaw = "# Stage runner fixture decision\n";
    const decisionHash = createHash("sha256").update(decisionRaw).digest("hex");
    const decisionRef = `receipts/decision-log/${decisionHash}.md`;
    try {
      runtimeContext.kernel.publishCanonicalRecord(decisionRef, decisionRaw);
    } catch (error) {
      if (error?.code !== "EEXIST" || runtimeContext.task.readRecord(decisionRef) !== decisionRaw) throw error;
    }
    const activeWorkspace = args[0].candidateWorkspace ?? args[0].workspace;
    const worktreeRoot = activeWorkspace?.worktreeRoot ?? result.facts?.worktree_root;
    const artifactRoot = join(worktreeRoot, "specs", runtimeContext.identity.taskId);
    mkdirSync(artifactRoot, { recursive: true });
    writeFileSync(join(artifactRoot, "decision-log.md"), decisionRaw);
    return {
      ...result,
      facts: {
        ...result.facts,
        snapshot_tree: captureGitWorktreeSnapshot(worktreeRoot).tree,
        decision_ref: decisionRef,
        decision_hash: decisionHash,
      },
      missing_items: [...new Set([...(result.missing_items ?? []), "support:audit"])],
    };
  };
  const runtime = await import("../core/stage-runner.mjs");
  return runtime.runStage(stage, runtimeContext, wrapped, publication);
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });
describe("stage-runner capability unit", () => {
  it("fails closed when task manifest changes between bootstrap and publish", async()=>{
    const {task,taskPath,worktree,oid}=fixture();const {bootstrapStage}=await import("../core/stage-context.mjs");const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"});
    writeFileSync(join(task.taskPath,"task.json"),JSON.stringify({...task.manifest,project_name:"Forged"}));
    await expect(runStage("make-decision",context,async()=>({facts:{worktree_root:worktree,baseline_commit:oid}}))).rejects.toThrow(/manifest|identity|changed|tamper/i);
    expect(()=>task.readRecord("results/make-decision/attempt-0001.json")).toThrow();
  });
  it("gives handlers a least-authority worker context without task, kernel, or accept", async () => {
    const {taskPath,worktree,oid}=fixture();const {bootstrapStage}=await import("../core/stage-context.mjs");const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"});
    await runStage("make-decision",context,async(worker)=>{expect(worker).not.toHaveProperty("task");expect(worker).not.toHaveProperty("kernel");expect(worker).not.toHaveProperty("accept");return{facts:{worktree_root:worktree,baseline_commit:oid}};});
  });
  it("keeps a cross-task decision read-only while the consumer owns its Workspace", async () => {
    const { root, task, taskPath, worktree, oid }=fixture(); const { acceptStageAttempt }=await import("../core/stage-runner.mjs"); const { bootstrapStage,prepareMakeDecisionWorkspace }=await import("../core/stage-context.mjs");
    const sourceContext=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"}); const decision=await runStage("make-decision",sourceContext,async()=>({facts:{worktree_root:worktree,baseline_commit:oid}})); acceptStageAttempt("make-decision",sourceContext,{attemptRef:decision.attempt_ref,humanConfirmationRef:writeHumanConfirmation(sourceContext.kernel,"make-decision",decision)});
    const consumerPath=join(root,"Projects","Demo","tasks","ZHI-138"); createTask({storageRoot:root,taskPath:consumerPath,manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:"ZHI-138",created_at:new Date().toISOString(),target_repo_root:task.manifest.target_repo_root,issue_ids:["ZHI-138"],inputs:{decision:join(task.taskPath,"results","make-decision","accepted.json")}}});
    expect(()=>bootstrapStage("build-spec",{mode:"sidecar",taskPath:consumerPath,projectName:"Demo",taskId:"ZHI-138"})).toThrow(/current task.*accepted make-decision|ENOENT/i);
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
    const { taskPath, worktree, oid }=fixture(); const { acceptStageAttempt }=await import("../core/stage-runner.mjs"); const { bootstrapStage }=await import("../core/stage-context.mjs");
    const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"}); const attempt=await runStage("make-decision",context,async()=>({facts:{worktree_root:worktree,baseline_commit:oid}}));
    expect(()=>acceptStageAttempt("make-decision",context,{attemptRef:attempt.attempt_ref,humanConfirmationRef:"human:yes",checkpoint:{forged:true}})).toThrow(/checkpoint override|forbidden/i);
  });
  it("rejects handler output that fails the canonical runtime result schema", async () => {
    const { taskPath, worktree, oid } = fixture(); const { bootstrapStage } = await import("../core/stage-context.mjs");
    const context=bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"});
    await expect(runStage("make-decision",context,async()=>({schema_version:"forged.v0",facts:{worktree_root:worktree,baseline_commit:oid}}))).rejects.toThrow(/schema_version|stage-result|runtime schema/i);
  });
  it("bootstraps, reads accepted upstream, invokes handlers, publishes and accepts a real v2 chain", async () => {
    const { task, taskPath, worktree, oid } = fixture();
    const { acceptStageAttempt } = await import("../core/stage-runner.mjs");
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
    await execute("build-code", async (context, upstream) => { seen.push([context.stage, upstream.attempt.stage]); return { facts: { changed: [], tests: testFacts("build"), review: reviewFacts("build-code"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } }; });
    await execute("verify-code", async (context, upstream) => { seen.push([context.stage, upstream.attempt.stage]); return { facts: { tests: testFacts("verify"), review: reviewFacts("verify-code"), evidence_refs: [] } }; });
    const verifyContext = contextFor("verify-code");
    expect(() => verifyContext.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: "evidence/missing-failure.json" })).toThrow(/ENOENT|no such/i);
    expect(() => task.readRecord("results/verify-code/attempt-0002.json")).toThrow();
    expect(() => verifyContext.kernel.publishAttempt("verify-code", { verify_failure_publication: {} })).toThrow(/official kernel entrypoint/i);
    expect(() => verifyContext.kernel.publishAttempt("verify-code", { verify_passing_publication: {} })).toThrow(/official kernel entrypoint/i);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "workspace drift"], { cwd: worktree });
    const driftHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: worktree, encoding: "utf8" }).trim();
    const driftTree = captureGitWorktreeSnapshot(worktree).tree;
    const emptyFailureRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "EMPTY", result: "fail", refs: [] }, null, 2)}\n`;
    verifyContext.kernel.publishCanonicalRecord("evidence/empty-failure.json", emptyFailureRaw);
    expect(() => verifyContext.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: "evidence/empty-failure.json" })).toThrow(/refs must be a non-empty array/i);
    const { raw: failureRaw } = publishFailure(verifyContext.kernel, "evidence/workspace-lineage-failure.json", "WORKSPACE-LINEAGE");
    const controlledFailure = verifyContext.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: "evidence/workspace-lineage-failure.json" });
    expect(controlledFailure).toMatchObject({ attempt_ref: "attempt-0002.json" });
    expect(controlledFailure.attempt).toMatchObject({
      upstream_refs: [{ task_id: "chain-task", stage: "build-code", accepted_ref: "results/build-code/accepted.json" }],
      verify_failure_publication: { previous_accepted_ref: "results/verify-code/accepted.json", active_build_accepted_ref: "results/build-code/accepted.json", workspace_head: driftHead, workspace_tree: driftTree, failure_evidence_ref: "evidence/workspace-lineage-failure.json" },
    });
    expect(() => verifyContext.kernel.publishVerifyFailureFromAccepted({ failureEvidenceRef: "evidence/workspace-lineage-failure.json" })).toThrow(/already exists/i);
    expect(seen).toEqual([["make-decision", null], ["build-spec", "make-decision"], ["build-plan", "build-spec"], ["build-code", "build-plan"], ["verify-code", "build-code"]]);
    for (const stage of ["make-decision","build-spec","build-plan","build-code","verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "task-accepted.v2", stage });
    }
  });

  it("reopens build-code only from authenticated verify failure evidence and preserves both accepted records", async () => {
    const { task, taskPath, worktree, oid } = fixture();
    const { acceptStageAttempt } = await import("../core/stage-runner.mjs");
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const hash = "a".repeat(64), tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: worktree, encoding: "utf8" }).trim();
    const tests = (label) => ({ command: "npm test", exit_code: 0, command_hash: hash, snapshot_head: oid, snapshot_tree: tree, snapshot_commit: "b".repeat(40), started_at: "2026-07-16T00:00:00.000Z", completed_at: "2026-07-16T00:00:01.000Z", receipt_ref: `evidence/${label}-receipt.json`, receipt_hash: hash, output_ref: `evidence/${label}-output.txt`, output_hash: hash });
    const review = (verdict) => ({ verdict, result_ref: "reviews/results/review.json", result_hash: hash, snapshot_tree: tree });
    const context = (stage) => bootstrapStage(stage, { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });
    const execute = async (stage, handler, publication) => {
      const stageContext = context(stage), result = await runStage(stage, stageContext, handler, publication);
      const request = { attemptRef: result.attempt_ref };
      if (requiresHumanConfirmation(stage)) request.humanConfirmationRef = writeHumanConfirmation(stageContext.kernel, stage, result);
      acceptStageAttempt(stage, stageContext, request);
      return result;
    };
    await execute("make-decision", async () => ({ facts: { worktree_root: worktree, baseline_commit: oid } }));
    await execute("build-spec", async (worker) => { worker.artifacts.writeAtomic("spec.md", "spec\n"); const checkpoint = worker.createCheckpoint("build-spec"); return { facts: { spec_ref: "specs/chain-task/spec.md", checkpoint } }; });
    await execute("build-plan", async (worker) => { worker.artifacts.writeAtomic("plan.md", "plan\n"); worker.artifacts.writeAtomic("tasks.md", "tasks\n"); const checkpoint = worker.createCheckpoint("build-plan"); return { facts: { plan_ref: "specs/chain-task/plan.md", tasks_ref: "specs/chain-task/tasks.md", checkpoint } }; });
    await execute("build-code", async () => ({ facts: { changed: [], tests: tests("build-one"), review: review("pass"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } }));
    const firstCanonicalRaw = task.readRecord("results/build-code/accepted.json");
    const verifyContext = context("verify-code");
    const passDetail = "acceptance criterion passed\n";
    verifyContext.kernel.publishCanonicalRecord("evidence/acceptance-ac-004.txt", passDetail);
    const passRaw = JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-004", result: "pass", refs: [{ ref: "evidence/acceptance-ac-004.txt", sha256: (await import("node:crypto")).createHash("sha256").update(passDetail).digest("hex") }] }, null, 2) + "\n";
    verifyContext.kernel.publishCanonicalRecord("evidence/acceptance-ac-004.json", passRaw);
    const passHash = (await import("node:crypto")).createHash("sha256").update(passRaw).digest("hex");
    const nonFailure = await runStage("verify-code", verifyContext, async () => ({ facts: { tests: tests("verify-pass"), review: review("pass"), evidence_refs: [{ ref: "evidence/acceptance-ac-004.json", sha256: passHash }] } }));
    expect(() => verifyContext.kernel.reopenBuildCode({ verifyAttemptRef: nonFailure.attempt_ref, failureEvidenceRef: "evidence/acceptance-ac-004.json" })).toThrow(/result=fail/i);
    expect(task.readRecord("results/build-code/accepted.json")).toBe(firstCanonicalRaw);
    const { raw: failureRaw, hash: failureHash } = publishFailure(verifyContext.kernel, "evidence/acceptance-ac-005.json", "AC-005");
    const failedVerify = await runStage("verify-code", verifyContext, async () => ({ facts: { tests: tests("verify-one"), review: review("fail"), evidence_refs: [{ ref: "evidence/acceptance-ac-005.json", sha256: failureHash }] } }));
    const reopen = verifyContext.kernel.reopenBuildCode({ verifyAttemptRef: failedVerify.attempt_ref, failureEvidenceRef: "evidence/acceptance-ac-005.json" });
    expect(() => verifyContext.kernel.reopenBuildCode({ verifyAttemptRef: failedVerify.attempt_ref, failureEvidenceRef: "evidence/acceptance-ac-005.json" })).toThrow(/reopen already exists/i);
    const revisionIdentity = verifyContext.kernel.deriveReviewFlowIdentity({
      stage: "build-code", review_track: null, subject_kind: "worktree",
      phase_id: null, review_scope: "integration", revision_ref: reopen.reopen_ref,
    });
    expect(revisionIdentity.workflow_run_id).toContain(`:reopen:${reopen.reopen_hash}`);
    expect(() => verifyContext.kernel.deriveReviewFlowIdentity({
      stage: "build-spec", review_track: null, subject_kind: "worktree",
      phase_id: null, review_scope: null, revision_ref: reopen.reopen_ref,
    })).toThrow(/only valid.*build-code reopen/i);
    const revisedContext = context("build-code");
    const revisedHandler = async () => ({ facts: { changed: [], tests: tests("build-two"), review: review("pass"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } });
    const revised = await runStage("build-code", revisedContext, revisedHandler, { reopenProvenance: reopen });
    await expect(runStage("build-code", revisedContext, revisedHandler, { reopenProvenance: reopen })).rejects.toThrow(/already published as attempt-0002.*resume and accept/i);
    acceptStageAttempt("build-code", revisedContext, { attemptRef: revised.attempt_ref });
    const canonical = JSON.parse(task.readRecord("results/build-code/accepted.json"));
    expect(canonical).toMatchObject({ attempt_ref: revised.attempt_ref });
    expect(task.readRecord("results/build-code/accepted-attempt-0001.json")).toBe(firstCanonicalRaw);
    expect(canonical.integrity_hash).toBe(revised.integrity_hash);
    expect(JSON.parse(task.readRecord(`results/build-code/${revised.attempt_ref}`))).toMatchObject({ reopen_provenance: { reopen_ref: reopen.reopen_ref, verify_failure_ref: `results/verify-code/${failedVerify.attempt_ref}` } });
    expect(context("verify-code").kernel.readAccepted("build-code")).toMatchObject({ accepted_ref: "results/build-code/accepted.json", accepted: { attempt_ref: revised.attempt_ref } });
    expect(() => verifyContext.kernel.buildCodeReopenProvenance(reopen.reopen_ref)).toThrow(/not authorized|active accepted/i);
    const legacyFailure = structuredClone(failedVerify.attempt);
    legacyFailure.attempt_id = "verify-code:attempt-0003";
    delete legacyFailure.upstream_acceptances;
    writeFileSync(join(task.taskPath, "results", "verify-code", "attempt-0003.json"), `${JSON.stringify(legacyFailure, null, 2)}\n`);
    expect(() => context("verify-code").kernel.reopenBuildCode({ verifyAttemptRef: "attempt-0003.json", failureEvidenceRef: "evidence/acceptance-ac-005.json" })).toThrow(/legacy verify-code failure without upstream acceptance.*revised build-code/i);
  });

  it("ignores legacy build-code fact shape while publishing a repaired attempt", async () => {
    const { task, taskPath, worktree, oid } = fixture();
    const { acceptStageAttempt } = await import("../core/stage-runner.mjs");
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const hash = "b".repeat(64), tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: worktree, encoding: "utf8" }).trim();
    const tests = (label) => ({ command: "npm test", exit_code: 0, command_hash: hash, snapshot_head: oid, snapshot_tree: tree, snapshot_commit: "c".repeat(40), started_at: "2026-07-16T00:00:00.000Z", completed_at: "2026-07-16T00:00:01.000Z", receipt_ref: `evidence/${label}-receipt.json`, receipt_hash: hash, output_ref: `evidence/${label}-output.txt`, output_hash: hash });
    const review = (verdict) => ({ verdict, result_ref: "reviews/results/review.json", result_hash: hash, snapshot_tree: tree });
    const context = (stage) => bootstrapStage(stage, { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });
    const accept = (stage, stageContext, result) => {
      const request = { attemptRef: result.attempt_ref };
      if (requiresHumanConfirmation(stage)) request.humanConfirmationRef = writeHumanConfirmation(stageContext.kernel, stage, result);
      acceptStageAttempt(stage, stageContext, request);
    };
    const decision = context("make-decision");
    const decisionAttempt = await runStage("make-decision", decision, async () => ({ facts: { worktree_root: worktree, baseline_commit: oid } }));
    accept("make-decision", decision, decisionAttempt);
    const spec = context("build-spec");
    spec.artifacts.writeAtomic("spec.md", "spec\n");
    const specAttempt = await runStage("build-spec", spec, async (worker) => ({ facts: { spec_ref: "specs/chain-task/spec.md", checkpoint: worker.createCheckpoint("build-spec") } }));
    accept("build-spec", spec, specAttempt);
    const plan = context("build-plan");
    plan.artifacts.writeAtomic("plan.md", "plan\n"); plan.artifacts.writeAtomic("tasks.md", "tasks\n");
    const planAttempt = await runStage("build-plan", plan, async (worker) => ({ facts: { plan_ref: "specs/chain-task/plan.md", tasks_ref: "specs/chain-task/tasks.md", checkpoint: worker.createCheckpoint("build-plan") } }));
    accept("build-plan", plan, planAttempt);
    const build = context("build-code");
    const buildAttempt = await runStage("build-code", build, async () => ({ facts: { changed: [], tests: tests("build-one"), review: review("pass"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } }));
    accept("build-code", build, buildAttempt);

    const acceptedRef = task.recordPath("results/build-code/accepted.json");
    const accepted = JSON.parse(task.readRecord("results/build-code/accepted.json"));
    const legacyAttempt = JSON.parse(task.readRecord(`results/build-code/${accepted.attempt_ref}`));
    delete legacyAttempt.facts.acceptance_coverage;
    const legacyRaw = `${JSON.stringify(legacyAttempt, null, 2)}\n`;
    writeFileSync(task.recordPath(`results/build-code/${accepted.attempt_ref}`), legacyRaw);
    accepted.integrity_hash = `sha256:${createHash("sha256").update(legacyRaw).digest("hex")}`;
    writeFileSync(acceptedRef, `${JSON.stringify(accepted, null, 2)}\n`);

    const verify = context("verify-code");
    const { raw: failureRaw, hash: failureHash } = publishFailure(verify.kernel, "evidence/legacy-build-failure.json", "AC-LEGACY");
    const failed = await runStage("verify-code", verify, async () => ({ facts: { tests: tests("verify-one"), review: review("fail"), evidence_refs: [{ ref: "evidence/legacy-build-failure.json", sha256: failureHash }] } }));
    const reopen = verify.kernel.reopenBuildCode({ verifyAttemptRef: failed.attempt_ref, failureEvidenceRef: "evidence/legacy-build-failure.json" });
    expect(failureRaw).toContain("AC-LEGACY");
    const revised = await runStage("build-code", context("build-code"), async () => ({ facts: { changed: [], tests: tests("build-two"), review: review("pass"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } }), { reopenProvenance: reopen });
    expect(revised.attempt.reopen_provenance.reopen_ref).toBe(reopen.reopen_ref);
  });

  it("preserves canonical bytes in a collision-safe archive without rewriting a legacy archive", async () => {
    const setup = async () => {
      const { task, taskPath, worktree, oid } = fixture();
      const { acceptStageAttempt } = await import("../core/stage-runner.mjs");
      const { bootstrapStage } = await import("../core/stage-context.mjs");
      const hash = "a".repeat(64), tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: worktree, encoding: "utf8" }).trim();
      const tests = (label) => ({ command: "npm test", exit_code: 0, command_hash: hash, snapshot_head: oid, snapshot_tree: tree, snapshot_commit: "b".repeat(40), started_at: "2026-07-16T00:00:00.000Z", completed_at: "2026-07-16T00:00:01.000Z", receipt_ref: `evidence/${label}-receipt.json`, receipt_hash: hash, output_ref: `evidence/${label}-output.txt`, output_hash: hash });
      const review = (verdict) => ({ verdict, result_ref: "reviews/results/review.json", result_hash: hash, snapshot_tree: tree });
      const context = (stage) => bootstrapStage(stage, { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });
      const accept = (stage, stageContext, result) => {
        const request = { attemptRef: result.attempt_ref };
        if (requiresHumanConfirmation(stage)) request.humanConfirmationRef = writeHumanConfirmation(stageContext.kernel, stage, result);
        return acceptStageAttempt(stage, stageContext, request);
      };
      const publish = async (stage, handler, publication) => {
        const stageContext = context(stage), result = await runStage(stage, stageContext, handler, publication);
        accept(stage, stageContext, result);
        return result;
      };
      await publish("make-decision", async () => ({ facts: { worktree_root: worktree, baseline_commit: oid } }));
      await publish("build-spec", async (worker) => { worker.artifacts.writeAtomic("spec.md", "spec\n"); return { facts: { spec_ref: "specs/chain-task/spec.md", checkpoint: worker.createCheckpoint("build-spec") } }; });
      await publish("build-plan", async (worker) => { worker.artifacts.writeAtomic("plan.md", "plan\n"); worker.artifacts.writeAtomic("tasks.md", "tasks\n"); return { facts: { plan_ref: "specs/chain-task/plan.md", tasks_ref: "specs/chain-task/tasks.md", checkpoint: worker.createCheckpoint("build-plan") } }; });
      await publish("build-code", async () => ({ facts: { changed: [], tests: tests("build-one"), review: review("pass"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } }));
      const verifyContext = context("verify-code"), { raw: failureRaw } = publishFailure(verifyContext.kernel, "evidence/acceptance-ac-005.json", "AC-005");
      const failedVerify = await runStage("verify-code", verifyContext, async () => ({ facts: { tests: tests("verify-one"), review: review("fail"), evidence_refs: [{ ref: "evidence/acceptance-ac-005.json", sha256: createHash("sha256").update(failureRaw).digest("hex") }] } }));
      const reopen = verifyContext.kernel.reopenBuildCode({ verifyAttemptRef: failedVerify.attempt_ref, failureEvidenceRef: "evidence/acceptance-ac-005.json" });
      const revisedContext = context("build-code"), revised = await runStage("build-code", revisedContext, async () => ({ facts: { changed: [], tests: tests("build-two"), review: review("pass"), phase_completion: true, acceptance_coverage: acceptanceCoverage(tree) } }), { reopenProvenance: reopen });
      return { task, revisedContext, revised, accept };
    };
    const { task, revisedContext, revised, accept } = await setup();
    const canonicalRef = "results/build-code/accepted.json", archiveRef = "results/build-code/accepted-attempt-0001.json";
    const canonicalBefore = task.readRecord(canonicalRef), legacy = { ...JSON.parse(canonicalBefore), accepted_at: "2026-07-18T05:07:06.447Z" };
    const legacyRaw = `${JSON.stringify(legacy, null, 2)}\n`;
    writeFileSync(task.recordPath(archiveRef), legacyRaw);
    const collisionArchiveRef = `results/build-code/accepted-attempt-0001-canonical-${createHash("sha256").update(canonicalBefore).digest("hex")}.json`;
    expect(legacy).toMatchObject({ attempt_ref: "attempt-0001.json", integrity_hash: JSON.parse(canonicalBefore).integrity_hash });
    expect(legacy.accepted_at).not.toBe(JSON.parse(canonicalBefore).accepted_at);
    accept("build-code", revisedContext, revised);
    expect(JSON.parse(task.readRecord(canonicalRef))).toMatchObject({ attempt_ref: revised.attempt_ref });
    expect(task.readRecord(archiveRef)).toBe(legacyRaw);
    expect(task.readRecord(collisionArchiveRef)).toBe(canonicalBefore);
    expect(() => task.createRecordAtomic("results/build-code/not-an-archive.json", "forged\n")).toThrow(/kernel-owned/i);
    const failed = await setup(), failedCanonical = failed.task.readRecord(canonicalRef);
    const failedLegacyRaw = `${JSON.stringify({ ...JSON.parse(failedCanonical), accepted_at: "2026-07-18T05:07:06.447Z" }, null, 2)}\n`;
    const failedCollisionRef = `results/build-code/accepted-attempt-0001-canonical-${createHash("sha256").update(failedCanonical).digest("hex")}.json`;
    writeFileSync(failed.task.recordPath(archiveRef), failedLegacyRaw);
    writeFileSync(failed.task.recordPath(failedCollisionRef), "conflicting collision archive\n");
    expect(() => failed.accept("build-code", failed.revisedContext, failed.revised)).toThrow(/collision archive conflicts/i);
    expect(failed.task.readRecord(canonicalRef)).toBe(failedCanonical);
    expect(failed.task.readRecord(archiveRef)).toBe(failedLegacyRaw);
    expect(failed.task.readRecord(failedCollisionRef)).toBe("conflicting collision archive\n");
  });

  it("can publish without accepting when the caller omits human confirmation", async () => {
    const { task, taskPath, worktree, oid } = fixture(); const { bootstrapStage } = await import("../core/stage-context.mjs");
    const result = await runStage("make-decision", bootstrapStage("make-decision",{mode:"sidecar",taskPath,projectName:"Demo",taskId:"chain-task"}), async()=>({facts:{worktree_root:worktree,baseline_commit:oid}}));
    expect(task.readRecord(`results/make-decision/${result.attempt_ref}`)).toContain("task-attempt.v2");
    expect(() => task.readRecord("results/make-decision/accepted.json")).toThrow(/ENOENT|no such/i);
  });

  it("recovers an automatic build-spec attempt with the explicit accept API after publish interruption", async () => {
    const { root, repo, task, taskPath, worktree, oid } = fixture();
    const { acceptStageAttempt } = await import("../core/stage-runner.mjs");
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const decisionContext = bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });
    const decision = await runStage("make-decision", decisionContext, async () => ({ facts: { worktree_root: worktree, baseline_commit: oid } }));
    acceptStageAttempt("make-decision", decisionContext, { attemptRef: decision.attempt_ref, humanConfirmationRef: writeHumanConfirmation(decisionContext.kernel, "make-decision", decision) });
    const specContext = bootstrapStage("build-spec", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });
    const published = await runStage("build-spec", specContext, async (worker) => {
      worker.artifacts.writeAtomic("spec.md", "spec\n");
      return { facts: { spec_ref: "specs/chain-task/spec.md", checkpoint: worker.createCheckpoint("build-spec") } };
    });

    expect(() => task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT|no such/i);
    const accepted = acceptStageAttempt("build-spec", specContext, { attemptRef: published.attempt_ref });

    expect(accepted).toMatchObject({ stage: "build-spec", attempt_ref: published.attempt_ref, acceptance_mode: "automatic" });
    expect(JSON.parse(task.readRecord("results/build-spec/accepted.json"))).toMatchObject({ attempt_ref: published.attempt_ref });
  });
});
