# WorkflowHub 可信度恢复规格

> 本规格只描述恢复后的产品行为与完成边界；不授权代码实施，不把历史 evidence、PaperBuilder WIP 或局部测试结果当作当前完成事实。

## 速读卡（30 秒）

- **目标**：让 WorkflowHub 只在当前、干净、可定位的内容上产生可信正式事实。
- **核心用户结果**：维护者能区分“可以继续修复”“这次正式写入真实”“阶段可以宣称完成”三件事。
- **当前范围**：技能闭包、正式 writer、窄 bridge、review 分层、旧 evidence 只读和失败语义。
- **不承诺**：本规格不实现 PaperBuilder；WorkflowHub 恢复后才进入 PaperBuilder 核心列表→工作台验收。

## 追踪与来源

### 来源与决策映射

- R-001 → D-001 → FR-WH-001 → AC-WH-001。
- R-002 → D-002 → 流程级约束（无独立 FR）→ AC-WH-010 的 PaperBuilder 冻结交接条款。
- R-003 → D-003 → FR-WH-002 → AC-WH-002。
- R-004/R-008 → D-004/D-008 → FR-WH-004/FR-WH-008 → AC-WH-004/AC-WH-008。
- R-005 → D-005 → FR-WH-003 → AC-WH-003。
- R-006 → D-006 → FR-WH-005/FR-WH-006 → AC-WH-005/AC-WH-006。
- R-007/R-009 → D-007/D-009 → FR-WH-007/FR-WH-009 → AC-WH-007/AC-WH-009。
- R-010 → D-010 → FR-WH-010 → AC-WH-010。

### 原始需求索引（内部定位，不新增需求）

- R-001：标准阶段顺序与真实 Talk/Grill/wh-review。
- R-002：WorkflowHub 优先，PaperBuilder WIP 冻结。
- R-003：clean committed locatable snapshot 才能产生正式事实。
- R-004：dsh 仅诊断，broker-provenance wh-review 才是正式 code review。
- R-005：复用 bundle/catalog 生成与校验流程。
- R-006：stage-runtime 唯一正式 writer，bridge 只传窄 outcome。
- R-007：completed/not_applicable/unavailable/unknown/incomplete 和旧 evidence 语义。
- R-008：serious finding 修复或明确承担风险，禁止新控制面。
- R-009：逐条宪法、兼容、RED/GREEN、边界、回滚、oracle、独立 review。
- R-010：恢复后先 PaperBuilder 核心列表→工作台状态矩阵，再拆全站。

## 1. 问题与紧迫性

当前 WorkflowHub 的可信度风险不是单个失败命令，而是几条边界可能被混用：bundle 生成与 closure 校验可能漂移；TaskKernel/canonical writer 与 direct quality writer 可能并存；bridge 可能把过宽结果带入正式运行时；dsh 本地诊断可能被误当异源审查；旧 evidence 可能被 current completion reader 误消费。若不先收紧这些边界，PaperBuilder 后续页面验收无法回答“这份事实对应哪份内容、谁产生、是否当前”。

## 2. 背景、目标与范围

### 背景

用户已经确认四个方向：WorkflowHub 先恢复、正式事实只绑定干净快照、正式代码审查只认 broker-provenance `wh-review`、WorkflowHub 恢复后再做 PaperBuilder 核心列表→工作台状态矩阵。当前基线已观察到 skill closure 的 7 个 hash mismatch；选定 runtime 合同测试有一个同会话 task-path 绑定失败。它们是当前事实，不是本规格可以自行修正的产品选择。

### 本任务路径与副作用边界

- 设计读取范围：可信 clone 的当前 clean snapshot、正式 task worktree，以及用户明确列出的 PaperBuilder 历史四份材料和 `specs/archive/ui-frontend-delivery-contract/` 只读输入；具体宿主路径由 TaskHandle/Workspace 身份绑定，不进入 provider packet。
- 正式材料写入范围：当前 task 的 `specs/workflowhub-trust-recovery/decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 和 WorkflowHub runtime 已声明的质量记录；本次 authoring turn 不写生产实现文件。
- 明确禁止读取、修改或引用为正式事实：旧损坏 WorkflowHub 目录及其 WIP/Git 对象；不迁移、不追认、不提交其中任何改动。
- 本任务不实施、不提交、不推送、不合并、不关闭、不清理；计划中的 MODIFY 文件只表示未来用户确认后 build-code 的候选边界，不是当前授权。

### 目标

- 恢复技能发布/本地消费的同一闭包语义。
- 让正式 quality facts 只能通过现有 `stage-runtime`/TaskKernel 写入链产生。
- 让 bridge 只传当前 session 的窄 stage outcome，错误顺序、错误时间、错误身份 fail-loud 或保留 incomplete。
- 让 `dsh-code-review`、`wh-review`、旧 review/evidence 的消费者边界可验证。
- 让每条 AC 都有可执行场景、oracle、失败条件、证据位置和覆盖限制。

### 范围内

- bundle/catalog 生成、哈希、静态依赖和发布闭包一致性。
- canonical quality writer 的唯一性和 direct writer 的历史/fixture 边界。
- stage outcome bridge 的 session、step/skill 状态、顺序、时间和 snapshot 绑定。
- wh-review 的 provider、broker provenance、material/snapshot/review-track 绑定。
- dsh 诊断与正式 code review 的分层；旧 evidence 只读展示。
- unavailable、unknown、incomplete、not_applicable、serious finding disposition 的可见语义。

## 3. 用户场景与状态覆盖

### SCN-001：维护者检查技能闭包

- **Given**：当前仓库有 catalog、skill bundle 和发布生成流程。
- **When**：维护者运行现有闭包生成/校验入口。
- **Then**：同一 dependency closure、文件清单和哈希能被发布物与本地 resolver 共同复核。
- **边界**：缺文件、静态 import 漂移、catalog/hash 不一致必须是失败或 incomplete，不能返回空成功。

### SCN-002：正式阶段写入当前快照

- **Given**：阶段材料和已提交快照可定位，或工作树 dirty/路径漂移。
- **When**：stage-runtime 尝试发布 stage outcome。
- **Then**：只有当前 task、stage、worktree、HEAD/tree、材料 revision 和 writer 身份一致时写 canonical quality fact。
- **边界**：dirty、错绑、材料变化、旧快照只能诊断/保留失败，不能写成当前成功。

### SCN-003：bridge 传递 session outcome

- **Given**：host 产生 step/skill lifecycle outcome。
- **When**：bridge 传给 stage-runtime。
- **Then**：只携带当前会话、声明的 step/skill、状态、窄 evidence 和 spec-analyze 输入；正式事实仍由 stage-runtime 生成。
- **边界**：乱序、重复、重叠、回拨时间、必做项缺包、错误 stage 或多余字段不能变成 completed。

#### Bridge 窄输入与确定结果

窄 outcome 只允许 `schema_version`、`task_id`、`stage`、`attempt_id`、`outcome_ref`、`outcome_sha256`、`outcome_status` 和 `producer`；不得携带 `execution`、`receipts`、`quality_status`、`quality_fact_refs`、completion verdict 或第二份 stage 状态。对当前 task 的合法 outcome，bridge 只传递并由 `stage-runtime` 再认证；bridge 本身不写 current quality。

| 场景 | 确定结果 | current quality 写入 |
|---|---|---|
| 声明顺序、依赖、时间和身份均合法 | 传递窄 outcome | 仅 stage-runtime 可写 |
| step/skill 乱序或依赖未满足 | `failed`，带具体顺序原因 | 不写 |
| 同一 subject 重复 | `failed`，拒绝重复事件 | 不写 |
| 生命周期时间重叠或时钟回拨 | `failed`，reason=`BRIDGE_TIME_INVALID` | 不写 |
| 必做 subject 缺包、outcome 缺失 | `unavailable` | 不写 |
| task/stage/snapshot/material 错绑 | `failed`，reason=`BRIDGE_IDENTITY_MISMATCH` | 不写 |

以上结果必须由同一 RED/GREEN oracle 可打破：非法输入不能只返回“completed=false”而继续调用 writer；任何非法分支都不得产生 current quality delta。

### 重试、重放与部分写入合同

- 每个窄 outcome 使用稳定 `idempotency_key`：对 canonical 的 `schema_version`、`task_id`、`stage`、`attempt_id`、`outcome_ref`、`outcome_sha256`、`producer` 计算 SHA-256；同一 key 绑定同一字节内容。
- 同一 key、同一字节重放必须返回同一 outcome/fact 引用且 current quality delta 为 0，不产生第二份 canonical fact；同一 key 但字节冲突必须 `failed`，reason=`BRIDGE_REPLAY_CONFLICT`，不写入。
- canonical writer 发生部分写入或中断时，只允许用同一 key 恢复并得到原子已有 fact 或明确 `incomplete/unknown`；禁止盲目生成新 fact、覆盖 immutable record 或用新 attempt 隐藏不确定性。
- retry、duplicate 与 replay 必须在同一 `ORACLE-WH-BRIDGE`/`ORACLE-WH-WRITER` 下分别断言：传输重试不等于新事实，冲突重放 fail-loud，恢复失败保留真实未完成状态。

### SCN-004：正式 code review 分层

- **Given**：本地有 dsh 诊断，或 broker 有 `wh-review` attempt/result。
- **When**：verify-code 计算 `code_review`。
- **Then**：只有当前 snapshot/material/review-track 绑定并带 broker provenance 的 wh-review 可进入正式 code-review fact；dsh 仅展示为 diagnostic。
- **边界**：provider unavailable、transport failure、缺 source/model/config binding、旧 result、空 findings 都保留原状态。

### SCN-005：旧 evidence 被读取

- **Given**：task store 中存在旧 receipt/review/evidence 或历史 projection。
- **When**：status/close/release 或 review reader读取它。
- **Then**：可以展示为历史事实，但 current completion 只消费当前 quality namespace、hash、snapshot 和材料 revision。
- **边界**：旧记录不自动 rebind、不写回 current namespace、不替代当前 review/AC/human confirmation。

### SCN-006：严重 finding 处置

- **Given**：当前 wh-review 有 actionable major/blocking finding。
- **When**：阶段准备交接或声明完成。
- **Then**：必须关联修复事实或绑定该 finding 的具体 risk acceptance；原始 finding/verdict 不被改写。
- **边界**：一般 finding/unavailable/unknown/incomplete 可继续修复，但不能变成 pass。

### SCN-007：条件项与缺失项

- **Given**：某 skill/step 必做、条件不适用、未执行、外部不可用或当前证据不完整。
- **When**：stage outcome 汇总状态。
- **Then**：必做项只能 completed；明确条件项才可 not_applicable，并保留 trigger/executed/reason；其他项保持真实状态。
- **边界**：not_applicable 不能替代 wh-review，空 evidence 不能完成必做项。

### SCN-008：同任务继续修复

- **Given**：quality fact 缺失或 review 有 finding。
- **When**：维护者仍在同一 task 修复。
- **Then**：推进资格与完成判据分离；允许继续修复，不创建 successor task 伪造 lineage。
- **边界**：正式 publication 结构错误仍 fail-loud；完成/交接仍展示未处置风险。

### SCN-009：恢复后的 PaperBuilder 交接

- **Given**：WorkflowHub 恢复计划已确认并实现/验证完成。
- **When**：开启后续 PaperBuilder 任务。
- **Then**：首个产品验收聚焦真实策略列表→工作台的身份、任务终态、报告 lineage 和状态矩阵，再拆全站批次。
- **边界**：本任务不把 PaperBuilder WIP、T04 假数据或旧浏览器事实带入恢复完成。

### SCN-010：计划确认前停止

- **Given**：build-plan 已写完并完成独立 review/spec-analyze，但用户尚未确认计划。
- **When**：流程准备进入实现。
- **Then**：展示大白话的目标、阶段、风险、回滚、review/unknown 事实，等待用户确认。
- **边界**：计划确认不等于 commit/push/merge/cleanup 授权。

### 正式阶段输入/输出/停止合同

- **make-decision**：输入是 host-visible 原始需求、当前可信 clone 事实和只读历史参考；Talk 每轮只处理一个决策轴，真实 reply 后才重排；Grill 在 Talk round 3 后只做思考审查；独立 `wh-review` 分 direction/detail 两个 advice track；输出是 `decision-log.md`。没有真实 reply、Grill 生命周期、当前 review 终态或用户确认时，保留 `incomplete`/`unavailable`，不得写 accepted。
- **build-spec**：输入是已确认方向和当前 `decision-log.md`；输出是 `spec.md`、逐 FR/AC 的场景/状态/失败边界；`spec-clarify` 只处理规格歧义，不能补方向需求；review unavailable/incomplete 进入事实和交接，不变成 pass。
- **build-plan**：输入是当前 decision/spec；输出是 `plan.md`、`tasks.md` 和每个行为的 RED/GREEN、命令、预期退出码、oracle、evidence path、覆盖限制、rollback、STOP；独立 `wh-review` 和 final `spec-analyze` 必须绑定当前材料。未有用户计划确认前停止在 handoff，不进入 build-code。
- **交接 owner**：每阶段由当前 Stage Agent 读当前四份材料，`stage-runtime` 是唯一正式 facts writer；bridge 只交付窄 session outcome；任何下游不能自行补方向、替代 review 或把旧 evidence 重新绑定。

### 状态覆盖清单

- **completed**：声明的必做 step/skill 已真实执行，有当前 evidence，能由 stage-runtime 认证。
- **not_applicable**：明确条件项不适用，必须有条件、`trigger=false`、`executed=false` 和理由；不能用于 review。
- **unavailable**：外部 provider/host/transport 没有可用终态；保留错误和影响。
- **unknown**：事实缺失、冲突或无法核验；保留 owner、触发和交接。
- **incomplete**：流程或 evidence 未完成；不能升级为 completed。
- **failed**：当前 oracle 明确失败；保留原始失败，不改写成 unavailable。

### Current completion truth table

聚合优先级固定为：先检查 current snapshot/material/provenance，再检查 required step/skill，之后检查 review/finding disposition 和阶段专属 predicate，最后才计算交接/发布提示。任一前置条件失败都不能被后续状态覆盖。

| 条件 | 当前结果 | 是否可满足 current completion |
|---|---|---|
| required step/skill `completed` 且 evidence 绑定当前 snapshot/material | `completed` | 仅作为必要条件，仍需其他 predicate |
| 明确声明的 conditional item，`trigger=false`、`executed=false`、有 reason | `not_applicable` | 只对该条件项不计入，不得替代 `wh-review` |
| provider/transport 无可信终态 | `unavailable` | 否；保留原错误和交接 |
| 事实冲突或无法核验 | `unknown` | 否；保留 owner、触发和交接 |
| lifecycle/evidence 未完成 | `incomplete` | 否；允许同 task 修复 |
| current oracle 明确失败 | `failed` | 否；保留失败 |
| current `wh-review` 有 actionable major/blocking 且未 fixed/accepted_risk | `needs_human`/`missing` | 否 |
| `fixed`/`accepted_risk` 与当前 finding、review、snapshot/material 不匹配 | `needs_human`/`missing` | 否 |
| `accepted_risk` 没有真实用户确认、owner、风险范围和确认时间 | `needs_human`/`missing` | 否 |
| current `wh-review` unavailable 或 empty findings | 原状态 | 否；empty findings 不是 pass |
| 只有 legacy receipt/review/evidence | `historical`/`stale` | 否；不得 rebind |

阶段可完成的最小聚合谓词是：所有 required step/skill 为 `completed`，所有阶段 gating predicate 通过，当前 snapshot/material/provenance 一致，严重 finding 均有当前 fixed 或精确 accepted risk；需要 human confirmation 的阶段还必须消费当前 confirmation。否则 `status/close/release` 保持 `in_progress`、`incomplete` 或 `not_released`，不降级成空成功。

## 4. 产品事实与假设（PFACT）

- **PFACT-WH001**：用户已确认 WorkflowHub 优先、PaperBuilder WIP 冻结（verified）。
- **PFACT-WH002**：当前可信 clone 的 `git fsck --full` 已通过且工作树干净（verified）。
- **PFACT-WH003**：当前 `check:skill-closure` 有 7 个 bundle hash mismatch（verified）：build-code/wh-review/scripts/review-materials.mjs、build-plan/wh-review/scripts/review-materials.mjs、build-spec/wh-review/scripts/review-materials.mjs、make-decision/wh-review/scripts/review-materials.mjs、verify-code/wh-review/scripts/review-materials.mjs、wh-review/scripts/review-materials.mjs、mini-task/scripts/mini-task-runner.mjs。
- **PFACT-WH004**：stage-runtime 是当前正式 stage outcome 入口（verified）。
- **PFACT-WH005**：当前代码仍有 direct quality-store writer 的反向引用风险（inferred）。
- **PFACT-WH006**：当前 bridge 已有窄 outcome 和 unavailable 路径（verified）。
- **PFACT-WH007**：bridge 对乱序/重叠/依赖时间的完整当前证明尚未获得（unknown）。
- **PFACT-WH008**：wh-review provider 当前可用性和异源 profile 绑定尚未在本任务前验证（unknown）。
- **PFACT-WH009**：旧 evidence 可被历史读取者展示，但不能据此推导 current completion（verified）。
- **PFACT-WH010**：PaperBuilder 后续核心列表→工作台状态矩阵属于恢复后的新任务（verified）。
- **PFACT-WH011**：选定 runtime 合同测试中，同会话自动消费因显式 taskPath 与 launcher-derived taskPath 不一致而失败（verified；测试证据保存在当前任务质量记录）。
- **PFACT-WH012**：本任务 make-decision 的 direction/detail、build-spec 和 build-plan `wh-review` 已完成真实 broker call 并有 semantic available report；build-plan broker group 为 partial，`opencode/v4flash` 保持 unavailable；verify-code 的独立 track 仍未验证（verified + unavailable）。

## 5. 功能需求

- **FR-WH-001**：WorkflowHub 必须保持标准阶段顺序，并把真实 Talk、Grill、独立 wh-review、decision-log、spec、plan、tasks 的 owner 和交接写清；不能由 build-spec 补方向需求。关联 AC-WH-001。
- **FR-WH-002**：正式阶段事实必须绑定当前 task、clean committed locatable snapshot、当前材料 revision 和正式 writer；dirty worktree 只能产生诊断。关联 AC-WH-002。
- **FR-WH-003**：bundle/catalog 生成、发布、resolver 和 closure validation 必须对同一闭包的文件、依赖和哈希给出一致结果。关联 AC-WH-003。
- **FR-WH-004**：`dsh-code-review` 必须保持诊断属性；正式 `verify-code.code_review` 必须消费当前 broker-provenance `wh-review` 结果。关联 AC-WH-004。
- **FR-WH-005**：stage-runtime/TaskKernel 必须是 canonical quality facts 的唯一正式 writer；任何 bridge、review CLI、mini-task 或 direct quality-store 的 current namespace 写入都必须明确拒绝且不产生 current quality delta；历史读取和隔离 fixture 不得写入 current namespace。关联 AC-WH-005。
- **FR-WH-006**：bridge 必须验证声明 subjects、生命周期顺序、依赖顺序、时间和 snapshot/material 绑定；缺包或非法事实保持 unavailable/incomplete/failed。关联 AC-WH-006。
- **FR-WH-007**：必做项、条件项、外部不可用和未知事实必须保留各自状态；not_applicable 不得替代 wh-review，旧 evidence 不得满足 current completion。关联 AC-WH-007。
- **FR-WH-008**：actionable major/blocking finding 必须在完成/交接前有绑定同一 finding/review/snapshot/material 的修复，或有绑定该 finding 的真实用户 risk acceptance；其他 finding 和 unavailable 不得伪装为 pass。关联 AC-WH-008。
- **FR-WH-009**：恢复设计必须给出逐条宪法审查、旧消费者兼容、RED/GREEN、运行时验证、精确边界、rollback、AC oracle 和独立 review 计划。关联 AC-WH-009。
- **FR-WH-010**：恢复计划确认后，后续产品顺序必须先做 PaperBuilder 核心列表→工作台状态矩阵，再拆全站批次；本规格不包含 PaperBuilder 实现。关联 AC-WH-010。

## 6. 模块划分

- **闭包模块**：复用现有 bundle generator、catalog、local resolver 和 closure validator；不创建第二 bundle truth。
- **正式写入模块**：stage-runtime 调度当前 handler，TaskKernel 写 canonical quality facts；其他层不直接发布 current quality。
- **桥接模块**：host bridge/adapter 只传窄 session outcome、subject lifecycle 和必要 evidence；不拥有 completion 状态。
- **审查模块**：wh-review broker/attempt/result 负责异源 provider provenance；dsh 作为 diagnostic lens，不进入正式 code-review completion。
- **历史读取模块**：status/close/release 可以展示 legacy 记录，但 current predicates 只认当前质量事实。

## 7. 关键实体

- **SnapshotIdentity**：task、stage、HEAD/tree、clean 状态、材料 revision、runtime invocation。
- **StageOutcome**：声明 subjects 的状态、结果摘要、窄 evidence、session provenance、spec-analyze 结果。
- **CanonicalQualityFact**：由 stage-runtime/TaskKernel 写入的 immutable current fact，带 task/stage/snapshot/material binding。
- **ReviewAttempt/ReviewResult**：broker provenance、provider/model/config/source identity、material/review-track、findings 和 transport 状态。
- **LegacyEvidence**：旧 namespace 中只读可展示记录，不具 current completion 权力。
- **FindingDisposition**：finding ID、原始 verdict、fixed 或 accepted_risk、证据、owner、影响和交接。

`FindingDisposition` 只有在以下绑定完整时才可进入 current completion：`finding_id`、原始 `review_id`、该 review 的 current snapshot/material/review-track；`fixed` 必须有同一 current snapshot/material 的修复证据；`accepted_risk` 必须有真实用户确认、owner、确认时间、风险范围和有效期/复查点。任一绑定缺失、过期或跨 review 借用都返回 `needs_human`/`missing`，不满足完成。

## 8. 数据和生命周期

- **工作生命周期**：四份材料可读即可继续修复；不把 review、receipt、history 当开始许可证。
- **正式写入生命周期**：stage-runtime 认证 task/worktree/runtime/material/snapshot → handler 读取当前材料和 receipts → TaskKernel 原子写 canonical facts/evidence → status 重新计算 freshness/completion。
- **bridge 生命周期**：host start → declared step/skill outcome → bridge 窄传输 → runtime 再认证；任何缺失/乱序/重复/错绑停止为 completed。
- **review 生命周期**：broker attempt → provider output → canonical result → finding disposition/risk acceptance（如适用）→ current stage consumer；unavailable 终态不可变 pass。
- **legacy 生命周期**：只读展示 → 明确 historical/old 状态 → 不 rebind、不双写、不进入 current predicate。

## 9. 兼容性预留

- **旧 task/evidence 读取者**：保留读取/展示能力时必须标记 historical，禁止自动升级为 current。
- **现有 bundle/catalog 消费者**：保持既有入口和字段；修复只收紧生成/校验一致性，不复制发布协议。
- **现有 bridge 调用方**：保留窄 outcome 输入；多余字段、第二 writer、外部 stage_outcomes 覆盖应被拒绝。
- **现有 dsh 调用方**：允许继续拿诊断结果；正式 verify reader 不得把它映射成 `code_review`。
- **PaperBuilder 历史材料**：只读输入，等恢复后新 task 重新绑定当前项目 snapshot；不继承旧 execution facts。

## 10. 明确不做与默认必须成立

### 明确不做

- 不迁移或自动重放旧 evidence，不创建 legacy importer、replacement chain 或 rebind flow。
- 不引入第二 writer、第五材料、新 public behavior、新 stage 或独立 runtime 状态机。
- 不修 PaperBuilder 页面、不提交旧 WIP、不把 T04 假数据当真实产品事实。
- 不把浏览器、性能、视觉、provider 或历史 compatibility 的未知结果写成通过。

### 默认必须成立

- 当前四份材料是唯一工作真相；正式质量事实是附属 evidence，不是第二材料。
- 每条必做行为都能追到当前 snapshot、材料 revision、producer、consumer、failure semantics 和 owner。
- 所有写入失败 fail-loud；不可用和未知不被兜底成空成功。
- 任何需要新 authority 的实现需求必须回到当前材料重新作方向决定。

## 11. 验收标准

- [ ] **AC-WH-001**：标准阶段 owner、Talk/Grill/wh-review 顺序和 build-plan 后用户确认边界清晰。
  - 场景：维护者从当前任务开始读取四份材料。
  验证：先对 `workflows/make-decision/steps.json`、`workflows/build-spec/steps.json`、`workflows/build-plan/steps.json` 与当前四份材料做 owner/输入/输出/确认点逐项比对，再核对当前 task 的 Talk ask/wait/reply、Grill 终态、独立 wh-review attempt/result/provenance 和用户确认 evidence 是否绑定当前 snapshot/material；缺任一 declared step、真实交互或 review/确认终态时 oracle `ORACLE-WH-STAGE-HANDOFF` 返回 `incomplete/unavailable`，不得以文档声明补绿。
  - 失败：缺一个 owner、跳过真实交互、把计划确认当实现授权。
- [ ] **AC-WH-002**：正式事实只绑定当前 clean committed locatable snapshot。
  - 场景：复现 PFACT-WH011 的同会话 taskPath/launcher-derived taskPath 错绑，再分别在 clean snapshot、dirty worktree 和材料变更下尝试发布。
  验证：只有 clean/current 组合能写 current fact，其余保留 diagnostic/failed/incomplete。
  - 失败：dirty 或旧 hash 被写成当前完成。
- [ ] **AC-WH-003**：bundle/catalog/release/resolver 闭包一致。
  - 场景：正常闭包、静态依赖漂移、bundle hash 漂移、catalog 不一致。
  验证：现有生成/校验命令对正常快照退出 0，对每种漂移给出具体失败。
  - 失败：只跑 checker 通过但发布包仍含错误 hash，或空清单被当成功。
- [ ] **AC-WH-004**：正式 code review 只认 broker-provenance wh-review。
  - 场景：dsh diagnostic、有效 wh-review、provider unavailable、缺 source/config/model、旧 result、空 findings。
  验证：只有当前 wh-review 可进入 formal code_review；其他状态原样保留并影响 completion。
  - 失败：dsh/self-review/空 finding/旧 result 被算 clean。
- [ ] **AC-WH-005**：canonical quality 只有 stage-runtime/TaskKernel 正式写入。
  - 场景：stage-runtime 正常写入、bridge 传 outcome、direct quality-store 尝试写 current namespace、重复 writer 竞争。
  验证：官方路径可写；bridge、review CLI、mini-task 和 direct quality-store 触发明确 canonical-writer-only rejection，current quality delta 为 0；历史读取/隔离 fixture 不进入 current namespace，canonical record immutable；oracle `ORACLE-WH-WRITER`。
  - 失败：bridge 或第二 API 能覆盖 current fact。
- [ ] **AC-WH-006**：bridge lifecycle 顺序、依赖、时间和快照绑定可证伪。
  - 场景：正常顺序、乱序、重复、重叠、回拨时间、缺包、错 stage、错 snapshot。
  验证：正常窄 outcome 只包含允许字段并可继续；乱序/重复分别返回 `failed`/对应 reason，重叠或回拨统一返回 `failed/BRIDGE_TIME_INVALID`，缺包返回 `unavailable`，错 stage/snapshot/material 统一返回 `failed/BRIDGE_IDENTITY_MISMATCH`；同 key 同字节重放返回同一引用且 delta 为 0，冲突重放返回 `failed/BRIDGE_REPLAY_CONFLICT`，所有非法场景 bridge 前后 current quality delta 为 0；oracle `ORACLE-WH-BRIDGE`。
  - 失败：全部 completed 就能绕过顺序/时间/identity。
- [ ] **AC-WH-007**：状态语义不降级。
  - 场景：必做 completed、条件不适用、provider unavailable、unknown、incomplete、old evidence。
  验证：状态、reason、trigger/executed、current/legacy 标识保持；条件不适用不替代 wh-review，legacy 不满足 current predicate。
  - 失败：缺证据变 empty/pass，旧记录变 current。
- [ ] **AC-WH-008**：严重 finding 处置可追溯。
  - 场景：actionable major/blocking fixed、accepted risk、未处置、minor、review unavailable。
  验证：完成/交接只接受与当前 `finding_id`、`review_id`、snapshot/material/review-track 绑定的 fixed，或有真实用户确认、owner、风险范围和时间的 accepted risk；绑定缺失/过期返回 `needs_human`/`missing`；原始 finding 与 reviewer verdict 不改写。
  - 失败：删除 finding、自动 accepted、用 unavailable 冒充 clean。
- [ ] **AC-WH-009**：恢复设计具备逐条宪法、兼容、RED/GREEN、runtime、边界、rollback、oracle、独立 review 设计。
  - 场景：审查计划/任务材料。
  验证：检查 `plan.md` 的 constitution 21 条映射、旧消费者兼容矩阵、精确 MODIFY/DO NOT TOUCH 边界、phase rollback/STOP，以及 `tasks.md` 每张卡的命令/预期退出结果/oracle/evidence_path/coverage limits；同一 gate command 的 RED→GREEN、`wh_review.v2` 的 provider/source/model/config/policy/material/snapshot/review-track provenance 和逐 AC 追踪缺一即 oracle `ORACLE-WH-PLAN` 失败。
  - 失败：出现第二 writer、未声明文件、无失败 oracle、review 计划缺 provenance。
- [ ] **AC-WH-010**：恢复后 PaperBuilder 交接顺序明确且不混入当前实现。
  - 场景：计划确认后的下一任务读取交接。
  验证：`ORACLE-WH-PLAN` 检查 D-010/FR-WH-010/AC-WH-010 的交接条款、计划依赖顺序和下一任务描述：第一批必须是核心策略列表→工作台状态矩阵，第二步才是全站前端批次；同时检查当前 MODIFY/boundary 不含 PaperBuilder code；缺任一结构断言即失败。
  - 失败：T04 假数据或历史 WIP 被当当前验收事实，或全站重构先于核心闭环。

## 12. 风险、未决与交接

- **RISK-WH-001**：发布器与 closure checker 仍是两条路径；owner：bundle owner；触发：AC-WH-003 RED；交接：计划 T001/T002；关闭：同入口负例和正常发布 GREEN。
- **RISK-WH-002**：direct writer 仍可写 current namespace；owner：stage-runtime owner；触发：AC-WH-005 RED；交接：计划 T003/T004；关闭：反向引用审计和 writer negative/positive proof。
- **RISK-WH-003**：bridge 顺序/时间未被真实验证；owner：bridge owner；触发：AC-WH-006 RED；交接：计划 T005/T006；关闭：非法 lifecycle 不能 completed。
- **RISK-WH-004**：provider 不可用或 provenance 不足；owner：wh-review owner；触发：AC-WH-004；交接：各阶段独立 review；关闭：真实 attempt/result 或明确 unavailable。
- **RISK-WH-005**：重试/部分写入产生重复或冲突 canonical fact；owner：stage-runtime/bridge owner；触发：AC-WH-005/006 RED；交接：计划 T003/T004；关闭：稳定 idempotency key、同字节重放零 delta、冲突重放 fail-loud、恢复歧义保留 incomplete/unknown。
- **OPEN-WH-001**：是否能在不增加 authority 的情况下封闭 release→closure 校验；如果不能，回 make-decision，不自行扩范围。
- **OPEN-WH-002**：quality-store direct consumers 的最终 keep/read-only/delete 选择；由 build-code 只读审计决定，不能用猜测填补。

## 13. 业务影响与回归范围

### WorkflowHub 交付链

- 影响 bundle 发布、本地 skill resolver、stage-runtime、host bridge、quality/status/close/release reader 和正式 verify review。
- 不影响 PaperBuilder 运行时、不改变策略 DSL、Core、存储或回测四层语义。

### PaperBuilder 后续交接

- 恢复完成后，以真实 PaperBuilder 当前快照重新做 make-decision；首个切片覆盖策略列表→工作台的 identity、task lifecycle、report lineage 和状态矩阵。
- 全站前端批次、视觉基线、浏览器/a11y/performance 证据属于后续任务；本恢复规格不声明其完成。
