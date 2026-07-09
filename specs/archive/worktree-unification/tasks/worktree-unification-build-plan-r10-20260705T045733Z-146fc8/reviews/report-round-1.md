# 审查报告 — worktree-unification-build-plan-r10-20260705T045733Z-146fc8 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

Round 10 关闭了 T001 fake-green、yaml /tasks 裁剪一致性、task-dir-parser 测试等问题；但 3 个 Round-9 blocking 仍未闭合，且前两个已连续出现，不能 pass。已按 speckit-analyze、plan-eng-review、review 的只读 fallback 视角检查 traceability、executability、verification。

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:75 | 问题: Round-9 Finding 1 未闭合：spec 要求 build-spec/build-plan 读取 worktree.json 的 target_repo_root/worktree_root，缺失时 fail-loud；plan 仍把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 标为禁止修改，后续 T005 也只允许记录缺失，不允许落地行为。执行者无法同时满足 spec 与 forbidden-file 边界。 | 建议: 二选一：**推荐**解除 build-spec/build-plan 的只读禁令并加入对应修改任务/gate；或修改 spec 明确二者不负责读取 worktree.json。若保持当前 spec，必须让 plan/tasks 可执行地更新这两个 SKILL.md。
- [blocking] 位置: specs/worktree-unification/tasks.md:88 | 问题: Round-9 Finding 2 未闭合：T008 仍只验证 build-code per-phase commit，未覆盖 spec FR-WORKTREE-COMMIT-004 的完整矩阵：make-decision、build-spec、build-plan、build-code 每 phase、verify-code、close 子步骤。执行后 build-spec/build-plan/verify-code/close 的 commit 或 no-change 记录仍可漏掉。 | 建议: 把 T008 改成逐行核查 FR-WORKTREE-COMMIT-004 commit 覆盖矩阵；为每一行写 blocking gate，覆盖对应 SKILL.md 条文、git log 前缀、no-change 记录字段、close 归档 commit 格式。
- [blocking] 位置: specs/worktree-unification/tasks.md:30 | 问题: Round-9 Finding 4 未闭合：data-contracts.md Contract 3 和 spec 场景要求 make-decision 对 task-id 执行归一化后再校验，但 T002 只要求分支命名匹配正则，没有要求实现归一化步骤。已批准输入如 `Worktree Unification` 仍可能被直接拒绝。 | 建议: 在 T002 明确加入 task-id 归一化规则：转小写、非字母数字替换为连字符、合并连续连字符、去首尾连字符，然后校验 `^[a-z]+(-[a-z]+){1,2}$`；补充正反两个 gate：`Worktree Unification` 通过为 `worktree-unification`，`My_Feature123` fail-loud。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Round-9 Finding 1 未闭合：spec 要求 build-spec/build-plan 读取 worktree.json 的 target_repo_root/worktree_root，缺失时 fail-loud；plan 仍把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 标为禁止修改，后续 T005 也只允许记录缺失，不允许落地行为。执行者无法同时满足 spec 与 forbidden-file 边界。
- 必须修复：Round-9 Finding 2 未闭合：T008 仍只验证 build-code per-phase commit，未覆盖 spec FR-WORKTREE-COMMIT-004 的完整矩阵：make-decision、build-spec、build-plan、build-code 每 phase、verify-code、close 子步骤。执行后 build-spec/build-plan/verify-code/close 的 commit 或 no-change 记录仍可漏掉。
- 必须修复：Round-9 Finding 4 未闭合：data-contracts.md Contract 3 和 spec 场景要求 make-decision 对 task-id 执行归一化后再校验，但 T002 只要求分支命名匹配正则，没有要求实现归一化步骤。已批准输入如 `Worktree Unification` 仍可能被直接拒绝。

