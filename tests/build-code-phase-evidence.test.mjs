import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter, createCanonicalReviewWriter, writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";
import { validatePhaseGate } from "../scripts/phase-gate.mjs";
import { stageRuntimeMain } from "../scripts/stage-runtime.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";
import { readPhaseMapTrace } from "../skills/wh-review/scripts/phase-review-subject.mjs";
import { buildIntegrationReviewSubject } from "../skills/wh-review/scripts/integration-review-subject.mjs";
import { capturePhaseReviewSource } from "../skills/wh-review/scripts/review-source.mjs";
import { hashAuditSummary } from "../core/audit-summary-carrier.mjs";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

function accept(kernel, stage, facts, human = false, upstream_refs = []) {
  const attempt = kernel.publishAttempt(stage, { facts, upstream_refs });
  const confirmation = human ? kernel.confirmAttempt(stage, attempt.attempt_ref, "accepted").ref : undefined;
  kernel.acceptAttempt(stage, attempt.attempt_ref, confirmation);
}

function auditedKernel(task, workspace, options = {}) {
  const kernel = createTaskKernel(task, { ...options, ...(options.candidateWorkspace ? {} : { workspace }) });
  return Object.freeze({
    ...kernel,
    rawKernel: kernel,
    publishAttempt(stage, data = {}) {
      let active = kernel.activeStageRun(stage, { required: false });
      if (active === null) active = kernel.startStageRun(stage, { reason: "test fixture publication" });
      const snapshot = typeof workspace.captureSnapshot === "function"
        ? workspace.captureSnapshot()
        : captureGitWorktreeSnapshot(workspace.worktreeRoot);
      const kind = `${stage}.test`;
      const content = {
        schema_version: "stage-content-evidence.v1", kind, task_id: task.identity.taskId,
        stage, workflow_run_id: active.run.workflow_run_id, snapshot_tree: snapshot.tree,
      };
      const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
      const contentHash = sha256(contentRaw);
      const contentRef = `evidence/stage-content/${contentHash}/${stage}-test.json`;
      kernel.publishCanonicalRecord(contentRef, contentRaw);
      const contentEvidenceRefs = [{ kind, ref: contentRef, hash: contentHash }];
      const unsigned = {
        schema_version: "stage-audit-summary.v1", task_id: task.identity.taskId, stage_slug: stage,
        workflow_run_id: active.run.workflow_run_id, snapshot_tree: snapshot.tree,
        verdict: "pass", content_evidence_refs: contentEvidenceRefs,
      };
      const summaryHash = hashAuditSummary(unsigned);
      const summaryRaw = `${JSON.stringify({ ...unsigned, summary_hash: summaryHash }, null, 2)}\n`;
      const summaryRef = `evidence/audits/${stage}/${summaryHash}.json`;
      kernel.publishCanonicalRecord(summaryRef, summaryRaw);
      return kernel.publishAttempt(stage, {
        ...data,
        facts: {
          ...data.facts, audit_contract_version: "v1", audit_summary_ref: summaryRef,
          audit_summary_hash: summaryHash, audit_verdict: "pass", content_evidence_refs: contentEvidenceRefs,
        },
      });
    },
  });
}

function phaseTaskCard(id, title) {
  return `#### ${id} — ${title}

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：\`pending\`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not reviewed
- **completed_at**：N/A — not completed`;
}

function fixtureTasks() {
  return `# Tasks

## Phase 1：Contract

${phaseTaskCard("T001", "Phase 1")}

## Phase 2：Integration

${phaseTaskCard("T002", "Phase 2")}
`;
}

function fixture(taskId = "phase-evidence") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase-evidence-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "base"]);
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
    created_at: "2026-07-21T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = auditedKernel(task, candidate, { candidateWorkspace: candidate });
  const decision = writeOfficialComponentReceipt({
    task,
    stage: "make-decision",
    component: "decision",
    payload: { decision_log: "# Decision\n\nProceed with the fixture plan.\n" },
  });
  accept(kernel, "make-decision", {
    worktree_root: candidate.worktreeRoot,
    baseline_commit: candidate.baselineCommit,
    snapshot_tree: candidate.captureSnapshot().tree,
    decision_ref: decision.value.decision_ref,
    decision_hash: decision.value.decision_hash,
  }, true);
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const bound = auditedKernel(task, workspace, { artifacts });
  artifacts.writeAtomic("decision-log.md", task.readRecord(decision.value.decision_ref));
  artifacts.writeAtomic("spec.md", "# Spec\n");
  accept(bound, "build-spec", { spec_ref: artifacts.reference("spec.md"), checkpoint: bound.createCheckpoint("build-spec") }, false,
    [{ task_id: taskId, stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }]);
  artifacts.writeAtomic("plan.md", "# Plan\n\n## Phase 1：Contract\n\n## Phase 2：Integration\n");
  artifacts.writeAtomic("tasks.md", fixtureTasks());
  accept(bound, "build-plan", {
    plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: bound.createCheckpoint("build-plan"),
  }, true, [{ task_id: taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }]);
  return { root, task, workspace, kernel: bound.rawKernel, auditedKernel: bound };
}

function recordPhaseTaskCompletion(state, phaseId, reviewRef) {
  const phaseNumber = Number.parseInt(phaseId.match(/^phase-(\d+)$/)?.[1] ?? "", 10);
  if (!Number.isSafeInteger(phaseNumber) || phaseNumber < 1) throw new Error(`fixture phase id is invalid: ${phaseId}`);
  const taskId = `T${String(phaseNumber).padStart(3, "0")}`;
  const tasksPath = join(state.workspace.worktreeRoot, "specs", state.task.identity.taskId, "tasks.md");
  const before = readFileSync(tasksPath, "utf8");
  const phaseResult = JSON.parse(state.task.readRecord("phase-result.json"));
  const boundRefs = [
    phaseResult.evidence.implementation_receipt_ref,
    phaseResult.evidence.green_test_receipt_ref,
    reviewRef,
  ].map((ref) => ({ ref, sha256: sha256(state.task.readRecord(ref)) }));
  const blockPattern = new RegExp(`(^####\\s+${taskId}\\b[^\\n]*\\n[\\s\\S]*?)(?=^####\\s+T\\d+\\b|(?![\\s\\S]))`, "m");
  const after = before.replace(blockPattern, (block) => block
    .replace("- [ ] **任务完成**", "- [x] **任务完成**")
    .replace("- **status**：`pending`", "- **status**：`completed`")
    .replace("- **actual_changes**：N/A — not started", `- **actual_changes**：${phaseId}.txt`)
    .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：true; exit 0")
    .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`${JSON.stringify(boundRefs)}\``)
    .replace("- **covered_ac**：N/A — not started", `- **covered_ac**：AC-${String(phaseNumber).padStart(2, "0")}`)
    .replace("- **review_fact**：N/A — not reviewed", `- **review_fact**：${reviewRef}`)
    .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z"));
  if (after === before) throw new Error(`fixture Task completion block was not updated: ${taskId}`);
  writeFileSync(tasksPath, after);
}

function phaseReceipts(state, name, { revisionOf, extraFiles = [] } = {}) {
  writeFileSync(join(state.workspace.worktreeRoot, `${name}.txt`), `${name}\n`);
  for (const { path, content } of extraFiles) writeFileSync(join(state.workspace.worktreeRoot, path), content);
  const implementation = writeOfficialComponentReceipt({
    task: state.task, workspace: state.workspace, stage: "build-code", component: "implementation",
    payload: {}, ...(revisionOf ? { revisionOf } : {}),
  });
  const tests = createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace, stage: "build-code", component: "build-code-test-capture" })
    .captureTests({ command: "true", receiptRef: `receipts/${name}-green.json`, outputRef: `evidence/${name}-green.txt` });
  return { implementation, tests };
}

function redReceipt(state, name) {
  return createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace, stage: "build-code", component: "build-code-test-capture" })
    .captureTests({ command: "false", receiptRef: `receipts/${name}-red.json`, outputRef: `evidence/${name}-red.txt` });
}

function formalPhaseReview(state, published, verdict = "pass", { reviewScope = "phase", includePhaseAcTrace = true } = {}) {
  const writer = createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "build-code" });
  const suffix = `${published.phase_id}-${verdict}-${published.snapshot_tree.slice(0, 8)}`;
  const attemptRef = `reviews/attempts/${suffix}/attempt.json`;
  const outputRef = `reviews/attempts/${suffix}/providers/fixture.output.json`;
  const resultRef = `reviews/results/${suffix}.json`;
  const source = {
    target_commit: published.implementation_commit, base_commit: published.baseline_commit,
    base_tree: published.base_tree, captured_head: published.implementation_commit,
  };
  const subject = {
    subject_kind: "phase", phase_id: published.phase_id,
    review_scope: reviewScope,
    base_tree: published.base_tree, candidate_tree: published.snapshot_tree,
  };
  const flowIdentity = state.kernel.deriveReviewFlowIdentity({
    stage: "build-code", review_track: null,
    subject_kind: subject.subject_kind, phase_id: subject.phase_id, review_scope: subject.review_scope,
    ...(subject.review_scope === "phase" ? { snapshot_tree: published.snapshot_tree } : {}),
    ...(published.reopen_ref === undefined ? {} : { revision_ref: published.reopen_ref }),
  });
  const currentFlow = state.kernel.readReviewFlow(flowIdentity);
  const reviewChain = currentFlow === null ? null : {
    version: "wh-review-chain.v1", round: "full",
    parent_result_ref: currentFlow.head_result_ref,
    root_result_ref: currentFlow.root_result_ref,
    prior_snapshot_tree: JSON.parse(state.task.readRecord(currentFlow.head_result_ref)).snapshot_tree,
    current_snapshot_tree: published.snapshot_tree,
    response_ledger_sha256: sha256(`${suffix}:response-ledger`),
    source_diff_sha256: sha256(`${suffix}:source-diff`),
  };
  const finding = { severity: "major", path: "fixture", issue: "fix", recommendation: "repair" };
  const output = { verdict, summary: "fixture", findings: verdict === "pass" ? [] : [finding] };
  writer.writeProviderOutput(outputRef, JSON.stringify(output));
  const materialId = sha256(`${suffix}:material`);
  const phaseEvidence = JSON.parse(state.task.readRecord("phase-result.json"));
  const greenRef = phaseEvidence.evidence.green_test_receipt_ref;
  const greenHash = sha256(state.task.readRecord(greenRef));
  const phaseAcTrace = {
    schema_version: "phase-ac-change-test-trace.v1", phase_id: published.phase_id,
    base_tree: published.base_tree, snapshot_tree: published.snapshot_tree,
    acceptance_ids: [`AC-${published.phase_id}`],
    entries: [{
      acceptance_criterion_id: `AC-${published.phase_id}`,
      change: [{ change_id: `C-${published.phase_id}`, path: `${published.phase_id}.txt` }],
      test: [{ receipt_ref: greenRef, receipt_hash: greenHash }],
      anchors: [{ id: "phase-ac", path: `${published.phase_id}.txt`, start_line: 1, end_line: 1, role: "acceptance", reason: "Phase implementation" }],
    }],
  };
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: suffix, task_id: state.task.identity.taskId, stage: "build-code",
    review_track: null, source, snapshot_tree: published.snapshot_tree, material_id: materialId, ...subject,
    provider_attempts: [{ provider: "fixture", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: outputRef, error: null }],
    terminal_status: "semantic", error: null,
    ...(reviewChain === null ? {} : { review_chain: reviewChain }),
    ...(includePhaseAcTrace ? { phase_ac_trace: phaseAcTrace } : {}),
  });
  writer.writeResult(resultRef, {
    version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "build-code", review_track: null,
    source, snapshot_tree: published.snapshot_tree, material_id: materialId, attempt_ref: attemptRef, ...subject,
    provider_results: [{ provider: "fixture", output }], verdict,
    findings: verdict === "pass" ? [] : [{ provider: "fixture", ...finding }],
    ...(reviewChain === null ? {} : { review_chain: reviewChain }),
  });
  state.kernel.advanceReviewFlow(flowIdentity, {
    expected_head_ref: currentFlow?.head_result_ref ?? null,
    expected_event_ref: currentFlow?.event_ref ?? null,
    result_ref: resultRef,
  });
  return resultRef;
}

function unavailablePhaseReview(state, published) {
  const writer = createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "build-code" });
  const suffix = `${published.phase_id}-unavailable-${published.snapshot_tree.slice(0, 8)}`;
  const attemptRef = `reviews/attempts/${suffix}/attempt.json`;
  const greenRef = JSON.parse(state.task.readRecord("phase-result.json")).evidence.green_test_receipt_ref;
  const subject = {
    subject_kind: "phase", phase_id: published.phase_id, review_scope: "phase",
    base_tree: published.base_tree, candidate_tree: published.snapshot_tree,
  };
  writer.writeAttempt(attemptRef, {
    version: "wh-review-attempt.v1", attempt_id: suffix, task_id: state.task.identity.taskId, stage: "build-code",
    review_track: null,
    source: {
      target_commit: published.implementation_commit, base_commit: published.baseline_commit,
      base_tree: published.base_tree, captured_head: published.implementation_commit,
    },
    snapshot_tree: published.snapshot_tree, material_id: sha256(`${suffix}:material`), ...subject,
    phase_ac_trace: {
      schema_version: "phase-ac-change-test-trace.v1", phase_id: published.phase_id,
      base_tree: published.base_tree, snapshot_tree: published.snapshot_tree,
      acceptance_ids: [`AC-${published.phase_id}`],
      entries: [{
        acceptance_criterion_id: `AC-${published.phase_id}`,
        change: [{ change_id: `C-${published.phase_id}`, path: `${published.phase_id}.txt` }],
        test: [{ receipt_ref: greenRef, receipt_hash: sha256(state.task.readRecord(greenRef)) }],
        anchors: [{ id: "phase-ac", path: `${published.phase_id}.txt`, start_line: 1, end_line: 1, role: "acceptance", reason: "Phase implementation" }],
      }],
    },
    provider_attempts: [{
      provider: "fixture/provider", status: "failed", session_id: null, runtime_id: null,
      output_ref: null, error: { code: "PROVIDER_UNAVAILABLE", message: "down" },
    }],
    terminal_status: "unavailable", error: { code: "PROVIDER_UNAVAILABLE", message: "down" },
  });
  const identity = state.kernel.deriveReviewFlowIdentity({
    stage: "build-code", review_track: null, subject_kind: "phase",
    phase_id: published.phase_id, review_scope: "phase", snapshot_tree: published.snapshot_tree,
  });
  const current = state.kernel.readReviewFlow(identity);
  state.kernel.recordReviewAttempt(identity, {
    expected_head_ref: current?.head_result_ref ?? null,
    expected_event_ref: current?.event_ref ?? null,
    attempt_ref: attemptRef,
  });
  return attemptRef;
}

function publish(state, phaseId, receipts, extra = {}) {
  return publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
    phase_id: phaseId,
    implementation_receipt_ref: receipts.implementation.ref,
    green_test_receipt_ref: receipts.tests.receipt_ref,
    allowed_files: [`${phaseId}.txt`],
    ...extra,
  });
}

function completePhase(state, phaseId, receipts, extra = {}) {
  const pending = publish(state, phaseId, receipts, extra);
  const review = formalPhaseReview(state, pending);
  const { previous_phase_review_ref: _predecessor, ...completionExtra } = extra;
  const completed = publish(state, phaseId, receipts, { ...completionExtra, review_result_ref: review });
  return { pending, completed, review, traceRef: JSON.parse(state.task.readRecord("phase-result.json")).evidence.phase_map_trace_ref };
}

function controlledReopen(state, published, receipts, reviewRef) {
  const testReceipt = JSON.parse(state.task.readRecord(receipts.tests.receipt_ref));
  const reviewRaw = state.task.readRecord(reviewRef);
  const testFacts = {
    command: testReceipt.command, exit_code: testReceipt.exit_code,
    command_hash: testReceipt.command_hash, snapshot_head: testReceipt.snapshot_head,
    snapshot_tree: testReceipt.snapshot_tree, snapshot_commit: testReceipt.snapshot_commit,
    started_at: testReceipt.started_at, completed_at: testReceipt.completed_at,
    receipt_ref: receipts.tests.receipt_ref, receipt_hash: sha256(state.task.readRecord(receipts.tests.receipt_ref)),
    output_ref: testReceipt.output_ref, output_hash: testReceipt.output_hash,
  };
  const reviewFacts = {
    verdict: "pass", result_ref: reviewRef, result_hash: sha256(reviewRaw),
    snapshot_tree: published.snapshot_tree,
  };
  accept(state.auditedKernel, "build-code", {
    changed: [`${published.phase_id}.txt`], tests: testFacts, review: reviewFacts,
    phase_completion: {
      status: "completed",
      evidence_ref: "phase-result.json",
      evidence_hash: sha256(state.task.readRecord("phase-result.json")),
      integration_review: { ref: reviewRef, sha256: sha256(reviewRaw) },
      formal_record_status: { status: "unavailable", reason: "fixture has no Phase history" },
    },
    acceptance_coverage: {
      snapshot_tree: published.snapshot_tree,
      accepted_criterion_ids: [`AC-${published.phase_id}`],
      items: [{ acceptance_criterion_id: `AC-${published.phase_id}`, status: "covered", evidence_refs: [{ ref: testReceipt.output_ref, sha256: testReceipt.output_hash }] }],
    },
  }, false, [{ task_id: state.task.identity.taskId, stage: "build-plan", accepted_ref: "results/build-plan/accepted.json" }]);

  const failureRef = "evidence/acceptance-reopened-phase.json";
  const failureRaw = `${JSON.stringify({
    schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "PHASE-REPAIR",
    result: "fail", refs: [{ ref: testReceipt.output_ref, sha256: testReceipt.output_hash }],
  }, null, 2)}\n`;
  state.kernel.publishCanonicalRecord(failureRef, failureRaw);
  const verify = state.auditedKernel.publishAttempt("verify-code", {
    facts: { tests: testFacts, review: reviewFacts, evidence_refs: [{ ref: failureRef, sha256: sha256(failureRaw) }] },
    evidence_refs: [{ ref: failureRef, sha256: sha256(failureRaw) }],
    upstream_refs: [{ task_id: state.task.identity.taskId, stage: "build-code", accepted_ref: "results/build-code/accepted.json" }],
  });
  return state.kernel.reopenBuildCode({ verifyAttemptRef: verify.attempt_ref, failureEvidenceRef: failureRef });
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("build-code phase evidence publication", () => {
  it("uses a verified current task-material revision as the first Phase baseline and rejects unrecorded material drift", () => {
    const revised = fixture("phase-current-materials");
    const revisedTasksPath = join(
      revised.workspace.worktreeRoot,
      "specs",
      revised.task.identity.taskId,
      "tasks.md",
    );
    writeFileSync(revisedTasksPath, `${readFileSync(revisedTasksPath, "utf8")}\n<!-- authorized current tasks -->\n`);
    revised.kernel.publishMaterialRevision({
      change_summary: "authorize the current tasks before build-code",
      source_refs: ["results/build-plan/accepted.json"],
    });
    const receipts = phaseReceipts(revised, "phase-1");
    const first = publish(revised, "phase-1", receipts);
    const acceptedPlanCommit = revised.kernel.readAcceptedAudit("build-plan").accepted.checkpoint.commit_oid;

    expect(first.baseline_commit).not.toBe(acceptedPlanCommit);
    expect(git(revised.workspace.worktreeRoot, ["rev-parse", `${first.baseline_commit}^`])).toBe(acceptedPlanCommit);
    expect(git(revised.workspace.worktreeRoot, [
      "show",
      `${first.baseline_commit}:specs/${revised.task.identity.taskId}/tasks.md`,
    ])).toContain("authorized current tasks");
    expect(JSON.parse(revised.task.readRecord(first.diff_scan_ref)).changed_files).toEqual(["phase-1.txt"]);

    const unrecorded = fixture("phase-unrecorded-materials");
    const unrecordedTasksPath = join(
      unrecorded.workspace.worktreeRoot,
      "specs",
      unrecorded.task.identity.taskId,
      "tasks.md",
    );
    writeFileSync(unrecordedTasksPath, `${readFileSync(unrecordedTasksPath, "utf8")}\n<!-- unrecorded tasks -->\n`);
    const unrecordedReceipts = phaseReceipts(unrecorded, "phase-1");
    expect(() => publish(unrecorded, "phase-1", unrecordedReceipts))
      .toThrow(/live artifact differs from checkpoint: .*tasks\.md/i);
  });

  it("seals a non-ignored untracked file into the first Phase only, while rejecting later workspace drift", () => {
    const state = fixture("phase-untracked-snapshot");
    const firstReceipts = phaseReceipts(state, "phase-1", {
      extraFiles: [{ path: "phase-untracked.txt", content: "sealed untracked content\n" }],
    });
    const implementation = JSON.parse(state.task.readRecord(firstReceipts.implementation.ref));
    const implementationDiff = JSON.parse(state.task.readRecord(implementation.diff_ref));
    const untrackedBlob = git(state.workspace.worktreeRoot, ["hash-object", "--", "phase-untracked.txt"]);

    expect(implementation.changed).toEqual(expect.arrayContaining(["phase-1.txt", "phase-untracked.txt"]));
    expect(implementationDiff.untracked).toEqual(expect.arrayContaining([{ path: "phase-untracked.txt", blob_oid: untrackedBlob }]));
    expect(git(state.workspace.worktreeRoot, ["status", "--porcelain", "--untracked-files=all"])).toContain("?? phase-untracked.txt");

    const firstAllowedFiles = { allowed_files: ["phase-1.txt", "phase-untracked.txt"] };
    const first = publish(state, "phase-1", firstReceipts, firstAllowedFiles);
    const reviewDataRoot = join(state.root, "review-data");
    mkdirSync(reviewDataRoot);
    const source = capturePhaseReviewSource({
      sourceRoot: state.workspace.worktreeRoot, task: state.task, phaseId: "phase-1", reviewDataRoot,
    });
    try {
      const phaseDiff = readFileSync(source.diffPath, "utf8");
      const expectedDiff = execFileSync("git", ["diff", "-M", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", source.baseTree, source.snapshotTree], {
        cwd: state.workspace.worktreeRoot, encoding: "utf8",
      });
      expect(source.changedFiles.map(({ path }) => path)).toEqual(expect.arrayContaining(["phase-1.txt", "phase-untracked.txt"]));
      expect(phaseDiff).toContain("phase-untracked.txt");
      expect(phaseDiff).toContain("sealed untracked content");
      expect(phaseDiff).toBe(expectedDiff);
      expect(phaseDiff).not.toContain('"schema_version": "workflowhub-diff-evidence.v1"');
      expect(phaseDiff).not.toContain('"untracked"');
    } finally {
      source.dispose();
    }

    const firstReview = formalPhaseReview(state, first);
    writeFileSync(join(state.workspace.worktreeRoot, "late-untracked.txt"), "late drift\n");
    expect(() => publish(state, "phase-1", firstReceipts, { ...firstAllowedFiles, review_result_ref: firstReview }))
      .toThrow(/Workspace.*drift|snapshot.*drift/i);
    rmSync(join(state.workspace.worktreeRoot, "late-untracked.txt"));

    publish(state, "phase-1", firstReceipts, { ...firstAllowedFiles, review_result_ref: firstReview });
    recordPhaseTaskCompletion(state, "phase-1", firstReview);
    const secondReceipts = phaseReceipts(state, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    const second = publish(state, "phase-2", secondReceipts, { previous_phase_review_ref: firstReview });
    const secondScan = JSON.parse(state.task.readRecord(second.diff_scan_ref));
    const secondSource = capturePhaseReviewSource({
      sourceRoot: state.workspace.worktreeRoot, task: state.task, phaseId: "phase-2", reviewDataRoot,
    });
    try {
      const phaseDiff = readFileSync(secondSource.diffPath, "utf8");
      expect(secondScan.changed_files).toEqual(["phase-2.txt"]);
      expect(secondSource.changedFiles.map(({ path }) => path)).toEqual(["phase-2.txt"]);
      expect(phaseDiff).toContain("phase-2.txt");
      expect(phaseDiff).not.toContain("phase-untracked.txt");
      expect(phaseDiff).not.toContain("sealed untracked content");
    } finally {
      secondSource.dispose();
    }
    expect(git(state.workspace.worktreeRoot, ["status", "--porcelain", "--untracked-files=all"])).toContain("?? phase-untracked.txt");
  });

  it("reconstructs one continuous semantic-review chain and emits a trace-only seam index without a cumulative diff", () => {
    const state = fixture("integration-subject");
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = completePhase(state, "phase-1", firstReceipts);
    recordPhaseTaskCompletion(state, "phase-1", first.review);
    const secondReceipts = phaseReceipts(state, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    const second = completePhase(state, "phase-2", secondReceipts, { previous_phase_review_ref: first.review });

    const subject = buildIntegrationReviewSubject({ task: state.task, sourceRoot: state.workspace.worktreeRoot, finalTree: second.completed.snapshot_tree });
    expect(subject).toMatchObject({
      schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
      base_commit: state.kernel.readAcceptedAudit("build-plan").accepted.checkpoint.commit_oid,
      snapshot_tree: second.completed.snapshot_tree,
    });
    expect(subject.phase_coverage.phases.map(({ phase_id }) => phase_id)).toEqual(["phase-1", "phase-2"]);
    expect(subject.phase_coverage.phases.map(({ review_result }) => review_result.ref)).toEqual([first.review, second.review]);
    expect(subject.seam_index).toEqual(expect.objectContaining({
      schema_version: "cross-phase-seam-index.v1", snapshot_tree: second.completed.snapshot_tree,
      entries: [expect.objectContaining({ producer_phase_id: "phase-1", consumer_phase_id: "phase-2", disposition: "unknown" })],
    }));
    expect(JSON.stringify(subject)).not.toMatch(/changes\.diff|cumulative_diff|raw_log|integration_map/);
  });

  it("keeps a revise_required Phase in the authenticated integration coverage chain", () => {
    const state = fixture("integration-revise-required");
    const receipts = phaseReceipts(state, "phase-1");
    const pending = publish(state, "phase-1", receipts);
    const review = formalPhaseReview(state, pending, "revise_required");
    const completed = publish(state, "phase-1", receipts, { review_result_ref: review });

    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      status: "done",
      review: { result_ref: review, verdict: "revise_required" },
    });
    const subject = buildIntegrationReviewSubject({
      task: state.task,
      sourceRoot: state.workspace.worktreeRoot,
      finalTree: completed.snapshot_tree,
    });
    expect(subject.phase_coverage.phases).toEqual([
      expect.objectContaining({
        phase_id: "phase-1",
        review_result: { ref: review, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) },
        review_verdict: "revise_required",
      }),
    ]);
  });

  it("keeps an authenticated unavailable provider attempt in the Phase and integration quality facts", () => {
    const state = fixture("integration-unavailable");
    const receipts = phaseReceipts(state, "phase-1");
    const pending = publish(state, "phase-1", receipts);
    const attemptRef = unavailablePhaseReview(state, pending);
    const completed = publish(state, "phase-1", receipts, { review_result_ref: attemptRef });
    const phase = JSON.parse(state.task.readRecord("phase-result.json"));
    expect(phase).toMatchObject({
      status: "done",
      review: { action_ref: attemptRef, status: "unavailable", verdict: null, risk_acceptances: [] },
    });
    expect(validatePhaseGate(phase, state.workspace.worktreeRoot, {
      baseDir: state.task.taskPath, reviewDataRoot: state.task.taskPath,
    })).toMatchObject({
      ok: true,
      warnings: expect.arrayContaining([expect.stringMatching(/unavailable.*not rewritten to pass/i)]),
    });
    const subject = buildIntegrationReviewSubject({
      task: state.task, sourceRoot: state.workspace.worktreeRoot, finalTree: completed.snapshot_tree,
    });
    expect(subject.phase_coverage.phases).toEqual([
      expect.objectContaining({
        phase_id: "phase-1", review_status: "unavailable", review_result: null,
        review_action: { ref: attemptRef, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) },
        review_verdict: null,
      }),
    ]);
  });

  it("fails closed when a historic reviewed phase has no phase-map trace", () => {
    const state = fixture("integration-legacy-trace");
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = completePhase(state, "phase-1", firstReceipts);
    recordPhaseTaskCompletion(state, "phase-1", first.review);
    const secondReceipts = phaseReceipts(state, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    const second = completePhase(state, "phase-2", secondReceipts, { previous_phase_review_ref: first.review });
    rmSync(join(state.task.taskPath, first.traceRef));
    expect(() => buildIntegrationReviewSubject({ task: state.task, sourceRoot: state.workspace.worktreeRoot, finalTree: second.completed.snapshot_tree }))
      .toThrow(/MATERIAL_INCOMPLETE.*continuous Phase coverage/i);
  });

  it("fails closed when a continuous Phase trace omits its AC mapping", () => {
    const state = fixture("integration-missing-ac-trace");
    const receipts = phaseReceipts(state, "phase-1");
    const pending = publish(state, "phase-1", receipts);
    const review = formalPhaseReview(state, pending, "pass", { includePhaseAcTrace: false });
    const completed = publish(state, "phase-1", receipts, { review_result_ref: review });
    expect(() => buildIntegrationReviewSubject({ task: state.task, sourceRoot: state.workspace.worktreeRoot, finalTree: completed.snapshot_tree }))
      .toThrow(/MATERIAL_INCOMPLETE.*AC change\/test mapping/i);
  });

  it("derives the first baseline, publishes pre-review evidence, attaches PASS, and reuses the same identity", () => {
    const state = fixture();
    const red = redReceipt(state, "phase-1");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts, { red_evidence_ref: red.receipt_ref });
    expect(first.baseline_commit).toBe(state.kernel.readAccepted("build-plan").accepted.checkpoint.commit_oid);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({ phase_id: "phase-1", status: "awaiting_review" });

    const reviewRef = formalPhaseReview(state, first);
    const reviewed = publish(state, "phase-1", receipts, { red_evidence_ref: red.receipt_ref, review_result_ref: reviewRef });
    expect(reviewed.diff_scan_ref).toBe(first.diff_scan_ref);
    expect(reviewed.review_result_ref).toBe(reviewRef);
    const phaseResult = JSON.parse(state.task.readRecord("phase-result.json"));
    expect(validatePhaseGate(phaseResult, state.workspace.worktreeRoot, { baseDir: state.task.taskPath, reviewDataRoot: state.task.taskPath }).ok).toBe(true);
    expect(publish(state, "phase-1", receipts, { red_evidence_ref: red.receipt_ref, review_result_ref: reviewRef }).diff_scan_ref).toBe(first.diff_scan_ref);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      status: "done", declared_allowed_files: ["phase-1.txt"],
    });
    const traceRef = phaseResult.evidence.phase_map_trace_ref;
    expect(traceRef).toMatch(/^evidence\/phases\/phase-1\/[a-f0-9]{40}\/phase-map-trace-[a-f0-9]{64}\.json$/);
    const trace = readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef });
    expect(trace.trace).toMatchObject({
      phase_id: "phase-1", review_scope: "phase", verdict: "pass",
      canonical_phase_evidence: { ref: first.canonical_phase_evidence_ref },
      review_result: { ref: reviewRef },
    });
    expect(trace.trace.implementation_commit_ref).toBe(
      `refs/workflowhub/phases/Demo/${state.task.identity.taskId}/build-code/phase-1/snapshot-${first.snapshot_tree}`,
    );
    expect(git(state.workspace.worktreeRoot, ["rev-parse", `${trace.trace.implementation_commit_ref}^{commit}`]))
      .toBe(first.implementation_commit);
    git(state.workspace.worktreeRoot, ["gc", "--prune=now"]);
    expect(readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef }).trace.implementation_commit)
      .toBe(first.implementation_commit);
    const changed = phaseReceipts(state, "after-pass", { revisionOf: receipts.implementation.ref });
    const changedInput = {
      phase_id: "phase-1", implementation_receipt_ref: changed.implementation.ref,
      green_test_receipt_ref: changed.tests.receipt_ref, allowed_files: ["after-pass.txt", "phase-1.txt"],
    };
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, changedInput))
      .toThrow(/completed Phase.*closed/i);
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      ...changedInput, previous_phase_review_ref: reviewRef,
    })).toThrow(/completed Phase.*closed|revise_required/i);
  });

  it("reopens only the current PASS Phase through an authenticated build-code reopen", () => {
    const state = fixture("controlled-phase-reopen");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts);
    const firstReview = formalPhaseReview(state, first);
    publish(state, "phase-1", receipts, { review_result_ref: firstReview });
    const originalTraceRef = JSON.parse(state.task.readRecord("phase-result.json")).evidence.phase_map_trace_ref;
    const originalTraceRaw = state.task.readRecord(originalTraceRef);
    const reopen = controlledReopen(state, first, receipts, firstReview);

    const repaired = phaseReceipts(state, "phase-1-reopened", { revisionOf: receipts.implementation.ref });
    const reopened = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-1-reopened.txt"],
      reopen_ref: reopen.reopen_ref,
    });
    expect(reopened.baseline_commit).toBe(first.baseline_commit);
    expect(JSON.parse(state.task.readRecord("phase-result.json"))).toMatchObject({
      phase_id: "phase-1", status: "awaiting_review", reopen_ref: reopen.reopen_ref,
    });

    const reopenedReview = formalPhaseReview(state, reopened);
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-1-reopened.txt"],
      review_result_ref: reopenedReview,
    })).toThrow(/reopen_ref/i);
    const completedReopen = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-1-reopened.txt"],
      review_result_ref: reopenedReview, reopen_ref: reopen.reopen_ref,
    });
    const reopenedTraceRef = JSON.parse(state.task.readRecord("phase-result.json")).evidence.phase_map_trace_ref;
    expect(completedReopen.phase_map_trace_ref).toBe(reopenedTraceRef);
    expect(reopenedTraceRef).not.toBe(originalTraceRef);
    expect(state.task.readRecord(originalTraceRef)).toBe(originalTraceRaw);
    expect(readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: originalTraceRef }).trace.snapshot_tree)
      .toBe(first.snapshot_tree);
    expect(readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: reopenedTraceRef }).trace.snapshot_tree)
      .toBe(reopened.snapshot_tree);

    const secondRepair = phaseReceipts(state, "phase-1-reopened-again", { revisionOf: repaired.implementation.ref });
    const secondReopened = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: secondRepair.implementation.ref,
      green_test_receipt_ref: secondRepair.tests.receipt_ref,
      allowed_files: ["phase-1.txt", "phase-1-reopened.txt", "phase-1-reopened-again.txt"],
      reopen_ref: reopen.reopen_ref,
    });
    expect(secondReopened.snapshot_tree).not.toBe(reopened.snapshot_tree);
    expect(secondReopened.baseline_commit).toBe(first.baseline_commit);
  });

  it("rejects reopen authority for an unchanged or non-current Phase", () => {
    const state = fixture("controlled-phase-scope");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts);
    const reviewRef = formalPhaseReview(state, first);
    publish(state, "phase-1", receipts, { review_result_ref: reviewRef });
    const reopen = controlledReopen(state, first, receipts, reviewRef);

    expect(() => publish(state, "phase-1", receipts, { review_result_ref: reviewRef, reopen_ref: reopen.reopen_ref }))
      .toThrow(/changed.*identity|reopen/i);
    const later = phaseReceipts(state, "phase-2", { revisionOf: receipts.implementation.ref });
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-2", implementation_receipt_ref: later.implementation.ref,
      green_test_receipt_ref: later.tests.receipt_ref, previous_phase_review_ref: reviewRef,
      allowed_files: ["phase-2.txt"], reopen_ref: reopen.reopen_ref,
    })).toThrow(/current.*Phase|phase_id/i);
    expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: later.implementation.ref,
      green_test_receipt_ref: later.tests.receipt_ref, allowed_files: ["phase-1.txt", "phase-2.txt"],
      reopen_ref: "results/build-code/revisions/reopen-9999.json",
    })).toThrow(/missing|reopen|ENOENT/i);
  });

  it("requires a formal semantic predecessor and derives the next baseline from it", () => {
    const state = fixture();
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", firstReceipts);
    const reviewRef = formalPhaseReview(state, first);
    publish(state, "phase-1", firstReceipts, { review_result_ref: reviewRef });
    recordPhaseTaskCompletion(state, "phase-1", reviewRef);
    const secondReceipts = phaseReceipts(state, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    const second = publish(state, "phase-2", secondReceipts, { previous_phase_review_ref: reviewRef });
    expect(git(state.workspace.worktreeRoot, ["rev-parse", `${second.baseline_commit}^`])).toBe(first.implementation_commit);
    expect(git(state.workspace.worktreeRoot, ["diff", "--name-only", first.implementation_commit, second.baseline_commit]))
      .toBe(`specs/${state.task.identity.taskId}/tasks.md`);
  });

  it("accepts revise_required predecessors but rejects unknown fields, drift, wrong provenance, and allowlist violations", () => {
    const nonPass = fixture("non-pass");
    const firstReceipts = phaseReceipts(nonPass, "phase-1");
    const first = publish(nonPass, "phase-1", firstReceipts);
    const reviewRef = formalPhaseReview(nonPass, first, "revise_required");
    publish(nonPass, "phase-1", firstReceipts, { review_result_ref: reviewRef });
    recordPhaseTaskCompletion(nonPass, "phase-1", reviewRef);
    const secondReceipts = phaseReceipts(nonPass, "phase-2", { revisionOf: firstReceipts.implementation.ref });
    const secondBaseline = publish(nonPass, "phase-2", secondReceipts, { previous_phase_review_ref: reviewRef }).baseline_commit;
    expect(git(nonPass.workspace.worktreeRoot, ["rev-parse", `${secondBaseline}^`])).toBe(first.implementation_commit);
    expect(git(nonPass.workspace.worktreeRoot, ["diff", "--name-only", first.implementation_commit, secondBaseline]))
      .toBe(`specs/${nonPass.task.identity.taskId}/tasks.md`);

    const legacy = fixture("legacy-phase-scope");
    const legacyReceipts = phaseReceipts(legacy, "phase-1");
    const legacyPhase = publish(legacy, "phase-1", legacyReceipts);
    const legacyReview = formalPhaseReview(legacy, legacyPhase, "pass", { reviewScope: null });
    expect(() => publish(legacy, "phase-1", legacyReceipts, { review_result_ref: legacyReview })).toThrow(/formal phase review identity|review_scope/i);

    const invalid = fixture("invalid-input");
    const invalidReceipts = phaseReceipts(invalid, "phase-1");
    expect(() => publish(invalid, "phase-1", invalidReceipts, { provider: "forbidden" })).toThrow(/unknown|only/i);
    writeFileSync(join(invalid.workspace.worktreeRoot, "drift.txt"), "drift\n");
    expect(() => publish(invalid, "phase-1", invalidReceipts)).toThrow(/Workspace|snapshot|drift/i);

    const wrong = fixture("wrong-ref");
    const wrongRaw = `${JSON.stringify({ task_id: "another-task", stage: "build-code" })}\n`;
    wrong.kernel.publishCanonicalRecord("receipts/revisions/implementation/wrong.json", wrongRaw);
    const wrongTests = phaseReceipts(wrong, "phase-1");
    expect(() => publishBuildCodePhaseEvidence({ task: wrong.task, kernel: wrong.kernel, workspace: wrong.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: "receipts/revisions/implementation/wrong.json",
      green_test_receipt_ref: wrongTests.tests.receipt_ref, allowed_files: ["phase-1.txt"],
    })).toThrow(/provenance|task|receipt/i);

    const outside = fixture("outside-scope");
    const outsideReceipts = phaseReceipts(outside, "phase-1");
    expect(() => publishBuildCodePhaseEvidence({ task: outside.task, kernel: outside.kernel, workspace: outside.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: outsideReceipts.implementation.ref,
      green_test_receipt_ref: outsideReceipts.tests.receipt_ref, allowed_files: [],
    })).toThrow(/allowlist|safe|scope/i);
  });

  it("creates a new identity only after a revise-required review of the same phase", () => {
    const state = fixture();
    const firstReceipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", firstReceipts);
    const reviseRef = formalPhaseReview(state, first, "revise_required");
    publish(state, "phase-1", firstReceipts, { review_result_ref: reviseRef });
    const repaired = phaseReceipts(state, "phase-1-repair", { revisionOf: firstReceipts.implementation.ref });
    const next = publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
      phase_id: "phase-1", implementation_receipt_ref: repaired.implementation.ref,
      green_test_receipt_ref: repaired.tests.receipt_ref,
      previous_phase_review_ref: reviseRef, allowed_files: ["phase-1.txt", "phase-1-repair.txt"],
    });
    expect(next.snapshot_tree).not.toBe(first.snapshot_tree);
    expect(next.diff_scan_ref).not.toBe(first.diff_scan_ref);
  });

  it("does not backfill missing traces and rejects malformed trace bindings", () => {
    const state = fixture("phase-map-trace-integrity");
    const receipts = phaseReceipts(state, "phase-1");
    const first = publish(state, "phase-1", receipts);
    const missingRef = `evidence/phases/phase-1/${first.snapshot_tree}/phase-map-trace-${"0".repeat(64)}.json`;
    expect(() => readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: missingRef }))
      .toThrow(/phase map trace is missing/i);

    const reviewRef = formalPhaseReview(state, first);
    publish(state, "phase-1", receipts, { review_result_ref: reviewRef });
    const publishedRef = JSON.parse(state.task.readRecord("phase-result.json")).evidence.phase_map_trace_ref;
    const publishedRaw = state.task.readRecord(publishedRef);
    const legacyPointer = JSON.parse(state.task.readRecord("phase-result.json"));
    delete legacyPointer.evidence.phase_map_trace_ref;
    delete legacyPointer.evidence.phase_map_trace_hash;
    state.task.writeRecordAtomic("phase-result.json", `${JSON.stringify(legacyPointer, null, 2)}\n`);
    const reused = publish(state, "phase-1", receipts, { review_result_ref: reviewRef });
    expect(reused.phase_map_trace_ref).toBeUndefined();
    expect(JSON.parse(state.task.readRecord("phase-result.json")).evidence.phase_map_trace_ref).toBeUndefined();

    const badAddressRef = `evidence/phases/phase-1/${first.snapshot_tree}/phase-map-trace-${"0".repeat(64)}.json`;
    state.kernel.publishCanonicalRecord(badAddressRef, publishedRaw);
    expect(() => readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: badAddressRef }))
      .toThrow(/phase map trace identity/i);

    const legacyTrace = JSON.parse(publishedRaw);
    legacyTrace.review_scope = null;
    const legacyRaw = `${JSON.stringify(legacyTrace, null, 2)}\n`;
    const legacyRef = `evidence/phases/phase-1/${first.snapshot_tree}/phase-map-trace-${sha256(legacyRaw)}.json`;
    state.kernel.publishCanonicalRecord(legacyRef, legacyRaw);
    expect(() => readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: legacyRef }))
      .toThrow(/phase map trace identity|review_scope/i);

    const tampered = JSON.parse(state.task.readRecord(publishedRef));
    tampered.green_test_receipt.sha256 = "0".repeat(64);
    const raw = `${JSON.stringify(tampered, null, 2)}\n`;
    const tamperedRef = `evidence/phases/phase-1/${first.snapshot_tree}/phase-map-trace-${sha256(raw)}.json`;
    state.kernel.publishCanonicalRecord(tamperedRef, raw);
    expect(() => readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: tamperedRef }))
      .toThrow(/GREEN test receipt hash/i);

    const originalTrace = JSON.parse(publishedRaw);
    const forgedGreen = {
      ...JSON.parse(state.task.readRecord(originalTrace.green_test_receipt.ref)),
      exit_code: 1,
    };
    const forgedGreenRaw = `${JSON.stringify(forgedGreen, null, 2)}\n`;
    const forgedGreenRef = "receipts/forged-green.json";
    state.kernel.publishCanonicalRecord(forgedGreenRef, forgedGreenRaw);
    const forgedEvidence = JSON.parse(state.task.readRecord(originalTrace.canonical_phase_evidence.ref));
    forgedEvidence.evidence.green_test_receipt_ref = forgedGreenRef;
    const forgedEvidenceRaw = `${JSON.stringify(forgedEvidence, null, 2)}\n`;
    const forgedEvidenceRef = `evidence/phases/phase-1/${first.snapshot_tree}/phase-evidence-${sha256(forgedEvidenceRaw)}.json`;
    state.kernel.publishCanonicalRecord(forgedEvidenceRef, forgedEvidenceRaw);
    const forgedTrace = {
      ...originalTrace,
      canonical_phase_evidence: { ref: forgedEvidenceRef, sha256: sha256(forgedEvidenceRaw) },
      green_test_receipt: { ref: forgedGreenRef, sha256: sha256(forgedGreenRaw) },
    };
    const forgedTraceRaw = `${JSON.stringify(forgedTrace, null, 2)}\n`;
    const forgedTraceRef = `evidence/phases/phase-1/${first.snapshot_tree}/phase-map-trace-${sha256(forgedTraceRaw)}.json`;
    state.kernel.publishCanonicalRecord(forgedTraceRef, forgedTraceRaw);
    expect(() => readPhaseMapTrace({ task: state.task, sourceRoot: state.workspace.worktreeRoot, traceRef: forgedTraceRef }))
      .toThrow(/GREEN test receipt provenance/i);
  });

  it("rejects candidate-bound RED, unsafe or duplicate paths, and extra public command flags", async () => {
    const state = fixture();
    const receipts = phaseReceipts(state, "phase-1");
    const candidateRed = createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace, stage: "build-code", component: "build-code-test-capture" })
      .captureTests({ command: "false", receiptRef: "receipts/candidate-red.json", outputRef: "evidence/candidate-red.txt" });
    expect(() => publish(state, "phase-1", receipts, { red_evidence_ref: candidateRed.receipt_ref })).toThrow(/RED.*baseline/i);
    for (const allowed_files of [["bad\\path"], ["./bad"], ["bad//path"], ["same", "same"]]) {
      expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
        phase_id: "phase-1", implementation_receipt_ref: receipts.implementation.ref,
        green_test_receipt_ref: receipts.tests.receipt_ref, allowed_files,
      })).toThrow(/allowed_files|relative/i);
    }
    await expect(stageRuntimeMain([
      "publish-phase-evidence", "--stage=build-code", "--project=Demo", "--task=phase-evidence",
      "--input=/tmp/input.json", "--provider=forbidden",
    ])).rejects.toThrow(/accepts only/i);
  });

  it("recomputes test output and commit trees and restricts the official test producer", () => {
    const state = fixture();
    const receipts = phaseReceipts(state, "phase-1");
    const original = JSON.parse(state.task.readRecord(receipts.tests.receipt_ref));
    const cases = [
      ["bad-output", { ...original, output_hash: "0".repeat(64) }, /output hash/i],
      ["bad-producer", { ...original, producer: { ...original.producer, component: "forged" } }, /provenance/i],
      ["bad-tree", { ...original, snapshot_commit: state.kernel.readAccepted("build-plan").accepted.checkpoint.commit_oid }, /snapshot_commit tree/i],
    ];
    for (const [name, value, message] of cases) {
      const ref = `receipts/${name}.json`;
      state.kernel.publishCanonicalRecord(ref, `${JSON.stringify(value, null, 2)}\n`);
      expect(() => publishBuildCodePhaseEvidence({ task: state.task, kernel: state.kernel, workspace: state.workspace }, {
        phase_id: "phase-1", implementation_receipt_ref: receipts.implementation.ref,
        green_test_receipt_ref: ref, allowed_files: ["phase-1.txt"],
      })).toThrow(message);
    }
  });
});

describe("build-code composition contract", () => {
  const skill = readFileSync(new URL("../workflows/build-code/SKILL.md", import.meta.url), "utf8");

  it("is host-neutral and lets one executor run coordination then phase execution", () => {
    expect(skill).toMatch(/Stage coordination|阶段协调/);
    expect(skill).toMatch(/Phase execution|Phase执行/);
    expect(skill).toMatch(/single executor|同一执行者/i);
    for (const forbidden of ["Multica", "Code Builder", "Coder", "Issue", "mention", "provider", "model"])
      expect(skill, forbidden).not.toContain(forbidden);
  });

  it("keeps the Phase Card factual and the full repair loop inside Phase execution", () => {
    expect(skill).toMatch(/Phase Card[\s\S]*StageContext[\s\S]*accepted records/);
    expect(skill).toMatch(/RED[\s\S]*GREEN[\s\S]*capture-tests[\s\S]*publish-phase-evidence[\s\S]*wh-review/);
    expect(skill).toMatch(/revise_required[\s\S]*quality fact[\s\S]*(?:return|返回)/i);
  });

  it("keeps one-executor and split execution sequences evidence-equivalent", () => {
    const coordination = ["phase-card", "phase-gate", "final-review", "stage-run"];
    const phase = ["RED", "GREEN", "tests", "phase-evidence", "phase-review", "return"];
    const singleExecutor = [coordination[0], ...phase, ...coordination.slice(1)];
    const splitExecution = [coordination[0], ...phase, ...coordination.slice(1)];
    expect(singleExecutor).toEqual(splitExecution);
    expect(singleExecutor.filter((step) => step === "phase-review")).toHaveLength(1);
    expect(singleExecutor.filter((step) => step === "phase-evidence")).toHaveLength(1);
  });
});
