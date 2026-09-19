# Build-code / verify-code 执行计划

## Goal

在认证 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-deferred-closeout-20260919`、分支 `task/workflowhub/workflowhub-deferred-closeout-20260919` 中，严格消费当前四份材料，完成 P1–P5 的实施、针对性测试、每 Phase 独立审查、finding 处置、最终聚合、build-code 收尾与 verify-code。完成前不 close；close 前向用户用大白话汇报。

## Authority / boundaries

- 当前材料：`specs/workflowhub-deferred-closeout-20260919/{decision-log.md,spec.md,plan.md,tasks.md}`。
- 外置事实：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-deferred-closeout-20260919/`。
- 当前 snapshot/material revision 以认证运行时返回为准；handoff 只是指针。
- 只跑 tasks.md/plan.md 声明的受影响针对性测试；不跑无范围全量回归。
- 主会话负责写入、集成、事实发布、finding 裁决；读重/独立审查可委派，不能让并行代理共享写入同一文件。
- P2/P4/P5 涉及 `/Users/Hugh/Hugh/Project/3rd-review` 时，遵守真实工作树边界；T027 是 P3 skip ledger，不把它误当跨仓授权。
- 不自动 commit、push、merge、archive、cleanup、close；这些属于独立交付事实/授权。最终只检查 main 工作树改动并报告是否需要处理。

## Phases

1. P1 / T001–T002：跨仓材料标识对齐，WH 侧实现与契约测试。
2. P2 / T003–T014：3rd-review 严格判定拆除与放宽；到达 T027 前检查并遵守跨仓写入确认边界。
3. P3 / T015–T030：workflowhub 严格判定、留痕、确认对称、边界与错误分类。
4. P4 / T031–T032：`cancelManaged` 接线，源漂移取消，禁止墙钟取消。
5. P5 / T033–T042：候选收口、熔断/预检/超时语义、N/A 核验、最终聚合与 integration review。
6. build-code stage-end：manifest 逐项回读、spec-analyze、stage-reflection、stage-handoff，保留 unavailable/incomplete。
7. verify-code：架构师审查一次 → 修复一次 → 异源审查一次 → 收尾修复；不重复审查 unchanged subject。
8. main 检查：读取 main 分支提交差异与工作树脏改动，判断是否存在应合并内容或冲突；不擅自合并。
9. close 前停下：用大白话汇报完成项、测试/审查事实、未完成/unknown/unavailable、main 检查和下一步。

## Current state

- build-plan handoff：stage completed；reflection unavailable；handoff non-authoritative。
- 当前 worktree HEAD：`fcb7078fbdada5e672298006a96037f99b655b2e`。
- 当前实现工作区：P1 已修改 WH review material identity 与契约测试；P2–P4 已完成对应 BR/WH 修复与针对性测试；P5 T035–T041 已有行为/核验事实，T033/T034 仍 pending。四份材料、ADR、planning 目录仍为本任务交付材料。
- main 另有用户脏改动，必须保留并单独核对。

## Evidence / completion checks

- 每个行为 Phase：Phase Card → RED →最小实现→实际 changed-file route→backend/fullstack testing→GREEN→diff/AC trace→一次 phase review→finding disposition→tasks.md 执行事实。
- review unavailable 不改写为 pass；缺 reflection/stage outcome 保持 unavailable。
- T042 final aggregate 只执行一次；之后以 `subject_kind=worktree, phase_id=null, review_scope=integration` 记录当前 review。
- 所有 valid findings 在同 task 修复；每条 finding 显式 `fixed|rejected_invalid|accepted_risk|needs_human`。
- build-code 完成声明必须有当前代码、测试、AC、review、finding disposition、stage-end summary；质量缺失仍限制声明。

## Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| 根目录旧 `task_plan.md` 属于其他任务 | 1 | 保留不动；为本任务建立隔离 `.planning/2026-09-19-workflowhub-deferred-closeout/` |
| main 与认证 worktree 不同 | 1 | 后续全部实现命令显式使用认证 worktree；main 只做末尾只读检查 |
| planning skill 初始路径不存在 | 1 | 改用 `/Users/Hugh/.agents/skills/planning-with-files/SKILL.md`，继续执行 |
| 认证 worktree 路径少写 `workflowhub-` | 2 | 后续所有命令显式使用 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-deferred-closeout-20260919` |
| P1 review 首次 material 含非法 `changed_files` 键 | 1 | 记录失败事实；改用合法 approved_spec/acceptance_criteria/test_evidence 键后只发起一次真实 review |
| P1 首次 GREEN oracle 把换行计入冻结字节 | 1 | 修正 expected hash，保留首次失败为测试 oracle 错误；v2 GREEN 通过 |
| P2 首次大 patch 上下文不匹配 | 1 | 拆成窄 patch；无误改生产文件 |

## Next Step

P5 T033/T034 已按补充后的 spec 合同完成；下一步执行当前 P5 聚合事实，再进入 T042、verify-code 和 main reconciliation。close 前仍需向用户汇报，且不做未经授权的不可逆动作。
