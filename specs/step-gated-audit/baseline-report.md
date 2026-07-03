# M11 vs M10 Baseline 对照表 — step-gated-audit

> 基线来源：`specs/archive/m10-baseline-switch/baseline-report.md`（4 个历史 agenthub task 均值）
> M11 actual：本 task 尚未执行，数据不可计算，如实标注 unknown。
> 禁止编造（F9）：unknown 是诚实值，不是失败。

## 五项指标对照

| Metric | M11 Actual | M10 Baseline | Direction | Delta |
|---|---|---|---|---|
| missed_step_rate | unknown | 0.05 | lower is better | unknown（数据缺失：task 尚未执行，无 journal 采集） |
| test_execution_rate | unknown | 0.8295 | higher is better | unknown（数据缺失：同上） |
| review_execution_rate | unknown | 1.0 | higher is better | unknown（数据缺失：同上） |
| rework_rounds | unknown | 6.075 | lower is better | unknown（数据缺失：同上） |
| rework_proxy_count | unknown | 25.25 | lower is better | unknown（数据缺失：同上） |

## M10 基线来源明细

| task_id | missed_step_rate | test_execution_rate | review_execution_rate | rework_rounds | rework_proxy_count |
|---|---|---|---|---|---|
| review-cost-deep-reduction | 0.2 | 1.0 | 1.0 | 4.25 | 17 |
| ns1b-attribution-freeze-fix | 0.0 | 0.8182 | 1.0 | 7.5 | 30 |
| gate-debloat-and-admission | 0.0 | 0.5 | 1.0 | 8.75 | 35 |
| m10-baseline-switch | 0.0 | 1.0 | 1.0 | 3.75 | 19 |
| **均值** | **0.05** | **0.8295** | **1.0** | **6.075** | **25.25** |

## 说明

- M11 Actual 全部为 unknown，原因：step-gated-audit task 当前处于 build-spec 阶段，尚无执行记录可供采集。
- M10 基线均值取自上表 4 个历史任务的算术平均。
- 阈值由人工设定，非自动阻断条件（build-spec SKILL.md Step 5 约定：非合规不阻断，F3/Q1）。
- `rework_proxy_count` 为第五指标命名，遵循 SKILL.md 约定，不使用旧命名。
- 指标方向：missed_step_rate / rework_rounds / rework_proxy_count 越低越好；test_execution_rate / review_execution_rate 越高越好。

## 编造检查

0 项指标数值被编造。所有算出项来自 `specs/archive/m10-baseline-switch/baseline-report.md` 原始数据；所有 M11 actual 标 unknown + 原因。
