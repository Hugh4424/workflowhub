# 审查报告 — build-plan-review-wh-review-rebuild-r2-20260706T074339Z-e42c7f (round 5)

- verdict: revise_required
- provenance: single-context

## Summary

Round 5 仍有 4 个阻断点：D2 批准 artifact 契约错误、缺少 wh-review→3rd-review 核心调用任务、轮次状态字段覆盖不足、以及多条 Verify 命令不可执行。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: D2 人工确认 artifact 契约写偏了。T011b 计划生成的 `human-confirmation-{stage}-{total_round}.json` 只含 `stage/total_round/verdict/awaiting_since`，但 spec 的 FR-D2-001 要求该路径记录的是人工批准结果，至少含 `approved_by/approved_at/stage/total_round`，且重启恢复逻辑据此判断是否已批准。 | 建议: 把“等待确认状态”和“人工批准 artifact”分开，或把 T011b/T023a 改成严格落地并消费 spec 定义的批准 artifact 字段与语义；同时补一条可执行验证，区分未批准与已批准重启后的行为。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:173 | 问题: 计划没有落地 wh-review 调用 3rd-review 的核心执行面。现有文件/任务只有 `route-decision-writer.mjs`、`round-state.mjs`、`render-review-report.mjs` 等外围件，没有显式任务实现 runner 发现、`node <runner> --diff=<file> --output=<file>` 调用、超时处理、结果文件缺失转 `escalate_to_human`、以及 `tasks/{task-id}/reviews/verdict-round-{total_round}.raw.json` 落盘。 | 建议: 新增独立任务和精确文件，覆盖 runner discovery、三元组序列化写入 `--diff`、`--output` 原始 JSON 落盘、超时/非零退出/结果缺失处理、以及调用日志/验证命令，确保 FR-THIRDREVIEW-001 真正可执行。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:167 | 问题: 轮次状态覆盖不完整。Phase 2 Goal 和对应任务只规划了 `heterologous_round/same_source_round/total_round/mode/post_review_action`，但 spec 的状态契约还要求 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，且 AC-D10/AC-D10.1 依赖这些字段审计升级与同源切换。 | 建议: 把缺失字段补进 `round-state.mjs` 的任务、文件说明和 Verify，尤其补 `actual_mode` 与升级相关字段的机器校验，并把报告 Metadata 与状态文件的一致性纳入 gate_cmd。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:107 | 问题: 多条 Verify 命令不是可直接执行的客观 gate。示例包括 line 83-85 的 `<3rd-review repo>` 占位符、line 107 的 `<base>..<head>` 占位符和转义后的 `\|`，这些都使 gate_cmd 不能按写法直接运行；因此验证链不可复现，也不满足 fake-command 约束。 | 建议: 把所有 gate_cmd 改成仓库内可直接运行的真实命令：替换占位符为确定路径/变量约定，去掉会破坏 shell 语义的转义写法，必要时拆成 `gate_cmd` 与 `display_cmd`，并确保退出码能真实反映通过/失败。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：D2 人工确认 artifact 契约写偏了。T011b 计划生成的 `human-confirmation-{stage}-{total_round}.json` 只含 `stage/total_round/verdict/awaiting_since`，但 spec 的 FR-D2-001 要求该路径记录的是人工批准结果，至少含 `approved_by/approved_at/stage/total_round`，且重启恢复逻辑据此判断是否已批准。
- 必须修复：计划没有落地 wh-review 调用 3rd-review 的核心执行面。现有文件/任务只有 `route-decision-writer.mjs`、`round-state.mjs`、`render-review-report.mjs` 等外围件，没有显式任务实现 runner 发现、`node <runner> --diff=<file> --output=<file>` 调用、超时处理、结果文件缺失转 `escalate_to_human`、以及 `tasks/{task-id}/reviews/verdict-round-{total_round}.raw.json` 落盘。
- 必须修复：轮次状态覆盖不完整。Phase 2 Goal 和对应任务只规划了 `heterologous_round/same_source_round/total_round/mode/post_review_action`，但 spec 的状态契约还要求 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，且 AC-D10/AC-D10.1 依赖这些字段审计升级与同源切换。
- 必须修复：多条 Verify 命令不是可直接执行的客观 gate。示例包括 line 83-85 的 `<3rd-review repo>` 占位符、line 107 的 `<base>..<head>` 占位符和转义后的 `\|`，这些都使 gate_cmd 不能按写法直接运行；因此验证链不可复现，也不满足 fake-command 约束。

