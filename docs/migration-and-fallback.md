# 迁移与回滚流程

## 四分支判定（D8/D11）

| 输入 | 判定 | 动作 |
|------|:----:|------|
| bad_count < 2 | **switch** | 继续用 workflowhub |
| bad_count ≥ 2 且根因≠workflowhub | **hold** | 暂停自举 task，排查 task 自身问题 |
| bad_count ≥ 2 且根因=workflowhub | **rollback** | 执行回滚步骤 |
| 任一核心指标倒退>2×基线 | **manual_review** | 降为需人工复核（D12） |

## 回滚步骤

1. 切回 agenthub harness 运行新 task
2. 停止 workflowhub 自举 task
3. 通知相关 task owner
4. 记录回滚原因到 workflow-issues.jsonl

## fallback 触发条件

- 对照报告 bad_count ≥ 2
- reviewer 判定根因是 workflowhub（非 task 自身问题）
- 由人看报告判定，不自动触发（D11）

## 现跑 task 定义（D8）

- agenthub harness 中 state=active 且 currentStatus≠completed 的 task
- 范围明确，判定可执行
