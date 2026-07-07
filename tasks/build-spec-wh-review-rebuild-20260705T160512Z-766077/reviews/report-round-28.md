# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 28)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐升级阈值和冲突优先级这两个规则，再冻结 6 章报告结构与 standalone 契约；补完后才能进入可实现、可验收状态。

## Findings

- [blocking] 问题: 审查升级阈值未定义，FR-WHREVIEW-003 无法落地或验收 | 建议: 规格要求“连续3轮出现大量 blocking 或指纹重复 blocking → 升级人工”，但“大量”没有数值定义。Known Gaps 也承认需后续补充。没有明确阈值，无法实现 deterministic 规则，也无法对 AC3-3、AC-D10 做机器验收。
- [blocking] 问题: 第4轮“强制转同源”与“连续3轮 blocking 升级人工”冲突，优先级未定 | 建议: FR-WHREVIEW-003 同时规定“异源最多3轮；第4轮起强制转同源”与“连续3轮 blocking 或指纹重复 blocking → 升级人工”。当第1-3轮连续 blocking 时，第4轮到底应转 same-source 还是直接 escalate_to_human，规格没有唯一答案。Known Gaps 已指出该冲突，但当前文档仍不足以指导实现和验收。
- [minor] 问题: 报告 6 章结构只要求存在，章节名仍未落定 | 建议: FR-WHREVIEW-004 要求报告为 6 章结构，AC4-3 还要求“结构名称在 SKILL.md 中明确定义”，但 Known Gaps 明确写明 6 章名称尚未核实。问题已被识别，不一定阻断编码启动，但在 build-plan 前必须补齐，否则报告渲染验收口径不稳定。
- [minor] 问题: 3rd-review standalone 参数契约存在已知不一致，迁移风险未收口 | 建议: OPEN-1 说明 standalone.sh 与 SKILL.md 的 `--engine`/`--output`/返回结构不一致。本规格把 3rd-review 重定义为 `{mode, contract, materials} -> {verdict, findings, actual_mode}`，但没有给出现存脚本对齐策略。若实现阶段不先收口，NFR-3 的“独立复用”容易落空。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查升级阈值未定义，FR-WHREVIEW-003 无法落地或验收
- 必须修复：第4轮“强制转同源”与“连续3轮 blocking 升级人工”冲突，优先级未定

