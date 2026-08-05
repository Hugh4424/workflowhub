# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 |  |  |  |

## 目标

- 目标：

## 成功/失败边界

- 成功边界：
- 失败边界：

## 范围

- 当前范围：
- 用户流程/结果只记索引和验收影响，细节进入 spec：

## 非目标

-

## 决定

每个决定都使用唯一的 `decision-entry.v1` 字段；每个字段只写决策所需的
一句话或一个来源引用，不复制 spec：

```text
### D-001
- question/final_option:
- recommendation/plain_language:
- decision:
- source_type/reference/exact_excerpt:
- approval_binding:
- facts_and_constraints:
- Logic: source fact -> constraint -> chosen option -> expected result
- choice_reason/impact:
- consequences_and_risks:
- rejected_alternatives:
- unresolved_items/owner:
- Supersedes:
```

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 |  |  |  |  |  |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 |  |  |  |  |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 |  |  |  |  |

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 |  |  | fixed/rejected_invalid/accepted_risk/needs_human |  |  |

## 最终确认

- 状态：accepted/pending/unknown
- 用户原文与 host-visible 绑定：
- 未确认内容：

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
|  |  |  |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 |  |  |  |

## 质量边界

- 质量事实：
- 推进资格：
- 完成判据：
- 不可逆授权边界：

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 |  |  |  |

## Supersedes

## 文档结果

- CONTEXT.md：changed/no-change，原因和文件引用：
- ADR：created/not-needed，原因和文件引用：
- ADR criteria：hard to reverse / surprising without context / genuine trade-off：
- 术语/ADR 冲突及处理：
- 不复制 spec 的边界：

## Exit checks

- 上下文一致：
- owner/接口一致：
- 失败语义明确：
- 范围与延期明确：
