# Agenthub 冻结与退役规则

## 两段式退役（D2）

| 阶段 | 条件 | 动作 |
|------|------|------|
| **N₁=3** | 连续3个自举 task 达标 | agenthub 降为只读 fallback |
| **N₂=5** | 连续5个自举 task 达标 | agenthub 全量退役 |

**判定规则**：
- 单 task "达标" = 五局三胜（5项指标中≥3项不差于基线）+ 人工异常条款（任一核心指标倒退>2×基线 → 降为需人工复核）（D12）
- 连续计数从第一个达标 task 开始
- 中间任一 task 不达标 → 计数归零重新开始
- 不设自动 gate（D6），所有阶段推进由人判定（D2）

## 基线快照（D5）

- 基线 = 固定快照（4个 agenthub task 均值）
- 基线不滚动更新
- 基线来源记录在 baseline-report.md 中

## 退役后处理

1. 归档 agenthub task 目录
2. 删除 agenthub-baseline.mjs（桥用完拆，D1）
3. 保留 freeze-and-retire.md 作为退役记录
