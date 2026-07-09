# 审查报告 — worktree-unification-build-plan-r10-20260705T045733Z-146fc8 (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

Round-9 F1 已由 spec/plan/tasks 的 build-spec/build-plan 只读边界基本闭合；F3 由 parser 持久测试重写和 22/22 通过声明闭合；F5 的 T001 ESM 调用与非零退出独立检查基本闭合。F2 commit 全覆盖仍只落到 build-code，未闭合。F4 task-id 归一化仍未进入 T002，未闭合。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:88 | 问题: FR-WORKTREE-COMMIT-004 仍未覆盖所有 stage/phase。T008 只验证 build-code per-phase commit 规则和 git log 中的 build-code 前缀；spec 要求逐行核查 make-decision、build-spec、build-plan、build-code 每 phase、verify-code、close 子步骤。按当前任务执行，build-spec/build-plan/verify-code/close 的 commit 或 no-change 记录仍可漏掉。该问题是 Round-9 Finding 2 的重复未闭合。 | 建议: 把 T008 改成真正的 commit 覆盖矩阵 gate：逐行列出 make-decision、build-spec、build-plan、build-code 每 phase、verify-code、close；每行都有对应实现位置、blocking gate、commit 前缀或 no-change 记录字段。close 必须验证 `workflowhub(close): archive {task-id}`。
- [blocking] 位置: specs/worktree-unification/tasks.md:30 | 问题: task-id 归一化仍未落到 T002。data-contracts.md Contract 3 明确 make-decision 负责执行 task-id 输入归一化：转小写、非字母数字替换为连字符、合并连字符、去首尾，再校验；但 T002 只写分支命名 `workflowhub/{task-id}` 和正则匹配，没有要求 make-decision 实现归一化步骤，也没有 gate 验证 `Worktree Unification` 可归一化为 `worktree-unification`。该问题是 Round-9 Finding 4 的重复未闭合。 | 建议: 在 T002 明确加入 task-id 归一化实现要求和 gate：输入 `Worktree Unification` 必须得到 `worktree-unification` 并继续；输入 `My_Feature123` 必须归一化后因数字词段 fail-loud；同时同步 plan.md 2.1 的 R3 描述。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-WORKTREE-COMMIT-004 仍未覆盖所有 stage/phase。T008 只验证 build-code per-phase commit 规则和 git log 中的 build-code 前缀；spec 要求逐行核查 make-decision、build-spec、build-plan、build-code 每 phase、verify-code、close 子步骤。按当前任务执行，build-spec/build-plan/verify-code/close 的 commit 或 no-change 记录仍可漏掉。该问题是 Round-9 Finding 2 的重复未闭合。
- 必须修复：task-id 归一化仍未落到 T002。data-contracts.md Contract 3 明确 make-decision 负责执行 task-id 输入归一化：转小写、非字母数字替换为连字符、合并连字符、去首尾，再校验；但 T002 只写分支命名 `workflowhub/{task-id}` 和正则匹配，没有要求 make-decision 实现归一化步骤，也没有 gate 验证 `Worktree Unification` 可归一化为 `worktree-unification`。该问题是 Round-9 Finding 4 的重复未闭合。

