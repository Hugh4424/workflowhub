import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { sessionHandoffPath } from "../../tools/host/workflowhub-codex-session-state.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("task bootstrap target repository boundary", () => {
  function fixture() {
    const home = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-bootstrap-")));
    roots.push(home);
    const storage = join(home, "storage"), repo = join(home, "repo");
    mkdirSync(storage); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    return { home, storage, repo, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
  }

  it("rejects a nested target before creating immutable task.json", () => {
    const f = fixture(), nested = join(f.repo, "nested"); mkdirSync(nested);
    expect(() => bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": nested }, { ...f, cwd: f.repo })).toThrow(/Git toplevel/i);
    expect(() => bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": f.repo }, { ...f, cwd: f.repo })).not.toThrow();
  });

  it("rejects a non-Git target before creating immutable task.json", () => {
    const f = fixture(), plain = join(f.home, "plain"); mkdirSync(plain);
    expect(() => bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": plain }, { ...f, cwd: f.repo })).toThrow(/target repository validation failed/i);
    expect(() => bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": f.repo }, { ...f, cwd: f.repo })).not.toThrow();
  });

  it("binds an explicitly supplied existing trusted worktree without deriving a second one", () => {
    const f = fixture();
    writeFileSync(join(f.repo, "baseline.txt"), "baseline\n");
    execFileSync("git", ["add", "."], { cwd: f.repo });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", "baseline"], { cwd: f.repo });
    const worktree = join(f.home, "trusted-task-worktree");
    execFileSync("git", ["worktree", "add", "-b", "codex/demo-existing-worktree", worktree, "HEAD"], { cwd: f.repo });

    const result = bootstrapTask({
      project: "Demo",
      task: "demo-existing-worktree",
      "target-repo": f.repo,
      "workspace-root": worktree,
    }, { ...f, cwd: worktree });

    const manifest = JSON.parse(readFileSync(join(result.task_path, "task.json"), "utf8"));
    expect(manifest).toMatchObject({
      target_repo_root: realpathSync(f.repo),
      workspace_mode: "existing",
      workspace_root: realpathSync(worktree),
    });
  });

  it("opens a legacy pinned manifest read-only and authenticates a fresh invocation independently", () => {
    const f = fixture(), runner = join(f.home, "runner"); mkdirSync(runner);
    execFileSync("git", ["init", "-q", "-b", "task/workflowhub/m14b-fact-collection-g2"], { cwd: runner });
    writeFileSync(join(runner, "AGENTS.md"), "# Runner\n");
    writeFileSync(join(runner, "CONSTITUTION.md"), "# Constitution\n");
    mkdirSync(join(runner, "workflows", "verify-code"), { recursive: true });
    writeFileSync(join(runner, "workflows", "verify-code", "SKILL.md"), "# verify-code\n");
    execFileSync("git", ["add", "."], { cwd: runner });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", "runner"], { cwd: runner });
    const task = createTask({ storageRoot: f.storage, manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: "m14b-fact-collection-g2",
      created_at: "2026-07-19T00:00:00.000Z", target_repo_root: f.repo, issue_ids: ["ZHI-102"], inputs: {},
    } });
    const before = JSON.stringify({
      ...task.manifest,
      execution_mode: "legacy_pinned",
      runner_root: "/retired/workflowhub-runner",
      runner_oid: "0".repeat(40),
      runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" },
    }, null, 2) + "\n";
    writeFileSync(join(task.taskPath, "task.json"), before);
    const resultWithoutRunner = bootstrapTask({ "task-path": task.taskPath, project: "workflowhub", task: "m14b-fact-collection-g2" }, { env: {}, home: join(f.home, "missing-home"), cwd: f.repo });
    expect(resultWithoutRunner).toMatchObject({ task_path: task.taskPath, project: "workflowhub", task: "m14b-fact-collection-g2" });
    const result = bootstrapTask({ "task-path": task.taskPath, project: "workflowhub", task: "m14b-fact-collection-g2", "runner-root": realpathSync(runner), stage: "verify-code" }, { env: {}, home: join(f.home, "missing-home"), cwd: f.repo });
    expect(result).toMatchObject({
      task_path: task.taskPath, project: "workflowhub", task: "m14b-fact-collection-g2",
      runner_identity: { source_kind: "git_invocation", stage: "verify-code", source: { git_oid: execFileSync("git", ["rev-parse", "HEAD"], { cwd: runner, encoding: "utf8" }).trim() } },
    });
    expect(readFileSync(join(task.taskPath, "task.json"), "utf8")).toBe(before);
    expect(() => bootstrapTask({ "task-path": task.taskPath, project: "workflowhub", task: "m14b-fact-collection-g2", "runner-root": f.repo, stage: "verify-code" })).toThrow(/AGENTS|runner identity/i);
  });

  it("binds the active project-hook session without requiring a task id environment variable", () => {
    const f = fixture();
    const sessionId = "session-bootstrap-auto";
    const rollout = join(f.home, ".codex", "sessions", "2026", "08", "18", "rollout-2026-08-18T00-00-00-session-bootstrap-auto.jsonl");
    mkdirSync(join(f.home, ".codex", "sessions", "2026", "08", "18"), { recursive: true });
    writeFileSync(rollout, "");
    const hook = join(process.cwd(), "tools", "host", "workflowhub-codex-session-hook.mjs");
    try {
      execFileSync(process.execPath, [hook], {
        cwd: f.repo,
        input: `${JSON.stringify({ hook_event_name: "SessionStart", session_id: sessionId, transcript_path: rollout, cwd: f.repo })}\n`,
        env: { ...process.env, HOME: f.home },
      });
      const result = bootstrapTask({ project: "workflowhub", task: "bootstrap-auto-task", "target-repo": f.repo }, { ...f, cwd: f.repo });
      expect(result.session_binding).toMatchObject({ status: "bound", task_binding: { project_name: "workflowhub", task_id: "bootstrap-auto-task" } });
    } finally {
      rmSync(sessionHandoffPath(f.repo), { force: true });
    }
  });
});
