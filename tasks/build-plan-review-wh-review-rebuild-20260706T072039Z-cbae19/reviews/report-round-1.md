# 审查报告 — build-plan-review-wh-review-rebuild-20260706T072039Z-cbae19 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

已按 speckit-analyze、plan-eng-review、review 三个 lens 做只读复核。当前主要问题不是方向错，而是执行控制面不够：阶段格式不合约、验证不可运行、D2 人工确认链条没落全、5-stage 调用迁移没拆实、治理同步矩阵缺失。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/plan.md:117 | 问题: 三个 Phase 都只有“目的 + Step + Checkpoint”，缺少合同要求的六段结构 `Goal / Files / Tasks / Verify / Knowledge / STOP`。现在无法在阶段边界判断完成定义、知识沉淀和人工停止点，执行不可控。 | 建议: 把 Phase 1-3 全部改成六段格式；每段都写清可检查的 Goal、精确 Files、任务清单、可执行 Verify、Knowledge 落盘位置、以及明确 STOP 条件。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:6 | 问题: 任务与阶段检查点没有任何可运行的验证命令，只有“可静态核查/可复核通过/端到端冒烟方案”等描述。缺少 `gate_cmd`/`display_cmd` 级别的客观校验后，Fake Command 审查、行为验收、失败复现都无法落地。 | 建议: 为每个代码阶段或关键任务补双列验证：机器判定用 `gate_cmd`，人工摘要用 `display_cmd`；覆盖 route-decision、round-state、report 渲染、D2 门、3rd-review 单次调用、threatAuditor 语义防误判等关键验收点。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: FR-D2-001 的关键执行面没有完整落到任务：任务只写了“接入 D2 人工确认门”，但 spec 还强制要求 `post_review_action` 落盘、`tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` 人工确认 artifact、以及 orchestrator 重启后的读取/恢复逻辑。当前 FR → task → verify 链断裂。 | 建议: 新增显式任务，分别覆盖：1) 轮次状态文件写入 `post_review_action`；2) 生成/读取 human-confirmation artifact；3) orchestrator 重启恢复判断；4) AC8-1~AC8-4 的对应验证。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: Business Impact Scope 里最核心的破坏性变更是“5 个 stage 从直接调用 3rd-review 迁移为调用 wh-review”，但 T019-T023 只写“回归校验收尾统一调用点 / 接入 D2 门 / 确认自动推进不变”，没有把 5 个 stage 的真实调用迁移、`stage/task_id` 透传、以及接口变更后的未覆盖 stage 不报错作为独立任务落下来。 | 建议: 按 5 个 stage 分别补迁移任务，明确替换 direct 3rd-review call 为 wh-review call、透传 `stage` 与 `task_id`、校验 route-decision 命中专属合同；同时补一项验证未纳入冒烟覆盖的 stage 不因接口变更报错或阻塞。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:59 | 问题: 计划触及 workflows、reviewer contract/合同、schema 化落盘文件、runtime runner 发现、knowledge/test 文档、以及潜在自动化验证，但 plan 里没有合同要求的 7 类 Governance Sync Matrix。缺少“changed/unchanged + reason + 对应 Task ID”后，实施者无法判断哪些治理面必须同步更新。 | 建议: 补一张 7 类治理同步矩阵，逐项覆盖 Project rules、Workflow definitions、Reviewer contract、Schema、Runtime config、Knowledge/doc、Automation gates/CI/hooks；凡标记 changed 的项都要指向具体任务 ID。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：三个 Phase 都只有“目的 + Step + Checkpoint”，缺少合同要求的六段结构 `Goal / Files / Tasks / Verify / Knowledge / STOP`。现在无法在阶段边界判断完成定义、知识沉淀和人工停止点，执行不可控。
- 必须修复：任务与阶段检查点没有任何可运行的验证命令，只有“可静态核查/可复核通过/端到端冒烟方案”等描述。缺少 `gate_cmd`/`display_cmd` 级别的客观校验后，Fake Command 审查、行为验收、失败复现都无法落地。
- 必须修复：FR-D2-001 的关键执行面没有完整落到任务：任务只写了“接入 D2 人工确认门”，但 spec 还强制要求 `post_review_action` 落盘、`tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` 人工确认 artifact、以及 orchestrator 重启后的读取/恢复逻辑。当前 FR → task → verify 链断裂。
- 必须修复：Business Impact Scope 里最核心的破坏性变更是“5 个 stage 从直接调用 3rd-review 迁移为调用 wh-review”，但 T019-T023 只写“回归校验收尾统一调用点 / 接入 D2 门 / 确认自动推进不变”，没有把 5 个 stage 的真实调用迁移、`stage/task_id` 透传、以及接口变更后的未覆盖 stage 不报错作为独立任务落下来。
- 必须修复：计划触及 workflows、reviewer contract/合同、schema 化落盘文件、runtime runner 发现、knowledge/test 文档、以及潜在自动化验证，但 plan 里没有合同要求的 7 类 Governance Sync Matrix。缺少“changed/unchanged + reason + 对应 Task ID”后，实施者无法判断哪些治理面必须同步更新。

