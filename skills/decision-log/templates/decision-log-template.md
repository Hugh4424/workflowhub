# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 |  |  |  |

### 需求框架（先选一类，再逐步回填）

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展） / `research`（问题→论断→证据→裁决）
- **选择理由**：
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景 / 问题 | open | pending |  |  |
| N-002 | 目标 / 论断 | open | pending |  |  |
| N-003 | 方案 / 证据 / 裁决 | open | pending |  |  |
 | N-004 | 验收 / 扩展 | open | pending |  |  |

### 唯一 OI 大纲（current authority）

大纲只存在于本份 `decision-log.md`；不得另建需求账本、状态机或第五份材料。
在调研前先建立下表，之后只在这里回填 OI。每个 framework node 和固定类别
必须有 OI 引用，或明确写 `empty: true` 与具体理由；不能省略、重复、用类别
改名掩盖缺口，也不能只写 `none`。

#### Framework nodes

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background |  | false |  |
| N-problem | problem |  | false |  |
| N-goal | goal |  | false |  |
| N-solution | solution |  | false |  |
| N-acceptance | acceptance |  | false |  |
| N-extension | extension |  | false |  |

#### Fixed categories

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow |  | false |  |
| page_scope |  | false |  |
| data_state |  | false |  |
| success_failure_boundary |  | false |  |
| non_goals |  | false |  |
| deferred |  | false |  |

#### OI records and consumers

每个 OI 是一个可独立处置的收敛项，字段如下；`status` 只能是
`open|confirmed|deferred|not_applicable`。终态才填写终态字段，核心确认项还要
绑定分组和现有交互凭证：

```yaml
task_id: <current task>
outline_version: <current version>
oi_id: OI-001
category: complete_user_flow
source: R-001 / fact-ref
question: <one plain-language unknown>
status: open
selected_disposition: <only for terminal status>
impact_dimensions: [goal|scope|acceptance|ordinary_detail]
requires_user_decision: true|false
visible_group_id: <existing approve-decision group>
batch_id: <optional alias for the same visible group>
interaction_ref: <existing interaction aggregate or round ref>
interaction_hash: <sha256 of that exact interaction bytes>
```

方向审查只消费当前 `convergence_outline` questions-only 投影（保留全部 OI
ID、类别、问题/未知、来源和 `task_id`/`outline_version`，展示状态统一为
`open`，遮蔽答案、处置、依据、结论和拟议方案）。细节审查逐条消费当前 OI
终态字段；既有 `approve-decision` 在同一次整体确认中按主题展示
`visible_group_id|batch_id`、选项、后果和风险，并记录所选处置与交互凭证。三者
职责不可互相替代，也不增加新的正常确认点。

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

决定区按需求框架的方案或裁决模块使用 `### <module>` 分组；每组内按
`需求/question → facts/constraints → option → decision → feature/consumer → acceptance`
链序排列。跨模块依赖必须写 `D-ID + derived_from`，根决定写
`derived_from: []`。以下四个字段只属于文本层链记录，不改
`decision-entry.v1`：

```text
module: <module-name>
requirement_ids: [R-001]
derived_from: [D-001]
artifacts: [spec.md#FR-001]
```

节点缺证据时保留 `status: open|deferred`、`evidence_status: pending`、
`evidence_owner` 和 `next_review_trigger`，不得静默写成 confirmed。

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
module:
requirement_ids: []
derived_from: []
artifacts: []
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

### 质量边界

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

### Exit checks

- 上下文一致：
- owner/接口一致：
- 失败语义明确：
- 范围与延期明确：
