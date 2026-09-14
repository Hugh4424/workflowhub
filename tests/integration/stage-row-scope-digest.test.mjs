import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, readTaskFacts } from "../../runtime/task/task-store.mjs";
import { authenticateStageOutcomeForProjection, runStageEndReflection } from "../../runtime/stage/stage-runner.mjs";
import { stageMaterialScopeRevision } from "../../runtime/stage/completion-predicates.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const NOW = "2026-09-10T00:00:00.000Z";
const HASH = "a".repeat(64);
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];

function stageState(stage) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-row-scope-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub stage row scope tests"]);
  git(["config", "user.email", "stage-row-scope@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "stage row scope fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "StageRowScope", task_id: `stage-row-scope-${stage}`,
      created_at: NOW, target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const [name, content] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => NOW });
  const context = {
    stage, task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId(stage), candidateWorkspace, artifacts, storageRoot: root,
  };
  const outcome = writeStageOutcomeFixture({
    task, kernel, artifacts, workspace: candidateWorkspace, stage, attemptId: `stage-row-scope-${stage}`,
  });
  const source = authenticateStageOutcomeForProjection(context, stage, outcome.ref);
  return { root, task, kernel, artifacts, candidateWorkspace, context, source };
}

function judgmentFor(state) {
  const { context, source } = state;
  return {
    schema_version: "stage-reflection.v2",
    record_kind: "judgment",
    task_id: context.identity.taskId,
    stage: context.stage,
    stage_status: "completed",
    generated_at: NOW,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "stage-row-scope-fixture",
      subject_kind: "step",
      classification: "keep",
      severity: "low",
      reason: "The current stage outcome is available for a deterministic scope-digest fixture.",
      evidence_refs: [source.ref],
      confidence: "medium",
      next_review_trigger: "next current stage outcome",
    }],
    interventions: [],
    lessons_added: [],
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"]
      .map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    identity: {
      task_id: context.identity.taskId,
      worktree: context.candidateWorkspace.worktreeRoot,
      branch: context.candidateWorkspace.branch,
      attempt: source.value.attempt_id,
      snapshot_tree: source.value.snapshot_tree,
      material_revision: source.value.material_revision,
    },
    executor: {
      kind: "fixture-reflection-executor",
      source_id: "fixture/stage-row-scope-reflection",
      attempt_id: source.value.attempt_id,
      started_at: "2026-09-10T00:00:01.000Z",
      completed_at: "2026-09-10T00:00:02.000Z",
      output_hash: HASH,
    },
    output_hash: HASH,
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture", unknown_reasons: [] },
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage row material scope digest", () => {
  it.each(["make-decision", "build-spec"])(
    "uses the current %s material scope when the outcome projection lacks its scope revision",
    async (stage) => {
      const state = stageState(stage);
      const scopedMaterials = Object.fromEntries(MATERIALS.map((name) => [name, state.artifacts.read(name)]));
      const expectedScopeRevision = stageMaterialScopeRevision(stage, scopedMaterials);
      const expectedMaterialDigest = expectedScopeRevision.replace(/^revision-/, "");

      // Keep the authenticated ref/hash and canonical bytes, but model the
      // incomplete in-memory outcome projection that triggered the fallback.
      const projectedOutcome = {
        ...state.source,
        value: { ...state.source.value, material_scope_revision: undefined },
      };
      const result = await runStageEndReflection(state.context, {
        stageStatus: "completed",
        judgment: judgmentFor(state),
        stageOutcome: projectedOutcome,
        now: NOW,
      });

      expect(result.stage_handoff).toMatchObject({ status: "published", current: true });
      const rows = readTaskFacts(state.task.taskPath);
      expect(rows).toHaveLength(1);
      expect(rows[0].material_digest).toEqual({ value: expectedMaterialDigest });
      expect(rows[0].material_digest.value).not.toBe(state.kernel.currentVNextMaterialRevision().replace(/^revision-/, ""));
    },
  );
});
