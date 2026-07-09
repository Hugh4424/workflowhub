# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 31)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 唯一输入契约、定死报告/状态文件路径、明确 `docs/human-brief-template.md` 的交付归属，再进入实现。

## Findings

- [blocking] 问题: 3rd-review 输入契约前后冲突，无法按同一接口实现 | 建议: 文档在多个位置给出互相冲突的 3rd-review 调用语义。§2/§6/FR-WHREVIEW-001 仍写成 `3rd-review {mode, contract, materials}` 或输入 `{mode, contract, materials}`；但 FR-THIRDREVIEW-001 方案A又要求 wh-review 先把合同与材料装配成“单份纯文本审查包”，并明确 3rd-review 只接收这份已装配输入、不感知合同路由。实现方无法判断引擎接口到底是结构化三元组还是单文本包，验收 AC5-3 也无法据此稳定设计日志与测试。
- [blocking] 问题: 报告与状态落盘路径未定死，多个验收条款无法唯一验证 | 建议: 规格多处只说“任务目录下固定子路径”或“当前任务目录”，但没有给出唯一规范路径。AC1-3 使用 `<task-dir>/<task-id>/reviews/`，AC4-2 只要求可预测固定子路径，§6/FR-WHREVIEW-004 只说落盘当前任务目录，AC-D10 也未定义状态文件具体位置。实现、grep、集成测试都需要唯一路径约定；否则不同实现都可能自称符合规格。
- [blocking] 问题: `docs/human-brief-template.md` 依赖未定，5 个 stage 收尾统一需求不可闭合 | 建议: FR-STAGE-001 把 5 个 stage 收尾统一调用 `docs/human-brief-template.md` 设为本期硬性范围和验收条件，但 Known Gaps 又说明该文件“是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出”。这使关键交付缺少明确决策：若文件不存在，本期是要创建它、迁移它，还是阻塞本功能。当前规格会导致实现范围和验收边界不确定。
- [minor] 问题: 同源轮次规则表述混乱，建议重写成独立状态机 | 建议: FR-WHREVIEW-003 同时写了“第4轮起强制转同源”“同源模式最多3轮”“同源第3轮末仍非 pass 直接升级人工”，但轮次编号是在全局计数还是同源局部计数没有用统一示例说明，且“第4轮起（同源第3轮末）”表述本身易误解。虽可推断作者意图，但测试设计和日志字段定义会更稳妥于用显式状态机/计数器规则重写。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 输入契约前后冲突，无法按同一接口实现
- 必须修复：报告与状态落盘路径未定死，多个验收条款无法唯一验证
- 必须修复：`docs/human-brief-template.md` 依赖未定，5 个 stage 收尾统一需求不可闭合

