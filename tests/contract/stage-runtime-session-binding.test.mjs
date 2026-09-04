import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import {
  bindCodexSessionTask,
  endCodexSession,
  readCurrentCodexSession,
  registerCodexSession,
  sessionHandoffPath,
} from "../../tools/host/workflowhub-codex-session-state.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runtime-binding-")));
  roots.push(root);
  const home = join(root, "home");
  const storage = join(root, "storage");
  const repo = join(root, "repo");
  const oldTaskPath = join(root, "old-task");
  mkdirSync(home, { recursive: true });
  mkdirSync(storage, { recursive: true });
  mkdirSync(repo, { recursive: true });
  mkdirSync(oldTaskPath, { recursive: true });
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
  execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const env = { HOME: home, WORKFLOWHUB_TASK_DIR: storage, NODE_PATH: "" };
  const task = bootstrapTask({ project: "Demo", task: "target-task", "target-repo": repo }, { env, home, cwd: repo });
  return {
    root,
    home,
    storage,
    repo,
    oldTaskPath,
    taskPath: task.task_path,
    env,
    sessionId: `session-stage-runtime-binding-${process.pid}-${Date.now()}`,
  };
}

describe("stage-runtime session binding boundary", () => {
  it("does not let an explicit temporary CLI task replace the selected host task", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.repo, observedAtMs: 0 });
      bindCodexSessionTask({
        projectName: "workflowhub",
        taskId: "old-task",
        taskPath: state.oldTaskPath,
        cwd: state.repo,
        sessionId: state.sessionId,
        boundAtMs: 1,
      });

      const result = spawnSync(process.execPath, [
        join(process.cwd(), "tools/cli/stage-runtime.mjs"),
        "status",
        "--action=begin",
        "--stage=make-decision",
        "--project=Demo",
        "--task=target-task",
      ], {
        cwd: state.repo,
        env: { ...state.env, CODEX_SESSION_ID: state.sessionId },
        encoding: "utf8",
      });
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ stage: "make-decision" });
      expect(readCurrentCodexSession({ cwd: state.repo, sessionId: state.sessionId })).toMatchObject({
        active_task_id: "old-task",
        task_binding: { task_id: "old-task" },
      });
    } finally {
      try { endCodexSession({ sessionId: state.sessionId, cwd: state.repo }); } catch { /* fixture cleanup */ }
      rmSync(sessionHandoffPath(state.repo), { force: true });
    }
  });

  it("allows explicit identity when unrelated active sessions share the workspace", () => {
    const state = fixture();
    const otherSessionId = `${state.sessionId}-other`;
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.repo, observedAtMs: 0 });
      registerCodexSession({ sessionId: otherSessionId, transcriptPath: null, cwd: state.repo, observedAtMs: 1 });
      bindCodexSessionTask({
        projectName: "Demo",
        taskId: "target-task",
        taskPath: state.taskPath,
        cwd: state.repo,
        sessionId: state.sessionId,
        boundAtMs: 2,
      });

      const result = spawnSync(process.execPath, [
        join(process.cwd(), "tools/cli/stage-runtime.mjs"),
        "status",
        "--action=begin",
        "--stage=make-decision",
        "--project=Demo",
        "--task=target-task",
      ], {
        cwd: state.repo,
        env: state.env,
        encoding: "utf8",
      });
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ stage: "make-decision" });
    } finally {
      for (const sessionId of [state.sessionId, otherSessionId]) {
        try { endCodexSession({ sessionId, cwd: state.repo }); } catch { /* fixture cleanup */ }
      }
      rmSync(sessionHandoffPath(state.repo), { force: true });
    }
  });
});
