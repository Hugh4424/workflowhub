# 审查报告 — worktree-unification-build-plan-r12-20260705T055256Z-26aa25 (round 1)

- verdict: escalate_to_human
- provenance: single-context

## Summary

Round-11 的 T005 边界互斥、build-code §17 fallback、T002 四步归一化基本闭合；但 T005 假行为 gate 与 T008 COMMIT-004 覆盖/close 前缀仍未闭合，且同类问题已跨轮重复，按同一 blocking 多轮未闭合规则升级为 escalate_to_human。已按 speckit-analyze、plan-eng-review、review 三个只读 lens 做 skill-file fallback 核查：重点检查 spec/plan/tasks/data-contracts 一致性、依赖/可执行性、fake gate 与 scope drift。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:102 | 问题: T008 仍未按 spec/data-contracts 完整覆盖 FR-WORKTREE-COMMIT-004。它列出 build-code、build-spec、build-plan、verify-code、close 5 个触发点，仍漏掉 make-decision；同时 T008-D 仍要求 close 归档 commit 含 workflowhub(verify-code)，但 spec 和 data-contracts 固定要求 workflowhub(close): archive {task-id}。这是 Round-11 Finding 3 的同类未闭合问题。 | 建议: 把 T008 改成按 spec commit 覆盖矩阵逐行验收：make-decision、build-spec、build-plan、build-code per phase、verify-code、verify-code close 子步骤全部有 gate；close 归档 commit 只允许 workflowhub(close): archive {task-id}，不得用 workflowhub(verify-code) 替代。
- [blocking] 位置: specs/worktree-unification/tasks.md:83 | 问题: T005 的缺失字段 fail-loud gate 仍是假行为验证。命令只运行内联 node 片段解析 stdin，没有调用 build-spec/SKILL.md 或 build-plan/SKILL.md 的实际读取逻辑；真实 SKILL 即使没有 fail-loud 实现，该 gate 也会通过。这是 Round-11 Finding 2 的同类未闭合问题。 | 建议: 改为调用 build-spec/build-plan 实际入口或抽出的共享读取命令，在临时 task_tracking_root 写入缺少 target_repo_root/worktree_root 的 worktree.json，并断言真实 stage 读取流程非零退出且错误信息明确。不能用独立内联脚本替代被验收对象。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:123 | 问题: Contract 4 的 Owner side 与覆盖说明仍把 per-stage commit 契约收缩为 make-decision、build-code per phase、verify-code close，漏掉 spec.md 明确要求的 build-spec、build-plan、verify-code stage commit 分母。下游按 data-contracts 执行会低估提交覆盖面。 | 建议: 把 Contract 4 的 Owner side、Per-stage commit coverage 和 Version Compatibility Notes 改为覆盖 make-decision、build-spec、build-plan、build-code per phase、verify-code、verify-code close；每行写清 commit message、无变更记录字段和不可跳过条件。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：T008 仍未按 spec/data-contracts 完整覆盖 FR-WORKTREE-COMMIT-004。它列出 build-code、build-spec、build-plan、verify-code、close 5 个触发点，仍漏掉 make-decision；同时 T008-D 仍要求 close 归档 commit 含 workflowhub(verify-code)，但 spec 和 data-contracts 固定要求 workflowhub(close): archive {task-id}。这是 Round-11 Finding 3 的同类未闭合问题。
- 必须修复：T005 的缺失字段 fail-loud gate 仍是假行为验证。命令只运行内联 node 片段解析 stdin，没有调用 build-spec/SKILL.md 或 build-plan/SKILL.md 的实际读取逻辑；真实 SKILL 即使没有 fail-loud 实现，该 gate 也会通过。这是 Round-11 Finding 2 的同类未闭合问题。
- 必须修复：Contract 4 的 Owner side 与覆盖说明仍把 per-stage commit 契约收缩为 make-decision、build-code per phase、verify-code close，漏掉 spec.md 明确要求的 build-spec、build-plan、verify-code stage commit 分母。下游按 data-contracts 执行会低估提交覆盖面。

