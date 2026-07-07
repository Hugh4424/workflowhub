# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 7)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 3rd-review 独立调用契约、同源 fallback 完整流程、human-brief-template 前置依赖归属，再清理报告章节定义冲突。

## Findings

- [blocking] 问题: 3rd-review 独立调用契约未定义 | 建议: NFR-3 和 FR-THIRDREVIEW-001 要求 3rd-review 脱离 wh-review 也能独立复用，但正文只定义了 wh-review 先装配完整纯文本审查包再调用引擎，没有给出独立调用时的最小输入格式、调用入口、结果文件位置、失败语义。实现时无法判断什么叫“无 wh-review 场景下可独立调用”，验收也缺少可执行用例。
- [blocking] 问题: 同源 fallback 主流程缺规格闭环 | 建议: FR-WHREVIEW-003 规定“第4轮起强制转同源”且同源最多3轮，但没有定义进入同源后的实际调用入口、contract/materials 是否复用、same-source 的执行主体、pass/revise_required/escalate_to_human 的转换规则，也没有对应验收覆盖同源第1/2/3轮。当前 AC3 只覆盖第3轮直接升级人工，不覆盖“不满足升级条件时进入第4轮同源并终止”的核心分支。
- [blocking] 问题: 强依赖 human-brief-template 但前置条件未收敛 | 建议: FR-STAGE-001 要求 5 个 stage 统一调用 docs/human-brief-template.md，Known Gaps 又明确“是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出”。这不是可延后细节，而是主流程硬依赖；若文件不存在，本期 scope 必须显式包含创建/落盘规则，否则 5 个 stage 收尾统一无法落地。
- [minor] 问题: 报告六章定义与 Known Gaps 表述冲突 | 建议: FR-WHREVIEW-004 已把 6 章名称、顺序、语义全部定死，但 Known Gaps 仍写“6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义”。两处 source of truth 冲突，容易让后续实现误以为章节名仍可变。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 独立调用契约未定义
- 必须修复：同源 fallback 主流程缺规格闭环
- 必须修复：强依赖 human-brief-template 但前置条件未收敛

