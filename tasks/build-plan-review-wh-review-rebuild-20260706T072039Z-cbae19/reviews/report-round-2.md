# 审查报告 — build-plan-review-wh-review-rebuild-20260706T072039Z-cbae19 (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

round 1 的 5 个 blocking 本轮都还在：阶段六段结构、可运行验证、D2 完整状态链、5-stage 调用迁移、Governance Sync Matrix 均未闭环。先把这 5 项补齐，再进下一轮。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/plan.md:117 | 问题: 连续两轮未关闭：Phase 1-3 仍然只有“目的 + Step + Checkpoint”，没有评审合同要求的 `Goal / Files / Tasks / Verify / Knowledge / STOP` 六段结构。现在阶段完成定义、知识沉淀位置、以及人工停止点都不可检查，计划不可控。 | 建议: 把每个 Phase 重写成六段格式，并为每段补可检查的完成条件、精确文件面、验证方式、知识落盘位置、以及明确 STOP 条件。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:6 | 问题: 连续两轮未关闭：tasks.md 仍没有可运行的验证命令。当前只有“可静态核查/可复核通过/冒烟方案”等描述，没有 `gate_cmd` / `display_cmd` 级别的客观校验，Fake Command 审查、行为验收、失败复现都无法执行。 | 建议: 为每个代码阶段和关键任务补双列验证命令，至少覆盖 route-decision、round-state、report 渲染、D2 门、3rd-review 单次调用、threatAuditor 语义判定、以及 5-stage 迁移后的不回退检查。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: 连续两轮未关闭：FR-D2-001 的关键执行面仍未完整落到任务。T019-T021 只写“接入 D2 人工确认门”，但 spec 明确要求 `post_review_action` 落盘、`tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` artifact、以及 orchestrator 重启后的读取/恢复逻辑；当前 FR → task → verify 链仍然断裂。 | 建议: 新增显式任务和验证，分别覆盖 `post_review_action` 写入、human-confirmation artifact 生成/读取、orchestrator 重启恢复判断、以及 AC8-1 到 AC8-4 的行为验证。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: 连续两轮未关闭：Business Impact Scope 的核心破坏性变更是“5 个 stage 从直接调用 3rd-review 迁移为调用 wh-review”，但 T019-T023 仍只写“回归校验收尾统一调用点 / 接入 D2 门 / 确认自动推进不变”。5 个 stage 的真实调用替换、`stage`/`task_id` 透传、专属合同路由命中、以及未纳入冒烟覆盖 stage 不因接口变更报错，都没有被拆成可执行任务。 | 建议: 按 5 个 stage 分别补迁移任务，明确 direct 3rd-review call -> wh-review call 的替换、`stage` 与 `task_id` 透传、route-decision 命中校验，并补未覆盖 stage 的非回归验证任务。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:59 | 问题: 连续两轮未关闭：计划仍缺少合同要求的 7 类 Governance Sync Matrix。当前改动已触及 workflows、合同/评审契约、schema 化落盘文件、runner/runtime、knowledge/test 文档，但 plan 没有逐项给出 `changed/unchanged + reason + Task ID`，实施时无法判断哪些治理面必须同步更新。 | 建议: 补全 7 类治理同步矩阵，逐项覆盖 Project rules、Workflow definitions、Reviewer contract、Schema、Runtime config、Knowledge/doc、Automation gates/CI/hooks；凡标记 `changed` 的项必须指向具体 Task ID。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：连续两轮未关闭：Phase 1-3 仍然只有“目的 + Step + Checkpoint”，没有评审合同要求的 `Goal / Files / Tasks / Verify / Knowledge / STOP` 六段结构。现在阶段完成定义、知识沉淀位置、以及人工停止点都不可检查，计划不可控。
- 必须修复：连续两轮未关闭：tasks.md 仍没有可运行的验证命令。当前只有“可静态核查/可复核通过/冒烟方案”等描述，没有 `gate_cmd` / `display_cmd` 级别的客观校验，Fake Command 审查、行为验收、失败复现都无法执行。
- 必须修复：连续两轮未关闭：FR-D2-001 的关键执行面仍未完整落到任务。T019-T021 只写“接入 D2 人工确认门”，但 spec 明确要求 `post_review_action` 落盘、`tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` artifact、以及 orchestrator 重启后的读取/恢复逻辑；当前 FR → task → verify 链仍然断裂。
- 必须修复：连续两轮未关闭：Business Impact Scope 的核心破坏性变更是“5 个 stage 从直接调用 3rd-review 迁移为调用 wh-review”，但 T019-T023 仍只写“回归校验收尾统一调用点 / 接入 D2 门 / 确认自动推进不变”。5 个 stage 的真实调用替换、`stage`/`task_id` 透传、专属合同路由命中、以及未纳入冒烟覆盖 stage 不因接口变更报错，都没有被拆成可执行任务。
- 必须修复：连续两轮未关闭：计划仍缺少合同要求的 7 类 Governance Sync Matrix。当前改动已触及 workflows、合同/评审契约、schema 化落盘文件、runner/runtime、knowledge/test 文档，但 plan 没有逐项给出 `changed/unchanged + reason + Task ID`，实施时无法判断哪些治理面必须同步更新。

