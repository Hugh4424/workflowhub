# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

先收敛 3rd-review 最终输入契约，再定死报告/状态/route-decision/Delta 的路径与 schema，并补一个统一的人工确认门机器接口。

## Findings

- [blocking] 问题: 3rd-review 调用契约前后自相矛盾 | 建议: §2/§6/FR-WHREVIEW-001 把 3rd-review 输入写成 `{mode, contract, materials}`，但 FR-THIRDREVIEW-001 方案A 又要求 wh-review 先把合同与材料装配成一份纯文本审查包，并明确 `禁止传入` stage 路由参数、实现 `零 stage 知识纯引擎`。这里没有定死 3rd-review 最终到底接收三元组、还是接收单一审查包，调用方和验收实现会分叉，属于接口级阻断。
- [blocking] 问题: 关键落盘物的固定路径与文件 schema 没定死 | 建议: 多处验收要求机器验证固定产物，但规格只写了“任务目录下固定子路径”或占位符：报告路径（AC1-3/AC4-2）、route-decision 记录文件（AC2-2/AC-D4）、轮次状态文件（AC3-1/AC-D10）、Delta Package 文件（AC3-2）都没有给出确切相对路径、命名规则、最小字段 schema。没有这些，集成测试无法写成稳定断言，不同实现也会互不兼容。
- [blocking] 问题: D2 人工确认门缺少统一的机器接口 | 建议: 规格要求 make-decision/build-plan/verify-code 的 `pass` 必须停在人工确认门，但 wh-review 最终只允许返回 `pass | revise_required | escalate_to_human` 三值，没有额外字段表达“pass 但禁止自动推进”。结果只能把 gating 逻辑散落到 3 个 stage 调用方各自实现，和 FR-STAGE-001 的“收尾统一”目标冲突，也容易再次产生不一致行为。需要定死一个统一信号，比如 `next_action=await_human_approval` 或等价状态文件字段。
- [minor] 问题: human-brief-template 依赖归属未闭合 | 建议: FR-STAGE-001 把 5 个 stage 收尾统一绑定到 `docs/human-brief-template.md`，但 Known Gaps 明说该文件“是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出”。这会把基础依赖留到后续阶段才决定，增加返工风险。最好在规格里直接定死：文件已存在并复用，或本期 in-scope 负责创建。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 调用契约前后自相矛盾
- 必须修复：关键落盘物的固定路径与文件 schema 没定死
- 必须修复：D2 人工确认门缺少统一的机器接口

