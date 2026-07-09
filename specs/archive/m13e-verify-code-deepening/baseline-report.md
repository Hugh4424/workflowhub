# M11 vs M10 Baseline 对照表 — m13e-verify-code-deepening

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

> 注：M10 baseline 均值来自 4 个历史 task：
> - review-cost-deep-reduction: missed_step_rate=0.2, test_execution_rate=1, review_execution_rate=1, rework_rounds=4.25, rework_proxy_count=17
> - ns1b-attribution-freeze-fix: missed_step_rate=0, test_execution_rate=0.8182, review_execution_rate=1, rework_rounds=7.5, rework_proxy_count=30
> - gate-debloat-and-admission: missed_step_rate=0, test_execution_rate=0.5, review_execution_rate=1, rework_rounds=8.75, rework_proxy_count=35
> - test-quality-executor-system: missed_step_rate=0, test_execution_rate=1, review_execution_rate=1, rework_rounds=3.8, rework_proxy_count=19
>
> 均值计算：missed_step_rate=(0.2+0+0+0)/4=0.05，test_execution_rate=(1+0.8182+0.5+1)/4=0.8295，review_execution_rate=4/4=1，rework_rounds=(4.25+7.5+8.75+3.8)/4=6.075，rework_proxy_count=(17+30+35+19)/4=25.25

## 说明

- M11 actual 全部为 unknown，原因：m13e-verify-code-deepening 为 spec 阶段，task 尚未执行，无 journal 数据可采集。
- `rework_proxy_count` 命名严格遵循 build-spec SKILL.md 要求（第 5 项必须命名此字段）。
- unknown 不阻断 stage 推进（F3，Q1）。
- 对照（direction/verdict）将在 test-acceptance 阶段由 agenthub-baseline.mjs 执行实时对照产出。
