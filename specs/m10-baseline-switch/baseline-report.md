# M10 首个端到端对照报告

基线来源：4个历史 agenthub task

```json
{
  "tasks": [
    {
      "task_id": "review-cost-deep-reduction",
      "path": "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/review-cost-deep-reduction/.machine/source/journal.jsonl",
      "events_count": 1450,
      "metrics": {
        "missed_step_rate": 0.2,
        "test_execution_rate": 1,
        "review_execution_rate": 1,
        "rework_rounds": 4.25,
        "rework_proxy_count": 17
      }
    },
    {
      "task_id": "ns1b-attribution-freeze-fix",
      "path": "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/ns1b-attribution-freeze-fix/.machine/source/journal.jsonl",
      "events_count": 1458,
      "metrics": {
        "missed_step_rate": 0,
        "test_execution_rate": 0.8181818181818182,
        "review_execution_rate": 1,
        "rework_rounds": 7.5,
        "rework_proxy_count": 30
      }
    },
    {
      "task_id": "gate-debloat-and-admission",
      "path": "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/gate-debloat-and-admission/.machine/source/journal.jsonl",
      "events_count": 1445,
      "metrics": {
        "missed_step_rate": 0,
        "test_execution_rate": 0.5,
        "review_execution_rate": 1,
        "rework_rounds": 8.75,
        "rework_proxy_count": 35
      }
    },
    {
      "task_id": "test-quality-executor-system",
      "path": "/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/test-quality-executor-system/.machine/source/journal.jsonl",
      "events_count": 1371,
      "metrics": {
        "missed_step_rate": 0,
        "test_execution_rate": 1,
        "review_execution_rate": 1,
        "rework_rounds": 3.8,
        "rework_proxy_count": 19
      }
    }
  ],
  "metrics": {
    "missed_step_rate": 0.05,
    "test_execution_rate": 0.8295454545454546,
    "review_execution_rate": 1,
    "rework_rounds": 6.075,
    "rework_proxy_count": 25.25
  },
  "source_types": {
    "missed_step_rate": {
      "source_type": "proxy",
      "source_ref": "journal: stage_enter/stage_exit"
    },
    "test_execution_rate": {
      "source_type": "weak_proxy",
      "source_ref": "journal: phase_pre_review"
    },
    "review_execution_rate": {
      "source_type": "proxy",
      "source_ref": "journal: checkpoint_request"
    },
    "rework_rounds": {
      "source_type": "proxy",
      "source_ref": "journal: checkpoint_request"
    },
    "rework_proxy_count": {
      "source_type": "weak_proxy",
      "source_ref": "journal: checkpoint_request"
    }
  }
}
```

## 对照结论

**5项中5项可计算，source_type/source_ref非空。**

- **仅 verify-code 段有真采集数据**（通过 metrics-writer.mjs → collector.mjs 产出 task-metrics.jsonl）
- **其余4段为代理推导**（从 agenthub journal 事件推导）
- rework_proxy_count 标注 weak_proxy：推导自 checkpoint_request 计数（D10）
- source_types 每项含 source_type + source_ref，可追溯来源

## 三行结论

1. 基线已从4个历史 task 计算完成，5项指标均可复算
2. 对照数据源：verify-code 段有真采集（task-metrics.jsonl），其余4段代理推导
3. 达标判定留待实际 task 运行时对照（五局三胜 + 人工异常条款，D12）。**M10 产出的是基线快照**，对照（direction/verdict/workflowhub_value）发生在后续每个 task 的 test-acceptance 阶段，在后续 task 运行时由 agenthub-baseline.mjs 对照产出（M10 只建基线桥，不做实时对照）。
