# 审查报告 — build-plan-review-wh-review-rebuild-r2-20260706T074339Z-e42c7f (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

Round 3 仍不可执行：D2 批准 artifact 语义被反转，轮次状态/同源终止规则没完整落任务，且缺少 direct 3rd-review 调用方的全仓迁移扫描。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: D2 人工确认 artifact 语义写反了。spec 要求 `human-confirmation-{stage}-{total_round}.json` 只在人工已批准后落盘，且至少含 `approved_by`/`approved_at`；这里却在 `post_review_action=await_human_confirmation` 时就生成 artifact，并把它当作“等待中”记录使用。T019-T023a 也沿用这套错误语义，执行后会把“待批准”和“已批准”混成同一个文件信号，orchestrator 重启无法可靠区分是否真的拿到人工批准。 | 建议: 把 pending 状态只保留在 `round-state.json` 的 `post_review_action=await_human_confirmation`；`human-confirmation-*.json` 仅由 human orchestrator 批准动作生成，字段至少包含 `approved_by`、`approved_at`、`stage`、`total_round`。同步改写 T011b、T019-T023a、Phase 2 Goal/STOP 和对应 Verify。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:167 | 问题: 轮次状态与同源终止链没有落到可执行任务。Phase 2 Goal 和 T010/T011 只覆盖 `heterologous_round`/`same_source_round`/`total_round`/`mode`/`post_review_action`，但 spec 还要求状态文件落盘 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，并要求同源模式最多 3 轮、`same_source_round=3` 末非 pass 直接 `escalate_to_human`。当前 tasks 没有对应实现任务，也没有验证 `actual_mode=same-source` 的状态/报告一致性。按现计划执行，轮次停止规则和审计字段会缺口，审查流程可能在切到同源后不可追踪或停不住。 | 建议: 把 FR-WHREVIEW-003 和 AC-D10/AC-D10.1 拆成显式任务：状态文件补全必需字段；同源模式 3 轮上限与终止裁决；`actual_mode` 在状态文件与报告 Metadata 双落盘；对应增加 gate_cmd 覆盖异源转同源与同源第 3 轮终止场景。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:66 | 问题: 调用方迁移覆盖面不足。spec 明确要求“任何已按 `--checkpoint=<stage>` 形态直接调用 3rd-review 的代码”都要迁移，但计划只列了 5 个 stage SKILL.md（T019-T023），没有一条 repo 级 reverse-reference scan / caller inventory 任务去确认是否还存在其他直接调用点。3rd-review 接口本期会瘦身，遗漏任何隐藏调用方都会在落地后继续走旧入口并直接失效。 | 建议: 新增一条前置任务：全仓扫描所有 3rd-review 直接调用与 `--checkpoint`/旧 runner 入口引用，形成 caller 清单并逐项判定“迁移/不受影响/删除”；把超出 5 个 stage 的命中点纳入文件清单和验证清单。若扫描结果确实只有 5 个 stage，也要把扫描命令和零额外命中的证据写进 plan/tasks。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：D2 人工确认 artifact 语义写反了。spec 要求 `human-confirmation-{stage}-{total_round}.json` 只在人工已批准后落盘，且至少含 `approved_by`/`approved_at`；这里却在 `post_review_action=await_human_confirmation` 时就生成 artifact，并把它当作“等待中”记录使用。T019-T023a 也沿用这套错误语义，执行后会把“待批准”和“已批准”混成同一个文件信号，orchestrator 重启无法可靠区分是否真的拿到人工批准。
- 必须修复：轮次状态与同源终止链没有落到可执行任务。Phase 2 Goal 和 T010/T011 只覆盖 `heterologous_round`/`same_source_round`/`total_round`/`mode`/`post_review_action`，但 spec 还要求状态文件落盘 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，并要求同源模式最多 3 轮、`same_source_round=3` 末非 pass 直接 `escalate_to_human`。当前 tasks 没有对应实现任务，也没有验证 `actual_mode=same-source` 的状态/报告一致性。按现计划执行，轮次停止规则和审计字段会缺口，审查流程可能在切到同源后不可追踪或停不住。
- 必须修复：调用方迁移覆盖面不足。spec 明确要求“任何已按 `--checkpoint=<stage>` 形态直接调用 3rd-review 的代码”都要迁移，但计划只列了 5 个 stage SKILL.md（T019-T023），没有一条 repo 级 reverse-reference scan / caller inventory 任务去确认是否还存在其他直接调用点。3rd-review 接口本期会瘦身，遗漏任何隐藏调用方都会在落地后继续走旧入口并直接失效。

