import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { freezeReviewMaterial, readFrozenReviewMaterial } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { interactionAggregateMachineGateDiagnostic } from "../../runtime/stage/stage-handlers.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-card01-zero-gate-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: "card-01-zero-gate",
      created_at: "2026-09-20T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  return { task, kernel: createTaskKernel(task, { candidateWorkspace: candidate }), candidate, artifacts };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("CARD-01 zero machine gate advancement", () => {
  it("freezes the plan's five families and eighteen concrete predicates, not a made-up count of twenty-four", () => {
    const plan = readFileSync("specs/workflowhub-thin-core-card-01-20260919/plan.md", "utf8");
    const predicateIds = [
      "outcome_receipt_hash_mismatch",
      "human_confirmation_hash_mismatch",
      "aggregate_snapshot_stale",
      "aggregate_decision_unbound",
      "aggregate_decision_revision_stale",
      "interaction_aggregate_unbound",
      "frozen_review_material_hash_mismatch",
      "frozen_review_material_content_hash_mismatch",
      "evidence_ref_hash_mismatch",
      "acceptance_evidence_hash_mismatch",
      "receipt_namespace_violation",
      "receipt_missing",
      "receipt_schema_version_mismatch",
      "receipt_producer_stage_mismatch",
      "receipt_producer_component_unofficial",
      "receipt_task_mismatch",
      "receipt_stage_mismatch",
      "step_outcome_coverage_incomplete",
    ];
    expect(predicateIds).toHaveLength(18);
    for (const id of predicateIds) expect(plan).toContain(id);
    expect(plan).toContain("18 个谓词站点 / 5 族");
    expect(plan).toContain("24 ↔ 18 显式映射");
  });

  it("keeps a frozen review-material hash mismatch visible without treating corrupted bytes as valid", () => {
    const { task } = fixture();
    const frozen = freezeReviewMaterial({ task, bytes: "original review input" });
    const tampered = "tampered review input";
    writeFileSync(task.recordPath(frozen.ref), tampered);

    const observed = readFrozenReviewMaterial({ task, ...frozen });
    expect(observed).toMatchObject({
      status: "unavailable",
      diagnostic: { id: "frozen_review_material_hash_mismatch", status: "invalid" },
    });
    expect(task.readRecord(frozen.ref)).toBe(tampered);
    expect(observed).not.toHaveProperty("bytes");
  });

  it("turns stale interaction aggregation into a retained diagnostic instead of a make-decision work permit", () => {
    const { kernel } = fixture();
    const observed = kernel.observeMakeDecisionInteractionPublication({
      snapshot_tree: "f".repeat(40),
      decision: {},
    });
    expect(observed).toMatchObject({
      status: "unavailable",
      diagnostic: { id: "aggregate_snapshot_stale", status: "invalid" },
    });
    expect(observed.value).toBeNull();
  });

  it("retains a malformed interaction aggregate as an unbound diagnostic instead of throwing", () => {
    const { kernel } = fixture();
    const observed = kernel.observeMakeDecisionInteractionPublication({ aggregate: {} });
    expect(observed).toMatchObject({
      status: "unavailable",
      diagnostic: { id: "interaction_aggregate_unbound", status: "invalid" },
    });
    expect(observed.value).toBeNull();
  });

  it("demotes only a structured interaction aggregate diagnostic", () => {
    const declared = new Error("MATERIAL_INCOMPLETE: interaction aggregate is malformed");
    Object.defineProperty(declared, "machine_gate_diagnostic_id", { value: "interaction_aggregate_unbound" });
    expect(interactionAggregateMachineGateDiagnostic(declared)).toMatchObject({ id: "interaction_aggregate_unbound", status: "invalid" });
    expect(interactionAggregateMachineGateDiagnostic(new Error("unexpected interaction aggregate storage failure"))).toBeNull();
    expect(interactionAggregateMachineGateDiagnostic(Object.assign(new Error("missing record"), { code: "ENOENT" }))).toBeNull();
  });

  it("retains an invalid interaction confirmation binding as a machine diagnostic", () => {
    const { kernel, artifacts } = fixture();
    const snapshot = kernel.currentVNextSnapshot();
    const revision = kernel.currentVNextMaterialRevision();
    const decision = artifacts.read("decision-log.md");
    const observed = kernel.observeMakeDecisionInteractionPublication({
      snapshot_tree: snapshot.tree,
      decision: {
        ref: artifacts.reference("decision-log.md"),
        hash: sha256(decision),
        revision,
      },
      confirmation: {
        ref: `quality/confirmations/${"a".repeat(64)}.json`,
        hash: "a".repeat(64),
        result: "accepted",
      },
    });
    expect(observed).toMatchObject({
      status: "unavailable",
      diagnostic: { id: "human_confirmation_hash_mismatch", status: "invalid" },
    });
    expect(observed.value).toBeNull();
  });

  it("does not downgrade a physically unreadable current material into a machine-binding diagnostic", () => {
    const { kernel, artifacts } = fixture();
    rmSync(artifacts.path("decision-log.md"));
    expect(() => kernel.observeMakeDecisionInteractionPublication({ snapshot_tree: kernel.currentVNextSnapshot().tree, decision: {} }))
      .toThrow(/ENOENT|no such file|missing/i);
  });

  it("lets the real make-decision entry continue and publish the stale aggregate as an unavailable fact", async () => {
    const { task, kernel, candidate, artifacts } = fixture();
    const result = await runOfficialStage("make-decision", {
      stage: "make-decision",
      task,
      kernel,
      identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("make-decision"),
      manifest: task.manifest,
      candidateWorkspace: candidate,
      artifacts,
    }, {
      interaction_aggregate: { snapshot_tree: "f".repeat(40), decision: {} },
    });
    expect(result.stage).toBe("make-decision");
    expect(result.machine_gate_diagnostic_refs).toHaveLength(1);
    const [diagnostic] = result.machine_gate_diagnostic_refs.map(({ ref }) => JSON.parse(task.readRecord(ref)));
    expect(diagnostic).toMatchObject({ id: "aggregate_snapshot_stale", status: "invalid" });
    expect(result.quality_fact_refs.length).toBeGreaterThan(0);
  });

  it("does not consume a missing supplied interaction receipt as a progress gate", async () => {
    const { task, kernel, candidate, artifacts } = fixture();
    const result = await runOfficialStage("make-decision", {
      stage: "make-decision",
      task,
      kernel,
      identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("make-decision"),
      manifest: task.manifest,
      candidateWorkspace: candidate,
      artifacts,
    }, {
      receipts: { interaction: `quality/evidence/interactions/${"0".repeat(64)}.json` },
    });
    const [diagnostic] = result.machine_gate_diagnostic_refs.map(({ ref }) => JSON.parse(task.readRecord(ref)));
    expect(diagnostic).toMatchObject({ id: "interaction_aggregate_unbound", status: "invalid" });
    expect(result.work_status).toBeTruthy();
  });

  it("demotes a top-level non-object supplied interaction receipt without masking real I/O failures", async () => {
    const { task, kernel, candidate, artifacts } = fixture();
    const raw = "null\n";
    const ref = `quality/evidence/interactions/${sha256(raw)}.json`;
    task.createRecordAtomic(ref, raw);
    const result = await runOfficialStage("make-decision", {
      stage: "make-decision",
      task,
      kernel,
      identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("make-decision"),
      manifest: task.manifest,
      candidateWorkspace: candidate,
      artifacts,
    }, {
      receipts: { interaction: ref },
    });
    const [diagnostic] = result.machine_gate_diagnostic_refs.map(({ ref: diagnosticRef }) => JSON.parse(task.readRecord(diagnosticRef)));
    expect(diagnostic).toMatchObject({ id: "interaction_aggregate_unbound", status: "invalid" });
    expect(result.work_status).toBeTruthy();
  });

  it("retains the real outline_closed=missing quality fact rather than changing it to passed", () => {
    const source = readFileSync("runtime/stage/stage-handlers.mjs", "utf8");
    expect(source).toMatch(/outline_closed:\s*subjectFact\(\s*convergence\.facts\.outline_closed/s);
    expect(source).not.toMatch(/outline_closed:\s*subjectFact\(\s*["']passed["']/s);
  });
});
