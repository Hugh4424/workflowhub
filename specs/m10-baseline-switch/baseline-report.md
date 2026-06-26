# M10 首个端到端对照报告

基线来源：4个历史 agenthub task（review-cost-deep-reduction, ns1b-attribution-freeze-fix, gate-debloat-and-admission, test-quality-executor-system）

```json
{
  "baseline": {
    "source_tasks": [
      "review-cost-deep-reduction",
      "ns1b-attribution-freeze-fix",
      "gate-debloat-and-admission",
      "test-quality-executor-system"
    ],
    "metrics": {
      "missed_step_rate": 0.05,
      "test_execution_rate": 0.8295454545454546,
      "review_execution_rate": 1,
      "rework_rounds": 6.075,
      "rework_proxy_count": 25.25
    },
    "source_types": {
      "missed_step_rate": "proxy",
      "test_execution_rate": "weak_proxy",
      "review_execution_rate": "proxy",
      "rework_rounds": "proxy",
      "rework_proxy_count": "weak_proxy"
    }
  }
}
```

## 对照结论

**5项中5项可计算，source_type/source_ref非空。**

- **仅 verify-code 段有真采集数据**（通过 metrics-writer.mjs → collector.mjs 产出 task-metrics.jsonl）
- **其余4段（build-spec/build-plan/build-code/make-decision）为代理推导**（从 agenthub journal 事件推导）
- rework_proxy_count 标注 weak_proxy：推导自 checkpoint_request 计数，非真实缺陷数（D10）

## 三行结论

1. 基线已从4个历史 task 计算完成，5项指标均可复算
2. 对照数据源：verify-code 段有真采集（task-metrics.jsonl），其余4段代理推导
3. 达标判定留待 test-acceptance 阶段（对照实际运行结果 vs 基线）
