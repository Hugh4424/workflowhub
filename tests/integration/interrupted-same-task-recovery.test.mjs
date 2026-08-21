import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const roots = [];
const projectName = "WorkflowHub";
const taskId = "interrupted-same-task";
const materialFiles = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const runtimeCli = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const materials = canonicalStageMaterials();

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function beginTaskThenInterrupt() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-interrupted-task-")));
  roots.push(storageRoot);
  const repo = join(storageRoot, "repo");
  const home = join(storageRoot, "home");
  mkdirSync(repo);
  mkdirSync(home);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);

  const task = createTask({
    storageRoot,
    manifest: {
      schema_version: "1.0.0",
      project_name: projectName,
      task_id: taskId,
      created_at: "2026-08-09T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const name of materialFiles) artifacts.writeAtomic(name, materials[name]);

  // Return only stable identity data. No TaskHandle, Workspace, or ArtifactDir
  // capability crosses the simulated interruption boundary.
  return Object.freeze({ storageRoot, home, repo, taskPath: task.taskPath, worktreeRoot: candidate.worktreeRoot });
}

function publicCall(state, args) {
  return spawnSync(process.execPath, [runtimeCli, ...args], {
    cwd: state.repo,
    env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.storageRoot },
    encoding: "utf8",
  });
}

function relativeFiles(root, cursor = root) {
  return readdirSync(cursor, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(cursor, entry.name);
    if (entry.isDirectory()) return relativeFiles(root, absolute);
    return [absolute.slice(root.length + 1)];
  }).sort();
}

function objectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const child of value) objectKeys(child, keys);
    return keys;
  }
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    objectKeys(child, keys);
  }
  return keys;
}

describe("interrupted same-task recovery", () => {
  it("reopens one real task and continues through public readiness without a recovery object", () => {
    const firstCall = beginTaskThenInterrupt();

    const reopened = openTask(firstCall.taskPath, { projectName, taskId });
    const reopenedWorkspace = openCurrentTaskWorkspace(reopened);
    const reopenedArtifacts = ArtifactDir.open(reopenedWorkspace.worktreeRoot, reopened);
    expect(reopened.identity).toEqual({ projectName, taskId });
    expect(reopenedWorkspace.worktreeRoot).toBe(firstCall.worktreeRoot);
    expect(Object.fromEntries(materialFiles.map((name) => [name, reopenedArtifacts.read(name)]))).toEqual(materials);

    const statusCall = publicCall(firstCall, [
      "status", "--action=begin", "--stage=build-plan", `--project=${projectName}`, `--task=${taskId}`,
    ]);
    expect(statusCall.status, statusCall.stderr).toBe(0);
    expect(JSON.parse(statusCall.stdout)).toMatchObject({
      stage: "build-plan",
      work_status: "ready",
      readiness_source: "current-material-presence",
      missing_materials: [],
      quality_status: "in_progress",
    });

    const runInput = join(firstCall.storageRoot, "build-plan-run.json");
    const reopenedKernel = createTaskKernel(reopened, { workspace: reopenedWorkspace, artifacts: reopenedArtifacts });
    const outcome = writeStageOutcomeFixture({
      task: reopened,
      kernel: reopenedKernel,
      artifacts: reopenedArtifacts,
      workspace: reopenedWorkspace,
      stage: "build-plan",
      attemptId: "attempt-interrupted-reopen",
    });
    writeFileSync(runInput, `${JSON.stringify({ receipts: { stage_outcomes: outcome.ref } })}\n`);
    const runCall = publicCall(firstCall, [
      "run", "--action=execute", "--stage=build-plan", `--project=${projectName}`, `--task=${taskId}`,
      `--input=${runInput}`,
    ]);
    expect(runCall.status, `${runCall.stdout}\n${runCall.stderr}`).toBe(0);
    expect(JSON.parse(runCall.stdout)).toMatchObject({
      schema_version: "stage-runtime-result.vnext",
      stage: "build-plan",
      status: "in_progress",
      work_status: "ready",
      readiness: {
        stage: "build-plan",
        work_status: "ready",
        readiness_source: "current-material-presence",
        missing_materials: [],
      },
    });

    const continued = openTask(firstCall.taskPath, { projectName, taskId });
    const qualityRefs = continued.listCanonicalQualityFactRefs();
    expect(qualityRefs.length).toBeGreaterThan(0);
    expect(qualityRefs.map((ref) => JSON.parse(continued.readRecord(ref)).task_id))
      .toEqual(qualityRefs.map(() => taskId));

    const taskDirs = readdirSync(join(firstCall.storageRoot, "Projects", projectName, "tasks"));
    expect(taskDirs).toEqual([taskId]);
    const records = relativeFiles(firstCall.taskPath);
    expect(records).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/(?:^|[/_.-])(recovery|successor|rebind|continuation)(?:[/_.-]|$)/i),
    ]));
    const keys = records
      .filter((ref) => ref.endsWith(".json"))
      .flatMap((ref) => objectKeys(JSON.parse(readFileSync(join(firstCall.taskPath, ref), "utf8"))));
    expect(keys).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/^(?:recovery|successor|rebind|continuation)(?:_task)?(?:_id|_ref)?$/i),
    ]));
  });
});
