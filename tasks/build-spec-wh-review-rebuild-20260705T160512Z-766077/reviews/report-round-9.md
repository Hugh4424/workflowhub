# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 9)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐升级阈值、规则优先级、报告6章合同这3个缺口，再进入实现。

## Findings

- [blocking] 问题: 审查升级规则缺少可执行阈值 | 建议: FR-WHREVIEW-003 和 GAP-4 只写了“连续3轮出现大量 blocking”才升级人工，但“大量”没有数值定义，也没有说明按单轮 blocking_count、累计 blocking 数还是唯一指纹数判断。实现方无法稳定产出一致裁决，AC3-3 和 AC-D10 也无法客观验收。
- [blocking] 问题: 第4轮转同源与第3轮升级人工的冲突未定序 | 建议: 规则同时声明“异源最多3轮；第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”，GAP-5 也承认优先级未明确。若第3轮刚满足升级条件、或第4轮进入时仍满足重复 blocking，系统应返回 same-source 继续审查还是 escalate_to_human 没有确定答案，流程不可实现。
- [blocking] 问题: 报告6章结构未定义却被列为强验收项 | 建议: FR-WHREVIEW-004、AC4-3、UC-7 要求 render-review-report.mjs 输出固定6章结构，但 Known Gaps 明确写“6章结构名称未明确列出”。这使报告模板、渲染脚本、验收检查都缺少明确合同，实施者只能猜。
- [minor] 问题: D2 人工确认门的触发载体不清 | 建议: FR-D2-001 规定 make-decision / build-plan / verify-code 的 pass 不自动推进，但没有定义是 wh-review 返回额外字段、stage SKILL.md 写明挂起动作，还是由 orchestration 层拦截。建议补一条最小接口约定，避免 5 个 stage 各自实现。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查升级规则缺少可执行阈值
- 必须修复：第4轮转同源与第3轮升级人工的冲突未定序
- 必须修复：报告6章结构未定义却被列为强验收项

