import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const NOW = "2026-09-10T00:00:00.000Z";

function fixture(taskId = "performance-budget") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-performance-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub performance tests"]);
  git(["config", "user.email", "performance@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "performance fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId,
      created_at: NOW, target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    artifacts.writeAtomic(name, `# ${name}\n`);
  }
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts, now: () => NOW });
  return { root, repo, task, workspace, artifacts, kernel };
}

function traceChildStarts(path) {
  if (!existsSync(path)) return 0;
  return readFileSync(path, "utf8").split("\n").filter((line) => line.includes('"event":"start"')).length;
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("authenticated operation performance budget", () => {
  it("reuses one validated context inside an operation and refreshes across operations", async () => {
    const state = fixture();
    const tracePath = join(state.root, "git-trace.jsonl");
    const priorTrace = process.env.GIT_TRACE2_EVENT;
    process.env.GIT_TRACE2_EVENT = tracePath;
    try {
      const uncachedStart = traceChildStarts(tracePath);
      state.kernel.currentVNextSnapshot({ fresh: true });
      state.kernel.currentVNextSnapshot({ fresh: true });
      const uncachedDelta = traceChildStarts(tracePath) - uncachedStart;

      const cachedStart = traceChildStarts(tracePath);
      let first;
      let second;
      await state.kernel.withAuthenticatedOperation(async () => {
        first = state.kernel.currentVNextContext();
        second = state.kernel.currentVNextContext();
      });
      const cachedDelta = traceChildStarts(tracePath) - cachedStart;

      expect(first.snapshot).toBe(second.snapshot);
      expect(first.materialRevision).toBe(second.materialRevision);
      expect(uncachedDelta).toBeGreaterThan(0);
      expect(cachedDelta).toBeGreaterThan(0);
      expect(cachedDelta).toBeLessThan(uncachedDelta);

      const after = state.kernel.currentVNextContext({ fresh: true });
      expect(after.snapshot).not.toBe(first.snapshot);
      expect(after.materialRevision).toBe(first.materialRevision);
    } finally {
      if (priorTrace === undefined) delete process.env.GIT_TRACE2_EVENT;
      else process.env.GIT_TRACE2_EVENT = priorTrace;
    }
  }, 15000);

  it("keeps identity changes observable through a forced refresh", async () => {
    const state = fixture("performance-identity-change");
    const initial = state.kernel.currentVNextSnapshot({ fresh: true });
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "identity changed\n");
    const observed = state.kernel.currentVNextSnapshot({ fresh: true });
    expect(observed.tree).not.toBe(initial.tree);
    expect(observed.source_digest).not.toBe(initial.source_digest);
    expect(readFileSync(join(state.workspace.worktreeRoot, "README.md"), "utf8")).toContain("identity changed");
  });

  it("isolates overlapping and nested authenticated operations", async () => {
    const state = fixture("performance-overlap");
    let releaseOuter;
    let outerReady;
    const waitOuter = new Promise((resolve) => { releaseOuter = resolve; });
    const outerStarted = new Promise((resolve) => { outerReady = resolve; });
    let releaseSecond;
    let secondReady;
    const waitSecond = new Promise((resolve) => { releaseSecond = resolve; });
    const secondStarted = new Promise((resolve) => { secondReady = resolve; });

    let outerContext;
    let secondContext;
    const outer = state.kernel.withAuthenticatedOperation(async (context) => {
      outerContext = context;
      expect(state.kernel.currentVNextSnapshot()).toBe(context.snapshot);
      const nestedContext = await state.kernel.withAuthenticatedOperation(async (nested) => {
        expect(state.kernel.currentVNextSnapshot()).toBe(nested.snapshot);
        return nested;
      });
      expect(nestedContext).not.toBe(context);
      expect(state.kernel.currentVNextSnapshot()).toBe(context.snapshot);
      outerReady();
      await waitOuter;
      expect(state.kernel.currentVNextSnapshot()).toBe(context.snapshot);
    });

    await outerStarted;
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "overlapping identity\n");
    const second = state.kernel.withAuthenticatedOperation(async (context) => {
      secondContext = context;
      secondReady();
      await waitSecond;
      expect(state.kernel.currentVNextSnapshot()).toBe(context.snapshot);
    });
    await secondStarted;
    expect(secondContext.snapshot.tree).not.toBe(outerContext.snapshot.tree);
    releaseOuter();
    await outer;
    releaseSecond();
    await second;
  }, 15000);
});
