# 功能规格：工作流需求收敛深度改造（审查深化/争议对话/debate v2/调研机制/决策记录/执行模型）

> 基于已接受的需求来源。本文件只写产品问题、行为、边界和验收，不写文件路径、代码符号或工程命令。

- **功能名**：工作流需求收敛深度改造（审查深化/争议对话/debate v2/调研机制/决策记录/执行模型）
- **来源**：decision-log 最终确认（accepted；human-confirmation receipt 已落盘绑定当前 decision hash 与 material revision）
- **状态**：已接受（用户在 build-spec 阶段末移交说明后回复"继续"，确认进入 build-plan）

> 本产品=workflowhub 编排工具本身，其"用户"=运行各阶段的 AI 助手/操作者；本规格中的"用户可观察"指操作者在五阶段工作流中可观察到的产品行为与事实记录。

## 速读卡（30 秒）

- **一句话需求**：操作者在 make-decision 与 build-spec 阶段，要获得更深的异源审查、争议 findings 必达的真实对话、跨宿主可运行的裁决辩论、有契约的调研机制和结构化的决策记录，从而消除"验收标准不清导致返工"的根因。
- **核心改动点**：
  - make-decision direction/detail 审查从单次组请求演进为红队+蓝队两次组请求（同一逻辑 review fact），build-spec 保持单次但指令强化并新增验收专项。
  - 争议 findings（共识+分歧双定义）经 debate 裁决后通过问答工具与用户真实对话，处置写回闭环。
  - debate 技能重写为 4 个独立子代理+文件 mailbox 的跨宿主机制；调研机制契约化为 R0-R5 并落盘；decision-log 增加需求框架、模块分组与决策链字段。
- **最大影响面**：make-decision 与 build-spec 两个阶段的审查合同、对话契约与技能文本，以及 interaction aggregate 校验；宪法红线（不新增 stage/gate/公共入口/第五材料）全部保持。
- **验收信号**：红蓝合同与配套测试成对转绿且 AC-011 审计同步；争议 findings 出现时用户收到问答工具化的真实 ask→reply 且决定写回；debate 在 DSH 可运行且产物落盘；本任务 dogfood 证据链完整、下一任务用户提示次数=0。

## 来源与决策映射

> 本节只保存 ID 关系，不复制 decision-log 正文；没有来源的新增需求必须回到 make-decision。

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001/R-006/R-017 | D-101 | FR-REV-001 / AC-REV-001 | current / direction 审查面 | RISK-01（超时） |
| R-002/R-017 | D-101 | FR-REV-002 / AC-REV-002 | current / detail 审查面 | RISK-01 |
| R-017 | D-101 | FR-REV-003 / AC-REV-003 | current / 红蓝关联契约与聚合 | OPEN-02 已定稿（pair/聚合规则） |
| R-005/R-011 | D-102 | FR-REV-004 / AC-REV-004 | current / build-spec 审查 | — |
| R-003/R-004/R-005 | D-103 | FR-REV-005 / AC-REV-005 | current / findings 聚合标注 | — |
| R-001/R-002/R-005 | D-605 | FR-REV-006 / AC-REV-006 | current / 审查材料身份 | RISK-02 已转修复决策 |
| R-001/R-002/R-017 | D-606 | FR-REV-007 / AC-REV-007 | current / 审查材料脱敏 | OPEN-01（grok/pi 残余，条件性义务） |
| R-003/R-008 | D-201 | FR-TALK-001 / AC-TALK-001 | current / make-decision Talk3 | — |
| R-004 | D-201 | FR-TALK-002 / AC-TALK-002 | current / make-decision Talk4（新增轮次） | — |
| R-005/R-009/R-015 | D-202（经 T-023 收窄） | FR-TALK-003 / AC-TALK-003 | current / build-spec findings 处置对话（复用 spec-clarify） | OPEN-02 已定稿（生命周期落点） |
| R-003/R-004/R-005/R-015 | D-203 | FR-TALK-004 / AC-TALK-004 | current / 处置写回与风险接收 | OPEN-02 已定稿（路由=既有 confirm 语义扩展） |
| R-015 | D-204 | FR-TALK-005 / AC-TALK-005 | current / 交互呈现 | — |
| R-006/R-007/R-008 | D-301 | FR-DEB-001 / AC-DEB-001 | current / debate 技能 v2 | RISK-05（非 DSH 宿主降级） |
| R-006 | D-302 | FR-DEB-002 / AC-DEB-002 | current / debate 反偏见 | — |
| R-003/R-004/R-005/R-006 | D-303 | FR-DEB-003 / AC-DEB-003 | current / 裁决权限分级 | — |
| R-009/R-013/R-016/R-019 | D-401 | FR-RES-001 / AC-RES-001 | current / 调研机制（新技能） | — |
| R-013 | D-402 | FR-RES-002 / AC-RES-002 | current / 调研产物落盘 | — |
| R-016/R-019 | D-403 | FR-RES-003 / AC-RES-003 | current / 调研工具路由 | — |
| R-009 | D-404 | FR-RES-004 / AC-RES-004 | current / 阶段复盘维度 | — |
| R-014 | D-501 | FR-DLOG-001 / AC-DLOG-001 | current / decision-log 需求框架 | — |
| R-014 | D-502 | FR-DLOG-002 / AC-DLOG-002 | current / decision-log 模块分组 | — |
| R-014 | D-104 | FR-DLOG-003 / AC-DLOG-003 | current / 决策链字段与轻量告警 | RISK-04（腐烂残留风险） |
| R-006/R-007/R-011 | D-601 | FR-GOV-001 / AC-GOV-001 | current / 全部受影响合同与测试 | RISK-03（纸面合规） |
| R-003/R-004/R-005/R-017 | D-604 | FR-GOV-002 / AC-GOV-002 | current / 失败与降级语义 | — |
| R-018 | D-603 | FR-GOV-003 / AC-GOV-003 | current / 交付组织方式 | phase 排程归 build-plan |
| R-011 | D-607 | FR-GOV-004 / AC-GOV-004 | current / 仓库协作规则 | — |
| R-020 | D-608 | FR-GOV-005 / AC-GOV-005 | current / make-decision 执行方式 | OPEN-02 已定稿（摘要模板） |
| R-011 | D-602 | FR-GOV-006 / AC-GOV-006 | current / 非目标与延期登记 | RISK-06~09（延期触发条件） |
| R-010 | 无 D 回链（用户已拍板：贯穿性流程约束不入决策表，锚定第 10 节"默认必须成立"第 1 条；歧义 A-04 定案口径） | 锚定第 10 节"默认必须成立"第 1 条 / AC-GOV-003、AC-GOV-005 | current / 贯穿性流程约束（标准五阶段、不跳阶段、不依赖 build-spec 补需求） | — |
| R-012 | 无 D 回链（用户已拍板：贯穿性文档与交互风格约束锚定第 10 节"默认必须成立"第 2 条；歧义 A-04 定案口径） | 锚定第 10 节"默认必须成立"第 2 条 / AC-TALK-005 | current / 文档与交互风格约束（大白话、记录原始需求/事实/理由/延期交接） | — |

每条 FR/AC 都必须能回到本表；scope revision 只追加受影响映射和 revision note，不另建需求账本。

规格澄清记录：spec-clarify trigger = false；reason = 方向级选择全部在 make-decision 由用户拍板锁定，规格级候选歧义已逐条从上位锁定决策与实测事实解析（处置明细见任务质量证据区 build-spec-clarify-trigger-false.v1.md，含 6 条候选+OPEN-004/005 两组委托定稿项）；open_direction_changing_questions: 0。

## 1. 问题与紧迫性

操作者在使用 workflowhub 做前端能力调研等真实任务时反复暴露四类痛点：

1. **审查浅、返工多**：make-decision 的 direction/detail 审查与 build-spec 审查都是单轮线性清单式审查，provider 之间互不可见，异源建议浅；用户确认的返工主因是"验收标准定得不够清楚"——build-code 时 agent 自己发现遗漏，verify-code 用户验收时发现更多 agent 发现不了的遗漏。
2. **争议发现不到人**：方向审查、细节审查、build-spec 审查之后，存在争议 findings 时没有任何与用户的对话；`needs_human` 处置没有写回位置，闭环最后一环断裂。
3. **调研浅薄靠人推**：调研条款"只有答案能改变方向才调研"、跳过只需一句话、无完成标准、无读原文要求；纯 agent 无工具检索效果很差，调研深度要用户反复提示。
4. **决策记录扁平、辩论机制失效**：decision-log 是扁平结构，决策无链、阅读者无法判断"需求考虑是否清楚"；debate 技能全仓零调用方且完整依赖 Claude Code teammate，在 DSH/Codex 宿主下不可用。

为什么现在必须处理：这四类痛点互相放大（浅审查→漏验收盲区→返工；无对话→争议流失；浅调研→决策依据薄），上一任务已把"覆盖完整"做完，本任务是从"覆盖完整"走向"结构清晰+深度审查+人在环裁决"的下一步，且用户已明确拍板"一次全做、多分 phase"。

## 2. 背景、目标与范围

### 背景

workflowhub 是按五阶段（make-decision→build-spec→build-plan→build-code→verify-code）运行的 AI 开发工作流编排工具。现状事实：wh-review 每个审查面只发一次组请求、所有 provider 共享同一材料与提示词；findings 聚合只有 cluster 级处置分类、无"争议"概念；detail 审查后无任何用户对话直接 approve；build-spec 被既有硬契约锁定不可进行 Talk 类交互；debate 技能依赖已不可用的宿主特性；调研无完成契约。本任务在上一个需求收敛任务（覆盖矩阵与语义检查）基础上继续深化，decision-log 已按"需求框架+模块化+决策链"试运行并作为样本。

### 目标

- 交付四能力并落地可执行：深度审查（红蓝双角色对抗）、争议真对话（问答工具化、决定写回）、跨宿主裁决辩论（4 独立子代理+文件 mailbox）、有契约调研（R0-R5+工具路由+落盘+复核）。
- decision-log 结构升级：需求框架骨架、模块化分组、决策链字段（含轻量告警）。
- 三重验证达成：本任务 dogfood、每 phase 独立验收+异源审查、下一个含方向性调研的真实任务一轮跑通且用户提示次数=0。
- 机制落地同时保持宪法红线：不新增 stage/gate/公共入口类/第五材料；review/debate 不作推进门或 pass 判据；质量裁决不自审自判。

### 范围内

- make-decision 阶段：direction/detail 红蓝两次组请求与契约演进、Talk3 强绑定方向 findings、新增 Talk4、debate 裁决接线、调研机制接线、decision-log 结构升级、执行模型（主会话=调度器）写入技能文本。
- build-spec 阶段：审查单次请求+指令强化+"AC 可判断性与验收盲区"专项、findings 处置对话（复用 spec-clarify 承载）。
- 支撑面：wh-review 与 build-spec 合同文本演进、interaction aggregate 动态轮数校验、争议标注、material_id 算法一致性修复、材料脱敏与身份降级错误码保留、AGENTS.md 测试策略硬规则、受影响技能与测试的成对同步。

> UI 适用性：N/A — 本任务 non_ui（decision-log UI applicability 已记录原始需求/项目盘点/前端事实三方一致结论）；本任务不改任何页面或前端。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

> 场景覆盖正常、边界、失败和权限路径；本产品状态=工作流可观察状态（review fact 状态、finding 处置状态、talk 生命周期、调研落盘状态）。

### SCN-001：默认态——五阶段正常推进（含红蓝审查与争议对话）

- **角色**：操作者（主会话 AI 助手）+ 用户（人）
- **Given**：任务按标准流程从 make-decision 开始，worktree 与四材料就绪
- **When**：依次执行调研（R0-R5）、Talk、direction 红队+蓝队两次组请求、debate 裁决争议、Talk3、detail 红蓝、debate、Talk4、approve；随后 build-spec 单次强化审查+findings 处置对话
- **Then**：每个审查面产生红蓝两份结果并共享同一 material 语义身份；争议清单经 debate 裁决后方向级/影响验收项以问答工具送达用户；用户决定写回 finding 处置与 decision-log；确认 receipt 与 interaction aggregate 落盘且契约校验通过

### SCN-002：错误态——蓝队部分 provider 传输失败或蓝队 partial

- **角色**：操作者
- **Given**：某审查面红队已完成，蓝队组请求中部分 provider 失败或整体 partial
- **When**：蓝队 outcome=partial/failed
- **Then**：review fact 记录为 available-with-failures 并显式标注 blue_incomplete；debate 输入=已完成集；用户被如实告知蓝队不完整；不得当作完整红蓝通过；单成员失败时其余成员结果照用（partial 事实保留）

### SCN-003：错误态——审查组请求全部 unavailable

- **角色**：操作者
- **Given**：某审查面红蓝请求因路由/材料问题全部失败
- **When**：review fact=unavailable
- **Then**：修复路由或材料后允许重试一次；不可用事实如实记录且不阻塞同 task 修复；缺失质量事实不被宣称为完成

### SCN-004：取消态——用户中止对话

- **角色**：用户+操作者
- **Given**：talk/findings 处置对话进行中
- **When**：用户中止（不回答剩余问题）
- **Then**：已答部分保留；未答项标记 user_deferred 进入风险表；不推断用户意图、不伪造答复

### SCN-005：边界态——debate 2 轮封顶仍未决

- **角色**：操作者（法官角色禁言）+ 用户
- **Given**：debate 对某争议交锋已达 2 轮上限
- **When**：仍无裁决结论
- **Then**：存疑清单不静默，呈用户人工裁决；分歧保留为证据，不强行共识

### SCN-006：边界态——红蓝请求逼近客户端超时上限

- **角色**：操作者
- **Given**：红蓝两次组请求使审查耗时约 2 倍，长审查逼近既有客户端超时窗（超时窗不变）
- **When**：组请求超时
- **Then**：按 unavailable/partial 事实如实记录并可重试；不延长超时窗、不伪造完成

### SCN-007：权限态——不可逆操作与风险接收需显式授权

- **角色**：用户+操作者
- **Given**：出现不可逆动作（commit/push/merge/archive/cleanup）或用户选择 accepted_risk 处置
- **When**：操作者准备执行
- **Then**：不可逆操作另行获得用户 authorize；accepted_risk 经既有 confirm 语义扩展的公共通道完成并落盘风险回复证据，处置绑定认证 receipt；无任何自动越过人的路径

### SCN-008：竞态——材料漂移与身份漂移

- **角色**：操作者
- **Given**：审查材料在组请求之间发生变化（材料漂移），或 provider 成员身份被降级（身份漂移）
- **When**：material_id 在两次请求间不一致，或成员身份无效
- **Then**：同一 pair 的两次请求必须共享同一 material 语义身份，不满足则记录 partial、不伪装成完整红蓝；material_id 变化使既有 receipt/确认绑定失效，需以新材料重建确认；身份降级时保留底层原始错误码，不用笼统身份错误掩盖真实失败原因

### SCN-009：build-spec 争议 findings 处置对话

- **角色**：操作者+用户
- **Given**：build-spec 审查（单次强化）产出 findings，其中存在争议（共识/分歧）
- **When**：进入 findings 处置对话
- **Then**：复用 spec-clarify 承载"基于争议发现的规格澄清批次"（既不是 Talk/Grill/Clarify 原语义，也不是新增技能）；对话生命周期沿用既有 stage outcome 侧校验与交互 receipt；用户决定写回处置状态；build-spec 不声明 talk-with-zhipeng，grill 独占边界不变

### SCN-010：debate v2 跨宿主运行与降级

- **角色**：操作者+4 个角色子代理（甲/乙/丙/丁）
- **Given**：宿主能力已判定（DSH 原生父子消息可用；Codex 仅 collab；Multica @mention）
- **When**：运行 debate v2
- **Then**：4 个独立上下文子代理各持立场书，经文件 mailbox（任务共享目录，逐轮次）交锋，2 轮封顶；DSH 原生消息可作加速；无共享文件系统或宿主消息能力时按降级路径（父代理串行转发）执行并如实记录降级事实；产物不可变落盘

### 状态覆盖清单

- [x] **默认态**：SCN-001
- [x] **空态**：N/A — 本任务 non_ui；审查/调研产物缺失按 unavailable/partial 错误态（SCN-002/003）如实记录，不存在"空列表"语义
- [x] **错误态**：SCN-002（蓝队 partial/传输失败）、SCN-003（全部 unavailable）
- [x] **加载态**：N/A — 审查与 debate 为后台异步执行并以落盘事实呈现，无用户等待中的加载界面（non_ui）
- [x] **取消态**：SCN-004（用户中止→user_deferred）
- [x] **边界态**：SCN-005（debate 2 轮封顶未决）、SCN-006（红蓝 2× 超时）
- [x] **权限态**：SCN-007（不可逆操作 authorize、accepted_risk confirm）
- [x] **竞态**：SCN-008（材料漂移→receipt 失效、identity 漂移）

## 4. 产品事实与假设（PFACT）

> 每条只选择一种状态；优先复用 decision-log F-001~F-021 作为 verified 来源。

- **PFACT-01**：wh-review 每审查面只发一次组请求，所有 provider 共享同一材料包与提示词，无 per-provider 提示词通道
  - **status**：`verified`
  - **证据或来源**：decision-log F-001（源码勘探行号证据）
  - **关联**：FR-REV-001、FR-REV-002、FR-REV-003；AC-REV-001、AC-REV-002
- **PFACT-02**：现有 findings 聚合只有 cluster 级处置分类，无"争议/disputed"概念，provider 分歧仅留 provenance
  - **status**：`verified`
  - **证据或来源**：decision-log F-002
  - **关联**：FR-REV-005；AC-REV-005
- **PFACT-03**：运行时对"talk round 3 用审查发现"无强制绑定，仅为技能文本级指引；detail 审查后无任何用户对话直接 approve
  - **status**：`verified`
  - **证据或来源**：decision-log F-003、F-004
  - **关联**：FR-TALK-001、FR-TALK-002；AC-TALK-001、AC-TALK-002
- **PFACT-04**：build-spec 被既有硬契约锁定不可进行 Talk 类交互（技能闭包独占清单、两组路由/契约测试、interaction aggregate 的 stage 硬校验）
  - **status**：`verified`
  - **证据或来源**：decision-log F-005
  - **关联**：FR-TALK-003；AC-TALK-003
- **PFACT-05**：debate 技能全仓零调用方、无宿主适配器、完整依赖 Claude Code teammate 措辞，当前不可用
  - **status**：`verified`
  - **证据或来源**：decision-log F-006
  - **关联**：FR-DEB-001；AC-DEB-001
- **PFACT-06**：DSH 宿主子代理可持续化、父子双向消息实测可用；Codex 发布版仅 collab 特性、无法自定义子代理消息协议；跨宿主通用方案=文件 mailbox，DSH 原生消息仅作加速
  - **status**：`verified`
  - **证据或来源**：decision-log F-007（本会话实测）、F-008（Codex 官方讨论）
  - **关联**：FR-DEB-001；AC-DEB-001；SCN-010
- **PFACT-07**：风险暂停卡（serious finding→risk-pause）已有半成品实现，但风险接收无公共路由，用户接受风险无公共通道
  - **status**：`verified`
  - **证据或来源**：decision-log F-009
  - **关联**：FR-TALK-004；AC-TALK-004
- **PFACT-08**：make-decision 调研条款无完成标准、无读原文要求、跳过只需一句话；spec-research 技能仅 16 行且被动应答不写文件
  - **status**：`verified`
  - **证据或来源**：decision-log F-010、F-017
  - **关联**：FR-RES-001、FR-RES-003；AC-RES-001、AC-RES-003
- **PFACT-09**：宪法红线：不得新增 stage/gate/公共入口/第五材料；single_round 语义；质量裁决禁止自审自判；review 不作 pass 门；技能改造须同步 bundle/catalog/inventory 登记
  - **status**：`verified`
  - **证据或来源**：decision-log F-011、F-018、F-019
  - **关联**：FR-GOV-001、FR-GOV-002、FR-GOV-006、FR-DEB-003；AC-GOV-001、AC-GOV-006
- **PFACT-10**：material_id 本地算法与 broker 规范算法不一致（含 manifest 条目、未排序 vs 排除 manifest、按路径排序），严格冻结路径真实往返可能 MATERIAL_INCOMPLETE
  - **status**：`verified`
  - **证据或来源**：decision-log F-012
  - **关联**：FR-REV-006；AC-REV-006
- **PFACT-11**：用户确认的返工主因=验收标准定得不够清楚（build-code 自漏+verify-code 用户验收发现更多）
  - **status**：`verified`
  - **证据或来源**：decision-log F-013（Talk Round 1 用户原话）
  - **关联**：FR-REV-004；AC-REV-004
- **PFACT-12**：decision-entry.v1 已含 20 个必填字段，缺正向链接/模块归属/需求回链/下游产物；机器强制边界=16 个 h2 精确标题+coverage 恰好一次+五维+R-NNN 索引
  - **status**：`verified`
  - **证据或来源**：decision-log F-014、F-015
  - **关联**：FR-DLOG-001、FR-DLOG-002、FR-DLOG-003；AC-DLOG-001~003
- **PFACT-13**：蓝队大量失败的根因=审查材料含宿主绝对路径导致出口拦截与身份降级掩盖；材料脱敏+错误码保留修复已合入 main；grok/pi 两 provider 残余失败（疑似工具回显路径净化未覆盖）
  - **status**：`verified`
  - **证据或来源**：decision-log F-020（含修复 commit 与抓包取证）
  - **关联**：FR-REV-007；AC-REV-007；OPEN-01
- **PFACT-14**："只跑必要的受影响检查"既有文档规则存在但 agent 反复违反，根因=指令设计未引用规则
  - **status**：`verified`
  - **证据或来源**：decision-log F-021（文档条款+用户原话）
  - **关联**：FR-GOV-004；AC-GOV-004
- **PFACT-15**：make-decision 现有版本已有需求-决策覆盖矩阵五维、收敛检查四行表、UI applicability 三节雏形，可复用
  - **status**：`verified`
  - **证据或来源**：decision-log F-016
  - **关联**：FR-DLOG-001；AC-DLOG-001
- **PFACT-16**：本任务自身已完成 dogfood 实证：R0-R5 调研跑通、research-report 三版 content-addressed 落盘、R5 独立复核 8 条处置、红蓝审查与问答工具化 Talk 实操、interaction aggregate（round_count=5）经运行时契约校验 valid、用户最终确认 receipt 落盘
  - **status**：`verified`
  - **证据或来源**：decision-log 最终确认节（receipt/aggregate hash 绑定）+ RS-001 落盘引用
  - **关联**：全部 FR；验收节三重验证第一层
- **PFACT-17**：文件 mailbox 跨宿主方案的前提是任务内共享文件系统；仅 DSH 一侧完成实测，其余宿主的文件共享与消息能力为文档级证据
  - **status**：`inferred`
  - **来源与限制**：decision-log F-008、调研复核 RV-03；限制=逐宿主文件系统验证未全部完成，跨宿主运行性依赖降级路径兜底
  - **关联**：FR-DEB-001；AC-DEB-001；RISK-05

## 5. 功能需求

> 沿用"叙述层 + 编号字段层"：先讲清完整行为，再做机器追溯。

### 审查深化（REV）

make-decision 的 direction 与 detail 两个审查面从"单轮线性清单"升级为"红队+蓝队两次组请求"：红队=正常/盲审，蓝队=对抗性审查（所有 decision 不成立/不值得改、纵向逐条否定、横向第三路、拽回"明确不做"、戳隐藏前提、防虚假共识；direction 蓝队含方向与需求内容，红队为无方向摘要盲审）。两次请求共同构成一个逻辑 review fact。build-spec 不跟随双发，靠指令强化与验收专项补深度。争议判定与既有修复项保证审查结果可信可用。

- **FR-REV-001**：direction 审查面执行红队（无方向摘要盲审）+蓝队（含方向与需求的对抗性审查）两次组请求，构成同一逻辑 review fact；不为空 findings 复审、不复审 loop
  - **范围边界**：仅 make-decision direction 面；不含跨 provider 第二轮交叉质询（非目标）
  - **依据**：D-101；PFACT-01、PFACT-11
  - **场景**：SCN-001、SCN-002、SCN-006
  - **验收**：AC-REV-001
- **FR-REV-002**：detail 审查面执行红队（正常 detail 审查）+蓝队（对抗性审查）两次组请求，构成同一逻辑 review fact
  - **范围边界**：仅 make-decision detail 面；其余阶段维持 single_round
  - **依据**：D-101；PFACT-01
  - **场景**：SCN-001、SCN-002、SCN-006
  - **验收**：AC-REV-002
- **FR-REV-003**：红蓝两次请求共享同一 material 语义身份并携带 pair_id 与 role（red|blue）元数据；运行时校验同 pair 同 material，不满足则记录 partial、不伪装成完整红蓝；任一侧 partial/failed 时 review fact=available-with-failures 并显式标注对应 incomplete（蓝队标 blue_incomplete、红队标 red_incomplete）；仅一侧完成=available-with-failures+对应 incomplete 标注，不得伪装成完整红蓝；两侧结论以完成集为准并显式标注完成集范围；聚合规则=红蓝各自 findings 并集+provider×角色标注
  - **范围边界**：pair/材料校验与聚合标注；不含 broker 多 phase 协议改造
  - **依据**：D-101（含 OPEN-005 定稿：pair_id/role 进元数据、同 pair 同 material、聚合=并集+标注）；PFACT-01、PFACT-10
  - **场景**：SCN-002、SCN-008
  - **验收**：AC-REV-003
- **FR-REV-004**：build-spec 审查保持 single_round 单次组请求；指令强化横向第三路/戳隐藏前提/防虚假共识/纵向逐条否定候选方案；新增"AC 可判断性与验收盲区"专项：检查 AC 能否被真实测试打破、失败路径是否可验收、用户验收时会发现的 agent 盲区
  - **范围边界**：指令与专项文本；不做 AC 硬校验（与非目标一致）
  - **依据**：D-102；PFACT-11
  - **场景**：SCN-009
  - **验收**：AC-REV-004
- **FR-REV-005**：争议判定=共识（≥2 provider 独立提出同一问题）∪分歧（provider 间 severity/evidence_kind 冲突或一提出一沉默）；以三态矩阵（支持/沉默/反对×provider）判定；聚合记录在 provenance 层增加 disputed/consensus 可选标注，reportable findings 语义不变；送用户过滤规则：方向级或影响验收标准的争议→用户，实现级分歧→debate 独立上下文裁决，实现级共识→主 agent 直接修复并登记
  - **范围边界**：标注与过滤规则；不新增状态机、不成为 gate
  - **依据**：D-103；PFACT-02
  - **场景**：SCN-001
  - **验收**：AC-REV-005
- **FR-REV-006**：统一审查材料身份算法（排除 manifest 条目、按路径排序的规范算法），并配回归验证（含真实 broker 往返场景）；材料身份变化产生新值、不回溯旧记录
  - **范围边界**：算法一致性与回归验证；旧记录只读保留
  - **依据**：D-605；PFACT-10
  - **场景**：SCN-008
  - **验收**：AC-REV-006
- **FR-REV-007**：审查材料在组请求前做宿主绝对路径脱敏（复用既有脱敏能力，与材料身份同源计算）；成员身份被降级时保留底层原始错误码并标注 identity_degraded，不用笼统身份错误掩盖真实失败原因
  - **范围边界**：材料脱敏与错误码保留；已合入 main 的部分不重开，grok/pi 残余按 OPEN-01 条件性义务处理
  - **依据**：D-606；PFACT-13
  - **场景**：SCN-002、SCN-008
  - **验收**：AC-REV-007

### 争议对话（TALK）

争议 findings 必须到达能拍板的人：make-decision 内 Talk3 强绑定方向审查争议、detail 后新增 Talk4；build-spec 正式放开 findings 处置对话（复用 spec-clarify 承载，D-202 早期措辞被 T-023 收窄）；所有交互问答工具化；用户决定写回 finding 处置与风险接收链，形成"争议→debate→talk→decision-log 登记"闭环。

- **FR-TALK-001**：Talk3 的材料显式包含方向面红蓝 findings 的争议清单（共识+分歧）与 debate 裁决书存疑项，以问答工具批次呈现
  - **范围边界**：材料绑定为技能与合同文本层改动；不改运行时强制绑定
  - **依据**：D-201；PFACT-03
  - **场景**：SCN-001
  - **验收**：AC-TALK-001
- **FR-TALK-002**：触发条件=仅当 detail 审查 findings 聚合后存在需用户裁定的争议项（方向级/影响验收级）时，detail 审查与 debate 裁决之后新增第 4 轮 talk（detail findings 处置）；无争议项时不发起对话，主 agent 直接修复并登记（与 FR-GOV-002 规则①一致）；interaction aggregate 动态校验支持实际轮数（round_count 按实际轮数动态校验，无争议时可为 3，有争议时≥4；以已落盘 round_count=5 事实为准）
  - **范围边界**：新增一轮对话；aggregate 不升 v2 schema、不新增 findings_talk 形态
  - **依据**：D-201（轮数口径=以已落盘 aggregate round_count=5 事实为准、动态校验；歧义 A-05 定案口径）；PFACT-03
  - **场景**：SCN-001
  - **验收**：AC-TALK-002
- **FR-TALK-003**：build-spec 存在争议 findings 时，用户收到 findings 处置对话（基于争议发现的规格澄清批次）；承载=复用 spec-clarify；不新增技能、talk-with-zhipeng 不进 build-spec 声明、技能闭包维持 grill 独占（其他调整仅限契约文本）；对话生命周期沿用既有 stage outcome 侧校验与交互 receipt，interaction aggregate 不升 v2
  - **范围边界**：仅 findings 处置对话；不是 Talk/Grill/Clarify 原语义的扩张，不构成新确认门
  - **依据**：D-202（T-023 用户拍板：复用 spec-clarify 承载；对话生命周期=沿用既有 stage outcome 侧校验与交互 receipt、aggregate 不升 v2；歧义 A-02 定案口径）；PFACT-04
  - **场景**：SCN-009
  - **验收**：AC-TALK-003
- **FR-TALK-004**：用户对话答复绑定 finding（答复引用进入处置证据、source=user_reply）；needs_human 处置后状态写回 user_decided；accepted_risk 经既有 confirm 语义扩展的公共通道完成（不新增公共行为类型），风险回复证据落盘并绑定认证 receipt；该通道按治理登记 owner/consumer/删除条件
  - **范围边界**：写回与路由接线；不新增 gate、不自动越过人
  - **依据**：D-203（路由命名按 OPEN-005 定稿=既有 confirm 语义扩展）；PFACT-07
  - **场景**：SCN-004、SCN-007
  - **验收**：AC-TALK-004
- **FR-TALK-005**：talk/对话交互以宿主结构化问答工具呈现：问题卡入参=question_id/axis/options（≤3，含后果与风险）/recommended，出参=answers（option_id 或 free_text）+reply_ref/reply_hash（宿主认证）；答复可绑定写回；宿主无问答工具时降级为文本卡并如实记录工具降级事实；选项用大白话说明后果与风险
  - **范围边界**：呈现层 IO 契约；宿主侧缝隙（ask→wait→reply→resume）不在本产品契约内
  - **依据**：D-204（用户拍板：以 decision-log 决策表为唯一事实源，取含 IO 契约的版本；歧义 A-06 定案口径）；PFACT-03
  - **场景**：SCN-001、SCN-004
  - **验收**：AC-TALK-005

### debate v2（DEB）

debate 技能重写为宿主中立的裁决机制：4 个独立子代理（甲/乙/丙/丁）各持立场书、经文件 mailbox 交锋、主代理全程法官禁言；反偏见措施结构化；裁决权限分级，方向级必达用户，实现级由独立上下文裁决、主 agent 只登记。

- **FR-DEB-001**：debate v2=4 个独立上下文辩论方子代理（甲/乙/丙/丁：各自独立上下文、独立产出立场书、经文件 mailbox 交锋、2 轮封顶）+文件 mailbox（任务共享目录按轮次组织）+主代理全程法官禁言（不参与辩论、不作裁决）；不设第 5 个评委角色，评委职责由辩论方按规则承担（见 FR-DEB-003）；运行前做宿主能力判定；DSH 原生消息可作加速；无共享文件系统或宿主消息能力时按降级路径（父代理串行转发）执行并记录降级事实
  - **范围边界**：角色执行形态与通信机制；取代旧技能对 Claude Code teammate 的依赖；不含跨 provider 质询协议
  - **依据**：D-301；PFACT-05、PFACT-06、PFACT-17
  - **场景**：SCN-005、SCN-010
  - **验收**：AC-DEB-001
- **FR-DEB-002**：反偏见硬约束=沿用原 7 条并新增：裁决前匿名化与交换顺序、rubric 化评分（每条 finding 按代价/收益/证据）、预算声明、2 轮封顶、禁止附和、分歧保留为证据（不强行共识）；辩论仅在有真实分歧且模型具备角色区分度时启用
  - **范围边界**：防偏规则与启用条件；规则固定、不随任务膨胀
  - **依据**：D-302；PFACT-05
  - **场景**：SCN-005、SCN-010
  - **验收**：AC-DEB-002
- **FR-DEB-003**：裁决权限分级——方向级与影响验收标准的争议必达用户裁定；实现级争议由辩论方角色按 rubric 承担评委职责（评委=辩论角色按规则承担，不是第 5 个角色）产出裁决建议，经另一独立复核子代理复核，主代理只登记、不得单方裁决针对自身产物的异源质疑；裁决书含裁决者标注（谁提出/谁反驳/谁裁决）并引用幸存/被驳论点；产物不可变落盘；不设"辩论通过"质量门
  - **范围边界**：裁决权分配与产物形态；不构成 pass 判据
  - **依据**：D-303；PFACT-09
  - **场景**：SCN-005
  - **验收**：AC-DEB-003

### 调研机制（RES）

调研从无契约升级为 R0-R5 子流程契约：规划→迭代检索（中英双语、读原文、查询重写）→并行深读→三角测量→落盘→独立复核；工具路由写死；产物 content-addressed 落盘任务追踪目录；复盘阶段暴露调研深度。

- **FR-RES-001**：提供 deep-research 调研技能契约：R0 缺口规划→R1 迭代检索（必须读原文、查询重写、中英双语）→R2 并行深读→R3 三角测量→R4 落盘→R5 独立复核；含停止条件预算（≤3 轮/问题、连续 2 轮无新增=饱和、时间盒）；跳过调研必须论证；make-decision 调研条款引用该契约；spec-research 保留为后续阶段点状疑问通道并注明分工
  - **范围边界**：调研流程契约；不把调研变成推进 gate
  - **依据**：D-401；PFACT-08
  - **场景**：SCN-001
  - **验收**：AC-RES-001
- **FR-RES-002**：调研报告按 research-report.v1 结构（问题/决策轴/轮次/关键来源（分层+是否读原文）/证据/置信度/未决项+覆盖度+饱和说明+内外部比例+一手来源率+复核状态）以 content-addressed 方式落盘任务追踪目录；decision-log 只引用 path+hash、不复制正文；命名与字节一致
  - **范围边界**：产物形态与落盘位置；四材料不承载报告正文
  - **依据**：D-402；PFACT-16
  - **场景**：SCN-001
  - **验收**：AC-RES-002
- **FR-RES-003**：调研工具路由写死：外部=anysearch+web_fetch+子代理深读；内部=文件检索+精读+git 历史+子代理并行盘点+方法论技能+代码知识库工具选型结论（git/ripgrep/ast-grep 最小栈，大仓可选预索引工具，重型知识图谱/embedding 栈不默认）；纯 agent 无工具检索视为不合格；工具不可用时显式降级并记录
  - **范围边界**：工具选型与降级记录；不自建知识图谱基础设施
  - **依据**：D-403；PFACT-08
  - **场景**：SCN-001
  - **验收**：AC-RES-003
- **FR-RES-004**：阶段复盘增加调研深度区块：一手来源率、收敛率、未决项数量、工具使用记录；维度缺省时说明 not_applicable；不新增 gate
  - **范围边界**：复盘可见性；仅事实呈现不作判据
  - **依据**：D-404；PFACT-08
  - **场景**：SCN-001
  - **验收**：AC-RES-004

### 决策记录（DLOG）

decision-log 从扁平清单升级为"先大纲、再细化决策逻辑、再收敛"的结构化文档：需求框架骨架驱动调研/talk/审查/grill 回填；决定区按模块分组；每条决策带链字段，阅读者能判断"需求考虑是否清楚"。

- **FR-DLOG-001**：decision-log 开头设"需求框架"节：按任务类型选择骨架（功能类=背景-问题-目标-方案-验收-扩展；研究类=问题-论断-证据-裁决；2 类 preset 起步，其余任务类型用精简骨架，验证后再增）；决策挂骨架节点；节点带"待补证据"声明式标记；make-decision 开始时先建骨架，R0 缺口由骨架生成
  - **范围边界**：文本层结构；不破坏既有机器强制边界（16 个 h2/覆盖矩阵/五维/R-NNN 索引）
  - **依据**：D-501（preset 数量按 OPEN-005 定稿=2 类起步）；PFACT-12、PFACT-15
  - **场景**：SCN-001
  - **验收**：AC-DLOG-001
- **FR-DLOG-002**："决定"节内按模块（h3）分组，模块=同主题决策集合，模块列表由骨架方案节点驱动；模块内决策按链序排列；跨模块引用用 D-ID+derived_from
  - **范围边界**：组织方式；不改变决定区 h2 与既有校验
  - **依据**：D-502；PFACT-12
  - **场景**：SCN-001
  - **验收**：AC-DLOG-002
- **FR-DLOG-003**：决策条目新增文本层链字段 derived_from/module/requirement_ids/artifacts；配套轻量告警：链字段缺失/格式非法/引用目标不存在时仅告警，不阻断、不升 schema、不进 gate；告警规则文件随决策记录技能交付并接入既有检查汇总
  - **范围边界**：文本层+轻量告警；decision-entry.v1 schema 不动，机器强制面不变
  - **依据**：D-104（告警规则文件按 OPEN-005 定稿）；PFACT-12
  - **场景**：SCN-001
  - **验收**：AC-DLOG-003

### 契约合规与执行模型（GOV）

所有契约演进成对执行、防"纸面合规"；失败与降级有显式状态转移语义；交付按 phase 制；测试策略硬规则落地；make-decision 主会话按调度器模型运行。

- **FR-GOV-001**：契约演进集中执行并成对更新：wh-review 合同重述"一个逻辑 review fact=红蓝两次组请求（仅 make-decision direction/detail）"并写明 pair_id/同 material 校验、blue_incomplete 降级语义与聚合规则；build-spec 合同保持单次请求并写明红蓝仅适用 make-decision 的边界、指令强化与"AC 可判断性与验收盲区"专项；每项合同改动与对应契约测试断言成对更新（语法与测试成对），AC-011 审计随契约语义同步更新；全部受影响契约与测试同步转绿后才算该 phase 完成
  - **范围边界**：合同文本+测试断言+审计的同步演进；不改 broker 协议；不新增公共入口类
  - **依据**：D-601；PFACT-09
  - **场景**：SCN-001
  - **验收**：AC-GOV-001
- **FR-GOV-002**：失败与降级按显式状态转移规则执行并落入合同文本：①无争议无分歧→不入 debate 不入 talk，主 agent 直接修复+登记；②任一侧（红或蓝）partial/failed→available-with-failures 标注对应 incomplete（blue_incomplete/red_incomplete），debate 输入=已完成集，告知用户；仅一侧完成不得伪装完整红蓝，结论以完成集为准并显式标注；③红蓝两次组请求全部 unavailable→根因修复（路由/材料）后同编成重试一次；④debate 无裁决或 2 轮未决→存疑清单入用户，不静默；⑤用户中止 talk→已答保留、未答标 user_deferred 进风险表；⑥问答工具不可用→降级文本卡并记录工具降级事实；⑦单成员失败→其余成员结果照用、partial 事实保留；任何退化必须记录事实且用户可见
  - **范围边界**：转移语义与记录义务；不引入新状态机、不作推进门
  - **依据**：D-604；PFACT-09
  - **场景**：SCN-002、SCN-003、SCN-004、SCN-005、SCN-006
  - **验收**：AC-GOV-002
- **FR-GOV-003**：交付按模块划 phase（审查深化→争议对话→debate v2→调研机制→决策记录→契约合规；契约 phase 先行或与首批并行由 build-plan 排定）；每 phase 独立完成开发+本 phase 契约/测试绿+用户验收+一次异源审查（红或蓝，视 phase 性质）后进入下一 phase；phase 失败不阻断其他 phase 的独立部分，记录 unavailable
  - **范围边界**：组织/交付粒度；phase 不是运行时控制面、不新增 stage
  - **依据**：D-603；PFACT-09
  - **场景**：SCN-001
  - **验收**：AC-GOV-003
- **FR-GOV-004**：AGENTS.md 增补硬规则：任何阶段、任何修复、任何子代理指令，只运行受影响的针对性测试，禁止全量回归（全量测试套件或等效命令），除非用户或 CI 守卫明确要求；本任务后续所有验证（含 phase 验收）按此执行
  - **范围边界**：协作规则增补；不改变测试本身的语义
  - **依据**：D-607；PFACT-14
  - **场景**：SCN-001
  - **验收**：AC-GOV-004
- **FR-GOV-005**：make-decision 按"主会话=调度器"执行模型运行：执行器角色 M（主会话：派发/交互/决策/定稿发布）/S（子代理：检索/深读/草稿/汇总/校验/复核，只回传结构化摘要）/B（后台命令：零上下文执行，输出只落盘）/P（并行）；上下文守恒 6 规则——①全量产物 content-addressed 落盘、主会话只收 ref+hash+摘要；②子代理回传强制结构化（研究/草稿/汇总类≤500 字；复核类按条目一行一条 finding，不压扁逐条结论）；③并行上限=研究 4/debate 4/红蓝 2；④交互卡唯一来源=对话登记表、主会话独占交互；⑤候选生成外包、裁决分级（方向级/影响验收→用户；实现级→独立上下文裁决、主会话只登记）；⑥主会话旧步骤不回读（子代理可读全量落盘材料）
  - **范围边界**：执行方式约束，写入 make-decision 技能文本；摘要模板细节按 OPEN-005 已定稿口径执行；不改变阶段契约
  - **依据**：D-608；PFACT-16
  - **场景**：SCN-001
  - **验收**：AC-GOV-005
- **FR-GOV-006**：非目标与延期项登记并保持可见：不新增 stage/gate/公共入口类/第五材料；延期项 X-001~X-004 各附触发条件，出现真实消费再评估；新控制面（问答工具、风险接收通道）必须登记 owner/consumer/删除条件——本规格登记两条：①结构化问答工具卡（owner=各交互 stage 主会话；consumer=stage outcome 交互校验；删除条件=结构化问答机制被替代）；②accepted_risk 的 confirm 语义扩展（owner=build-spec 及相关 stage；consumer=处置校验中 accepted_risk 绑定认证 receipt 的检查；删除条件=风险接收机制被替代）
  - **范围边界**：边界登记与治理；不扩张范围
  - **依据**：D-602；PFACT-09
  - **场景**：SCN-001
  - **验收**：AC-GOV-006

## 6. 模块划分

> 只写产品职责。

### 审查深化（红蓝双发与争议判定）

- **负责什么**：让 make-decision 两审查面获得盲审+对抗双视角，build-spec 获得指令强化与验收专项；定义争议并标注
- **对外提供什么**：可用的红蓝 review fact（含降级标注）、争议清单（共识+分歧）
- **依赖谁**：既有 wh-review 组请求能力、材料冻结与身份算法
- **测试边界**：红蓝合同与测试成对绿；争议标注不改变 reportable findings 语义

### 争议对话（问答工具化与写回闭环）

- **负责什么**：把争议 findings 以问答工具送达用户并把决定写回
- **对外提供什么**：finding 处置状态（含 user_decided）、风险接收记录、决策登记
- **依赖谁**：宿主问答工具能力、既有确认语义、debate 裁决输出
- **测试边界**：对话生命周期校验通过；写回绑定认证 receipt；无对话时争议不静默

### debate v2（跨宿主裁决辩论）

- **负责什么**：对争议提供独立上下文的多角色辩论与裁决建议
- **对外提供什么**：不可变裁决产物（立场书/交锋记录/裁决书）、存疑清单
- **依赖谁**：宿主子代理能力与任务共享文件系统（或降级转发）
- **测试边界**：DSH 可运行实证；降级路径有记录；裁决书标注裁决者且不设质量门

### 调研机制（R0-R5 与落盘）

- **负责什么**：让调研深度成为可验收事实
- **对外提供什么**：content-addressed 调研报告、复核结论、复盘维度事实
- **依赖谁**：外部检索工具、内部代码检索工具栈、子代理并行能力
- **测试边界**：R0-R5 跑通且落盘可复核；跳过有论证；降级有记录

### 决策记录（需求框架与决策链）

- **负责什么**：让 decision-log 结构可读、决策可追溯
- **对外提供什么**：需求框架骨架、模块化决定区、链字段与轻量告警
- **依赖谁**：既有 decision-entry.v1 与机器强制边界
- **测试边界**：结构校验不被破坏；告警不阻断；试运行样本（本任务 decision-log）可读

### 契约合规与执行模型

- **负责什么**：保证契约演进真实落地、失败语义明确、交付有序、主会话不炸
- **对外提供什么**：成对更新的合同与测试、状态转移规则、phase 验收节奏、执行器矩阵与上下文守恒规则、测试策略硬规则
- **依赖谁**：全部上游模块
- **测试边界**：每 phase 验收含契约测试清单核对；三重验证清单可逐项核对

## 7. 关键实体

- **mailbox 消息**：
  - **定义**：debate 角色间一次交锋投递的单条消息
  - **字段和约束**：单消息单文件 JSON；字段=from/to/round/seq/body 或 body_ref/ts；长正文不入消息体，以 body_ref 引用落盘正文；消息按轮次目录组织
  - **关系**：属于某 debate 轮次；被裁决书引用为交锋证据
- **review pair（红蓝对）**：
  - **定义**：同一逻辑 review fact 的红、蓝两次组请求
  - **字段和约束**：pair_id 标识一对；role=red|blue 元数据随请求/结果携带；同 pair 必须同 material 语义身份，不满足记 partial；蓝队失败标 blue_incomplete
  - **关系**：两次请求结果聚合为一个 review fact（findings 并集+provider×角色标注）；作为 debate 输入
- **争议 cluster**：
  - **定义**：经三态矩阵判定为有争议的 findings 聚合单元
  - **字段和约束**：provenance 层可选标注 disputed/consensus；判定依据=支持/沉默/反对×provider；reportable findings 语义不变
  - **关系**：方向级/影响验收的争议流向用户对话；实现级流向 debate 裁决
- **问答问题卡与答复**：
  - **定义**：一次结构化问答交互的提问与回复
  - **字段和约束**：问题卡=question_id/axis/options（≤3，含后果与风险）/recommended；答复=answers（option_id 或 free_text）+reply_ref/reply_hash（宿主认证）
  - **关系**：答复绑定 finding 处置（source=user_reply）或风险接收 receipt；登记进对话记录
- **调研报告（research-report.v1）**：
  - **定义**：一次 R0-R5 调研的结构化产物
  - **字段和约束**：问题/决策轴/轮次/关键来源（分层+是否读原文）/证据/置信度/未决项/覆盖度/饱和说明/内外部比例/一手来源率/复核状态；content-addressed 命名且与字节一致
  - **关系**：decision-log 只引用 path+hash；复核 finding 逐条处置
- **finding 处置记录**：
  - **定义**：一条 reportable finding 的处置事实
  - **字段和约束**：状态=fixed/rejected_invalid/accepted_risk/needs_human/user_decided；accepted_risk 必须绑定认证 receipt；答复引用作证据
  - **关系**：连接审查结果、用户答复、decision-log 登记；build-spec 阶段处置记录落地于 spec.md 修订+任务质量事实/证据区（本阶段无 decision-log）

## 8. 数据和生命周期

- **数据粒度**：mailbox=单条消息一文件；research-report=一次调研一份 JSON；interaction aggregate=一个阶段一份聚合（绑定 decision hash 与 material revision）；review 结果=红蓝两次组请求各产出一份原始结果，聚合为一个逻辑 review fact（pair）；build-spec 等单发面=一次组请求一份结果、对应一份规范 review fact；确认 receipt=一次用户确认一份
- **数据时效**：mailbox 消息随 debate 轮次产生、轮次封顶后不再新增；research-report 每次调研迭代产生新版本、旧版本保留；aggregate/receipt 在材料修订后需重建（旧绑定失效）；review 结果随请求产生、超时或失败如实记 unavailable/partial
- **缺失或迟到**：审查缺失按 unavailable/partial 事实记录并允许修复后重试一次（SCN-002/003）；调研工具缺失显式降级并记录；不补传、不伪造
- **预览与正式**：操作者看到的是落盘后的正式事实（content-addressed 产物+登记引用）；主会话只见 ref+hash+摘要；无草稿态对用户暴露
- **当前与历史**：四材料为当前真相；research-report 旧版本、aggregate 旧版、旧 material_id 记录均只读保留为历史，不回溯改写；reports immutable
- **归属与清理**：调研报告/review 原始结果/交互 receipt 归属任务追踪目录（task_dir 质量证据区），随任务保留供复盘；debate 产物归属任务共享目录轮次区、不可变保留；mailbox 与 debate 产物随任务归档，不做跨任务复用；新控制面登记删除条件（机制被替代时删除）

## 9. 兼容性预留

- **既有消费方**：decision-entry.v1 schema 不动（链字段只加在文本层）；interaction aggregate v1 保持可读（仅动态轮数校验，不升 v2、不新增 findings_talk 形态）；build-spec 审查 single_round 契约语义不变（仅指令与专项增强）；grill 独占边界不变；旧 task 记录、旧 receipt、旧 review、历史 snapshot 只读保留
- **命名预留**：红蓝 pair 元数据（pair_id/role）与争议标注（disputed/consensus）采用可选字段，缺省不影响既有消费；风险接收走既有 confirm 语义扩展而非新行为类型
- **容器预留**：需求框架 preset 从 2 类起步，其余任务类型用精简骨架，验证后增补不改结构；任务追踪目录质量证据区可继续容纳 debate 产物与新型报告
- **状态预留**：review fact 状态容纳 available-with-failures+blue_incomplete；finding 处置状态容纳 user_decided；talk 生命周期容纳 user_deferred；均为既有事实模型内的取值，不新增状态机
- **扩展边界**：本期预留=跨 provider 交叉质询（X-001）、其余三阶段同构改造（X-002）、decision-entry.v2 机器校验（X-003）的触发条件；不承诺=broker 多 phase 协议、知识图谱基础设施、任何推进门化

## 10. 明确不做与默认必须成立

### 明确不做

非目标（继承 decision-log 非目标节）：

1. 不改 build-plan/build-code/verify-code 的审查与对话流程（同构改造=X-002 延期，出现真实消费再评估；关联 D-102/D-602）。
2. 不新增 stage、不新增第五材料；新控制面（问答工具、风险接收通道）必须登记 owner/consumer/删除条件（关联 D-602）。
3. 不做跨 provider 的第二轮交叉质询（X-001：需改 broker 多 phase 协议+约 2× 成本；触发条件=红蓝+debate 实证后仍显不足；关联 D-602）。
4. 不把审查/debate 变成推进 gate 或 pass 判据（宪法 F4/Q1；关联 D-303/D-602）。
5. 不升级 decision-entry.v2 机器强制 schema（X-003：待真实机器消费者出现；关联 D-104/D-602）。
6. 不做本任务内额外真实样例任务（X-004：三重验证已替代；关联 D-602）。

拒绝方案（继承 decision-log 拒绝方案节，与非目标重合者仅列一次、见上方对应条目）：

7. 单请求两阶段（盲/显同调用）——盲审—对抗边界靠指令、机器不可验证；用户选定契约演进为正式两次请求（关联 D-101）。
8. 全五阶段红蓝两次——后续阶段收益边际递减、成本全面抬升（关联 D-101，G1 边界）。
9. AC 硬校验（验收标准治理）——与"测试不是推进门"宪法原则冲突（关联 D-102）。
10. 单子代理多角色 debate——角色同上下文，自偏与从众风险高（关联 D-301）。
11. v2 schema 机器强制——同非目标第 5 条，此处不重复展开。
12. 跨 provider 第二轮交叉质询（本轮内做）——同非目标第 3 条，此处不重复展开。
13. 本任务内额外真实样例任务——同非目标第 6 条，此处不重复展开。

> 这是唯一权威非目标列表；上游批准的 out-of-scope 已逐条继承。

### 默认必须成立

1. **标准流程约束（R-010；用户已拍板锚定本节，歧义 A-04 定案口径）**：任何任务按标准五阶段从 make-decision 开始、先建 worktree、不跳阶段、不依赖 build-spec 补需求；build-spec 阶段只做编码细节定稿、不做需求面扩张。关联 FR-GOV-003、FR-GOV-005；验收 AC-GOV-003、AC-GOV-005。
2. **大白话与记录约束（R-012；用户已拍板锚定本节，歧义 A-04 定案口径）**：与用户的所有对话用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接。关联 FR-TALK-005、FR-DLOG-001；验收 AC-TALK-005、AC-DLOG-001。
3. **质量事实如实记录**：unavailable/partial/incomplete 如实保留，不伪造通过；review/debate/调研产物不作推进许可证。关联 FR-GOV-002；验收 AC-GOV-002。
4. **不可逆操作经人确认**：commit/push/merge/archive/cleanup 与 accepted_risk 必须显式授权，无自动路径。关联 FR-TALK-004；验收 AC-TALK-004。
5. **禁止自审自判**：针对自身产物的异源质疑由独立上下文裁决+独立复核，主 agent 只登记。关联 FR-DEB-003；验收 AC-DEB-003。
6. **宪法红线**：不新增 stage/gate/公共入口类/第五材料；新能力先登记职责/consumer/owner/删除条件。关联 FR-GOV-006；验收 AC-GOV-006。

## 11. 验收标准

- [ ] **AC-REV-001**：direction 审查面可观察到红队盲审+蓝队对抗两次组请求且构成同一逻辑 review fact
  - **需求**：FR-REV-001
  - **验证方法**：合同文本审查+契约测试+真实组请求运行观察
  - **通过条件**：合同重述"一个逻辑 fact=红蓝两次组请求"；两次请求各自完成并落盘；无空 findings 复审
  - **失败条件**：只发一次请求；或两次请求未被识别为同一逻辑 fact；或出现复审 loop
  - **证据类型**：`test`
  验证：合同文本审查+契约测试+真实组请求运行观察；通过：合同重述"一个逻辑 fact=红蓝两次组请求"；两次请求各自完成并落盘；无空 findings 复审；失败：只发一次请求；或两次请求未被识别为同一逻辑 fact；或出现复审 loop；证据：`test`
- [ ] **AC-REV-002**：detail 审查面可观察到红队+蓝队两次组请求且构成同一逻辑 review fact
  - **需求**：FR-REV-002
  - **验证方法**：同 AC-REV-001（detail 面）
  - **通过条件**：detail 面红蓝各一次组请求完成并落盘
  - **失败条件**：detail 面维持单次；或蓝队语义缺失
  - **证据类型**：`test`
  验证：同 AC-REV-001（detail 面）；通过：detail 面红蓝各一次组请求完成并落盘；失败：detail 面维持单次；或蓝队语义缺失；证据：`test`
- [ ] **AC-REV-003**：红蓝关联契约生效——pair 元数据、同 material 校验、blue_incomplete 降级、聚合标注全部可观察
  - **需求**：FR-REV-003
  - **验证方法**：契约测试（含故意 material 不一致与蓝队失败的用例）+结果结构检查
  - **通过条件**：pair_id/role 随结果携带；material 不一致记 partial；蓝队失败标 blue_incomplete 且不当完整红蓝；聚合=并集+provider×角色标注
  - **失败条件**：任一校验缺失、降级被伪装成完整、或聚合丢失角色标注
  - **证据类型**：`test`
  验证：契约测试（含故意 material 不一致与蓝队失败的用例）+结果结构检查；通过：pair_id/role 随结果携带；material 不一致记 partial；蓝队失败标 blue_incomplete 且不当完整红蓝；聚合=并集+provider×角色标注；失败：任一校验缺失、降级被伪装成完整、或聚合丢失角色标注；证据：`test`
- [ ] **AC-REV-004**：build-spec 审查指令含蓝队要素且"AC 可判断性与验收盲区"专项真实出现在审查输出中
  - **需求**：FR-REV-004
  - **验证方法**：合同/指令文本审查+一次真实 build-spec 审查运行观察
  - **通过条件**：保持单次请求；审查输出含对 AC 可打破性、失败路径可验收性、用户验收盲区的检查结论
  - **失败条件**：指令缺失专项；或审查输出无验收盲区维度
  - **证据类型**：`evidence`
  验证：合同/指令文本审查+一次真实 build-spec 审查运行观察；通过：保持单次请求；审查输出含对 AC 可打破性、失败路径可验收性、用户验收盲区的检查结论；失败：指令缺失专项；或审查输出无验收盲区维度；证据：`evidence`
- [ ] **AC-REV-005**：争议判定双定义+三态矩阵+标注生效，且送用户过滤规则被执行
  - **需求**：FR-REV-005
  - **验证方法**：聚合结构测试（含"一提出一沉默"用例）+真实审查结果观察
  - **通过条件**：共识与分歧（含一提出一沉默）均被识别；disputed/consensus 标注落在 provenance 层；reportable findings 语义不变；实现级共识不送用户
  - **失败条件**：漏判任一争议形态；或标注改变 reportable findings 语义；或实现级共识被送达用户造成无效交互
  - **证据类型**：`test`
  验证：聚合结构测试（含"一提出一沉默"用例）+真实审查结果观察；通过：共识与分歧（含一提出一沉默）均被识别；disputed/consensus 标注落在 provenance 层；reportable findings 语义不变；实现级共识不送用户；失败：漏判任一争议形态；或标注改变 reportable findings 语义；或实现级共识被送达用户造成无效交互；证据：`test`
- [ ] **AC-REV-006**：材料身份算法统一且严格冻结路径真实往返不再 MATERIAL_INCOMPLETE
  - **需求**：FR-REV-006
  - **验证方法**：回归测试（含真实 broker 往返场景）
  - **通过条件**：本地与 broker 算法输出一致（排除 manifest+按路径排序）；真实往返通过
  - **失败条件**：算法仍不一致或真实往返报 MATERIAL_INCOMPLETE
  - **证据类型**：`test`
  验证：回归测试（含真实 broker 往返场景）；通过：本地与 broker 算法输出一致（排除 manifest+按路径排序）；真实往返通过；失败：算法仍不一致或真实往返报 MATERIAL_INCOMPLETE；证据：`test`
- [ ] **AC-REV-007**：审查材料无宿主绝对路径泄漏；身份降级时原始错误码可观察
  - **需求**：FR-REV-007
  - **验证方法**：脱敏测试+失败注入观察错误码
  - **通过条件**：材料中不出现宿主绝对路径；身份降级结果保留底层原始错误码并标注 identity_degraded
  - **失败条件**：材料含宿主路径；或真实失败原因被笼统身份错误掩盖
  - **证据类型**：`test`
  验证：脱敏测试+失败注入观察错误码；通过：材料中不出现宿主绝对路径；身份降级结果保留底层原始错误码并标注 identity_degraded；失败：材料含宿主路径；或真实失败原因被笼统身份错误掩盖；证据：`test`
- [ ] **AC-TALK-001**：Talk3 真实以方向面红蓝争议清单+debate 存疑项为材料向用户发问
  - **需求**：FR-TALK-001
  - **验证方法**：真实任务运行观察（交互记录）
  - **通过条件**：方向面存在争议时 Talk3 问题卡内容来自争议清单与裁决存疑项；答复登记进对话记录
  - **失败条件**：Talk3 材料与审查 findings 无关；或争议存在时未发问
  - **证据类型**：`evidence`
  验证：真实任务运行观察（交互记录）；通过：方向面存在争议时 Talk3 问题卡内容来自争议清单与裁决存疑项；答复登记进对话记录；失败：Talk3 材料与审查 findings 无关；或争议存在时未发问；证据：`evidence`
- [ ] **AC-TALK-002**：detail findings 存在需用户裁定的争议项时真实发生第 4 轮 talk，无争议项时不发起对话（主 agent 直接修复+登记）；aggregate 动态校验接受实际轮数
  - **需求**：FR-TALK-002
  - **验证方法**：真实任务运行观察+aggregate 契约校验
  - **通过条件**：有争议项时 detail findings 处置对话发生；无争议项时主 agent 直接修复并登记、不发起对话即推进；aggregate 校验按实际轮数动态通过（无争议时可为 3，有争议时≥4，与实际轮数一致）
  - **失败条件**：存在需用户裁定的争议项却未对话直接 approve；或无争议项时强行发起无效对话；或 aggregate 校验拒绝合法轮数
  - **证据类型**：`evidence`
  验证：真实任务运行观察+aggregate 契约校验；通过：有争议项时 detail findings 处置对话发生；无争议项时主 agent 直接修复并登记、不发起对话即推进；aggregate 校验按实际轮数动态通过（无争议时可为 3，有争议时≥4，与实际轮数一致）；失败：存在需用户裁定的争议项却未对话直接 approve；或无争议项时强行发起无效对话；或 aggregate 校验拒绝合法轮数；证据：`evidence`
- [ ] **AC-TALK-003**：build-spec 争议 findings 经 spec-clarify 承载的处置对话送达用户且生命周期校验通过
  - **需求**：FR-TALK-003
  - **验证方法**：真实 build-spec 运行观察+stage outcome 侧交互校验
  - **通过条件**：争议存在时用户收到处置对话批次；生命周期沿用既有 stage outcome 校验与 receipt；talk-with-zhipeng 未进 build-spec 声明；grill 独占边界未变
  - **失败条件**：争议无对话；或新增技能/破坏 grill 独占；或 aggregate 被升为 v2 形态
  - **证据类型**：`evidence`
  验证：真实 build-spec 运行观察+stage outcome 侧交互校验；通过：争议存在时用户收到处置对话批次；生命周期沿用既有 stage outcome 校验与 receipt；talk-with-zhipeng 未进 build-spec 声明；grill 独占边界未变；失败：争议无对话；或新增技能/破坏 grill 独占；或 aggregate 被升为 v2 形态；证据：`evidence`
- [ ] **AC-TALK-004**：用户决定写回闭环——答复绑定 finding、needs_human 写回 user_decided、accepted_risk 经公共通道落盘并绑定 receipt
  - **需求**：FR-TALK-004
  - **验证方法**：处置记录结构检查+一次真实 accepted_risk 流程观察
  - **通过条件**：处置记录含答复证据引用与 source=user_reply；needs_human 答复后状态为 user_decided；accepted_risk 有公共通道、证据落盘、绑定认证 receipt、治理登记齐全
  - **失败条件**：答复无写回位置；或 accepted_risk 无公共通道/无 receipt 绑定
  - **证据类型**：`test`
  验证：处置记录结构检查+一次真实 accepted_risk 流程观察；通过：处置记录含答复证据引用与 source=user_reply；needs_human 答复后状态为 user_decided；accepted_risk 有公共通道、证据落盘、绑定认证 receipt、治理登记齐全；失败：答复无写回位置；或 accepted_risk 无公共通道/无 receipt 绑定；证据：`test`
- [ ] **AC-TALK-005**：交互以结构化问答工具呈现且 IO 契约满足，答复可绑定；降级有记录
  - **需求**：FR-TALK-005
  - **验证方法**：真实交互观察（本任务已实证问答工具形式）+降级场景检查
  - **通过条件**：问题卡含选项（≤3）+推荐项+后果/风险大白话；答复含认证引用；无工具宿主降级文本卡并记录降级事实
  - **失败条件**：退回纯聊天体且无记录；或答复无法绑定写回
  - **证据类型**：`evidence`
  验证：真实交互观察（本任务已实证问答工具形式）+降级场景检查；通过：问题卡含选项（≤3）+推荐项+后果/风险大白话；答复含认证引用；无工具宿主降级文本卡并记录降级事实；失败：退回纯聊天体且无记录；或答复无法绑定写回；证据：`evidence`
- [ ] **AC-DEB-001**：debate v2 在 DSH 真实运行：4 独立子代理+mailbox 交锋+2 轮封顶+产物落盘；降级路径有说明
  - **需求**：FR-DEB-001
  - **验证方法**：真实运行观察（本任务 dogfood）+跨宿主降级路径文档核查
  - **通过条件**：4 角色独立上下文、立场书独立；mailbox 交锋记录存在；产物按轮次不可变落盘；Codex/Multica 降级路径成文；不依赖 Claude Code teammate
  - **失败条件**：单上下文角色扮演冒充独立子代理；或依赖 teammate；或产物未落盘
  - **证据类型**：`evidence`
  验证：真实运行观察（本任务 dogfood）+跨宿主降级路径文档核查；通过：4 角色独立上下文、立场书独立；mailbox 交锋记录存在；产物按轮次不可变落盘；Codex/Multica 降级路径成文；不依赖 Claude Code teammate；失败：单上下文角色扮演冒充独立子代理；或依赖 teammate；或产物未落盘；证据：`evidence`
- [ ] **AC-DEB-002**：反偏见措施在 debate 产物中可观察
  - **需求**：FR-DEB-002
  - **验证方法**：裁决产物结构检查
  - **通过条件**：裁决前有匿名化/顺序交换证据；评分按 rubric；有预算声明；未共识分歧保留为证据
  - **失败条件**：强行共识抹平分歧；或无 rubric/预算痕迹
  - **证据类型**：`evidence`
  验证：裁决产物结构检查；通过：裁决前有匿名化/顺序交换证据；评分按 rubric；有预算声明；未共识分歧保留为证据；失败：强行共识抹平分歧；或无 rubric/预算痕迹；证据：`evidence`
- [ ] **AC-DEB-003**：裁决分级被执行——方向级争议必达用户、实现级由独立上下文裁决+复核、主 agent 只登记；无辩论通过门
  - **需求**：FR-DEB-003
  - **验证方法**：真实任务运行观察+裁决书结构检查
  - **通过条件**：方向级/影响验收争议出现在用户问题卡；实现级裁决书标注裁决者与幸存/被驳论点且经独立复核；无"辩论通过"判据
  - **失败条件**：方向级争议未达用户；或主 agent 单方裁决针对自身产物的异源质疑；或辩论结果被用作 pass 门
  - **证据类型**：`evidence`
  验证：真实任务运行观察+裁决书结构检查；通过：方向级/影响验收争议出现在用户问题卡；实现级裁决书标注裁决者与幸存/被驳论点且经独立复核；无"辩论通过"判据；失败：方向级争议未达用户；或主 agent 单方裁决针对自身产物的异源质疑；或辩论结果被用作 pass 门；证据：`evidence`
- [ ] **AC-RES-001**：deep-research 契约可执行——R0-R5 各步有产物、停止条件与跳过论证可检查
  - **需求**：FR-RES-001
  - **验证方法**：技能文本审查+真实调研运行观察（本任务已实证）
  - **通过条件**：R0 缺口清单、R1 检索痕迹（读原文/重写）、R2 并行深读、R3 三角测量、R4 落盘、R5 独立复核全部可观察；跳过有论证
  - **失败条件**：任一步骤无痕迹；或无论证跳过调研
  - **证据类型**：`evidence`
  验证：技能文本审查+真实调研运行观察（本任务已实证）；通过：R0 缺口清单、R1 检索痕迹（读原文/重写）、R2 并行深读、R3 三角测量、R4 落盘、R5 独立复核全部可观察；跳过有论证；失败：任一步骤无痕迹；或无论证跳过调研；证据：`evidence`
- [ ] **AC-RES-002**：调研报告 content-addressed 落盘任务追踪目录且 decision-log 只引用 path+hash
  - **需求**：FR-RES-002
  - **验证方法**：落盘产物核查（命名与字节一致）+decision-log 引用形式检查
  - **通过条件**：报告结构符合 research-report.v1；命名=内容 hash；decision-log 无正文复制
  - **失败条件**：报告未落盘 task_dir；或命名与字节不一致；或正文被复制进 decision-log
  - **证据类型**：`evidence`
  验证：落盘产物核查（命名与字节一致）+decision-log 引用形式检查；通过：报告结构符合 research-report.v1；命名=内容 hash；decision-log 无正文复制；失败：报告未落盘 task_dir；或命名与字节不一致；或正文被复制进 decision-log；证据：`evidence`
- [ ] **AC-RES-003**：调研真实使用路由表内工具；纯 agent 无工具调研被识别为不合格；降级有记录
  - **需求**：FR-RES-003
  - **验证方法**：调研报告工具使用记录核查
  - **通过条件**：外部调研含 anysearch/web_fetch 痕迹；内部调研含检索/git 历史/子代理痕迹；无工具检索的调研结果被记录为不合格事实并显式降级记录，不阻断推进；工具缺失有降级记录
  - **失败条件**：纯凭记忆产出调研结论；或降级无记录
  - **证据类型**：`evidence`
  验证：调研报告工具使用记录核查；通过：外部调研含 anysearch/web_fetch 痕迹；内部调研含检索/git 历史/子代理痕迹；无工具检索的调研结果被记录为不合格事实并显式降级记录，不阻断推进；工具缺失有降级记录；失败：纯凭记忆产出调研结论；或降级无记录；证据：`evidence`
- [ ] **AC-RES-004**：阶段复盘输出含调研深度区块且不作 gate
  - **需求**：FR-RES-004
  - **验证方法**：复盘产物结构检查
  - **通过条件**：一手来源率/收敛率/未决项数/工具使用记录可见；缺省维度标注 not_applicable；无阻断行为
  - **失败条件**：维度缺失且无说明；或被用作推进门
  - **证据类型**：`evidence`
  验证：复盘产物结构检查；通过：一手来源率/收敛率/未决项数/工具使用记录可见；缺省维度标注 not_applicable；无阻断行为；失败：维度缺失且无说明；或被用作推进门；证据：`evidence`
- [ ] **AC-DLOG-001**：decision-log 含需求框架节且骨架驱动调研/talk/审查回填；既有机器强制边界不被破坏
  - **需求**：FR-DLOG-001
  - **验证方法**：结构校验（16 个 h2/覆盖矩阵/五维/R-NNN 索引全绿）+本任务试运行样本人工阅读
  - **通过条件**：骨架与任务类型匹配；决策挂节点；阅读者能从框架判断需求考虑是否清楚；机器校验全绿
  - **失败条件**：破坏任一机器强制项；或骨架与决策脱节
  - **证据类型**：`test`
  验证：结构校验（16 个 h2/覆盖矩阵/五维/R-NNN 索引全绿）+本任务试运行样本人工阅读；通过：骨架与任务类型匹配；决策挂节点；阅读者能从框架判断需求考虑是否清楚；机器校验全绿；失败：破坏任一机器强制项；或骨架与决策脱节；证据：`test`
- [ ] **AC-DLOG-002**：决定区按模块 h3 分组且跨模块引用可追溯
  - **需求**：FR-DLOG-002
  - **验证方法**：文档结构检查+人工阅读
  - **通过条件**：模块分组与骨架方案节点一致；模块内按链序；跨模块引用用 D-ID+derived_from
  - **失败条件**：决策平铺无模块语义；或引用无法回溯
  - **证据类型**：`manual`
  验证：文档结构检查+人工阅读；通过：模块分组与骨架方案节点一致；模块内按链序；跨模块引用用 D-ID+derived_from；失败：决策平铺无模块语义；或引用无法回溯；证据：`manual`
- [ ] **AC-DLOG-003**：链字段存在且轻量告警可观察、不阻断
  - **需求**：FR-DLOG-003
  - **验证方法**：检查运行观察（故意缺失/非法链字段用例）
  - **通过条件**：告警规则文件随技能交付并接入检查汇总；缺失/非法/引用不存在产生告警；告警不阻断、不升 schema、不进 gate；v1 schema 未变
  - **失败条件**：无告警输出（腐烂无感）；或告警升级为阻断/机器强制
  - **证据类型**：`test`
  验证：检查运行观察（故意缺失/非法链字段用例）；通过：告警规则文件随技能交付并接入检查汇总；缺失/非法/引用不存在产生告警；告警不阻断、不升 schema、不进 gate；v1 schema 未变；失败：无告警输出（腐烂无感）；或告警升级为阻断/机器强制；证据：`test`
- [ ] **AC-GOV-001**：契约演进无纸面合规——每项合同改动与测试断言成对且 AC-011 审计同步
  - **需求**：FR-GOV-001
  - **验证方法**：每 phase 验收时核对契约测试清单（合同文本↔断言↔审计三者一致）
  - **通过条件**：wh-review 合同重述红蓝语义、build-spec 合同写明单次+边界+专项；全部受影响契约测试转绿；AC-011 审计反映新契约语义
  - **失败条件**：合同文本与测试断言任一脱节；或 AC-011 审计未同步
  - **证据类型**：`test`
  验证：每 phase 验收时核对契约测试清单（合同文本↔断言↔审计三者一致）；通过：wh-review 合同重述红蓝语义、build-spec 合同写明单次+边界+专项；全部受影响契约测试转绿；AC-011 审计反映新契约语义；失败：合同文本与测试断言任一脱节；或 AC-011 审计未同步；证据：`test`
- [ ] **AC-GOV-002**：七条状态转移规则在真实失败/降级场景中各至少一次被正确执行且记录用户可见
  - **需求**：FR-GOV-002
  - **验证方法**：失败注入/真实运行观察+记录检查
  - **通过条件**：每条规则触发时产物/记录符合矩阵语义；退化事实用户可见；无伪装通过
  - **失败条件**：任一规则被违反（如蓝队失败被当正常完成、未决被静默、中止被推断）
  - **证据类型**：`evidence`
  验证：失败注入/真实运行观察+记录检查；通过：每条规则触发时产物/记录符合矩阵语义；退化事实用户可见；无伪装通过；失败：任一规则被违反（如蓝队失败被当正常完成、未决被静默、中止被推断）；证据：`evidence`
- [ ] **AC-GOV-003**：每 phase 完成标志（开发+契约/测试绿+用户验收+异源审查）齐全后方进入下一 phase
  - **需求**：FR-GOV-003
  - **验证方法**：phase 验收记录检查
  - **通过条件**：每 phase 有四类完成证据；phase 失败有 unavailable 记录且不阻断独立部分
  - **失败条件**：缺任一完成证据即推进；或 phase 概念变成运行时控制面
  - **证据类型**：`evidence`
  验证：phase 验收记录检查；通过：每 phase 有四类完成证据；phase 失败有 unavailable 记录且不阻断独立部分；失败：缺任一完成证据即推进；或 phase 概念变成运行时控制面；证据：`evidence`
- [ ] **AC-GOV-004**：AGENTS.md 含"只跑受影响针对性测试"硬规则且本任务后续验证无全量回归发生
  - **需求**：FR-GOV-004
  - **验证方法**：规则文本检查+验证记录审计
  - **通过条件**：硬规则成文（含例外=用户/CI 明确要求）；本任务后续全部验证为针对性测试
  - **失败条件**：规则缺失；或再次出现无授权全量回归
  - **证据类型**：`evidence`
  验证：规则文本检查+验证记录审计；通过：硬规则成文（含例外=用户/CI 明确要求）；本任务后续全部验证为针对性测试；失败：规则缺失；或再次出现无授权全量回归；证据：`evidence`
- [ ] **AC-GOV-005**：make-decision 技能文本含执行器矩阵与上下文守恒 6 规则，且实际运行符合（重活下沉、交互独占、落盘摘要、并行上限）
  - **需求**：FR-GOV-005
  - **验证方法**：技能文本审查+本任务运行方式对照（已实证）
  - **通过条件**：M/S/B/P 分工、6 规则、并行上限（研究4/debate4/红蓝2）、≤500 字结构化回传全部成文且运行一致
  - **失败条件**：交互被外包给子代理；或主会话回读全量长产物；或并行超上限
  - **证据类型**：`evidence`
  验证：技能文本审查+本任务运行方式对照（已实证）；通过：M/S/B/P 分工、6 规则、并行上限（研究4/debate4/红蓝2）、≤500 字结构化回传全部成文且运行一致；失败：交互被外包给子代理；或主会话回读全量长产物；或并行超上限；证据：`evidence`
- [ ] **AC-GOV-006**：非目标与延期登记在 spec 与 decision-log 中一致可见；新控制面有 owner/consumer/删除条件登记
  - **需求**：FR-GOV-006
  - **验证方法**：文档核查
  - **通过条件**：第 10 节与 decision-log 非目标/延期一致；问答工具与风险接收通道登记齐全
  - **失败条件**：出现第二份非目标清单；或新控制面无治理登记
  - **证据类型**：`manual`

> 验收停留在产品层；精确命令和工程 oracle 留给 plan/tasks。三重验证（本任务 dogfood+每 phase 独立验收+下任务用户提示次数=0）为上述 AC 的总体观察框架，其中"下任务实证"属 verify 层外部观察，不在本规格 AC 内重复。
  验证：文档核查；通过：第 10 节与 decision-log 非目标/延期一致；问答工具与风险接收通道登记齐全；失败：出现第二份非目标清单；或新控制面无治理登记；证据：`manual`

## 12. 风险、未决与交接

- **RISK-01**（原 RISK-001）：红蓝两次组请求成本约 2×，长审查可能逼近既有客户端超时窗变 unavailable
  - **受影响 ID**：FR-REV-001、FR-REV-002；AC-REV-001、AC-REV-002；PFACT-01
  - **触发条件**：审查材料大或 provider 响应慢
  - **后果**：review fact 记 unavailable/partial，蓝队失败概率实证高于红队（本任务运行 4/5 失败）
  - **缓解或 STOP**：如实记录可重试；蓝队编成与超时预算在实施期按实证调整；不延长超时窗
  - **处理 Stage**：`build-code`
  - **验证**：真实运行中超时事件均有 unavailable/partial 记录且可重试
- **RISK-02**（原 RISK-002）：material_id 算法不一致曾致严格冻结路径 MATERIAL_INCOMPLETE——已转为修复决策（FR-REV-006）
  - **受影响 ID**：FR-REV-006；AC-REV-006；PFACT-10
  - **触发条件**：修复未完成或回归缺失
  - **后果**：真实往返报 MATERIAL_INCOMPLETE，审查不可用
  - **缓解或 STOP**：AC-REV-006 通过即关闭；未通过 STOP
  - **处理 Stage**：`build-code`
  - **验证**：回归测试（含真实 broker 往返场景）绿
- **RISK-03**（原 RISK-003）：契约演进改动面大（合同+多处测试+AC-011），遗漏一处即"纸面合规"
  - **受影响 ID**：FR-GOV-001；AC-GOV-001
  - **触发条件**：合同文本与测试断言更新不同步
  - **后果**：文义合规但行为未变，验收失真
  - **缓解或 STOP**：每 phase 验收含契约测试清单核对（语法与测试成对）
  - **处理 Stage**：`build-code`
  - **验证**：AC-GOV-001 核对记录
- **RISK-04**（原 RISK-004）：文本层链字段仍可能腐烂（告警不阻断）
  - **受影响 ID**：FR-DLOG-003；AC-DLOG-003
  - **触发条件**：告警被忽略、链字段长期不维护
  - **后果**：决策链结构退化，阅读者无法追溯
  - **缓解或 STOP**：轻量告警+阶段复盘维度暴露；告警失效则触发 X-003（v2 机器校验）评估
  - **处理 Stage**：`build-code`
  - **验证**：复盘产物中结构维度可见；告警输出存在
- **RISK-05**（原 RISK-005）：debate 在 Codex/Multica 宿主只能降级运行，角色独立性打折
  - **受影响 ID**：FR-DEB-001；AC-DEB-001；PFACT-06、PFACT-17
  - **触发条件**：非 DSH 宿主无共享文件系统或消息能力
  - **后果**：辩论防偏强度下降，裁决可信度打折
  - **缓解或 STOP**：降级路径（父代理串行转发）如实记录；DSH 优先
  - **处理 Stage**：`build-code`
  - **验证**：降级运行有记录且产物结构完整
- **RISK-06**（原 X-001，延期）：跨 provider 第二轮交叉质询
  - **受影响 ID**：FR-REV-001~003
  - **触发条件**：红蓝+debate 实证后深度仍显不足
  - **后果**：若触发需改 broker 多 phase 协议+约 2× 成本
  - **缓解或 STOP**：触发条件不满足不启动；启动需回 make-decision 评估
  - **处理 Stage**：`make-decision`
  - **验证**：三重验证后深度评估记录
- **RISK-07**（原 X-002，延期）：build-plan/build-code/verify-code 同构改造
  - **受影响 ID**：FR-GOV-006
  - **触发条件**：本机制在真实任务跑稳后出现真实消费需求
  - **后果**：触发后改动面大
  - **缓解或 STOP**：见第 10 节非目标第 1 条；不预设启动
  - **处理 Stage**：`make-decision`
  - **验证**：后续任务复盘记录
- **RISK-08**（原 X-003，延期）：decision-entry.v2 机器校验
  - **受影响 ID**：FR-DLOG-003
  - **触发条件**：出现链字段真实机器消费者（如 RISK-04 告警失效）
  - **后果**：schema 演进改动面大
  - **缓解或 STOP**：文本层+轻量告警先行；触发后回 make-decision
  - **处理 Stage**：`make-decision`
  - **验证**：RISK-04 监控结果
- **RISK-09**（原 X-004，取消）：本任务内额外真实样例任务——已取消，被三重验证替代
  - **受影响 ID**：验收节三重验证框架
  - **触发条件**：不再触发（取消项）
  - **后果**：无
  - **缓解或 STOP**：维持取消；任何重提需用户拍板
  - **处理 Stage**：`verify-code`
  - **验证**：三重验证清单核对

- **OPEN-01**（原 OPEN-004）：grok/pi 两 provider 在蓝队/多 provider 组持续身份无效（疑似工作区路径编码差异或适配器工具回显未被净化覆盖）
  - **受影响 ID**：FR-REV-007；AC-REV-007；PFACT-13
  - **owner**：操作者（build-code 阶段实施）
  - **影响**：蓝队以 3/5 完成集作结论并如实标注 blue_incomplete；非阻塞
  - **处理 Stage**：`build-code`
  - **关闭条件或 STOP**：条件性义务——后续审查若同 provider 失败再现，实施适配器层路径掩码或禁用工具回显（成本≤1 phase）后关闭；不重开已修复项（F-020）；若失败不再现，本任务结束时可挂起保留
- **OPEN-02**（原 OPEN-005）：build-spec 编码细节定稿清单——已按 spec-clarify 处置记录（trigger=false）在本规格定稿
  - **受影响 ID**：FR-REV-003、FR-TALK-003、FR-TALK-004、FR-DEB-001、FR-DLOG-003、FR-GOV-005
  - **owner**：build-spec 阶段（本规格）
  - **影响**：不定稿则 FR 无可执行契约
  - **处理 Stage**：`build-spec`
  - **关闭条件或 STOP**：已定稿——mailbox=任务共享目录单消息单文件 JSON（from/to/round/seq/body 或 body_ref/ts，长正文 body_ref 落盘）；pair_id/role 进请求与结果元数据且同 pair 同 material；accepted_risk 不新增公共行为、接既有 confirm 语义扩展并登记 owner/consumer/删除条件；蓝队重试=根因排查后同编成重试 1 次、材料变更需新 pair；聚合=findings 并集+provider×角色标注+争议标注；摘要模板=子代理回传强制结构化（研究/草稿/汇总类≤500 字；复核类按条目一行一条 finding、不压扁逐条结论）；轻量告警规则文件随决策记录技能交付并接既有检查汇总（不阻断/不升 schema/不进 gate）；需求框架 preset=2 类起步；对话生命周期=复用 spec-clarify 既有 stage outcome 侧校验与交互 receipt、aggregate 不升 v2。本规格发布即关闭，遗留实现误差由 build-plan 反馈

## 13. 业务影响与回归范围

### make-decision 阶段流程

- **既有行为**：direction/detail 各单次组请求审查；Talk3 与审查发现仅文本级关联；detail 后直接 approve；调研无完成契约
- **本需求影响**：两审查面变红蓝两次组请求；Talk3 强绑定争议清单；新增 Talk4；调研走 R0-R5 并落盘；decision-log 结构化；主会话按调度器模型运行
- **回归路径**：完整五阶段推进（SCN-001）；蓝队失败降级（SCN-002/003）；用户中止（SCN-004）；debate 未决（SCN-005）
- **验收**：AC-REV-001/002/003、AC-TALK-001/002、AC-RES-001/002、AC-GOV-002、AC-GOV-005

### build-spec 阶段流程

- **既有行为**：单次审查、无用户对话、技能闭包锁死 Talk 类交互
- **本需求影响**：审查指令强化+验收专项；争议 findings 经 spec-clarify 承载的处置对话送达用户并写回
- **回归路径**：争议对话闭环（SCN-009）；grill 独占边界保持
- **验收**：AC-REV-004、AC-TALK-003、AC-TALK-004

### 审查与交互数据契约

- **既有行为**：单请求 review fact；aggregate 固定轮数校验；accepted_risk 无公共通道；材料身份算法不一致
- **本需求影响**：红蓝 pair 语义与降级标注；aggregate 动态轮数（按实际轮数校验，无争议可为 3，有争议时≥4）；accepted_risk 公共通道（confirm 语义扩展）；材料身份算法统一
- **回归路径**：确认 receipt 与 aggregate 重建流程（SCN-008 材料漂移）；风险接收流程（SCN-007）
- **验收**：AC-REV-003、AC-REV-006、AC-TALK-002、AC-TALK-004、AC-GOV-001

### debate 与调研能力

- **既有行为**：debate 技能不可用（零调用方、teammate 依赖）；spec-research 被动应答
- **本需求影响**：debate v2 跨宿主可运行；deep-research 契约化调研；spec-research 保留分工
- **回归路径**：debate 跨宿主运行与降级（SCN-010）；调研全流程（SCN-001）
- **验收**：AC-DEB-001/002/003、AC-RES-001/002/003/004

- **可能受冲击的业务规则**：single_round 语义按"一个逻辑 fact=红蓝两次组请求"重述（仅 make-decision 两面）；机器强制边界（16 个 h2/覆盖矩阵/五维/R-NNN 索引/entry schema）不得破坏；review/debate 不得成为 pass 门；质量裁决不得自审自判；reports immutable；技能改造须同步 bundle/catalog/inventory 登记
- **明确无影响**：build-plan/build-code/verify-code 的审查与对话流程；任何页面/前端（non_ui）；decision-entry.v1 schema 及其机器消费者；interaction aggregate v1 读取方；旧 task 记录与历史材料（只读保留）；broker 多 phase 协议
