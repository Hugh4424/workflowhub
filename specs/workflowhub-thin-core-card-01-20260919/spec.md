# 功能规格：双任务拓扑与零机器推进门禁骨架

> 基于已接受的 `decision-log.md` D-001..D-009。本文件只定义需求、产品行为、状态、边界与验收；内部函数形态、文件改动清单、命令和任务拆分由 build-plan 决定。

- **功能名**：WorkflowHub 双任务拓扑与零机器推进门禁骨架
- **来源**：`specs/workflowhub-thin-core-card-01-20260919/decision-log.md` D-001..D-009；母 PRD CARD-01（只读）
- **状态**：build-spec 草案
- **content_profile**：`spec-content.v3`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `spec.md#速读卡30-秒`、`spec.md#1-问题与紧迫性`、`spec.md#2-背景目标与范围` | 两类任务走什么路径、为什么现在做、本卡负责到哪里 | M（主会话常驻） |
| `spec.md#3-用户场景与状态覆盖`、`spec.md#8-数据和生命周期`、`spec.md#5-功能需求`（TYPE/TOPO/MIG/PRD/FLOW/GATE/STATE/IFACE/REVIEW 九节，23 条 FR） | 用户可观察行为、状态覆盖、受控值与失败语义 | S（spec/plan 逐条对照） |
| `spec.md#9-兼容性预留`、`spec.md#产品边界接口蓝图`、`spec.md#迁移期与生效边界`、`spec.md#canonical-gate-inventory` | 受控值、类型到拓扑映射、阶段与记录面的产品边界 | B（build-plan 接线前） |
| `spec.md#11-验收标准`（23 条 AC） | 可执行验收 oracle、失败边界与证据落点 | P（build-code/verify-code） |
| `spec.md#12-风险未决与交接`、`spec.md#延期项`、`spec.md#当前质量缺口非方向歧义` | 风险、未决、延期与下游不得猜测的事项 | P（build-code/verify-code） |
| `spec.md#13-业务影响与回归范围` | 受影响业务规则与明确无影响范围 | S（回归设计时） |

> 本导航可再生，不是第五份权威材料。

## 速读卡（30 秒）

- **一句话需求**：用户在任务建立后人工声明任务类型，WorkflowHub 据此从真实入口执行规划或普通任务的固定拓扑，并在机器质量事实缺失时继续工作而不漂白事实。
- **核心改动点**：
  - 工作流定义公开两条可逐字核对的类型到拓扑映射，并让现有 build-prd 可作为规划旅程终点执行。
  - 流程清单从推进锁降为可核对参考；revision、snapshot、材料哈希和回执等机器事实不再是推进前置。
  - 保留推进中的人工确认与不可逆 Git 独立授权两道人为门。
- **最大影响面**：全部任务的阶段选择、推进语义、状态记录，以及后续 CARD-02..10 消费的阶段/材料接口。
- **验收信号**：两类任务均从真实入口按精确拓扑实跑；缺机器校验事实、缺固定轮次或清单步骤不阻断推进且缺失/失败仍被如实记录。
- **紧迫性与业务影响**：CARD-01 是后续九张卡的基座。拓扑不正确会让后续卡在错误接口上施工；继续把质量事实当许可证会重复已发生的流程阻塞。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Handoff |
| --- | --- | --- | --- | --- |
| R-001, R-010 | D-001, D-006, D-008 | FR-TOPO-001, FR-PRD-001..003 / AC-TOPO-001, AC-PRD-001..003 | current / 规划旅程 | 排除点逐处冻结给 build-plan |
| R-002 | D-001 | FR-TOPO-002 / AC-TOPO-002 | current / 普通任务旅程 | 无 |
| R-003 | D-003 | FR-TYPE-001..003 / AC-TYPE-001..003 | current / 类型声明与澄清 | 入口内部形态给 build-plan |
| R-004, R-005 | D-002 | FR-FLOW-001..003 / AC-FLOW-001..003 | current / 清单与历史事实 | 物理删除不属本卡 |
| R-006..R-008 | D-002 | FR-GATE-001..004 / AC-GATE-001..004 | current / 推进、人为门与规则事实 | CARD-06 承接删除 |
| R-009 | D-003 | FR-STATE-001..003 / AC-STATE-001..003 | current / 状态与记录 | CARD-08 承接旧任务 |
| R-011, R-012, R-015 | D-004 | FR-IFACE-001..003 / AC-IFACE-001..003 | current / 接口和卡间边界 | CARD-02 在蓝图上对齐 |
| R-013 | D-005 | RISK-001, RISK-002 | current / 去阻断漂白与全局拓扑风险 | build-plan/verify-code 消费 |
| R-006, R-013 | D-007, D-010 | FR-REVIEW-001 / AC-REVIEW-001 | current / review 普通步骤推进 | recorder currentness 不触发 workflow 回跳 |
| R-014 | D-005 | — | deferred / 实现与用例参数 | DEFER-001、DEFER-003 给 build-plan |
| R-002, R-010, R-014 | D-009 | FR-MIG-001 / AC-MIG-001 | current / 迁移期与生效边界 | activation 参数给 build-plan/verify-code |

## 1. 问题与紧迫性

现有骨架把固定轮次、清单完整性和多类机器认证混入推进条件，同时只认可正式五阶段，导致已经存在的 build-prd 不能作为规划旅程从真实入口执行。用户要解决的不是增加更多状态或校验，而是把“是否可以继续工作”“事实是否完整”“是否可以宣称完成”分开。

## 2. 背景、目标与范围

### 背景

当前正式阶段模型、portable workflow 与任务记录面已经存在，但规划旅程尚未从真实入口接通；本卡复用这些既有能力，只冻结最小的类型、拓扑、状态和推进边界。

### 目标

1. 用户人工声明 `{规划任务, 普通任务}` 之一后，系统选择唯一、固定、可读的对应拓扑。
2. 规划任务真实执行现有 build-prd 六步并在此终止；普通任务走完四个正式阶段。
3. 质量、历史、认证与清单事实继续记录，但不作为机器推进许可证。
4. 失败、缺失、不可用和未验证保持原貌；去阻断不得等于假绿。
5. 冻结后续卡可消费的窄接口蓝图，但不在本阶段决定内部函数、参数或文件改法。

### 范围内

- 两类任务的工作流定义、类型映射与真实入口可达性。
- make-decision 内任务类型的单一受控声明及读回/澄清行为。
- build-prd 的可执行接线、六步终止与失败语义，但不改变其六步内容或正式阶段身份。
- 流程清单参考语义、固定 Talk 轮次去阻断、stage completion 通用认证去阻断。
- 零机器推进门禁骨架、两道人为门、事实保真。
- 阶段/材料接口蓝图及与 CARD-02 的交接。
- 已完成的 recorder currentness 语义：仅当 workflow 正处 review step 且调用方明确调用 recorder 时，材料身份变化不得复用错误材料；下游修改不自动回跳 review。

## 3. 用户场景与状态覆盖

### SCN-001：发起规划任务

- **角色**：使用 WorkflowHub 的开发者
- **Given**：任务与 worktree 已建立；用户在 make-decision 中声明“规划任务”
- **When**：从真实入口推进任务
- **Then**：系统执行 `make-decision→build-prd`；build-prd 六步成功后任务收口，不出现代码阶段

### SCN-002：发起普通任务

- **角色**：使用 WorkflowHub 的开发者
- **Given**：任务与 worktree 已建立；用户在 make-decision 中声明“普通任务”
- **When**：从真实入口推进任务
- **Then**：若 task 身份、worktree 与记录落点的取得事件发生在 activation 后，系统执行 `make-decision→build-plan→build-code→verify-code`；若启动事件发生在 activation 前，即使之后恢复或跨过 activation，也按启动时五阶段完成。类型声明晚于启动事件不改变该归组；规划任务始终按规划拓扑处理

### SCN-003：任务类型无法识别

- **角色**：使用 WorkflowHub 的开发者
- **Given**：任务类型声明缺失、重复、冲突或不在受控值集合
- **When**：系统读回任务类型
- **Then**：结果为无法识别并向用户澄清；依赖类型的分支暂停，类型无关准备继续；系统不从任务大小、请求、文件名、历史或哈希推断。用户澄清后，原非法尝试作为历史事实保留，当前任务身份段形成恰好一条合法标签；重新读回成功后仅恢复依赖类型的分支

### SCN-004：机器事实缺失仍推进

- **角色**：正在推进任务的用户
- **Given**：revision、snapshot、材料身份/哈希/sha 或回执事实缺失、不可用或不完整
- **When**：用户继续当前任务
- **Then**：机器事实被如实记录但不阻断推进；系统不补造事实、不把缺失写成成功

### SCN-005：流程清单未完整或未按序执行

- **角色**：当前阶段执行者
- **Given**：某清单项不适用、被跳过、乱序，或发现需追加的新问题；固定 Talk 轮次未满足
- **When**：阶段继续工作
- **Then**：清单仍作为“本阶段该做什么”的核对参考，实际状态与理由被记录，但不因缺步、乱序或轮次数阻断

### SCN-006：build-prd 失败与重试

- **角色**：规划任务执行者
- **Given**：规划任务已经进入 build-prd
- **When**：六步中任一步失败
- **Then**：build-prd 记 `failed` 并保留真实原因；修复后可重入该步；任务不得滑入 build-plan、build-code 或 verify-code

### SCN-007：普通任务阶段失败与恢复

- **角色**：普通任务执行者
- **Given**：build-plan、build-code 或 verify-code 中任一阶段执行失败，或用户决定不再继续
- **When**：系统记录失败、修复后重试，或用户放弃任务
- **Then**：失败阶段记 `failed` 且原因保留，后续阶段不自动启动；修复后可重入该失败阶段，任务放弃则记 `abandoned`；等待外部前置条件时可记 `blocked`，条件解除后回到 `in-progress`，历史状态不被覆盖

### SCN-008：review 普通步骤前移

- **角色**：执行正式 workflow 的阶段执行者
- **Given**：流程到达 review step，已真实调用 recorder 并获得异源 advice；随后 disposition 修复材料
- **When**：流程继续执行后续 analyze/publish step
- **Then**：analyzer 看到修复后的材料；review 调用事件只来自 review step，不因 disposition 或材料修改再次调用。只有后来证明原 review step 未真实完成或执行错误，才修复重做该普通步骤

### SCN-009：人为门与物理不可行

- **角色**：任务用户
- **Given**：推进过程需要既定人工确认，或准备执行既有授权合同认定的不可逆操作
- **When**：对应动作到达人工边界
- **Then**：系统等待真实人工选择；不可逆操作需独立授权。若任务身份/worktree 根本无法建立，则因无记录落点而无法开始，这是一项物理事实而非质量门禁

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-002
- [x] **空态**：SCN-003（无任务类型声明）
- [x] **错误态**：SCN-006、SCN-007
- [x] **加载态**：N/A — 本卡无展示层和异步加载体验
- [x] **取消态**：SCN-007（任务放弃）、SCN-009（人工不确认或不授权时不执行对应动作）
- [x] **边界态**：SCN-003、SCN-004、SCN-005
- [x] **权限态**：SCN-009（不可逆操作独立授权）
- [x] **竞态**：SCN-008（材料变化时旧审查不得与当前材料混用）；更广 snapshot 变化语义延期 CARD-05

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：规划与普通任务的目标拓扑已经由用户确认。
  - **status**：`verified`
  - **证据或来源**：D-001、最终确认；母 PRD CARD-01
  - **关联**：FR-TOPO-001..002、AC-TOPO-001..002
- **PFACT-002**：任务类型受控值恰为 `{规划任务, 普通任务}`，唯一声明位于 decision-log 的任务身份段。
  - **status**：`verified`
  - **证据或来源**：D-003、DF-major-2 用户裁决
  - **关联**：FR-TYPE-001..003、AC-TYPE-001..003
- **PFACT-003**：现有 build-prd 已定义六步，但当前被八类阶段排除点挡在通用执行范围之外。
  - **status**：`verified`
  - **证据或来源**：RS-001、D-006
  - **关联**：FR-PRD-001..003、AC-PRD-001..003
- **PFACT-004**：build-prd 不是正式五阶段之一，且不得因此新增第六正式阶段。
  - **status**：`verified`
  - **证据或来源**：D-006、D-008；build-prd 自身边界
  - **关联**：FR-PRD-001..003、AC-PRD-001..003
- **PFACT-005**：流程清单和质量事实应保留为核对与记录，而非机器推进许可证。
  - **status**：`verified`
  - **证据或来源**：D-002、用户最终确认
  - **关联**：FR-FLOW-001..002、FR-GATE-001..003
- **PFACT-006**：审查复用的材料身份变化语义已经修复并进入当前基线。
  - **status**：`verified`
  - **证据或来源**：D-007 修复事实 `0f792a9b` + `33319b90`
  - **关联**：FR-REVIEW-001、AC-REVIEW-001
- **PFACT-007**：make-decision 的 `outline_closed` 仍为真实 `missing`，原因是 GUI 交互未经过 host interaction recorder。
  - **status**：`verified`
  - **证据或来源**：最终确认、OP-009、质量边界
  - **关联**：FR-GATE-001、AC-GATE-001
- **PFACT-008**：本卡不包含 UI 行为。
  - **status**：`not_applicable`
  - **不适用理由**：decision-log 的 UI applicability 为 `non_ui`；范围只有工作流、状态、记录与门禁骨架
  - **关联**：全部 FR/AC 的非 UI 路径

> 本规格不需要额外产品假设。仓内事实与 D-001..D-009 已足以定义行为，因此 conditional spec-research 为 `skipped`；原因是外部资料不会改变已确认方向或本仓现有契约。spec-clarify trigger=false；理由：没有实质材料歧义；开放方向性问题：0。未把 `outline_closed=missing` 当作答复或通过事实。

## 5. 功能需求

### 任务类型与拓扑（TYPE / TOPO）

- **FR-TYPE-001**：任务建立后，任务类型必须由人在 make-decision 内声明一次，允许值恰为 `规划任务` 或 `普通任务`。
  - **范围边界**：入口不新增类型参数；不按体量自动选择
  - **依据**：D-003、PFACT-002
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-TYPE-001、AC-TYPE-002
- **FR-TYPE-002**：系统必须从 decision-log 任务身份段中恰好一条固定任务类型标签读回受控值。
  - **范围边界**：不新建 store，不复制声明
  - **依据**：D-003、PFACT-002
  - **场景**：SCN-001、SCN-002、SCN-003
  - **验收**：AC-TYPE-001、AC-TYPE-003
- **FR-TYPE-003**：缺失、重复、冲突或非法声明必须返回无法识别并请求澄清，只暂停依赖类型的分支；真实答复后保留原异常尝试为历史事实，使当前任务身份段形成恰好一条合法声明，重新读回后恢复依赖类型的分支。
  - **范围边界**：禁止从任何旁路信息推断；不得并存多个当前标签
  - **依据**：D-003、PFACT-002
  - **场景**：SCN-003
  - **验收**：AC-TYPE-003
- **FR-TOPO-001**：规划任务的工作流定义必须逐字表达 `make-decision→build-prd`，无第三阶段。
  - **范围边界**：build-prd 为 portable workflow，不升为正式阶段
  - **依据**：D-001、D-006、PFACT-001
  - **场景**：SCN-001
  - **验收**：AC-TOPO-001
- **FR-TOPO-002**：activation 后新建普通任务的工作流定义必须逐字表达 `make-decision→build-plan→build-code→verify-code`；activation 前启动的普通任务按 D-009 的在途策略继续五阶段，不因晚声明类型、暂停或恢复而改组。
  - **范围边界**：不新增第三种任务类型或永久旅程；规划任务不受普通任务 activation 分组影响
  - **依据**：D-001、D-009、PFACT-001
  - **场景**：SCN-002
  - **验收**：AC-TOPO-002

### 迁移与激活（MIG）

- **FR-MIG-001**：正式入口成功创建 task 身份与 worktree、获得记录落点时，只在任务追踪目录追加冻结 activation cohort（pre/post），不冻结具体拓扑；cohort 的 schema/字段形态留 build-plan。人工选类型后：规划任务不论 cohort 均走 `make-decision→build-prd`；普通任务 pre-activation cohort 走启动时五阶段，post-activation cohort 走目标四阶段；暂停/恢复、晚声明或澄清不改变 cohort。activation 必须同时有 CARD-01 能力验收事实、正式 main/release 发布标识、正式入口实际消费该发布的执行证据；消费后由 CARD-01 owner 采集并关闭 activation 验收，CARD-10 只核对事实存在；CARD-06/CARD-10 均不替代首次启用。
  - **范围边界**：不迁移在途任务，不保留两套永久拓扑
  - **依据**：D-009
  - **场景**：SCN-002、SCN-007
  - **验收**：AC-MIG-001、AC-TOPO-002

### 规划旅程终点（PRD）

- **FR-PRD-001**：规划任务必须能从真实入口进入现有 build-prd，并完成现有六项内容责任：load-parent-decision、draft-outline-and-task-map、confirm-map-and-conditional-design、expand-single-prd、confirm-final-displayed-draft、report-facts-and-handoff。
  - **范围边界**：不改变六项内容与内部质量要求；D-002 的去顺序锁同样适用——清单提供推荐依赖顺序，但缺步/乱序本身不作推进 gate；只有六项完成责任与各自可观察结果齐备才可 succeeded，未完成保持真实非成功状态
  - **依据**：D-006、D-008、PFACT-003
  - **场景**：SCN-001、SCN-006
  - **验收**：AC-PRD-001
- **FR-PRD-002**：六步完成时 build-prd 状态记 `succeeded`，其产出与执行事实写入任务追踪记录，规划任务随即收口。
  - **范围边界**：不触发正式五阶段通用 completion 认证，不进入任何代码阶段
  - **依据**：D-008、PFACT-004
  - **场景**：SCN-001
  - **验收**：AC-PRD-002
- **FR-PRD-003**：任一步失败时 build-prd 状态记 `failed` 并记录真实原因；修复后可重入失败步骤，且不得转入代码阶段。
  - **范围边界**：失败不是切换旅程的信号
  - **依据**：D-008、PFACT-004
  - **场景**：SCN-006
  - **验收**：AC-PRD-003

### 清单、门禁与事实保真（FLOW / GATE）

- **FR-FLOW-001**：各阶段流程清单必须保留为核对参考，但缺步、跳过、乱序或追加问题不得成为推进阻断。
  - **范围边界**：不删除清单；不要求凑步
  - **依据**：D-002、PFACT-005
  - **场景**：SCN-005
  - **验收**：AC-FLOW-001
- **FR-FLOW-002**：固定 Talk 轮次与 stage completion 通用认证不得作为任一阶段推进前置，实际轮次、缺项和历史失败仍须记录。
  - **范围边界**：不改造成“什么都不记录”
  - **依据**：D-002、PFACT-005
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-FLOW-002
- **FR-FLOW-003**：去阻断前已经发生的阻断记录与去阻断后的推进记录必须同时保留可查；原有 `missing`、`unavailable`、`failed` 或其它非成功结论不得因新路径可推进而被覆盖或改写为 pass。
  - **范围边界**：新行为只改变推进语义，不历史更正原记录
  - **依据**：D-002、D-005、PFACT-005
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-FLOW-003
- **FR-GATE-001**：以下封闭集合的机器/规则谓词不得作为推进许可证：outcome/confirmation 字节哈希、聚合 decision ref/hash、snapshot 新鲜度、review/acceptance 材料 sha256、receipt 身份/命名空间、step completeness/顺序、revision 绑定、review、test、evidence、history、inventory、complexity。每个实际阻断谓词必须在 build-plan 从 RS-001 的 24 项现状清单逐项冻结其 consumer、适用转移和缺失行为；发现遗漏只能追加具体谓词，不能用开放式“等”替代。其真实状态仍须记录。
  - **范围边界**：`outline_closed=missing` 保持 missing，不阻断同任务工作，也不得宣称质量完成
  - **依据**：D-002、PFACT-005、PFACT-007
  - **场景**：SCN-004
  - **验收**：AC-GATE-001
- **FR-GATE-002**：系统允许的人工阻断类别必须恰为两类：A）当前阶段或 portable workflow 既有合同明确要求的推进确认对话；B）宪法与既有授权合同认定需独立授权的不可逆操作。当前合同基线以仓库现行 `CONSTITUTION.md` F7 与公共 authorize 合同原文为准；本规格不复制其枚举、不重新定性确认点或动作。build-plan 的 inventory 必须读取并引用该现行文本，记录完整 A/B 项及不适用理由。A/B 门等待真实答复时阶段保持 `in-progress` 并追加 waiting 交互事实，不新增 pending 状态；拒绝/未授权时具体动作不执行、阶段仍 `in-progress` 供重试或安全工作，用户终止任务才记 `abandoned`；批准后只执行绑定动作并继续原阶段。
  - **范围边界**：不新增第三类人为门；阶段/工作流确认不顺带授权不可逆操作；review、test、evidence 或质量缺失不触发新人工准入
  - **依据**：D-002、D-008、CONSTITUTION F7
  - **场景**：SCN-001、SCN-002、SCN-008
  - **验收**：AC-GATE-002
- **FR-GATE-003**：任务身份/worktree 无法建立时应明确报告没有记录落点；该物理不可行事实不得扩展成对已建立任务的额外质量门禁。当前材料字节本身不可读时不能执行依赖其内容的动作，应报告具体读取失败并允许修复后重试；这与“材料身份/hash 等辅助事实缺失仍可推进”不同，也不得被表述为第二个质量 gate。
  - **范围边界**：区分无记录落点、内容物理不可读、辅助机器事实缺失和不可逆操作授权四类事实；decision-log 已按用户裁决统一口径
  - **依据**：D-002、D-003、decision-log DF-major-5 处置事实
  - **场景**：SCN-004、SCN-009
  - **验收**：AC-GATE-003
- **FR-GATE-004**：迁移表冻结、并行声明、接口蓝图冻结等规则类要求必须作为事实记录与验收核对项；未做或失败时验收结果保持失败/缺失，但同任务工作与修复继续，不得成为推进前置。
  - **范围边界**：本卡不定义迁移表或并行声明的具体格式，也不替 CARD-03/CARD-06 执行其内容
  - **依据**：D-002、D-004
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-GATE-004

### 状态、接口与审查（STATE / IFACE / REVIEW）

- **FR-STATE-001**：阶段状态只允许 `not-started`、`in-progress`、`succeeded`、`failed`、`blocked`、`unverified`、`abandoned` 七个值。
  - **范围边界**：build-prd 可使用 succeeded/failed，但这不改变正式阶段集合
  - **依据**：D-003、D-008
  - **场景**：SCN-001、SCN-002、SCN-006
  - **验收**：AC-STATE-001
- **FR-STATE-002**：当前材料只使用 decision-log、spec、plan、tasks 四份；任务类型在 decision-log，材料在 worktree，执行事实在任务追踪目录；不得新增第五份材料或第二状态机。
  - **范围边界**：历史记录只读，不替代当前材料
  - **依据**：D-003、D-004
  - **场景**：SCN-001..009
  - **验收**：AC-STATE-002
- **FR-STATE-003**：所有正式阶段与 build-prd 共用最小状态转换语义：创建后 `not-started`，开始执行为 `in-progress`；满足成功行为才为 `succeeded`；执行失败为 `failed`；缺验证为 `unverified`；仅等待可识别的非机器外部依赖时可为 `blocked`，且必须记录依赖方与解除条件；用户终止任务为 `abandoned`。`failed`/`blocked` 修复或条件解除后可重入原阶段，后续阶段不得因失败自动启动，历史状态与原因保留。revision/snapshot/material identity/review/test/evidence 等机器或质量事实缺失不得包装为 blocked；材料字节不可读只让依赖内容的具体动作 failed 并可重试，不把整个阶段 blocked。
  - **范围边界**：不新建状态值或第二状态机；不规定内部函数实现
  - **依据**：D-002、D-003、D-008
  - **场景**：SCN-006、SCN-007
  - **验收**：AC-STATE-003
- **FR-IFACE-001**：阶段/材料接口蓝图必须向后续卡公开以下产品契约：任务类型受控值、类型到拓扑映射、正式阶段集合与 build-prd portable 身份的区分、七值状态、材料/执行事实归属、推进事实与完成事实的区分。
  - **范围边界**：蓝图冻结是验收事实，不是推进门禁
  - **依据**：D-004
  - **场景**：SCN-001、SCN-002、SCN-004
  - **验收**：AC-IFACE-001
- **FR-IFACE-002**：make-decision 开工时必须记录 owner=本 task 主会话、合并责任=本卡先冻结阶段/材料接口且 CARD-02 在其上对齐、验收责任=本卡 verify-code、CARD-10 只做验收事实存在性核对与抽验。该指派事实属于非阻断规则核对项；未记录会使验收失败，但不停止同任务修复。
  - **范围边界**：CARD-10 不逐条重跑本卡 AC
  - **依据**：D-004
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-IFACE-002
- **FR-IFACE-003**：母 PRD 与兄弟卡材料在本卡全程只读，规划与普通两条真实旅程均不得移动、删除或改写这些材料，也不得触发母任务 close。
  - **范围边界**：只约束本卡副作用，不为旧任务迁移新增兼容机制
  - **依据**：D-004、R-015
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-IFACE-003
- **FR-REVIEW-001**：所有正式 stage 的每个既有 review step 在真实调用 recorder 并记录 advice 或真实失败事实后，必须按 manifest 前移；finding disposition、repair 或 material edit 不自动回跳该 review step，也不为 clean/pass 再调用。仅当 workflow 正处 review step 且明确调用 recorder 时，D-007 currentness 要求材料身份变化不得复用错误材料；只有该 review step 本身未真实完成或执行错误才修复重做。
  - **范围边界**：不同命名/scope 的 direction/detail、phase/integration、verify review 仍是既有独立步骤；不改底层 recorder material guard
  - **依据**：D-007、D-010、PFACT-006
  - **场景**：SCN-008
  - **验收**：AC-REVIEW-001

## 6. 模块划分

### 任务声明与拓扑

- **负责什么**：把人工声明的受控任务类型映射到唯一工作流定义。
- **对外提供什么**：可逐字读取的任务类型与阶段序列。
- **依赖谁**：当前 decision-log 与既有工作流定义。
- **测试边界**：AC-TYPE-001..003、AC-TOPO-001..002。

### Portable planning workflow

- **负责什么**：让规划任务执行现有 build-prd 六步并按 succeeded/failed 收口。
- **对外提供什么**：六步执行事实、产出引用和终止状态。
- **依赖谁**：规划拓扑与现有 build-prd 合同。
- **测试边界**：AC-PRD-001..003。

### 推进与事实记录

- **负责什么**：区分继续工作、事实记录与完成声明，保留两道人为门。
- **对外提供什么**：非阻断的真实质量事实与阶段状态。
- **依赖谁**：四材料、任务追踪记录面和人工选择。
- **测试边界**：AC-FLOW-001..003、AC-GATE-001..004、AC-STATE-001..003。

## 7. 关键实体

- **任务类型声明**：
  - **定义**：一个任务在 make-decision 内由人写下的类型选择。
  - **字段和约束**：值恰为 `规划任务` 或 `普通任务`；固定标签恰好一条。
  - **关系**：决定任务拓扑；后续阶段只读。
- **任务拓扑**：
  - **定义**：一种任务类型对应的静态阶段序列。
  - **字段和约束**：规划两项、普通四项，顺序固定。
  - **关系**：由类型选择，经真实入口执行。
- **阶段/工作流事实**：
  - **定义**：一次阶段或 portable workflow 执行的当前状态与结果事实。
  - **字段和约束**：状态属于七值集合；失败/缺失不得写成 succeeded。
  - **关系**：写入任务追踪目录，不改变正式阶段身份。
- **审查材料身份**：
  - **定义**：workflow 正处 review step 并明确调用 recorder 时，判断可复用记录是否针对本次材料的 currentness 事实。
  - **字段和约束**：显式 recorder 调用不得复用错误材料；下游材料修改不自动产生新的调用。
  - **关系**：只约束本次 recorder 调用的复用，不触发 workflow 回跳。

## 8. 数据和生命周期

### 任务类型声明

- **粒度**：每个任务一条声明。
- **允许值**：恰为 `规划任务`、`普通任务`。
- **位置与形态**：decision-log 的“任务身份”段中固定标签 `- **任务类型**：<值>` 恰好一条。
- **读回结果**：合法唯一值或“无法识别”；不得返回推断值。
- **生命周期**：在 make-decision 内由人声明；后续阶段只读消费，不另设副本。

### 拓扑声明

- **粒度**：每种任务类型一条工作流定义分支。
- **规划任务**：`make-decision→build-prd`。
- **普通任务**：`make-decision→build-plan→build-code→verify-code`。
- **约束**：必须在工作流定义中静态可读，不只存在于说明文档，也不由启动逻辑临时拼接。

### 阶段和工作流状态

- **允许值**：七值窄集合。
- **更新语义**：执行开始可记 `in-progress`；满足该阶段/工作流自身成功行为才记 `succeeded`；真实执行失败记 `failed`；缺验证记 `unverified` 而非 succeeded。
- **build-prd 特例**：可记录 succeeded/failed 任务事实，但仍保持 portable workflow 身份。
- **历史语义**：当前变化追加事实；旧失败、missing、unavailable、incomplete 不得覆盖或漂白。
- **执行终点与质量完成分离**：阶段/workflow 只使用既有七值状态。末阶段的核心行为已完成时可记 `succeeded`，即使逐项 quality facts 仍有 `missing/unavailable/incomplete`；`unverified` 只在该阶段自身声明的验证行为尚未执行时使用，不代表另一个 task final state。质量不新增状态机、字段或 task-level 状态：既有 quality facts/predicates 是唯一投影，owner 为产生对应 review/test/evidence/规则事实的当前 stage，落点为既有 quality/facts 与 evidence 记录。适用事实有缺口时不得宣称质量完成，但可在执行终点后补验证；补齐或证实失败只追加/更新对应质量事实，不改写已完成的核心执行历史、不启动后续阶段。“任务收口”只指拓扑无后续阶段；质量完成是适用完成判据均有真实事实支持的结论。

### 数据归属

- **当前材料**：认证 worktree 中同一 task 的四份材料。
- **执行事实**：任务追踪目录中的 task/facts/quality/index 等既有记录面；task 创建/获得记录落点时追加 activation cohort 事实，具体 schema/字段由 build-plan 定；非法、重复、冲突或缺失的任务类型尝试也作为追加执行事实记录在该目录，不写回任务身份段成为第二条当前标签。
- **禁止**：第五份当前材料、第二状态机、用历史 review/receipt/snapshot 替代当前材料。

## 9. 兼容性预留

- **既有消费方**：activation 前已启动普通任务仍按启动时五阶段跑完；activation 后新建普通任务消费目标四阶段序列；四材料与任务追踪记录面的职责不变。
- **命名预留**：不新增第三种任务类型、阶段状态或 public command；后续卡沿用本规格稳定 ID 和接口语义。
- **容器预留**：复用既有工作流定义与任务事实记录面，不建平行容器。
- **状态预留**：七值集合保持封闭；build-prd 使用同一状态词汇但不获得正式阶段身份。
- **扩展边界**：旧任务迁移归 CARD-08；本卡不承诺历史任务自动适配。

### 迁移期与生效边界

- **current_authoring_lifecycle**：本 task 作为 pre-activation 普通任务按启动时五阶段 `make-decision→build-spec→build-plan→build-code→verify-code` 跑完；当前 build-spec 是该在途 lifecycle 的正式阶段，不倒灌为目标新任务拓扑的一部分。
- **target_new_task_topology**：D-001 目标保持不变；人工选为规划任务时不论 cohort 都使用 `make-decision→build-prd`；普通任务按 cohort 选择五/四阶段。
- **activation_condition**：CARD-01 verify-code 通过只证明能力级预演；必须再满足变更已进入正式 main/release 且正式入口实际消费该发布，消费时形成 activation。
- **in_flight_policy**：task 创建/获得记录落点时在任务追踪目录冻结 pre/post cohort，但不冻结拓扑；选型后规划任务始终走规划拓扑，普通任务 pre cohort 走旧五阶段、post cohort 走目标四阶段；暂停、恢复、晚声明和澄清不改变 cohort。
- **retirement_condition**：正式入口消费后由 CARD-01 owner 采集并关闭 activation 验收事实；CARD-06 退休旧基础设施；CARD-10 只核对该事实存在并作总体完成宣称，不重复内容验收。后二者均不决定首次启用。

### 产品边界接口蓝图

| 接口 | 输入 | 可观察输出 | 失败/缺失语义 | Consumer |
| --- | --- | --- | --- | --- |
| 正式入口 | 仓库现有唯一官方任务创建入口（RS-001：现有任务创建入口（RS-001 所指入口）） | task 身份、worktree、记录落点、cohort 事实 | 测试夹具直调不得冒充真实入口；DEFER-001 只允许选择内部分发形态，不改变入口身份 | 用户、拓扑选择 |
| 类型声明/读回 | 当前 decision-log | 规划任务、普通任务或无法识别 | 无法识别触发澄清，只暂停类型相关分支 | 拓扑选择、后续阶段 |
| 类型→拓扑 | 已识别任务类型 | 一条规范化顶层拓扑投影 | 不得自动猜测或动态拼接；重试/恢复与 build-prd 六步留在嵌套执行历史，不算新增顶层阶段 | 真实入口、状态展示 |
| 正式/portable 身份 | 工作流定义与任务类型 | 正式五阶段集合、build-prd portable 身份 | build-prd 可执行且有状态，但不得进入正式阶段集合 | runtime、后续卡 |
| 七值状态 | 阶段/workflow 执行事实 | 七值之一、原因与历史轨迹 | 失败/阻塞不自动启动后续阶段；可修复重入或放弃 | 全部阶段、build-prd |
| 材料/事实归属 | 四材料与任务追踪记录面 | 当前产品材料、追加执行事实 | 不建第五材料/第二状态机；历史不替代当前 | CARD-02、CARD-08 |
| 推进/完成分离 | 当前材料、七值阶段状态与逐项 quality facts | 执行终点事实、独立完成判据结论 | 缺质量/规则事实不阻断；缺项时不得宣称质量完成 | 全部阶段、CARD-10 |
| portable workflow 执行 | 规划拓扑进入 build-prd | 六步事实及 succeeded/failed | 失败可重入，不进入代码阶段 | 规划任务用户 |
| 人工边界 | A 类既有推进确认点；B 类既有授权合同认定的不可逆操作 | 真实选择或独立授权 | 拒绝、未答不伪造成同意；其它原因不得形成第三类人工准入 | 阶段/workflow 执行、授权动作 |
| 审查重派 | 当前材料身份 | 复用当前审查或重新派发 | 材料变化时旧审查不可复用；不影响推进 | 全部审查轨 |

### Canonical gate inventory

机器事实覆盖边界冻结为“RS-001 逐项谓词 × 以下转移组”核对：每个具体谓词必须记录现有 consumer、所属封闭类别、适用转移、缺失/无效时行为；每格必须记录 `missing/invalid/present/not_applicable + reason`，其中任何 `missing/invalid` 都不得阻断安全工作，但不得支持质量完成声明。

| 转移组 | 必核机器事实列 | 不适用规则 | 验收引用 |
| --- | --- | --- | --- |
| 当前在途五阶段的四次阶段转移 | revision、snapshot、material identity/hash/sha、receipt、review、test、evidence、history、inventory、complexity | 仅事实对该阶段无 producer/consumer 时可 N/A，并写理由 | AC-GATE-001 |
| activation 后普通四阶段的三次转移 | 同上十类 | 同上 | AC-GATE-001 |
| 规划 make-decision→build-prd 与 build-prd 六步内部转移/终点 | 同上十类 | 同上；正式五阶段 completion 对 build-prd 为 N/A | AC-GATE-001 |
| 失败后的原阶段重入、blocked 解除、质量补验证 | 同上十类 | 同上 | AC-GATE-001、AC-STATE-003 |

人为门 coverage boundary 冻结为 A/B 两类，但具体 inventory 以 build-plan 执行时仓库现行 `CONSTITUTION.md` F7 与公共 authorize 合同的完整原文为唯一枚举来源，并把引用文本/版本、每项适用路径和不适用理由写入计划；不得由本规格复制一个可能漂移的清单。除合同原文明列项外，阶段转移、日常执行与 review/test/evidence 派发不得出现人工准入。

### build-plan 必须逐处冻结的排除名单候选

RS-001 已给出八处候选责任面：`step-manifest`、`stage-context`、`stage-acceptance-policy`、`completion-predicates`、`stage-handlers`、`task-kernel-implementation`、`stage-agent-bridge`、`dispatch-component`。本规格只冻结以下需求边界：

1. build-plan 必须逐处核对每个候选是否阻止 build-prd 从真实入口执行、其 consumer 和最小变更范围；
2. 清点结果必须覆盖八处，不得把“某文件存在”当作“接线已完成”；
3. 可执行放行不得把 build-prd 加入正式五阶段、不得改其六步内容、不得新建 dispatcher/store/public command；
4. 若 build-plan 证明某候选不需要修改，应写可复核理由；若发现新的阻断点，可追加清单并说明来源；
5. 此清点与冻结是后续验收依据，但未完成时记为验收缺口，不作为当前 build-spec 或同任务修复的推进门禁。

> 上述是 build-plan 的边界与核对义务，不是本规格对具体文件、函数或补丁形态的实现决定。

### 需求与实现建议的分界

本节防止下游把非约束性建议误当作已由用户选择的内部设计。

#### 需求（必须满足）

- 两条拓扑、受控值、七值状态、六步终止/失败语义、零机器推进门禁、两道人为门、事实保真、材料变化重派，均为产品契约。
- 排除名单八处候选必须在 build-plan 逐处冻结，真实入口必须实跑验收。

#### 实现建议（非需求，不锁死）

- 优先复用现有工作流定义、类型 reader、build-prd 包和任务事实记录面，以最小接线完成目标。
- 优先将“是否可执行”与“是否正式阶段”表达为不同概念，而不是扩大正式阶段集合。
- 优先使清单/认证产生记录结果而不是布尔推进许可。

build-plan 可在不改变上述可观察行为的前提下选择内部接口、函数边界、参数/配置形式和测试夹具；不得把这些建议反向解释为已获用户选择。

## 10. 明确不做与默认必须成立

### 明确不做

1. 按任务体量自动分流任务类型（D-003/D-004）。
2. 新增页面、仪表盘、前端组件或 UI 设计路径（D-004）。
3. 物理删除 revision/snapshot/material/hash/receipt 等校验机器；归 CARD-06（D-002/D-004）。
4. 旧任务兼容、迁移与最小接续；归 CARD-08（D-004/D-005）。
5. 改写文档权威与单一事实源细则；归 CARD-02（D-004）。
6. 改造五阶段子代理方法与并行规则；归 CARD-03（D-004）。
7. 建设真实验收标准机制或有条件 TDD；归 CARD-04（D-004）。
8. 替换整体审查链、定义 snapshot 变化重派、做工具对比或 go/no-go；归 CARD-05（D-007）。
9. 改造 make-decision 头脑风暴机制；归 CARD-07（D-004）。
10. 修改 build-prd 六步内容或为其产出质量背书（D-005/D-006/D-008）。
11. 把 build-prd 升为第六正式阶段（D-006/D-008）。
12. 在 build-spec 决定入口分流的参数/配置形态和验收 fixture/命令（D-005）。
13. 修改或删除母任务及兄弟卡的 decision-log、母 PRD 或其它材料；触发母任务 close。本 task 自身 decision-log 仍按其 owner 职责维护。
14. 新建第五份材料、第二状态机、第二 dispatcher、第二 review system、第二 store、额外 public command 或 gate。

### 默认必须成立

- `outline_closed=missing` 是真实质量缺口：继续保留，不伪造 aggregate、不改写为 passed，也不作为同任务推进阻断（FR-GATE-001 / AC-GATE-001）。
- unavailable、unknown、incomplete、failed、unverified 各按真实含义保存，不可归并成 succeeded（FR-STATE-001 / AC-STATE-001）。
- 阶段/workflow 确认与不可逆操作授权是不同事实；本 build-spec 草案本身不授予任何不可逆操作权限，具体授权对象沿用宪法和既有授权合同（FR-GATE-002 / AC-GATE-002）。

## 11. 验收标准

- [ ] **AC-MIG-001**：四阶段只在正式激活后用于新任务
需求：FR-MIG-001
验证：本卡 verify-code 先在安全环境做能力级预演，证明 cohort×类型映射可执行但不宣称 activation；发布后由 CARD-01 owner 记录正式 main/release 标识、正式入口消费证据和 activation 时点，并创建/恢复矩阵样本：pre cohort 普通任务跨 activation 恢复、pre cohort 晚声明普通、pre cohort 晚声明规划、post cohort 普通、post cohort 规划。
通过：仅能力预演或仅发布时仍未激活；入口实际消费时形成唯一 activation；cohort 在创建/记录落点时追加保存且暂停/恢复/晚声明不改变；两类规划样本均走 `make-decision→build-prd`，pre 普通样本均走旧五阶段，post 普通样本走目标四阶段；CARD-01 owner 关闭 activation 验收，CARD-10 只核对事实存在。
失败：能力预演冒充 activation、缺入口消费证据即启用、以类型声明时点替代 cohort、规划任务被 cohort 强制走普通路径、普通任务跨 activation 改道、CARD-10 重做内容验收，或等 CARD-06/CARD-10 才首次启用。
证据：能力级预演引用；发布后由 CARD-01 owner 补充发布标识、入口消费记录、activation 时点、cohort 追加事实、五类样本顶层拓扑投影和 activation 验收关闭事实。

- [ ] **AC-TOPO-001**：规划拓扑精确且可执行
需求：FR-TOPO-001
验证：从真实入口创建任务，在 make-decision 中人工声明“规划任务”，读回工作流定义和实际阶段轨迹。
通过：声明与执行事件导出的规范化顶层拓扑投影均恰为 `make-decision→build-prd`，build-prd 可执行且无第三阶段；build-prd 六步及失败重试保留在嵌套历史，不计为顶层阶段。
失败：顶层投影出现 build-plan、build-code、verify-code 任一阶段；声明与投影不一致；把内部步骤/合法重试误算成新增阶段；或只有静态文件存在而无真实执行。
证据：真实入口执行记录、阶段轨迹、工作流定义读回。

- [ ] **AC-TOPO-002**：普通任务拓扑精确且可执行
需求：FR-TOPO-002
验证：能力预演阶段从真实入口的安全环境创建 post-cohort 等价样本，在 make-decision 中人工声明“普通任务”，执行到旅程终点并读取顶层拓扑投影、verify-code 阶段状态、逐项 quality facts 和后续阶段轨迹；发布后由 AC-MIG-001 的 CARD-01 owner 用正式入口消费事实关闭 activation 部分。
通过：能力预演的规范化顶层投影恰为 `make-decision→build-plan→build-code→verify-code`；verify-code 核心行为完成后记 succeeded，验证事实进入任务追踪记录且无后续阶段。若适用 quality facts 缺失，仅对应 facts 保持 missing/unavailable/incomplete 并可继续补验证，不创建 task 质量状态、不改变拓扑终点；发布后 activation 关闭事实另由 CARD-01 owner 补齐。
失败：activation 前在途任务被中途改道；activation 后新任务缺少任一阶段、顺序错误、进入 build-prd、只有静态定义没有真实执行、verify-code 成功后继续出现后续阶段，或缺质量事实/unverified 被写成 task 质量完成。
证据：真实入口执行记录、阶段轨迹、工作流定义读回、verify-code 结果、任务状态与无后续阶段事实。

- [ ] **AC-TYPE-001**：受控值声明与唯一读回
需求：FR-TYPE-001、FR-TYPE-002
验证：从不带任务类型参数的正式入口分别建立两个任务，再在 make-decision 使用两个合法值创建当前 decision-log 声明并读回；另以入口类型参数/默认值探针验证其不被接受或消费。
通过：任务建立前入口不接受或消费类型路由参数/默认值；每个任务只在 make-decision 形成一条固定标签声明，且读回结果与人工选择完全一致。
失败：入口新增或消费类型参数/默认值、允许第三个值、产生多份当前声明/store，或读回结果与声明不一致。
证据：任务材料与类型读回结果。

- [ ] **AC-TYPE-002**：不存在按体量自动分流
需求：FR-TYPE-001
验证：用两个体量显著不同但尚未声明类型的任务进入 make-decision。
通过：两者均停留在人工类型选择/声明处，任务体量不改变类型。
失败：任一任务被代码按体量、文本、文件名、历史或哈希自动分类。
证据：两次真实入口交互与任务材料。

- [ ] **AC-TYPE-003**：非法或不唯一声明触发澄清
需求：FR-TYPE-002、FR-TYPE-003
验证：覆盖缺失、重复、冲突、非法值四种材料；每种情况均完成一次真实澄清，形成合法当前声明并重新读回，同时观察类型相关与类型无关工作。
通过：四种情况均先返回无法识别；类型相关操作（选择顶层拓扑、进入 build-prd/build-plan 及其类型专属内容）暂停，且不得启动任何后续 stage；类型无关准备（读取当前四材料、记录 cohort/诊断事实、检查 worktree/任务身份）继续。答复后原异常尝试保留为历史事实，当前任务身份段恰好一条合法标签，重新读回后只恢复类型相关分支；该澄清属于既有推进确认对话，不形成第三类阶段门。
失败：系统猜测类型、静默选择默认值、阻断上述全部类型无关准备、在类型未知时启动类型相关 stage、留下多个当前标签、覆盖异常历史，或答复后仍无法恢复依赖类型的分支。
证据：初次与修正后读回结果、澄清交互、任务身份段、异常历史与恢复执行轨迹。

- [ ] **AC-PRD-001**：build-prd 六步从入口可达
需求：FR-PRD-001
验证：规划任务从真实入口进入 build-prd，核对六项内容责任、每项可观察结果和最终完成判据；另构造有理由的乱序/暂停恢复，确认清单顺序不作机器 gate。
通过：六项责任均可执行并产生既有合同要求的结果；依赖关系仍作为推荐顺序核对，但乱序/暂停本身不阻断；只有六项责任全部完成才可 succeeded；接线未改变内容。
失败：入口拒绝 build-prd、任一项因“非正式阶段”身份不可达、为凑顺序伪造事实、缺任一完成责任却 succeeded，或内容被本卡改写。
证据：portable workflow 六项责任记录、乱序/恢复轨迹、完成判据与最终状态。

- [ ] **AC-PRD-002**：规划旅程成功终止
需求：FR-PRD-002
验证：完成 build-prd 六步后检查最终状态、记录和后续阶段。
通过：build-prd 核心六项责任完成后记 succeeded，产出与执行事实存在于任务追踪记录，规划旅程执行收口且不触发 build-plan/build-code/verify-code；正式五阶段集合未新增 build-prd。适用质量事实缺失时，仅对应 quality facts 保持 missing/unavailable/incomplete 并可继续补验证，不创建 task 质量状态、不改变拓扑终点。
失败：无终止状态、进入代码阶段、依赖五阶段 completion 认证才能到达执行终点、缺质量事实却宣称 task 质量完成，或 build-prd 被升为正式阶段。
证据：任务状态、事实记录、后续阶段轨迹、正式阶段定义读回。

- [ ] **AC-PRD-003**：规划旅程失败不滑入代码阶段
需求：FR-PRD-003
验证：使 build-prd 任一步产生可控失败，修复后重入该步。
通过：失败时状态为 failed 且原因保留；修复后可重入失败步骤；全过程不进入任何代码阶段。
失败：失败被写成 succeeded/unverified、任务自动切换到普通旅程，或只能整条旅程重建才能继续。
证据：失败与重试执行记录、状态变化、阶段轨迹。

- [ ] **AC-FLOW-001**：流程清单是参考而非顺序锁
需求：FR-FLOW-001
验证：构造一个不适用项、一个有理由的乱序/跳过项和一个追加问题，继续当前阶段。
通过：三种情况均记录真实状态与理由且可继续；清单仍可用于阶段末核对。
失败：因缺步/乱序阻断，要求伪造完成以凑齐，或直接删除清单导致无核对参照。
证据：清单逐项披露、阶段执行记录。

- [ ] **AC-FLOW-002**：固定轮次与通用 completion 不阻断
需求：FR-FLOW-002
验证：在未走固定 Talk 轮次且缺 stage completion 通用认证的真实任务中推进。
通过：任务可继续，实际轮次与认证缺失被如实记录，无补造事实。
失败：缺认证或轮次不足即阻断，或系统为推进生成虚假认证/轮次。
证据：真实任务轨迹、质量事实与缺失披露。

- [ ] **AC-FLOW-003**：去阻断前后历史事实同时保留
需求：FR-FLOW-003
验证：选择至少一条曾因缺认证或固定轮次而阻断的既有历史记录，再执行去阻断后的同类推进；对照旧记录、变更事实与新执行事实。
通过：旧阻断事实、去阻断变更事实和新推进事实均可分别定位；旧记录的来源与原结论未被覆盖；原 `missing`、`unavailable`、`failed` 或其它非成功结论保持原义，不被写成 pass/succeeded。
失败：旧阻断记录消失、被覆盖或被重写为成功；只保留新推进结果；或摘要替代原始来源。
证据：旧阻断原始记录引用、去阻断变更事实引用、新执行事实引用及三者对照结果。

- [ ] **AC-GATE-001**：零机器推进门禁且事实不漂白
需求：FR-GATE-001
验证：以 RS-001 的 24 项现状阻断谓词为逐项输入，建立“具体谓词/consumer × 适用阶段/转移”矩阵，并映射到 FR-GATE-001 的封闭类别；每个 N/A 必须有谓词级理由，并保留 `outline_closed=missing` 样本；对每个适用格构造缺失或无效事实后继续安全工作。
通过：矩阵每个适用格均记录真实缺失/无效状态且不阻断同任务工作；不适用格有理由；`outline_closed` 仍为 missing；任何缺项均不得支持质量完成声明。
失败：任一适用机器事实成为推进许可，矩阵漏项，缺项被隐去/改写为 pass，或为了通过伪造 aggregate。
证据：完整机器事实矩阵、各缺失/无效场景执行轨迹、事实记录与阶段质量摘要。

- [ ] **AC-GATE-002**：仅保留两类人为门
需求：FR-GATE-002
验证：读取并冻结当次 `CONSTITUTION.md` F7 与公共 authorize 合同原文/版本，据此对规划与普通任务完整拓扑建立人工阻断 inventory，覆盖每个阶段/workflow 转移、review/test/evidence 派发和全部合同项；逐项执行等待/未答、拒绝和批准的代表性路径。B 类批准正例只能在一次性沙箱/替身目标上、预先取得该测试动作独立授权后执行；禁止对当前真实仓库执行未授权不可逆操作，fixture 由 DEFER-003 参数化。
通过：inventory 与引用合同原文逐项一致；所有人工阻断严格属于 A/B 两类。等待/未答时当前动作不执行并记录 pending fact，可在真实答复后恢复；拒绝时动作不执行并记录拒绝，任务可重试、继续不依赖该动作的安全工作或由用户选择 abandoned；批准后仅执行被确认/授权的具体动作；A 类事实不满足 B 类授权；沙箱 B 类正例不影响真实仓库。
失败：出现合同外第三类阻断、漏合同项/转移/派发路径、未答或拒绝却执行动作、伪造同意、把 A 类确认复用为 B 类授权、自行扩大授权集合，或对真实仓库执行未授权动作。
证据：合同原文与版本引用、两类任务 inventory、pending/拒绝/批准交互与授权事实、恢复/重试/abandoned 轨迹、沙箱与真实仓库无副作用记录。

- [ ] **AC-GATE-003**：物理不可行不扩成质量门禁
需求：FR-GATE-003
验证：分别观察任务身份/worktree 无法建立、当前材料字节不可读、已建立任务仅缺材料身份/hash 等辅助质量事实，以及不可逆操作等待独立授权四种情况。
通过：无记录落点时不伪称已开始；材料物理不可读时仅依赖其内容的动作报告读取失败并可修复重试；辅助机器事实缺失时工作继续且缺项保留；不可逆操作只在既有授权合同边界等待人；四类事实互不冒充。
失败：把不可读材料静默当空内容、把辅助事实缺失升级为物理阻断、把授权边界称为额外物理 gate，或无 worktree 时伪称已开始。
证据：四种场景的入口/读取/推进/授权事实与修复重试轨迹。

- [ ] **AC-GATE-004**：规则类要求只影响验收结论
需求：FR-GATE-004
验证：对迁移表冻结、并行声明、接口蓝图冻结建立规则事实 inventory，分别构造缺失或失败样本并继续同任务修复。
通过：每项实际状态均被记录；未做/失败使对应验收核对保持失败或缺失，但不阻断其它安全工作；修复后更新当前事实且旧失败保留。
失败：任一规则事实成为推进许可证、缺失被漂白为通过，或因为不阻断而不记录验收失败。
证据：规则事实 inventory、缺失/失败记录、继续工作与修复后的事实引用。

- [ ] **AC-STATE-001**：七值状态且不假绿
需求：FR-STATE-001
验证：检查规划/普通路径的成功、失败、未验证和放弃等代表性状态记录。
通过：所有阶段状态属于七值集合；未验证、缺失或失败均不写成 succeeded；build-prd 使用状态但未进入正式阶段集合。
失败：出现第八个状态、状态含义漂移，或用 succeeded 漂白缺失/失败。
证据：任务状态记录和正式阶段定义。

- [ ] **AC-STATE-002**：记录归属单一
需求：FR-STATE-002
验证：检查一个规划任务和一个普通任务的当前材料与执行事实落点。
通过：当前权威仍只有四材料；类型位于 decision-log；执行事实位于既有任务追踪目录；不存在第五材料或第二状态机。
失败：新增平行 spec/状态账本/store，或用历史记录替代当前材料。
证据：任务材料清单与任务追踪记录清单。

- [ ] **AC-STATE-003**：普通阶段失败、重入与放弃语义完整
需求：FR-STATE-003
验证：分别在 build-plan、build-code、verify-code 构造代表性失败，并对 build-prd 覆盖人工等待、可识别非机器外部依赖 blocked/解除、材料读取动作 failed/重试、unverified 补验证、用户 abandoned；读取状态历史与后续轨迹。
通过：创建/开始/成功/失败/缺验证/阻塞/放弃均使用七值合同；blocked 仅绑定有 owner/解除条件的非机器外部依赖；failed 或 blocked 时后续阶段不自动启动；修复或条件解除后重入原阶段；abandoned 后不再推进；全部旧状态与原因可查。
失败：失败后自动启动下一阶段、覆盖旧失败、无法重入、把未验证写成功、另造阶段状态值、把机器/质量事实缺失包装为 blocked，或把材料不可读扩大成整个阶段 blocked。
证据：三阶段失败/恢复执行记录、状态历史和后续阶段未启动事实。

- [ ] **AC-IFACE-001**：接口蓝图完整且非门禁
需求：FR-IFACE-001
验证：在 build-plan 读取蓝图，逐项核对 FR-IFACE-001 枚举的六类契约（受控值、类型→拓扑、正式/portable 身份、七值状态、材料/事实归属、推进/完成分离），同时模拟蓝图冻结事实缺失后继续修复。
通过：上述六类各有对应蓝图行且可供后续卡消费；人工边界与审查重派作为附加接口保留；缺冻结事实计验收缺口但不阻断同任务修复。
失败：后续卡必须猜任务类型、拓扑、状态或归属；或蓝图事实被升级为推进 gate。
证据：build-plan 接口映射、缺口披露与继续工作记录。

- [ ] **AC-IFACE-002**：跨卡责任不漂移
需求：FR-IFACE-002
验证：读取 make-decision 开工责任记录，核对 owner、接口冻结/合并责任、本卡验收责任和 CARD-10 总体责任。
通过：开工记录指派本 task 主会话为 owner；CARD-01 先提供蓝图且承担合并责任、CARD-02 在其上对齐；本卡 verify-code 负责自身 AC；CARD-10 只核对事实存在并可抽验；缺记录只形成验收失败事实，不阻断修复。
失败：开工未指派且被漂白为完成、本卡改写 CARD-02 职责，或 CARD-10 变成逐条重跑本卡 AC 的总门禁。
证据：跨卡交接与各卡验收引用。

- [ ] **AC-IFACE-003**：母任务与兄弟卡保持只读且不被 close
需求：FR-IFACE-003
验证：记录母 PRD、母任务和兄弟卡材料的前置内容/位置/任务状态，分别执行规划与普通真实旅程后重新核对。
通过：两条旅程前后母 PRD、母任务和兄弟卡材料未改写、移动或删除；母任务保持原状态且未触发 close。
失败：任一材料内容或位置变化、兄弟卡被本卡写入，或母任务被 close。
证据：前后材料清单与内容对照、母任务状态、两条旅程执行记录。

- [ ] **AC-REVIEW-001**：显式 recorder currentness 与 review→dispose→analyze 前移
需求：FR-REVIEW-001
验证：读取真实 build-spec manifest，断言 review-frozen-spec→main-agent-disposes-findings→stage-end-spec-analyze→publish-spec-result 为单向依赖链，review 与 publish 之间无第二个 review dispatch step；SKILL 文本明确 disposition 修改 spec 后不重新派发已完成 review；真实 reviewCycleDecision helper 在 serious finding 且 actualRepair/subjectChanged 存在时仍返回 action=advance。另在 workflow 正处 review step 且调用方显式再次调用 recorder 的独立底层用例中，材料 B 不复用 A 的结果。
通过：manifest 单向依赖锁定、SKILL 不回跳语义存在、helper 只输出 advance 不输出 review 动作；显式 recorder 调用把 B 误复用为 A 的情况不存在。
失败：dispose 后自动回跳 review、analyzer 看到 before，或显式 recorder 调用把 B 误复用为 A。
证据：针对性 contract test、真实 manifest depends_on、底层 recorder currentness 既有测试。

## 12. 风险、未决与交接

- **RISK-001**：去阻断被实现为不记录失败
  - **受影响 ID**：FR-FLOW-002..003、FR-GATE-001、AC-FLOW-002..003、AC-GATE-001
  - **触发条件**：缺失/失败在新路径中被吞掉或改写
  - **后果**：历史与当前质量事实漂白
  - **缓解或 STOP**：所有缺失/失败场景均以事实记录为验收 oracle；不得声明完成
  - **处理 Stage**：build-code、verify-code
  - **验证**：AC-FLOW-002..003、AC-GATE-001
- **RISK-002**：拓扑或接口蓝图错误影响全部后续卡
  - **受影响 ID**：FR-TOPO-001..002、FR-IFACE-001..002
  - **触发条件**：类型映射、正式/portable 身份或状态归属错误
  - **后果**：CARD-02..10 在错误契约上施工
  - **缓解或 STOP**：build-plan 逐处冻结八处候选并做双旅程真实验收设计
  - **处理 Stage**：build-plan
  - **验证**：AC-TOPO-001..002、AC-IFACE-001
- **RISK-003**：去机器门禁后材料偷换缺少自动防护
  - **受影响 ID**：FR-GATE-001、AC-GATE-001
  - **触发条件**：当前材料在人工把关之外被替换
  - **后果**：执行与用户理解不一致
  - **缓解或 STOP**：明示接受的取舍；依靠两道人为门、独立审查和真实执行发现
  - **处理 Stage**：跨卡
  - **验证**：真实执行和独立审查事实保持可查
- **RISK-004**：核心接线责任面广
  - **受影响 ID**：FR-PRD-001、FR-IFACE-001
  - **触发条件**：八处候选存在共享 consumer 或遗漏阻断点
  - **后果**：规划入口仍不可达或影响其它阶段
  - **缓解或 STOP**：build-plan 逐处核查 consumer、最小改动和回归面
  - **处理 Stage**：build-plan
  - **验证**：AC-PRD-001、AC-TOPO-001
- **RISK-005**：build-prd 内部产出质量无本卡承接
  - **受影响 ID**：FR-PRD-001..003
  - **触发条件**：用户把“可执行”理解为“PRD 质量已由 CARD-01 保证”
  - **后果**：完成声明越界
  - **缓解或 STOP**：验收只证明拓扑、终止与门禁；内部质量改进另立需求
  - **处理 Stage**：verify-code
  - **验证**：AC 不包含 PRD 内容质量 verdict
- **RISK-006**：外部清理再次带走未跟踪材料
  - **受影响 ID**：FR-STATE-002、AC-STATE-002
  - **触发条件**：worktree 被外部静默清理
  - **后果**：当前材料丢失并需重建
  - **缓解或 STOP**：本卡保留事实；根治由 CARD-08 和 close 纪律承接
  - **处理 Stage**：CARD-08
  - **验证**：后续接续方案明确保留/清理条件
- **RISK-007**：全审查面共享材料重派实现
  - **受影响 ID**：FR-REVIEW-001、AC-REVIEW-001
  - **触发条件**：材料 currentness 修复影响其它 stage/track
  - **后果**：复用率或审查行为回归
  - **缓解或 STOP**：本卡只保持已确认的材料变化语义；整体替换与 snapshot 语义交 CARD-05
  - **处理 Stage**：CARD-05
  - **验证**：AC-REVIEW-001 与后续 CARD-05 验收
- **RISK-008**：记录层普通命名可能碰撞或覆盖
  - **受影响 ID**：FR-STATE-002
  - **触发条件**：后续停用内容寻址但命名不保证追加
  - **后果**：历史事实被覆盖
  - **缓解或 STOP**：本卡不改命名；CARD-06/CARD-08 定义保留条件
  - **处理 Stage**：CARD-06、CARD-08
  - **验证**：对应卡验收事实

### 延期项

> decision-log 当前产品延期寄存器为 DF-001..DF-006。下表是执行交接展开：DEFER-001=DF-001，DEFER-003=DF-005，DEFER-004..007 分别承接 DF-002/003/004/006；DEFER-002 是 D-006 已确认接线方向下的 build-plan 逐处冻结义务，不是新增产品延期方向。

| ID | 内容 | Owner / trigger | 下游不得猜的边界 | 关闭条件 |
| --- | --- | --- | --- | --- |
| DEFER-001 | 入口分流内部实现形式 | 本卡 build-plan 开工 | 可选参数/配置/既有定义复用，但不可新增产品类型或自动分流 | plan 选定最小方案并映射 FR/AC |
| DEFER-002 | 八处排除名单逐处清点与冻结 | 本卡 build-plan 开工 | 基于 RS-001 八候选，可追加新阻断点；不得升 build-prd 为正式阶段 | 每处有 consumer、结论、理由、验证映射 |
| DEFER-003 | 验收 fixture、采样方式、环境假设和精确命令 | 本卡 build-plan 开工 | 不得删减本规格场景或改变失败条件；B 类授权批准正例必须使用一次性沙箱/替身目标并预先取得测试动作独立授权，不得触碰真实仓库未授权动作 | plan/tasks 为每个 AC 给出可执行参数和安全替身边界 |
| DEFER-004 | 校验机器物理删除 | CARD-06 开工 | 本卡只让其退出推进路径 | CARD-06 有删除与幸存者验收事实 |
| DEFER-005 | 旧任务兼容与最小接续 | CARD-08 开工 | 不得污染当前新任务契约 | CARD-08 给出并验证兼容边界 |
| DEFER-006 | 资源占用效果实测 | CARD-09 开工 | 不作为本卡拓扑完成条件 | CARD-09 留下真实测量事实 |
| DEFER-007 | 审查链整体替换、跨系统公共序列化接口、snapshot 变化重派 | CARD-05 开工 | 本卡只保证材料身份变化重派 | CARD-05 独立决策并验收 |

### 当前质量缺口（非方向歧义）

- `outline_closed=missing`：owner 为 host interaction recorder 接入；影响是 make-decision 的该项质量事实不能声称完整；处理方式是保留 missing，不补造 aggregate，不阻断本卡继续。
- build-spec 的独立 frozen-spec review、finding 处置、stage-end spec-analyze 和 stage reflection 尚未执行；在这些事实产生前，本文件保持“草案”，不得宣称 build-spec 正式完成。

## 13. 业务影响与回归范围

### 双任务入口

- **既有行为**：普通五阶段路径可表达，规划 portable workflow 被正式阶段排除点拒绝。
- **本需求影响**：两类任务从同一真实入口按人工声明进入各自固定拓扑。
- **回归路径**：规划完整旅程、普通完整旅程、类型非法澄清。
- **验收**：AC-TOPO-001..002、AC-TYPE-001..003、AC-PRD-001..003

### 阶段推进与事实记录

- **既有行为**：部分清单、轮次、认证和材料身份事实可能同时承担记录与阻断。
- **本需求影响**：记录与推进分离；质量缺口仍影响完成声明，不影响同任务继续修复。
- **回归路径**：缺四类机器事实、缺轮次/清单项、两道人为门、历史失败保留。
- **验收**：AC-FLOW-001..003、AC-GATE-001..003、AC-STATE-001..002

### 审查复用

- **既有行为**：历史缺陷曾在材料变化后复用旧审查；当前基线已修复材料身份语义。
- **本需求影响**：保持“材料变化即重派”，但不扩展到 snapshot 变化或整体审查链替换。
- **回归路径**：材料 A→B 的重派与不可用非阻断。
- **验收**：AC-REVIEW-001

- **可能受冲击的业务规则**：正式五阶段身份、四材料权威、三处正常业务确认、不可逆操作独立授权、review 事实非许可证。
- **明确无影响**：UI、build-prd 六步内容、母 PRD、兄弟卡材料、旧任务迁移、文档权威细则、子代理方法、验收机制建设与审查链替换。
