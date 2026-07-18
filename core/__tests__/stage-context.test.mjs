import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { bootstrapStage } from "../stage-context.mjs";
import { createTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { prepareTaskWorkspace } from "../workspace.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";

const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
const temporaryDirs = [];

function fixture({ acceptDecision = true } = {}) {
  const storageRoot = realpathSync(
    mkdtempSync(join(tmpdir(), "workflowhub-stage-context-")),
  );
  temporaryDirs.push(storageRoot);
  const taskPath = join(
    storageRoot,
    "Projects",
    "PaperBuilder",
    "tasks",
    "paperbuilder-phase-foundation",
  );
  const targetRepoRoot = join(storageRoot, "PaperBuilder");
  const worktreeRoot = join(storageRoot, "PaperBuilder-paperbuilder-phase-foundation");
  mkdirSync(targetRepoRoot, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: targetRepoRoot });
  execFileSync("git", ["config", "user.email", "tests@workflowhub.local"], { cwd: targetRepoRoot });
  execFileSync("git", ["config", "user.name", "WorkflowHub Tests"], { cwd: targetRepoRoot });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: targetRepoRoot });
  const baselineCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: targetRepoRoot, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-qb", "task/PaperBuilder/paperbuilder-phase-foundation", worktreeRoot, baselineCommit], { cwd: targetRepoRoot });
  const manifest = Object.freeze({
    schema_version: "1.0.0",
    project_name: "PaperBuilder",
    task_id: "paperbuilder-phase-foundation",
    created_at: "2026-07-16T00:00:00.000Z",
    target_repo_root: targetRepoRoot,
    issue_ids: [],
    inputs: {},
  });
  const task = createTask({ storageRoot, taskPath, manifest });
  const kernel = createTaskKernel(task);
  if (acceptDecision) {
    const published = kernel.publishAttempt("make-decision", {
      facts: { worktree_root: worktreeRoot, baseline_commit: baselineCommit },
    });
    kernel.acceptAttempt("make-decision", published.attempt_ref, writeHumanConfirmation(kernel, "make-decision", published));
  }
  mkdirSync(join(worktreeRoot, "specs", manifest.task_id), { recursive: true });
  return { storageRoot, taskPath, worktreeRoot, baselineCommit, manifest, task };
}

afterEach(() => {
  if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
  else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("bootstrapStage", () => {
  it("rejects a prepared candidate after its HEAD changes before acceptance",()=>{
    const {task}=fixture({acceptDecision:false});
    const candidate = prepareTaskWorkspace(task);
    execFileSync("git",["commit","--allow-empty","-qm","advanced"],{cwd:candidate.worktreeRoot});
    expect(()=>candidate.worktreeRoot).toThrow(/HEAD|baseline|changed/i);
  });
  it("launcher mode resolves env once and derives taskPath from project/task", () => {
    const { storageRoot, taskPath } = fixture();
    const env = { WORKFLOWHUB_TASK_DIR: storageRoot };

    const context = bootstrapStage(
      "make-decision",
      {
        mode: "launcher",
        home: storageRoot,
        projectName: "PaperBuilder",
        taskId: "paperbuilder-phase-foundation",
        env,
      },
    );

    expect(context.task.taskPath).toBe(taskPath);
  });

  it("sidecar mode uses absolute taskPath and never reads storage-root env", () => {
    const { storageRoot, taskPath } = fixture();
    const poisonEnv = { WORKFLOWHUB_TASK_DIR: join(storageRoot, "poison-root") };

    const context = bootstrapStage(
      "verify-code",
      {
        mode: "sidecar",
        taskPath,
        projectName: "PaperBuilder",
        taskId: "paperbuilder-phase-foundation",
        env: poisonEnv,
      },
    );

    expect(context.task.taskPath).toBe(taskPath);
  });

  it("sidecar mode never reads the global WorkflowHub config", () => {
    const { storageRoot, taskPath } = fixture();
    const configHome = mkdtempSync(join(tmpdir(), "workflowhub-poison-config-"));
    temporaryDirs.push(configHome);
    const configDirectory = join(configHome, "workflowhub");
    mkdirSync(configDirectory, { recursive: true });
    writeFileSync(join(configDirectory, "config.json"), "{", "utf8");

    const context = bootstrapStage("verify-code", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      home: storageRoot,
      env: { XDG_CONFIG_HOME: configHome },
    });

    expect(context.task.taskPath).toBe(taskPath);
  });

  it("sidecar mode rejects runner drift immediately after opening the task", () => {
    const { taskPath } = fixture();
    const manifestPath = join(taskPath, "task.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.runner_oid = manifest.runner_oid === "f".repeat(40) ? "e".repeat(40) : "f".repeat(40);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    expect(() => bootstrapStage("verify-code", {
      mode: "sidecar",
      taskPath,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
    })).toThrow(/runner identity mismatch/i);
  });

  it("rejects taskPath, expected identity, and manifest disagreement", () => {
    const { taskPath } = fixture();

    expect(() =>
      bootstrapStage(
        "build-spec",
        {
          mode: "sidecar",
          taskPath,
          projectName: "PaperBuilder",
          taskId: "wrong-task",
        },
      ),
    ).toThrow(/identity|mismatch|task/i);
  });

  it("gives make-decision no Workspace or ArtifactDir", () => {
    const { storageRoot } = fixture();
    const context = bootstrapStage(
      "make-decision",
      {
        mode: "launcher",
        home: storageRoot,
        projectName: "PaperBuilder",
        taskId: "paperbuilder-phase-foundation",
        env: { WORKFLOWHUB_TASK_DIR: storageRoot },
      },
    );

    expect(context.workspace).toBeUndefined();
    expect(context.artifacts).toBeUndefined();
  });

  it("prepares a deterministic CandidateWorkspace and binds make-decision acceptance to it", () => {
    const { storageRoot, baselineCommit } = fixture({ acceptDecision: false });
    const context = bootstrapStage("make-decision", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
      workspaceLifecycle: "prepare",
    });
    const worktreeRoot = join(storageRoot, "PaperBuilder-paperbuilder-phase-foundation");
    expect(context.candidateWorkspace).toMatchObject({ worktreeRoot: realpathSync(worktreeRoot), baselineCommit });
    expect(() => context.kernel.publishAttempt("make-decision", {
      facts: { worktree_root: worktreeRoot, baseline_commit: "a".repeat(40) },
    }))
      .toThrow(/CandidateWorkspace|match/i);
    const correct = context.kernel.publishAttempt("make-decision", {
      facts: { worktree_root: worktreeRoot, baseline_commit: baselineCommit },
    });
    expect(() => context.kernel.acceptAttempt("make-decision", correct.attempt_ref, writeHumanConfirmation(context.kernel, "make-decision", correct))).not.toThrow();
  });

  it.each(["build-spec", "build-plan", "verify-code"])(
    "builds %s Workspace and ArtifactDir only from accepted make-decision facts",
    (stage) => {
      const { storageRoot, worktreeRoot, baselineCommit } = fixture();
      const context = bootstrapStage(
        stage,
        {
          mode: "launcher",
          home: storageRoot,
          projectName: "PaperBuilder",
          taskId: "paperbuilder-phase-foundation",
          env: { WORKFLOWHUB_TASK_DIR: storageRoot },
        },
      );

      expect(context.workspace).toEqual({
        worktreeRoot: realpathSync(worktreeRoot),
        baselineCommit,
      });
      expect(context.artifacts.root).toBe(
        join(realpathSync(worktreeRoot), "specs", "paperbuilder-phase-foundation"),
      );
    },
  );

  it("rejects build-code bootstrap without accepted spec and plan", () => {
    const { storageRoot } = fixture();
    expect(() => bootstrapStage("build-code", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
    })).toThrow(/accepted spec and plan/i);
  });

  it("invalidates Workspace automatically when its worktree path is replaced", () => {
    const { storageRoot, worktreeRoot } = fixture();
    const context = bootstrapStage("build-spec", {
      mode: "launcher",
      home: storageRoot,
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
      env: { WORKFLOWHUB_TASK_DIR: storageRoot },
    });
    const displaced = `${worktreeRoot}-displaced`;
    const artifact = context.artifacts;
    // Use the fixture path, not the capability property, to perform the hostile
    // replacement. Reading the old capability after this point must validate.
    renameSync(worktreeRoot, displaced);
    mkdirSync(worktreeRoot);
    execFileSync("git", ["init", "-q"], { cwd: worktreeRoot });
    execFileSync("git", ["config", "user.email", "tests@workflowhub.local"], { cwd: worktreeRoot });
    execFileSync("git", ["config", "user.name", "WorkflowHub Tests"], { cwd: worktreeRoot });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "replacement"], { cwd: worktreeRoot });

    expect(() => context.workspace.worktreeRoot).toThrow(
      /changed|replaced|stale|identity|worktree/i,
    );
    expect(() => artifact.path("spec.md")).toThrow(
      /changed|replaced|stale|identity|worktree/i,
    );
  });
});
