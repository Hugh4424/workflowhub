# 审查报告 — worktree-unification-build-plan-r9b-20260705T040949Z-05cd9e (round 7)

- verdict: escalate_to_human
- provenance: single-context

## Summary

上轮 B3/B4/B5/B9/B10/B11/B12/B13 相关修复大体已落到文档，但当前仍存在多项连续多轮未闭合的执行级阻塞；按同一 blocking 连续超过 3 轮未闭合规则，升级为 escalate_to_human。

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:215 | 问题: 同一要求连续多轮未闭合：spec 要求 build-spec/build-plan 读取 worktree.json、使用 target_repo_root/worktree_root，缺失时 fail-loud；plan/tasks 又把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 设为只读禁止修改。执行者无法同时满足 spec 和 forbidden-file 边界。 | 建议: 二选一：允许对 build-spec/build-plan 做精确受控修改并补 gates；或修改 spec，把 FR-WORKTREE-SCOPE-008 降级为只读审计，不再要求二者消费 worktree.json。
- [blocking] 位置: specs/worktree-unification/tasks.md:88 | 问题: FR-WORKTREE-COMMIT-004 仍没有完整实现链。T008 只验证 build-code per-phase commit，未覆盖 spec 要求的所有 stage/phase commit 或 no-change 记录；按当前计划，其他 stage 缺失 commit/no-change 规则仍可漏过。 | 建议: 把 COMMIT-004 拆成逐 stage/phase 的实现和最终 blocking verification；每一行 commit 覆盖矩阵都必须有对应任务和 gate，不能只审 build-code。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: T001 改 core/task-dir-parser.mjs 的持久行为，但 tasks.md 未要求更新持久测试。现有 parser 测试若仍覆盖旧 ~/Knowledge/workflowhub fallback，会和新 fail-loud 要求冲突；仅靠 shell gate 不足以防回归。 | 建议: 在 T001 增加 test-first 子任务：先更新 core/__tests__/task-dir-parser.test.mjs，再实现 parser；gate 使用 npx vitest run core/__tests__/task-dir-parser.test.mjs，覆盖 env priority、yaml fallback、missing yaml、missing task_dir、nonexistent、non-directory、硬编码 fallback 删除、/tasks 裁剪。
- [blocking] 位置: specs/worktree-unification/tasks.md:30 | 问题: task-id 归一化没有落到 T002。spec/data-contracts 要求 make-decision 先执行转小写、替换非字母数字、合并连字符、去首尾，再校验；T002 只要求分支命名和正则匹配。已批准场景如 Worktree Unification 可能被直接拒绝。 | 建议: 在 T002 明确实现 Contract 3：make-decision 必须先归一化再校验；补 gate 覆盖 Worktree Unification -> worktree-unification 成功，以及 My_Feature123 归一化后因数字词段 fail-loud。
- [blocking] 位置: specs/worktree-unification/tasks.md:17 | 问题: T001 的“两者缺失 fail-loud”错误消息 gate 仍让 grep 管道决定 pass/fail；该 gate 声称同时验证非零退出和 stderr 明确错误，但实际可在 exit code 错误时假绿。 | 建议: 合并为一个自包含断言：捕获 stdout/stderr 和 exit code，先断言 exit code 非零，再断言 stderr 含明确错误；或使用 set -o pipefail 并显式检查 node 子进程状态。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：同一要求连续多轮未闭合：spec 要求 build-spec/build-plan 读取 worktree.json、使用 target_repo_root/worktree_root，缺失时 fail-loud；plan/tasks 又把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 设为只读禁止修改。执行者无法同时满足 spec 和 forbidden-file 边界。
- 必须修复：FR-WORKTREE-COMMIT-004 仍没有完整实现链。T008 只验证 build-code per-phase commit，未覆盖 spec 要求的所有 stage/phase commit 或 no-change 记录；按当前计划，其他 stage 缺失 commit/no-change 规则仍可漏过。
- 必须修复：T001 改 core/task-dir-parser.mjs 的持久行为，但 tasks.md 未要求更新持久测试。现有 parser 测试若仍覆盖旧 ~/Knowledge/workflowhub fallback，会和新 fail-loud 要求冲突；仅靠 shell gate 不足以防回归。
- 必须修复：task-id 归一化没有落到 T002。spec/data-contracts 要求 make-decision 先执行转小写、替换非字母数字、合并连字符、去首尾，再校验；T002 只要求分支命名和正则匹配。已批准场景如 Worktree Unification 可能被直接拒绝。
- 必须修复：T001 的“两者缺失 fail-loud”错误消息 gate 仍让 grep 管道决定 pass/fail；该 gate 声称同时验证非零退出和 stderr 明确错误，但实际可在 exit code 错误时假绿。

