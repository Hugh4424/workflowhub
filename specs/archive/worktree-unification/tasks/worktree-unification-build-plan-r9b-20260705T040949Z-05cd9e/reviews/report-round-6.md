# 审查报告 — worktree-unification-build-plan-r9b-20260705T040949Z-05cd9e (round 6)

- verdict: revise_required
- provenance: single-context

## Summary

round 7/8 的 data-contracts 路径、硬编码 fallback、build-spec 禁改表述、部分 gate exit-code、stage-result 入库问题已基本收敛；但 round 6 仍有 6 个 blocking：scope 冲突、COMMIT-004 降级、合同冲突、持久测试缺失、task-id 归一化未落任务、T001 fake-green gate。

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:215 | 问题: spec.md 要求 build-spec/build-plan 读取 worktree.json、使用 target_repo_root/worktree_root，并在缺失时 fail-loud；但 plan.md 把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 设为只读禁止修改。当前 workflows/build-spec/SKILL.md / workflows/build-plan/SKILL.md 未包含这些 worktree.json 读取规则，执行者无法同时满足 spec 和 forbidden-file 边界。 | 建议: 二选一：允许对 build-spec/build-plan 做精确受控修改并补 gates；或修改 spec，把 FR-WORKTREE-SCOPE-008 降级为只读审计，不再要求二者消费 worktree.json。
- [blocking] 位置: specs/worktree-unification/tasks.md:88 | 问题: FR-WORKTREE-COMMIT-004 是硬性范围内要求，但 T008 仍是只读核查，并写明缺失项列为 follow-up、本任务不修改上述 SKILL.md。按此执行，build-code per-phase commit/no-change 规则缺失也能继续通过，跨 stage 追溯仍会断。 | 建议: 把 COMMIT-004 改成实现链：在对应 SKILL.md 中落地 per-stage/per-phase commit 或 no-change 记录规则；T008 只保留最终 blocking verification，不得把缺失项降级为 follow-up。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:130 | 问题: Contract 4 写“每个 stage/phase 完成时至少执行一次 git add + git commit”，但 spec.md:154-167 要求仅在有文件变更时 commit，无变更时记录 no-change reason，且禁止用 empty stage marker。合同与 spec 冲突。 | 建议: 把 Contract 4 改为：有文件变更才 commit；无变更必须写 stage-result/journal no-change reason；明确禁止空提交作为阶段标记。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: T001 改 core/task-dir-parser.mjs 的持久行为，但 tasks.md 没要求更新持久测试。现有 core/__tests__/task-dir-parser.test.mjs:24-26 仍断言缺失 config 时 fallback 到 ~/Knowledge/workflowhub/，与新 fail-loud 要求直接冲突。 | 建议: 在 T001 增加 test-first 子任务：先更新 core/__tests__/task-dir-parser.test.mjs，再实现 parser；gate 使用 npx vitest run core/__tests__/task-dir-parser.test.mjs，覆盖 env priority、yaml fallback、missing yaml、missing task_dir、nonexistent、non-directory、硬编码 fallback 删除、/tasks 裁剪。
- [blocking] 位置: specs/worktree-unification/tasks.md:30 | 问题: task-id 归一化没有落到 T002。spec.md 和 data-contracts.md 要求 make-decision 执行转小写、替换非字母数字、合并连字符、去首尾、再校验；T002 只要求分支命名和正则匹配。执行后 Worktree Unification 这类已批准场景可能被拒绝或处理不一致。 | 建议: 在 T002 明确实现 Contract 3：make-decision 必须先归一化再校验；补 gate 覆盖 Worktree Unification -> worktree-unification 成功，以及 My_Feature123 归一化后因数字词段 fail-loud。
- [blocking] 位置: specs/worktree-unification/tasks.md:17 | 问题: T001 的“两者缺失 fail-loud”错误消息 gate 仍用管道让 grep 决定 pass/fail；虽然下一条单独检查非零退出，但本条文字声称同时验证“非零退出 + stderr 明确错误”。如果 parseTaskDir 错误地成功但输出匹配文本，本条仍可假绿。 | 建议: 合并成一个自包含断言：捕获 stdout/stderr 和 exit code，先断言 exit code 非零，再断言 stderr 含明确错误；或使用 set -o pipefail 并显式检查 node 子进程状态。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：spec.md 要求 build-spec/build-plan 读取 worktree.json、使用 target_repo_root/worktree_root，并在缺失时 fail-loud；但 plan.md 把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 设为只读禁止修改。当前 workflows/build-spec/SKILL.md / workflows/build-plan/SKILL.md 未包含这些 worktree.json 读取规则，执行者无法同时满足 spec 和 forbidden-file 边界。
- 必须修复：FR-WORKTREE-COMMIT-004 是硬性范围内要求，但 T008 仍是只读核查，并写明缺失项列为 follow-up、本任务不修改上述 SKILL.md。按此执行，build-code per-phase commit/no-change 规则缺失也能继续通过，跨 stage 追溯仍会断。
- 必须修复：Contract 4 写“每个 stage/phase 完成时至少执行一次 git add + git commit”，但 spec.md:154-167 要求仅在有文件变更时 commit，无变更时记录 no-change reason，且禁止用 empty stage marker。合同与 spec 冲突。
- 必须修复：T001 改 core/task-dir-parser.mjs 的持久行为，但 tasks.md 没要求更新持久测试。现有 core/__tests__/task-dir-parser.test.mjs:24-26 仍断言缺失 config 时 fallback 到 ~/Knowledge/workflowhub/，与新 fail-loud 要求直接冲突。
- 必须修复：task-id 归一化没有落到 T002。spec.md 和 data-contracts.md 要求 make-decision 执行转小写、替换非字母数字、合并连字符、去首尾、再校验；T002 只要求分支命名和正则匹配。执行后 Worktree Unification 这类已批准场景可能被拒绝或处理不一致。
- 必须修复：T001 的“两者缺失 fail-loud”错误消息 gate 仍用管道让 grep 决定 pass/fail；虽然下一条单独检查非零退出，但本条文字声称同时验证“非零退出 + stderr 明确错误”。如果 parseTaskDir 错误地成功但输出匹配文本，本条仍可假绿。

