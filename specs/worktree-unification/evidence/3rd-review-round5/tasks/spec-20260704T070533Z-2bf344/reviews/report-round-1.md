# 审查报告 — spec-20260704T070533Z-2bf344 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

核心协议已基本闭合，但 close 重入和进度契约仍不够可实现；远端分支检测和 commit 范围也需收紧。需修订后再进入实现。

## Findings

- [high] 位置: spec.md:208 | 问题: close 顺序先执行 `git worktree remove`，再 `git push origin main`。如果 push main 失败，任务 worktree 已被删除，但 worktree.json 仍可能是 active，本地任务分支仍存在，后续重试需要依赖 partial-close 恢复逻辑处理一个非正常中间态。当前恢复规则只明确处理 worktree 已不存在但 status=active，未覆盖 push 失败后的可重试策略、是否允许从本地分支继续推送 main、以及 close-progress 与 status 的一致性。 | 建议: 把 close-progress 的步骤状态写清楚：每个不可逆步骤完成后立即记录；push main 失败后的重入必须从主 checkout 基于已完成 merge 的 main 继续 push，不重新 merge；远端分支删除和本地分支删除也必须可重入。或调整顺序为 push main 成功后再 remove worktree，但需明确失败时如何保留可恢复状态。
- [medium] 位置: spec.md:104 | 问题: `verify-code` close 阶段只能把 status 从 active 更新为 cleaned，但同段又要求各不可逆步骤写入 `close-progress.json` 或等效持久化记录。该进度文件的位置、schema、写权限、何时写入、何时读取都未定义，导致实现者可能把它写进 target repo、task_dir、worktree_root 任一位置，重入行为不可验收。 | 建议: 新增 close-progress 契约：固定路径建议为 `{task_dir}/{task-id}/close-progress.json`；字段至少包含 completedSteps、lastCompletedAt、executorStage；只允许 verify-code close 写入；每个步骤成功后立即 fsync/原子写入；重入时以该文件为唯一进度来源。
- [medium] 位置: spec.md:230 | 问题: close 流程删除远端分支使用 `git ls-remote --exit-code origin workflowhub/{task-id}` 判断是否存在，但 `git ls-remote` 的参数可能匹配多个 ref，且未限定 heads。若同名 tag 或其他 ref 存在，可能误判远端任务分支存在。 | 建议: 把检查命令改为 `git ls-remote --exit-code --heads origin workflowhub/{task-id}`，删除命令保留 `git push origin :refs/heads/workflowhub/{task-id}` 或明确限定删除 heads ref。
- [medium] 位置: spec.md:174 | 问题: FR-WORKTREE-COMMIT-004 写成“build-code 流程中，每个 stage 或 phase 完成后 commit”，但枚举包含 `make-decision`、`verify-code`、`close`。这些不属于 build-code 内部流程，范围表述冲突，验收时无法判断 make-decision 和 verify-code 的 commit 责任归谁。 | 建议: 改成“workflowhub 全流程中，每个产生目标仓库变更的 stage/phase 完成后 commit”，并分别说明 make-decision、build-code、verify-code、close 哪些文件变更必须进入任务分支 commit，哪些外部 task_dir 文件不进入 git commit。
- [low] 位置: spec.md:447 | 问题: 附录仍写“当前轮次状态由最新一次 reviewSnapshot（round:5）判定”，但本次要求的 reviewSnapshot 是 round:1。文档内嵌历史轮次状态会让下游审查自动化误读当前 diff 的审查轮次。 | 建议: 把历史审查记录移到 evidence 文件，或明确标注为历史背景，不作为当前 reviewSnapshot 来源。当前 spec 内不要声明由 round:5 判定。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings

