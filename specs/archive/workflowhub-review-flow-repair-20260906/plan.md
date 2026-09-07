# 实现计划：审查配置单源、快速失败与结果可追溯

- **Input**：`decision-log.md`、`spec.md`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| Quick Read / Technical Context | 已决范围和当前代码差异 | M/S/B/P 首读 |
| Solution Design / Technical Decisions | 接线、记录身份与失败语义 | B/P 工程设计 |
| File Boundary / Phase | 精确文件和串行责任 | B/P 实施前 |
| Test Strategy / Traceability | 场景、oracle、FR/AC 和任务映射 | S/B/P 验证设计 |
| Risks / Constitution | 未决契约和不可扩大边界 | M/S/B/P 交接 |

## Quick Read

- **Goal**：用户只维护一份provider定义，静态必败快速解释、调用可追溯；追加材料合同一致性与真实host事件/引用链修复。
- **Non-goals**：来源：decision-log.md D-001～D-014 / spec.md 第10节；NG-001 重审预算（D-007）、NG-002 3rd-review 引擎/用户 provider 修复（D-001/D-007）、NG-003 reviewer质量/选型（T-009）、NG-004 dsh-code-review/stage-reflection 改造（T-009）、NG-005 legacy tiers 改造（D-008）、NG-006 新公共命令/dispatcher/双写（D-008）、NG-007 UI（已决non_ui）；材料/事件窄例外见D-010～D-014；DEFER-005自动hook仍延期。
- **Before**：重复 profiles/priority 产生一致性失败；裸 runner 返回 stdout；host 的 dispatch 与 review-record 分离；拦截 material_id 稳定但 attemptId 随机，现无可靠去重。
- **After**：保留现有 host 认证 owner 和 review action；任务 request 在一次调用内派发并保存，裸跑单独写非权威 sink；复用仅返回原引用。
- **Main risk**：保存与身份漂移、1 秒含 I/O 指标、相邻 usage 消费缺口；材料/事件旧合同仍未修，P0承担修复；实施前保持真实 incomplete。
- **Next step**：本阶段仅设计并独立审查；本轮按R-009停在build-code前；未来build-code先执行T013目标断言RED，T001在T019后。当前测试均未执行。

当前修订：R-008/R-009授权的范围增量；旧review/findings只覆盖旧范围并保留原事实，当前扩展范围已完成一次独立wh-review（3 provider完成、2失败），5项发现修订、1项依据原始字节与脱敏副本证据驳回；末次分析另记。没有执行实现测试、配置迁移或真实验收操作。

## Technical Context

### Global Constraints

- **Verified facts**：认证 worktree HEAD `5fbbc34d995bff4261463f6b76e24b1f6121ac4e`，已包含 main `692c27ea325f6bb7be31613c6e44037958eab850`；专属 worktree 中设计，不消费主仓未提交技能修改。
- **Language / runtime**：Node.js v24.14.0、ES modules、Vitest 2.1.9；通过现有 node_modules 安装产物运行，不提交该目录。
- **Primary dependencies**：既有 reviewRuleFor、3rd-review broker、TaskHandle/TaskKernel、canonical create-only writer、现有锁、Node fs/crypto；不新增依赖。
- **Storage / state**：四材料只在 specs 当前目录；任务事实仍在外置 task quality；sink 固定 `~/.workflowhub/review-sink/`，非权威、不参与 task 枚举；reports immutable。
- **Testing**：仅明确列出的 Vitest 文件，singleFork/no-fileParallelism；临时 fixture/home 由测试创建和清理；本阶段不运行 RED/GREEN 或真实 provider。
- **Target environment**：本机 CLI/文件系统及现有 host；用户 provider 定义只读 3rd-review config；本机 WorkflowHub config 迁移由 P3 执行。
- **Scale / scope**：四 Phase、19张卡、八组 RED/GREEN、一张P0集成验证卡、一张操作卡和唯一最终验收卡；无页面、数据库或新运行平台。
- **Unresolved facts**：高风险 parser与非行为oracle冲突见PLAN-RISK-005/006；D-010～D-014已将材料/事件窄修复纳入P0，当前仅增量规划，旧runtime尚未修。F-020、预算与usage消费仍不在此例外。

## Code Anchors

- **Verified anchors**：`skills/wh-review/scripts/third-review-host-config.mjs` 的显式 profile 校验/排序、legacy tiers；`skills/wh-review/scripts/simple-review-runner.mjs:373` 的 runSimpleReview；`skills/wh-review/scripts/wh-review-cli.mjs:770` 的 runReviewRecovery。
- **Existing interfaces**：`tools/cli/stage-runtime.mjs:660` 真实消费 recordSimpleReviewResult，公开映射为 review --action=record；`runtime/review/review-record-route.mjs:150` 当前仅事后认证，`:110` 保留 execution.usage；`reviewRuleFor`/stage-materials required 与 generated 是材料键唯一源。
- **Read now**：冻结 packet 的 decision/spec、原始需求及 research-facts；前期“拦截已幂等”被当前 randomUUID 证据更正；“writer 只有测试消费者”的漏扫结论已撤回，tools CLI 是真实 consumer。
- **Must read before task**：T001 先读合并后的 `runtime/evidence/stage-content-evidence.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/task/material-workspace.mjs` 与 `runtime/stage/stage-handlers.mjs` 的真实消费合同，再读 loader/schema；T003 读 required/generated；T005 再核对上述消费者版本、TaskHandle createRecordAtomic/acquireLock 与 canonical writer；T009 读 E2E reuse 和 strict quality-fact binding；T011 读取本机配置当时字节。
- **Context mode**：Full 的实现风险由 packet 中精确锚点消化；主会话保留导航与绑定摘要，不把历史结论当当前实现证明。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 配置单源 | extend | third-review-host-config.mjs | 删除重复 profile/priority 校验；保留 legacy 去重，替代条件为已批准配置协议变更 |
| 静态预检 | extend | runSimpleReview / reviewRuleFor | 仅补 required-minus-generated 和现有静态检查；无新公共动作 |
| host调用并保存 | extend | review --action=record / runReviewRecovery | 真实 host 注入认证对象，消除两次调用之间漏记；不用新 dispatcher |
| 幂等与不可变写 | reuse | TaskHandle lock / canonical create-only writer | 用现有 owner 和原子操作，不造索引/恢复台账 |
| 非权威sink | new | review-record-route 私有适配器 | D-003 已批准裸跑追溯；owner=本机调用者，consumer=CLI返回引用；测试 T007/T008；不再需要记录或已有备份时用户手动删除 |
| 开始诊断报告 | new | 既有 reports 命名空间和 writer | RISK-003 要求开始事实；owner=记录适配器，consumer=本次用户诊断；T005/T006验证；任务证据正常归档时保留，独立授权清理时删除 |
| 身份/usage消费 | reuse | 原 consumer 与 execution.usage | 不修改等价范围、预算或上游统计；缺口如实交接 |

## Solution Design

### Overview

配置 loader 只把有序 provider IDs 交给 3rd-review 已定义值解析。删除 profiles/priority 的双源约束，列表顺序成为显式顺序；legacy 无显式 route 时仍走原 tiers 去重。schema 允许读取旧 priority 和无 dispatch_state 记录，新 writer 不再输出 priority，旧 policy 指纹自然不匹配而历史字节不变。

现有 host `review --action=record` 输入扩展为 `{request}` 或 `{result}` 二选一。request 路径从当前认证 context 注入 TaskHandle/TaskKernel，经 runReviewRecovery 在一次调用内完成预检、派发和保存；result 路径只保存已有返回值，绝不再次派发；若缺少派发前来源证据，不能仅以事后当前树冒充所审来源，必须明确当前绑定未验证。裸 `wh-review-cli run` 没有认证对象，只选择 sink，输入里的 task_path 等字段不能获取写权限。所有保存实现在 record-route，CLI 仅接线。

静态预检位于 buildBundle、E2E锁及 broker 前。只用 required 减 generated 的 caller keys、现有附件/配置/路由/身份检查，不加深层规格校验或健康探测。错误仅 MATERIAL_INCOMPLETE/MATERIAL_FORBIDDEN/ROUTE_UNAVAILABLE，附 field/expected/actual/next_action；unknown 不拦截，运行错误保留原码。1 秒指标从适配器第一项静态检查开始到返回可读记录引用，包含实际存储和内部等待；任何超限都失败，不扣时间。

### Module responsibilities

#### 配置与兼容生产者

- **Responsibility**：解析单源配置与 schema 兼容；拒绝旧配置时给迁移动作。
- **Consumes**：3rd-review provider 定义与 WorkflowHub 有序 stages/mini_task。
- **Produces**：无 priority 的 effective profiles/policy 和可读旧记录合同。
- **Must not decide**：不修 provider 定义，不改模型选择或 legacy tiers。

#### 入口与记录适配器

- **Responsibility**：确定唯一 owner、捕获身份、运行一次、保存并返回真实引用。
- **Consumes**：plain request + host 内存 recordContext，或无 context 的裸 request；runRound 实际返回或异常。
- **Produces**：available/unavailable、原始 provenance、attempt/result/report 引用或保存缺口；blocked_before_dispatch/reused 作为事实说明。
- **Must not decide**：不签发阶段完成、不改重审预算、不把空 findings 当验收。

### P0增量模块职责与接口

#### 统一材料ID、风险、角色与Oracle

- **Owner / responsibility**：existing stage material contract module; spec-plan/spec-tasks retain material authorship；仅统一材料ID、风险、角色与Oracle。
- **Real consumers**：validateExecutablePlanTaskMinimum, validatePlanTaskContract, validateMaterialOracleContract, validateSpecAnalyzeCompleteness, officialStageHandler(build-plan)。
- **Replacement**：Replace duplicate decision-ID and role parsing in-place with shared in-memory facts; current templates emit one JSON oracle contract. Remove D6/D7 identity hardcoding; consume explicit policy/risk facts while retaining original IDs.
- **Deletion / retention**：Delete superseded local regex/parsers immediately after all current consumers migrate. Retain shared parsing until current material contract is explicitly retired; no persistent compatibility writer.
- **Interfaces / input-output**：同一decision/spec/plan/tasks文本进入共享内存定义/引用解析结果，再供minimum、structural、oracle、completeness与official handler读取。D6与D-006精确不同；风险字段唯一且spec显式引用；N/A拆role/reason；oracle为ORACLE_ID+JSON。保留原返回状态/错误事实，无新schema或持久缓存。
- **Exact file boundary**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/integration/runner-clean-install.test.mjs`；共享文件按P0顺序串行，预算/身份/冻结/复盘调度区域不可改。
- **Traceability**：R-008/R-009 / D-010/D-011/D-014；FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-007；SCN-013, SCN-018；T013,T014 / MATERIAL_CONTRACT_UNIFIED。

#### 事项来源与语义证据

- **Owner / responsibility**：existing planning packet producer and spec-analyze profile；仅事项来源与语义证据。
- **Real consumers**：buildPlanningArtifacts, validateStageSpecAnalyzeProfile, official build-plan analyzer facts。
- **Replacement**：Use stage introduction/source ownership for local OPEN/DEFER obligations; external references do not become locally owned. Remove substring containment as semantic verdict; retain sourced review rationale and evidence authentication, never trust caller semantic_match alone.
- **Deletion / retention**：Remove global unscoped OPEN/DEFER inference and lexical semantic verdict when replacement consumers are covered. Existing findings storage retained with no new verdict store.
- **Interfaces / input-output**：buildPlanningArtifacts传递本地定义的task/introduced_stage/owner及外部引用归属，现有stage profile消费来源事实和已认证review理由。词法仅诊断，不裁质量；缺语义依据保持unknown/incomplete/unavailable。task/material/hash验证保持原规则，不新增语义provider或轮次。
- **Exact file boundary**：`runtime/stage/stage-content-contracts.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-analyze/review-bundle.json`、`skills/wh-review/skill-bundle.json`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`；共享文件按P0顺序串行，预算/身份/冻结/复盘调度区域不可改。
- **Traceability**：R-008/R-009 / D-010/D-012/D-014；FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007；SCN-014, SCN-015, SCN-018；T015,T016 / MATERIAL_SOURCE_SEMANTICS。

#### 真实host事件与输出引用

- **Owner / responsibility**：existing explicit host bridge and canonical session adapter；仅真实host事件与输出引用。
- **Real consumers**：createWorkflowHubSessionRecorder, canonical stage outcome writer, tools/cli/derive-consumption-edges.mjs。
- **Replacement**：Align bridge and recorder event semantics; timing optional as resource fact; retain input_refs/output_refs through both recorder and canonical adapter. Record missing events honestly. No new skill dispatcher or public start/record/recover command.
- **Deletion / retention**：Delete forced-but-discarded time requirements and output-dropping copies once shared event handling is covered. Keep explicit identity checks and current single writer.
- **Interfaces / input-output**：现有bridge事件输入允许成对省略时间；提供则成对有效且顺序成立，混合输入只判可知时间关系，无时间用显式提交顺序。step/skill真实input_refs/output_refs保持同值，经recorder/canonical outcome到derive-consumption-edges；类型/命名空间/任务身份仍严格。旧缺省只读partial，复盘只验证既有单次非阻断读取，绝不改旧outcome或造自动hook。
- **Exact file boundary**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`workflows/build-plan/SKILL.md`、`runtime/stage/stage-runner.mjs`、`docs/operations/claude-e2e-sample.md`、`docs/cli-tool-mapping.md`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`；共享文件按P0顺序串行，预算/身份/冻结/复盘调度区域不可改。
- **Traceability**：R-008/R-009 / D-010/D-013/D-014；FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004, FR-CONTRACT-007；SCN-016, SCN-017, SCN-018, SCN-019；T017,T018 / HOST_EVENT_REFERENCES。

T017/T018的针对性场景必须包含全无时间、全有时间、混合时间、单边/反向/畸形时间；仅在关系可知时判断时间顺序，无时间按显式提交顺序记录，不因缺clock推断乱序或并发。用受控caller实际执行操作并在发生时生成event，再进入bridge，不能仅把recorder可接收fixture说成host执行已发生。坏类型/越界/跨task的output refs仍拒绝，输出未列evidence仍沿真实consumer连边。既有复盘测试覆盖成功/失败后的最新可用正式复盘读取与旧outcome hash不变；不改复盘调度，不把fixture当自动hook实跑。

T013/T014在runner-clean-install中增加安装后材料consumer回放，T017/T018在同文件增加安装后host事件consumer回放；它们各自纳入同组RED/GREEN命令。T019只运行三组已实现的回放与分发集成，不新增测试实现；不新增生产文件或控制面。先改真实行为再验证集成，不为T019制造假的RED。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：计划扩展 `runReviewRecovery(input,{runRound,recordContext=null,sameSourceFallback=null})`；recordContext 仅 host 注入，必须是真实匹配 task/kernel。review-record-route 内私有生命周期接收 request/runRound/preflight，捕获开始身份后再调用原 runner；保留 `recordSimpleReviewResult({task,result,kernel})` 供既有 result 消费，新增绑定参数只能由同次捕获值提供，不能信任 JSON 自报 snapshot。
- **Data flow / state**：预检→合法已有引用直接返回；首次拦截→unavailable attempt+report（resultRef=null，provider_attempts=[]）；真正新派发→不可变 started report→一次 broker→terminal attempt+report，有语义才有result→回读必要引用→返回。blocked/reused 不成为新阶段终态，available/unavailable 仍是公共形状。
- **API contract**：现有 review --action=record 只增加 request/result 互斥结构，拒绝同时提供/都缺失。request 键采用 wh-review 原字段；不得把 task/身份字段传给 provider。result 保存分支只认现有真实输出；不增加 public command/action/flag。
- **UI / external code**：N/A — non_ui。E2E 在本项目指审查服务流程；高风险仍使用 service 验证，不由无 UI 推出低风险。
- **Fail-loud behavior**：保存失败不能被 runReviewRecovery 通用 catch 吞成已保存；返回具体已写/缺失项及安全修复动作，原 provider 错误和保存错误分别保留。字段做现有脱敏，不输出凭据/原始 stderr/宿主秘密路径。

### 幂等、兼容与并发细节

任务拦截 key 包含 task/stage/track/kind/subject、材料指纹、当前 policy 与归一化原因；忽略时间戳/随机ID。严格使用当前身份的已有候选，不跨 task 或 scope。沿现有 task lock 只锁查找、验证和 create-only 写入的短临界区，绝不跨越broker等待；并发同 key 的第二个调用等待首个写入或明确返回未完整，不能新增另一 attempt。命中完整组返回原引用；部分组只补可证明同字节的缺失文件，异字节冲突 fail-loud；不生成新索引或自动重审。旧 randomUUID 范式本身不满足此合同。

开始报告使用现有 reports 下同次 id 的 `-started.md`，明确它只是开始事实、不被 canonical attempt/result 枚举。终态文件使用既有引用格式；开始报告不原位更新。首次写开始失败则不派发。可捕获取消走实际 unavailable 保存；SIGKILL/断电可能只剩 started，存储完全不可用可能什么也没留下，只能说明未观察到终态，不推断未派发或成功。

读取 schema 放宽 priority 为 optional，并允许约定 blocked/reused 兼容词汇及 optional dispatch_state；新 writer 一律用 semantic/unavailable 维持现有 consumer，blocked 是 unavailable+dispatch_state，reused 只在返回中引用原始 semantic 记录。兼容 alias 不授予认证或复用资格；result.schema.json 的 review_policy 已引用 attempt 定义，直接复用，无须为此修改该文件；有效语义之外不造 result。无 dispatch_state 的历史记录显示 legacy_unclassified，不从空 provider 数组推断未派发。

OPEN-001 工程关闭：沿现有 isMaterialOnlySnapshotDelta，只允许本任务 tasks execution-record-only 的既有 consumer 例外；不改git-worktree-snapshot或verify-code的strict snapshot/revision；stage-handlers只允许P0材料合同消费接线，身份/预算不改。内容相同但身份不符只能显示 source identity/current mismatch，保留质量缺口。usage 仍在 provider_attempts[].execution.usage；上游读错路径/词汇不复制假值去迎合，DEFER-003 继续保留。

OPEN-002 工程关闭：sink 默认保留，无 TTL 或自动清理。键只取材料指纹、归一化原因和结构性调用参数白名单（stage/track/kind/host与实际路由/policy），排除时间戳、随机ID与临时路径。用户确认无活跃调用并保留所需导出后，手动删除明确记录组或整个 sink；不影响 canonical task。sink 不实现 TaskHandle、不被 task store 枚举、不自动 fallback 到其它目录。

### 本机迁移

P1 在现有 loader 内实现 `migrateWhReviewConfig({configPath,backupPath,expectedHash})` 与 `restoreWhReviewConfig({configPath,backupPath,expectedCurrentHash,expectedBackupHash})`，P3 通过 Node import 调用；参数必须显式，返回备份/结果hash及脱敏差异，不新增公共迁移命令。读取真实配置→hash→用 wx 创建可读原字节备份→仅移除重复声明→比较 routes/无关值→替换前复读原文件 hash/身份→冲突拒绝覆盖→同目录原子替换→回读。备份真实可恢复，回滚也先核验当前内容是否仍为本次结果，拒绝覆盖后来编辑。测试注入 capture/replace 前漂移；外部不合作编辑恰在最后检查和 rename 间的竞态无法由普通 fs CAS 完全排除，RISK-002 明确限制：迁移时停止其它配置写入；不能声称无条件保护任意并发写。配置值和备份内容不进入公开报告，仅脱敏差异/hash/引用。T011把实际迁移前/后hash、备份路径、固定config_path和隔离副本恢复文件路径写入本task的 `quality/evidence/build-code/migration/operation.json` 操作证据；这些值来自当次实际读取，不能手填成功。该卡的T011先实际调用guarded restore产生成功/漂移拒写证据，再由只读Node校验独立回读备份/当前/恢复副本字节，验证hash、仅删除批准字段及原字节恢复；doctor仅为补充。漂移拒写分支由T001/T002的迁移测试证明，T011保留该原始输出引用；不新建生产脚本或通用验收平台。

### 合并后消费者的必做验证

T001 的 schema 变更之前、T005 的记录实现之前，读取上面四个当前消费者作为明确输入依赖；不是另加阶段或改排除域。在 `tests/review/review-record-route.test.mjs` 的 `producer consumer compatibility` 场景中，先调用真实 writer，再直接读取其原始 attempt/result 字节：

- `validateReviewAttemptObservation`：原始 execution.usage 保留；当前 completed 的 usage_missing、cancelled/provider_status_invalid 和 result缺status等消费缺口仍返回incomplete，不复制假字段迎合它。
- `canonicalReviewFindings`、`validateReportableFindingDispositions` 与 `deriveSeriousReviewPause`：真实finding ID/source ref/hash可读；缺处置、错ID、未授权accepted_risk被拒；调用前后原文件不变。
- `buildStageInputPacket`/`verifyStageInputPacket`：真实四材料、kernel snapshot/revision；改一个字节即拒绝，不新增材料权威。
- `officialStageHandler("build-plan")`：至少一条实际refs进入reviewFacts/verifyReviewChain的集成场景。最小合法plan/task fixture隔离上游格式问题；worker.readReceipt必须读生产writer原字节并现场算hash，不得重建attempt/output替换来源；错引用/缺output明确拒绝，缺其它阶段事实仍missing。

T005/T006 的现有整文件命令已覆盖这些新增测试；不需要为读取consumer修改其生产文件。request/result互斥测试明确覆盖同时提供和全部缺失，均零派发；旧result-only只保存。

### 当前任务P0前置依赖

原DEP-ACCEPTANCE-001只是旧计划的外部交接说明，现由D-010～D-014纳入本任务P0，不保留外部owner许可证。T013/T014修ID/风险/角色/oracle，T015/T016修来源与语义证据，T017/T018修显式事件/引用，T019验证同一材料的完整消费和分发。T001在T019后开始；T012设计为ready、实施状态pending，必须实际完成前置与28项AC才可声明验收。

旧F-306ea227d8fb/F-ca15d823acd9及原退出1记录保留为旧范围事实，不能标成已验证修复。N/A只表示无新增行为实现：T019集成、T011迁移和T012最终验收仍有真实风险/证据义务。高风险按真实D-003字段/spec引用与service验收，不伪造D6/D7、不降not_required。P0不修F-020冻结自指、预算、usage消费或身份等价；其缺口仍披露。本轮只准备材料，在build-code前停止。

### 受保护恢复与真实验收操作合同

#### 1. plan“本机迁移”段与T001/T002：补私有guarded restore

在现有 skills/wh-review/scripts/third-review-host-config.mjs 同migration函数并列设计：

`restoreWhReviewConfig({configPath, backupPath, expectedCurrentHash, expectedBackupHash})`

唯一consumer=T011隔离恢复演练及明确需要恢复时的操作调用者；owner=现有loader；不新增public命令/生产文件。返回 `{configPath, backupPath, beforeHash, afterHash, restored:true}`，仅真实回读后返回。步骤：显式参数→读取backup核对expectedBackupHash→读取目标核对expectedCurrentHash并记录文件身份→准备同目录临时原字节→替换前复读目标hash/身份→漂移抛 `CONFIG_RESTORE_CONFLICT` 且不写目标→原子替换→回读并核对备份hash。备份缺失/坏hash拒绝、不修改备份；保留迁移原并发限制（非合作写入在检查与rename间竞态不能靠普通fs CAS彻底保证，操作窗口停止其它写入）。失败不返回restored:true。

T001/T002在动作、共同oracle和现有third-review-host-config.test.mjs覆盖：迁移→真实restore成功回原字节；restore前目标人为漂移→CONFIG_RESTORE_CONFLICT且漂移字节保持；替换前注入漂移→同样拒绝；备份坏hash/缺失拒绝且目标不变。两卡同命令，无新测试文件。P1接口清单/职责登记列出restore，与migration同删除/保留条件。

#### 2. T011：由执行真实restore生成证据，hash校验仅独立复核

隔离副本恢复演练：在task既有 `quality/evidence/build-code/migration/` 创建一次性操作证据脚本 `operation.mjs`（不是生产脚本/新工具；脚本字节与原始输出保留为证据）。先读取真实config生成beforeHash，以真实路径调用migrateWhReviewConfig；禁止手填before/after成功值。迁移后只在隔离副本调用restoreWhReviewConfig，真实配置维持迁移结果。成功副本与漂移副本各独立：

- success副本起始为真实迁移后字节，expectedCurrentHash=真实afterHash；调用restore，回读等于backup原字节。
- drift副本起始同上，再写受控不同字节，仍传真实afterHash；必须捕获CONFIG_RESTORE_CONFLICT且回读保持漂移字节。禁止以复制backup到rollback_probe_path代替restore调用。
- operation.json增加 `restore_success:{target,before_sha256,expected_current_sha256,return_value,after_sha256}`、`restore_conflict:{target,expected_current_sha256,drift_sha256,error_code,after_sha256}`，路径/hash均来自执行；输出不打印配置正文或凭据。

明确操作命令（cwd=认证worktree）：

```sh
node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/migration/operation.mjs
node skills/wh-review/scripts/wh-review-cli.mjs doctor
```

T011 gate_cmd执行独立只读hash复核及断言restore_success.return_value.restored===true、成功after==backupHash、conflict.error_code==='CONFIG_RESTORE_CONFLICT'、conflict.after==driftHash；操作脚本/两条命令列入“scenarios / commands / expected exit / oracle”，不能只保留只读命令。expected exit=0意为操作证据断言满足，不是doctor能替代恢复成功。脚本允许导入拟实现private函数，固定loader绝对路径由认证worktree解析；不得生产注册或安装。

#### 3. T012/T005/T006/T007/T008：冻结真实操作输入及观测合同

request最小形状（T006对接现有request字段，此处选择既定integration输入；身份从CLI认证上下文捕获，不信任JSON自报snapshot）：

```json
{"request":{"stage":"build-code","host_provider":"<当前真实宿主provider ID>","review_track":null,"review_kind":"integration","materials":{"approved_spec":"<当前spec完整原文>","acceptance_criteria":"<spec第11节当前AC原文>","test_evidence":"<T019及T001～T011真实验证事实与原始引用>","ac_trace":"<28AC逐项事实与未覆盖项>"}}}
```

此integration形状按当前 `runtime/review/stage-materials.json` required-minus-generated列出：approved_spec、acceptance_criteria、test_evidence、ac_trace；不得提交该surface禁止的changes_diff/raw_log/integration_map。review_instructions/test_summary由现有producer生成，不要求caller伪填。未来配置若不支持既定integration路由，明确unavailable，不能换review_kind绕过预算。这是形状示例；T012的 `operations.mjs` 的prepare模式从当前真实四材料和已实施差异读取，不留下角括号占位符；按当前真实host设置host_provider。脚本不运行provider。写 `request.json`（上层request）及 `bare-request.json`（仅内层request原样）；同时写 `identity.json`：project/task/stage、认证worktree、当前snapshot_tree/material_revision（通过已有bootstrapStage/kernel只读取得）、每份提交材料sha256、request文件sha256、当前route与provider选择的脱敏只读事实。record入口重读并绑定当前身份；不增加request身份控制字段、不把TaskHandle送provider。若阶段实际路由要求track/kind，用现有route真实值替代null并记录，不能发明新值绕预算。

T012指定以下现有入口命令（cwd=认证worktree；保存每条公共JSON、stderr摘要/hash与exit）：

```sh
node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/final/operations.mjs prepare
node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-review-flow-repair-20260906 --stage=build-code --input=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/final/request.json
node skills/wh-review/scripts/wh-review-cli.mjs run /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/final/bare-request.json
```

其中后两条仅在build-code执行、对应实际派发已授权且不超现有review预算时运行；sink裸run可能再次派发，不能把task调用授权自动等同额外裸派发预算。若预算仅容一次，把裸sink成功/失败覆盖留给T007/T008的隔离受控caller，真实裸run明确未覆盖，不能伪造成功；也不另开review身份绕过预算。对于canonical首次调用，若当前已有允许复用的原记录，返回原引用，不强制制造新派发。

复用/重复：T006证明同request原字节再次进入record不新增broker/attempt，T012只在该针对性证明已绿后以相同record命令重放一次并回读原引用；如果此证明未通过，不实际重放provider。不得改时间/随机ID绕幂等。静态失败/存储失败样本在T003/T004、T005/T006、T007/T008的隔离真实入口fixture中完成，不破坏真实host配置制造失败。

##### 必须记录的操作证据（T012现有final目录）

同一一次性 `operations.mjs` 的observe模式用spawn运行允许的上述命令，process.hrtime.bigint覆盖整个进程调用，记录每次create-only的operation-<case>.json：`case, argv, request_sha256, identity_ref, started_at, elapsed_ms, exit_code, stdout_ref, stderr_digest, response, attempt_ref, result_ref, report_ref, before_refs, after_refs, broker_dispatch_count, dispatch_count_source, coverage_status`。不把exit0当review成功，读取response.status/error与真实落盘。task证据只保留公开脱敏JSON及stderr摘要/hash；原始provider输出/原始stderr仅留既有host-private诊断，不复制秘密路径或原文进task。

- 返回引用必须逐一TaskHandle回读、保存hash，核对task/stage/snapshot/material当前绑定；同request复用前后记录原引用不变、不新增attempt。result_ref=null是合法无语义失败，不伪造结果；已声明的引用不可读是保存失败。
- provider耗时来自原attempt.provider_attempts[].execution.timing，逐个保留缺失；operation elapsed是进程总时长，不能替代静态预检内部≤1000ms的受控单调时钟测试。
- broker_dispatch_count只能来自实际dispatcher/caller观测或完整落盘派发事实，不用provider_attempts.length冒充broker调用数，不用缺记录推0。T005/T006现有runRound注入stub的真实计数可证明fixture为1/复用为0；真实CLI若没有独立计数来源就写null/source unavailable，且相关实跑计数AC未验证，不编造。
- provider策略：只消费当时3rd-review真实route/provider定义、host隔离与既有预算；成功/partial/all-failed如实记，外部全失败不重试追绿。非法provider/静态失败使用隔离fixture，不修改本机3rd-review配置。
- 证据脚本是本task一次性可复现操作材料，无schema注册/新CLI/新生产文件；T012只操作，脚本保存运行前字节/hash供审计。T005～T008的动作和oracle同步明确入口、计数位置、返回引用与elapsed边界，先证明复用不再派发。

T012执行 `node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/final/operations.mjs observe` 保存获授权操作的真实退出码与引用；把prepare/observe命令列入额外操作commands，不挤进Vitest gate_cmd；其pass仍要求所有适用必需AC实测满足。未获额外派发预算/计数不可观测/外部provider失败时保留未覆盖或失败，不能因操作prose补齐就宣称验收可通过。


### 本轮独立审查处置

来源：`quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json`；available/partial不等于全provider成功；grok/grok=PROVIDER_HEALTH_FAILED，pi/v4flash=PROVIDER_IDENTITY_INVALID。本次仅一次当前扩展材料调用，不为修订后追空findings再调用。

| Finding | 处置 | 依据与当前修订 |
| --- | --- | --- |
| F-102e1e773654 | fixed | 统一全部P0/P1/P2/FINAL命令为本机已验证的kebab-case参数与显式forks；未断言旧camel-case必然无效，当前一致性歧义已消除。 |
| F-286a3fd24f6e | fixed | distribution-closure从MODIFY移出，明确READ/VERIFY ONLY；T019只运行现有检查，runner-clean-install真实新增回放已有T013/14和T017/18负责。无需改既有closure断言，不制造RED。 |
| F-b18d303fe3b5 | fixed | plan定义T012真实integration request所需字段、认证身份、existing CLI、一次性prepare/observe及引用/计时/次数观测；T012卡含明确命令，T005-8覆盖计数与复用。预算缺失/计数unknown保持未验证。 |
| F-c46d1efa9511 | rejected_invalid | 原输入draft_plan与冻结原字节均为9df61232；生产redactProviderHostPaths后精确为32bb659b，路径脱敏形成derived provider view。canonical任务versioned_refs必须绑定原材料，不能改为脱敏副本hash。 |
| F-da203409886f | fixed | plan/tasks显式spec第11节为28AC唯一来源，acceptance_criteria仅同源审查视图；不新增第五权威材料。 |
| F-e301e199e2f8 | fixed | 在既有loader规划restoreWhReviewConfig显式hash守卫；T001/2正负例包括成功恢复/两时点漂移/坏备份；T011执行真实隔离restore并独立回读成功/拒写证据，copy不算恢复。 |

审查原始绑定属于修订前输入；本轮修订依靠上述定位证据与末次本地分析，不声称provider已经复审最终字节。高风险与所有实施AC仍待真实验证。

## UI Delivery Contract

N/A — 已决 non_ui，无 UI、Design.md、Experience.md、组件、浏览器或截图改动；frontend-component-quality 不触发。高风险服务验收仍适用。

## File Boundary

### NEW

- `tests/review/review-policy-compatibility.test.mjs`

### MODIFY

- `skills/wh-review/scripts/third-review-host-config.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `docs/architecture/move-map.json`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `tests/helpers/formal-review.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/scripts/simple-review-runner.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `runtime/review/review-record-route.mjs`
- `skills/wh-review/scripts/review-result.mjs`
- `tools/cli/stage-runtime.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `tests/review/review-record-route.test.mjs`
- `skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- `tests/e2e/stage-reflection-real-task.test.mjs`
- `tests/contract/runtime-facade.test.mjs`
- `tests/contract/review-layering.test.mjs`
- `tests/integration/mini-task-delivery.test.mjs`
- `tests/contract/workflow-evolution-final-aggregate.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `skills/wh-review/SKILL.md`
- `skills/wh-review/contracts/provider-protocol.md`

- `docs/cli-tool-mapping.md`
- `docs/operations/claude-e2e-sample.md`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `skills/spec-analyze/SKILL.md`
- `skills/spec-analyze/review-bundle.json`
- `skills/spec-analyze/skill-bundle.json`
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-tasks/SKILL.md`
- `skills/spec-tasks/skill-bundle.json`
- `skills/spec-tasks/templates/tasks-template.md`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/skill-bundle.json`
- `tests/contract/build-reflection-page.test.mjs`
- `tests/contract/claude-outcome-packet.test.mjs`
- `tests/contract/confirmation-authorization.test.mjs`
- `tests/contract/derive-consumption-edges.test.mjs`
- `tests/contract/filled-plan-task-production.test.mjs`
- `tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- `tests/contract/host-outcome-bridge.test.mjs`
- `tests/contract/material-oracle-context-packet.test.mjs`
- `tests/contract/material-producer-consumer-roundtrip.test.mjs`
- `tests/contract/plan-acceptance-task-gate.test.mjs`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `tests/contract/stage-runner-on-stage-end.test.mjs`
- `tests/integration/runner-clean-install.test.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `workflows/build-plan/SKILL.md`

### DO NOT TOUCH

- `runtime/stage/stage-handlers.mjs` 的质量裁决、预算与身份认证区域：P0仅接入共享材料合同，不放宽这些区域。
- `runtime/evidence/stage-content-evidence.mjs`：usage 消费缺口属 D-007 排除域。
- `runtime/task/git-worktree-snapshot.mjs`：既有等价定义不放宽。
- `runtime/stage/stage-content-contracts.mjs` 的冻结绑定/预算/历史规则：P0仅列明的材料解析、oracle、事项归属和语义证据消费区域可改。
- `specs/workflowhub-review-flow-repair-20260906/decision-log.md`：本轮已授权增量之外不重写方向；未来build-code只消费。
- `specs/workflowhub-review-flow-repair-20260906/spec.md`：本轮已授权增量之外不改产品合同或风险ID；未来build-code只消费。

外部操作边界：P3 仅备份/迁移 `~/.config/workflowhub/config.json`；不修改 `~/.config/3rd-review/config.json`。外部配置不伪装仓库生产文件。任务/sink 输出是运行证据，不列成新增代码文件。

restore与migration同属现有loader，consumer=T011隔离恢复/实际需要的操作调用；由T001/T002测试，退休条件=配置迁移协议不再支持时一起删除，无永久兼容writer。

## Technical Decisions

### DEC-001 — 单源和窄兼容

- **Problem**：重复 profiles/priority 产生已知误阻塞，历史记录不可随新写格式被拒读。
- **Options**：保留双源校验；复制兼容配置；直接消费唯一源。
- **Selected**：extend — 删除双源约束、保留现有 loader 和 legacy 分支。
- **Reason**：实现 D-001/D-004/D-005，policy 自然变化，不造历史迁移平台。
- **Consequence / risk**：旧policy失去复用资格但可读，未迁移本机配置明确失败。
- **Fallback**：保留原字节备份；实现回滚不改已写新旧记录。

### DEC-002 — 现有 host owner 完成调用与保存

- **Problem**：裸输出和两步 host 调用留下漏记录窗口。
- **Options**：新dispatcher；runner内部写task；现有 review action 注入私有适配器。
- **Selected**：extend — review --action=record 增加 request 与 result 互斥输入，runReviewRecovery 接 recordContext。
- **Reason**：真实 consumer 已存在；只在当前 owner 接线，D-003 的落盘不侵入 runner 内部。
- **Consequence / risk**：必须保护旧 result 分支零派发；前后身份变化不得再认证旧输出。
- **Fallback**：保留旧 result 保存兼容输入；发生保存错误不 fallback 到非权威或新任务。

### DEC-003 — 非权威 sink 与开始报告

- **Problem**：裸跑无诊断；进程中断前无开始事实，返回前的完整终态不总能保证。
- **Options**：冒充 task；另建运行台账；使用现有 record-route 和 report 载体。
- **Selected**：new — 仅新增已批准 sink 及 immutable started 报告对象；复用当前 writer/lock，不新增生产模块、schema、command、index。
- **Reason**：D-003/FR-RECORD-004 与 RISK-003 有直接消费者；task 与 sink 二选一避免双写。
- **Consequence / risk**：持久对象增长，默认保留；硬杀无法保证终态。owner/consumer/测试/删除条件在能力表和 T005–T008/T011 登记。
- **Fallback**：明确保存失败和缺失证据；不升级为恢复许可证或自动清理。
- **F10 real threat**：R-004 实际零落盘及中断证据缺失。
- **F10 existing cover**：TaskHandle 只适用于认证 task；现有 report writer 可复用，裸跑无合法 canonical owner。
- **F10 bypassable**：私有 API 单独调用不能保证 host 存储；所有公开 run 和 host request 经过同一适配器，测试检查真实消费者。
- **F10 maintenance cost**：维护一个窄 sink 变体和 started report 格式；无新 dispatcher/index/TTL，删除条件明确。
- **F10 disposition**：keep

### DEC-004 — 在本任务统一合同，保留风险与身份

- **Problem**：默认ID/风险、N/A和oracle合同互斥，事项归属与词法判断误判，真实事件与输出引用丢失。
- **Options**：改号/伪GREEN绕过；交外部未知owner；按D-010～D-014在P0修现有消费者。
- **Selected**：extend — 共享现有内存合同和显式事件字段，删除被替代的局部parser/丢字段复制，T019验证完整消费。
- **Reason**：真实消费者已存在；修复生产者和消费者的一致性，不造新工作许可证。
- **Consequence / risk**：实施前旧错误仍在；词法退出不能让自报boolean变质量通过，输入输出不能冒充执行证据。
- **Fallback**：保留真实D-003风险、严格身份、旧报告和独立finding；越出预算/usage消费/自动hook边界则停止该修改并如实交接。

## Test Strategy

验收标准唯一来源为当前 `spec.md` 第11节的28项AC。审查输入acceptance_criteria仅是该来源的只读视图，不是独立验收材料或第二份权威；重复传输不增加证据，最终T012逐项消费同一来源。

当前增量test-routing-advisor判定P0/P1/P2/P3与T019、FINAL均为fullstack，具体技能fullstack-slice-testing；此为build-plan预判，未来build-code按实际changed files确认。P0三组跨材料协议、正式handler、host记录和分发；P1配置/schema；P2身份/并发/持久化；P3真实配置/provider，局部单测不代替这些seam。原五组与P0三组共八组RED/GREEN；T019是N/A集成，T012唯一最终acceptance。以下命令均未执行，本轮不启动build-code。

隔离 fixture：临时 home/task/config、冻结新旧记录、可观察 broker stub、受控文件故障 hook、单调时钟。普通针对性测试无网络；P3 真实 provider 使用既有配置和已授权材料，预算只引用既有规则，不为完成矩阵自动重审。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |

| AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-007 | T013 | RED | `npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | MATERIAL_CONTRACT_UNIFIED / `quality/evidence/build-code/material_contract_unified/` |

| AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-007 | T014 | GREEN | `npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | MATERIAL_CONTRACT_UNIFIED / `quality/evidence/build-code/material_contract_unified/` |

| AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007 | T015 | RED | `npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | MATERIAL_SOURCE_SEMANTICS / `quality/evidence/build-code/material_source_semantics/` |

| AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007 | T016 | GREEN | `npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | MATERIAL_SOURCE_SEMANTICS / `quality/evidence/build-code/material_source_semantics/` |

| AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004, AC-CONTRACT-007 | T017 | RED | `npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | HOST_EVENT_REFERENCES / `quality/evidence/build-code/host_event_references/` |

| AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004, AC-CONTRACT-007 | T018 | GREEN | `npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | HOST_EVENT_REFERENCES / `quality/evidence/build-code/host_event_references/` |

| 新增11项AC | T019 | N/A — non-behavior integration | `npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | MATERIAL_HOST_INTEGRATION / `quality/evidence/build-code/material_host_integration/` |

| AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001 | T001 | RED | `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | REVIEW_CONFIG_COMPAT / `quality/evidence/build-code/review_config_compat/` |

| AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001 | T002 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | REVIEW_CONFIG_COMPAT / `quality/evidence/build-code/review_config_compat/` |

| AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-SAFETY-001 | T003 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | REVIEW_STATIC_PREFLIGHT / `quality/evidence/build-code/review_static_preflight/` |

| AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-SAFETY-001 | T004 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | REVIEW_STATIC_PREFLIGHT / `quality/evidence/build-code/review_static_preflight/` |

| AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001, AC-SAFETY-002 | T005 | RED | `npx vitest run tests/review/review-record-route.test.mjs tests/e2e/stage-reflection-real-task.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/contract/runtime-facade.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | REVIEW_TASK_RECORD / `quality/evidence/build-code/review_task_record/` |

| AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001, AC-SAFETY-002 | T006 | GREEN | `npx vitest run tests/review/review-record-route.test.mjs tests/e2e/stage-reflection-real-task.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/contract/runtime-facade.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | REVIEW_TASK_RECORD / `quality/evidence/build-code/review_task_record/` |

| AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-004, AC-RECORD-005, AC-SAFETY-001 | T007 | RED | `npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review/review-record-route.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | REVIEW_BARE_SINK / `quality/evidence/build-code/review_bare_sink/` |

| AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-004, AC-RECORD-005, AC-SAFETY-001 | T008 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review/review-record-route.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | REVIEW_BARE_SINK / `quality/evidence/build-code/review_bare_sink/` |

| AC-E2E-001, AC-CONFIG-002, AC-COMPAT-002, AC-RECORD-002, AC-RECORD-003, AC-SAFETY-001, AC-SAFETY-002 | T009 | RED | `npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 1 | REVIEW_E2E_FIRST / `quality/evidence/build-code/review_e2e_first/` |

| AC-E2E-001, AC-CONFIG-002, AC-COMPAT-002, AC-RECORD-002, AC-RECORD-003, AC-SAFETY-001, AC-SAFETY-002 | T010 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 | REVIEW_E2E_FIRST / `quality/evidence/build-code/review_e2e_first/` |

所有 RED 必须由预定行为断言失败产生，不以新 import/fixture/setup 失败代替。GREEN 使用同一命令/ID并保留负例。P2 含真实写盘的≤1000ms逐样本检查，不能用纯函数微基准代替。

T012最终current-snapshot aggregate将原13个文件与P0的14个文件去重合并为27个受影响文件，只运行此集合一次，逐项覆盖28项AC；只证明 fixture/consumer seam，真实调用事实另逐 AC 记录。任何未执行/失败项阻止“全部验证完成”声明，不阻止同任务修复。

`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/contract/runtime-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`

expected_exit=0；oracle=REVIEW_FINAL_ACCEPTANCE；evidence_path=`quality/evidence/build-code/final/`。FINAL pass必须28项AC全部有真实满足证据；逐项记录failed/未执行只证明记录完整，不能满足FINAL pass。27文件聚合退出0仍不能代替实际配置/调用/引用及未覆盖场景。

## Rollback and Recovery

- **Global recovery rule**：仅回滚本次实现或恢复经当前 hash 验证的本机配置；保留四材料、原始 review 与所有失败证据。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 另行授权；本计划确认不包含这些操作。
- **Recovery owner**：build-code 执行者修复所属卡；配置冲突交当前配置维护者；材料/事件合同缺陷由P0本任务owner修复；预算/usage/身份越界交原owner，不默默扩范围。

### Engineering Risk Handoff

- **PLAN-RISK-001**：身份与usage消费
  - **Affected IDs**：FR-RECORD-003 / FR-COMPAT-001 / FR-SAFETY-002 / T006
  - **Trigger**：新旧引用或usage进入现有consumer
  - **Consequence**：当前认证或统计incomplete
  - **Mitigation or STOP**：保留原始身份/execution.usage；只使用既有窄例外，需改预算/身份即STOP该修改
  - **Handling Stage**：build-plan/build-code
  - **Verification**：真实 producer→record→consumer 和当前/跨树负例

- **PLAN-RISK-002**：本机配置并发与恢复
  - **Affected IDs**：FR-CONFIG-003 / T002 / T011
  - **Trigger**：备份/迁移/恢复期间有其它写入
  - **Consequence**：可能覆盖用户修改或备份不可用
  - **Mitigation or STOP**：wx备份、前后hash、观测漂移拒写；迁移时停止其它写入；普通fs的最后比较/rename窗口如实披露
  - **Handling Stage**：build-code
  - **Verification**：原字节恢复、注入漂移、脱敏diff及实际备份引用

- **PLAN-RISK-003**：存储和不可捕获中断
  - **Affected IDs**：FR-RECORD-001 / FR-RECORD-005 / T006 / T008
  - **Trigger**：部分写失败/SIGTERM/SIGKILL/断电
  - **Consequence**：缺少终态或只留开始事实
  - **Mitigation or STOP**：create-only+开始报告；可捕获取消真实保存；缺失不编造，硬杀不保证完整组
  - **Handling Stage**：build-code/verify-code
  - **Verification**：不可写/冲突/部分写/取消注入；记录留存hash与缺失项

- **PLAN-RISK-004**：静态1秒目标
  - **Affected IDs**：FR-PREFLIGHT-002 / T006 / T008 / T012
  - **Trigger**：慢I/O/锁争用/大材料
  - **Consequence**：实际返回超过1000ms
  - **Mitigation or STOP**：锁前纯预检、首次检查至返回引用完整计时；超限失败，不改阈值
  - **Handling Stage**：build-code
  - **Verification**：每个代表性样本单调时间与派发/锁/打包计数

- **PLAN-RISK-005**：高风险验收ID契约不兼容
  - **Affected IDs**：D-002 / D-003 / D-005 / FR-DELIVERY-001 / T013 / T014 / T019 / T012
  - **Trigger**：最终e2e_scope=high_risk_user_visible校验
  - **Consequence**：当前parser只认D数字且要求D6/D7，实际D-xxx无法认证
  - **Mitigation or STOP**：保留non_ui+service高风险；不伪造D6/D7、不降not_required；由本任务T013/T014修真实定义与风险引用，T019/T012验收；不改身份/预算
  - **Handling Stage**：build-code（当前仅规划）
  - **Verification**：同一材料通过全部消费者及缺风险/错身份负例；当前原始错误保留、测试未执行

- **PLAN-RISK-006**：非行为oracle角色合同冲突
  - **Affected IDs**：FR-CONFIG-003 / FR-DELIVERY-001 / T013 / T014 / T019 / T011 / T012
  - **Trigger**：结构与material oracle同时校验
  - **Consequence**：结构要求N/A附理由而oracle只收精确N/A
  - **Mitigation or STOP**：保持真实非行为卡，不伪装RED/GREEN；由本任务T013/T014统一role/reason，T019复验；当前material oracle错误如实保留
  - **Handling Stage**：build-code（当前仅规划）
  - **Verification**：validatePlanTaskContract与validateMaterialOracleContract各自原始结果

### OPEN / DEFER handoff

| ID | Owner | Trigger | Handoff / consumer | Close / retain condition |
| --- | --- | --- | --- | --- |
| OPEN-001 | build-plan主会话；实施归记录owner | 引用消费设计 | T005/T006，原身份consumer | 工程边界已核实：只保留既有例外；实施以跨树负例证明，不改预算/身份 |
| OPEN-002 | build-plan主会话；运行归本机调用者 | sink生命周期设计 | T007/T008/T011 | 工程已明确默认保留、人工清理、无TTL；实现和说明一致时完成验证 |
| DEFER-001 | 审查能力维护者 | 后续独立需求确认 | 后续provider健康设计 | 本期不做健康探测；另有批准方案及实测才关闭 |
| DEFER-002 | 审查性能维护者 | 真实耗时支持新预算 | 后续性能任务 | 只验证静态1秒，不改timeout；新口径获批准才关闭 |
| DEFER-003 | close-readiness维护方 | 相邻消费维修授权 | 现有usage观察能力 | 本期保留原始字段和缺口；canonical在消费侧正确读取才关闭 |
| DEFER-004 | 审查性能维护者 | 独立benchmark需求 | 后续性能评估 | 不做广泛性能结论；代表性样本/方法/结果获确认才关闭 |
| OPEN-004（外部：close-readiness） | close-readiness维护方 | 用户侧3rd-review provider配置仍需修复或上游交付 | handoff：上游既有用户侧配置修复；本任务仅loader兼容与T011不改3rd-review配置的边界观察，不新增实施任务 | 由上游owner以实际配置与验证证据关闭；本任务不代其宣称完成 |

| DEFER-005 | 宿主适配维护者 | 存在真实host执行入口且另有授权 | 后续现有host集成设计 | 全宿主自动hook、跨进程恢复和自动token/时间采集延期；真实host产生可验证事件且无新dispatcher/双写后才关闭 |

编号来源说明：DEFER-001～004与OPEN-001/002定义于build-spec，方向依据仍是T-009/D-003/D-007；DEFER-005 introduced_stage=make-decision本次D-013。T015/T016从引入阶段向下检查本地义务，外部OPEN-004不变成本任务关闭义务；原方向承诺仍映射下游。当前旧错误保留，未来不伪造历史编号。

## Implementation Order

P0 材料合同与显式事件→P1 契约生产者→P2 预检/记录/裸跑/E2E消费者→P3 迁移与真实验收。P2 内按 T003→T010 串行，因 CLI/record-route 文件共享；producer未完成时不假造下游 GREEN。T011 迁移仅执行已有实现，T012 为唯一 acceptance。

## Dependencies and Parallelism

- **Dependencies**：T013→T014→T015→T016→T017→T018→T019→T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011→T012；RED/GREEN先后与共享文件所有权要求串行。
- **Parallel work**：N/A — 行为卡共享配置/记录接口，实施不并行修改；独立审查可读冻结材料。
- **External dependencies**：真实provider可 unavailable；保留真实失败，不能换模型/扩大预算/自动重审。测试 fixture 不依赖外部服务。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |

| R-008/R-009 / D-010/D-011/D-014 | FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-007 | AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-007 | P0/T013,T014 | none | `runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/integration/runner-clean-install.test.mjs` | MATERIAL_CONTRACT_UNIFIED（命令见Test Strategy）；SCN-013,SCN-018 |

| R-008/R-009 / D-010/D-012/D-014 | FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007 | AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007 | P0/T015,T016 | T014 | `runtime/stage/stage-content-contracts.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-analyze/review-bundle.json`、`skills/wh-review/skill-bundle.json`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs` | MATERIAL_SOURCE_SEMANTICS（命令见Test Strategy）；SCN-014,SCN-015,SCN-018 |

| R-008/R-009 / D-010/D-013/D-014 | FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004, FR-CONTRACT-007 | AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004, AC-CONTRACT-007 | P0/T017,T018 | T016 | `tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`workflows/build-plan/SKILL.md`、`runtime/stage/stage-runner.mjs`、`docs/operations/claude-e2e-sample.md`、`docs/cli-tool-mapping.md`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs` | HOST_EVENT_REFERENCES（命令见Test Strategy）；SCN-016,SCN-017,SCN-018,SCN-019 |

| R-008/R-009 / D-014 | FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007, FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004 | AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004 | P0/T019 | T018 | `tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs` | MATERIAL_HOST_INTEGRATION；SCN-013～019；命令见Test Strategy |

| R-001, R-002, R-004, R-007 / D-001, D-004, D-005, D-008 | FR-CONFIG-001, FR-CONFIG-002, FR-CONFIG-003, FR-COMPAT-001, FR-COMPAT-002, FR-SAFETY-001 | AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001 | P1/T001,T002 | T019 | `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`tests/helpers/formal-review.mjs` | REVIEW_CONFIG_COMPAT（命令见 Test Strategy） |

| R-002, R-003, R-007 / D-002, D-008 | FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-SAFETY-001 | AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-SAFETY-001 | P2/T003,T004 | T002 | `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs` | REVIEW_STATIC_PREFLIGHT（命令见 Test Strategy） |

| R-003, R-004, R-005, R-007 / D-002, D-003, D-004, D-005, D-007, D-008 | FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-001, FR-RECORD-002, FR-RECORD-003, FR-RECORD-005, FR-COMPAT-001, FR-COMPAT-002, FR-SAFETY-001, FR-SAFETY-002 | AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001, AC-SAFETY-002 | P2/T005,T006 | T004 | `tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/cli/stage-runtime.mjs` | REVIEW_TASK_RECORD（命令见 Test Strategy） |

| R-003, R-004, R-007 / D-002, D-003, D-008 | FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-004, FR-RECORD-005, FR-SAFETY-001 | AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-004, AC-RECORD-005, AC-SAFETY-001 | P2/T007,T008 | T006 | `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs` | REVIEW_BARE_SINK（命令见 Test Strategy） |

| R-001, R-002, R-004, R-005, R-007 / D-001, D-003, D-005, D-006, D-007, D-008 | FR-E2E-001, FR-CONFIG-002, FR-COMPAT-002, FR-RECORD-002, FR-RECORD-003, FR-SAFETY-001, FR-SAFETY-002 | AC-E2E-001, AC-CONFIG-002, AC-COMPAT-002, AC-RECORD-002, AC-RECORD-003, AC-SAFETY-001, AC-SAFETY-002 | P2/T009,T010 | T008 | `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-runner.mjs` | REVIEW_E2E_FIRST（命令见 Test Strategy） |

| R-001/R-002/R-004/R-007 / D-001/D-003/D-008 | FR-CONFIG-003, FR-RECORD-004, FR-SAFETY-001 | AC-CONFIG-003, AC-RECORD-004, AC-SAFETY-001 | P3/T011 | T010 | `skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md` | REVIEW_MIGRATION_OPERATION（doctor 与实际迁移事实） |

| R-001～R-009 / D-001～D-014 | FR-CONFIG-001, FR-CONFIG-002, FR-CONFIG-003, FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-001, FR-RECORD-002, FR-RECORD-003, FR-RECORD-004, FR-RECORD-005, FR-COMPAT-001, FR-COMPAT-002, FR-E2E-001, FR-SAFETY-001, FR-SAFETY-002, FR-DELIVERY-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007, FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004 | AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-004, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-E2E-001, AC-SAFETY-001, AC-SAFETY-002, AC-DELIVERY-001, AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004 | P3/T012 | T011 | `skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md` | REVIEW_FINAL_ACCEPTANCE（唯一聚合命令见 Test Strategy） |

### AC 原文四段（spec 为产品权威，逐字投影）

- [ ] **AC-CONFIG-001**：一处修改 provider 即生效。
  - **需求**：FR-CONFIG-001。
  - **来源/决策**：R-001/R-002、D-001。
  - **可观察场景**：SCN-001。
验证：配置契约测试与迁移后一次真实加载。
通过：没有 WorkflowHub profiles 声明也能解析合法 provider；改变 provider 定义仅需修改唯一源。
失败：要求 profiles、对两份定义做一致性阻塞、保留 priority 作为新配置必需项。
证据：配置前后差异、加载输出与针对性测试记录。

- [ ] **AC-CONFIG-002**：列表顺序和既有选择约束。
  - **需求**：FR-CONFIG-002。
  - **来源/决策**：R-001、D-001/D-008。
  - **可观察场景**：SCN-002。
验证：路由顺序与 legacy 无显式路由场景的行为测试。
通过：initial/closure 各自顺序稳定；原异源/人数约束和 legacy 选择结果保留。
失败：按 priority 排序、乱序无理由报错或删掉 legacy 行为。
证据：输入列表、实际选择序列和负向测试记录。

- [ ] **AC-CONFIG-003**：迁移可恢复且不误改。
  - **需求**：FR-CONFIG-003。
  - **来源/决策**：R-001/R-002、D-001。
  - **可观察场景**：SCN-010。
验证：比较备份、迁移后配置及回滚演练。
通过：备份真实可读，路由顺序与无关配置不变；旧配置拒绝信息给出迁移动作；可恢复原字节。
失败：无备份、改变 provider 定义、清空路由、覆盖用户并发配置修改或无法恢复。
证据：备份引用及 hash、脱敏差异、迁移/回滚结果。

- [ ] **AC-PREFLIGHT-001**：必败在派发前暴露。
  - **需求**：FR-PREFLIGHT-001。
  - **来源/决策**：R-002/R-003、D-002。
  - **可观察场景**：SCN-003。
验证：逐类注入静态非法输入，观察打包、锁获取及 broker 调用。
通过：每类输入都被识别，打包/锁等待/派发调用数均为零。
失败：漏检、错误已知但仍等待锁或发出 provider 请求。
证据：各输入、边界调用观察与失败诊断。

- [ ] **AC-PREFLIGHT-002**：1 秒内失败且 unknown 可运行。
  - **需求**：FR-PREFLIGHT-002。
  - **来源/决策**：R-003、D-002。
  - **可观察场景**：SCN-003/004。
验证：单调时钟测量实际拦截入口到返回引用，另用合法输入加 unknown 探测运行。
通过：每个静态失败样本耗时≤1000ms；unknown 单独存在时不拦截。
失败：任一样本超限、排除写盘时间统计、unknown 被映射为必败。
证据：时间测量边界、样本输出及派发观察；失败样本保留。

- [ ] **AC-PREFLIGHT-003**：原因与行动完整。
  - **需求**：FR-PREFLIGHT-003。
  - **来源/决策**：R-002/R-003、D-002/D-008。
  - **可观察场景**：SCN-003/005。
验证：读取各类预检和运行失败的结构化输出及报告。
通过：静态错误码来自规定集合，四个诊断字段非空且有用；运行失败保持原码，公开值已脱敏。
失败：发明新静态错误码、把超时改成路由错误、字段缺失或输出凭据。
证据：脱敏输出/报告和错误分类测试。

- [ ] **AC-RECORD-001**：已派发结果可追溯。
  - **需求**：FR-RECORD-001。
  - **来源/决策**：R-004、D-003。
  - **可观察场景**：SCN-005。
验证：成功、全部失败及部分成功各走一次生产记录路径并读取返回引用。
通过：每个引用可解析，attempt/report存在；有效语义结果才有result；成员失败、来源和恢复信息保留。
失败：仅 stdout、悬空引用、失败写成空成功或无语义时伪造result。
证据：实际 attempt/result/report 引用、原始返回与落盘后读取结果。

- [ ] **AC-RECORD-002**：拦截保存真实未派发记录。
  - **需求**：FR-RECORD-002。
  - **来源/决策**：R-004、D-002/D-003。
  - **可观察场景**：SCN-003/006。
验证：读取首次预检拦截后的任务记录及阶段消费事实。
通过：有 unavailable attempt 和 report，resultRef=null，provider 成员为空且未派发原因明确；记录早于事实发布。
失败：没有报告、虚构 provider 执行、生成 result、先宣布记录成功后写入。
证据：记录引用、写入/发布顺序观察与派发计数。

- [ ] **AC-RECORD-003**：复用、去重、身份均真实。
  - **需求**：FR-RECORD-003。
  - **来源/决策**：R-004/R-005、D-003/D-007/D-008。
  - **可观察场景**：SCN-006/008。
验证：重复与并发请求、不同任务/阶段/材料/原因、同内容身份不匹配的负向场景。
通过：合法重复返回旧引用且 attempt 数不增，旧字节/hash不变；不同作用域不互用；未获当前认证的引用仅显示历史身份和当前缺口。
失败：克隆attempt、修改旧身份、跨任务误复用、同内容直接冒充当前认证或偷偷自动重审。
证据：前后数量/hash、引用链、认证结果及派发计数。

- [ ] **AC-RECORD-004**：裸跑留诊断且不越权。
  - **需求**：FR-RECORD-004。
  - **来源/决策**：R-004、D-003。
  - **可观察场景**：SCN-007。
验证：无任务上下文执行成功、失败、拦截及重复拦截，并尝试作为正式记录消费。
通过：sink引用可读且标非权威；不会写task记录、不能作为正式审查；相同拦截（同材料指纹+同原因+同归一化调用参数指纹，易变字段不参与）在 sink 内去重、不无限增长。
失败：裸跑无诊断、伪造任务绑定或可被canonical枚举复用。
证据：sink记录、返回标记、任务目录无越权写入和负向消费结果。

- [ ] **AC-RECORD-005**：保存故障与中断不假成功。
  - **需求**：FR-RECORD-005。
  - **来源/决策**：R-004、D-003/D-008。
  - **可观察场景**：SCN-005/006/009。
验证：注入不可写、部分写失败、异字节冲突、可捕获取消和运行后材料漂移。
通过：所有失败显式可见，已有证据保持不可变；同字节重入幂等，部分缺失如实显示；不报告已保存完整记录。
失败：吞错误、覆盖旧内容、引用不存在或将中断改成语义成功。
证据：故障注入结果、存留字节/hash、错误输出和明确不可捕获中断限制。

- [ ] **AC-COMPAT-001**：宽读严写且不重写历史。
  - **需求**：FR-COMPAT-001。
  - **来源/决策**：R-001/R-004、D-004。
  - **可观察场景**：SCN-008/010。
验证：旧priority、旧无dispatch_state、新字段及非法新记录的读写合同检查。
通过：旧记录可读且字节不变；新记录不含priority，扩展状态能解释；未知旧派发分类明确legacy_unclassified，stage形状仍合法。
失败：旧记录被拒读/改写、未知旧状态被猜成blocked、新状态导致消费错判为通过。
证据：固定新旧样本、读写结果、既有消费者返回及前后hash。

- [ ] **AC-COMPAT-002**：只失效旧 policy 的复用资格。
  - **需求**：FR-COMPAT-002。
  - **来源/决策**：R-001/R-004、D-005。
  - **可观察场景**：SCN-008/010。
验证：分别请求旧policy记录与新policy同身份记录，并观察迁移自身。
通过：旧policy不命中、新policy符合条件时可命中；历史可读，迁移本身无派发。
失败：旧policy继续复用、新记录永久失效、迁移自动批量重审或改旧字节。
证据：policy对比、复用结果、调用计数和历史hash。

- [ ] **AC-E2E-001**：E2E 稳定使用首项。
  - **需求**：FR-E2E-001。
  - **来源/决策**：R-001/R-002、D-006/D-008。
  - **可观察场景**：SCN-011。
验证：单项、多项、空列表、首项同源/禁用/缺失及合法复用。
通过：合法首项被选中且多项不失败；非法首项明确拦截并落盘，未选择后项；空列表明确拦截并落盘、不派发；合法复用不新派发。
失败：仍限制length=1、选择后项、空列表静默派发或绕过异源规则、失败无记录。
证据：配置与选择结果、派发观察、拦截及复用引用。

- [ ] **AC-SAFETY-001**：保护边界不退化。
  - **需求**：FR-SAFETY-001。
  - **来源/决策**：R-007、D-008。
  - **可观察场景**：SCN-003/005/008/011。
验证：同源、低于异源下限、坏绑定、空findings、partial、unavailable及doctor入口检查。
通过：安全非法输入被拒，质量事实真实；public行为与doctor七项保持，历史报告不可变。
失败：同源计入异源、放宽身份、空findings直接通过、新doctor预检动作或新公共命令。
证据：保护性负向测试、命令行为清单与质量输出。

- [ ] **AC-SAFETY-002**：usage 原样保留与消费边界透明。
  - **需求**：FR-SAFETY-002。
  - **来源/决策**：R-004/R-005、D-004/D-007。
  - **可观察场景**：SCN-005/008/010。
验证：含usage、null、失败成员usage、新旧记录经过真实写入和既有消费路径。
通过：原始usage、引用及身份不丢失，缺失不补零；上游读取缺陷如实暴露，预算规则未重写。
失败：丢字段、复制假值掩盖consumer问题、改变计数规则或声称全局只审一次已生效。
证据：provider返回与canonical记录逐字段对比、消费者实际诊断和相关差异。

- [ ] **AC-DELIVERY-001**：新机制真实验证。
  - **需求**：FR-DELIVERY-001。
  - **来源/决策**：R-006/R-007、T-007/T-008、D-008。
  - **可观察场景**：SCN-012。
验证：实施后在认证任务执行真实流程，逐项比对上述AC所需事实。
通过：真实配置、耗时、调用次数和可读记录支撑成功项；失败、未执行和unknown逐项列出，不把局部验证冒充全部通过。
失败：只用示例或摘要、实现前声称新机制已生效、漏报未执行场景。
证据：实际调用输出、记录引用、针对性测试和逐AC观察清单。

- [ ] **AC-CONTRACT-001**：精确决策标识。
  - **需求**：FR-CONTRACT-001。
  - **来源/决策**：R-008/R-009、D-011。
  - **可观察场景**：SCN-013。
验证：D-002合法引用、D6与D-006不同定义和未知/冲突/跨任务引用。
通过：所有消费者得到同一精确ID及定义；合法引用不因连字符失效。
失败：重编号/别名混同、未知引用通过，或不同消费者给出矛盾结果。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-CONTRACT-002**：真实高风险依据。
  - **需求**：FR-CONTRACT-002。
  - **来源/决策**：R-008/R-009、D-011。
  - **可观察场景**：SCN-013。
验证：合法D-003字段+spec引用，缺字段/裸JSON/错basis/多字段/跨任务/不相符tier。
通过：non_ui高风险服务验收能绑定真实D-003；无效风险事实和不匹配验收层级明确拒绝。
失败：只放宽ID而丢失风险依据校验，或把non_ui降为无须高风险验收。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-CONTRACT-003**：角色与理由一致。
  - **需求**：FR-CONTRACT-003。
  - **来源/决策**：R-008/R-009、D-011。
  - **可观察场景**：SCN-013。
验证：同一reasoned N/A迁移/最终卡、裸N/A、空理由、伪装新增实现及标准RED/GREEN对。
通过：有理由N/A在全部消费者一致；RED/GREEN配对不退化。
失败：一个校验器要求的写法被另一个拒绝，或无理由/伪装N/A被接受。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-CONTRACT-004**：现行oracle唯一格式。
  - **需求**：FR-CONTRACT-004。
  - **来源/决策**：R-008/R-009、D-011。
  - **可观察场景**：SCN-013。
验证：从当前模板填出RED/GREEN/N/A完整卡；缺/坏JSON、缺RED反例及身份不符。
通过：分发模板实例经全部消费者具有同一oracle_id/pass/reject并保留证据要求。
失败：模板只产文本却消费者要求JSON；坏JSON/缺反例静默通过。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-CONTRACT-005**：事项来源与交接。
  - **需求**：FR-CONTRACT-005。
  - **来源/决策**：R-008/R-009、D-012。
  - **可观察场景**：SCN-014。
验证：spec引入工程OPEN向plan/tasks传递、外部close-readiness引用、本地缺owner/handoff与方向改变伪装。
通过：工程事项无需伪造更早同号历史；外部引用不产生本地关闭义务；真实交接缺口仍报告。
失败：仅因文字出现就扩本地义务，或以外部引用/引入阶段掩盖本期承诺。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-CONTRACT-006**：语义证据与词法分离。
  - **需求**：FR-CONTRACT-006。
  - **来源/决策**：R-008/R-009、D-012。
  - **可观察场景**：SCN-015。
验证：同义句、主行为满足而附属行为禁止、复制原句但实际否定、真实矛盾finding、缺/旧/错任务证据。
通过：词法不误判正向例或放过矛盾例；有依据的分析/审查结论如实保留，缺依据不宣称一致。
失败：以字串命中或调用方布尔值制造通过，或移除绑定检查/真实finding。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-CONTRACT-007**：真实完整消费链。
  - **需求**：FR-CONTRACT-007。
  - **来源/决策**：R-008/R-009、D-014。
  - **可观察场景**：SCN-018。
验证：普通non_ui、高风险non_ui、适用UI测试实例、RED/GREEN/N/A、本地/外部事项与无效变体。
通过：同一合法实例在所有消费者合同上一致；缺风险/错身份/缺确认等变体仍暴露真实缺项；分发字节一致。
失败：只用各自微fixture或漏掉正式消费者，或测试绿被当成用户批准。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-LIFECYCLE-001**：无计时的真实事件。
  - **需求**：FR-LIFECYCLE-001。
  - **来源/决策**：R-008/R-009、D-013。
  - **可观察场景**：SCN-016。
验证：真实事件无时间、有时间、混合、单边/反向/畸形时间、缺事件、重复及跨任务/阶段。
通过：有证据的正常/失败/取消终态可记录；时间缺失不伪成0或未执行，坏身份/时间仍拒绝。
失败：补造计时/隐式排序；将缺事件从产物推断为全部执行；输入非法仍发布成功。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-LIFECYCLE-002**：业务输出引用贯通。
  - **需求**：FR-LIFECYCLE-002。
  - **来源/决策**：R-008/R-009、D-013。
  - **可观察场景**：SCN-017。
验证：真实生产输出引用未列evidence但被后一步input引用；坏类型/越界/跨任务引用与旧缺省记录。
通过：引用两层不丢失，消费者读到真实产物并能连边；旧记录不伪造零消费。
失败：只修一层、以输出引用冒充执行证明、静默丢失或接受任意外部地址。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-LIFECYCLE-003**：调用方可执行记录说明。
  - **需求**：FR-LIFECYCLE-003。
  - **来源/决策**：R-008/R-009、D-013。
  - **可观察场景**：SCN-016。
验证：按分发后的说明生成完整有效事件，并覆盖缺事实和跨host显式payload。
通过：说明、协议和真实消费者一致，正常与异常事实能明确填写；缺成本与缺执行证据可区分。
失败：示例只有空events、要求虚构时间，或宣称已自动采集所有宿主。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

- [ ] **AC-LIFECYCLE-004**：后续复盘事实可读。
  - **需求**：FR-LIFECYCLE-004。
  - **来源/决策**：R-008/R-009、D-013。
  - **可观察场景**：SCN-019。
验证：阶段成功/失败与后续复盘完成/失败，用现有正式读取路径核对两个时点。
通过：旧outcome hash不变、随后正式复盘可读、阶段与复盘状态分别真实呈现。
失败：为补齐状态重写旧报告、重复调度、复盘失败反向造成功或阻断同task修复。
证据：同一真实材料/事件的实际消费结果、限定回归输出、原始错误和身份/引用对照；不以手工拼装通过摘要替代。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法与当前材料 | CONSTITUTION.md、constitution-checklist.md、decision-log.md、spec.md | no change at implementation | T013–T019/T001–T012 | 当前增量已纳入；实施只消费，不改已定方向 |
| 职责登记 | docs/architecture/move-map.json | change | T002 | 新测试和已批准sink/started对象登记owner/consumer/替代/删除，不造第二索引 |
| 技能与协议说明 | skills/wh-review/SKILL.md、skills/wh-review/contracts/provider-protocol.md | change | T011 | 单源、现有host request闭环、sink保留与真实错误 |
| public facade | tools/cli/stage-runtime.mjs | change | T006 | 仅已有review record action输入互斥分支，七类行为不变 |
| 材料合同接线 / 预算与质量 | runtime/stage/stage-handlers.mjs、runtime/evidence/stage-content-evidence.mjs | handler narrow change / evidence no change | T014/T006/T010 | handler仅P0材料消费；D-007预算/usage消费与身份规则排除 |
| 核心身份与持久writer | runtime/task/git-worktree-snapshot.mjs、runtime/task/task-handle.mjs、runtime/evidence/canonical-receipt-writer.mjs | no change | T006/T008 | 复用原身份/锁/create-only，不扩大核心 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"bf61be16d4d67c582258e7731a335cdca20749764d5a18607f4cd8e98c26ebcb","id":"CONSTITUTION","version":"1.7.0","clause_count":22}`

- **F1**：host只接线，记录放现有record-route，核心不加业务。

- **F2**：request/result互斥与内存recordContext窄接口；provider不收task身份。

- **F3**：四材料可读不等于正式完成；当前契约缺口真实披露。

- **F4**：独立wh-review保留来源和findings，不以空结果判通过。

- **F5**：不增加公共gate或重审计数；只修已知误阻塞。

- **F6**：task执行事实外置，报告create-only，正式调用认证实际runtime。

- **F7**：build-plan交接后取得真实回复；commit等另行授权。

- **F8**：复用loader、writer、lock、review action，删除双源。

- **F9**：RED必须目标断言；unknown/partial/保存失败不假绿。

- **F10**：DEC-003逐项记录真实威胁/既有覆盖/绕过/成本，不建自动验收平台。

- **F11**：sink/started对象登记owner/consumer/oracle/失败/退出条件。

- **Q1**：测试在build-code执行，缺失证据不作已完成。

- **Q2**：继续规划、正式发布结构、完成声明分开。

- **Q3**：provider独立异源审查；本地validator仅结构事实。

- **S1**：复用现有skills、Node和Vitest，无新框架。

- **S2**：按本项目窄边界更新wh-review说明，不修改外部引擎。

- **S3**：依据当前已提交skill/契约，不混入主仓未提交更新；无外部技能引入。

- **S4**：原始usage保留；真实事件计时可缺，cost维持unavailable，不伪造时间，无新指标台账。

- **S5**：冻结packet提供独立研究/审查；不把重读全量重复灌入主会话。

- **S6**：本期为已有链路修复，复用现成标准fs/原子writer，不自研通用流程。

- **S7**：仍是build-plan一个阶段，四Phase只是实现分期。

- **S8**：输入显式、裸跑无隐式task认证，技能仍可跨host。

## Phase P0 — 材料合同与执行事实前置修复

### Goal

同一合法材料经全部消费者一致；有证据的无计时host事件和业务引用可记录，真实缺项/错身份仍失败。来源R-008/R-009、D-010～D-014；不改原业务边界。

### Files

- **NEW**：N/A — 仅修改现有文件，不新增生产模块或控制面
- **MODIFY**：`docs/cli-tool-mapping.md`、`docs/operations/claude-e2e-sample.md`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/review-bundle.json`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/skill-bundle.json`、`skills/spec-tasks/templates/tasks-template.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`、`tests/contract/build-reflection-page.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/integration/runner-clean-install.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/build-plan/SKILL.md`

- **READ/VERIFY ONLY**：`tests/integration/distribution-closure.test.mjs`；现有分发闭包检查只读运行，不新增/修改断言，不分配RED实现；T019运行并报告，若发现必须修改则回材料owner补实际任务。

### Tasks

- `T013`：RED 统一材料ID、风险、角色与Oracle；Files：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- `T014`：GREEN 统一材料ID、风险、角色与Oracle；Files：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`tests/integration/runner-clean-install.test.mjs`
- `T015`：RED 事项来源与语义证据；Files：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- `T016`：GREEN 事项来源与语义证据；Files：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-analyze/review-bundle.json`、`skills/wh-review/skill-bundle.json`
- `T017`：RED 真实host事件与输出引用；Files：`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- `T018`：GREEN 真实host事件与输出引用；Files：`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`workflows/build-plan/SKILL.md`、`runtime/stage/stage-runner.mjs`、`docs/operations/claude-e2e-sample.md`、`docs/cli-tool-mapping.md`、`tests/integration/runner-clean-install.test.mjs`
- `T019`：N/A — non-behavior P0集成与分发验证；不新增行为、不强造RED；Files：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`

### Verify

MATERIAL_CONTRACT_UNIFIED；本Phase还必须完成MATERIAL_SOURCE_SEMANTICS、HOST_EVENT_REFERENCES与MATERIAL_HOST_INTEGRATION。

`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；MATERIAL_CONTRACT_UNIFIED；`quality/evidence/build-code/material_contract_unified/`。
`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；MATERIAL_SOURCE_SEMANTICS；`quality/evidence/build-code/material_source_semantics/`。
`npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；HOST_EVENT_REFERENCES；`quality/evidence/build-code/host_event_references/`。
`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；expected_exit=0；MATERIAL_HOST_INTEGRATION；`quality/evidence/build-code/material_host_integration/`。T019仅是P0验证，T012仍为唯一全任务acceptance。

### Knowledge

三组共享stage-content-contracts、workflow说明、producer-consumer及runner-clean-install测试；T013/T014新增安装后材料consumer回放，T017/T018新增安装后host事件consumer回放，T019仅运行已实现回放；各组，按T013→T014→T015→T016→T017→T018→T019串行；T001依赖T019。不先为每个consumer改写fixture；同一原始字节与明确无效变体进入真实handler/记录writer/消费边和隔离安装。无计时不是无执行，缺事件仍unavailable，成本不补0。

### STOP

本轮停在build-code前，全部卡pending；未来RED若仅环境/setup失败不算目标RED。需要扩大预算/身份等价、修改原报告、新增dispatcher/持久控制面或真实跨宿主hook时停止对应越界修改并回owner，继续不依赖部分。自动hook按DEFER-005延期。

### Done

未来三组真实行为RED/GREEN及T019受影响集成命令有原始退出码、来源/错身份/缺事实负例、实际引用和分发字节证据；正常与异常均保持真实性。当前测试未执行，结构一致不替代独立review或最终用户确认。

### Risks and rollback

RISK-005/006：统一解析时不得混同标识、删除真实finding或相信自报semantic_match；事件引用不能充当执行证明。仅回滚本次代码/模板改动，保留原事件/outcome/失败和历史审查；D-007预算/usage消费与严格身份边界不变，DEFER-005不伪完成。

## Phase P1 — 配置单源与兼容生产契约

### Goal

provider 只由 3rd-review 定义；路由顺序保留；新旧记录读合同兼容；迁移变换可恢复且不派发。

### Files

- **NEW**：`tests/review/review-policy-compatibility.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/helpers/formal-review.mjs`

### Tasks

- `T001`：RED 单源配置与历史兼容；Files：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`
- `T002`：GREEN 单源配置与历史兼容；Files：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`tests/helpers/formal-review.mjs`

### Verify

REVIEW_CONFIG_COMPAT；本 Phase 必须完成下列配置与兼容验证。

`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_CONFIG_COMPAT；`quality/evidence/build-code/review_config_compat/`。

### Knowledge

T001依赖P0的T019完成。P2消费无priority新policy；旧policy hash不重算、不重写，legacy tiers仍按原规则选择。

### STOP

命令不可执行、RED仅setup失败、需要改decision/spec/身份/预算或精确文件越界时，停止对应修改并回所属owner；继续不依赖该修改的工作。

### Done

所属卡有实际命令/退出码、逐AC证据、真实审查事实及剩余限制；本阶段仅pending设计，不声明已做到。

### Risks and rollback

RISK-002/FR-CONFIG-003：迁移若观察到配置漂移，拒绝覆盖；仅恢复本次代码或经 hash 核对的备份，不改历史。

## Phase P2 — 静态预检与单一记录闭环

### Goal

任务调用和裸跑各由一个 owner 保存；静态拦截、成功、失败、复用、E2E 首项和保存故障均返回真实引用或明确缺口。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/review/review-record-route.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`

### Tasks

- `T003`：RED 锁前静态预检；Files：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- `T004`：GREEN 锁前静态预检；Files：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- `T005`：RED 任务调用与不可变记录闭环；Files：`tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`
- `T006`：GREEN 任务调用与不可变记录闭环；Files：`tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/cli/stage-runtime.mjs`
- `T007`：RED 裸跑诊断与保存故障；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`
- `T008`：GREEN 裸跑诊断与保存故障；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- `T009`：RED E2E 首项与相邻保护；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`
- `T010`：GREEN E2E 首项与相邻保护；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-runner.mjs`

### Verify

REVIEW_STATIC_PREFLIGHT；本 Phase 还必须完成 REVIEW_TASK_RECORD、REVIEW_BARE_SINK、REVIEW_E2E_FIRST，不能只验证第一组。

`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_STATIC_PREFLIGHT；`quality/evidence/build-code/review_static_preflight/`。
`npx vitest run tests/review/review-record-route.test.mjs tests/e2e/stage-reflection-real-task.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/contract/runtime-facade.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_TASK_RECORD；`quality/evidence/build-code/review_task_record/`。
`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review/review-record-route.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_BARE_SINK；`quality/evidence/build-code/review_bare_sink/`。
`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_E2E_FIRST；`quality/evidence/build-code/review_e2e_first/`。

### Knowledge

P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。

### STOP

命令不可执行、RED仅setup失败、需要改decision/spec/身份/预算或精确文件越界时，停止对应修改并回所属owner；继续不依赖该修改的工作。

### Done

所属卡有实际命令/退出码、逐AC证据、真实审查事实及剩余限制；本阶段仅pending设计，不声明已做到。

### Risks and rollback

RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。

## Phase P3 — 操作说明、配置迁移与真实验收

### Goal

操作文档与真实行为一致；本机迁移有可读备份与冲突检查；当前实现用真实调用和逐 AC 事实交接。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`

### Tasks

- `T011`：操作说明与本机迁移；Files：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`
- `T012`：唯一最终聚合和28项AC真实验收；Files：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`

### Verify

REVIEW_MIGRATION_OPERATION；本 Phase 还必须完成 REVIEW_FINAL_ACCEPTANCE；实际操作与最终验收证据分别保留。

`node --input-type=module -e 'import {readFileSync} from "node:fs"; import assert from "node:assert/strict"; import {createHash} from "node:crypto"; import {isDeepStrictEqual} from "node:util"; const e=JSON.parse(readFileSync("/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/migration/operation.json","utf8")); assert.equal(e.config_path,"/Users/Hugh/.config/workflowhub/config.json"); const b=readFileSync(e.backup_path),a=readFileSync(e.config_path),r=readFileSync(e.rollback_probe_path); const h=x=>createHash("sha256").update(x).digest("hex"); assert.equal(h(b),e.before_sha256); assert.equal(h(a),e.after_sha256); assert.equal(h(r),h(b)); const expected=JSON.parse(b),actual=JSON.parse(a); delete expected.wh_review.profiles; delete expected.wh_review.priority; assert.ok(isDeepStrictEqual(actual,expected),"migration changed unrelated settings"); assert.equal(e.restore_success.return_value.restored,true); assert.equal(e.restore_success.after_sha256,h(b)); assert.equal(h(readFileSync(e.restore_success.target)),h(b)); assert.equal(e.restore_conflict.error_code,"CONFIG_RESTORE_CONFLICT"); assert.equal(e.restore_conflict.after_sha256,e.restore_conflict.drift_sha256); assert.equal(h(readFileSync(e.restore_conflict.target)),e.restore_conflict.drift_sha256); console.log(JSON.stringify({backup_sha256:h(b),after_sha256:h(a),rollback_sha256:h(r),unchanged_unrelated:true}));'` / 0 / REVIEW_MIGRATION_OPERATION；`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/contract/runtime-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 / REVIEW_FINAL_ACCEPTANCE；`quality/evidence/build-code/final/`。逐AC真实调用/配置事实不能由聚合退出码代替。

### Knowledge

外部 provider 失败、未执行场景和 parser 绑定缺口不写成通过；build-plan 不执行本 Phase。

### STOP

命令不可执行、RED仅setup失败、需要改decision/spec/身份/预算或精确文件越界时，停止对应修改并回所属owner；继续不依赖该修改的工作。

### Done

所属卡有实际命令/退出码、逐AC证据、真实审查事实及剩余限制；本阶段仅pending设计，不声明已做到。

### Risks and rollback

RISK-002/003/004：本机配置冲突即不覆盖，实测慢于 1000ms 原样记失败；物理交付另行授权。
