import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { bootstrapStage } from "../../runtime/stage/stage-context.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";

const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture({ explicit = true } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workspace-binding-")));
  roots.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "trusted-worktree");
  const storage = join(root, "storage");
  mkdirSync(repo); mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "baseline.txt"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  git(repo, ["worktree", "add", "-b", "codex/demo-workspace-binding", worktree, "HEAD"]);
  const taskId = "demo-workspace-binding";
  const artifactRoot = join(worktree, "specs", taskId);
  mkdirSync(artifactRoot, { recursive: true });
  for (const file of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(artifactRoot, file), `# ${file}\n`);
  }
  const taskPath = join(storage, "Projects", "Demo", "tasks", taskId);
  const task = createTask({
    storageRoot: storage,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-08-25T00:00:00.000Z",
      target_repo_root: explicit ? repo : worktree,
      ...(explicit ? { workspace_mode: "existing", workspace_root: worktree } : {}),
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  return { root, repo, worktree, task, taskPath };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("authenticated current Workspace binding", () => {
  it("opens an explicitly bound existing worktree and reads current materials", () => {
    const state = fixture();

    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);

    expect(workspace.worktreeRoot).toBe(realpathSync(state.worktree));
    expect(artifacts.read("spec.md")).toBe("# spec.md\n");
    expect(artifacts.reference("tasks.md")).toBe("specs/demo-workspace-binding/tasks.md");
  });

  it("keeps old manifests readable when the target path is the trusted task worktree", () => {
    const state = fixture({ explicit: false });

    const context = bootstrapStage("verify-code", {
      mode: "sidecar",
      taskPath: state.task.taskPath,
      projectName: "Demo",
      taskId: state.task.identity.taskId,
      readOnly: true,
    });

    expect(context.workspace.worktreeRoot).toBe(realpathSync(state.worktree));
    expect(context.artifacts.read("decision-log.md")).toBe("# decision-log.md\n");
  });
});
