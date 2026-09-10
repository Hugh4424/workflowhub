import { describe, expect, it } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { publishQualityFact } from "../../runtime/evidence/quality-store.mjs";

import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

function taskRoot(projectName = "quality-store", recordModel = undefined) {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-quality-store-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-quality-repo-")));
  execFileSync("git", ["init", "-q"], { cwd: repo });
  const task = createTask({
    storageRoot: storage,
    manifest: { schema_version: "1.0.0", project_name: projectName === "workflowhub" ? "WorkflowHub" : projectName, task_id: "quality-store", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {}, ...(recordModel === undefined ? {} : { record_model: recordModel }) },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return task.taskPath;
}

function value(status = "passed") {
  return { task_id: "quality-store", stage: "build-code", status, source: "quality-store-test", schema_version: "test-fact.v1", content_hash: "d".repeat(64) };
}

describe("quality store EEXIST semantics", () => {
  it('quality-store:eexist-conflict treats a same-content link race as idempotent', () => {
    const root = taskRoot();
    const result = publishQualityFact(root, "tests", value(), {
      testHooks: {
        beforeRename: ({ target, raw }) => {
          writeFileSync(target, raw);
        },
      },
    });
    expect(result.idempotent).toBe(true);
  });

  it("rejects direct writes to the WorkflowHub vNext quality namespace regardless of storage path", () => {
    const root = taskRoot("workflowhub", "vnext-single-write");
    const indexBefore = readFileSync(join(root, "index.json"), "utf8");
    expect(() => publishQualityFact(root, "tests", value())).toThrow(/stage-runtime|canonical.*writer|current quality/i);
    expect(readFileSync(join(root, "index.json"), "utf8")).toBe(indexBefore);
  });

  it("does not use a directory basename as writer authority", () => {
    const root = taskRoot("workflowhub-in-a-different-directory", "vnext-single-write");
    expect(() => publishQualityFact(root, "tests", value())).not.toThrow();
  });

  it("does not regain direct-writer access after mutable task metadata is changed", () => {
    const root = taskRoot("workflowhub", "vnext-single-write");
    const manifestPath = join(root, "task.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, project_name: "legacy", record_model: "legacy" }, null, 2)}\n`);
    expect(() => publishQualityFact(root, "tests", value())).toThrow(/stage-runtime|canonical.*writer|current quality/i);
  });

  it("rejects a symlink alias of the canonical WorkflowHub task root", () => {
    const root = taskRoot("workflowhub", "vnext-single-write");
    const alias = join(dirname(root), "workflowhub-quality-store-alias");
    symlinkSync(root, alias, "dir");
    try {
      expect(() => publishQualityFact(alias, "tests", value())).toThrow(/stage-runtime|canonical.*writer|current quality/i);
    } finally {
      rmSync(alias, { force: true });
    }
  });

  it("keeps helper skills out of the current-quality writer boundary", () => {
    for (const relative of ["skills/wh-review/scripts/wh-review-cli.mjs", "skills/mini-task/scripts/mini-task-runner.mjs"]) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source, relative).not.toMatch(/kernel\.publishVNextQualityFact|kernel\.publishHumanConfirmation/);
    }
  });
});

describe("T011 concurrent semantic reflection publication", () => {
  it("two real processes publish one immutable A and one lesson across different wall clocks", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "reflection-race-")));
    try {
      const repo = join(root, "repo");
      mkdirSync(repo);
      const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
      git(["init", "-q", "-b", "main"]);
      git(["config", "user.name", "Reflection Race"]);
      git(["config", "user.email", "race@fixture.local"]);
      writeFileSync(join(repo, "README.md"), "fixture\n");
      git(["add", "."]); git(["commit", "-qm", "fixture"]);
      const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "ReflectionRace", task_id: "race",
        created_at: "2026-08-31T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write" } });
      const workspace = prepareTaskWorkspace(task);
      const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
      for (const [name, content] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(name, content);
      const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts });
      const outcome = writeStageOutcomeFixture({ task, kernel, artifacts, workspace, stage: "build-spec", attemptId: "race-a" });
      const input = {
        schema_version: "stage-reflection.v2", record_kind: "judgment", task_id: "race", stage: "build-spec", stage_status: "completed",
        generated_at: "2026-08-31T00:00:00.000Z", status: "ok", error: null, interventions: [], lessons_added: [],
        judgments: [{ subject_id: "race-source", subject_kind: "step", classification: "keep", severity: "low", reason: "Same authenticated source",
          evidence_refs: [outcome.ref], confidence: "medium", next_review_trigger: "next execution" }],
        identity: { task_id: "race", worktree: workspace.worktreeRoot, branch: workspace.branch, attempt: "race-a",
          material_revision: outcome.value.material_revision, snapshot_tree: outcome.value.snapshot_tree },
        executor: { kind: "fixture-reflection-executor", source_id: "fixture/reflection-executor", attempt_id: "race-a",
          started_at: "2026-08-31T00:00:01.000Z", completed_at: "2026-08-31T00:00:02.000Z", output_hash: "a".repeat(64) },
        output_hash: "a".repeat(64),
        ...Object.fromEntries(["what_helped", "what_to_improve", "blockers", "intervention_reasons", "what_to_simplify", "simplifiable_now"].map((key) => [key, { state: "none_observed", items: [] }])),
        status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"].map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
        source_completeness: { compaction: false, truncation: false, visible_scope: "fixture outcome", unknown_reasons: [] },
      };
      const inputPath = join(root, "input.json");
      writeFileSync(inputPath, JSON.stringify(input));
      const moduleUrl = (path) => pathToFileURL(join(process.cwd(), path)).href;
      const script = `
        import { readFileSync } from 'node:fs';
        import { openTask, createTaskKernel } from ${JSON.stringify(moduleUrl("runtime/task/task-handle.mjs"))};
        import { openCurrentTaskWorkspace } from ${JSON.stringify(moduleUrl("runtime/task/workspace.mjs"))};
        import { ArtifactDir } from ${JSON.stringify(moduleUrl("core/artifact-dir.mjs"))};
        import { runStageReflection } from ${JSON.stringify(moduleUrl("runtime/stage/stage-reflect.mjs"))};
        const task = openTask(process.argv[1], 'ReflectionRace', 'race');
        const workspace = openCurrentTaskWorkspace(task);
        const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
        const kernel = createTaskKernel(task, { workspace, artifacts });
        const context = { stage: 'build-spec', task, kernel, identity: task.identity, manifest: task.manifest,
          workflowRunId: kernel.deriveStageWorkflowRunId('build-spec'), workspace, artifacts };
        const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
        input.generated_at = process.argv[3];
        const result = await runStageReflection(context, { input, now: process.argv[3],
          testHooks: { beforeLessonCommit() { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); } } });
        process.stdout.write(JSON.stringify(result));
      `;
      const outputs = await Promise.all(["2026-08-31T01:00:00.000Z", "2026-08-31T02:00:00.000Z"].map((now) =>
        promisify(execFile)(process.execPath, ["--input-type=module", "-e", script, task.taskPath, inputPath, now], { cwd: process.cwd(), timeout: 60_000 })));
      const results = outputs.map(({ stdout }) => JSON.parse(stdout));
      expect(results.map((result) => result.status)).toEqual(["completed", "completed"]);
      expect(results[0].publication.ref).toMatch(/^quality\/stage-reflection\/build-spec\/[a-f0-9]{64}\.json$/);
      expect(results[0].publication.ref).toBe(results[1].publication.ref);
      expect(results[0].publication.sha256).toBe(results[1].publication.sha256);
      const rows = readFileSync(join(root, "Projects/ReflectionRace/lessons/build-spec.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
      expect(rows.filter((row) => row.entry_kind === "raw_observation")).toHaveLength(1);
      expect(rows.filter((row) => row.entry_kind === "merged_lesson")).toHaveLength(1);
      expect(rows[0].reflection_ref).toBe(results[0].publication.ref);
      expect(JSON.parse(task.readRecord(results[0].publication.ref)).generated_at).toBe(results[0].reflection.generated_at);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 90_000);
});
