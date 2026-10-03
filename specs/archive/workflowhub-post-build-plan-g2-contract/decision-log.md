# WorkflowHub post build-plan G-2 合同修复：决策日志草稿

> 本文仅是独立任务的首次需求框架与 OI scaffold，尚未完成 make-decision。唯一当前方向/OI 材料为本文；不复制旧 CARD01 报告为权威，不生成研究、交互、审查或确认事实。授权启动独立工作与选择任务类型，不等于接受任何修复方案、替代证据或验收细节。

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 任务身份、原始需求与来源 | 两条真实选择及转交边界 | 进入本任务或核对原话时 |
| 三级追溯链、唯一 OI 大纲 | functional 六节点、六类别与八个开放问题 | 后续 bounded research、方向审查与 Talk 前 |
| 五维需求覆盖矩阵 | 原始来源与缺口逐维绑定 | 检查是否遗漏方向或伪造确认时 |
| 决定、质量边界与未决项 | 仅授权/类型已获得选择，修复方向待定 | 任何下游消费或推进前 |

## 任务身份

- **任务类型**：普通任务

任务 ID：`workflowhub-post-build-plan-g2-contract`。独立工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract`；分支 `task/workflowhub/workflowhub-post-build-plan-g2-contract`；初始 HEAD `7619db8e1601b620c695faf2f3c889fb5518f569`。作者实际核验工作树初始干净。

主会话转交本任务已登记为 post / existing / per_invocation；作者未读取官方登记或发布 runtime 事实，不将转交当作自己的登记执行凭证。预期既有顺序为 make-decision → build-plan → build-code → verify-code；本稿不创建 build-spec，也不跳阶段。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 用户授权独立 WorkflowHub G-2 修复任务 | U-001 / V-001，真实工具回复 m01486，由主消息 m00980 转交 | D-001；仅启动授权，不确认方案 |
| R-002 | 用户选择普通任务 | U-002 / V-002，真实工具回复 m01546，由主消息 m01029 转交 | D-002；任务类型已填写 |
| R-003 | 历史诊断揭示规范允许 G-2 与 post 机器合同冲突 | S-001；作者实际读完 117 行并核 SHA | D-003；事实入口，方向仍待研究 |

## 需求变更记录

### U-001 — 独立修复授权

> 授权独立修复 WorkflowHub G-2（推荐）

- 来源：主会话真实工具回复 m01486；问题 m01485；本作者通过主消息 m00980 获得精确 selected 文本，未直接读取主会话原工具对象。
- 变更与处置：授权独立任务。选项中的“推荐”仅为标签，不是接受诊断建议 A、文件写集或未来方案。D-001 仅记录启动；具体范围为主披露的暂定边界，仍需 OI 收敛。

### U-002 — 任务类型

> 普通任务（推荐）

- 来源：主会话真实工具回复 m01546；问题 m01545；本作者通过主消息 m01029 获得精确 selected 文本。主问题说明按标准流程逐步确定方向、范围与验收，非跳 stage；该说明不是用户逐字引文。
- 变更与处置：D-002 仅把受控类型确定为普通任务，不解释成用户接受未来修复细节。

## 原始需求索引

| R 编号 | U/V 原文锚点 | 决策 | 落点 |
| --- | --- | --- | --- |
| R-001 | U-001、V-001 | D-001 | 独立任务启动授权；OI-001、OI-003、OI-008 继续澄清范围和结果 |
| R-002 | U-002、V-002 | D-002 | 唯一任务类型声明；维持普通任务粒度 |
| R-003 | S-001 历史诊断，非新增用户原话 | D-003 | OI-001 至 OI-008 的内部事实入口；不是用户方案选择 |

## 逐字声明层（verbatim）

| V 编号 | 说话人 | 上下文/来源 | 逐字文本 |
| --- | --- | --- | --- |
| V-001 | 用户 | 主工具回复 m01486，主消息 m00980 转交的 selected 选项 | 授权独立修复 WorkflowHub G-2（推荐） |
| V-002 | 用户 | 主工具回复 m01546，主消息 m01029 转交的 selected 选项 | 普通任务（推荐） |

U 与 V 分别为同一原话的精确别名，不计作四条独立需求。除此之外未获得用户逐字痛点、修复选项、替代检查内容或最终验收选择；不从助手解释重构第三条原话。

## 原始声明层

| source_id | 类型/实际消费 | 可回读来源与身份 | 用途与限制 |
| --- | --- | --- | --- |
| S-001 | 历史诊断；作者完整实读 1–117 行、SHA MATCH | [旧 G-2 诊断](</Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-v3-card-01-multi-instrument-parameter-base/specs/paperbuilder-v3-card-01-multi-instrument-parameter-base/recon/build-plan-g2-resolution-options.md>)；SHA256 `d6c59145865bf621b9dc04c4655910a2ff44f5392c8cf4ae48340fd3d76d68d2` | 报告 §1/§2 为历史失败与规范冲突归因，§3 为未授权时提出的建议；未直接消费其链接的 execute JSON 或当前 validator task loop，不伪称新任务复现 |
| S-002 | 本树规则与当前技能；作者实际读取 | [AGENTS](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/AGENTS.md>)、[宪法](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/CONSTITUTION.md>)、[宪法清单](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/constitution-checklist.md>)、[make-decision](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/workflows/make-decision/SKILL.md>)及其 deps、[decision-log](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/skills/decision-log/SKILL.md>)与模板 | 使用既有需求框架/来源普查/单 OI 权威，不执行依赖技能或宣称其步骤完成 |
| S-003 | 当前 reader；作者实际读相应段落 | [task type reader:3305–3342](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/runtime/stage/stage-content-contracts.mjs#L3305-L3342>)、[原始来源 census:6090–6239](</Users/Hugh/Hugh/Project/workflowhub-workflowhub-post-build-plan-g2-contract/runtime/stage/stage-content-contracts.mjs#L6090-L6239>)、OI YAML reader 与 questions-only 投影 3387–3437 | 只核文档可解析性，不证明 G-2 修复或阶段通过 |
| M-001 | 主指令/暂定边界，非用户逐字 | 主消息 m00980、m01029、m01050、m01057 | 本次仅写 scaffold；冻结 PaperBuilder/旧事实/base；后续研究先消费当前 OI；边界在 OI 中待确认 |

S-001 的精确历史错误为 `build-plan minimum executable contract failed: phases/P2.md T005 expected_exit must distinguish RED target failure from GREEN 0`。报告引述旧 post task loop 无条件要求 RED 非零/GREEN 0，并指出确认不能跳过最低合同。它同时披露其它 RED 认证与 routing 缺口；本任务不能因此宣称修 G-2 就能让 CARD01 全绿。新树现况、可合法接缝和最小写集尚待独立实证。

## 三级追溯链

### 需求框架

- **framework（框架）**：`functional`。
- **选择理由**：独立工作针对既有工作流合同一致性；外层用背景→问题→目标→方案→验收→扩展，以免用诊断结果冒充用户裁决。研究只回填问题、方案和验收节点，不另立需求账本。
- **回填规则**：当前为 `r0-scaffold`；研究、Talk、Grill 和 review 只回填既有 OI。方向变化需新版本并保留历史，不改写真实原话。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-background | 背景 | open | pending | 主代理/独立研究者 | 核定旧失败归因与新树适用性 |
| N-problem | 问题 | open | pending | 独立研究者 | 实读新树 post 合同与规范后 |
| N-goal | 目标 | open | pending | 主代理/用户 | 明确本任务成功结果与不承诺项 |
| N-solution | 方案 | open | pending | 独立研究者/用户 | 最小可行方向及后果供真实 Talk |
| N-acceptance | 验收 | open | pending | 独立研究者/用户 | 区分结构接纳、证据完成与阶段成功 |
| N-extension | 扩展 | open | pending | 主代理/用户 | 核定延期与明确不改对象 |

### 唯一 OI 大纲（current authority）

task_id：`workflowhub-post-build-plan-g2-contract`；outline_version：`r0-scaffold`。下方一组 YAML 为唯一可解析 OI 记录；导航和覆盖表只引用 ID，不构成第二份 OI。

#### 框架节点

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001 | false | 旧报告不等于新树现况 |
| N-problem | problem | OI-001、OI-004 | false | 合同冲突与声明漏洞需分别核实 |
| N-goal | goal | OI-003 | false | 用户只授权独立修复，成功结果细节未答 |
| N-solution | solution | OI-004、OI-005 | false | 声明方式、消费路径和最小改动待研究 |
| N-acceptance | acceptance | OI-006、OI-007 | false | 正负控制、真实证据与不可放松边界待核 |
| N-extension | extension | OI-002、OI-008 | false | UI 适用性、非目标与延期尚需事实和确认 |

#### 固定类别

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-001、OI-003、OI-005 | false | 从作者声明到现有 reader/execute 的真实消费者链待核 |
| page_scope | OI-002 | false | 三输入 UI 判断未完成，不能凭 CLI 名称写 non_ui |
| data_state | OI-007 | false | 新结果与历史事实边界需明确 |
| success_failure_boundary | OI-004、OI-006 | false | 合法例外、滥用拒绝和行为 RED 要求需区别 |
| non_goals | OI-008 | false | 主暂定排除项不能冒充用户最终范围 |
| deferred | OI-008 | false | 其它缺口是否明确留在原任务待确认 |

#### OI 记录与消费者

```yaml
ois:
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-001
    category: complete_user_flow
    source: R-001 / S-001
    question: 旧报告的 G-2 拒绝在新树哪些真实作者与消费者环节仍成立，哪些只属于旧任务历史？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-002
    category: page_scope
    source: R-001 / M-001
    question: 原始需求、当前 frontend_scope 与发现证据三输入是否确立本任务不涉及 UI，若缺输入该如何保留未知？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-003
    category: complete_user_flow
    source: R-001 / S-001
    question: 独立修复要让谁获得什么可观察结果，结构接受与阶段完成的区别应如何向用户说明？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-004
    category: success_failure_boundary
    source: R-001 / S-001
    question: 如何识别真正无新增运行行为的 G-2 与混合或行为任务，避免裸字样或占位文本绕过验证？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-005
    category: complete_user_flow
    source: R-001 / S-001 / S-002
    question: 既有规范、模板、post reader 与 handler 的最小一致化方向有哪些真实取舍，最小修改边界是什么？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-006
    category: success_failure_boundary
    source: R-001 / S-001
    question: 哪些真实正负场景足以验收合法 G-2、缺证据、行为 RED 和混合任务而不制造仪式失败？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-007
    category: data_state
    source: R-001 / S-001 / M-001
    question: 如何保证新结构结论不生成或改写旧失败、review、confirmation、历史事实及未完成证据？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
  - task_id: workflowhub-post-build-plan-g2-contract
    outline_version: r0-scaffold
    oi_id: OI-008
    category: non_goals
    source: R-001 / S-001 / M-001
    question: 哪些对象明确不改，哪些独立缺口留在原任务或延期，扩展到新命令或持久对象是否有必要和授权？
    status: open
    evidence_status: pending
    evidence_owner: 独立研究者/主代理
    next_review_trigger: 本稿 ready 后单次 bounded 实证回填，主代理按真实问题交互
```

所有 OI 尚未处置，不填 selected_disposition、visible_group_id、confirmation ref 或终态字段。需要用户决定的方向由主代理在研究后用真实 Talk 呈现；内部事实可按来源回填，不能把内部建议升级为 confirmed。

## 五维需求覆盖矩阵

| 维度 | 来源/目前已知 | 当前落点 | 缺口与处置 | owner/下一触发 |
| --- | --- | --- | --- | --- |
| business goal | R-001 授权独立修复；R-002 普通任务 | D-001、D-002；N-goal/OI-003 | 修复成功结果未得到用户明确选择，open | 主代理在实证后询问目标 |
| flow/surface | S-001 描述作者→post 合同→execute；M-001 暂定 CLI/runtime 非 UI | N-background/N-solution；OI-001、OI-002、OI-005 | 新树消费者链与三输入 UI 分类未核，pending | 独立研究者先 actualread |
| data/state | S-001 保留失败与证据绑定限制；M-001 冻结旧事实 | N-solution；OI-007 | 哪些旧事实绝不迁移、何时允许新检查仍待核，open | 研究核存量事实边界，主确认范围 |
| success/failure/acceptance | S-001 §3 为候选验收而非用户答案 | N-problem/N-acceptance；OI-004、OI-006 | 合法例外、滥用拒绝、结构通过不等于阶段成功，细节未确认 | 实读测试接缝后供主 Talk |
| constraints/non-goals/deferrals | M-001 暂定不改 CARD01/旧事实/base、不扩命令/存储；S-001 其它缺口 | N-extension；OI-008 | 排除项与延期尚无最终用户收敛，open | 主代理明确后果并取得真实处置 |

矩阵仅证明五维问题已显式收录，不证明五维已解决。两条独立用户来源均有 R/D 落点；报告建议与主假设独立归因，不增加原始用户需求分母。

## 发散候选与可证伪大纲

当前没有已完成研究报告或用户逐字痛点；不生成候选 A 的“已选择”记录，也不编造两条 user_verbatim intake。后续若事实显示需要发散，在本框架方案节点回填真实角度、来源和可证伪假设。此节 pending，不宣称满足发散完成合同。

## 目标

暂定目标是消除合法纯文档 G-2 作者契约与 post 机器验证的冲突，同时保留真实行为验证强度。此为 S-001/M-001 的工作假设，非用户已接受的完整目标。OI-003 保留最终目标收敛。

## 成功/失败边界

- 暂定成功边界：合法 G-2 能准确表达并被既有消费者识别，不能伪造 RED/GREEN 或把 optional evidence 缺失说成完成；OI-004、OI-006 待研究与用户确认。
- 暂定失败边界：仅碰到 G-2 字样就跳过最低合同、放松真实行为 RED、改写旧事实或声称 CARD01 全阶段通过。当前没有新测试、验证或阶段成功证据。

## 范围与非目标

当前直接授权写集仅为本文 scaffold。未来修复范围以 OI-005、OI-008 的真实处置为准；报告建议的 runtime/模板/tests 不是当前实现授权。

主披露的暂定排除项：PaperBuilder production、frontend、spec/Phase、task/facts、旧失败/review/confirmation 原件；旧 cohort 迁移、provider 调度与其它认证缺口；新增公共选项或持久对象。它们是 M-001 约束/待确认边界，不拼接为用户原话。

## 决定

### 启动与身份模块

#### D-001 — 独立任务启动授权记录

- **source**：R-001 / U-001 / V-001；主转交 m01486 selected，见 m00980。
- **decision**：用户已选择授权独立 WorkflowHub G-2 修复任务；只记录启动授权，不确认修复机制。
- **rationale**：将独立 WorkflowHub 问题与 CARD01 原事实分离；具体范围与取舍仍在 OI 中。
- **consequence**：允许建立本草稿；不等于 implementation、部署、候选 A 或最终验收授权。
- **supersedes**：N/A；本任务初始记录。
- **approval_binding**：真实工具回复 m01486 的主转交；尚无本任务 canonical approve-decision fact。
- **owner/next_action**：主代理在研究后呈现方向与范围。
- module: intake
- requirement_ids: [R-001]
- derived_from: []
- artifacts: [本文原始需求、OI-001 至 OI-008]

#### D-002 — 任务类型选择记录

- **source**：R-002 / U-002 / V-002；主转交 m01546 selected，见 m01029。
- **decision**：受控任务类型为普通任务；本文只出现一条身份声明。
- **rationale**：按真实选择记录，非根据路径、cohort 或旧任务推断。
- **consequence**：保留普通任务提问粒度，不跳阶段，不接受未来方案。
- **supersedes**：N/A；此前草稿尚未落盘，不存在旧类型材料消费。
- **approval_binding**：真实工具回复 m01546 的主转交；不充当最终方向确认。
- **owner/next_action**：作者回读 existing task type reader；主代理继续需求收敛。
- module: intake
- requirement_ids: [R-002]
- derived_from: [D-001]
- artifacts: [本文任务身份]

### 合同一致化模块

#### D-003 — 待裁决入口（不是终态 ADR）

R-003 → S-001 历史诊断 → OI-001/OI-004/OI-005/OI-006/OI-007/OI-008 → 未来方向决定。status: open；evidence_status: pending；evidence_owner: 独立研究者/主代理；next_review_trigger: 新树实证与真实 Talk 后。module: contract-alignment；requirement_ids: [R-001, R-003]；derived_from: [D-001]；artifacts: [本文 OI]。无已选修复选项、无终态结论、无 approval_binding，不消费为 build-plan confirmed binding。

## UI applicability

尚未形成三输入结论，不填写伪 fact JSON。`raw_requirement` 目前只有独立修复授权；`frontend_scope` 未 actualread 对本任务适用的当前范围材料；`discovered_ui_changes_or_evidence` 未完成本任务针对性调查。CLI/runtime 暂定边界不能单独证明 non_ui。OI-002 保留缺口，后续由既有三输入规则计算，不新增 stage。

## 收敛检查

| 项 | 真实答案/当前事实 | 来源与剩余问题 |
| --- | --- | --- |
| target | 用户只授权独立修复，结果细节未答 | U-001 / OI-003；不写“无新需求”冒充收敛 |
| scope | 主暂定分离旧卡与事实，用户尚未确认完整范围 | M-001 / OI-005、OI-008 |
| solution | 未选修复机制；取舍/拒绝方案/处置尚未发生 | S-001 只是诊断建议 / OI-004、OI-005 |
| acceptance | 场景、数据源、通过与失败条件尚需实证和用户收敛 | S-001 §3 为候选 / OI-006、OI-007 |

## 动态 Talk 批次

尚无本任务方向/范围/验收 Talk 批次。两条真实 intake 选择已保留 U/V/R，不伪造 batch、选项处置或 host confirmation。

## 调研重点

后续仅按当前 OI bounded 内部研究新树规范、post 合同、真实消费者、最小测试接缝与事实边界；先消费本文再回填。当前仅 S-001 历史输入实读，不宣称已有 research-report.v1、研究候选交付或研究完成。

## Grill、审查处置与最终确认

本任务尚无 Grill、方向/细节 review、acceptance、最终 approve-decision、reflection 或 handoff 事实。主曾转交另一只读作者核验 validator SHA 的信息，本作者未读其产物，不登记为实际消费或本稿审查。

最终确认状态：pending。启动与类型两条选择不是最终方向确认；全部 OI 仍 open，未记录被用户拒绝的修复方案。

## 风险与延期交接

| risk/deferred_id | 风险或待定内容 | 触发/后果 | owner/下一步 |
| --- | --- | --- | --- |
| RISK-001 | 将旧失败/旧建议当新树事实或用户选择 | 可能放松真实合同或伪造已确认方向 | 独立研究者核新树；主呈现真实选项 |
| RISK-002 | 结构接受被误称阶段全绿 | 其它 missing/unavailable 被隐藏 | OI-006、OI-007 保留质量边界 |
| RISK-003 | 修改 scope 扩到旧任务事实或新控制面 | 破坏不可变历史或扩大授权 | OI-008 在用户收敛前保持 open |

### 质量边界

- 质量事实：当前只有实际读源与草稿，尚无目标 RED/GREEN 或正式执行结果。
- 推进资格：scaffold 可交独立 bounded research；不代表 make-decision 完成或 build-plan 可消费已确认方向。
- 完成判据：等待新树事实、真实 Talk/Grill/review/确认按既有顺序产生；不手写替代 receipt。
- 不可逆授权边界：不写 production/test/runtime/taskstore/facts/base，不修改 CARD01 或其冻结材料，不 commit/push/部署。

## 未决项

唯一未决项列表即上方 OI-001 至 OI-008；本节不另建 OPEN 账本。五维均有引用，所有方向/验收问题仍 open；先研究，后主交互。

## 退役登记（retirement）

| 日期 | 哪张 | 为什么退役 | 谁决定 | 原来的需求编号 |
| --- | --- | --- | --- | --- |
| 尚无退役日期 | 本卡无退役对象 | 未发生取消或永久退出决定 | 尚无退役决定人 | 不适用：无对象 |

## 文档结果与退出边界

仅创建本文。CONTEXT/独立 ADR/spec/Phase 未变；没有新确认 ADR 或被替代记录。源普查与类型 reader 的真实输出由作者回报主会话，不复制为新 ledger 或镜像报告。当前退出是暂停等待 bounded research，不是 make-decision 阶段退出。

大白话卡片：用户授权把 WorkflowHub G-2 问题独立处理，并选择普通任务；旧报告说明合法纯文档与机器 RED/GREEN 要求冲突，但本任务怎么修、改哪些、如何验收仍待事实与真实选择。本文把这些缺口放在唯一 OI 中，没有替用户作决定。

## 当前 mini-task 决定（覆盖以上历史推进要求，不改历史）

R-MINI-001：主消息 m01084 转交用户 m01721 的新请求（转述，非逐字引文）：G-2 小改使用 mini-task 尽快完成，不走完整 WorkflowHub 流程。主 m01109/m01138 明确本次唯一材料为 decision-log/spec/plan/tasks 四份 mini 材料，不与普通 post phases 并存；旧 OI 保留为历史，不要求逐项终态或未来 make-decision/Talk/Grill/R5 才推进。沿用本独立 task/tree/branch，不更改 task 登记或创建新任务。

D-MINI-001：单一可观察结果是既有 post validator 接纳有完整理由、风险、客观替代和验收披露的窄纯文档 G-2，仍拒绝行为/混合任务借此绕过真实 RED/GREEN。主 m01153 要求兼容已有自然中文字段形状，不新增必填 verification_role 等字段；owned 写集全为 .md，读集代码锚点不算写集。此为本次工作方向，不是 canonical confirmation、design review 或测试通过事实。本次修复自身改变 validator 行为，仍应做真实目标 RED/GREEN，不能自免。

风险：字段句法和 .md 后缀不能证明语义无运行行为，须独立审查实际范围；结构接纳不能证明替代证据已执行或历史/阶段质量通过。仅改 validator、Phase 模板和两个目标测试；默认不改 handler。无 UI/API/schema/公共选项/迁移，旧 CARD01 与旧 facts 不变；commit/push/merge/deploy/cleanup 未授权。独立 mini design → 实现/聚焦测试/真实结果 → mini implementation review，后续授权交付，不制造完整 make-decision 证据依赖。

研究引用（不镜像）：[506 有限研究](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-post-build-plan-g2-contract/quality/evidence/research/67a3a9a55d437fdb415e85bec90b7690d31471fb0a74a9318c1dce2e03d952da.json>)，SHA256 `67a3a9a55d437fdb415e85bec90b7690d31471fb0a74a9318c1dce2e03d952da`；作者仅消费摘要、关键证据和限制，不称全文或其引用源全部消费。既有 runner 的 raw_requirement 只抽首个原始需求节；审查必须同时读完整 decision_log 本节与 spec 当前来源，不能把旧普通流程当当前 mini 方向。主 m01179 对原 design 的三项发现处置为 fixed-required；原结果指针 [public](</tmp/3rd-review/cbc3acc6-69e1-497c-9eb9-8ec0b5be4225/managed/public.json>)，SHA256 `bcc68de30e56d895ec79da5ca98afaa734f0b02e802240220da4eaaf79bdfbcf`（作者已实读/解析核 SHA）。本次只补材料中的正负控、字符串缺项诊断和既有字段确定性识别；三项待真实实现与实现审查复核，不宣称代码修复完成，不重派 design、不复制 provider 输出。
