import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { prepareDeliveryClosePlan } from "../../core/task-close.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { captureGitWorktreeSnapshot, materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { publishVerifySummary } from "../../runtime/evidence/quality-store.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function seedProductReleasePrerequisites({ task, kernel, artifacts, snapshot }) {
  const publishFixtureFact = (stage, kind, subject, status = "passed") => {
    const base = `quality/evidence/release-fixture/${stage}-${subject}`;
    let ref;
    let raw;
    let evidenceType;
    if (kind === "acceptance_criterion") {
      const nestedRef = `${base}-proof.json`;
      const nestedRaw = `${JSON.stringify({ schema_version: "workflowhub-release-fixture-proof.v1", task_id: task.identity.taskId, stage, subject, snapshot_tree: snapshot.tree })}\n`;
      kernel.publishCanonicalRecord(nestedRef, nestedRaw);
      ref = `${base}.json`;
      raw = `${JSON.stringify({
        schema_version: "acceptance-evidence.v1",
        acceptance_criterion_id: subject,
        result: status === "passed" ? "pass" : "fail",
        refs: [{ ref: nestedRef, sha256: sha256(nestedRaw) }],
        snapshot_tree: snapshot.tree,
        summary: { actual_outcome: status === "passed" ? "fixture passed" : "fixture failed" },
      })}\n`;
      evidenceType = "acceptance_evidence";
    } else if (kind === "test") {
      const outputRef = `quality/tests/output/release-fixture/${stage}-${subject}.output`;
      const outputRaw = status === "passed" ? "fixture passed\n" : "fixture failed\n";
      kernel.publishCanonicalRecord(outputRef, outputRaw);
      ref = `${base}.json`;
      const command = "true";
      raw = `${JSON.stringify({
        schema_version: "workflowhub-receipt.v1",
        task_id: task.identity.taskId,
        stage,
        producer: { stage, component: "build-code-test-capture", version: "fixture" },
        command,
        command_hash: sha256(command),
        exit_code: status === "passed" ? 0 : 1,
        snapshot_head: snapshot.head,
        snapshot_tree: snapshot.tree,
        snapshot_commit: snapshot.commit,
        output_ref: outputRef,
        output_hash: sha256(outputRaw),
      })}\n`;
      evidenceType = "test_receipt";
    } else {
      throw new Error(`unsupported release fixture fact kind: ${kind}`);
    }
    kernel.publishCanonicalRecord(ref, raw);
    kernel.publishVNextQualityFact(stage, {
      kind,
      status,
      subject,
      evidence: [{ ref, sha256: sha256(raw), evidence_type: evidenceType }],
    });
  };

  for (const subject of ["scope", "non_goals", "risks", "talk_clarify", "stage_end_spec_analyze", "finding_dispositions"]) {
    publishFixtureFact("make-decision", "acceptance_criterion", subject);
  }
  kernel.publishHumanConfirmation("make-decision", { decision: "accepted", subject_ref: "fixture/make-decision", reply_text: "fixture accepted make-decision", step_slug: "approve-decision" });
  for (const subject of ["zero_major_ambiguities", "stage_end_spec_analyze", "finding_dispositions"]) {
    publishFixtureFact("build-spec", "acceptance_criterion", subject);
  }
  for (const subject of ["fr_coverage", "ac_coverage", "dependencies", "deletion_proofs", "executable_tasks", "stage_end_spec_analyze", "finding_dispositions"]) {
    publishFixtureFact("build-plan", "acceptance_criterion", subject);
  }
  kernel.publishHumanConfirmation("build-plan", { decision: "accepted", subject_ref: "fixture/build-plan", reply_text: "fixture accepted build-plan", step_slug: "publish-plan-result" });
  publishFixtureFact("build-code", "test", "risk_tests_fresh");
  publishFixtureFact("build-code", "acceptance_criterion", "acceptance_criteria");
  publishFixtureFact("build-code", "acceptance_criterion", "stage_end_spec_analyze");
  publishFixtureFact("build-code", "acceptance_criterion", "finding_dispositions");
  const review = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: snapshot.tree, provider: "fixture", verdict: "pass" });
  const reviewRaw = task.readRecord(review.resultRef);
  kernel.publishVNextQualityFact("build-code", {
    kind: "review",
    status: "recorded",
    subject: "integration_review",
    evidence: [{ ref: review.resultRef, sha256: sha256(reviewRaw), evidence_type: "review_result" }],
  });

  const materialRevision = materialRevisionFromValues(
    ["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, artifacts.read(name)]),
  );
  const sourceDigest = "c".repeat(64);
  const acceptanceLeafRaw = `${JSON.stringify({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "AC-001",
    result: "pass",
    refs: [{ ref: "quality/evidence/release-fixture/ac-001-proof.json", sha256: sha256("ac-001-proof\n") }],
    snapshot_tree: snapshot.tree,
    source_digest: sourceDigest,
    summary: { actual_outcome: "fixture passed" },
  })}\n`;
  kernel.publishCanonicalRecord("quality/evidence/release-fixture/ac-001-leaf.json", acceptanceLeafRaw);
  kernel.publishCanonicalRecord("quality/evidence/release-fixture/ac-001-proof.json", "ac-001-proof\n");
  publishVerifySummary(task.taskPath, {
    status: "passed",
    source_digest: sourceDigest,
    material_digest: materialRevision.slice("revision-".length),
    material_revision: materialRevision,
    snapshot_tree: snapshot.tree,
    criteria: [{
      acceptance_criterion_id: "AC-001",
      result: "pass",
      source_digest: sourceDigest,
      acceptance_leaf: { ref: "quality/evidence/release-fixture/ac-001-leaf.json", sha256: sha256(acceptanceLeafRaw) },
      nested_evidence: [{ ref: "quality/evidence/release-fixture/ac-001-proof.json", sha256: sha256("ac-001-proof\n") }],
      scenario: "执行当前夹具并读取结果",
      oracle: "结果状态为通过",
      actual_outcome: "当前夹具结果为通过",
      evidence_type: "fixture",
      coverage_limits: ["仅覆盖当前夹具"],
      exceptions: ["无"],
      implementation_anchor: { id: "fixture-implementation", path: "src/app.txt", start_line: 1, end_line: 1, role: "implementation" },
      verification_anchor: { id: "fixture-verification", path: "tests/fixture.test.mjs", start_line: 1, end_line: 1, role: "verification" },
    }],
  });
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture({ testVariant = "valid", reviewStatus = "recorded", reviewDisposition = undefined, reviewVerdict = "pass", reviewFindingSeverity = "major", acceptanceResult = "pass", duplicateHumanConfirmation = false, materialOnlyWriteback = false, omitSubjects = [], nestedAcceptanceVariant = "valid", nonterminalAttempt = false, crossStageIntegrationReview = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-vnext-delivery-close-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo);
  mkdirSync(bare);
  const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base-2"]);
  git(bare, ["init", "--bare", "-q"]);
  git(repo, ["remote", "add", "origin", bare]);
  git(repo, ["push", "-q", "origin", "main"]);
  const taskId = "vnext-delivery-close";
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId,
    created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
    record_model: "vnext-single-write",
  } });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidate = prepareTaskWorkspace(task);
  const worktreeRoot = candidate.worktreeRoot;
  const artifacts = ArtifactDir.open(worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  if (testVariant === "clean-head") {
    git(worktreeRoot, ["add", "specs"]);
    git(worktreeRoot, ["commit", "-qm", "publish current materials"]);
  }
  const kernel = testVariant === "clean-head"
    ? createTaskKernel(task, { workspace: openCurrentTaskWorkspace(task), artifacts })
    : createTaskKernel(task, { candidateWorkspace: candidate });
  const snapshot = captureGitWorktreeSnapshot(worktreeRoot);
  const evidenceRawFor = (subject, tree) => {
    if (subject === "human_confirmation") {
      return `${JSON.stringify({ schema_version: "human-confirmation.v2", task_id: taskId, stage: "verify-code", decision: "accepted", subject_ref: "verify-code", snapshot_tree: tree })}\n`;
    }
    const nestedRef = `quality/evidence/verify-code/stage-quality-${subject}.json`;
    const nestedValue = {
      schema_version: "stage-quality-evidence.v1", task_id: nestedAcceptanceVariant === "wrong-task" ? "other-task" : taskId, stage: "verify-code", subject,
      status: "passed", snapshot_tree: tree,
      subject_fact: {
        status: "passed",
        detail: "fixture",
        evidence_refs: nestedAcceptanceVariant === "missing-subject-evidence"
          ? []
          : [{ ref: testRef, sha256: sha256(testRaw) }],
        ...(subject === "finding_dispositions" ? { disposition_items: [], source_review_refs: [], risk_acceptance_refs: [] } : {}),
      },
    };
    const nestedRaw = `${JSON.stringify(nestedValue)}\n`;
    kernel.publishCanonicalRecord(nestedRef, nestedRaw);
    return `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: subject, result: acceptanceResult, refs: [{ ref: nestedRef, sha256: sha256(nestedRaw) }], snapshot_tree: tree, summary: { actual_outcome: acceptanceResult === "pass" ? "passed" : "failed", evidence_type: "stage quality fact" } })}\n`;
  };
  const reviewRawFor = (subject, tree) => `${JSON.stringify({
    version: "wh-review-result.v1", task_id: taskId, stage: "verify-code", review_track: null,
    review_kind: null, subject_kind: "worktree", phase_id: null, review_scope: null,
    source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: tree, captured_head: snapshot.head },
    snapshot_tree: tree, material_id: "b".repeat(64),
    attempt_ref: `quality/reviews/attempts/${subject}.json`,
    provider_results: [{ provider: "fixture", output: { findings: [] } }], findings: [],
    adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
  })}\n`;
  const testRef = "quality/tests/verify-code.json";
  const testStage = testVariant === "focused-build-receipt" ? "build-code" : "verify-code";
  const testComponent = testVariant === "focused-build-receipt"
    ? "focused-test-capture"
    : testVariant === "focused-mini-receipt"
      ? "mini-task-focused-tests"
      : `${testStage}-test-capture`;
  const testValue = {
    schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: testStage,
    producer: { stage: testStage, component: testComponent, version: "1.0.0" },
    command: "npm test", command_hash: sha256("npm test"), exit_code: 0,
    snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
    source_digest: snapshot.source_digest,
    started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z",
    output_ref: "quality/tests/output/verify-code.output", output_hash: sha256("pass\n"),
  };
  if (testVariant === "failed-receipt") testValue.exit_code = 1;
  if (testVariant === "clean-head") testValue.snapshot_commit = snapshot.head;
  if (testVariant === "tree-mismatch") testValue.snapshot_tree = "0".repeat(40);
  if (testVariant === "commit-mismatch") testValue.snapshot_commit = snapshot.head;
  if (testVariant === "extra-parent") {
    const alternateParent = git(repo, ["rev-parse", `${snapshot.head}^`]);
    testValue.snapshot_commit = git(repo, ["commit-tree", snapshot.tree, "-p", snapshot.head, "-p", alternateParent], {
      env: { ...process.env, GIT_AUTHOR_NAME: "WorkflowHub Tests", GIT_AUTHOR_EMAIL: "tests@workflowhub.local", GIT_COMMITTER_NAME: "WorkflowHub Tests", GIT_COMMITTER_EMAIL: "tests@workflowhub.local" },
    });
  }
  const testRaw = `${JSON.stringify(testValue, null, 2)}\n`;
  kernel.publishCanonicalRecord("quality/tests/output/verify-code.output", "pass\n");
  if (testVariant !== "missing") kernel.publishCanonicalRecord(testRef, testRaw);
  const testEvidence = { ref: testRef, sha256: sha256(testRaw), evidence_type: "test_receipt" };
  kernel.publishVNextQualityFact("verify-code", { kind: "test", status: "passed", subject: "full_tests_fresh", evidence: [testEvidence] });
  for (const subject of ["code_review"]) {
    if (omitSubjects.includes(subject)) continue;
    const review = writeFormalReviewFixture({
      task,
      stage: crossStageIntegrationReview && subject === "same_build_integration_review" ? "build-code" : "verify-code",
      snapshotTree: snapshot.tree,
      provider: "fixture",
      verdict: reviewVerdict,
      findingSeverity: reviewFindingSeverity,
    });
    const ref = nonterminalAttempt ? review.attemptRef : review.resultRef;
    const raw = task.readRecord(ref);
    kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: reviewStatus, subject: "code_review",
      ...(reviewDisposition === undefined ? {} : { review_status: reviewDisposition }),
      evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }],
    });
  }
  for (const [subject, kind, evidenceType] of [
    ["finding_dispositions", "acceptance_criterion", "acceptance_evidence"],
    ["acceptance_criteria", "acceptance_criterion", "acceptance_evidence"],
    ["exceptions", "acceptance_criterion", "acceptance_evidence"],
    ["human_confirmation", "confirmation", "human_confirmation"],
  ]) {
    if (omitSubjects.includes(subject)) continue;
    if (subject === "human_confirmation") {
      kernel.publishHumanConfirmation("verify-code", { decision: "accepted", subject_ref: "verify-code", reply_text: "fixture accepted verify-code", step_slug: "approve-verification" });
      continue;
    }
    const ref = `quality/evidence/verify-code/${subject}.json`;
    const raw = evidenceRawFor(subject, snapshot.tree);
    kernel.publishCanonicalRecord(ref, raw);
    kernel.publishVNextQualityFact("verify-code", {
      kind, status: "passed", subject,
      evidence: [{ ref, sha256: sha256(raw), evidence_type: evidenceType }],
    });
  }
  if (duplicateHumanConfirmation) {
    if (!omitSubjects.includes("human_confirmation")) {
      kernel.publishHumanConfirmation("verify-code", { decision: "accepted", subject_ref: "verify-code-old", reply_text: "fixture accepted verify-code old", step_slug: "approve-verification" });
      kernel.publishHumanConfirmation("verify-code", { decision: "accepted", subject_ref: "verify-code-new", reply_text: "fixture accepted verify-code new", step_slug: "approve-verification" });
    }
  }
  seedProductReleasePrerequisites({ task, kernel, artifacts, snapshot });
  const receiptSnapshot = { ...snapshot, commit: testValue.snapshot_commit };
  if (materialOnlyWriteback) {
    artifacts.writeAtomic("tasks.md", `${artifacts.read("tasks.md")}\n### 执行状态填写区\n- result written back\n`);
    const current = captureGitWorktreeSnapshot(worktreeRoot);
    return { task, kernel, repo, taskId, candidate, artifacts, receiptSnapshot, snapshot: current };
  }
  return { task, kernel, repo, taskId, candidate, artifacts, receiptSnapshot, snapshot };
}

describe("vNext formal delivery close", () => {
  it("will be extended by P3 RED coverage for mini-task/A resume without changing the existing close contract", () => {
    expect(prepareDeliveryClosePlan).toBeTypeOf("function");
  });

  it("accepts an empty current review without creating a retry requirement", () => {
    const state = fixture();
    const targetBaseline = execFileSync("git", ["rev-parse", "refs/heads/main"], { cwd: state.repo, encoding: "utf8" }).trim();
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery).toMatchObject({
      task_commit: state.snapshot.commit, target_baseline: targetBaseline, remote_target_baseline: targetBaseline,
    });
  });

  it("materializes a dirty delivery snapshot for a fresh close process", () => {
    const state = fixture();
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "GIT_ALTERNATE_OBJECT_DIRECTORIES"));
    const check = spawnSync("git", ["cat-file", "-e", `${result.plan.delivery.task_commit}^{commit}`], {
      cwd: state.repo,
      env: cleanEnv,
      encoding: "utf8",
    });
    expect(check.status).toBe(0);
  });

  it("rejects execution sidecars before checking source worktree cleanliness", () => {
    const state = fixture();
    mkdirSync(join(state.candidate.worktreeRoot, "quality", "tests"), { recursive: true });
    writeFileSync(join(state.candidate.worktreeRoot, "quality", "tests", "stage-fact.json"), "{}\n");
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*quality\/tests\/stage-fact\.json.*publish/i);
  });

  it("accepts the verify-code code-review fact without a second integration review", () => {
    const state = fixture({ crossStageIntegrationReview: true, reviewDisposition: "clean" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/verify-code freshness/),
    ]));
  });

  it("does not let an unavailable current code review reach the close consumer", () => {
    const state = fixture({ reviewStatus: "unavailable" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/current verify-code quality facts are incomplete:.*code_review/),
    ]));
  });

  it("rejects a non-terminal code-review attempt used as a non-recorded quality fact", () => {
    const state = fixture({ reviewStatus: "failed", nonterminalAttempt: true });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/unavailable terminal fact/),
    ]));
  });

  it("accepts a clean task-head snapshot commit", () => {
    const state = fixture({ testVariant: "clean-head" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.head, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.task_commit).toBe(state.snapshot.head);
  });

  it("does not reuse a quality fact after a material-only writeback", () => {
    const state = fixture({ materialOnlyWriteback: true });
    expect(state.snapshot.tree).not.toBe(state.receiptSnapshot.tree);
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/current verify-code quality facts are incomplete|material/i),
    ]));
  });

  it("selects the uniquely latest current quality fact after a retry", () => {
    const state = fixture({ duplicateHumanConfirmation: true });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/current verify-code quality facts conflict: human_confirmation/),
    ]));
  });

  it("ignores unrelated legacy quality references during code-review close", () => {
    const state = fixture();
    state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: "recorded", subject: "legacy_independent_review",
      evidence: [{ ref: "quality/", sha256: "a".repeat(64), evidence_type: "review_result" }],
    });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.task_commit).toBe(state.snapshot.commit);
  });

  it("does not treat a failed review fact as a formal close fact", () => {
    const state = fixture({ reviewStatus: "failed" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/code_review/),
    ]));
  });

  it("does not let a recorded verify-code review with open findings satisfy close", () => {
    const state = fixture({ reviewVerdict: "findings" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/code_review/),
    ]));
  });

  it("keeps nonblocking minor review advice visible in close quality gaps", () => {
    const state = fixture({ reviewVerdict: "findings", reviewFindingSeverity: "minor" });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/verify-code freshness: .*code_review/),
    ]));
  });

  it("reads an unavailable code-review disclosure and reports the missing close fact", () => {
    const state = fixture({ omitSubjects: ["code_review"] });
    const ref = "quality/evidence/stage-quality-missing/verify-code/code_review-test.json";
    const raw = `${JSON.stringify({
      schema_version: "stage-quality-missing.v1",
      task_id: state.taskId,
      stage: "verify-code",
      subject: "code_review",
      status: "missing",
      snapshot_tree: state.snapshot.tree,
      reason: "the independent review execution was unavailable",
    }, null, 2)}\n`;
    state.kernel.publishCanonicalRecord(ref, raw);
    state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review", status: "missing", subject: "code_review",
      evidence: [{ ref, sha256: sha256(raw), evidence_type: "review_result" }],
    });
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/current verify-code quality facts are incomplete:.*code_review/),
    ]));
  });

  it("accepts the canonical recorded status used by review quality facts", () => {
    const state = fixture({ reviewStatus: "recorded" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("ignores acceptance-result variants because close consumes the code review only", () => {
    const state = fixture({ acceptanceResult: "fail" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("ignores detached legacy acceptance evidence during code-review close", () => {
    const state = fixture({ nestedAcceptanceVariant: "wrong-task" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("ignores legacy acceptance wrappers without underlying evidence", () => {
    const state = fixture({ nestedAcceptanceVariant: "missing-subject-evidence" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it.each(["code_review"])(
    "keeps close preparation usable when the formal code-review fact is missing: %s",
    (subject) => {
      const state = fixture({ omitSubjects: [subject] });
      const result = prepareDeliveryClosePlan({
        task: state.task,
        kernel: state.kernel,
        delivery: {
          remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
          task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
          spec_archive_path: `specs/archive/${state.taskId}`,
        },
      });
      expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
        expect.stringMatching(new RegExp(subject)),
      ]));
      expect(result.plan.delivery.quality_status).toBe("incomplete");
      expect(result.plan.delivery.close_mode).toBe("ordinary");
    },
  );

  it.each(["missing", "tree-mismatch", "commit-mismatch", "extra-parent", "failed-receipt"])("ignores verify test snapshot variants: %s", (testVariant) => {
    const state = fixture({ testVariant });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("does not require a verify-code full-test receipt", () => {
    const state = fixture({ testVariant: "focused-build-receipt" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("does not let a mini-task receipt become a code-review prerequisite", () => {
    const state = fixture({ testVariant: "focused-mini-receipt" });
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    })).not.toThrow();
  });

  it("rejects a mini-task quality intent whose kind does not match its subject", () => {
    const state = fixture();
    const nestedRef = "quality/evidence/mini-task-quality/nested.json";
    const nestedRaw = "nested evidence\n";
    state.kernel.publishCanonicalRecord(nestedRef, nestedRaw);
    const materialRevision = materialRevisionFromValues(
      ["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, state.artifacts.read(name)]),
    );
    const value = {
      schema_version: "workflowhub-mini-task-quality-evidence.v1",
      task_id: state.task.identity.taskId,
      stage: "verify-code",
      material_revision: materialRevision,
      snapshot_tree: state.snapshot.tree,
      kind: "confirmation",
      status: "passed",
      subject: "full_tests_fresh",
      evidence: [{ ref: nestedRef, sha256: sha256(nestedRaw), evidence_type: "test_receipt" }],
    };
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    state.kernel.publishCanonicalRecord(`quality/evidence/mini-task-quality/${sha256(raw)}.json`, raw);
    const result = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      allowMiniTaskFocused: true,
      delivery: {
        remote: "origin", task_branch: `task/WorkflowHub/${state.taskId}`, target_branch: "main",
        task_commit: state.snapshot.commit, spec_source_path: `specs/${state.taskId}`,
        spec_archive_path: `specs/archive/${state.taskId}`,
      },
    });
    expect(result.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/MINI_TASK_QUALITY_INVALID/),
    ]));
  });
});
