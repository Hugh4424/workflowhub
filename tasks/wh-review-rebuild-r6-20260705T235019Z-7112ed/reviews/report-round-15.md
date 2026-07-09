# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 15)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 唯一调用契约，并把 `docs/human-brief-template.md` 明确纳入本期交付或验收前置，再清理已过期的 Known Gaps。

## Findings

- [blocking] 问题: 3rd-review 输入契约自相矛盾 | 建议: 文档前部将 3rd-review 定义为接收 `{mode, contract, materials}` 的纯引擎，但 FR-THIRDREVIEW-001 的方案A又要求 wh-review 先把合同内容与材料拼成单一纯文本审查包，再调用 3rd-review，且 3rd-review 不再感知合同字段。这会直接影响接口设计、日志断言、AC5-3 测试写法和兼容性判断，当前无法唯一实现。需要在规格里只保留一种调用契约，并同步修正所有引用位置。
- [blocking] 问题: `docs/human-brief-template.md` 被当作未知前置依赖，未转成明确交付物 | 建议: FR-STAGE-001/AC7-1 要求 5 个 stage 统一调用 `docs/human-brief-template.md`，但 Known Gaps 又写明该文件“是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出”。这使核心路径依赖一个未承诺交付的文件：如果仓库中不存在，规格没有要求本期创建它，也没有定义失败条件或替代方案，实施会卡在主流程。应把该模板文件明确列为本期 in-scope 交付，或把存在性检查和创建动作写进验收标准。
- [minor] 问题: Known Gaps 保留了已被正文定死的报告章节待确认项 | 建议: FR-WHREVIEW-004 已经把 6 章名称、顺序、语义全部定死，但 Known Gaps 仍写“6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义”。这会给实现者错误信号，像是章节名仍可变。应删除该 gap，或改成仅允许核对措辞而不改变既定结构。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 输入契约自相矛盾
- 必须修复：`docs/human-brief-template.md` 被当作未知前置依赖，未转成明确交付物

