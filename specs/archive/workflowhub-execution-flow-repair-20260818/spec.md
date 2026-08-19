# 功能规格：WorkflowHub 五阶段执行链与异源审查可靠性修复

> 基于已接受的 decision-log。本文件只写产品问题、行为、边界和验收，不写文件路径、代码符号或工程命令。

- **功能名**：WorkflowHub 执行链可靠性修复
- **来源**：decision-log.md 中的 R-001 至 R-007、D-001 至 D-012、G-017、G-018
- **状态**：草稿

## 速读卡（30 秒）

- **一句话需求**：让 WorkflowHub 从原始需求开始按五阶段顺序工作，真实和用户成组交互，按当前配置完成一轮异源审查，并为每个实现 Phase 留下可核验的环境、测试和最终证据。
- **核心改动点**：
  - 固定 make-decision、build-spec、build-plan、build-code、verify-code 的交接顺序；Talk、Grill、Clarify 都必须成组提问、真实等待、按回复继续。
  - 非 build-code 的每个审查面只发起一个按配置派发的 provider group；先等所有已派发 provider 进入明确终态，再按配置阈值判断是否具备下游交接条件。
  - 取消 provider 固定总审查时限；健康会话继续等待，只有明确 busy 且连续 15 分钟没有可验证进展时才收尾为 unavailable，并保留取消和诊断证据。
  - build-plan 必须让每个 Phase 有设计任务、环境前置、测试策略、最终证据和 tasks.md 完成记录；缺任何一项只能保持 incomplete。
- **最大影响面**：现有调用方可见的交互卡、阶段交接、审查结果展示、provider 失败展示和任务证据链。
- **验收信号**：用户看到成组问题和真实等待；每个审查面没有隐式第二轮；provider 失败不会被改写成通过；健康会话不会被固定时限误杀；每个 Phase 的完成记录都能回指真实环境、测试和证据。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001 | D-001、D-006 | FR-SEQ-001、FR-HAND-016 / AC-SEQ-001、AC-HAND-017 | current / stage order | build-plan must preserve the order |
| R-002 | D-002、D-007 | FR-INT-002 / AC-INT-001、AC-INT-002 | current / Talk and Grill cards | no unanswered card may advance |
| R-003 | D-003、D-011 | FR-INT-003、FR-HAND-016 / AC-INT-003、AC-INT-004 | current / Grill and Clarify lifecycle | direction change returns to make-decision |
| R-004 | D-004、D-005、D-008 | FR-REV-004、FR-REV-006、FR-REV-009、FR-REV-010、FR-REV-011、FR-REV-012 / AC-REV-004、AC-REV-006、AC-REV-010、AC-REV-011、AC-REV-012、AC-REV-013 | current / configured multi-provider review | build-code keeps the declared review budget |
| R-005 | D-005、G-007、G-008 | FR-PLAN-010、FR-PLAN-011 / AC-PLAN-011、AC-PLAN-012 | current / phase design and evidence | build-plan owns the concrete cards |
| R-006 | D-003、D-006 | FR-SEQ-001、FR-QUALITY-012、FR-HAND-016 / AC-SEQ-001、AC-QUALITY-013、AC-HAND-017 | current / constitution and stage quality | no stage skipping or false completion |
| R-007 | D-007、D-012 | FR-INT-002、FR-REV-004 / AC-INT-001、AC-REV-004 | current / plain-language user communication | exact copy remains an implementation concern |
| D-001、D-003、D-004 | D-001、D-003、D-004 | FR-SCOPE-013、FR-QUALITY-012、FR-PERM-014 / AC-SCOPE-014、AC-QUALITY-013、AC-PERM-015 | current / scope, failure and authority | no new page or permission |
| F-014 | D-012 | FR-REV-005 / AC-REV-005 | current / preflight material contract | build-code must fail before dispatch |
| F-013、F-015 | D-010、D-011、D-012 | FR-REV-006、FR-REV-007、FR-REV-008、FR-REV-009、FR-REV-010、FR-REV-013 / AC-REV-006、AC-REV-007、AC-REV-008、AC-REV-009、AC-REV-010、AC-REV-011、AC-REV-014 | current / hard deadline and partial review facts | build-code must change runtime behavior |
| FND-003 至 FND-007 | D-003、D-011 | FR-INT-003、FR-REV-007、FR-REV-010、FR-REV-011、FR-RACE-015、FR-PLAN-011 / AC-INT-004、AC-REV-007、AC-REV-011、AC-REV-012、AC-RACE-016、AC-EVID-012 | current / findings already retained | same-task repair preserves original facts |
| D-006、D-008、D-010、D-012 | D-006、D-008、D-010、D-012 | FR-REV-011、FR-REV-012、FR-REV-013、FR-RACE-015 / AC-REV-012、AC-REV-013、AC-REV-014、AC-RACE-016 | current / review budget, blind order and lifecycle safety | no extra public review or false terminal state |

## 1. 问题与紧迫性

当前 WorkflowHub 的问题不是单个业务功能，而是执行链没有把“用户交互、审查生命周期、阶段交接和最终证据”锁在同一条可验证路径上。实际运行曾出现一题一问、未真实等待 Grill 或 Clarify、一次审查被拆成多个公开请求、健康 provider 被固定总时限误杀、某个 provider 失败时结果语义混乱，以及 build-code 开始时环境和最终证据还没有准备好的情况。

这会直接造成三类用户损失：

1. 用户需要重复回答大量细节问题，无法一次看清选项、后果和风险。
2. 用户无法分辨“某个 provider 失败”“这一轮部分完成”和“审查没有 finding”之间的差别。
3. 任务可能已经进入后续开发，却无法证明前一阶段已按顺序完成，也无法证明代码是在真实环境和真实证据基础上产生的。

本需求必须优先处理，因为它影响所有使用 WorkflowHub 的任务；继续堆加局部重试或新页面只会扩大状态和证据分叉。

## 2. 背景、目标与范围

### 背景

WorkflowHub 当前以四份材料作为工作真相：decision-log.md、spec.md、plan.md、tasks.md。审查、测试、历史和 inventory 都是质量事实，不是推进许可证。当前任务已经确认：

- 标准流程固定为 make-decision → build-spec → build-plan → build-code → verify-code。
- 当前 route 由真实 WorkflowHub 配置按 stage 决定：make-decision.direction 为 kimi/coding、codex/luna；make-decision.detail 为 kimi/coding、opencode/v4flash、codex/luna；build-plan 为 pi/k3、opencode/v4flash、codex/luna；各 route 的 minimum_heterologous=1。不能把一个 stage 的 route 当成全局 route。
- 非 build-code 每个审查面只做一轮 public group request；每个配置 provider 只做一次调用，盲审约束必须在这次调用内完成。
- group 必须等待所有已派发 provider 进入 completed、failed 或 cancelled 的明确终态，之后才能应用配置阈值。一个合法的 findings: [] 只是一个合法结果，不是“通过”。
- provider 健康状态不能用固定总时间替代。健康且有可验证进展就继续；明确 busy 且连续 15 分钟无 progress、cursor 或 session 变化时才收尾。
- 现有 caller-visible surface 已经足够承载问题卡、等待状态、阶段摘要、findings、失败说明和证据引用；本任务不新增独立 dashboard 或新页面。

### 目标

- 用户一次看到同一决策轴上的独立问题，并能用一个回复完成这一组选择。
- 用户能清楚看到等待、部分结果、失败、不可核验和可交接之间的区别。
- 审查一次发起、一次收齐终态、一次记录真实事实，不发生隐式自动复审或自动 fallback。
- 每个 build-code Phase 开始前就有设计任务和环境验收边界，结束时有测试和最终证据，并在 tasks.md 留下完成记录。
- 运行速度改善来自删除错误调用、重复审查和错误超时，而不是降低 review、测试、交互或证据质量。

### 范围内

- 五阶段顺序和阶段交接的可观察行为。
- Talk、Grill、Clarify 的成组提问、真实等待、回复绑定和方向变化回流。
- 当前配置驱动的 provider group、预检、终态收敛、失败语义和健康收尾。
- build-plan 对每个 Phase 的设计、环境、测试、证据和任务完成记录的产品边界要求。
- 现有调用方可见的加载、等待、结果、失败、取消、部分完成、最终确认和证据引用。
- 现有四份材料与现有 quality/evidence 目录之间的可追溯引用。

## 3. 用户场景与状态覆盖

### SCN-001：从原始需求开始并建立当前任务边界

- **角色**：任务发起人、WorkflowHub 主 Agent
- **Given**：用户只有原始需求，当前任务尚未进入下游阶段。
- **When**：WorkflowHub 开始 make-decision，读取原始需求并建立范围、用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。
- **Then**：用户看到一份大白话的范围说明；原始需求和关键事实进入 decision-log；未确认的方向性问题不会被 build-spec 偷补。

### SCN-002：一次回答一组独立 Talk 问题

- **角色**：任务发起人、Talk 主 Agent
- **Given**：当前轮次存在两个或更多互不依赖的决策轴。
- **When**：Talk 生成问题卡。
- **Then**：同一张卡同时显示这些独立问题、每个选项的直接后果和主要风险、推荐选项及原因；用户回复后，系统才记录答案并重新排序剩余问题。依赖前一答案的问题不提前混入。

### SCN-003：make-decision 按固定顺序完成

- **角色**：任务发起人、make-decision 主 Agent、review provider group
- **Given**：原始需求已记录。
- **When**：make-decision 执行。
- **Then**：顺序只能是 Talk Round 1、必要调研、Talk Round 2、方向审查、Talk Round 3、Grill、decision draft、细节审查、stage-end consistency、用户最终确认；每个等待点有真实回复或明确质量事实。

### SCN-004：build-spec 的 Clarify 只解决规格歧义

- **角色**：任务发起人、build-spec 主 Agent
- **Given**：make-decision 已交接，规格草稿发现真正影响范围、验收、接口、数据、安全或运行的歧义。
- **When**：spec-clarify 生成问题卡。
- **Then**：只按独立决策轴成组提问，等待匹配的用户回复后再恢复；依赖问题进入后续批次。若答案改变产品方向，规格阶段报告上游缺口并回到同一任务的 make-decision；不在 build-spec 静默补方向。

### SCN-005：按当前配置发起一轮异源审查

- **角色**：WorkflowHub review caller、3rd-review broker、配置中的 provider
- **Given**：当前审查材料、route/provider identity、配置快照、输出协议和 reviewer group identity 均通过预检。
- **When**：非 build-code 的一个审查面开始。
- **Then**：按当前配置派发全部 provider；每个 provider 只接受一次 public request；provider 只收到冻结且最小化的 manifest 材料；调用方不另加外层 retry、provider fallback 或第二轮审查。

### SCN-006：等待 group 的全部终态再判断下游交接

- **角色**：WorkflowHub、provider group、下游 stage
- **Given**：多个 provider 已被派发，其中至少一个 provider 已经产生合法结果。
- **When**：一个 provider 先完成，而另一个仍在运行或尚未有可信终态。
- **Then**：group 继续等待；只有所有已派发 provider 都进入明确终态后，才按 minimum_heterologous=1 判断是否具备下游交接条件。若至少一个合法结果满足配置阈值，可以交接，但 partial、incomplete、失败 provenance 和质量缺口必须继续显示。

### SCN-007：健康 provider 持续进展或无进展收尾

- **角色**：provider、broker owner、health monitor
- **Given**：provider 进程仍存活。
- **When**：health probe 报告 busy 且出现新的 progress、cursor 或 session 变化，或连续 15 分钟没有这些可验证变化。
- **Then**：有进展时继续等待并重置无进展计时；连续 15 分钟无进展时记录 PROCESS_STALLED 和 unavailable，显式取消并终止进程树，保留 raw/session/诊断/终止原因，不自动重试。单次 probe 为 unverifiable 时继续等待，不直接失败。owner、guardian、worker 的身份和存活信号必须可核验；只有确认 owner/worker 已死亡时，才收束为 PROCESS_DEAD 或 ORPHANED_BROKER，并保留清理事实。

### SCN-008：provider 失败、审查不可用或空 findings

- **角色**：用户、WorkflowHub、provider group
- **Given**：一个 provider transport 失败、进程死亡、owner 失联，或者返回 parse-valid 的 findings: []。
- **When**：group 形成终态事实。
- **Then**：失败 provider 的原始原因和 provenance 保留；不可用不能改写成空 findings；空 findings 只表示该 provider 没提出 finding，不能显示为审查通过、阶段完成或质量通过。满足配置阈值时可交接，但整体质量状态仍准确标记。

### SCN-009：build-plan 为每个 Phase 建立可执行设计闭环

- **角色**：build-plan 主 Agent、实施 Agent、任务发起人
- **Given**：spec.md 已完成产品行为和验收边界。
- **When**：build-plan 划分 Phase。
- **Then**：每个 Phase 都有设计任务、环境前置、测试或明确 not_applicable 理由、最终证据类型和落盘位置、tasks.md 的完成记录方式及 STOP 条件；没有这些内容的 Phase 不能被标记为可执行。

### SCN-010：环境先于实现，证据先于 Phase 完成

- **角色**：build-code 主 Agent、Phase owner
- **Given**：Phase 已有设计卡，但环境前置尚未被真实证据证明。
- **When**：Agent 尝试开始实现或宣称 Phase 完成。
- **Then**：环境未就绪时 Phase 保持 incomplete，不得凭空开发；环境就绪后才实现。测试、失败边界和最终证据落盘后，tasks.md 才能记录 completed，并引用对应事实。

### SCN-011：取消、重复、过期材料和并发状态

- **角色**：用户、WorkflowHub、provider group、stage owner
- **Given**：用户取消、同一请求重复到达、当前材料 hash 改变、旧 provider 结果迟到，或多个状态更新同时到达。
- **When**：系统处理取消或状态更新。
- **Then**：取消是显式终态并保留原因；同一 reviewer group 以 group identity、材料 snapshot/hash 组成幂等身份，不重复派发；终态写入单调收敛，取消优先于迟到结果；旧 snapshot 的结果不能写入新材料；迟到或重复结果保留为事实但不能覆盖当前投影；不能因竞态提前交接或重复发布。

### SCN-012：权限和最终交接保持真实

- **角色**：任务发起人、主 Agent、review provider、下游 stage
- **Given**：当前调用方使用既有权限和身份。
- **When**：用户确认 decision-log，或 stage 尝试写入不属于自己的材料。
- **Then**：最终确认仍由用户完成；provider 不能代替用户确认；每个 stage 只写自己的当前材料；既有无权操作仍按现有失败语义处理，不新增权限。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-003，任务按五阶段顺序开始。
- [x] **空态**：SCN-008，合法 findings: [] 与没有任何合法 provider 结果明确区分。
- [x] **错误态**：SCN-008，transport、protocol、进程死亡和材料错误保留为真实失败或 unavailable。
- [x] **加载态**：SCN-002、SCN-004、SCN-005、SCN-007，用户能看到等待用户、等待 provider 或等待终态。
- [x] **取消态**：SCN-007、SCN-011，显式取消并清理仍存活的 provider。
- [x] **边界态**：SCN-006、SCN-007，全部终态、minimum_heterologous=1 和连续 15 分钟无进展分别处理。
- [x] **权限态**：SCN-012，本需求不新增权限角色，既有权限拒绝行为保持不变。
- [x] **竞态态**：SCN-011，旧 snapshot、重复结果和迟到结果不能改变当前材料。

### 状态转移

用户交互状态：

1. waiting_for_user → replied → recorded；
2. 没有回复时保持 waiting_for_user；
3. reply 与当前 batch、轮次和材料 hash 不匹配时保持 incomplete，并要求重新生成当前卡；
4. 方向变化时从 build-spec 返回 make-decision，不在规格阶段隐式改方向。

审查 group 状态：

1. prepared → preflight_rejected，表示没有 provider dispatch，材料或合同不合格；
2. prepared → dispatched → waiting_for_terminal；
3. provider member 只能是 running、completed、failed、cancelled；
4. waiting_for_terminal → terminal_group，只有所有已派发 member 进入明确终态；
5. terminal_group → eligible_for_handoff 只表示满足配置的下游交接条件，不表示质量通过；
6. terminal_group → incomplete/unavailable 表示质量事实不完整，仍必须保留原始结果；
7. healthy busy 的 unverifiable 不是终态，不能直接转成失败。
8. 已确认 owner、guardian 或 worker 死亡时，provider member 进入带 PROCESS_DEAD 或 ORPHANED_BROKER 原因的 failed 终态，group/quality 层保留 unavailable；若进程仍存活，先显式取消并清理。
9. 同一 group identity 的重复/replay 请求不得新增 provider 调用；终态写入只允许向前收敛，取消后的迟到结果只能作为历史事实。

Phase 状态：

1. planned → environment_pending → environment_ready；
2. environment_pending 在没有真实环境证据时不能跳到 implementation；
3. environment_ready → implementation_in_progress → tested；
4. tested → evidence_recorded → completed；
5. 任一设计、环境、测试、证据或任务记录缺失时保持 incomplete。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：五阶段顺序和当前四份材料的权威边界已被用户确认。
  - **status**：verified
  - **证据或来源**：decision-log.md 的 R-006、D-006、最终确认；quality/evidence/stage-outcomes/make-decision/7a92ab6dfa1fe719c3289ddf37cb2b4d573de674f914d416a35d06f4bab02d64.json
  - **关联**：FR-SEQ-001、FR-HAND-016、AC-SEQ-001、AC-HAND-017

- **PFACT-002**：Talk 已确认使用三轮成组决策；当前交互证据记录了三轮 Talk、Clarify owner 和最终决策绑定。
  - **status**：verified
  - **证据或来源**：quality/evidence/interactions/aaa50f819f69c44d0edceb5acd71867c43f9d4c311cf6a6f91e2555d0dc8958d.json；decision-log.md 的 T-001 至 T-003、G-016
  - **关联**：FR-INT-002、FR-INT-003、AC-INT-001、AC-INT-002、AC-INT-003

- **PFACT-003**：当前 route 由 `/Users/Hugh/.config/workflowhub/config.json` 按 stage 提供：make-decision.direction 为 kimi/coding、codex/luna；make-decision.detail 为 kimi/coding、opencode/v4flash、codex/luna；build-plan 为 pi/k3、opencode/v4flash、codex/luna；各自 minimum_heterologous=1、非 build-code 为 single_round。terra 不属于当前 route。
  - **status**：verified
  - **证据或来源**：decision-log.md 的 F-001、F-003、F-010、D-004、D-005；WorkflowHub config sha256 `81ae88a387800f8206cc64009ca4c553765d67902a678c5622e7f173b702afdf`；当前 make-decision detail review attempt c40210a8-6b0a-4dfe-b2c0-608ee8b59760 的 provider facts
  - **关联**：FR-REV-004、FR-REV-006、AC-REV-004、AC-REV-006

- **PFACT-004**：同一 reviewer group 必须等待所有已派发 provider 的明确终态，之后才应用配置阈值；合法 findings: [] 是结果而不是通过。
  - **status**：verified
  - **证据或来源**：decision-log.md 的 D-011、G-017、G-018；detail review result make-decision-detail-b51c6a35dc230df674ca9e5dc1f2c81c0ec3ec86-c40210a8-6b0a-4dfe-b2c0-608ee8b59760.json
  - **关联**：FR-REV-006、FR-REV-007、AC-REV-006、AC-REV-007

- **PFACT-005**：当前历史事实包含 360000ms 固定总时限误杀健康会话的问题；已确认的目标行为是不设置 provider 固定总时限，只对健康型连续 15 分钟无进展收尾。
  - **status**：verified
  - **证据或来源**：decision-log.md 的 F-013、F-008、D-010、G-012、G-013；make-decision detail review 的原始 provider execution facts
  - **关联**：FR-REV-008、FR-REV-009、FR-REV-013、AC-REV-008、AC-REV-009、AC-REV-010、AC-REV-014

- **PFACT-006**：本次 detail review 已保留 2 个有效 provider 结果和 1 个 OpenCode failed 事实；direction review 仍有 unavailable/partial 质量事实，不能作为空 findings 或通过。
  - **status**：verified
  - **证据或来源**：quality/reviews/results/make-decision-detail-b51c6a35dc230df674ca9e5dc1f2c81c0ec3ec86-c40210a8-6b0a-4dfe-b2c0-608ee8b59760.json；decision-log.md 的 F-005、F-015、FND-001、FND-002
  - **关联**：FR-REV-007、FR-REV-009、FR-REV-010、FR-QUALITY-012、AC-REV-007、AC-REV-010、AC-REV-011、AC-QUALITY-013

- **PFACT-007**：用户已确认每个 Phase 必须有设计任务、环境前置、测试或 not_applicable 理由、最终证据和 tasks.md 完成记录。
  - **status**：verified
  - **证据或来源**：decision-log.md 的 R-005、G-007、G-008、D-005；最终确认附加约束
  - **关联**：FR-PLAN-010、FR-PLAN-011、AC-PLAN-011、AC-PLAN-012

- **PFACT-008**：本任务只修现有调用方可见交互，不新增独立 dashboard、独立 UI 页面、第五份当前材料或公共 phase/recovery/rebind/selector/review-loop 控制面。
  - **status**：verified
  - **证据或来源**：decision-log.md 的 D-001、非目标、DEFER-001；CONSTITUTION.md 的 F1、F2、F8、F10
  - **关联**：FR-SCOPE-013、FR-QUALITY-012、AC-SCOPE-014、AC-QUALITY-013

- **PFACT-009**：质量事实、审查结果、测试事实和历史记录不能替代四份当前材料、用户确认或正式完成证据。
  - **status**：verified
  - **证据或来源**：CONSTITUTION.md 的 F3、F4、F6、F9；constitution-checklist.md；decision-log.md 的 D-003、质量边界
  - **关联**：FR-PLAN-011、FR-QUALITY-012、FR-HAND-016、AC-EVID-012、AC-QUALITY-013、AC-HAND-017

- **PFACT-010**：本需求不增加用户角色、权限或外部业务副作用；既有调用方权限边界保持不变。
  - **status**：not_applicable
  - **不适用理由**：当前原始需求只改变执行链和质量证据，不要求新增角色、授权或业务数据写入。
  - **关联**：FR-PERM-014、AC-PERM-015

- **PFACT-011**：build-spec 的 Clarify 已完成一次真实的成组 ask → wait → 用户回复 → resume；用户选择 A，确认本次修复没有新的产品方向歧义，并附加要求不得违反宪法、不得降低各 stage 质量。
  - **status**：verified
  - **证据或来源**：quality/evidence/interactions/cfa8c6be026934135b5180b43111a10d230d2e2eb88398858406fbf9227932fa.json；用户原始回复“A。注意方案设计的时候要考虑：不要违反workflowhub宪法，不要降低workflowhub各个stage的执行质量”
  - **边界**：该回复只确认继续修复当前规格，不替代对九条异源审查 finding 的逐项修复、处置和阶段末分析。
  - **关联**：FR-HAND-016、FR-INT-003、FR-QUALITY-012、AC-INT-003、AC-HAND-017、AC-QUALITY-013

## 5. 功能需求

### 阶段顺序与交接（SEQ）

WorkflowHub 必须将一个任务视为一条有序交接链。当前阶段只能消费当前四份材料和已发布的事实；下一阶段不能通过历史 task、旧 receipt、旧 review 或 build-spec 自行补方向来绕过缺失的上游事实。

- **FR-SEQ-001**：任务必须按 make-decision → build-spec → build-plan → build-code → verify-code 执行；阶段顺序、用户确认边界和当前材料缺失状态必须对调用方可观察。
  - **范围边界**：包含阶段进入、阶段完成和交接事实；不包含新建公共 phase/recovery 控制面。
  - **依据**：R-001、R-006、D-003、D-006、PFACT-001、PFACT-009
  - **场景**：SCN-001、SCN-003、SCN-012
  - **验收**：AC-SEQ-001

- **FR-HAND-016**：build-spec 只能把已确认方向转成产品规格；发现方向变化时必须报告并回到 make-decision，不能以规格草稿代替方向决策。
  - **范围边界**：包含当前任务内的回流和未完成表达；不包含自动创建 successor task 或新的决策账本。
  - **依据**：R-006、D-003、D-011、PFACT-001、PFACT-009
  - **场景**：SCN-004、SCN-012
  - **验收**：AC-HAND-017

### 用户交互（INT）

WorkflowHub 的交互重点是减少无意义的往返，但不能通过猜测用户答案减少质量。独立问题必须成组，依赖问题必须按回复后重新排序。

- **FR-INT-002**：Talk 和 Grill 的每张问题卡必须包含当前批次所有独立决策轴；每题使用大白话说明选项、直接后果和主要风险，并给出推荐及理由。
  - **范围边界**：包含问题分组、选项表达、回复绑定和剩余队列重排；不包含把实现细节全部展示给用户。
  - **依据**：R-002、R-007、D-002、D-007、D-012、PFACT-002
  - **场景**：SCN-002、SCN-003
  - **验收**：AC-INT-001、AC-INT-002

- **FR-INT-003**：Talk、Grill、Clarify 都必须有真实的 ask → wait → matching reply → resume 生命周期；没有用户回复、回复过期或回复绑定错误时不得默认答案。
  - **范围边界**：包含 make-decision 的 Talk/Grill 和 build-spec 的唯一 Clarify owner；不包含在 build-spec 重复实现 Talk 或 Grill。
  - **依据**：R-003、D-003、D-011、PFACT-002
  - **场景**：SCN-002、SCN-004、SCN-011
  - **验收**：AC-INT-003、AC-INT-004

### 异源审查与 provider 生命周期（REV）

审查是质量事实，不是 stage verdict，也不是把用户确认替换掉的推进许可证。速度目标只能来自一次正确调用和正确收尾，不能来自减少材料、减少 provider、减少测试或把失败改写成通过。

- **FR-REV-004**：每个非 build-code 审查面必须读取可信的当前配置快照，按配置派发全部 provider，保留 route、provider、source identity、model/profile 和 group identity；不得静默删除任何当前配置 provider，也不得硬编码替代配置阈值。当前 terra 已不属于本任务的正式 route。
  - **范围边界**：包含当前配置解析和调用前 identity 绑定；不包含修改 3rd-review 全局策略来掩盖失败。
  - **依据**：R-004、D-004、D-005、D-008、PFACT-003
  - **场景**：SCN-005、SCN-008
  - **验收**：AC-REV-004

- **FR-REV-005**：provider dispatch 前必须完成当前审查面的材料 allowlist、冻结快照、manifest hash、路径安全、输出协议、route identity、group identity 和生命周期预检；预检失败时 provider dispatch 数量必须为零。不同审查面必须使用对应的必需、可选和禁止材料矩阵，不能用下游生成材料反向替代上游方向。
  - **范围边界**：包含本地材料合同和安全边界；不包含在 provider 端读取仓库、host path、Git、shell 或网络。
  - **依据**：D-012、F-014、PFACT-003、PFACT-006
  - **场景**：SCN-005、SCN-011
  - **验收**：AC-REV-005

审查材料矩阵（产品边界）：

| 审查面 | 必需材料 | 可选材料 | 禁止材料 | 失败行为 |
| --- | --- | --- | --- | --- |
| make-decision / 方向 | 原始需求、客观事实、固定审查说明 | 当前选择、候选方向、关键假设 | approved decision、spec、plan、tasks、实现变更 | MATERIAL_FORBIDDEN 或 MATERIAL_INCOMPLETE，零 dispatch |
| make-decision / 细节 | 原始需求、已确认方向、当前规格/验收草稿、固定审查说明 | 上下文图、证据图 | 未确认方向、无关历史、实现变更 | 材料不完整或越界，零 dispatch |
| build-spec | 原始需求、approved decision、当前 spec、固定审查说明 | 上下文图、证据图 | provider 自行扩展的需求、plan、tasks、实现变更 | 材料不完整或越界，零 dispatch |

- **FR-REV-006**：非 build-code 的一个审查面只能产生一个 public reviewer group；每个 provider 只发起一次 public request。所有已派发 provider 进入明确终态后，才按 minimum_heterologous=1 应用下游交接条件。
  - **范围边界**：包含单轮、全量派发、等待全部终态和阈值判定；不包含 build-code 在真实修复后的有限 focused review。
  - **依据**：R-004、D-005、D-007、D-008、D-011、G-017、PFACT-003、PFACT-004
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-REV-006

- **FR-REV-007**：provider member 的公共状态只能是 running、completed、failed 或 cancelled；unavailable、partial 和质量 incomplete 只能作为 attempt、group 或质量事实投影。合法 findings: [] 只能表示该 provider 没有提出 finding，不能表示通过、无问题或阶段完成。
  - **范围边界**：包含结果语义、失败 provenance 和空结果语义；不包含把历史错误状态重写成新状态。
  - **依据**：D-003、D-011、F-015、FND-004、PFACT-004、PFACT-006
  - **场景**：SCN-006、SCN-008
  - **验收**：AC-REV-007

- **FR-REV-008**：provider 不得设置固定总审查时限。每个执行必须绑定 owner、guardian、worker identity 和可观察 heartbeat/liveness；只要进程、owner 和 broker 仍健康，且存在可验证 progress、cursor 或 session 变化，就继续等待；health probe 为 unverifiable 时不能直接结束，也不能把一次 probe 失败当作死亡。
  - **范围边界**：包含健康会话、owner/worker liveness 和单次 probe 的不确定性；不包含资源回收机制将健康会话误杀。
  - **依据**：D-010、G-011、F-013、F-008、PFACT-005
  - **场景**：SCN-007
  - **验收**：AC-REV-008

- **FR-REV-009**：仅当 health probe 明确为 busy，且连续 15 分钟没有可验证 progress、cursor 或 session 变化时，provider 才能被记录为 PROCESS_STALLED/unavailable；owner/worker 已确认死亡时，才可记录 PROCESS_DEAD 或 ORPHANED_BROKER，并将质量事实标为 unavailable。收尾前必须显式取消并终止仍存活的进程树，保留 raw、session、诊断、liveness 结论和终止原因，且不自动 retry 或追加审查。
  - **范围边界**：包含无进展 watchdog、清理和事实保留；不包含用普通输出静默、单次 probe 超时或总耗时替代 15 分钟无进展条件。
  - **依据**：D-010、D-012、G-012、G-013、PFACT-005
  - **场景**：SCN-007、SCN-008
  - **验收**：AC-REV-009、AC-REV-010

- **FR-REV-010**：每个 provider finding 都必须由 Stage Agent 记录 fixed、rejected_invalid、accepted_risk 或 needs_human 之一及其理由。accepted_risk 必须绑定当前 finding_id、原始 review ref/hash、当前 snapshot/material revision 和真实用户风险确认；任一绑定缺失时只能是 needs_human。非 build-code 不因 finding 自动追加同范围审查；重复 finding、无实际变化或无可信终态时保持 needs_human、unavailable 或 incomplete。
  - **范围边界**：包含 finding 的逐项处置和有限复核；不包含 provider 代替主 Agent判断，也不把 disposition 变成 stage verdict。
  - **依据**：R-004、D-003、D-006、D-008、D-012、FND-001 至 FND-007、PFACT-006
  - **场景**：SCN-006、SCN-008、SCN-010
  - **验收**：AC-REV-011

- **FR-REV-011**：build-code 的审查预算必须按每个 Phase 固定为：一次初始独立审查；只有真实修复或审查对象改变时，最多一次 focused review；全部 Phase 完成后一次 final integration review。每次审查都必须绑定审查对象、触发原因、材料 snapshot、结果和 finding 处置；没有真实变化、重复 finding 或缺少可信终态时不得追加调用。
  - **范围边界**：包含 build-code 的三类审查身份和触发条件；不把该预算扩展到非 build-code，也不把它变成无限 review loop。
  - **依据**：D-006、D-008、R-004、PFACT-006
  - **场景**：SCN-005、SCN-006、SCN-010
  - **验收**：AC-REV-012

- **FR-REV-012**：方向审查必须在同一次 public group request 内完成内部盲审顺序：先由 provider 独立重建方向，再揭示当前选择，最后在同一请求内挑战当前选择；调用方不得通过第二个 public request 补做 challenge，也不得把内部顺序拆成多轮正式审查。
  - **范围边界**：包含方向 review 的输入和单请求内的盲审顺序；不新增 provider 或改变已确认方向。
  - **依据**：D-008、R-004、PFACT-003
  - **场景**：SCN-003、SCN-005
  - **验收**：AC-REV-013

- **FR-REV-013**：provider liveness 结论必须区分 alive、unverifiable 和 confirmed-dead，并记录 owner、guardian、worker 的身份、heartbeat、最后可验证进展和终态映射。alive 或 unverifiable 不能被当作死进程；confirmed-dead 才能收束为 PROCESS_DEAD 或 ORPHANED_BROKER，且必须保留取消/清理事实。
  - **范围边界**：包含生命周期和失败语义；不引入新的公共 member 状态或第二套监控控制面。
  - **依据**：D-010、D-012、F-013、F-015、PFACT-005、PFACT-006
  - **场景**：SCN-007、SCN-008、SCN-011
  - **验收**：AC-REV-014

- **FR-RACE-015**：ReviewGroup 必须以 group identity + 当前材料 snapshot/hash 形成幂等键；同一键最多一次 provider dispatch。provider 终态写入必须单调收敛，取消优先于迟到结果；重复、replay、并发和旧 snapshot 结果只能作为保留的历史事实，不能覆盖当前 group、材料或交接判断。
  - **范围边界**：包含一次审查 group 的状态一致性和旧结果隔离；不创建 successor、rebind、selector、recovery 或 current projection。
  - **依据**：D-011、D-012、FND-003 至 FND-007、PFACT-004、PFACT-006
  - **场景**：SCN-006、SCN-011
  - **验收**：AC-RACE-016

### Phase 设计与证据（PLAN、EVID）

- **FR-PLAN-010**：build-plan 必须为每个 Phase 写出设计任务、环境启动或前置、测试策略、最终设计证据、任务完成记录和 STOP 条件；Phase 不能只写实现目标。
  - **范围边界**：包含每个 Phase 的可执行设计边界；不包含在 spec.md 写实现文件清单、函数名、具体命令或任务步骤。
  - **依据**：R-005、D-005、G-007、G-008、PFACT-007
  - **场景**：SCN-009
  - **验收**：AC-PLAN-011

- **FR-PLAN-011**：每个 Phase 完成后，tasks.md 必须记录任务完成情况、测试结果、覆盖限制、失败或 not_applicable 理由和证据引用；最终证据必须能由 facts.jsonl、index.json、verify.json 及必要的 quality/evidence 记录共同回指。
  - **范围边界**：包含当前任务的证据闭环；不包含创建第五份当前材料或永久 compatibility bridge。
  - **依据**：R-005、G-007、G-008、D-003、PFACT-007、PFACT-009
  - **场景**：SCN-009、SCN-010
  - **验收**：AC-PLAN-012、AC-EVID-012

### 宪法与权限边界（QUALITY、SCOPE、PERM）

- **FR-QUALITY-012**：质量事实、审查结果、测试、stage-end analyze 和历史记录必须保持原始 provenance；它们不能单独成为 stage verdict、继续工作的许可证或用户确认的替代物。缺少或 unavailable 的质量事实必须保持 unknown、unavailable 或 incomplete。
  - **范围边界**：包含质量和推进的语义分离；不包含为了显示绿色状态而补造空 findings、doctor 成功或自动 fallback。
  - **依据**：R-006、D-003、D-012、PFACT-006、PFACT-008、PFACT-009
  - **场景**：SCN-006、SCN-008、SCN-010、SCN-012
  - **验收**：AC-QUALITY-013

- **FR-SCOPE-013**：本需求只能复用和修正现有 caller-visible surface，不新增独立 dashboard、可视化编辑器、第五份当前材料、公共 phase/recovery/rebind/selector/review-loop 控制面或业务功能。
  - **范围边界**：包含问题卡、等待、结果、失败、确认和证据引用；不包含独立产品页面。
  - **依据**：D-001、D-003、PFACT-008
  - **场景**：SCN-001、SCN-002、SCN-005、SCN-012
  - **验收**：AC-SCOPE-014

- **FR-PERM-014**：用户最终确认必须来自真实用户；provider、子 Agent 或历史记录不能代替确认。各阶段只能写入自己负责的当前材料，既有权限拒绝行为保持不变。
  - **范围边界**：包含用户确认和材料 ownership；不包含新增角色或授权。
  - **依据**：D-003、D-006、PFACT-010
  - **场景**：SCN-012
  - **验收**：AC-PERM-015

## 6. 模块划分

### 交互批次与阶段交接

- **负责什么**：展示成组问题、等待用户回复、绑定轮次和当前材料、按回答重排依赖问题，并呈现阶段交接状态。
- **对外提供什么**：用户可读的问题卡、等待状态、回复结果、方向回流和下一阶段 handoff。
- **依赖谁**：当前四份材料、用户确认事实和阶段技能合同。
- **测试边界**：独立问题成组、真实等待、错卡拒绝、方向变化回流、固定五阶段顺序。

### Review group 与 provider 事实

- **负责什么**：按当前配置冻结材料、派发 provider、等待全部终态、记录结果和健康失败事实。
- **对外提供什么**：provider member、group outcome、findings、unavailable、partial、incomplete 和 provenance。
- **依赖谁**：3rd-review broker 的公开请求合同、配置 snapshot 和当前审查材料。
- **测试边界**：一次调用、全量派发、预检零 dispatch、全部终态、空 findings、健康型 15 分钟无进展、显式取消和失败保真。

### Phase 设计与证据记录

- **负责什么**：表达每个 Phase 的设计、环境、测试、证据和完成记录。
- **对外提供什么**：tasks.md 中的 Phase 状态、测试结果、覆盖限制、证据引用和 STOP 原因。
- **依赖谁**：spec.md 的产品验收、真实环境事实、测试事实和 quality/evidence 记录。
- **测试边界**：环境未就绪阻止完成、测试事实可回指、最终证据完整、缺失证据保持 incomplete。

## 7. 关键实体

- **InteractionBatch**：
  - **定义**：一张面向用户的独立问题卡。
  - **字段和约束**：stage、round、独立问题列表、每题选项、后果、风险、推荐、batch identity、材料 hash；独立轴必须同批，依赖轴不能提前进入。
  - **关系**：属于一个 stage interaction，绑定一条真实 user reply。

- **ReviewGroup**：
  - **定义**：一次审查面按当前配置派发的完整 provider 集合。
  - **字段和约束**：review scope、config snapshot、route/provider identity、material manifest、group identity、幂等键（group identity + material snapshot/hash）、member terminal summary、threshold result、quality state；一个非 build-code 审查面只能有一个 public group request。
  - **关系**：包含多个 ProviderMember，生成一个不可变 review fact。

- **ProviderMember**：
  - **定义**：ReviewGroup 中一个实际配置 provider 的公开执行事实。
  - **字段和约束**：provider/source/model、request identity、公共状态 running/completed/failed/cancelled、findings、transport/provenance、owner/guardian/worker identity、heartbeat、最后可验证进展、liveness 结论和健康诊断；unavailable 不写入 member status。
  - **关系**：属于一个 ReviewGroup，终态汇总后参与 group 交接判断。

- **PhaseCard**：
  - **定义**：一个 build-code Phase 的设计和完成边界。
  - **字段和约束**：设计任务、环境前置、测试或 not_applicable 理由、证据要求、覆盖限制、STOP 条件、tasks.md 完成记录。
  - **关系**：属于一个 plan，消费 spec 的 FR/AC，并产出 quality/evidence 引用。

- **StageHandoff**：
  - **定义**：当前 stage 向下一个 stage 传递的事实集合。
  - **字段和约束**：当前材料身份、snapshot、质量事实、finding dispositions、未决/延期、用户确认（适用时）、下游不得猜测的边界。
  - **关系**：只连接相邻 stage，不创建 successor、rebind 或第二套历史链。

## 8. 数据和生命周期

- **数据粒度**：一条 decision、spec、plan、task、review、test 或 evidence 记录代表一个可回指的事实；一组 provider 记录代表一次 ReviewGroup，不把多次调用合并成一个伪造结果。
- **数据时效**：当前四份材料表示当前工作真相；审查、测试、交互和历史记录使用当时的 snapshot、material hash 和 provenance。
- **缺失或迟到**：缺少用户回复、provider 公开终态、环境、测试或证据时，用户看到 waiting、unavailable 或 incomplete；不补默认答案，不用旧事实覆盖当前事实。
- **预览与正式**：进行中的状态只能显示 loading、waiting 或 running；只有 provider/group 明确终态、任务事实和 stage-end 证据齐全时，才显示对应的正式事实。eligible_for_handoff 不等于质量通过。
- **当前与历史**：当前四份材料只保留一个当前 revision；旧 task、旧 review、旧 receipt 和旧 snapshot 只读保留，不能作为新 writer。
- **归属与清理**：WorkflowHub 保留公开 broker 结果、raw/session/诊断和终止原因；对明确取消或 PROCESS_STALLED 的进程树进行显式清理，但清理动作本身也必须留事实。

## 9. 兼容性预留

- **既有消费方**：既有调用方继续使用当前 caller-visible surface、当前四份材料和当前配置 route；显示新增的等待、partial、unavailable 和证据引用，不要求新独立页面。
- **命名预留**：provider member 状态与 group/quality 投影分开，避免未来新增 provider 或质量状态时把 unavailable 误加入公共 member 枚举。
- **容器预留**：ReviewGroup 使用 manifest 和 provider member 集合容纳当前配置变化，但本期不新增第二套 dispatcher 或历史投影。
- **状态预留**：健康诊断、provider member、group outcome、stage quality 和 Phase completion 保持分层；新状态必须属于既有层，不能借名新增公共控制面。
- **扩展边界**：build-code 可以在真实修复后使用计划内 focused review；未来新增 provider、UI 或业务功能必须重新走对应决策，不由本规格默认承诺。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增独立 dashboard、独立 UI 页面或可视化编辑器；来源 D-001、DEFER-001。
- 不新增业务功能、第五份当前材料、公共 phase、recovery、rebind、selector 或 review-loop 控制面；来源 D-003、PFACT-008。
- 不删除或静默跳过配置 provider，不通过修改 route 掩盖 provider 失败；来源 D-004、D-005。
- 不设置 provider 固定总审查时限，不恢复 360000ms 或 Kimi 15 分钟 plan 总上限；来源 D-010。
- 不添加隐藏自动复审、无限 retry、自动 fallback 或把诊断复试改写为正式 review；来源 D-008、D-012。
- 不在 make-decision 直接改实现、启动正式 build-code、提交、合并、推送、归档或发布；来源 D-006、最终确认。

### 默认必须成立

- 所有用户可见选项都必须说明直接后果和主要风险，并保留用户原始回复；关联 FR-INT-002、AC-INT-001。
- 所有 provider 失败、transport 失败、owner 失联和进程清理原因都必须可追溯；关联 FR-REV-007、FR-REV-009、AC-REV-007、AC-REV-009。
- 每个 finding 都必须有真实处置状态和理由；accepted_risk 必须有当前 finding、review、snapshot 和用户风险确认绑定；非 build-code 不重复复审，build-code 使用声明的初始/focused/final integration 预算；关联 FR-REV-010、FR-REV-011、AC-REV-011、AC-REV-012。
- 同一 group identity + 材料 snapshot/hash 只能派发一次；取消、旧 snapshot、迟到和重复结果不能覆盖当前事实；关联 FR-RACE-015、AC-RACE-016。
- 合法 findings: [] 不得显示为无问题、通过或完成；关联 FR-REV-007、AC-REV-007。
- group 必须先全部终态再做阈值判断；关联 FR-REV-006、AC-REV-006。
- 缺失质量事实不降低 stage 的质量要求，也不伪造 completion；关联 FR-QUALITY-012、AC-QUALITY-013。
- 每个 Phase 必须环境先行、测试和证据后置完成；关联 FR-PLAN-010、FR-PLAN-011、AC-PLAN-011、AC-PLAN-012。

## 11. 验收标准

- [ ] **AC-SEQ-001**：从同一任务的原始需求开始，阶段只能依次进入 make-decision、build-spec、build-plan、build-code、verify-code；任何缺失的上游方向、当前材料或正式交接事实都会保持当前阶段 incomplete 或回流。
  - **需求**：FR-SEQ-001
验证：按完整 WorkflowHub 流程做人工和阶段事实回放。
  - **通过条件**：顺序、阶段身份、当前材料和交接事实一致。
  - **失败条件**：跳过阶段、旧记录替代当前材料、build-spec 补方向或后续阶段先行。
  - **证据类型**：evidence、manual

- [ ] **AC-INT-001**：当一个批次有两个或更多独立问题时，用户一次看到同一张卡中的全部独立问题，以及每个选项的后果、风险和推荐理由。
  - **需求**：FR-INT-002
验证：人工观察 Talk 和 Grill 的问题卡，并检查交互事实。
  - **通过条件**：批次内独立问题数量与展示数量一致，且一次回复绑定整批。
  - **失败条件**：把独立问题拆成一题一问，或省略后果、风险、推荐理由。
  - **证据类型**：manual、evidence

- [ ] **AC-INT-002**：用户回复后，系统只重排仍未解决的依赖问题；没有真实回复时保持 waiting_for_user。
  - **需求**：FR-INT-002
验证：模拟正常回复、空回复和依赖问题。
  - **通过条件**：回复后重排；未回复不推进，不猜答案。
  - **失败条件**：未回复自动采用推荐，或把依赖问题提前放进同一批。
  - **证据类型**：manual、test

- [ ] **AC-INT-003**：Grill 和 build-spec Clarify 都有真实 ask → wait → matching reply → resume 记录。
  - **需求**：FR-INT-003
验证：检查交互 aggregate 与对应的卡、回复、轮次和材料 hash。
  - **通过条件**：真实用户回复被绑定并恢复；无回复或错卡保持 incomplete。
  - **失败条件**：Agent 自行回答、使用历史回复、或没有等待就进入下一步。
  - **证据类型**：evidence、manual

- [ ] **AC-INT-004**：Clarify 发现方向变化时，不在 build-spec 直接改变产品意义，而是返回同一任务的 make-decision。
  - **需求**：FR-INT-003、FR-HAND-016
验证：提交一个会改变范围或成功边界的 Clarify 回复并观察交接。
  - **通过条件**：记录 upstream decision gap 并回流；当前 spec 不伪造已接受方向。
  - **失败条件**：build-spec 静默采纳方向改变或创建旁路材料。
  - **证据类型**：manual、evidence

- [ ] **AC-REV-004**：每个非 build-code 审查面使用对应 stage 的当前配置快照派发全部配置 provider，并为每个结果保留 provider/source identity；本任务当前 build-plan route 为 pi/k3、opencode/v4flash、codex/luna，make-decision detail route 为 kimi/coding、opencode/v4flash、codex/luna。
  - **需求**：FR-REV-004
验证：检查 frozen manifest、config snapshot、provider result 和 route provenance。
  - **通过条件**：预检通过时，当前 route 的所有 provider 都被列出并各尝试一次；provider identity 可回指。预检拒绝时，配置快照、拒绝原因和 attempts=0 被记录，不把“未派发”说成 provider 已尝试。
  - **失败条件**：静默删除 provider、使用旧 terra route、硬编码不同阈值、丢失 source identity，或预检失败后仍启动 provider。
  - **证据类型**：evidence、test

- [ ] **AC-REV-005**：审查材料、route identity、group identity 或输出合同任一预检失败时，provider dispatch 数量为零，并保留材料错误原因。
  - **需求**：FR-REV-005
验证：使用一个带禁止字段或错误 snapshot 的审查输入做预检。
  - **通过条件**：在 provider 启动前失败，存在明确 diagnostics，且没有 provider 进程或 provider attempt。
  - **失败条件**：先启动 provider 后才发现材料错误，或用第二次正式审查弥补。
  - **证据类型**：test、evidence

- [ ] **AC-REV-006**：同一个非 build-code 审查面每个 provider 只产生一次 public request；所有已派发 provider 进入 completed、failed 或 cancelled 后才应用 minimum_heterologous=1。
  - **需求**：FR-REV-006
验证：检查 group request identity、provider request 数量、member 终态和 group 汇总。
  - **通过条件**：没有第二个同范围 public request；终态收齐后，至少一个合法结果满足配置时才形成 eligible_for_handoff。
  - **失败条件**：某 provider 先完成就抢跑，或一次审查自动追加 challenge、retry、fallback。
  - **证据类型**：evidence、test

- [ ] **AC-REV-007**：failed、unavailable、partial、findings: [] 和 stage completion 在展示和证据中保持可区分。
  - **需求**：FR-REV-007、FR-QUALITY-012
验证：用一个失败 provider、一个合法空结果和一个完整结果回放 group。
  - **通过条件**：每个原始事实和 provenance 保留；空结果不生成通过或完成语义。
  - **失败条件**：失败被改写为空 findings、空 findings 被改写为 pass、或 partial 被隐藏。
  - **证据类型**：test、evidence、manual

- [ ] **AC-REV-008**：provider 没有固定总审查时限；健康并有新的 progress、cursor 或 session 的会话即使运行超过几分钟也继续等待，unverifiable 不直接失败。
  - **需求**：FR-REV-008
验证：运行长时健康 provider smoke，观察健康、进展和终态事实。
  - **通过条件**：没有正数固定总时限杀进程；进展会重置无进展计时。
  - **失败条件**：360000ms、固定 15 分钟总时限、单次 probe 超时或 unverifiable 直接触发失败。
  - **证据类型**：test、evidence

- [ ] **AC-REV-009**：只有明确 busy 且连续 15 分钟没有可验证 progress、cursor 或 session 变化时，才记录 PROCESS_STALLED/unavailable、取消并终止进程树。
  - **需求**：FR-REV-009
验证：使用可控的健康 busy 无进展 provider smoke，并检查时间线和清理结果。
  - **通过条件**：15 分钟无进展边界准确触发，raw/session/diagnostic/termination reason 全部可回指，且无自动 retry。
  - **失败条件**：健康会话有进展时被误杀，或无进展后只写 unavailable 而留下孤儿进程。
  - **证据类型**：test、evidence

- [ ] **AC-REV-010**：一次正式审查失败后不自动重复同一审查；诊断复试若有明确目的，必须独立记录并不能冒充正式 findings。
  - **需求**：FR-REV-009
验证：制造一个真实 provider 失败，检查正式 review attempts、diagnostic facts 和下游状态。
  - **通过条件**：正式审查只保留一轮；失败原因保持 unavailable/incomplete；同一任务仍可在后续修复后重新处理。
  - **失败条件**：以“直到成功”或“直到空 findings”为条件循环。
  - **证据类型**：evidence、test

- [ ] **AC-REV-011**：每个 provider finding 都有 fixed、rejected_invalid、accepted_risk 或 needs_human 处置和理由；非 build-code 不追加同范围复审，build-code 只有真实修复或审查对象改变后才允许一次 focused review。
  - **需求**：FR-REV-010
验证：逐项检查 review findings、Stage Agent disposition、finding_id 与 review/snapshot 绑定，以及 accepted_risk 的真实用户风险确认。
  - **通过条件**：所有 finding 都有真实处置；accepted_risk 同时绑定当前 finding、原始 review ref/hash、当前 snapshot/material revision 和用户确认；任一缺失时为 needs_human；重复 finding、无变化或无可信终态不被自动宣称完成。
  - **失败条件**：finding 无处置、accepted_risk 无绑定或无用户确认、自动追审直到空 findings，或用 review 结果替代用户/主 Agent判断。
  - **证据类型**：evidence、test

- [ ] **AC-REV-012**：build-code 每个 Phase 只允许一次初始独立审查；真实修复或审查对象改变后最多一次 focused review；全部 Phase 完成后一次 final integration review。
  - **需求**：FR-REV-011
验证：检查每个 Phase 的 review identity、触发原因、材料 snapshot、finding 处置和最终 integration review 记录。
  - **通过条件**：三类审查的对象和触发条件可区分，实际修复前后最多出现声明的调用次数；无变化、重复 finding 或不可用终态不触发额外审查。
  - **失败条件**：缺少初始或最终 integration review、修复后没有 focused review，或以“直到没有 finding”为理由无限追加。
  - **证据类型**：evidence、test

- [ ] **AC-REV-013**：方向审查在一次 public group request 内完成“独立重建方向 → 揭示当前选择 → 同请求内挑战”的盲审顺序。
  - **需求**：FR-REV-012
验证：检查 provider 收到的冻结材料、单次 request 的内部阶段事实和 group request identity。
  - **通过条件**：同一 public request 内保留三个顺序事实，且每个 provider 只出现一次 public request；没有第二次 challenge request。
  - **失败条件**：把当前选择先泄露给重建步骤、把 challenge 拆成第二个正式 request，或用第二轮审查弥补盲审顺序。
  - **证据类型**：evidence、test

- [ ] **AC-REV-014**：liveness 只在明确区分 alive、unverifiable、confirmed-dead 后才允许失败收束；confirmed-dead 必须有 PROCESS_DEAD 或 ORPHANED_BROKER、取消/清理和原始诊断证据。
  - **需求**：FR-REV-013
验证：回放健康进展、单次不可核验、owner/worker 确认死亡和仍存活进程四种状态。
  - **通过条件**：alive/unverifiable 不提前失败；confirmed-dead 才进入失败终态并清理仍存活进程；所有 liveness 和终止事实可回指。
  - **失败条件**：一次 probe 失败被当成死亡、健康会话被误杀、PROCESS_DEAD 无死亡依据，或清理后丢失 raw/session/诊断。
  - **证据类型**：evidence、test

- [ ] **AC-RACE-016**：同一 group identity + 材料 snapshot/hash 只派发一次；重复、replay、并发和旧 snapshot 结果不能覆盖当前 group 或提前形成 handoff。
  - **需求**：FR-RACE-015
验证：并发提交相同 dispatch、重复终态、取消后迟到结果和旧 snapshot 结果，检查调用计数、状态顺序和 facts 保留。
  - **通过条件**：provider 调用最多一次；终态单调收敛且取消优先；迟到/重复/旧结果只保留事实，不覆盖当前结果或阈值判断。
  - **失败条件**：重复派发、终态回退、取消后被迟到结果覆盖、旧材料结果进入新 group，或竞态导致提前交接。
  - **证据类型**：evidence、test

- [ ] **AC-PLAN-011**：每个 Phase 的 plan/task card 都明确设计任务、环境前置、测试或 not_applicable 理由、最终证据、完成记录和 STOP 条件。
  - **需求**：FR-PLAN-010
验证：检查 build-plan 产出的每个 Phase card。
  - **通过条件**：不存在只有实现目标而没有设计、环境和证据边界的 Phase。
  - **失败条件**：Phase 在没有环境或最终证据设计时进入 build-code。
  - **证据类型**：evidence、manual

- [ ] **AC-PLAN-012**：Phase 完成记录同时引用测试事实、覆盖限制和最终 evidence；环境未启动或测试未执行时只能记录 incomplete 或 not_applicable 的真实理由。
  - **需求**：FR-PLAN-011
验证：检查 tasks.md 与 facts.jsonl、index.json、verify.json、quality/evidence 之间的引用。
  - **通过条件**：每个 completed Phase 都能回指真实环境、测试和证据；缺失项不会被绿色状态掩盖。
  - **失败条件**：仅凭代码存在、单元测试通过、doctor 成功或文字摘要标记 completed。
  - **证据类型**：evidence、test

- [ ] **AC-EVID-012**：当前阶段、review、test、history 和 inventory 事实不覆盖四份当前材料，也不创建第五份当前材料；同一事实在 tasks、index 和 verify 中引用时 hash 和 snapshot 一致。
  - **需求**：FR-PLAN-011、FR-QUALITY-012
验证：做当前材料和证据 lineage 检查。
  - **通过条件**：引用可以回到唯一来源，原始失败事实仍存在。
  - **失败条件**：用新 projection 覆盖原始结果、使用过期 snapshot，或新增第二套当前 authority。
  - **证据类型**：evidence、test

- [ ] **AC-QUALITY-013**：review unavailable、test unknown、spec-analyze incomplete 或 provider partial 时，用户看到真实质量缺口；这些事实不能被改写成 pass，也不能降低后续 stage 的质量要求。
  - **需求**：FR-QUALITY-012
验证：注入缺失质量事实并检查 stage outcome、handoff 和用户可见状态。
  - **通过条件**：事实保留为 unknown/unavailable/incomplete，修复路径仍在同一任务内。
  - **失败条件**：空 findings、doctor、历史结果或用户确认被当作完整质量证明。
  - **证据类型**：evidence、manual

- [ ] **AC-SCOPE-014**：本需求实现后，caller-visible surface 仍是现有交互面；不出现独立 dashboard、独立页面、第五份当前材料或公共 review-loop/recovery 控制面。
  - **需求**：FR-SCOPE-013
验证：做范围和架构边界检查。
  - **通过条件**：所有新增行为都能回到 R-001 至 R-007 或已确认硬约束，并复用现有能力。
  - **失败条件**：为解决当前执行问题新增与用户无关的通用控制面或投机性长期能力。
  - **证据类型**：evidence、manual

- [ ] **AC-PERM-015**：只有真实用户可以完成最终确认；provider 或 Agent 不能代确认；未经现有权限允许的材料写入继续失败。
  - **需求**：FR-PERM-014
验证：人工检查确认来源和权限边界，并做一个无权写入尝试。
  - **通过条件**：确认 identity 是用户，权限错误可见且没有旁路写入。
  - **失败条件**：使用 Agent 推断、历史确认或 provider 输出代替用户确认。
  - **证据类型**：manual、evidence

- [ ] **AC-HAND-017**：build-spec 只在当前 spec 的产品行为、状态、FR、AC、非目标、延期和真实质量事实都被记录后交接 build-plan；build-plan 不得猜测缺失方向。
  - **需求**：FR-HAND-016、FR-SEQ-001
验证：检查 build-spec stage-end handoff 及下游入口条件。
  - **通过条件**：交接明确写出下游可消费内容、不能猜的内容和所有 incomplete/unavailable。
  - **失败条件**：绕过 spec、把 review/test 事实当方向、或把缺失材料当已完成。
  - **证据类型**：evidence、manual

## 12. 风险、未决与交接

### 延期与未决交接字段（当前 canonical handoff）

| id | current_status | owner | trigger | handoff | close_condition / 完成条件 |
| --- | --- | --- | --- | --- | --- |
| DEFER-001 | deferred | user / future make-decision | 用户提出独立 dashboard 或 UI 页面需求 | 回到 make-decision，重新确认范围和页面边界 | 新四材料完成并经用户确认 |
| DEFER-002 | deferred | build-spec / build-plan | 进入具体接口或 schema 设计 | build-code 只消费冻结材料，不自行补方向 | plan/tasks 给出实现边界和证据闭环 |
| OPEN-001 | resolved | build-plan / verify-code | 未来改变 minimum 或终态时序 | 重新读取 config snapshot 与当前材料 | 本任务 snapshot 仍记录 minimum=1、全终态后应用 |
| OPEN-002 | resolved | build-code / broker owner | 新 provider 或 profile identity 改变 | profile key preflight + broker result identity | 当前三个 build-plan profiles 可 dispatch 并有 identity |
| OPEN-003 | resolved | build-code / verify-code | direction runner 或 broker flow 改变 | 保持一次 group、一次 provider request、flow contract | direction-review.v1 order/reveal/terminal facts 可回指 |
| OPEN-004 | resolved | make-decision / build-plan | stage route 或 config snapshot 改变 | 更新 stage-scoped route facts，再刷新四份材料 hash | 当前 route matrix 与两份 config hash 一致 |

- **RISK-SPEC-001**：一个或多个配置 provider 仍可能真实 transport 失败或长时间 unavailable。
  - **受影响 ID**：PFACT-003、PFACT-006、FR-REV-004、FR-REV-006、FR-REV-007、AC-REV-004、AC-REV-006、AC-REV-007
  - **触发条件**：route 有效但 provider 没有可信公开终态，或 group 只有部分有效结果。
  - **后果**：下游可能具备配置允许的交接条件，但质量声称必须保持 partial/incomplete。
  - **缓解或 STOP**：保留全部 provider facts，不自动重试；没有合法结果时 STOP 当前 review handoff；有合法结果时只交接真实的 partial 状态。
  - **处理 Stage**：build-code、verify-code
  - **验证**：一次全配置 group smoke、终态汇总和最终质量报告。

- **RISK-SPEC-002**：健康型 15 分钟无进展边界可能收尾一个极慢但最终会成功的 provider。
  - **受影响 ID**：PFACT-005、FR-REV-008、FR-REV-009、AC-REV-008、AC-REV-009
  - **触发条件**：health probe 明确 busy，但连续 15 分钟没有可验证 progress、cursor 或 session 变化。
  - **后果**：provider 变成 unavailable，group 可能 partial；用户看到审查不完整。
  - **缓解或 STOP**：只使用明确 busy 和连续无进展的组合条件；保留 raw/session/诊断，显式取消并终止，不把结果改为空 findings。
  - **处理 Stage**：build-code、verify-code
  - **验证**：长时健康 smoke、无进展 smoke、进程树清理和 evidence lineage。

- **RISK-SPEC-003**：未来配置 route 改变可能使当前规格中列出的 provider 示例过时。
  - **受影响 ID**：PFACT-003、FR-REV-004、AC-REV-004
  - **触发条件**：配置新增、删除或替换 provider。
  - **后果**：如果继续使用旧 route，审查会失去真实性或误删 provider。
  - **缓解或 STOP**：每次正式审查使用当前配置 snapshot；本文列出的 provider 只代表对应 stage 的当前事实，不替代配置来源；identity 预检失败就零 dispatch。
  - **处理 Stage**：build-plan、build-code
  - **验证**：配置变化 contract test 和当前 route provenance。

- **RISK-SPEC-004**：minimum_heterologous=1 允许一个合法结果满足交接条件，但不代表真正完整的多源质量。
  - **受影响 ID**：PFACT-003、PFACT-004、PFACT-006、FR-REV-006、FR-QUALITY-012、AC-REV-006、AC-QUALITY-013
  - **触发条件**：一部分 provider failed/unavailable，至少一个 provider completed。
  - **后果**：任务可继续，但用户可能误以为所有异源意见都已获得。
  - **缓解或 STOP**：明确显示 group partial/incomplete、provider member 失败和 quality gap；不把阈值结果叫作 pass。
  - **处理 Stage**：build-spec、build-plan、verify-code
  - **验证**：部分成功 group 的用户展示、handoff 和最终报告。

- **RISK-SPEC-005**：为了处理可靠性而增加过多监控、状态或新记录，可能违反最小路径并引入第二套 authority。
  - **受影响 ID**：PFACT-008、PFACT-009、FR-SCOPE-013、FR-QUALITY-012、AC-SCOPE-014、AC-EVID-012
  - **触发条件**：修复方案新增公共控制面、重复 projection 或长期兼容层。
  - **后果**：维护面扩大，当前四份材料和原始事实失去清晰边界。
  - **缓解或 STOP**：优先复用现有交互、broker、四份材料和 evidence 目录；不能证明当前需求、已发生故障或宪法硬约束的能力不加入。
  - **处理 Stage**：build-plan、build-code、verify-code
  - **验证**：constitution-checklist、simplicity-guard 和 stage-end spec-analyze。

- **OPEN-SPEC-001**：具体的内部接口、schema 改法、Phase 数量和每个 Phase 的测试命令尚未在本规格确定。
  - **受影响 ID**：FR-REV-004、FR-REV-008、FR-REV-009、FR-PLAN-010、FR-PLAN-011、AC-REV-008、AC-REV-009、AC-PLAN-011、AC-PLAN-012
  - **owner**：build-plan
  - **影响**：过早在 spec.md 写入工程实现会制造第二份设计真相，或把未验证实现误当产品决定。
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：plan.md 和 tasks.md 为每个 Phase 给出唯一 owner、真实环境前置、测试 oracle、最终证据和 STOP 条件；在此之前不进入 build-code。

- **OPEN-SPEC-002**：独立 dashboard 或新的 UI 页面是否需要另行建设。
  - **受影响 ID**：FR-SCOPE-013、AC-SCOPE-014
  - **owner**：用户
  - **影响**：若未来决定建设，会改变页面范围、设计审查、权限和数据生命周期。
  - **处理 Stage**：后续独立 make-decision
  - **关闭条件或 STOP**：用户创建独立需求并从 make-decision 开始；当前任务永久保持 non-goal。

## 13. 业务影响与回归范围

### make-decision 与交互面

- **既有行为**：用户看到阶段问题和审查状态，但历史运行可能逐题提问或缺少真实等待。
- **本需求影响**：问题变为按独立决策轴成组展示；Grill 和 Clarify 的等待、回复、回流和失败边界可观察。
- **回归路径**：原始需求 → 三轮 Talk → 调研 → 方向审查 → Grill → decision draft → detail review → stage-end → 用户确认。
- **验收**：AC-SEQ-001、AC-INT-001 至 AC-INT-004、AC-HAND-017。

### review group 与用户结果

- **既有行为**：provider 可能出现重复调用、硬总时限或错误的部分结果语义。
- **本需求影响**：每个非 build-code 审查面一次 public group，全部终态后阈值判断，失败和空结果分开，健康进程不被固定时限误杀。
- **回归路径**：有效预检 → 全配置 provider dispatch → 单次 request → provider 终态 → group 汇总 → 失败/partial/eligible 展示。
- **验收**：AC-REV-004 至 AC-REV-014、AC-RACE-016、AC-QUALITY-013。

### build-plan/build-code Phase 证据

- **既有行为**：Phase 可能只有实现目标，环境尚未启动，tasks.md 没有最终测试和证据闭环。
- **本需求影响**：每个 Phase 先有设计和环境边界，后有测试、证据和完成记录；缺失时保持 incomplete。
- **回归路径**：spec handoff → 每 Phase 设计卡 → 环境 ready → 实现 → 测试 → evidence recorded → tasks completed → verify-code。
- **验收**：AC-PLAN-011、AC-PLAN-012、AC-EVID-012、AC-HAND-017。

- **可能受冲击的业务规则**：当前 route 配置、provider identity、既有调用方权限、历史事实只读性、四份材料 authority 和用户最终确认。
- **明确无影响**：本任务不改变业务领域数据、外部业务权限或独立产品页面；不删除历史 review/test/evidence。

## 14. 本阶段工作记录

### 研究

- **status**：skipped
- **reason**：当前 decision-log 已提供本规格所需的 route/provider identity、minimum_heterologous、member/group 状态、健康收尾、真实失败、非目标和阶段证据边界；F-001、F-003、F-010、F-013、F-014、F-015 已记录本任务所需的本地事实。没有新的当前接口、数据规则、兼容性、安全或运行事实需要外部研究。再次做同范围研究不会提高规格准确性，反而会重复既有事实。
- **carry_forward**：仅把这些已确认事实转成 PFACT、FR、AC、风险和交接，不把研究结论变成第二份 authority。

### Clarify

- **status**：executed
- **result**：resolved
- **trigger**：build-spec 审查指出原规格把 Clarify 标成 skipped，与 SCN-004、FR-INT-003、AC-INT-003 以及上游 handoff 的真实交互要求矛盾；因此必须完成一次真实的 Clarify 生命周期，而不能用“没有歧义”的文字代替。
- **batch**：一组独立问题，共 1 题；问题轴是“本次规格修复是否发现了需要回到 make-decision 的新产品方向歧义”。
- **lifecycle**：已完成 ask → wait → matching user reply → resume；没有把审查 finding、实现方案或细节工程问题混成用户的新方向选择。
- **user_reply**：`A。注意方案设计的时候要考虑：不要违反workflowhub宪法，不要降低workflowhub各个stage的执行质量`
- **resolution**：选择 A，确认当前修复继续留在 build-spec；没有新的产品方向变化，不回流 make-decision。附加约束作为本规格的质量边界保留，不能替代对 finding、constitution checklist、stage-end spec-analyze 和后续各 stage 质量事实的真实验证。
- **evidence**：quality/evidence/interactions/cfa8c6be026934135b5180b43111a10d230d2e2eb88398858406fbf9227932fa.json；该记录绑定 task、build-spec workflow run、询问卡、等待状态、用户原文、回复 hash、resume 和当时材料 snapshot。
- **derived_fact**：minimum_heterologous=1 只决定“全部 provider 终态之后能否交接”，不决定质量通过；未成功 provider 和 partial/incomplete 事实必须继续保留。

### Simplicity guard

- 复用现有 caller-visible surface、3rd-review broker、当前四份材料、现有 quality/evidence 目录和既有 stage skill。
- 不新增第二套交互、第二个 dispatcher、独立 review loop、第五份材料、公共 phase/recovery 控制面或 dashboard。
- 新增的只有当前故障已经证明必要的行为合同：成组等待、一次 public group、终态收敛、健康型无进展收尾、Phase 设计/环境/证据闭环。

### Product-direction review

- 原始问题是执行链和证据真实性，不是新业务功能。
- 最小可行范围是修正现有调用方可见交互和现有运行链；新增 dashboard、删除 provider、自动 fallback 或反复审查都不能解决根因。
- 关键前提是 provider 的真实公开终态和当前材料 snapshot 能被保留；若不成立，质量状态必须 incomplete/unavailable。
- 当前规格将质量审查和用户确认分开，避免把“有一个结果”误读为“审查通过”。

### UI design review

- **N/A — 当前任务没有新增独立 UI 页面或页面设计范围。** 规格只定义已有 caller-visible surface 必须能表达问题批次、等待、错误、部分结果、取消、证据和最终确认；如果未来新增页面，必须以独立需求重新触发设计审查。

## 15. WorkflowHub 宪法对齐

| 宪法边界 | 本规格落实 | 关联要求 |
| --- | --- | --- |
| F1、F2、F8、F10：薄核心、窄合同、简单、避免无收益自动化 | 复用现有 surface、broker、四份材料和 evidence；不增加公共控制面或无限 retry | FR-SCOPE-013、AC-SCOPE-014 |
| F3、Q1、Q2：四份材料决定当前工作，质量事实不等于推进许可证 | review、test、history、inventory 只保存事实；缺失保持 unknown/unavailable/incomplete | FR-QUALITY-012、FR-HAND-016、AC-QUALITY-013 |
| F4、Q3：独立审查与人类判断分开 | provider group 只返回 findings；finding disposition 和最终用户确认仍由主 Agent/用户完成 | FR-REV-006、FR-REV-010、FR-PERM-014 |
| F5、F9：谨慎加门、可证伪、禁止 false green | 全部终态后才判断交接；空 findings、doctor、partial 和 unavailable 都不被写成 pass | FR-REV-006、FR-REV-007、FR-QUALITY-012 |
| F6：外部执行真实记录 | 保留 route、provider、session、raw、health、终态、取消和终止原因 | FR-REV-004、FR-REV-008、FR-REV-009 |
| F7：用户确认和不可逆授权分离 | 最终确认来自真实用户；本阶段不提交、合并、推送或发布 | FR-PERM-014、FR-HAND-016 |
| S1、S2、S7、S8：复用和适配技能、一个 stage 一个 owner、保持可搬运 | 使用现有 make-decision/build-spec/wh-review/spec-analyze 合同；不创建第二实现或宿主专用流程 | FR-SEQ-001、FR-SCOPE-013 |

## 16. build-plan 交接

build-plan 可以直接消费本规格的 FR、AC、状态、风险、非目标和 OPEN-SPEC-001，但不能猜测未定义的工程实现。它必须继续保持以下产品边界：

1. 把每个 Phase 设计成“设计任务 → 环境前置 → 实现范围 → 测试/覆盖限制 → 最终证据 → tasks.md 完成记录”的闭环。
2. 为一次成功的预检和一次成功的全配置 provider group 安排可观察证据，同时为预检失败零 dispatch、provider 真实失败收尾、15 分钟健康型无进展、显式取消和孤儿进程清理安排失败证据。
3. 明确 build-code 每个 Phase 的审查预算是一次初始审查、真实修复或对象改变后的最多一次 focused review，以及全部 Phase 后一次 final integration review；不得把 build-spec、build-plan、verify-code 变成无限复审。
4. 为每个 Phase 指定真实环境启动和检查条件；环境未启动时不得把代码实现当作完成。
5. 在 plan.md/tasks.md 中记录 owner、测试技能、场景、oracle、fixture/service、证据路径、coverage limit 和 STOP 规则；这些是下游工程材料，不回写成 spec.md 的实现细节。
6. 进入 build-code 前，明确本规格中仍不可猜测的 OPEN-SPEC-001；如果无法形成唯一的设计和证据边界，保持 incomplete，不跳过。
