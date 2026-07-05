# 审查报告 — worktree-unification-build-plan-r11-20260705T052202Z-62624f (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

Round-10 六项中：T001 持久单测要求已闭合；build-code §15 final atomic commit 冲突已闭合；T006 对 T005 的直接依赖已从任务正文移除。仍未闭合：build-spec/build-plan 缺字段行为验证是假 gate；FR-WORKTREE-COMMIT-004 覆盖仍漏 make-decision 和 close 固定 message；task-id 归一化仍缺真实转换验证。新增发现：build-code §17 仍保留旧自动创建 fallback，直接违反当前计划。

## Findings

- [blocking] 位置: workflows/build-code/SKILL.md:330 | 问题: §17 仍保留旧 fallback：worktree.json 不存在时创建 worktree 并写入 worktree.json。当前 spec/plan/tasks 已要求 build-code 缺 worktree.json 时 fail-loud + escalate_to_human，不得自动创建。 | 建议: 删除“File does not exist → create the worktree...”路径，改为明确错误、非零退出、记录 missing_items 并 escalate_to_human。
- [blocking] 位置: specs/worktree-unification/tasks.md:79 | 问题: T005 的缺字段 fail-loud gate 是假验证：命令只 grep build-spec/SKILL.md 是否包含 target_repo_root 文本，没有构造缺字段 worktree.json 后断言 build-spec 读取流程非零退出。 | 建议: 把 gate 改成真实行为验证：临时 task_tracking_root + 缺 target_repo_root/worktree_root 的 worktree.json，按 build-spec 读取入口执行，断言 exit code 非零且错误信息明确。
- [blocking] 位置: specs/worktree-unification/tasks.md:80 | 问题: T005 对 build-plan 的缺字段 fail-loud gate 同样只 grep 文本，不能证明 build-plan 在字段缺失时会失败。 | 建议: 增加 build-plan 的真实缺字段运行验证，断言非零退出；仅文档文本存在不得作为 pass 条件。
- [blocking] 位置: specs/worktree-unification/tasks.md:98 | 问题: T008 仍未覆盖 FR-WORKTREE-COMMIT-004 全矩阵：缺 make-decision 行，close 子步骤也未验证固定提交信息 workflowhub(close): archive {task-id}。 | 建议: 在 T008 增加 make-decision commit/no-change gate；close gate 必须验证 git log 中存在 workflowhub(close): archive worktree-unification，而不是泛查“归档 commit”文本。
- [blocking] 位置: specs/worktree-unification/tasks.md:104 | 问题: T008 声明 depends:T005，但依赖图又标 T008 可与 T005 并行。T008 会读取 build-spec/build-plan 的规则，而 T005 可能刚修改这些文件，并行会产生假失败或假通过。 | 建议: 移除 T008 与 T005 的并行关系；Dependency Graph 中改为 T008 在 T005 之后执行。
- [blocking] 位置: specs/worktree-unification/tasks.md:39 | 问题: T002 的 task-id 归一化 gate 只 grep“归一化/小写”等词，没有验证四步转换链，也没有验证 Worktree Unification -> worktree-unification。 | 建议: 增加可执行验证：输入 Worktree Unification，断言输出 worktree-unification；同时覆盖非字母数字转连字符、连续连字符合并、首尾连字符裁剪。
- [important] 位置: specs/worktree-unification/tasks.md:134 | 问题: T005 任务正文允许最小修改 build-spec/build-plan，但 Dependency Graph 注释仍写“禁止任何修改”。这是 stale contradiction。 | 建议: 同步该注释，改为“先读，若字段读取/fail-loud 缺失则仅允许最小补充；其余禁止修改”。
- [important] 位置: specs/worktree-unification/plan.md:270 | 问题: Verification Mapping 的 T008 仍只描述 build-code per-phase commit 和 build-code git log，未同步 tasks.md 中 build-spec/build-plan/verify-code/close 的矩阵覆盖。 | 建议: 把 plan.md T008 映射同步为完整 FR-WORKTREE-COMMIT-004 矩阵，避免 plan/tasks 追踪口径不一致。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：§17 仍保留旧 fallback：worktree.json 不存在时创建 worktree 并写入 worktree.json。当前 spec/plan/tasks 已要求 build-code 缺 worktree.json 时 fail-loud + escalate_to_human，不得自动创建。
- 必须修复：T005 的缺字段 fail-loud gate 是假验证：命令只 grep build-spec/SKILL.md 是否包含 target_repo_root 文本，没有构造缺字段 worktree.json 后断言 build-spec 读取流程非零退出。
- 必须修复：T005 对 build-plan 的缺字段 fail-loud gate 同样只 grep 文本，不能证明 build-plan 在字段缺失时会失败。
- 必须修复：T008 仍未覆盖 FR-WORKTREE-COMMIT-004 全矩阵：缺 make-decision 行，close 子步骤也未验证固定提交信息 workflowhub(close): archive {task-id}。
- 必须修复：T008 声明 depends:T005，但依赖图又标 T008 可与 T005 并行。T008 会读取 build-spec/build-plan 的规则，而 T005 可能刚修改这些文件，并行会产生假失败或假通过。
- 必须修复：T002 的 task-id 归一化 gate 只 grep“归一化/小写”等词，没有验证四步转换链，也没有验证 Worktree Unification -> worktree-unification。

