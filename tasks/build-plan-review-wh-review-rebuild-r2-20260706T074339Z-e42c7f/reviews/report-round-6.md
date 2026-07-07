# 审查报告 — build-plan-review-wh-review-rebuild-r2-20260706T074339Z-e42c7f (round 6)

- verdict: revise_required
- provenance: single-context

## Summary

Round 6 仍不能 pass。Round 5 的 4 个阻断项都还开着：D2 批准 artifact 语义仍冲突、wh-review 主调度调用链仍无实现任务、round-state 仍缺审计字段、Verify 命令仍有占位符和不可执行写法。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: D2 人工确认 artifact 契约仍然写反。spec 要求 `human-confirmation-{stage}-{total_round}.json` 是“人工批准后”的 artifact，至少含 `approved_by`、`approved_at`、`stage`、`total_round`；现在 T011b 仍在等待态就生成该文件，字段还是 `stage/total_round/verdict/awaiting_since`，T023a 也继续按这个等待态文件做恢复判断。 | 建议: 把等待态与批准态拆开：等待态只依赖 `post_review_action=await_human_confirmation` 停住；批准后再写入 spec 定义的 approval artifact，并让重启恢复只在 artifact 存在且字段匹配时推进。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:172 | 问题: wh-review→3rd-review 的核心执行面仍未落到具体文件/任务。spec 已定死 runner discovery、`node <runner> --diff=<file> --output=<file>` 单次调用、timeout/非零退出/结果缺失→`escalate_to_human`、以及 `tasks/{task-id}/reviews/verdict-round-{total_round}.raw.json` 落盘；但 Phase 2 Files/Tasks 仍只有 route-decision、round-state、human-confirmation、report render、stage 接入，没有负责主调度调用链的实现文件或任务。 | 建议: 新增明确的 wh-review 调度入口文件和任务，覆盖 runner 发现、三元组序列化写入 `--diff`、`--output` 原始 JSON 落盘、timeout/失败映射、结果解析、Delta Package 构造与 mode 切换，并为这些点补独立 gate_cmd。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:167 | 问题: round-state 最小字段集仍然不完整。plan/tasks 继续只覆盖 `heterologous_round`、`same_source_round`、`total_round`、`mode`、`post_review_action`，但 spec 的状态契约还要求 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`；AC-D10 和 AC-D10.1 依赖这些字段。 | 建议: 把缺失字段补进 Phase 2 Goal、Files、Tasks、Verify 和 T010/T011/T011a，尤其补 `actual_mode=same-source`、`report_path`、`blocking_count`、`fingerprint_repeated` 的机器校验，并校验状态文件与报告 Metadata 一致。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:83 | 问题: 多条 gate_cmd 仍不可直接执行，验证链不客观。当前还保留 `<3rd-review repo>` 占位符、`<base>..<head>` 占位符，以及被转义成字面量的 `\|` 管道写法；这些命令按文面无法直接跑通，也不满足 fake-command 约束。 | 建议: 把所有 gate_cmd 改成真实可运行命令：用确定路径或明确的环境变量约定替换占位符，去掉会破坏 shell 语义的转义，必要时拆分为 `gate_cmd` 和 `display_cmd`，并确保退出码真实反映通过/失败。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：D2 人工确认 artifact 契约仍然写反。spec 要求 `human-confirmation-{stage}-{total_round}.json` 是“人工批准后”的 artifact，至少含 `approved_by`、`approved_at`、`stage`、`total_round`；现在 T011b 仍在等待态就生成该文件，字段还是 `stage/total_round/verdict/awaiting_since`，T023a 也继续按这个等待态文件做恢复判断。
- 必须修复：wh-review→3rd-review 的核心执行面仍未落到具体文件/任务。spec 已定死 runner discovery、`node <runner> --diff=<file> --output=<file>` 单次调用、timeout/非零退出/结果缺失→`escalate_to_human`、以及 `tasks/{task-id}/reviews/verdict-round-{total_round}.raw.json` 落盘；但 Phase 2 Files/Tasks 仍只有 route-decision、round-state、human-confirmation、report render、stage 接入，没有负责主调度调用链的实现文件或任务。
- 必须修复：round-state 最小字段集仍然不完整。plan/tasks 继续只覆盖 `heterologous_round`、`same_source_round`、`total_round`、`mode`、`post_review_action`，但 spec 的状态契约还要求 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`；AC-D10 和 AC-D10.1 依赖这些字段。
- 必须修复：多条 gate_cmd 仍不可直接执行，验证链不客观。当前还保留 `<3rd-review repo>` 占位符、`<base>..<head>` 占位符，以及被转义成字面量的 `\|` 管道写法；这些命令按文面无法直接跑通，也不满足 fake-command 约束。

