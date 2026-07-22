# Interaction Quality Amendment

## 背景

本规格是 `stage-interaction-handoff-completeness` 的窄后继增量。根据用户对 R9
Canary 的运行复盘，真实 comment、真实 member mention、等待和上游返回已经工作，
但三轮 `talk-with-zhipeng`、`grill-with-docs`、`spec-clarify` 的内容质量仍可能
退化为少量问题、复合问题、错误选项和缺少来源链的决策记录。

前序 accepted spec 及实现继续有效。本增量只补交互质量和决策可追溯性，不重开
handoff、Coder 分工、review 去重、controlled reopen、close 或平台底层范围。
本任务完成实现、真实 Canary 和 final verify 后，必须停在 merge/archive 授权前。

## 需求

### FR-001 三轮 talk 各自完成收敛职责

- make-decision 仍执行三个独立 round，不能合并。
- 每轮开始先展示本轮已知事实和至少两个候选问题，并按“会不会改变方向”排序。
  已由事实回答的问题标记为“已回答”，不得为了凑数量制造问题。
- 每次只问一个当前最重要的问题；收到真实回答后必须重新排序，再决定下一个问题。
- 只要本轮仍有会改变方向的未决问题，就不能提前结束该轮。
- Round 1 收敛真实痛点、成功标准和调研必要性；Round 2 收敛方向、范围、非目标、
  关键取舍和风险；Round 3 处理盲审发现、矛盾、关键假设和剩余风险。
- 简单任务不强制三轮都产生人工等待，但三轮都必须留下可见的开始队列、处理结果和
  无需继续提问的事实理由。候选问题可以标记为“已由事实回答”或“不适用”，不得凑数。
  Canary 必须故意准备足够歧义，证明每轮至少两次真实问答。

### FR-002 所有交互必须用大白话决策卡

- `talk-with-zhipeng`、`grill-with-docs`、`spec-clarify` 面向用户的内容先说
  业务问题，不展示内部 ID、hash、receipt、attempt、runner 等执行术语。
- 每次需要用户决定时必须给 2～3 个互斥选项。每项都写清：它是什么意思、为什么可选、
  选择后的直接后果和主要风险；同时给一个推荐项和推荐理由。
- 禁止开放式填空；多个决策轴必须按依赖拆开逐个问，不能塞进一张“完整合同”卡。
- 正式证据 ref 可以放在完成卡的“证据”区，不得混入用户决策问题。

### FR-003 grill 后必须给出文档判断

`grill-with-docs` 允许通过代码和文档自行核实可回答问题，只有仍会改变方向的
load-bearing 问题才询问用户。结束时必须记录：

- `CONTEXT.md`：changed / no change，以及理由和文件引用；
- ADR：created / not needed，以及“难以反转、无背景会意外、存在真实取舍”三项判断；
- 与现有术语或 ADR 的冲突及处理结果；
- 四项退出检查的结论：外部接口是否按真实定义核实；字段/路径命名是否有唯一权威
  定义；失败路径和异常语义是否明确；做什么/不做什么是否写死。

本任务的 grill 判断已经得出两个明确交付：最小更新 `CONTEXT.md`，删除过时的
Multica-adapter 定义并补宿主中立的决策卡/完成卡/阶段协调/Phase 执行术语；新增一个
ADR 记录既有的单一 build-code 合同及可组合角色决定。

### FR-004 decision-log 必须保存逐项来源和逻辑链

每个 load-bearing decision 必须独立记录：

- 决定内容；
- 来源：用户原始要求、具体用户回答、调研、代码事实、grill 或独立审查；
- 事实与约束；
- 选择及理由；
- 影响范围；
- 后果与风险；
- 被拒方案及拒绝理由；
- 未解决事项；
- 若取代旧决定，明确写出 supersedes 关系。

不得用无法追溯的“已确认”“根据讨论”代替来源。作为 lineage 修正，本规格只记录
既有已批准事实：唯一权威 `build-code` Skill 保持宿主中立，宿主可让不同执行者
读取协调部分和 Phase 部分；它取代更早的“Coder 不绑定 Skill”记录。本增量不改变
已经实现的 build-code 行为。

### FR-005 build-spec 只澄清真正未决的单一决策轴

- 生成澄清问题前，把输入拆成：上游已锁定决定、上游明确未决项、新发现歧义。
- 已锁定决定必须原样继承，不得改名、换序、改语义或重新发问。
- 一张卡只处理一个决策轴；多个轴按依赖顺序逐个问。
- 所有候选项先经过 locked-decision 过滤。全部候选与上游冲突时，不给用户假选项，
  而是报告上游/规格矛盾并返回修复。
- 上游已有选项和推荐时原样继承；用户不需要自行写“第四个方案”补救。

### FR-006 边界

- WorkflowHub 只描述宿主无关的对话表面、组件结果和文档产物，不包含 Multica API、
  Issue、mention、Agent UUID 或平台状态代码。
- Multica 只在现有 Decision Maker、Spec Builder instructions 中映射真实 comment、
  member mention、等待和恢复；不复制完整 Stage Skill。
- 不新增 schema、通用问答引擎、Provider、状态机、运行时或平台底层改动。
- provider、model、runtime、现有 Skill ID 均不得改变。

## 验收标准

- **AC-001 三轮动态收敛**：在宿主投影的 Canary 对话中，三个 round 各有
  开始队列、至少两个候选问题、逐题真实 member 回复、每答重排和结束结论；每轮至少
  两次真实问答，三轮用途不同，没有合并或提前结束。
- **AC-002 大白话选项**：所有 talk、grill、spec-clarify 决策卡不含内部 ID/hash/
  receipt/attempt/runner 黑话；每张卡只有一个决策轴，含 2～3 个互斥选项、推荐理由、
  每项后果和风险，没有开放式填空。
- **AC-003 grill 文档结果**：Canary 完成卡和 decision-log 均记录 CONTEXT/ADR
  changed/no-change 判断、理由、文件引用、三项 ADR 判据及四项退出检查。
- **AC-004 决策来源链**：decision-log 的每个关键决定都包含 FR-004 全部字段；
  来源能指向原始要求、真实 member comment、代码/调研/grill/review 事实之一，并记录
  supersedes 关系。
- **AC-005 spec-clarify 保真**：聚焦 fixture 和 Canary 证明 locked 纯文本方案不会
  被替换为对象；复合歧义被拆分；上游选项原样继承；与 locked 冲突的假选项不会展示。
- **AC-006 不跳组件**：以
  `workflows/make-decision/skill-deps.yaml` 和
  `workflows/build-spec/skill-deps.yaml` 为实现阶段可核验的唯一清单与
  always/conditional 分类依据；两阶段完成卡逐项列出 Stage-owned 组件的
  executed/skip 事实，并与 Issue comment、decision-log、spec、review refs 交叉一致。
- **AC-007 回归与边界**：无 Multica 环境下核心测试、Skill closure 和宪法检查通过；
  WorkflowHub 源码无新增 Multica 语义，Multica provider/model/runtime/Skill ID 不变。
- **AC-008 真实全流程**：全新 Canary 从 make-decision 到 close 全程自动推进；
  所有人工选择由测试执行者按 Agent 推荐通过宿主的真实用户 comment 回复；这些
  Issue/member 术语只描述宿主投影证据，不是 WorkflowHub 抽象。无救火提醒；
  verify 返工、fresh verify、close 和全部 Issue done 均完成；临时 project、worktree
  和 branch 清理完成。

## 非目标

- 不强制简单任务制造无意义问题。
- 不把三轮 talk 变成三个确认门。
- 不验证 Multica 评论作者或建设跨平台身份系统。
- 不新增问答 ledger、通用对话状态机或第二套审查系统。
- 不恢复或修改已结束的 ZHI-102、ZHI-184。

## 需求来源

- 用户对 R9 的直接反馈：三轮交互太少、问题未动态排序、黑话过多、选项缺决策信息。
- 用户对真实 Canary 的复盘：三轮仅一次中途问答，后两轮没有真实收敛问题。
- 用户对真实规格澄清的复盘：一张卡混合三个决策轴，全部选项偏离已定方向，
  用户被迫自拟方案。
- 用户要求 grill 后检查 CONTEXT/ADR，并让 decision-log 保留完整决策来源与逻辑链。
