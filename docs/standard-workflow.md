# WorkflowHub 标准执行流程

这份文档是五个正式 stage 的人读规范。真正的执行顺序、依赖和 step 名称以对应的
`workflows/*/steps.json` 为准；技能说明、handler 和本规范必须保持一致。文档本身不
产生新的状态、权限、质量 gate 或交付许可证。

## 先记住三条规则

1. 当前任务的需求真相只有认证 worktree 中 `specs/<task-id>/` 下的四份材料：
   `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。原始需求和历史记录是来源与事实，
   不是第五份当前材料。外置任务追踪目录只放 `task.json`、`facts.jsonl`、`quality/`、
   `index.json` 等执行文件，不替代 worktree 材料；这只是落点约定，不是新 gate。
2. 每个声明的 step 都要留下真实的最小结果：完成、跳过（有真实原因）、未完成或不可用。
   manifest 只是预期拓扑，不能代替实际执行；缺步、重复、乱序、旧快照和依赖未完成都要
   真实暴露。
3. `make-decision`、`build-spec`、`build-plan`、`build-code` 各自在本 stage 收尾调用
   `spec-analyze`。它是这四个 stage 的唯一 stage-end 语义检查和质量事实契约 owner；
   `verify-code` 不调用它，改由 `dsh-code-review` 做当前实现的代码审查。现有 stage
   publication 是唯一写入路径，原子写入 `quality/facts` 与 acceptance evidence。
   `spec-analyze` 不直接改四份材料，不创建第二 store、投影或门禁；结果只是现有事实和摘要。
   缺失或 `unavailable` 不等于通过，也不能阻止同 task 修复。

## 五个 stage 的总览

| stage | 主要输入 | 核心产物 | 下游直接消费 |
| --- | --- | --- | --- |
| `make-decision` | 原始需求、仓库事实 | `decision-log.md` | build-spec 的已确认方向 |
| `build-spec` | 原始需求、decision-log | `spec.md` | build-plan 的行为规格 |
| `build-plan` | 原始需求、decision-log、spec | `plan.md`、`tasks.md` | build-code 的实施任务 |
| `build-code` | 四份材料、真实工作区 | 实现、测试、review、AC 证据 | verify-code 的当前实现 |
| `verify-code` | 当前实现、真实 consumer、相关测试上下文、代码风险 | 一次代码 review findings 和处置 | 用户确认；随后才谈 close |

每个 stage 还会产生既有 `quality/facts/`、`quality/evidence/`、`quality/tests/`、
`quality/reviews/results/` 或 `quality/reviews/attempts/`，以及 stage outcome 事实。前四 stage 的 `spec-analyze` 结果由现有 stage
publication 原子写入对应的 quality fact 和 acceptance evidence。它们用于证明实际发生了
什么，不会覆盖四份材料，也不会把 `unknown`、`unavailable` 或 `incomplete` 改写成通过。

## 四个状态视角和十个读取入口

四个视角只从当前事实即时派生：`work_progress` 看能否继续修复，`stage_quality` 看本阶段
质量是否闭合，`product_release` 由 `completion-predicates.mjs` 的
`deriveProductRelease()` 读取五阶段 current completion、逐 AC 结果和 verify-code 当前确认，
同时接收批准 spec 的完整适用 AC ID 集合；缺失、重复、意外、非 current 或身份未绑定的输入
只能得到 `not_released`，延期/不适用项不能被猜成通过。
`physical_delivery` 只看 close 的真实物理结果。它们不是新状态机，也不是继续工作的许可证。

host、doctor、status、monitor、run、review、verify、confirm、authorize、close 只按职责读取
这些视角；先给主结论，再给当前绑定、失败原因、未改变事实和唯一下一步。任何入口都不能把
“还能继续修复”、`unavailable`、`not_released` 或 physical delivery 已完成显示成正常完成。

## 通用执行合同

### 进入 stage

Stage Agent 先读取当前 stage 的 workflow skill、依赖清单、原始需求、适用的四份材料和
已有真实事实。只读取当前任务范围；旧 task、旧 review 和历史 snapshot 只能作为只读
背景。先确认当前工作区、依赖、接口、权限、安全和测试环境是否满足本 stage 的工作条件。

### 执行 step

按 `steps.json` 的顺序执行。每个 step 结束时至少记录：

- 实际做了什么，结果对应哪个需求、FR、AC 或用户流程；
- 使用了哪个 skill、输入和当前快照；
- 产物或事实引用、测试命令和退出码（适用时）；
- `completed`、`skipped`、`incomplete` 或 `unavailable`，以及跳过/失败原因。

发现事实漏写，调用该材料已有 writer；发现实现、测试或 stage 自己的问题就在当前 stage
修复；发现会改变产品方向的内容，停在当前 stage 取得必要的用户决定。不能把未解决的问题
静默交给下游，也不能用下游补写前置决定。

### review、测试和成本

`wh-review` 是唯一的异源审查入口。审查 packet 只包含当前主题和真实证据；provider 的
等待、死亡、坏输出、transport failure 和同源降级都保留原始事实，不能伪造空 findings 或
pass。健康的 provider 由 3rd-review 自己监管，WorkflowHub 不手动设置六分钟/两分钟终止
边界；需要恢复时按公共合同重新请求，仍不可用就明确记录 `unavailable`/`SAME_SOURCE`。

没有真实主题变化，不重复全文读取、测试、review 或 analyzer。材料、风险或有效 finding
实际变化时，只重跑受影响的检查；build-code 的最终 aggregate 按计划在全部 phase 完成后
运行一次。时间和 token 只作诊断，按 step、skill、读取、交互、provider wait、测试、review、
返工和用户等待拆分；不可得就写 `unavailable`，不设统一预算 gate。

### stage 结束

`make-decision`、`build-spec`、`build-plan`、`build-code` 在各自 stage 结束前唯一调用对应的
`spec-analyze` profile；`verify-code` 改用 `dsh-code-review` 和一次异源代码 review。并把
与本 stage 职责对应的摘要交给用户：

1. 当前阶段做了什么；
2. 本 stage 负责的需求、实现或代码风险覆盖到什么程度；
3. 与上游产物、实际语义和必要事实是否一致；
4. 当前阶段当场修复了什么；
5. 剩余风险、未决和延期；
6. 下游可以直接消费什么、不能自行猜什么。

发现的 finding 必须先在当前 stage 修复，再重跑受影响的 `spec-analyze` profile；不能静默
交给下游。六项摘要和 `unavailable`/`incomplete` 事实随现有 stage outcome 交接，不新建
store 或门禁。摘要说的是当前事实，不是“文档存在所以完成”。交接只交接已确认的材料和事实。

每个 stage 结束时，当前主会话必须按 `stage-reflection` 技能先产出 judgment JSON，再调用实际公共入口 `run --action=reflect`。判断 JSON 使用六个结构化区块：`what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、`what_to_simplify`、`simplifiable_now`；每个区块条目带真实 `evidence_refs` 与 `confidence`。已检查但无观察写 `none_observed`，无法判断写 `unknown` 并给 `unknown_reason`，确实不适用写 `not_applicable` 并说明原因，不能静默省略。v2 还保留 `status_matrix`、`identity`、`source_completeness` 三件套；它们是事实投影，不是质量结论。

`validate-stage-reflection.mjs` 在验证内部调用 `deriveConsumptionEdges`。实际消费边只由较早 subject 的 `output_refs` 与较晚 subject 的 `input_refs` 含同一引用形成；所有五个 stage 的 outcome 文件有效且声明 output 存在时，扫描才是 `coverage_status=complete`，否则为 partial/unknown。单个 output 没有后续边也不能直接称为零消费；只有完整扫描、近 30 天登记 output 且 consumer 全为零的 `zero_consumption_proof`，再加人工 rejected 或同一步骤至少两次介入，`remove_candidate` 才能保留，否则降为 `needs_evidence`。当前 route 若未实现，保留真实 unavailable/dependency，不用未支持命令替代。

用户明确执行 `close` 时，WorkflowHub 才按冻结计划执行 Git commit、spec archive、merge、push、
worktree cleanup 和 branch cleanup，并对每一步做物理读回。

阶段末指令是每个正式 stage 的共同收尾动作；上述六块 judgment JSON 与 `run --action=reflect` 适用于 `make-decision`、`build-spec`、`build-plan`、`build-code` 和 `verify-code`，不改变任何 `steps.json` 拓扑或 `skill-deps.yaml` 依赖声明。

## `make-decision`：把需求和前置条件一次弄清楚

### 标准输入

原始用户需求、仓库和运行环境事实、当前 worktree/依赖状态、宪法，以及当前已有的
`decision-log.md`。后续 `spec.md`、`plan.md` 和 `tasks.md` 不能被提前假设为存在。

### 标准步骤与最小结果

1. `load-context`：读取 portable workflow、依赖和原始需求。
2. `triage-scope`：写清当前范围、不确定性和非目标。
3. `talk-round-1`：先核实现有实现、依赖、worktree、服务和可查事实；只向用户询问
   agent 无法自行确定的方向问题。
4. `research-inputs`：按需完成或如实记录研究 skipped/unavailable。
5. `talk-round-2`：用一组互不依赖的大白话问题收敛方向；每题给编号、推荐项、后果和风险，
   用户可以只回编号。
6. `direction-advice`：记录一次独立方向建议；它是建议，不是 provider pass。
7. `talk-round-3`：处理建议、矛盾、关键假设和剩余风险，真实保存 ask/wait/reply/resume。
8. `grill-with-docs`：用现有文档和领域模型压力测试方案，不把 Grill 当成 review。
9. `write-decision-draft`：把原始需求、关键事实、选择、理由、风险、非目标和延期写入
   同一份 `decision-log.md`。
10. `detail-advice`：审查细节，不改变用户未确认的方向。
11. `approve-decision`：记录用户真实确认或拒绝，并把确认绑定到当前 decision-log 和交互事实。
12. `stage-end-spec-analyze`：检查原始需求、决策语义、完整交互、最终确认、用户流程、前置
    材料和证据，并在本 stage 修复缺口；若修复改变方向，重新确认后再分析。
13. `publish-decision`：交接已确认的 `decision-log.md` 和阶段事实。

### 本阶段必须形成的内容

在进入 build-spec 前，必须明确：用户和角色、完整用户旅程、页面/入口范围、数据来源与
状态、成功/失败/取消/重试/恢复边界、权限与安全、前置依赖和兼容性、迁移/回滚、可观测性、
验收环境、非目标和延期项。页面需求要有可确认的设计输入；依赖不足时要在这里决定补齐、
调整或延期。若只是小型独立 enabling change，可按 `mini-task` 独立交付后再继续 A；不能
把它偷偷改写进 A 的当前需求。

### 完成与失败边界

完成是：用户确认的 decision-log 含完整需求边界、事实、选择、理由、风险、非目标、延期、
前置准备和真实 stage outcome（外部宿主执行时），或真实的 unavailable 执行事实。方向未定、页面/依赖材料未准备、错误回复未匹配或关键语义
被猜测时，不能发布成已确认决定；应在本 stage 继续询问、修复或如实保留未决。

### 下游交接

build-spec 只消费已确认的方向和真实事实，不再替用户补产品方向；它可以把决定细化成规格，
但不能把遗漏的方向选择伪装成规格细节。

### 专业质量

本阶段的专业质量由需求准备检查、Talk/Grill 的方向性收敛、独立方向/细节建议和用户确认
共同形成；它们检查的是需求是否真的能被实现和验收，不是只检查 `decision-log.md` 是否存在。

## `build-spec`：把已确认方向变成可实现规格

### 标准输入

原始需求、已确认 `decision-log.md`、已有当前 `spec.md`（如有）、前置事实和可用的 stage outcome。

### 标准步骤与最小结果

1. `read-decision-log`：读取当前决定和 portable 依赖。
2. `conditional-spec-research`：先查当前事实；确有规格事实缺口才研究，明确 skipped 或
   unavailable。
3. `spec-clarify`：只处理规格层歧义，使用一组批量、编号、推荐、后果和风险问题；不能
   重新决定产品方向。
4. `spec-specify`：生成当前行为规格。
5. `simplicity-guard`：删除无目标、无证据或可复用的扩张。
6. `plan-ceo-review`：检查问题、价值、范围和替代方案。
7. `conditional-plan-design-review`：有 UI 才检查设计；无 UI 记录不适用。
8. `freeze-spec`：冻结用户流程、页面、数据状态、FR、AC、边界、非目标和延期。
9. `review-frozen-spec`：对当前 spec 做一次 advice review，保存真实 provenance。
10. `main-agent-disposes-findings`：在本 stage 修复有效规格问题，记录其他 finding 的理由。
11. `stage-end-spec-analyze`：检查原始需求、decision-log、spec 语义、用户流程和证据。
12. `publish-spec-result`：交接规格和六项大白话摘要。

### 产物、完成与失败边界

核心产物是 `spec.md`。它必须能让下游直接知道入口、成功路径、失败/取消/重试/恢复、页面
范围、数据状态、权限安全、接口/依赖、FR/AC、非目标和延期。研究或 Clarify 未完成、规格仍
含方向性猜测、UI 设计未冻结或语义与 decision-log 冲突时，不能声称规格闭合；应在本 stage
修复，不能把问题留给 plan 或 code。

### 专业质量

本阶段的专业质量由规格澄清、简洁性审查、方向/设计/规格审查、冻结规格和 stage-end
`spec-analyze` 共同形成；它们检查行为、边界、页面/数据状态和可验收性，不能用完整的
`spec.md`、FR/AC 编号或文档存在代替真实规格质量。

### 下游交接

build-plan 以 `spec.md` 为原材料设计实现边界、测试 oracle 和 phase；不重新发明需求，也
不把 spec 缺口隐藏在 tasks.md。

## `build-plan`：把规格变成可执行任务

### 标准输入

原始需求、`decision-log.md`、`spec.md`、当前 `plan.md`/`tasks.md`（如有）以及前置事实。

### 标准步骤与最小结果

1. `read-current-materials`：读取当前决定和规格。
2. `conditional-spec-research`：按需核实规划事实，并记录结果。
3. `testing-system-blueprint`：为每个行为 phase 设计风险、场景、oracle、命令、证据和
   覆盖限制；不宣称已执行测试。
4. `spec-plan`：形成实现 phase、依赖、边界、风险、回滚和验证方案。
5. `simplicity-guard`：删除不必要的拆分、重复组件和范围扩张。
6. `plan-eng-review`：检查工程顺序、失败路径、依赖和回滚。
7. `test-routing-advisor`：按预计改动给出测试层级；build-code 会按真实 changed files
   必要时重判。
8. `spec-tasks`：生成每张可执行任务卡，写明 Goal、Files、AC/FR、RED/GREEN、命令、oracle、
   evidence path、覆盖限制、STOP 和 rollback。
9. `review-plan`：对 plan/tasks 做一次独立 advice review。
10. `main-agent-disposes-findings`：在本 stage 修复计划和任务问题。
11. `final-spec-analyze`：这是 build-plan 的历史兼容名称，语义上就是 stage-end
    `spec-analyze`；它检查原始需求、decision-log、spec、plan、tasks、所有 DEFER/OPEN 和
    每个 task oracle 的真实语义与证据。
12. `publish-plan-result`：交接 plan、tasks 和六项摘要。

### 产物、完成与失败边界

核心产物是 `plan.md` 和 `tasks.md`。每个行为 phase 必须有窄文件边界、依赖、实施顺序、
失败恢复、测试策略、证据路径和停止条件；计划只能设计，不冒充代码、测试或 review 已完成。
缺 AC/FR 映射、任务无真实 oracle、文件边界不明、依赖未解决或 DEFER/OPEN 没有 owner/触发
条件/消费者/关闭条件时，当前 stage 修复后再交接。

### 专业质量

本阶段的专业质量由测试系统蓝图、工程审查、测试路由、计划审查和当前 stage 的
`spec-analyze` 共同形成；它们必须把每个行为风险落到可执行任务和真实 oracle，不能用任务
数量、文件列表或测试命令字符串代替设计质量。

### 下游交接

build-code 只能按 `plan.md`/`tasks.md` 的当前 phase 执行；它以真实改动范围重判测试，不
能因为计划写了某个路径就声称该路径实际改动或已验证。

## `build-code`：按 phase 实施并保留真实证据

### 标准输入

四份当前材料、当前 phase card、真实 worktree、依赖和 plan 设计的测试路线。历史记录不能
代替当前实现或当前证据。

### 每个 phase 的标准循环

1. `read-current-task-documents`：读取四份材料并选择下一个未完成 task。
2. `write-red-tests`：行为变化先写并运行 RED；纯材料任务明确记录不适用。
3. `implement-change`：只改 phase 允许的文件和同 task 事实栏。
4. `inspect-and-route-actual-tests`：检查真实 diff，必要时重判测试层级。
5. `invoke-concrete-testing-skill`：直接调用适用的 backend、frontend 或 fullstack testing。
6. `run-tests`：按实际范围跑 focused test，保存命令、退出码、oracle、快照和限制。
7. `scan-diff`：反向检查 FR、AC、状态、错误/取消/恢复、并发和接口边界。
8. `review-change`：对当前 phase 做一次独立 advice review；健康 provider 不被手动杀掉。
9. `analyze-review-findings`：逐条记录 fixed、rejected_invalid、accepted_risk 或 needs_human。
10. `capture-implementation`：保存实现、测试、AC trace、review 和阶段事实。
11. `authenticate-current-task-completion`：确认 task facts 绑定当前 snapshot，不把旧结果冒充
    当前结果。

每个 phase 都重复以上循环，但不重复无关的全量测试或 review。有效问题在当前 phase 修复，
然后只重跑受影响检查。所有 implementation phase 完成后才进入最终步骤：

1. `run-final-aggregate-and-ac-trace`：在同一 current snapshot 按计划运行一次完整 aggregate，
    逐 AC 记录 pass、fail、unknown、deferred 或 not_applicable。
2. `final-integration-review`：审查跨 phase seam、完整实现和最终证据；无可信终态就保持
    unavailable/incomplete。
3. `stage-end-spec-analyze`：检查原始需求、四份材料、实现、测试、AC、review 和真实用户
    结果；当前 stage 修复实现或事实缺口。
4. `publish-code-result`：交接实现和完整 build-code 摘要。

### 产物、完成与失败边界

核心产物是实现变更、phase task facts、canonical test receipts、review facts、AC trace、
final aggregate 和 build-code stage outcome（或真实的 unavailable 执行事实）。不能只凭“代码改了”“测试绿了”或“review 空了”
宣称完成；provider failure、测试失败、缺 AC 证据、缺 step outcome、snapshot 漂移和 serious
finding 必须原样保留。它们是质量事实，不得伪造，但也不应被错误地扩展成新的工作许可证。

### 专业质量

本阶段的专业质量由实际 changed files 路由、具体测试技能、scan-diff、每个 phase 的独立
`wh-review`、finding 处置、当前快照绑定和最终 integration review 共同形成；它们检查真实
行为、失败/恢复边界、跨 phase seam 和用户结果，不把绿色测试或空 findings 单独当成交付证明。

### 下游交接

verify-code 消费当前实现、真实 consumer 和相关测试上下文，不能只消费 tasks.md 的文字状态；
它不重新审计 AC、材料或 evidence tree。未授权的 commit、
push、merge、cleanup 不在 build-code 中自动执行。

## `verify-code`：代码审查并在 close 前停下

### 标准输入

当前代码 diff、真实入口和 consumer、实现评估、相关测试上下文、失败/恢复边界和开放代码风险。
四份材料只作为理解意图的背景，不在本阶段重新验收。

### 标准步骤与最小结果

1. `read-current-materials-and-code`：读取代码审查 skill、当前改动和上游材料背景。
2. `architect-code-review`：沿真实入口、consumer、接口、状态、生命周期、安全和失败边界做一次架构代码审查。
3. `main-agent-repair-batch-1`：修复影响代码交付的有效 finding。
4. `inspect-real-entry-and-tests`：检查真实入口和相关测试强度，只跑必要的受影响检查。
5. `run-one-independent-code-review`：使用 `dsh-code-review` 和一次异源 provider 只审查当前代码 findings。
6. `main-agent-repair-batch-2`：处置这一轮异源代码 findings，不循环审查。
7. `run-final-code-check-and-handoff`：做必要的最终代码检查并交接剩余代码风险。
8. `publish-code-review-fact`：写入当前代码 review 质量事实。
9. `handoff-code-review`：用大白话交接代码入口、consumer、修复和风险。
10. `approve-verification`：整理一次代码审查结论并取得 verify-code 确认；不补材料、不补 AC、不补证据树。
11. `publish-verification-result`：汇报代码审查结果并在 close 前停下。

### 产物、完成与失败边界

核心产物是当前实现代码 review、一次异源 findings、finding 处置和必要的窄检查事实。
`passed` 只表示当前代码没有未处置的 actionable serious finding；`failed` 表示代码明确失败；
`incomplete` 表示代码 review unavailable 或仍有 actionable code finding。AC、材料、测试 receipt
和 evidence tree 由所属 stage 负责，不能在 verify-code 变成兜底门禁。

### 专业质量

本阶段的专业质量由架构师代码审查、真实 consumer/lifecycle/security 检查、一次异源代码复核
和最终收尾检查形成。上游材料问题回对应 stage 处理；verify-code 不重新构造它们的证据。

### 下游交接和停止点

verify-code 结束时只汇报代码入口、consumer、修复、异源 findings、必要检查和剩余代码风险。若用户另行授权，
后续才执行计划内 commit、archive、merge、push、cleanup 和物理读回；本规范不把 close 自动塞进 verify，
也不在缺失证据时用补救式重跑掩盖问题。

## `mini-task` 的位置

`mini-task` 是独立的精简交付流程，不是第六个 stage，也不是历史 `scope_revision`、successor
或 continuation。它复用四份材料和现有 task-close，只有两个专用 review 主题：
`mini_task.design` 审方案，`mini_task.implementation` 审实施、测试、AC trace 和真实结果。
它适合边界清楚、单一结果、影响面有限且没有重大架构/迁移/权限/安全决定的功能；用户明确
指定时可以使用，但 Agent 必须说明风险。来自 A 的 mini-task 完成后，A 按普通 stage 重新调用
继续，不把 mini-task 结果伪装成 A 已完成。

## close：唯一的完整交付动作

`close` 只有一个含义：把当前任务完整交付并结束。用户明确调用 `task-close.mjs close` 后，
系统自动冻结 delivery plan，把这次调用作为该计划的人工确认，再在内部生成逐项不可逆操作授权，
按顺序执行并读回 commit、spec archive、merge、push、worktree cleanup 和 branch cleanup。只有
所有物理事实读回成功后，才写入不可变 `operations/close/completed.json`。

质量或产品发布事实不足时，仍可在用户明确执行 `close` 的前提下带风险交付；完成记录会保留
`quality_status=incomplete`、`quality_gaps` 和风险记录，绝不伪造质量通过。脏的目标仓库、
任务/分支/worktree 身份漂移、远端基线变化、冲突或不安全清理属于结构错误，必须明确失败，不能
靠状态记录冒充 close。

`prepare`、`confirm`、`execute`、`complete` 只作为内部恢复和测试接口，不要求用户重复确认；
不再提供第二个用户-facing close 动作。

## 四层状态的最终读法

- 需求实现：原始需求是否真的落到用户可观察结果。
- 质量验收：测试、AC、review、运行和证据是否足够可信。
- Git 交付：commit、merge、push、cleanup 是否实际完成并读回。
- 任务结束：是否写入完整 `task-close-completed.v1`；记录质量和发布缺口，但不把它们改写成通过。

四层独立报告。任何一层的绿色事实都不能覆盖另一层的 `unknown`、`unavailable`、`partial` 或
`incomplete`。
