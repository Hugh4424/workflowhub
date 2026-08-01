import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { hashAuditSummary } from "../runtime/evidence/audit-summary-carrier.mjs";
import { captureWorkspaceSnapshot, writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../runtime/task/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";

const roots = [];

function confirm(kernel, stage, attemptRef) {
  return kernel.confirmAttempt(stage, attemptRef, "accepted").ref;
}

function publishDecisionFixture(kernel, task, candidate) {
  const run = kernel.startStageRun("make-decision", { reason: "build-code preflight fixture" }).run;
  const decisionLog = "# Decision\n\nProceed.\n";
  const candidateArtifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  candidateArtifacts.writeAtomic("decision-log.md", decisionLog);
  const decisionHash = createHash("sha256").update(decisionLog).digest("hex");
  const decisionRef = `receipts/decision-log/${decisionHash}.md`;
  kernel.publishCanonicalRecord(decisionRef, decisionLog);
  const snapshotTree = candidate.captureSnapshot().tree;
  const content = {
    schema_version: "stage-content-evidence.v1", kind: "make-decision.build-code-preflight-fixture",
    task_id: task.identity.taskId, stage: "make-decision",
    workflow_run_id: run.workflow_run_id, snapshot_tree: snapshotTree,
  };
  const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
  const contentHash = createHash("sha256").update(contentRaw).digest("hex");
  const contentRef = `evidence/stage-content/${contentHash}/make-decision-build-code-preflight-fixture.json`;
  kernel.publishCanonicalRecord(contentRef, contentRaw);
  const contentEvidenceRefs = [{ kind: content.kind, ref: contentRef, hash: contentHash }];
  const unsignedSummary = {
    schema_version: "stage-audit-summary.v1", task_id: task.identity.taskId,
    stage_slug: "make-decision", workflow_run_id: run.workflow_run_id,
    snapshot_tree: snapshotTree, verdict: "pass", content_evidence_refs: contentEvidenceRefs,
  };
  const summaryHash = hashAuditSummary(unsignedSummary);
  const summaryRef = `evidence/audits/make-decision/${summaryHash}.json`;
  kernel.publishCanonicalRecord(summaryRef, `${JSON.stringify({ ...unsignedSummary, summary_hash: summaryHash }, null, 2)}\n`);
  return kernel.publishAttempt("make-decision", { facts: {
    worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit,
    snapshot_tree: snapshotTree, decision_ref: decisionRef, decision_hash: decisionHash,
    audit_contract_version: "v1", audit_summary_ref: summaryRef,
    audit_summary_hash: summaryHash, audit_verdict: "pass",
    content_evidence_refs: contentEvidenceRefs,
  } });
}

function publishAuditedFixture(kernel, task, stage, snapshotTree, data) {
  const run = kernel.startStageRun(stage, { reason: `${stage} preflight fixture` }).run;
  const content = {
    schema_version: "stage-content-evidence.v1", kind: `${stage}.build-code-preflight-fixture`,
    task_id: task.identity.taskId, stage, workflow_run_id: run.workflow_run_id,
    snapshot_tree: snapshotTree,
  };
  const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
  const contentHash = createHash("sha256").update(contentRaw).digest("hex");
  const contentRef = `evidence/stage-content/${contentHash}/${stage}-build-code-preflight-fixture.json`;
  kernel.publishCanonicalRecord(contentRef, contentRaw);
  const contentEvidenceRefs = [{ kind: content.kind, ref: contentRef, hash: contentHash }];
  const unsignedSummary = {
    schema_version: "stage-audit-summary.v1", task_id: task.identity.taskId,
    stage_slug: stage, workflow_run_id: run.workflow_run_id, snapshot_tree: snapshotTree,
    verdict: "pass", content_evidence_refs: contentEvidenceRefs,
  };
  const summaryHash = hashAuditSummary(unsignedSummary);
  const summaryRef = `evidence/audits/${stage}/${summaryHash}.json`;
  kernel.publishCanonicalRecord(summaryRef, `${JSON.stringify({ ...unsignedSummary, summary_hash: summaryHash }, null, 2)}\n`);
  return kernel.publishAttempt(stage, {
    ...data,
    facts: {
      ...data.facts, audit_contract_version: "v1", audit_summary_ref: summaryRef,
      audit_summary_hash: summaryHash, audit_verdict: "pass",
      content_evidence_refs: contentEvidenceRefs,
    },
  });
}

function acceptedDesignFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-build-code-preflight-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "base\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "base"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "build-code-preflight",
    created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const decision = publishDecisionFixture(kernel, task, candidate);
  kernel.acceptAttempt("make-decision", decision.attempt_ref, confirm(kernel, "make-decision", decision.attempt_ref));
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const bound = createTaskKernel(task, { workspace, artifacts });
  artifacts.writeAtomic("spec.md", "# Feature\n\n- AC-101: accepted behavior\n");
  const specCheckpoint = bound.createCheckpoint("build-spec");
  const specAttempt = publishAuditedFixture(bound, task, "build-spec", captureWorkspaceSnapshot(workspace).tree, {
    facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: specCheckpoint },
    upstream_refs: [{ task_id: task.identity.taskId, stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
  });
  bound.acceptAttempt("build-spec", specAttempt.attempt_ref);
  artifacts.writeAtomic("plan.md", "# Plan\n");
  artifacts.writeAtomic("tasks.md", "# Tasks\n");
  const planCheckpoint = bound.createCheckpoint("build-plan");
  const planAttempt = publishAuditedFixture(bound, task, "build-plan", captureWorkspaceSnapshot(workspace).tree, {
    facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: planCheckpoint },
    upstream_refs: [{ task_id: task.identity.taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
  });
  bound.acceptAttempt("build-plan", planAttempt.attempt_ref, confirm(bound, "build-plan", planAttempt.attempt_ref));
  return { root, repo, task, workspace, artifacts, bound };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("build-code authenticated input preflight", () => {
  it("allows real build-code bootstrap from current readable materials", () => {
    const { task, artifacts } = acceptedDesignFixture();
    artifacts.writeAtomic("tasks.md", "# Tasks\n\nTampered before build-code entry.\n");
    expect(() => bootstrapStage("build-code", {
      mode: "sidecar", projectName: "Demo", taskId: "build-code-preflight", taskPath: task.taskPath,
    })).not.toThrow();
  });

  it("does not use accepted material hashes as an implementation-receipt gate", () => {
    const { task, workspace, artifacts, bound } = acceptedDesignFixture();
    expect(() => bound.readAccepted("build-plan")).not.toThrow();
    expect(() => workspace.worktreeRoot).not.toThrow();

    artifacts.writeAtomic("tasks.md", "# Tasks\n\nTampered after the entry preflight.\n");
    writeFileSync(join(workspace.worktreeRoot, "implementation.txt"), "implementation\n");

    const receipt = writeOfficialComponentReceipt({
      task, workspace, stage: "build-code", component: "implementation", payload: {},
    });
    expect(receipt.value).toMatchObject({ stage: "build-code" });
    expect(task.readRecord(receipt.ref)).toBeTruthy();
  });
});
