import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { runStage } from "../../runtime/stage/stage-runner.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { sha256 } from "../../runtime/evidence/freshness.mjs";

const roots = [];
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const STAGES = ["make-decision", "build-spec", "build-plan"];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-first-three-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "first-three",
      created_at: "2026-08-02T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const name of MATERIALS) artifacts.writeAtomic(name, `# ${name}\n`);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return { task, candidate, kernel, artifacts };
}

function publishReviewFixture(state) {
  const snapshot = state.candidate.captureSnapshot();
  const value = {
    version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "build-spec",
    review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
    source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
    snapshot_tree: snapshot.tree, material_id: "0".repeat(64),
    attempt_ref: "quality/reviews/attempts/first-three-build-spec/attempt.json",
    provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "fixture review passed", findings: [] } }],
    verdict: "pass", findings: [],
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = "quality/reviews/results/first-three-build-spec.json";
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: sha256(raw) };
}

describe("first three stage vNext cutover", () => {
  it("keeps all three stages on current materials and quality/publication facts", async () => {
    const state = fixture();
    expect(() => state.kernel.startStageRun("build-spec", { reason: "vNext must not create a run" }))
      .toThrow(/stage run writer is retired/i);
    expect(() => state.task.readRecord("runs/build-spec/run-0001.json")).toThrow(/ENOENT/);
    const review = publishReviewFixture(state);
    for (const stage of STAGES) {
      const context = {
        stage, task: state.task, kernel: state.kernel, identity: state.task.identity,
        workflowRunId: state.kernel.deriveStageWorkflowRunId(stage),
        manifest: state.task.manifest, candidateWorkspace: state.candidate,
      };
      const result = await runStage(stage, context, async () => ({
        facts: { stage },
        ...(stage === "build-spec" ? { evidence_refs: [review] } : {}),
        ...(stage === "build-spec" ? {} : { missing_items: ["human_confirmation"] }),
      }));
      expect(result.quality_fact_refs.length).toBeGreaterThan(0);
      if (stage === "build-spec") {
        expect(result.status).toBe("completed");
        expect(result.publication_ref).toMatch(new RegExp(`^publications/${stage}/`));
      } else {
        expect(result.status).toBe("completed");
        expect(result.quality_status).toBe("incomplete");
        expect(result.publication_ref).toMatch(new RegExp(`^publications/${stage}/`));
      }
    }

    state.artifacts.writeAtomic("plan.md", "# revised plan\n");
    expect(() => state.task.readRecord("results/make-decision/accepted.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("results/build-plan/accepted.json")).toThrow(/ENOENT/);
  });

  it("rejects source drift before publishing vNext facts and converges on a retry", async () => {
    const state = fixture();
    const context = {
      stage: "build-spec", task: state.task, kernel: state.kernel, identity: state.task.identity,
      workflowRunId: state.kernel.deriveStageWorkflowRunId("build-spec"),
      manifest: state.task.manifest, candidateWorkspace: state.candidate,
    };
    const handler = async () => {
      writeFileSync(join(state.candidate.worktreeRoot, "README.md"), "drifted\n");
      return { facts: { source: "drifted" } };
    };
    await expect(runStage("build-spec", context, handler)).rejects.toMatchObject({ code: "FORMAL_SNAPSHOT_MISMATCH" });
    expect(existsSync(join(state.task.taskPath, "quality", "facts"))).toBe(false);

    writeFileSync(join(state.candidate.worktreeRoot, "README.md"), "base\n");
    const stableHandler = async () => ({ facts: { source: "stable" } });
    const first = await runStage("build-spec", context, stableHandler);
    const second = await runStage("build-spec", context, stableHandler);
    expect(second.quality_fact_refs).toEqual(first.quality_fact_refs);
    expect(second.publication_ref).toBe(first.publication_ref);
    expect(readdirSync(join(state.task.taskPath, "quality", "facts"))).toHaveLength(first.quality_fact_refs.length);
  });
});
