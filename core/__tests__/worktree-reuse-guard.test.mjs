/**
 * worktree-reuse-guard.mjs FR-WORKTREE-MAKEDECISION-002 test suite (node:test runner).
 *
 * Covers:
 * - worktree.json missing → action "create"
 * - status=cleaned → fail-loud "task 已归档"
 * - status=active, target_repo_root matches current invocation → action "reuse"
 * - status=active, target_repo_root differs from current invocation (cross-project
 *   task-id collision) → fail-loud, must NOT silently reuse
 * - status neither active nor cleaned → fail-loud
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const guardPath = resolve(here, "../worktree-reuse-guard.mjs");

/**
 * Run worktree-reuse-guard.mjs as a CLI subprocess.
 * @returns {{exitCode: number, stdout: string, stderr: string}}
 */
function runGuard(worktreeJsonPath, currentTargetRepoRoot, taskId) {
  try {
    const stdout = execSync(
      `node ${JSON.stringify(guardPath)} ${JSON.stringify(worktreeJsonPath)} ${JSON.stringify(currentTargetRepoRoot)} ${JSON.stringify(taskId)}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    return { exitCode: 0, stdout: stdout.trim(), stderr: "" };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: (err.stdout ?? "").toString().trim(),
      stderr: (err.stderr ?? "").toString(),
    };
  }
}

describe("worktree-reuse-guard: FR-WORKTREE-MAKEDECISION-002", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "worktree-reuse-guard-test-"));
  });

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("worktree.json missing → action create, exit 0", () => {
    const worktreeJsonPath = join(tmpDir, "does-not-exist", "worktree.json");
    const result = runGuard(worktreeJsonPath, "/repo/project-a", "my-task");
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, "create");
  });

  it("status=cleaned → fail-loud 'task 已归档', exit 1", () => {
    const worktreeJsonPath = join(tmpDir, "worktree.json");
    writeFileSync(
      worktreeJsonPath,
      JSON.stringify({
        target_repo_root: "/repo/project-a",
        worktree_root: "/repo/project-a-worktrees/my-task",
        branch: "workflowhub/my-task",
        created_by_stage: "make-decision",
        push_policy: "verify-code-only",
        status: "cleaned",
      })
    );
    const result = runGuard(worktreeJsonPath, "/repo/project-a", "my-task");
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /已归档/);
  });

  it("status=active, target_repo_root matches → action reuse, exit 0 (same-project idempotent reuse unaffected)", () => {
    const worktreeJsonPath = join(tmpDir, "worktree.json");
    writeFileSync(
      worktreeJsonPath,
      JSON.stringify({
        target_repo_root: "/repo/project-a",
        worktree_root: "/repo/project-a-worktrees/my-task",
        branch: "workflowhub/my-task",
        created_by_stage: "make-decision",
        push_policy: "verify-code-only",
        status: "active",
      })
    );
    const result = runGuard(worktreeJsonPath, "/repo/project-a", "my-task");
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, "reuse");
  });

  it("status=active, target_repo_root MISMATCH (cross-project task-id collision) → fail-loud, must NOT silently reuse", () => {
    const worktreeJsonPath = join(tmpDir, "worktree.json");
    writeFileSync(
      worktreeJsonPath,
      JSON.stringify({
        target_repo_root: "/repo/project-a",
        worktree_root: "/repo/project-a-worktrees/my-task",
        branch: "workflowhub/my-task",
        created_by_stage: "make-decision",
        push_policy: "verify-code-only",
        status: "active",
      })
    );
    // Same task-id ("my-task"), but this invocation targets a DIFFERENT project.
    const result = runGuard(worktreeJsonPath, "/repo/project-b", "my-task");
    assert.notEqual(
      result.exitCode,
      0,
      "expected fail-loud when task-id is reused across different target_repo_root, but got exit 0"
    );
    assert.notEqual(
      result.stdout,
      "reuse",
      "must not silently print 'reuse' when target_repo_root differs across projects"
    );
    assert.match(result.stderr, /task-id/);
    assert.match(result.stderr, /project-a/);
    assert.match(result.stderr, /project-b/);
  });

  it("status neither active nor cleaned → fail-loud, exit 1", () => {
    const worktreeJsonPath = join(tmpDir, "worktree.json");
    writeFileSync(
      worktreeJsonPath,
      JSON.stringify({
        target_repo_root: "/repo/project-a",
        worktree_root: "/repo/project-a-worktrees/my-task",
        branch: "workflowhub/my-task",
        created_by_stage: "make-decision",
        push_policy: "verify-code-only",
        status: "bogus",
      })
    );
    const result = runGuard(worktreeJsonPath, "/repo/project-a", "my-task");
    assert.notEqual(result.exitCode, 0);
  });
});
