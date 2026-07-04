# 审查报告 — spec-20260704T065657Z-d9ea71 (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

当前 spec 已覆盖主契约和大部分前轮问题，但 close 序列和重入恢复仍不够可实现、可测。主要风险是 partial close 后状态不可判定，且 FR-WORKTREE-CLOSE-006 与 FR-WORKTREE-PUSH-005 有重复步骤歧义。需修订后再进入 build-plan。

## Findings

- [high] 位置: spec.md:168 | 问题: FR-WORKTREE-PUSH-005 的 close 序列先执行 `git worktree remove <worktree_root_path>`，再执行 `git push origin main`。如果 push main 失败，任务 worktree 已被删除，重试只能依赖主 checkout 和本地任务分支，无法重新进入任务 worktree 检查或修正归档提交，且 close-progress 重入规则没有覆盖这种半关闭状态。 | 建议: 把远端交互放在删除 worktree 之前，或明确重入恢复策略：push main 失败后如何验证 merge、如何重试 push、如何继续删除 worktree/local branch/status。当前 8 步序列不可调换，会制造难恢复的 partial close。
- [high] 位置: spec.md:119 | 问题: close 重入规则要求不可逆步骤写入 `close-progress.json` 或等效持久化记录，但没有定义该文件位置、schema、写入时机、状态枚举、与 worktree.json status 的一致性规则。实现者无法可靠判断“下一个未完成步骤”，验收也不可测。 | 建议: 补充 close-progress 契约：存储路径、字段、每个 close 步骤完成后写什么、重入时如何校验、progress 与 `worktree.json.status` 冲突时如何 fail-loud。
- [medium] 位置: spec.md:103 | 问题: active-only 校验要求 `branch` 必须与该 worktree 的 HEAD 对应分支一致，但 close 第 4 步删除 worktree 后 status 仍为 active，spec 又允许特殊跳过 active-only。这个例外只描述 worktree 目录已不存在，没有覆盖 git worktree 记录已清理但 local branch/remote/main push 处于不同完成状态的组合。 | 建议: 把 partial close 状态按步骤拆开验收：archive committed、merged to main、worktree removed、main pushed、remote branch deleted、local branch deleted、status cleaned。每种状态明确可重入入口。
- [medium] 位置: spec.md:188 | 问题: FR-WORKTREE-CLOSE-006 中“分支与 push”写成执行 FR-WORKTREE-PUSH-005 定义的序列，但同一段前面又单列了 spec 归档和 worktree 清理。FR-WORKTREE-PUSH-005 本身也包含 spec 归档、merge、worktree remove、push、删分支、status 更新，导致 close 步骤描述重复，容易被实现为重复执行 `git mv` 或 `git worktree remove`。 | 建议: FR-WORKTREE-CLOSE-006 只引用 FR-WORKTREE-PUSH-005 的单一命令序列，不再重复列出其中步骤；或把 FR-WORKTREE-PUSH-005 拆成纯 push/branch 部分。
- [medium] 位置: spec.md:139 | 问题: FR-WORKTREE-ENVVAR-003 要求路径存在且是目录，否则 fail-loud；边界场景又说路径不存在时 parser 不自动创建目录，由调用方在创建阶段负责 `mkdir -p`。但 make-decision 是首次创建契约文件的阶段，如果 task_dir 不存在，parser 会先失败，调用方无法进入创建阶段。 | 建议: 明确谁创建 task_dir 根目录。推荐：parser 只解析并校验绝对路径，make-decision 负责创建 `{task_dir}/{task-id}`；若 task_dir 根必须预存在，则删除“由调用方在创建阶段负责 mkdir -p”的说法。
- [medium] 位置: spec.md:156 | 问题: FR-WORKTREE-COMMIT-004 要求 close 归档 commit message 固定为 `workflowhub(close): archive {task-id}`，但前文又要求每个 stage/phase 完成后每个原子提交包含 stage 名称前缀。close 被列为 stage 枚举，但 close 实际嵌在 verify-code close 阶段，stage 归属不清。 | 建议: 明确 close 是独立 stage、verify-code 的 phase，还是 verify-code 的收尾动作。若无独立 close SKILL.md，建议使用 `workflowhub(verify-code/close): archive {task-id}`，或明确定义 `close` 为允许的虚拟 stage。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings

