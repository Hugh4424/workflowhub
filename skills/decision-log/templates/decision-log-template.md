# 决策日志（decision-log）

读者：make-decision 主会话、用户与下游 build-plan 作者。
读完要能：定位已选方向、原始来源、工作包写集、验收索引与仍未解决的风险。

这是写作指引，不是质量门。结论在前，一段一主题，用动作写决定；允许的例外：机器读取的标题、标签与原始逐字声明照原样保留。本文只记录方向与依据；实现细节归 spec，执行事实归 task facts。

## 任务身份

本节回答：本任务采用哪一类问答与产物粒度。首次正式需求提问前只填写一次。

- **任务类型**：<规划任务|普通任务>

缺失、重复、冲突或其他值由 `readTaskTypeFromDecisionLog(markdown)` 返回 `unknown`，不按路径或历史猜测。

## 大纲地图

本节回答：哪些工作包共同交付当前目标。写 6–10 行，每行一个工作包与一句结果；行数是写作参考，不是质量门。

- 工作包 ①：[结果与消费者]
- 工作包 ②：[结果与消费者]
- 工作包 ③：[结果与消费者]
- 工作包 ④：[结果与消费者]
- 工作包 ⑤：[结果与消费者]
- 工作包 ⑥：[结果与消费者]

## 原始需求

本节回答：需求来自哪里、影响哪个决定。用摘要与引用索引真实来源；占位符不能当作用户证据。

| source_id | 原始需求/约束 | 来源引用 | 关联 ADR/处理状态 |
| --- | --- | --- | --- |
| R-001 | [原义行为与强度] | U-001 / V-001 | ADR-001 / [处置] |

## 需求变更记录

本节回答：哪次真实答复改变了什么。每条 U 保留独立标题、来源与处置；引用 V 原文，不在此重抄。

### U-001 — [需求主题]

- 原文锚点：V-001；来源：[消息或访谈定位]
- 变更与处置：[新增/修改/撤回及受影响 ADR]

## 原始需求索引

本节回答：每条原子来源对应哪个决定。不同来源不合并；没有来源就保留缺口，不用空分母报覆盖。

| R 编号 | U/V 原文锚点 | 决策 | 落点 |
| --- | --- | --- | --- |
| R-001 | U-001、V-001 | ADR-001 | [规格落点或排除理由] |

## 逐字声明层（verbatim）

本节回答：用户实际说了什么。逐字只在 V 行保留一次，其他节引用 V 编号；说话人、上下文和原文必须有真实来源。

| V 编号 | 说话人 | 上下文/来源 | 逐字文本 |
| --- | --- | --- | --- |
| V-001 | 用户 | [消息/时间] | [用户逐字文本] |

## 三级追溯链

本节回答：原始需求如何成为有依据的决定。按 `原始故事/需求 → 来源或调研 → ADR` 回读，不复制 spec。

### 需求框架

本节回答：用哪一种最小框架解释任务。功能用背景→问题→目标→方案→验收→扩展；研究用问题→论断→证据→裁决，混合任务在功能框架下挂研究子项。

### 唯一 OI 大纲（current authority）

本节回答：当前未决问题、来源和处置如何集中在一个可读大纲里。

大纲只存在于本份 `decision-log.md`；不得另建需求账本、状态机或第五份材料。
在调研前先建立下表，之后只在这里回填 OI。每个 framework node 和固定类别
必须有 OI 引用，或明确写 `empty: true` 与具体理由；不能省略、重复、用类别
改名掩盖缺口，也不能只写 `none`。

#### 框架节点

本节回答：六节点各有哪些OI或真实不适用理由。

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background |  | false |  |
| N-problem | problem |  | false |  |
| N-goal | goal |  | false |  |
| N-solution | solution |  | false |  |
| N-acceptance | acceptance |  | false |  |
| N-extension | extension |  | false |  |

#### 固定类别

本节回答：六个回退类别分别有哪些OI或真实空项理由。

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow |  | false |  |
| page_scope |  | false |  |
| data_state |  | false |  |
| success_failure_boundary |  | false |  |
| non_goals |  | false |  |
| deferred |  | false |  |

#### OI 记录与消费者

本节回答：当前问题与终态处置如何供不同读者使用。

每个 OI 是一个可独立处置的收敛项，字段如下；`status` 只能是
`open|confirmed|deferred|not_applicable`。终态才填写终态字段，核心确认项还要
注明实际展示分组及用户真实答复来源：

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
# 核心 OI 的当前确认通过本文件的直接处置字段与用户实际答复对应。
# 不创建或消费 interaction aggregate；旧记录里的 interaction_ref / interaction_hash
# 只读保留，不再是当前凭证来源或完成依赖。
```

方向审查只消费当前 `convergence_outline` questions-only 投影（保留全部 OI
ID、类别、问题/未知、来源和 `task_id`/`outline_version`，展示状态统一为
`open`，遮蔽答案、处置、依据、结论和拟议方案）。细节审查逐条消费当前 OI
终态字段；既有 `approve-decision` 在同一次整体确认中按主题展示
`visible_group_id|batch_id`、选项、后果和风险，并记录所选处置与真实答复来源。三者
职责不可互相替代，也不增加新的正常确认点。

## 发散候选与可证伪大纲

本节回答：候选为什么不同，什么事实会推翻假设。模糊需求在用户收敛前填写；表格只记录真实讨论，不创建候选库或完成门。

| 角度 ID | 角度 | 来源 | 强度 |
| --- | --- | --- | --- |
| A-001 |  | internal/research source | low/medium/high |
| A-002 |  | internal/research source | low/medium/high |

| 候选 ID | 候选 | origin | angle/source |
| --- | --- | --- | --- |
| U-001 |  | user | 原话 source ID |
| N-001 |  | internal/research | A-001 |

| 假设 ID | 大纲版本 | 假设 | 状态 |
| --- | --- | --- | --- |
| H-001 | r0 |  | supported/falsified/unresolved |

大部分假设被事实推翻时作废该版大纲，写一条重画记录、指向被作废的那一版；`redraw_of` 只作纯文本引用，不要求 hash 或版本相等。记录造成重画的假设与来源，不设假设数量下界。

## 工作包 ① — [一个可观察结果]

本节回答：本工作包交付什么、为什么选择它、失败如何收回。每个工作包重复下面三段；已收敛内容写进 ADR。

### 要交付什么

[结果、消费者、原需求引用；完整用户流程与验收影响只作索引，细节进入 spec。]

### 决定

按因果顺序逐条记录 ADR；跨模块引用先前决定。这里示范信息类别，不是必填 schema。

#### ADR-001 — [选择]

- 决定：[已选方向与真实确认来源]
- 为什么：[事实、约束、source → constraint → choice → result]
- 否掉了什么：[备选与拒绝理由]
- 影响面：[精确路径、行为、消费者、后果与风险]

### 失败了怎么退

[触发条件、实际损失、最小恢复路径、风险承接人、还需谁决定；不把缺口写成成功。]

## 要改哪些文件

本节回答：全部工作包具体影响哪些文件。锚点与改动描述同行写；影响面用精确路径，不写目录或 glob。

| 文件 | 改/只读 | 现状锚点（文件:行） | 改什么 | 行为/文档 | RED 载体 | 工作包 | 决定 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [精确路径] | 改 / 只读 | [已实读锚点] | [锚点处改动] | 行为 / 文档 | [目标 RED 原件或 G-2 理由] | [唯一 owner 工作包 + 承接项] | ADR-001 |

共 N 个，改 M、只读 K。按真实表行自校；同一文件被多个工作包改时写唯一 owner 工作包与承接项。
退役行同时写反向引用扫描结果（含级联测试）及 move-map、bundle 清单登记面同步；理由、决定人、真实来源和原需求去向写进 ADR，不另建退役权威。

## 范围与非目标

本节回答：哪些结果本次交付，哪些明确不选。

### 目标

[一句可观察的当前目标。]

### 范围

[当前交付范围及来源；相邻事项只引用，不扩写。]

### 非目标

[不选的事项、理由、决定人及下游去向。]

## UI 判定

本节回答：本任务是否改变页面、交互或前端组件。一行写适用性、理由与三来源事实或缺口：`raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`；具体方法见 make-decision 与 ui-project-init。来源不足或冲突保持 `unknown`，不得静默降为 `non_ui`。这是人读提示，不要求 JSON、runtime classifier/schema/proof；占位与引用存在不证明事实已核实。

## 验收面

本节回答：build-plan 应承接哪些验收承诺。本节只是 make-decision 到 build-plan 的交接索引；判据唯一权威在 spec 的 `## Appendix A`，两处 AC 编号同号，不双写完整判据。

### 验收标准

| AC 编号 | 用户结果与失败边界 | 判定方式（机器/人读） | 承接负责人 | spec 判据位置 |
| --- | --- | --- | --- | --- |
| AC-001 | [成功与失败边界] | [机器：可执行命令；人读：对象与判法] | [owner] | spec.md#Appendix-A / AC-001 |

## 调研

本节回答：哪些事实改变了决定。只写 research_id、一句关键事实与报告路径；报告全文不复制到主文。

| research_id | 一句关键事实 | 报告原始件路径 | 关联 ADR |
| --- | --- | --- | --- |
| F-001 | [事实与限制] | quality/evidence/research/[报告] | ADR-001 |

## 调研候选交付

本节回答：报告给了哪些可选方向。只有真实候选才列摘要、建议、理由和全文引用；没有候选写原因，未完成研究留具体缺口。

| 候选 | 摘要 | 建议与理由 | 出处与全文 |
| --- | --- | --- | --- |
| C-001 | [结果] | [采用或拒绝及原因] | [原始来源与报告路径] |

## 动态 Talk 批次

本节回答：这批问答产生什么选择。只写 batch_id、结论、用户选择与来源，不复述选项全文与后果或风险；队列变化未提供时标明。

| batch_id | 结论 | 用户选择/来源 | 队列变化 |
| --- | --- | --- | --- |
| T-001 | [结论与 OI 引用] | [真实答复来源] | [变化或 not supplied] |

## grill（质询）

本节回答：哪些假设被挑战，术语与 ADR 如何处理。引用原始 Grill 结果；写 CONTEXT changed/no-change、ADR created/not-needed 及理由，三条 ADR 取舍判据与四项退出检查结果。

## 审查处置

本节回答：每条原始 finding 如何处置。保留来源、原事实、后果、状态、owner、consumer、下一步与证据指针；fixed/rejected_invalid/accepted_risk/needs_human 按真实处理记录。

## 风险与延期交接

本节回答：哪些缺口仍由谁承担。每项写触发、后果、处理阶段、owner 与来源；未决项只列仍开着的，已收敛的写进 ADR。

### 质量边界

本节回答：哪些是质量事实、完成判据与不可逆授权边界。普通执行不增设推进许可。

只在用户明确声明或现有三输入推导确立高风险用户可见事实时写单行：
- **high_risk_fact**：{"classification":"high_risk_user_visible","basis":"user_declaration"}
唯一替代 basis 为 `three_inputs`；这是 later acceptance card 唯一可引用事实，不得用 policy ID、task prose 或 provider identity 代替。未确立不伪造。

## 最终确认

本节回答：用户对实际展示稿作了什么真实选择。写展示对象、答复与来源；未答、拒绝、取消或确认另一稿保持待决。

## Append-only 更正（只追加）

本节回答：哪个旧决定为什么被新决定替代。引用旧 ADR、新 ADR 与理由，保留已确认原文。

## 文档结果

本节回答：领域术语与决定文档有没有变化。写 CONTEXT/ADR 路径、changed/no-change 或 created/not-needed、理由、术语冲突处理和四项退出检查；缺信息保持缺口。

## 短名对照

本节回答：读者如何找到被引用的材料。

| 短名 | 精确路径/节 | 用途 |
| --- | --- | --- |
| [短名] | [实际读过的原件] | [用途] |

## 补充材料

本节回答：哪些推导、原始输出与被否方案只供查证。过程件在 quality/evidence/；正文用具名路径与节锚点引用，不复制原始全文。
