# 基线对照报告 — wh-review-rebuild

**任务 ID**: wh-review-rebuild
**日期**: 2026-07-06
**数据源**: M10 baseline（archived AgentHub M1-M3 quasi-experiment）

> 阈值由人工设定，基线仅为参考，不符合不阻断推进（F3/Q1）。
> unknown 值为诚实记录，不伪造数值（F9）。

---

## M11 Actual vs M10 Baseline

| Metric | M11 Actual | M10 Baseline | Direction Delta | 说明 |
|---|---|---|---|---|
| missed_step_rate | unknown | 0.05 | unknown | wh-review-rebuild task-metrics.jsonl 尚无 journal 事件流（stage_enter/exit），无法推导 |
| test_execution_rate | unknown | 0.8295 | unknown | 需 rowKind=test 的执行记录，当前 build-spec 阶段无测试执行记录 |
| review_execution_rate | unknown | 1 | unknown | 需 rowKind=review 的执行记录；3rd-review 独立审查尚未完成（verdict=unknown） |
| rework_rounds | 0 | 6.075 | better（↓） | build-spec 阶段 rework_rounds 核心字段直接来自 recordSkeleton，本轮无返工 |
| rework_proxy_count | unknown | 25.25 | unknown | 需跨 journal + reviews.jsonl blocking 汇总，当前数据不足 |

**unknown 原因汇总**：wh-review-rebuild 任务在 build-spec 阶段尚无完整 journal 事件流（stage_enter/stage_exit/phase_pre_review/checkpoint_request），missed_step_rate / test_execution_rate / review_execution_rate / rework_proxy_count 四项均需从 journal 事件推导，无可用数据。rework_rounds 直接来自 task-metrics.jsonl 核心字段，可计算。

**数据局限性（FR-BASELINE-002）**：M10 baseline 来自 archived AgentHub M1-M3 quasi-experiment，跨系统（AgentHub→workflowhub）数据无法直接映射，仅作粗略参考线，非受控测量。

---

## 结论

rework_rounds=0 优于 M10 基线（6.075），方向有利。其余4项因数据缺失标注 unknown，不构成阻断。
