# 审查报告 — worktree-unification-build-plan-r11-20260705T052202Z-62624f (round 3)

- verdict: escalate_to_human
- provenance: single-context

## Summary

Round-10 的 T001 持久单元测试要求、build-code §15 final atomic commit 冲突、T006 depends/[P] 冲突基本已修正；但 build-spec/build-plan 可改边界仍有残留互斥说明，COMMIT-004 覆盖仍漏 make-decision 且 close 前缀错误，T005 新增了假行为 gate，build-code §17 旧 fallback 仍存在。由于同类 blocking 已多轮未闭合，本轮结论升级为 escalate_to_human。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:134 | 问题: 上一轮 Finding 1 未完全闭合。T005 正文允许 build-spec/build-plan 在缺少 worktree.json 字段读取逻辑时做最小修改，但 Dependency Graph 后的 Knowledge 备注仍写“禁止任何修改”。同一任务内存在互斥执行规则，执行者可能按末尾约束跳过必要补充，导致 build-spec/build-plan 仍无法读取 target_repo_root/worktree_root。该类 blocking 已连续多轮出现，达到人工升级条件。 | 建议: 删除或改写该备注，明确 T005 必须先读 build-spec/SKILL.md 和 build-plan/SKILL.md；若字段读取/fail-loud 逻辑缺失，仅允许新增该最小实现；若已存在才记录无需修改。
- [blocking] 位置: specs/worktree-unification/tasks.md:79 | 问题: T005 声称“构造缺失字段的 worktree.json 验证 fail-loud”，但 gate 实际只 grep build-spec/SKILL.md 中是否出现 target_repo_root，没有调用 build-spec 的读取逻辑，也没有断言非零退出码。这是假行为验证，会让缺失字段时仍静默通过的实现拿到 green。 | 建议: 把该 gate 改成真实可执行验证：用临时 task_tracking_root 写入缺少 target_repo_root/worktree_root 的 worktree.json，按 build-spec 实际入口或抽出的读取命令运行，并断言 exit code 非零和错误信息明确；build-plan 同样处理。
- [blocking] 位置: specs/worktree-unification/tasks.md:98 | 问题: FR-WORKTREE-COMMIT-004 覆盖仍不完整且与 spec 冲突。T008 只列 build-code/build-spec/build-plan/verify-code/close 5 个触发点，漏掉 spec commit 覆盖矩阵中的 make-decision；同时 T008-D 要求 close 归档 commit 含 workflowhub(verify-code)，但 spec 固定要求 close 归档 commit message 为 workflowhub(close): archive {task-id}。执行后会漏检 make-decision 提交，并可能验收错误 commit 前缀。 | 建议: 按 spec.md commit 覆盖矩阵逐行改 T008：make-decision、build-spec、build-plan、build-code 每 phase、verify-code、verify-code close 子步骤全部有 gate；close 必须检查 workflowhub(close): archive {task-id}，不要用 workflowhub(verify-code) 替代。
- [blocking] 位置: workflows/build-code/SKILL.md:330 | 问题: 当前 build-code/SKILL.md §17 仍保留“File does not exist → create the worktree”的旧 fallback，直接违反 spec.md 对 build-code 缺失 worktree.json 时 fail-loud + escalate_to_human 的要求。真实后果是 make-decision 未写 worktree.json 时，build-code 可能自行创建 worktree，掩盖跨 stage 契约断链。 | 建议: 将该分支改为：worktree.json 缺失时输出期望路径、非零退出、escalate_to_human，并禁止 build-code 自行创建 worktree；保留创建职责只属于 make-decision。
- [blocking] 位置: specs/worktree-unification/tasks.md:33 | 问题: T002 的 task-id 归一化任务未完整覆盖 spec/data-contracts 的四步规则。任务只写“小写、空格/特殊字符折叠为连字符”，漏掉连续连字符合并、去首尾连字符；gate 也只是 grep 归一化关键词和顺序，没有验证 Worktree Unification -> worktree-unification 场景。执行者可写出不完整规则但仍通过 gate。 | 建议: 在 T002 明确四步归一化：转小写、非字母数字替换为连字符、合并连续连字符、去首尾连字符；新增 gate 检查 SKILL.md 明文包含四步，并覆盖 spec 场景 Worktree Unification -> worktree-unification 与 My_Feature123 -> fail-loud。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：上一轮 Finding 1 未完全闭合。T005 正文允许 build-spec/build-plan 在缺少 worktree.json 字段读取逻辑时做最小修改，但 Dependency Graph 后的 Knowledge 备注仍写“禁止任何修改”。同一任务内存在互斥执行规则，执行者可能按末尾约束跳过必要补充，导致 build-spec/build-plan 仍无法读取 target_repo_root/worktree_root。该类 blocking 已连续多轮出现，达到人工升级条件。
- 必须修复：T005 声称“构造缺失字段的 worktree.json 验证 fail-loud”，但 gate 实际只 grep build-spec/SKILL.md 中是否出现 target_repo_root，没有调用 build-spec 的读取逻辑，也没有断言非零退出码。这是假行为验证，会让缺失字段时仍静默通过的实现拿到 green。
- 必须修复：FR-WORKTREE-COMMIT-004 覆盖仍不完整且与 spec 冲突。T008 只列 build-code/build-spec/build-plan/verify-code/close 5 个触发点，漏掉 spec commit 覆盖矩阵中的 make-decision；同时 T008-D 要求 close 归档 commit 含 workflowhub(verify-code)，但 spec 固定要求 close 归档 commit message 为 workflowhub(close): archive {task-id}。执行后会漏检 make-decision 提交，并可能验收错误 commit 前缀。
- 必须修复：当前 build-code/SKILL.md §17 仍保留“File does not exist → create the worktree”的旧 fallback，直接违反 spec.md 对 build-code 缺失 worktree.json 时 fail-loud + escalate_to_human 的要求。真实后果是 make-decision 未写 worktree.json 时，build-code 可能自行创建 worktree，掩盖跨 stage 契约断链。
- 必须修复：T002 的 task-id 归一化任务未完整覆盖 spec/data-contracts 的四步规则。任务只写“小写、空格/特殊字符折叠为连字符”，漏掉连续连字符合并、去首尾连字符；gate 也只是 grep 归一化关键词和顺序，没有验证 Worktree Unification -> worktree-unification 场景。执行者可写出不完整规则但仍通过 gate。

