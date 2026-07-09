# M11 vs M10 Baseline Comparison — wh-quality-convergence

数据来源：`~/.workflowhub/metrics/global-metrics.jsonl`（本任务当前仅 1 条已完成 stage 记录：`make-decision`；`build-spec` 自身记录尚未在阶段结束时写入，故本对比为任务中途快照，非最终结论）。

| Metric | M11 Actual | M10 Baseline | Direction Delta |
| --- | --- | --- | --- |
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.8295 | unknown |
| review_execution_rate | 1（1/1 已完成 stage 均 review_invoked=true） | 1 | 持平 |
| rework_rounds | 2（仅 make-decision 一个 stage 的局部值，非任务级汇总） | 6.075 | 方向上更优，但样本不完整不可下定论 |
| rework_proxy_count | unknown | 25.25 | unknown |

**缺数据说明**：missed_step_rate、test_execution_rate、rework_proxy_count 在 M10 基线中源自历史任务的 journal.jsonl 逐事件推导；本任务当前使用的 M4 精简 schema（`global-metrics.jsonl`）里唯一一条记录（make-decision）不含可推导这三项的字段，且尚无任何"执行测试"类 stage 完成，故按规则写 `unknown`，不编造数值（F9）。

**结论**：数据不足以判定整体优于/劣于基线——5 项中 3 项 unknown，可计算的 2 项（review_execution_rate 持平、rework_rounds 方向性更优）均基于单一 stage 的局部快照，样本量过小不具代表性。此为参考性记录，不构成推进阻断（F3、Q1）；不设阈值，是否需关注留给人工判断。

## M10 Baseline Comparison

| Metric | M12 实值 | M10 baseline | delta |
|---|---|---|---|
| missed_step_rate | unknown（仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算） | 0.05 | unknown |
| test_execution_rate | unknown（build-plan 阶段无测试执行数据，待 build-code/verify-code） | 0.8295 | unknown |
| review_execution_rate | unknown（review 阶段尚未执行） | 1 | unknown |
| rework_rounds | unknown（全流程未完成，无返工数据） | 6.075 | unknown |
| rework_proxy_count | unknown（全流程未完成，无代理返工数据） | 25.25 | unknown |
