# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 25)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐3个缺口：定义 blocking 数值阈值、确定第4轮/升级人工优先级、写死报告6章结构名称，再进入 build-plan/实现。

## Findings

- [blocking] 问题: 升级人工触发条件缺少可执行阈值 | 建议: 规格把升级条件写成“连续3轮出现大量 blocking”或指纹重复，但“大量”没有数值定义。Known Gaps 的 GAP-4 也承认这一点。没有阈值，`blocking_count` 字段无法稳定裁决，FR-WHREVIEW-003、AC3-3、AC-D10 不能一致实现。
- [blocking] 问题: 第4轮转同源与第3轮升级人工规则冲突 | 建议: 规格同时要求“异源最多3轮；第4轮起强制转同源”以及“连续3轮 blocking 或指纹重复 blocking → 升级人工”，但优先级未定义。Known Gaps 的 GAP-5 已指出冲突。这个分支会直接改变 `verdict`、`mode` 和是否继续自动流程，属于核心控制流缺口。
- [blocking] 问题: 报告6章结构未定义，验收无法落地 | 建议: FR-WHREVIEW-004 和 AC4-3 要求报告必须是“6章结构”，且结构名称要在 SKILL.md 中明确定义；Known Gaps 又明确说 6 章名称尚未核实。当前实现者无法判断 `render-review-report.mjs` 应输出什么章节，也无法做机器验收。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：升级人工触发条件缺少可执行阈值
- 必须修复：第4轮转同源与第3轮升级人工规则冲突
- 必须修复：报告6章结构未定义，验收无法落地

