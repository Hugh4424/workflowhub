/**
 * worktree-reuse-guard.mjs — FR-WORKTREE-MAKEDECISION-002 idempotent reuse guard.
 *
 * make-decision 阶段幂等复用已存在 task-id 的 worktree.json 前的判定逻辑。
 *
 * CLI: node core/worktree-reuse-guard.mjs <worktree.json-path> <current-target-repo-root> <task-id>
 *   - worktree.json 不存在 → 打印 "create" 到 stdout，exit 0（走首次创建路径）
 *   - status=cleaned → fail-loud "task 已归档"，exit 1
 *   - status=active 且 target_repo_root 与当前请求一致 → 打印 "reuse" 到 stdout，exit 0
 *   - status=active 且 target_repo_root 与当前请求不一致（同一 task-id 撞到不同项目）
 *     → fail-loud，exit 1，报告 task-id 及双方 target_repo_root，不得静默复用
 *   - status 既非 active 也非 cleaned → fail-loud，exit 1
 *
 * @module worktree-reuse-guard
 */

import { readFileSync, existsSync } from "node:fs";

function failLoud(message) {
  process.stderr.write(`[worktree-reuse-guard] FAIL: ${message}\n`);
  process.exit(1);
}

/**
 * Decide whether an existing worktree.json may be reused for the given task-id.
 *
 * @param {string} worktreeJsonPath - Absolute path to {task_tracking_root}/tasks/{task-id}/worktree.json
 * @param {string} currentTargetRepoRoot - Absolute path to the target repo root for THIS invocation.
 * @param {string} taskId - The task-id being resolved (for error messages only).
 * @returns {{action: "create"|"reuse", worktree: object|null}} Never returns on fail-loud (process.exit(1)).
 */
export function checkWorktreeReuse(worktreeJsonPath, currentTargetRepoRoot, taskId) {
  if (!existsSync(worktreeJsonPath)) {
    return { action: "create", worktree: null };
  }

  let raw;
  try {
    raw = readFileSync(worktreeJsonPath, "utf8");
  } catch (err) {
    failLoud(`cannot read ${worktreeJsonPath} — ${err.message}`);
  }

  let worktree;
  try {
    worktree = JSON.parse(raw);
  } catch (err) {
    failLoud(`invalid JSON in ${worktreeJsonPath} — ${err.message}`);
  }

  if (worktree.status === "cleaned") {
    failLoud(`task-id "${taskId}" 已归档（status=cleaned），不得继续复用: ${worktreeJsonPath}`);
  }

  if (worktree.status !== "active") {
    failLoud(`task-id "${taskId}" 对应 worktree.json 的 status 值非法 "${worktree.status}"（须为 active/cleaned）: ${worktreeJsonPath}`);
  }

  if (worktree.target_repo_root !== currentTargetRepoRoot) {
    failLoud(
      `task-id "${taskId}" 已存在但绑定到不同项目，禁止跨项目静默复用 — ` +
        `worktree.json 记录的 target_repo_root="${worktree.target_repo_root}"，` +
        `当前请求的 target_repo_root="${currentTargetRepoRoot}"。` +
        `请更换 task-id 或确认目标仓库后重试: ${worktreeJsonPath}`
    );
  }

  return { action: "reuse", worktree };
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const [, , worktreeJsonPath, currentTargetRepoRoot, taskId] = process.argv;
  if (!worktreeJsonPath || !currentTargetRepoRoot || !taskId) {
    process.stderr.write(
      "[worktree-reuse-guard] error: usage: node core/worktree-reuse-guard.mjs <worktree.json-path> <current-target-repo-root> <task-id>\n"
    );
    process.exit(1);
  }
  const result = checkWorktreeReuse(worktreeJsonPath, currentTargetRepoRoot, taskId);
  process.stdout.write(result.action);
}
