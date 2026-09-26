import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, writeStageRow } from "../../runtime/task/task-store.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const hex = "a".repeat(64);
const base = {
  taskId: "post-task",
  stage: "build-plan",
  materialRevision: `revision-${hex}`,
  materialScopeRevision: `revision-${hex}`,
  snapshotTree: "tree",
  kind: "acceptance_criterion",
  status: "passed",
  subject: "dependencies",
  evidence: [{ ref: "quality/evidence/test.json", sha256: hex, evidence_type: "acceptance_evidence" }],
};

describe("post quality fact material scope", () => {
  it("accepts the full contiguous Phase scope", () => {
    const fact = createQualityFact({
      ...base,
      materialScope: ["decision-log.md", "spec.md", "phases/index.md", "phases/P1.md", "phases/P2.md"],
    });
    expect(fact.value.material_scope).toHaveLength(5);
  });

  it("rejects a missing Phase or a shortened post scope", () => {
    expect(() => createQualityFact({
      ...base,
      materialScope: ["decision-log.md", "spec.md", "phases/index.md", "phases/P2.md"],
    })).toThrow(/cohort stage scope/);
    expect(() => createQualityFact({
      ...base,
      materialScope: ["decision-log.md", "spec.md", "phases/index.md"],
    })).toThrow(/cohort stage scope/);
  });

  it("preserves the pre cohort fixed scope", () => {
    const fact = createQualityFact({
      ...base,
      materialScope: ["decision-log.md", "spec.md", "plan.md", "tasks.md"],
    });
    expect(fact.value.material_scope).toEqual(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
  });
});

async function phaseReviewFact(reviewPhaseId, { cursorPhaseId = "P5", staleCursor = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase-review-binding-")));
  try {
    const repo = join(root, "repo");
    mkdirSync(repo);
    for (const args of [
      ["init", "-q"], ["config", "user.name", "WorkflowHub Tests"],
      ["config", "user.email", "tests@workflowhub.local"],
    ]) execFileSync("git", args, { cwd: repo });
    writeFileSync(join(repo, "README.md"), "phase review fixture\n");
    execFileSync("git", ["add", "."], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: `phase-review-${randomUUID()}`,
      created_at: "2026-09-25T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write", activation_cohort: "post",
    } });
    initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
    const candidateWorkspace = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
    artifacts.writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
    artifacts.writeAtomic("spec.md", "# Spec\n\n- **FR-001**：Phase review identity.\n- [ ] **AC-001**：Current Phase is reviewed.\n");
    artifacts.writeAtomic("phases/index.md", `# Phase index\n\n## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n${[1, 2, 3, 4, 5].map((n) => `| \`P${n}\` | \`phases/P${n}.md\` |`).join("\n")}\n`);
    for (const n of [1, 2, 3, 4, 5]) artifacts.writeAtomic(`phases/P${n}.md`, `# Phase P${n}\n\n### T001 — Review\n`);
    const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
    if (cursorPhaseId !== null) {
      writeStageRow(task.taskPath, {
        stage: "build-code", source: "test-phase-progress",
        phase_progress: { phase_id: cursorPhaseId, task_id: "T001",
          material_revision: staleCursor ? `revision-${"b".repeat(64)}` : kernel.currentVNextMaterialRevision(),
          recorded_at: "2026-09-25T00:00:00.000Z" },
      });
    }
    const recorded = await recordSimpleReviewRequest({
      task, kernel,
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: reviewPhaseId,
        host_provider: "codex/luna", materials: { implementation: "reviewed current diff" } },
      resolveRouteIdentity: () => ({ route_identity: hex }),
      runRound: async (request) => ({
        status: "available", stage: "build-code", review_track: null, review_kind: null,
        subject_kind: "phase", phase_id: request.phase_id, review_scope: "phase",
        material_id: createSimpleReviewPacket(request).material_id, runtime_id: "phase-review-fixture", outcome: "completed",
        ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
        findings: [], provider_results: [{ provider: "codex/luna", status: "completed",
          identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
          error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
          evidence_anchor_valid: [] }],
      }),
    });
    const result = await runOfficialStage("build-code", {
      stage: "build-code", task, kernel, identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-code"),
      manifest: task.manifest, candidateWorkspace, artifacts,
    }, { receipts: { review: recorded.result_ref } });
    return result.quality_fact_refs.map((ref) => JSON.parse(task.readRecord(ref)))
      .find((fact) => fact.subject === "phase_review");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("post phase review current identity", () => {
  it("rejects an authenticated P3 review with a current P5 cursor", async () => {
    expect(await phaseReviewFact("P3", { cursorPhaseId: "P5" })).toMatchObject({ status: "missing" });
  });

  it.each([
    ["missing", { cursorPhaseId: null }],
    ["stale", { cursorPhaseId: "P5", staleCursor: true }],
  ])("rejects an authenticated P5 review with a %s cursor", async (_label, cursor) => {
    expect(await phaseReviewFact("P5", cursor)).toMatchObject({ status: "missing" });
  });

  it("records the authenticated P5 review with a current P5 cursor", async () => {
    expect(await phaseReviewFact("P5", { cursorPhaseId: "P5" }))
      .toMatchObject({ status: "recorded", review_status: "clean" });
  });
});
