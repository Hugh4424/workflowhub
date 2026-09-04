import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { assertFresh, evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { deriveStageOutcomeStatuses, isStageSnapshotCurrent } from "../../runtime/stage/completion-predicates.mjs";

const roots = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function store(raw = "{}") {
  const records = new Map([["evidence.json", raw]]);
  return {
    read(ref) {
      if (!records.has(ref)) {
        const error = new Error("missing");
        error.code = "ENOENT";
        throw error;
      }
      return records.get(ref);
    },
    records,
  };
}

describe("verify selects facts by freshness", () => {
  it("accepts a same-tree, same-byte binding", () => {
    const io = store("evidence");
    expect(assertFresh({ ref: "evidence.json", sha256: sha256("evidence"), snapshot_tree: "tree" }, {
      read: io.read,
      snapshotTree: "tree",
    })).toBe(true);
  });

  it("marks changed, missing, or tampered evidence stale", () => {
    const io = store("evidence");
    const base = {
      ref: "fact.json",
      sha256: sha256("evidence"),
      material_revision: "revision",
      snapshot_tree: "tree",
      task_id: "task",
      stage: "verify-code",
      kind: "test",
      subject: "tests",
      status: "passed",
      fact_id: "fact",
      evidence: [],
    };
    io.records.set("fact.json", JSON.stringify({ ...base, schema_version: "quality-fact.v1" }));
    expect(evaluateFactFreshness(base, { material_revision: "revision", snapshot_tree: "other" }, { read: io.read }).status).toBe("stale");
    expect(evaluateFactFreshness(base, { material_revision: "revision", snapshot_tree: "tree" }, { read: () => { const e = new Error("missing"); e.code = "ENOENT"; throw e; } }).status).toBe("missing");
  });

  it("keeps an upstream fact current when only downstream materials are added", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "scoped-make-decision-fact",
      task_id: "task",
      stage: "make-decision",
      material_revision: "revision-global-before",
      material_scope: ["decision-log.md"],
      material_scope_revision: "revision-decision-log",
      snapshot_tree: "tree",
      kind: "acceptance_criterion",
      subject: "scope",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-global-after-spec-plan",
      material_scope_revisions: { "make-decision": "revision-decision-log" },
      snapshot_tree: "tree",
    }, { read: io.read })).toMatchObject({ status: "current", authenticated: true });
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-global-after-decision-edit",
      material_scope_revisions: { "make-decision": "revision-decision-log-changed" },
      snapshot_tree: "tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps authoring-stage facts current when later materials or source bytes change, but keeps implementation stages source-bound", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-scope-")));
    roots.push(root);
    mkdirSync(join(root, "specs", "task"), { recursive: true });
    writeFileSync(join(root, "src.mjs"), "export const value = 1;\n");
    writeFileSync(join(root, "specs", "task", "decision-log.md"), "# decision\n");
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "add", "."], { cwd: root });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", "baseline"], { cwd: root });
    const before = captureGitWorktreeSnapshot(root, "task");
    writeFileSync(join(root, "specs", "task", "spec.md"), "# spec\n");
    writeFileSync(join(root, "specs", "task", "plan.md"), "# plan\n");
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n");
    const afterMaterials = captureGitWorktreeSnapshot(root, "task");
    expect(isStageSnapshotCurrent("make-decision", before.tree, afterMaterials.tree, { snapshotRoot: root, taskId: "task" })).toBe(true);
    writeFileSync(join(root, "src.mjs"), "export const value = 2;\n");
    const afterSource = captureGitWorktreeSnapshot(root, "task");
    expect(isStageSnapshotCurrent("make-decision", before.tree, afterSource.tree, { snapshotRoot: root, taskId: "task" })).toBe(true);
    expect(isStageSnapshotCurrent("build-code", before.tree, afterSource.tree, { snapshotRoot: root, taskId: "task" })).toBe(false);
  });

  it("projects an authoring-stage outcome as current when only downstream materials were added", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-outcome-scope-")));
    roots.push(root);
    mkdirSync(join(root, "specs", "task"), { recursive: true });
    writeFileSync(join(root, "specs", "task", "decision-log.md"), "# decision\n");
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "add", "."], { cwd: root });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", "baseline"], { cwd: root });
    const before = captureGitWorktreeSnapshot(root, "task");
    writeFileSync(join(root, "specs", "task", "spec.md"), "# spec\n");
    writeFileSync(join(root, "specs", "task", "plan.md"), "# plan\n");
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n");
    const afterMaterials = captureGitWorktreeSnapshot(root, "task");
    const runId = `vnext-${sha256(["task", "make-decision"].join(String.fromCharCode(0))).slice(0, 32)}`;
    const outcome = {
      schema_version: "workflowhub-stage-outcomes.v1",
      task_id: "task",
      stage: "make-decision",
      run_id: runId,
      status: "completed",
      attempt_id: "attempt-before-materials",
      producer: { kind: "stage-agent", host: "fixture", source_id: "fixture/agent", source_family: "fixture", agent_run_id: "attempt-before-materials" },
      snapshot_tree: before.tree,
      material_revision: "revision-before-materials",
      material_hashes: {},
      material_scope: ["decision-log.md"],
      material_scope_revision: "revision-decision-log",
      steps_manifest_ref: "workflows/make-decision/steps.json",
      steps_manifest_hash: "d".repeat(64),
      skills_manifest_ref: "workflows/make-decision/skill-deps.yaml",
      skills_manifest_hash: "e".repeat(64),
      step_outcomes: [],
      skill_outcomes: [],
    };
    const raw = `${JSON.stringify(outcome)}\n`;
    const ref = `quality/evidence/stage-outcomes/make-decision/${sha256(raw)}.json`;
    const statuses = deriveStageOutcomeStatuses({
      task_id: "task",
      read: (candidate) => candidate === ref ? raw : (() => { const error = new Error("missing"); error.code = "ENOENT"; throw error; })(),
      stage_outcome_refs: { "make-decision": [ref] },
      snapshot_tree: afterMaterials.tree,
      snapshot_root: root,
      authenticate: ({ value: candidate }) => candidate,
    });
    expect(statuses["make-decision"]).toBe("completed");
  });

  it("rejects a forged or narrowed material scope", () => {
    const revision = `revision-${"a".repeat(64)}`;
    expect(() => createQualityFact({
      taskId: "task",
      stage: "make-decision",
      materialRevision: revision,
      materialScope: ["spec.md"],
      materialScopeRevision: revision,
      snapshotTree: "tree",
      kind: "test",
      status: "passed",
      subject: "scope",
      evidence: [{ ref: "quality/evidence/test.json", sha256: "b".repeat(64), evidence_type: "test_receipt" }],
    })).toThrow(/fixed stage scope/i);
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "forged-scope-fact",
      task_id: "task",
      stage: "make-decision",
      material_revision: revision,
      material_scope: ["spec.md"],
      material_scope_revision: revision,
      snapshot_tree: "tree",
      kind: "test",
      subject: "scope",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: revision,
      material_scope_revisions: { "make-decision": revision },
      snapshot_tree: "tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps resolved review status scoped to verify-code code review", () => {
    expect(() => createQualityFact({
      taskId: "task",
      stage: "build-code",
      materialRevision: `revision-${"a".repeat(64)}`,
      snapshotTree: "b".repeat(40),
      kind: "review",
      status: "recorded",
      reviewStatus: "resolved",
      subject: "integration_review",
      evidence: [{ ref: "quality/reviews/results/review.json", sha256: "c".repeat(64), evidence_type: "review_result" }],
    })).toThrow(/only valid for verify-code code_review/);
  });

  it("rejects a v2 confirmation bound to a different material or snapshot", () => {
    const materialRevision = `revision-${"a".repeat(64)}`;
    const snapshotTree = "b".repeat(40);
    const confirmation = JSON.stringify({
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      material_revision: `revision-${"c".repeat(64)}`,
      snapshot_tree: "d".repeat(40),
      confirmed_at: "2026-08-04T00:00:00.000Z",
    });
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "fact",
      task_id: "task",
      stage: "verify-code",
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      kind: "confirmation",
      subject: "human_confirmation",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [{
        evidence_type: "human_confirmation",
        ref: "confirmation.json",
        sha256: sha256(confirmation),
      }],
    };
    const io = store();
    const factRaw = JSON.stringify({ ...fact, sha256: sha256(JSON.stringify(fact)) });
    io.records.set("fact.json", factRaw);
    io.records.set("confirmation.json", confirmation);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(factRaw) }, {
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps explicitly advisory early-stage review current after the task snapshot changes", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "advice-fact",
      task_id: "task",
      stage: "make-decision",
      material_revision: "revision-old",
      snapshot_tree: "old-tree",
      kind: "review",
      subject: "direction_review",
      status: "recorded",
      ref: "advice-fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new",
      snapshot_tree: "new-tree",
    }, { read: io.read })).toMatchObject({
      status: "current",
      dependencies: { material: "current", tree: "current", fact: "current" },
    });
  });

  it("does not keep required verify-code review current after the task snapshot changes", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "verify-review-fact",
      task_id: "task",
      stage: "verify-code",
      material_revision: "revision-old",
      snapshot_tree: "old-tree",
      kind: "review",
      subject: "code_review",
      status: "recorded",
      ref: "verify-review-fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new",
      snapshot_tree: "new-tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("replays a resolved repair disposition while retaining the reviewed snapshot", () => {
    const reviewedTree = "a".repeat(40);
    const currentTree = "b".repeat(40);
    const materialRevision = `revision-${"c".repeat(64)}`;
    const finding = {
      provider: "fixture",
      id: `F-${"d".repeat(12)}`,
      severity: "major",
      path: "runtime/example.mjs",
      issue: "fixture actionable finding",
      recommendation: "repair the fixture finding",
      root_cause: "fixture",
      providers: ["fixture"],
      adapter_count: 1,
      finding_count: 1,
      disposition: "actionable",
      evidence_status: "direct",
      provider_findings: [{
        provider: "fixture",
        adapter: "fixture",
        severity: "major",
        evidence_kind: "direct",
        evidence_anchor_valid: true,
      }],
    };
    const review = {
      version: "wh-review-result.v1",
      task_id: "task",
      stage: "verify-code",
      review_track: null,
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
      base_tree: reviewedTree,
      candidate_tree: reviewedTree,
      source: { target_commit: reviewedTree, base_commit: reviewedTree, base_tree: reviewedTree, captured_head: reviewedTree },
      snapshot_tree: reviewedTree,
      material_id: "e".repeat(64),
      material_revision: materialRevision,
      attempt_ref: "quality/reviews/attempts/fixture/attempt.json",
      provider_results: [{ provider: "fixture", output: { findings: [{ severity: "major", path: finding.path, issue: finding.issue, recommendation: finding.recommendation, root_cause: "fixture", evidence_kind: "direct", evidence: "fixture" }] } }],
      findings: [finding],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [{ ...finding, provider: undefined }] },
    };
    const reviewRaw = JSON.stringify(review);
    const fact = createQualityFact({
      taskId: "task",
      stage: "verify-code",
      materialRevision,
      snapshotTree: currentTree,
      kind: "review",
      status: "recorded",
      reviewStatus: "resolved",
      subject: "code_review",
      evidence: [{ ref: "quality/reviews/results/fixture.json", sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    });
    const io = store();
    io.records.set(fact.ref, fact.raw);
    io.records.set("quality/reviews/results/fixture.json", reviewRaw);
    expect(evaluateFactFreshness({ ...fact.value, ref: fact.ref, sha256: sha256(fact.raw) }, {
      material_revision: materialRevision,
      snapshot_tree: currentTree,
    }, { read: io.read })).toMatchObject({
      status: "current",
      authenticated: true,
      review_status: "resolved",
    });
  });

  it("keeps verify-code facts current when only the task execution-status block is written back", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-freshness-record-only-"));
    roots.push(root);
    const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    git(["init", "-q", "-b", "main"]);
    git(["config", "user.name", "WorkflowHub Tests"]);
    git(["config", "user.email", "tests@workflowhub.local"]);
    mkdirSync(join(root, "specs", "task"), { recursive: true });
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- old\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "base"]);
    const before = git(["rev-parse", "HEAD^{tree}"]);
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- new\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "record writeback"]);
    const after = git(["rev-parse", "HEAD^{tree}"]);
    const fact = {
      schema_version: "quality-fact.v1", fact_id: "verify-review-fact", task_id: "task",
      stage: "verify-code", material_revision: "revision-old", snapshot_tree: before,
      kind: "review", subject: "code_review", status: "recorded",
      ref: "fact.json", sha256: "", evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new", snapshot_tree: after,
    }, { read: io.read, workspaceRoot: root, taskId: "task" })).toMatchObject({
      status: "current",
      dependencies: { material: "current", tree: "current", fact: "current" },
    });
  });

  it("does not reuse an unregistered quality fact after the same writeback", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-freshness-unregistered-"));
    roots.push(root);
    const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    git(["init", "-q", "-b", "main"]);
    git(["config", "user.name", "WorkflowHub Tests"]);
    git(["config", "user.email", "tests@workflowhub.local"]);
    mkdirSync(join(root, "specs", "task"), { recursive: true });
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- old\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "base"]);
    const before = git(["rev-parse", "HEAD^{tree}"]);
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- new\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "record writeback"]);
    const after = git(["rev-parse", "HEAD^{tree}"]);
    const fact = {
      schema_version: "quality-fact.v1", fact_id: "unregistered-fact", task_id: "task",
      stage: "verify-code", material_revision: "revision-old", snapshot_tree: before,
      kind: "test", subject: "unregistered_quality", status: "passed",
      ref: "fact.json", sha256: "", evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new", snapshot_tree: after,
    }, { read: io.read, workspaceRoot: root, taskId: "task" })).toMatchObject({
      status: "stale",
      dependencies: { material: "stale", tree: "stale", fact: "current" },
    });
  });

  it("keeps build-code review freshness strict", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "implementation-review-fact",
      task_id: "task",
      stage: "build-code",
      material_revision: "revision-old",
      snapshot_tree: "old-tree",
      kind: "review",
      subject: "integration_review",
      status: "recorded",
      ref: "implementation-review-fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new",
      snapshot_tree: "new-tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("does not accept a receipt from another stage for build-code risk tests", () => {
    const snapshotTree = "b".repeat(40);
    const command = "npm test";
    const output = "pass\n";
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: "task",
      stage: "verify-code",
      producer: { stage: "verify-code", component: "verify-code-test-capture", version: "1.0.0" },
      command,
      command_hash: sha256(command),
      exit_code: 0,
      snapshot_tree: snapshotTree,
      output_ref: "quality/tests/output/verify-code.output",
      output_hash: sha256(output),
    };
    const receiptRaw = JSON.stringify(receipt);
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "fact",
      task_id: "task",
      stage: "build-code",
      material_revision: "revision",
      snapshot_tree: snapshotTree,
      kind: "test",
      subject: "risk_tests_fresh",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [{ ref: "receipt.json", sha256: sha256(receiptRaw), evidence_type: "test_receipt" }],
    };
    const factRaw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, factRaw);
    io.records.set("receipt.json", receiptRaw);
    io.records.set(receipt.output_ref, output);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(factRaw) }, {
      material_revision: fact.material_revision,
      snapshot_tree: snapshotTree,
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps a mini-task implementation review current across its trusted stage boundary", () => {
    const snapshotTree = "c".repeat(40);
    const review = {
      version: "wh-review-result.v1",
      task_id: "task",
      stage: "build-code",
      review_track: null,
      review_kind: "mini_task.implementation",
      subject_kind: "phase",
      phase_id: "mini-task-implementation",
      review_scope: "phase",
      base_tree: snapshotTree,
      candidate_tree: snapshotTree,
      source: { target_commit: "d".repeat(40), base_commit: "d".repeat(40), base_tree: snapshotTree, captured_head: "d".repeat(40) },
      snapshot_tree: snapshotTree,
      material_id: "e".repeat(64),
      attempt_ref: "quality/reviews/attempts/mini-task.json",
      provider_results: [{ provider: "fixture", output: { findings: [] } }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    };
    const reviewRaw = JSON.stringify(review);
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "mini-review-fact",
      task_id: "task",
      stage: "verify-code",
      material_revision: "revision",
      snapshot_tree: snapshotTree,
      kind: "review",
      subject: "independent_review",
      status: "recorded",
      ref: "fact.json",
      sha256: "",
      evidence: [{ ref: "quality/reviews/results/mini-task.json", sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    };
    const factRaw = JSON.stringify({ ...fact, schema_version: "quality-fact.v1" });
    const io = store();
    io.records.set("fact.json", factRaw);
    io.records.set("quality/reviews/results/mini-task.json", reviewRaw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(factRaw) }, {
      material_revision: fact.material_revision,
      snapshot_tree: snapshotTree,
    }, { read: io.read })).toMatchObject({
      status: "current",
      authenticated: true,
    });
  });

  it("marks e2e acceptance stale when a hash-correct nested execution stage is semantically incomplete", () => {
    const taskId = "nested-e2e-freshness";
    const materialRevision = `revision-${"a".repeat(64)}`;
    const snapshotTree = "b".repeat(40);
    const records = new Map();
    const put = (ref, value) => {
      const raw = `${JSON.stringify(value)}\n`;
      records.set(ref, raw);
      return { ref, sha256: sha256(raw) };
    };
    const executionStage = put("quality/evidence/stage-quality/build-code/acceptance-execution.json", {
      schema_version: "stage-quality-evidence.v1",
      task_id: taskId,
      stage: "build-code",
      subject: "acceptance_execution",
      status: "passed",
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      subject_fact: { status: "passed", detail: "hash-correct but no execution items", evidence_refs: [] },
    });
    const executionAcceptance = put("quality/evidence/acceptance/build-code/acceptance-execution.json", {
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "acceptance_execution",
      result: "pass",
      refs: [executionStage],
      snapshot_tree: snapshotTree,
      freshness: {
        status: "current",
        evaluated_at: "2026-08-31T00:00:00.000Z",
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
        evidence_freshness: [{ ...executionStage, status: "current" }],
      },
    });
    const e2eStage = put("quality/evidence/stage-quality/verify-code/e2e-acceptance.json", {
      schema_version: "stage-quality-evidence.v1",
      task_id: taskId,
      stage: "verify-code",
      subject: "e2e_acceptance",
      status: "passed",
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      subject_fact: {
        status: "passed",
        evidence_refs: [
          executionAcceptance,
          { ref: "quality/reviews/results/independent.json", sha256: "c".repeat(64) },
          { ref: "quality/confirmations/e2e.json", sha256: "d".repeat(64) },
        ],
      },
    });
    const e2eFactEvidence = put("quality/evidence/acceptance/verify-code/e2e-acceptance.json", {
      schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "e2e_acceptance",
      result: "pass",
      refs: [e2eStage],
      snapshot_tree: snapshotTree,
    });
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "quality-nested-e2e-freshness",
      task_id: taskId,
      stage: "verify-code",
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      kind: "acceptance_criterion",
      status: "passed",
      subject: "e2e_acceptance",
      recorded_at: "2026-08-31T00:00:00.000Z",
      evidence: [{ ...e2eFactEvidence, evidence_type: "acceptance_evidence" }],
    };
    const factRaw = `${JSON.stringify(fact)}\n`;
    records.set("quality/facts/e2e.json", factRaw);

    const result = evaluateFactFreshness({
      ...fact,
      ref: "quality/facts/e2e.json",
      sha256: sha256(factRaw),
    }, { material_revision: materialRevision, snapshot_tree: snapshotTree }, {
      read(ref) {
        if (!records.has(ref)) {
          const error = new Error("missing");
          error.code = "ENOENT";
          throw error;
        }
        return records.get(ref);
      },
    });
    expect(result.status).toBe("stale");
    expect(result.authenticated).toBe(false);
    expect(result.dependencies[`evidence:${e2eFactEvidence.ref}`]).toBe("stale");
  });
});
