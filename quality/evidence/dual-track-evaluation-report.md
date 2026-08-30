# 双轨事实评估报告

生成时间：2026-08-30T00:14:17.699Z
任务路径：/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-simplicity-close-repair-20260829
facts.jsonl 行数：1275
quality/facts/ 文件数：167

## 结论（每轨三态 + 建议）

| 事实类型 | facts.jsonl 计数 | quality/facts 计数 | 三态判定 | 建议 |
| --- | --- | --- | --- | --- |
| other | 1110 | 0 | 数据不足 | 重评 |
| acceptance | 131 | 125 | 差异 | 合并候选 |
| confirmation | 10 | 19 | 差异 | 合并候选 |
| review | 21 | 20 | 差异 | 合并候选 |
| test | 3 | 3 | 一致 | 保留 |

## 判定规则

- **一致**：两轨计数相等且均大于 0，建议保留当前双轨结构。
- **差异**：两轨计数均大于 0 但不相等，建议列为合并候选，人工复核是否重复落账。
- **数据不足**：某一轨计数为 0，建议重评该类型事实的来源或消费路径。

## 快照身份

```
{
  "facts_jsonl_types": {
    "other": 1110,
    "acceptance": 131,
    "confirmation": 10,
    "review": 21,
    "test": 3
  },
  "quality_fact_types": {
    "acceptance": 125,
    "confirmation": 19,
    "review": 20,
    "test": 3
  }
}
```

本报告为评估结论文件，不修改 facts.jsonl 或 quality/facts 结构。