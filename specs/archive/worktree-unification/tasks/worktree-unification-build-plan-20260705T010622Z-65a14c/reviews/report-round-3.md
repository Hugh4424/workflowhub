# 审查报告 — worktree-unification-build-plan-20260705T010622Z-65a14c (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

revise_required：required skills 已以 SKILL.md fallback 只读执行。当前 review package 仍存在 forbidden file 冲突、stage-result 文件名冲突、specs 存放边界破裂、FR-COMMIT 全阶段覆盖缺失、验证命令不可执行五个阻断项；round 3 未提供 prior blocking report，无法逐项关闭历史 finding。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:33 | 问题: T005 允许在缺失说明时最小补充 workflows/build-plan/SKILL.md，但 plan.md 同时把 workflows/build-plan/SKILL.md 列为 forbidden file，并在 scope 中声明本 task 只允许修改 4 个文件。按当前计划执行时，实施者会在“禁止修改”和“需要补充”之间得到相反指令，可能直接改动 forbidden file 或跳过 FR-WORKTREE-SCOPE-008 的 build-plan 覆盖。 | 建议: 统一 scope：若 build-plan/SKILL.md 禁止修改，则 T005 只能只读核查并在缺失时 fail-loud/另立 task；若允许最小补充，则删除 forbidden 声明，并把 build-plan/SKILL.md 加入允许修改文件清单、影响范围和验证映射。
- [blocking] 位置: specs/worktree-unification/tasks.md:35 | 问题: T006 要求 close step ⑤ 写入 stage-result-verify-code.json，但 spec.md FR-WORKTREE-CLOSE-006 明确要求写入 {{task_tracking_root}}/tasks/{task-id}/stage-result.json。plan.md 又混用 stage-result.json、stage-result-verify-code.json 和泛称 stage-result。按当前计划执行时，verify-code 可能写入一个文件名，而验收检查另一个文件名，导致 close verdict、needs_human、review_status 等证据不可追踪。 | 建议: 选定唯一权威文件名，并同步 spec.md、plan.md、tasks.md、verify-code 既有 FR-PATH-001 引用和验收标准。若沿用现有 verify-code 契约，则把 FR-WORKTREE-CLOSE-006 的 stage-result.json 全部改为 stage-result-verify-code.json。
- [blocking] 位置: specs/worktree-unification/plan.md:56 | 问题: plan.md 把 research.md、data-contracts.md 列为 specs/worktree-unification/ 下的 feature 文档，但 spec.md FR-WORKTREE-SCOPE-009 要求 specs/{task-id}/ 只允许 spec.md、plan.md、tasks.md。tasks.md T006 也只检查 evidence/ 或 stage-result 类文件，未检查 research.md、data-contracts.md、baseline-report.md、constitution-check.md 等非交付物。按当前计划执行时，repo specs/ 与 task_tracking_root 的存放边界会继续破裂。 | 建议: 按 FR-WORKTREE-SCOPE-009 修正：plan.md 不应把过程/分析类文档放在 repo specs/；T006 必须检查 specs/{task-id}/ 下除 spec.md、plan.md、tasks.md 外的所有文件并要求迁移到 {{task_tracking_root}}。若确实要允许更多 repo 内文档，必须先修改 spec 的边界要求。
- [blocking] 位置: specs/worktree-unification/tasks.md:21 | 问题: FR-WORKTREE-COMMIT-004 适用于 5-stage pipeline 中每个 stage/phase，但 tasks.md 只在 T002 覆盖 make-decision 的 R7 commit 规则；没有任务落地 build-spec、build-plan、build-code phase、verify-code 的 commit/no-change 记录规则。Business Impact Scope 已列出“commit 追溯断裂/阶段产物未提交”为高严重度影响。按当前计划执行，除 make-decision 外的 stage 仍可能无提交、无 no-change 记录，审查无法确认阶段产物已固化。 | 建议: 补齐 FR-WORKTREE-COMMIT-004 的全阶段落地：为 build-spec、build-plan、build-code 每 phase、verify-code 增加明确任务和验证；或把 FR 范围收窄到本 task 真正修改的 stage，并在 spec 中删除全 pipeline 承诺。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: tasks.md 没有为 T001-T007 提供可执行 gate_cmd/display_cmd 或等价客观命令。T001 修改 core/task-dir-parser.mjs 这种代码路径，但只写了行为描述，没有测试文件、命令、退出码判据；T002-T006 多数是“读取确认/核查”式验收，也没有机器可判定的 grep、node test、git worktree 前后对比命令。按当前计划执行，验证结果依赖主观判断，无法稳定区分真通过和假绿。 | 建议: 为每个任务补充客观验证：T001 增加 Node 测试命令覆盖 env/yaml/缺失/非目录/不存在；T002-T004 增加针对 SKILL.md 条文和 forbidden fallback 的 grep/脚本检查；T005 增加 git worktree list 前后对比；T006 增加 specs/{task-id}/ 非允许文件扫描和 task_tracking_root 路径检查。命令需区分 gate_cmd 与 display_cmd，gate_cmd 不得用 pipe 吞退出码。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：T005 允许在缺失说明时最小补充 workflows/build-plan/SKILL.md，但 plan.md 同时把 workflows/build-plan/SKILL.md 列为 forbidden file，并在 scope 中声明本 task 只允许修改 4 个文件。按当前计划执行时，实施者会在“禁止修改”和“需要补充”之间得到相反指令，可能直接改动 forbidden file 或跳过 FR-WORKTREE-SCOPE-008 的 build-plan 覆盖。
- 必须修复：T006 要求 close step ⑤ 写入 stage-result-verify-code.json，但 spec.md FR-WORKTREE-CLOSE-006 明确要求写入 {{task_tracking_root}}/tasks/{task-id}/stage-result.json。plan.md 又混用 stage-result.json、stage-result-verify-code.json 和泛称 stage-result。按当前计划执行时，verify-code 可能写入一个文件名，而验收检查另一个文件名，导致 close verdict、needs_human、review_status 等证据不可追踪。
- 必须修复：plan.md 把 research.md、data-contracts.md 列为 specs/worktree-unification/ 下的 feature 文档，但 spec.md FR-WORKTREE-SCOPE-009 要求 specs/{task-id}/ 只允许 spec.md、plan.md、tasks.md。tasks.md T006 也只检查 evidence/ 或 stage-result 类文件，未检查 research.md、data-contracts.md、baseline-report.md、constitution-check.md 等非交付物。按当前计划执行时，repo specs/ 与 task_tracking_root 的存放边界会继续破裂。
- 必须修复：FR-WORKTREE-COMMIT-004 适用于 5-stage pipeline 中每个 stage/phase，但 tasks.md 只在 T002 覆盖 make-decision 的 R7 commit 规则；没有任务落地 build-spec、build-plan、build-code phase、verify-code 的 commit/no-change 记录规则。Business Impact Scope 已列出“commit 追溯断裂/阶段产物未提交”为高严重度影响。按当前计划执行，除 make-decision 外的 stage 仍可能无提交、无 no-change 记录，审查无法确认阶段产物已固化。
- 必须修复：tasks.md 没有为 T001-T007 提供可执行 gate_cmd/display_cmd 或等价客观命令。T001 修改 core/task-dir-parser.mjs 这种代码路径，但只写了行为描述，没有测试文件、命令、退出码判据；T002-T006 多数是“读取确认/核查”式验收，也没有机器可判定的 grep、node test、git worktree 前后对比命令。按当前计划执行，验证结果依赖主观判断，无法稳定区分真通过和假绿。

