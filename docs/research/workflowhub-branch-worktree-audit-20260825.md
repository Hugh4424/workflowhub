# WorkflowHub 分支与 Worktree 盘点

状态：make-decision 只读研究事实；未执行 reset、clean、prune、对象修复、删除、提交或合并。

## 1. trusted clone 图谱

`/Users/Hugh/Hugh/Project/workflowhub-recovery-base-20260824` 的 Git 图谱为：

| 路径 | 分支 | HEAD | 状态 | 处理建议 |
| --- | --- | --- | --- | --- |
| recovery-base | `main` | `74a246e` | clean | 保留健康基线 |
| local-object-integrity | `task/WorkflowHub/workflowhub-local-object-integrity-recovery-20260824` | `74a246e` | 无 tracked diff；14 个材料/evidence 文件 | 只读归档候选 |
| batch-governance | `codex/workflowhub-batch-governance-20260824` | `74a246e` | 25 个 tracked diff；大量材料/evidence | 当前活动任务，保留 |

三个路径没有代码提交分叉：两个 task worktree 都直接从同一个健康基线开始。不能把未提交文件误认成可合并 commit，也不能把 evidence 文件误认成产品实现。

## 2. local-object-integrity recovery

可证明事实：

- task manifest 的 `target_repo_root` 指向 recovery base；实际 task worktree 是独立 worktree，当前 manifest 没有显式 `workspace_root` 字段。
- tracked source diff 为空；未跟踪内容只有四份 task 材料和 `quality/evidence/`。
- handoff 明确：没有源码修改、没有 commit/push/merge/cleanup；`quality_status=incomplete`，product release=`not_released`，provider/session/spec-analyze 的 unavailable 保留。
- trusted clone `git fsck` 通过；原始 checkout 的对象损坏只作为外部风险事实记录。

处理结论：这是“只读恢复调查与风险交接包”，不是待合并代码分支。不能直接 merge，也不能直接删除，因为当前 evidence 仍是未提交文件，尚未有独立归档副本。后续若用户授权清理，顺序必须是：先把四份材料和 evidence 做可回指归档，再确认归档可读，最后才处理 worktree/分支；本任务当前不执行。

## 3. batch-governance

可证明事实：

- 分支和 HEAD：`codex/workflowhub-batch-governance-20260824` / `74a246ea...`。
- 当前 tracked diff 覆盖 runtime stage/task、catalog、wh-review、completion、freshness、测试等 25 个文件；未跟踪内容包括当前四材料、ADR、research、build-plan/verify-code evidence 和 workspace-binding RED 测试。
- 该 worktree 是当前活动的整批治理任务，不能清理、切换、合并或把其中任意文件直接提升为已验收实现。
- 最新 F11 宪法条款和执行优先重设计已落在这个 worktree；旧 batch governance 方案已被新方向覆盖，尚未进入 build-spec。

处理结论：继续保留为唯一活动治理 worktree。先完成 make-decision 和材料收敛，再决定哪些既有 tracked diff 真正归属本批；未知归属的源码保持隔离，不通过 reset/clean 解决。

## 4. 原始 checkout 对照事实

`/Users/Hugh/Hugh/Project/workflowhub` 不属于 trusted clone 图谱：

- 分支：`codex/workflowhub-frontend-ui-recovery`。
- HEAD：`b519f974...`，不是 trusted baseline `74a246ea...`。
- 当前有约 36 条未提交 WIP；`git diff --stat` 因缺失对象无法可靠遍历。
- `git log --all` 已出现缺对象错误；既有只读证据记录 `git fsck` exit 10、missing/broken links/invalid cache-tree/unreachable objects。

处理结论：原始 checkout 继续只读隔离；不从这里复制、合并、修复对象、reset、clean、prune 或推断用户 WIP 语义。它不是本批的候选基线，也不是任何 task 的代码来源。

## 5. 当前分支处置边界

- **保留**：recovery base `main`，作为唯一健康基线；batch-governance worktree，作为当前活动任务。
- **只读归档候选**：local-object-integrity worktree；先保全未跟踪材料/evidence，再由用户单独授权清理。
- **永久只读隔离**：原始 checkout；对象完整性未恢复前不做任何写操作。
- **不做**：不合并两个 task 分支、不把未提交 diff 互相拷贝、不用 branch 删除代替 evidence 归档、不用 `git worktree prune` 清理残留记录。
