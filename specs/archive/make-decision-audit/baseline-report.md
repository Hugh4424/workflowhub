# M10 Baseline Comparison

| Metric | M11 Actual | M10 Baseline | Direction Delta |
|---|---:|---:|---|
| missed_step_rate | unknown | 0.05 | unknown：当前 task 尚无完整五阶段分母 |
| test_execution_rate | unknown | 0.8295 | unknown：build-spec 尚未产生测试执行事实 |
| review_execution_rate | 1 | 1 | 0（上游 make-decision 已完成异源审查） |
| rework_rounds | 0 | 6.075 | -6.075（build-spec 当前记录） |
| rework_proxy_count | unknown | 25.25 | unknown：现有 task metrics 无可重算 proxy 字段 |

unknown 保持 unknown，不以 0 填充。
