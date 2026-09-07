# 实现计划：WorkflowHub 收口准备治理与质量-成本治理及阶段治理闭环

- **Input**：`specs/workflowhub-close-readiness-governance-20260906/decision-log.md`、`specs/workflowhub-close-readiness-governance-20260906/spec.md`
- **Template version**：`plan-task.v3`
- **Spec SHA-256**：`c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef`
- **Decision-log SHA-256**：`d2bbf7f058b45d9af182bebea415070ab47eca4e81fef4fb1617aeaae3a07f15`

## Quick Read

- **Goal**：在同一任务四材料真相与五阶段顺序不新增公共入口/gate/持久对象/第二状态机的前提下，落地阶段治理闭环 III（决策冻结前置校验、findings 互斥分类强制路由、needs_human 暂停态、review 预算、轻量 usage 与字符级代理观测、跨阶段统一回退协议），同时以收口治理 I 与质量-成本治理 II 的已冻结 30 FR/30 AC 为输入，通过冻结 packet、上下文守恒与派发规范让 build-spec/build-plan 基于冻结 decision-log 高效设计，不再在规格化中做决策收敛。
- **Non-goals**：来源：`decision-log.md` 与 `spec.md`；不做页面/UI；不新增 token 预算/计费机制；不做模型-阶段强制绑定；不做审查瘦身/物理分切；不改变五阶段顺序与 close 三义；不新增公共入口/store/持久 selector/第五材料/第二状态机；不回溯改写历史材料；不把不可用/失败/unknown 改写为通过。
- **Before**：build-spec 入口无冻结校验、finding 无分类字段、needs_human 被当终态、review 无预算、usage 未落盘、回退分散在各 SKILL；主会话反复全量重读、子代理独立上下文且审查包无导航分层；材料模板标签与校验器标签错位、拒绝条件无表达位。
- **After**：build-spec/build-plan 入口先行三方一致冻结校验与增量续签链；所有 handler 在 dispositions 汇总后、写入 completion 前做分类路由校验与 needs_human 收紧；review 按冻结 revision 守预算并提供窄域核销出口；provider usage 与三项字符级代理指标随 attempt/outcome 落盘；五阶段共用统一 owner/consumer/next_action 回退协议；spec-specify/spec-plan/spec-tasks 只消费冻结 packet，主会话只留 ref+hash+摘要≤500 字，派发独立上下文，审查包保持 file_only 字节不减零新文件。
- **Main risk**：冻结校验与路由校验若误实现为写入阻断会违宪“记录事实不阻断”；增量续签链实现错误会误放行/误阻断；摘要或派发边界丢失会丢关键语义。
- **Next step**：按 Phase 1→4 顺序执行；每 Phase 独立 RED→GREEN 与独立 review；任一 Phase 发现方向级缺口立即增量决策局部继续，不重跑已确认部分。

## Technical Context

### Global Constraints

- 四份当前材料（decision-log/spec/plan/tasks）+ evidence 是唯一工作真相；review/test/quality/usage 仅产出事实，不新生 gate。
- WorkflowHub 运行期与四材料仅在认证 worktree `workflowhub-workflowhub-close-readiness-governance-20260906` 内修改；分支 `task/workflowhub/close-readiness-governance-20260906`，基线以当前 spec revision `e9bc49bc` / snapshot `e94e3cee` 为锚，material_revision 与 snapshot_tree 由 stage runtime 派生并与冻结校验绑定。
- 宪法硬约束：不新增公共 runtime 入口（仅 doctor/status/run/review/verify/confirm/authorize 私有实现）；不新增持久对象/第五材料/新 store/第二状态机/永久 bridge/双写；质量裁决须异源独立上下文，禁止自审自判；缺失事实保持 unknown/unavailable/incomplete 不得伪造通过。
- Provenance 与 usage 保留：原始 review/测试/历史事实不被摘要覆盖；provider 失败不改为空 findings；四材料头部导航节可再生非权威不持久。
- 实现范围：仅触及 `runtime/stage/`、`runtime/task/evidence/review`、`skills/spec-*`、`workflows/build-spec|build-plan|build-code|verify-code`、`tools/cli/stage-runtime` 与对应测试；不涉及产品 UI/浏览器/下游验收。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-content-contracts.mjs#validateSpecContentProfile`、`#validateAcceptanceDesignMinimum`、`#validatePlanTaskContract`、`#validateExecutablePlanTaskMinimum`、`#validatePlanTaskContractV2`、`#activeAcceptanceCriterionIds`、`#buildConsumerCensus`、`#deriveChangeImpact`；`runtime/stage/stage-handlers.mjs#officialStageHandler`、`#interactionAggregateFacts`、`#testFacts`、`#safeReviewFacts`；`runtime/stage/stage-runner.mjs#validateStageSpecAnalyzeOutcome`、`#validateSkillOutcome`；`runtime/stage/stage-context.mjs`；`runtime/stage/completion-predicates.mjs`；`runtime/task/material-workspace.mjs`；`tools/cli/stage-runtime.mjs#resolveWorkflowHubIdentity`；`skills/spec-specify|spec-plan|spec-tasks` 的 SKILL 输入契约；`runtime/evidence/stage-content-evidence.mjs`。
- **Existing interfaces**：五个 `workflows/<stage>/steps.json`、`ArtifactDir` 四材料读写、`stage-runtime run`、现有 `wh-review` simple runner 与 provider broker。
- **Read now**：本计划列出的 validator、handler、stage-runtime 入口、冻结 packet manifest 结构、`spec.md` 第 5/11/8 节的 FR/AC/状态契约与失败分支表。
- **Must read before task**：每张任务卡的精确文件与对应 symbol；无需全仓扫描。
- **Context mode**：Full — 需保留 task/material/snapshot/identity/provenance/owner 关系。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 决策冻结校验 | extend | `runtime/stage/stage-content-contracts.mjs` + `stage-handlers.mjs` 入口校验 + `stage-runner.mjs` outcome 写入 | 并入既有 stage 入口完成条件检查，不新增公共 gate；当校验被经审查的替代完成条件检查替代时删除 |
| finding 分类与路由校验 | extend | `runtime/stage/stage-handlers.mjs` dispositions 汇总后、`stage-runner` addCompletion 前校验点 | 插入现有 handler 完成路径，不新增状态机；被替代机制取代时删除 |
| needs_human 暂停态收紧 | extend | `runtime/stage/completion-predicates.mjs` 与 handler completion 判定 | 收紧完成口径，不新增状态机；被替代语义取代时删除 |
| review 预算计数与窄域核销 | extend | `runtime/stage/stage-handlers.mjs` review 调度 + `stage-content-evidence` attempt 事实 | 按 review 目标（stage/material/frozen revision）计数，不新增持久对象；被替代收敛机制取代时删除 |
| provider usage 落盘 | extend | `runtime/evidence/stage-content-evidence.mjs` 的 attempt 事实（已存在 usage 字段） | 仅增加消费与落盘，不新增 store；当 provider 统一返回 usage 且观测口径被替代时归档 |
| 字符级代理观测 | extend | 各阶段 outcome 的现有阶段 outcome 事实 | 追加只读观测字段，不新增对象；被替代观测取代时删除 |
| 统一回退协议 | extend | 现有五阶段 handler 的路由语义（去重各写一套条文） | 统一引用协议，不新增阶段/入口；被替代协议取代时删除 |
| 冻结 packet 与导航 | extend | `runtime/task/material-workspace.mjs` 冻结链与材料内嵌导航节 | 扩展宿主组装与 packet manifest，不新增第五材料；被新投递链替代时删除 |

## Solution Design

### Overview

P1 先建立冻结校验与路由基础设施的共享类型与工具：冻结 packet 组装/摘要/SHA、manifest hash、分类互斥判定、影响维度枚举与 disposition 路由表；校验落点统一为“各 handler dispositions 汇总之后、写入 completion 之前”。P2 在此之上实现分类状态机收紧：实现级自修/规格歧义问用户一次/方向级增量决策局部继续，并把 needs_human 收紧为暂停态（必带 next_action，禁止当 formally complete），完成出口限 fixed/rejected_invalid/user_decided/accepted_risk 四白名单。P3 再实现 review 预算计数器与两层观测落盘：同一冻结 revision 一次初始+变化后一次 focused，耗尽走窄域 diff 核销或问用户/accepted_risk；provider usage 随 attempt 落盘、缺失标 unavailable，配合三项字符级代理指标。P4 最后以统一回退协议贯通五阶段：实现级/规格歧义/方向级/材料 gap/环境不可用五类路由共用 owner/consumer/next_action，runtime 校验“该回退的没回退”，并以端到端回归证明不演变为整阶段重跑且不阻断修复。

### Module responsibilities

#### 冻结校验与分组路由模块

- **Responsibility**：提供决策冻结前置校验（头部 approval_binding/status=accepted 三方一致、绑定当前 material_revision/snapshot_tree、无方向级未决、冻结包四项覆盖）、增量续签链接受（基线确认+增量增补链）以及 finding 分类与路由校验（互斥分类、影响维度清单、证据引用、disposition 匹配检查）。
- **Consumes**：当前 decision-log 正文本、头部 approval_binding、material_revision/snapshot_tree、review finding 集合与 disposition 记录。
- **Produces**：阶段 outcome 中的冻结校验结果事实、分类记录与路由校验结果（通过或阻断正式完成但不阻断修复的完成条件事实）。
- **Must not decide**：不创建新 gate/第二状态机；不推导 quality_status。

#### 状态机与暂停态模块

- **Responsibility**：收紧 needs_human 语义为暂停态，校验 next_action、出口白名单、accepted_risk 回执与 user_decided 绑定；分离 attempt 层可用性（executed/failed/unavailable）与 finding 处置两层事实。
- **Consumes**：每条 finding 的 disposition、attempt 执行事实、用户答复回执。
- **Produces**：暂停事实、出口绑定事实与两层分离可观测状态。
- **Must not decide**：不新增持久状态存储。

#### 预算与观测模块

- **Responsibility**：按 review 目标（stage/material/frozen revision）计数预算、执行窄域 diff 核销、记录耗尽出口；落盘 provider usage 与三项字符级代理指标。
- **Consumes**：同一冻结 revision 的 review attempt 集合、provider 返回的 usage、主会话 read 计数、子代理输入字节、材料包字节。
- **Produces**：预算计数事实、核销记录、usage 观测事实与代理指标。
- **Must not decide**：不提供 token 预算/计费；不承诺下降。

#### 统一回退与上下文守恒模块

- **Responsibility**：五阶段共用 owner/consumer/next_action 回退路由；组织 freeze packet 输入、材料导航、摘要派发、按需读取。
- **Consumes**：finding 分类、阶段 owner、冻结 packet、材料导航节。
- **Produces**：路由事实、完成条件校验、packet manifest/hash、派发与摘要事实。
- **Must not decide**：不把优化宣称为已证伪的 token 下降。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：沿用 `workflowhub-spec-analyze-stage-outcome.v1`、`spec-content.v3`、`plan-task.v3` 与现有 handler 契约；新增冻结校验结果、分类记录、预算计数、usage 观测均为附加事实字段，不改变现有 schema 必选集。
- **Data flow / state**：冻结 packet（宿主组装→脱敏→冻结→manifest+hash）→ 阶段入口校验 → 阶段执行（主会话只留 ref+hash+摘要）→ 子代理派发与摘要回传 → review（按预算）→ dispositions 汇总 → 分类路由与 needs_human 校验 → 完成条件判定（不满足则暂停/阻断完成但不阻断修复）→ outcome 落盘（含 usage/代理指标）。
- **API contract**：无新公共 API；公共行为仍为 doctor/status/run/review/verify/confirm/authorize。
- **Failure modes**：校验错误=完成条件不满足而非写入拒绝；attempt unavailable 走两层分离不入 disposition 白名单；环境不可用按 RISK-008 三态记录不伪装。
### 架构：阶段治理闭环落地

**冻结 packet 输入**：`spec-specify / spec-plan / spec-tasks` 的输入契约由“Read the current … 全文”改为“收冻结 packet”。宿主侧在 stage 入口组装 packet：冻结材料正文（含材料内嵌导航节）+ packet manifest（task_id/stage/material_revision/snapshot_tree/各材料 sha256/派生文件清单及 source_digest/权威声明）+ 包内导航/摘要与按需详情。`packet_freeze_hash = SHA-256( canonical JSON({manifest_minus_hash, file_entries}) )`，`file_entries` 按 POSIX 路径字典序，manifest 自身 hash 不进 preimage。调试期专供的 `diagnostic-report.md`、`context-baseline.json` 以派生层条目进入阶段输入 packet 的清单，审查 packet 维持 file_only 冻结链、字节不减、零新文件。主会话按上下文守恒六条执行：全量落盘、只留 ref+hash+摘要≤500 字、子代理回传≤500 字且一条 finding 一行、研究≤4/debate≤4/审查多 provider 单发、交互 M 独占、每步只依赖上步摘要+ref。

**分类路由校验落点**：runtime 校验插入点固定为“各 handler dispositions 汇总之后、写入阶段 completion 之前”。每个 handler 先按私有业务产生原始 disposition 集合，随后统一路由校验器检查：①每条 finding 已得互斥分类且附影响维度（九维度之一）与证据引用；②`spec_ambiguity → 必须存在用户答复绑定（复用 human-confirmation 扩展 finding_id）`；③`direction_change → 必须存在增量决策记录`；④不许 direction 级标 fixed。路由错误→记录并将该阶段完成条件置为不满足（正式完成阻断），但不阻止同一任务修复路径的继续写入；完全遵循“记录事实不阻断”。

**needs_human 状态机**：`needs_human` 仅作暂停态，必须附 `next_action ∈ {ask_user, return_to_make_decision, return_to_spec}`，禁止作为 formally complete 的最终处置。阶段 completion 只允许 `fixed / rejected_invalid / user_decided / accepted_risk`；`accepted_risk` 必须绑定用户授权回执+风险记录。`needs_human` 存在时 completion 保持 `incomplete` 并如实汇报；答复后转 `user_decided`（绑 finding_id/card_hash/reply_ref 写入既有载体）或经增量决策再处置。review attempt 的 `executed/failed/unavailable` 与 finding 处置是两层事实分离：provider 不可用=attempt 层 unavailable 记录，不进 disposition 白名单，不产生 finding。

**review 预算计数**：预算单位=同一 review 目标（stage/material/frozen revision）。同一冻结 revision：一次初始 review（含其全部 role/provider 与单次重试，并发调用不计额外轮次）+ 材料实际变化后最多一次 focused review（仅复核变化范围）；无变化禁重审。`build-code` 每 phase 的 phase 审查是各 phase 独立目标，不计入 build-spec/build-plan 预算；每次增量续签（新冻结 revision）产生一次新的 focused 配额。耗尽路由：focused 后仍有残留→实现级再修一次后窄域 diff 核销一次（仅核对本次修复 diff）；仍不收敛或属方向级→转问用户或 `accepted_risk`。provider 失败/空桩/超时=attempt 层 unavailable，不算 pass，不改空 findings。每个状态都有确定出口，不制造死锁。

**usage 落盘**：观测分两层仅轻量记录，不做预算计费。① provider usage（input/output/cached tokens、duration、失败原因）若返回则落盘到 review attempt 事实，缺失标 `unavailable`。② 字符级代理指标（主会话 read 重读轮次、阶段内子代理输入字节、材料包字节）随阶段 outcome 记录。三者组合回答“浪费在哪”，成功边界不承诺 token 总量下降，无下降证据如实写“未证明下降”。

**跨阶段统一回退协议**：五阶段共用 `owner / consumer / next_action` 路由：实现级→当前阶段自修；规格歧义→回 build-spec（build-plan 走 spec-clarify）问一次；方向级→回 make-decision 增量决策（III-2）；材料 gap→回对应 owner 阶段；环境不可用→attempt 层如实记录。runtime 校验“该回退的没回退”即完成条件不满足；不新增阶段/公开入口/门；各阶段 SKILL 统一引用本协议，回退不演变为整阶段重跑。

### 上下文守恒：冻结 packet 作为输入

spec-specify/spec-plan/spec-tasks 的宿主侧先执行冻结校验与 packet 组装，随后以 packet_ref+hash+摘要（每包摘要≤500 字含节清单与数量校验）派发给主会话与子代理。主会话按需以 `grep 标题锚点 → offset 片段` 读取详情，不回塞全文；子代理与审查者只收到冻结副本的按需切片。审查包内 `review-instructions.md` 升级为导航引导：先读导航/摘要再按需读详细。task_dir 直读与审查瘦身/分切永久禁止，保持 file_only 冻结链可复现与可核对。

### AC 在 build-plan 期可延期为 unavailable 的清单（逐条）

按 `FR-PREF-001` 九字段合同与 `spec.md` 第 11 节各 AC 卡的收口合同，以下 AC 的可执行字段在 build-spec 阶段允许标注 `unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)`，在 build-plan 末端必须替换为 concrete 或保持可判定的 unavailable（否则预检为 unavailable/acceptance incomplete，不阻断修复）：

- **AC-DIAG-001/002/003**：`命令`、`fixture`、`oracle`（产品级，`oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)`）可延期；`producer/consumer/owner/freshness/close 条件`等语义字段在 spec 已冻结不可延期。
- **AC-FLOW-001/002/003**：同上，`命令/evidence_path` 可延期；`producer/consumer/owner` 不可延期。
- **AC-PREF-001/002**：`命令`（预检 profile 命令）、`oracle=ready/unknown/unavailable 与原因` 在 spec 阶段为 `unavailable(deferred_to_build_plan)`，build-plan 末端生成只读预检 profile 后替换。
- **AC-GAP-001/002**：`命令`（收口投影实现命令）、`fixture`（同根因多投影样本）可延期至 build-plan/tasks；gap_id 算法与五字段 payload 不可延期。
- **AC-BOUND-001/002**：`命令`（协议边界实现）可延期；身份错配拒绝与语义缺口投影语义不可延期。
- **AC-STATUS-001/002**：`命令`（状态展示实现）可延期；六状态来源与 close 抄写语义不可延期。
- **AC-MATERIAL-001/002/003**：`命令`（材料校验实现）可延期，但 AC 四段卡四段非空与 oracle 结构在 spec 已定稿不可延期。
- **AC-REVIEW-001/002**：`命令`（异源审查通道）可延期；三态事实与 provenance/身份校验语义不可延期。
- **AC-CONTEXT-001/002/003**：`命令`、`fixture` 可延期；Execution model、导航节位置、packet 结构不可延期。
- **AC-REPORT-001 / AC-GOV-001**：`命令` 可延期；汇报分层与控制面登记语义不可延期。
- **AC-LOOP-001～006**：`命令`（冻结校验器、路由校验器、budget 计数器、usage 观测、回退协议校验器）可延期，但分类互斥优先级、出口白名单、预算单位等产品语义不可延期。

未列入的鲜活字段（如 `evidence_path` 中的 `quality/evidence/...` 实际路径）在 tasks 冻结前可继续标注 `unavailable(deferred_to_build_plan)`，但 build-plan 冻结后仍为 unavailable 时预检结果保持 `unavailable`，仅置为 `acceptance=incomplete` 而非阻断。

## File Boundary

### NEW

- `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P1/P2/P3/P4 共享的负向与正向夹具；按 phase 通过 gate_cmd 过滤）
- `tests/contract/material-oracle-context-packet.test.mjs`（覆盖 AC-MATERIAL/CONTEXT/PREF 的四段与 packet 分层）

### MODIFY

- `runtime/stage/stage-content-contracts.mjs`（新增冻结校验、分类、needs_human、budget、usage、回退协议的纯函数校验器；不新增持久对象）
- `runtime/stage/stage-handlers.mjs`（build-spec/build-plan 入口插入冻结校验；各 handler dispositions 后插入路由与 needs_human 校验；写入 completion 前做回退协议与预算校验）
- `runtime/stage/stage-runner.mjs`（outcome 写入含 usage 与代理指标观测；保留历史 packet 重建记录）
- `runtime/stage/stage-context.mjs`、`runtime/stage/completion-predicates.mjs` 与 `runtime/task/material-workspace.mjs`（冻结 packet 组装与 manifest 生成、材料导航节校验、needs_human 完成谓词）
- `runtime/evidence/stage-content-evidence.mjs`（attempt 事实 usage 字段落盘消费）
- `skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/plan-template.md`（输入契约改为“收冻结 packet”，模板与校验器口径统一，禁止全文直读）
- `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`（五阶段统一回退协议与既有执行规范引用，单源治理）
- `tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`（stage 入口与桥接身份校验错误转为完成条件事实）
- `evidence/diagnostic-report.md`（诊断交付的四段事实报告，由回归任务生成/复核）
- `tests/contract/host-outcome-bridge.test.mjs`（桥接真实调用路径与身份拒绝回归）

### DO NOT TOUCH

- `specs/workflowhub-close-readiness-governance-20260906/decision-log.md`、`spec.md`（只消费，不新增决策）
- `specs/archive/`、`CONTEXT.md`、`CONSTITUTION.md`、`docs/architecture/move-map.json`（新增文件已登记职责，登记后由本计划按 move-map 更新）
- `constitution-checklist.md`（只绑定检查，不改清单）

- **Deletion proofs**：本任务不删除既有生产文件、公共入口或持久对象；仅新增/修改计划声明范围内的实现与契约测试，删除证明以“不涉及删除”记录。

## Technical Decisions

### DEC-001 冻结校验插入点与完成条件属性

- **Problem**：上游未定却在 build-spec 翻译中做决策导致 13+ 轮不收敛。
- **Options**：入口完成条件检查 / 新增公共 gate / 只读文档约定。
- **Selected**：入口完成条件检查（非 gate、非第二状态机），结果为阶段 outcome 事实，未通过则暂停回 make-decision。
- **Reason**：可证伪且不违宪“记录事实不阻断”。
- **Consequence / risk**：续签链实现复杂（RISK-009）。
- **Fallback**：回退入口校验，保留冻结 packet 手工检查。

### DEC-002 分类与路由校验落点选 handler 集合后

- **Problem**：各 handler 各自处置易把方向级标 fixed 后继续。
- **Options**：各 handler 内检 / 统一后置校验 / 审查者人工核对。
- **Selected**：统一后置校验（各 handler dispositions 后、addCompletion 前）。
- **Reason**：单点可测、覆盖全部 stage。
- **Consequence / risk**：校验与“不阻断修复”张力（RISK-007）。
- **Fallback**：回退为各 handler 私检，保留统一错误码。

### DEC-003 needs_human 暂停态与 attempt 两层分离

- **Problem**：过去 needs_human 被当终态直接完成。
- **Options**：新状态机 / 暂停态+出口白名单 / 沿用现状。
- **Selected**：暂停态+四出口白名单+attempt 两层分离。
- **Reason**：最小化控制面且可判定。
- **Fallback**：回退白名单检查，保留 next_action 约束。

### DEC-004 Review 预算按冻结 revision 计数

- **Problem**：无预算导致 16 次重审不收敛。
- **Options**：全局次数 / 按冻结 revision 计数 / 无预算。
- **Selected**：按冻结 revision（一次初始+变化后一次 focused，增量续签新配额）+ 窄域 diff 核销出口。
- **Reason**：避免把未变更重审计为新消耗，同时防止整阶段重跑。
- **Fallback**：回退预算计数，保留耗尽出口检查。

## Test Strategy

- **总体纪律**：每个行为开 RED→GREEN 配对；RED 构造可证伪拒绝断言，GREEN 复用同一 gate_cmd 与 oracle 使正例通过；非行为聚合任务 verification_role=N/A，不强制 reject。
- **层次**：L1 单元（冻结 hash、规范化、分类互斥、预算计数器纯函数）；L2 契约（plan/task 结构、AC 四段卡与 oracle 结构校验、packet manifest hash 确定性）；L3 集成（handler 入口校验→dispositions→路由校验→completion 判定端到端；review 预算跨 attempt、usage 缺失标 unavailable、回退协议全链）。
- **Oracle 形态**：`{pass: "可观察正向断言", reject: {input, expected_rejection, observation}}`；RED-only 强制 reject 三段非空且语义非占位；GREEN 仅强制 pass 非空且配对关联存在；N/A 不强制。
- **夹具类型**：三方不一致、绑定非当前材料、有方向级未决、缺维度、命中方向维度、无法互斥、budget 重复、无变化重审、attempt unavailable、零 digest、digest 不匹配等 20+ 负向样本；每类均有独立正向样本对照。
- **Gate**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 与 `tests/contract/material-oracle-context-packet.test.mjs` 按 `t/phase` 过滤；RED 期望 1、GREEN 期望 0；同一 oracle 复用。
- **Coverage limits**：不启动真实 provider；不做浏览器/UI；不调用真实 3rd-review 远端；token 下降以字符级代理指标为观测，不承诺总量下降。

## Rollback and Recovery

- **冻结校验误阻断**：回退 `stage-handlers` 入口校验分支，保留续签链解析；历史 decision-log 不改写，新增增量 D 与答复回执重新冻结验证。
- **路由校验误判**：回退统一后置校验，改回各 handler 私检；disposition 错误仍以完成条件不满足呈现，不影响修复数据。
- **预算耗尽死锁**：若窄域核销仍不收敛，执行预设出口：问用户或 accepted_risk（带授权回执）；预算计数器保持可回退计数。
- **usage 缺失**：provider 未返回 usage 时标 unavailable，不伪造零值；代理指标仍可用；修复后新 attempt 重新落盘。
- **回退协议分歧**：原子回退统一协议引用并保留单一 owner；不保留各 SKILL 的永久兼容副本，不新增阶段/入口。
- **通用原则**：所有回滚仅撤销本阶段新增校验代码与测试，不回滚已冻结材料；缺口保持 unavailable/incomplete 可同任务修复。

### Engineering Risk Handoff

- **Affected IDs**：RISK-007、RISK-008、RISK-009、RISK-010；FR-LOOP-001～006；AC-LOOP-001～006。
- **Trigger**：冻结绑定、分类路由、needs_human、review 预算、usage 或统一回退校验出现误放行、误阻断、伪造通过或无法重建。
- **Consequence**：方向级未决可能进入规格化，正式完成可能被错误声明，或 unavailable/failed 事实丢失。
- **Mitigation or STOP**：保留原始事实与原因，回退到本计划声明的兼容分支；若需新增公共入口、持久对象、第二状态机或改写 unavailable 为 pass，立即 STOP。
- **Handling Stage**：实现级在当前 Phase 修复；规格歧义回 build-spec/spec-clarify；方向级回 make-decision 增量决策；环境不可用保留 attempt 层 unavailable。
- **Verification**：运行对应 Phase 的窄域 RED/GREEN gate、独立 review 与 stage outcome；缺失审查/usage/观察事实保持 unavailable/incomplete。

## Implementation Order

| Phase | Goal | Depends | Parallel |
| --- | --- | --- | --- |
| Phase 1 冻结校验与路由基础设施 | 完成冻结校验器、增量续签链、分类路由校验器与 handler 插入点骨架 | none | 否（首相独占） |
| Phase 2 分类与状态机 | 在 Phase 1 骨架上实现分类互斥判定与 needs_human 暂停态收紧（含 attempt 两层分离） | Phase 1 | 可与 Phase1 测试并行编写，但实现串行 |
| Phase 3 预算与观测 | 实现 review 预算计数器、窄域 diff 核销与两层 usage/代理指标落盘 | Phase 2 | 可与 Phase2 测试并行，但实现串行 |
| Phase 4 跨阶段协议与回归 | 以统一回退协议贯通五阶段，完成 E2E 回归、材料/上下文收口与 dogfood 观察 | Phase 3 | 否（回归独占） |

顺序理由：严格执行 D-306 的有效载荷顺序：Phase 1 只建立冻结/路由的最小契约脚手架，不实现上下文或 verify 独立性；Phase 2 的 T007/T008 先完成材料模板、校验器和 RED/GREEN oracle 质量；Phase 3 的 T011/T012 再落地 Execution model、导航、派发与 packet 上下文；Phase 4 的 T013/T014/T015/T016 最后收口五阶段回退、异源 verify 独立性、桥接边界与诊断回归。每个后置有效载荷均依赖前置任务，不能把 Phase 1 的脚手架误读为绕过“先质量后效率”。

## Dependencies and Parallelism

- **串行链**：P1→P2→P3→P4；同一校验落点（dispositions 后）串行修改，禁止多 Task 并发改 `stage-handlers.mjs` 同一函数。
- **可并行**：测试编写可与下一 Phase 设计并行；调研与 fixture 编写由子代理并行派发（≤4）。
- **交互 M 独占**：分类疑问与增量决策问答由主会话独占，不外包子代理。
- **资源**：复用 `js-yaml`、现有 validator 与 sidecar 记录；不新增依赖。

## Requirement and Verification Traceability

| Source ID | FR / AC IDs | Task IDs | Phase | Gate / Evidence |
| --- | --- | --- | --- | --- |
| R-011 / D-501 | FR-LOOP-001 / AC-LOOP-001 | T001/T002 | Phase 1 | freeze validator 单元+契约，冻结校验结果事实 |
| R-011 / D-502 | FR-LOOP-002 / AC-LOOP-002 | T003/T004 | Phase 1 | classification+路由校验契约，路由校验结果事实 |
| R-011 / D-503 | FR-LOOP-003 / AC-LOOP-003 | T005/T006 | Phase 2 | needs_human 暂停态与两层分离契约，处置事实 |
| R-011 / D-504 | FR-LOOP-004 / AC-LOOP-004 | T009/T010 | Phase 3 | budget 计数器与窄域核销契约，预算事实 |
| R-011 / D-505 | FR-LOOP-005 / AC-LOOP-005 | T011/T012 | Phase 3 | usage+代理指标落盘契约，观测事实 |
| R-011 / D-506 | FR-LOOP-006 / AC-LOOP-006 | T013/T014 | Phase 4 | 统一回退协议校验契约，路由事实 |
| R-009/R-010 / D-302 | FR-MATERIAL-001/002/003 / AC-MATERIAL-001/002/003 | T007/T008 | Phase 2 | AC 四段与 oracle 结构校验 |
| R-008/R-010 / D-304/305 | FR-CONTEXT-001/003 / AC-CONTEXT-001/003 | T011/T012 | Phase 3 | packet/导航/派发契约 |
| R-008/R-010 / D-304/305 | FR-CONTEXT-002 / AC-CONTEXT-002 | T015/T016 | Phase 4 | phase 派发与上下文回归契约 |
| R-001/R-006 / D-205 | FR-GAP-001/002 / AC-GAP-001/002 | T003/T004 + T013/T014 | Phase 1/4 | gap_id 确定性与消缺契约 |
| R-001/R-004 / D-201/D-202 | FR-PREF-001 / AC-PREF-001 | T001/T002 | Phase 1 | 冻结前置预检契约 |
| R-001/R-004 / D-203/D-204 | FR-STATUS-001/002 / AC-STATUS-001/002 | T005/T006 | Phase 2 | 状态分层与 needs_human 契约 |
| R-001/R-004 / D-206/D-207 | FR-PREF-002 / AC-PREF-002 | T015/T016 | Phase 4 | 预检回归与报告契约 |
| R-001/R-004 / D-206/D-207 | FR-BOUND-001/002 / AC-BOUND-001/002 | T013/T014 | Phase 4 | 边界拒绝与语义缺口契约 |
| R-010 / D-303 | FR-REVIEW-001/002 / AC-REVIEW-001/002 | T009/T010 | Phase 3 | 异源独立审查三态与身份校验契约（dispatch_attempt/review_result 分离） |
| R-001/R-002/R-007/008/009 / D-001/D-101/D-301 | FR-DIAG-001/002/003/FLOW-001/002/003/GOV-001/REPORT-001 / 对应 AC | T015/T016 | Phase 4 | 诊断/dogfood/流程与汇报契约偏回归 |

> 每条 FR/AC 至少被一个任务覆盖；循环依赖无，覆盖 deficits 在 tasks 冻结前报告。

## Governance Synchronization Matrix

| 治理维度 | 决策锚点 | 运行时消费者 | 同步载体 | 删除/保留条件 |
| --- | --- | --- | --- | --- |
| 决策冻结校验 | D-501 / FR-LOOP-001 | build-spec/build-plan 入口 | 阶段 outcome 冻结校验结果事实 | 被替代的完成条件检查取代时删除 |
| 增量续签链 | D-501-502 / FR-LOOP-001-002 | 冻结校验入口 | decision-log 内增量 approval_binding 续签事实 | 被替代机制取代时删除 |
| finding 分类与路由 | D-502 / FR-LOOP-002 | handler 统一后置校验 | review attempt 内分类记录与路由校验结果 | 被替代机制取代时删除 |
| needs_human 暂停态 | D-503 / FR-LOOP-003 | completion 判定 | disposition 暂停事实与出口绑定 | 被替代语义取代时删除 |
| review 预算与窄域核销 | D-504 / FR-LOOP-004 | review 调度与完成条件校验 | 预算计数与核销事实 | 被替代收敛机制取代时删除 |
| usage 与代理观测 | D-505 / FR-LOOP-005 | 阶段汇报与成本回顾 | attempt usage 与代理指标事实 | 被替代观测取代时归档 |
| 统一回退协议 | D-506 / FR-LOOP-006 | 五阶段 completion 校验 | 各 SKILL 统一引用协议 | 被替代协议取代时删除 |
| 上下文守恒与冻结 packet | D-304/305 / FR-CONTEXT-001-003 | 主会话/子代理/审查者 | packet manifest/hash 与派发摘要事实 | 被新投递链替代时删除 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"e400d447d94a68fc629ac05acb23c807e34a5c929a5bd723c91c9b02dfc16732","id":"CONSTITUTION-WORKFLOWHUB-1.7.0","version":"1.7.0","clause_count":22}`
- **Clause snapshot**：F1、F2、F3、F4、F5、F6、F7、F8、F9、F10、F11、Q1、Q2、Q3、S1、S2、S3、S4、S5、S6、S7、S8。

- F1 薄核心：能力下沉至 handler 校验器与 packet 组装，不改 core 调度；pass。
- F2 窄契约：handler 与 evidence 间仅经冻结校验结果/分类记录/预算/usage 事实通信；pass。
- F3 四材料决定推进、正式发布保持结构真实：四份当前材料是唯一工作真相，发布不抹平 incomplete/unavailable；pass。
- F4 质量靠异源审查与人、finding 不锁死修复：独立审查只记录事实，修复路径仍开放；pass。
- F5 gate 谨慎添加、出事再补、无用则移除：本计划不新增公共 gate；pass。
- F6 统一外置执行记录：阶段执行事实沿用现有外置记录与桥接，不新增第二记录源；pass。
- F7 三处正常确认与独立授权：用户确认与不可逆授权分开，accepted_risk 绑定真实回执；pass。
- F8 简单优先：复用既有 handler、evidence、review 与 packet 载体，不重复造控制面；pass。
- F9 可证伪、不假绿：RED 负向 oracle、unavailable/failed/incomplete 与原因均保留；pass。
- F10 自动化按真实收益添加：冻结、路由、预算和观测均有明确 consumer，不为机器校验堆新基建；pass。
- F11 正常执行优先、控制面受限：公共 runtime 入口与阶段顺序不变，校验属于完成事实；pass。
- Q1 质量事实不作准入证：review/test/usage 只产事实，不派生 release 许可；pass。
- Q2 推进资格、发布结构与完成判据分离：completion、quality、product release 独立记录；pass。
- Q3 异源审查加人工把关：每 Phase 记录独立 review 结果，最终仍需人工确认；pass。
- S1 能用外部就不造轮子：复用既有 3rd-review、vitest、stage runtime；pass。
- S2 外部技能可针对项目改造合宪：只改当前 workflowhub 的输入契约与事实绑定；pass。
- S3 迭代时保持最新并就地检查：每次材料修改后重算 hash、重跑结构校验；pass。
- S4 自定义技能必须有指标系统：usage 与字符级代理指标记录为事实；pass。
- S5 自定义技能方便子代理调用、省主上下文：packet 导航、摘要与按需读取显式落盘；pass。
- S6 自定义技能参考市面方案、不闭门造车：review 与 testing 使用既有标准技能链；pass。
- S7 一阶段一技能、一工作流一文件夹：本计划只调整现有 stage skill/workflow 边界；pass。
- S8 自定义技能可独立调用、可搬运：不绑定单一宿主，保留现有 portable skill bundle；pass。

## Complexity Trade-offs

- **共享校验器 vs 各 handler 私检**：选共享统一后置校验（利于 RISK-007 可测性），代价是 handler 集合点单点变更；通过按 phase 隔离与 task 互斥缓解。
- **按冻结 revision 计数 vs 全局次数**：选冻结 revision 计数（更精确避免误伤），代价是需维护 revision 映射；通过 manifest 绑定缓解。
- **字符级代理指标 vs token 预算**：选字符级（不依赖 provider 计费且可观测），代价是不等同 token；通过与 usage 两层组合回答“浪费在哪”，不承诺下降。

## 风险与回滚：RISK-008 / RISK-009 的缓解

**RISK-008 外部 review/独立审查通道不可用导致当前质量事实保持 unavailable**

- 触发：provider/身份配置或冻结 packet 不可用。
- 后果：无独立审查语义结果但不影响已记录缺口的可见性。
- 缓解（本计划）：① 三态分明记录 `executed/failed/unavailable` 与真实原因；② `failed` 允许一次既有通道重试，不替代自查；③ `unavailable/failed` 不被改写为 pass 或空 findings；④ 阶段汇报保留 unavailable 事实与下一步（AC-REVIEW-001/002、AC-BOUND-002 的三态与非阻断观察）；⑤ build-plan 开始前由 T001 记录 `OPEN-004` 配置检查结果，用户授权后才执行配置修复。
- 回滚：回退通道可用性判断与重试分支，保留三态记录结构；不回滚质量事实本身。

**RISK-009 增量决策续签链与冻结校验交互复杂，实现错误会误放行或误阻断**

- 触发：续签链缺答复回执仍 accepted，或合法增量增补被入口校验拒绝。
- 后果：未确认方向进入规格化，或增量决策后再次被误阻断。
- 缓解（本计划）：① 续签绑 `D、用户答复回执 ref/hash、当前 snapshot`；② 基线确认+增量增补链，不对历史 step 11 全量重确认；③ 双向负向夹具覆盖（缺回执误放行拒绝、合法增补误阻断拒绝）落入 AC-LOOP-001 的续签链双向夹具；④ build-plan 重校验 spec revision 与 decision revision 配对。
- 回滚：回退续签链解析与冻结校验分支至只校验基线确认的兼容模式，保留增量 D 与回执历史；随后按独立复核指引重放续签链修复。

---

## Phase 1 — 冻结校验与路由基础设施

### Goal

实现决策冻结前置校验器与增量续签链解析，及 finding 分类与路由校验器的 handler 统一后置校验插入点与最小可用形态；验证 packet 组装与 manifest 生成骨架可用。

### Files

- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-context.mjs`、`runtime/task/material-workspace.mjs`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P1 段）

### Tasks

P1 任务：T001、T002、T003、T004（详见 tasks.md Phase 1）

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T001|freeze|T003|classification|gap"` — RED 1、GREEN 0；冻结三方不一致/绑定非当前材料/有未决被拒绝，分类缺依据/命中方向维度/无法互斥不得 fixed；Phase 1 另留 wh-review attempt/result 与 provider identity/usage 或 unavailable 事实。

### Knowledge

交给 P2：冻结 packet 格式、分类表与路由表已可用；校验落点已固定。

### STOP

需新增公共 gate/阶段/持久对象时停止。

### Done

冻结校验与路由校验器可独立验收；产物为阶段 outcome 事实与校验器单元测试。

### Risks and rollback

- **Risk**：校验过严误阻断。
- **Rollback**：回退入口与后置校验分支，保留 packet 能力。

## Phase 2 — 分类与状态机

### Goal

在 P1 骨架上实现分类互斥优先级与判定依据校验、needs_human 暂停态收紧与 attempt 两层分离（含 gap 规范化与 canonical payload 的校验补足）。

### Files

- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/plan-template.md`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P2 段）、`tests/contract/material-oracle-context-packet.test.mjs`（P2 段）

### Tasks

P2 任务：T005、T006、T007、T008（详见 tasks.md Phase 2）

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T005|needs_human|T007|material" && ./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "T007|material"` — 需覆盖 needs_human 无 next_action 禁止完成、attempt unavailable 不入白名单、gap_id 四字段哈希与 reason 去重排序；Phase 2 另留独立 wh-review 事实。

### Knowledge

交给 P3：状态机已收紧；材料四段与 oracle 结构可测。

### STOP

需新增持久状态机或把 unavailable 改写为 pass 时停止。

### Done

分类与暂停态可独立验收，缺口投影与消缺 payload 规则闭合。

### Risks and rollback

- **Risk**：路由与不阻断张力（RISK-007）。
- **Rollback**：回退白名单与两层分离，保持完成条件检查语义。

## Phase 3 — 预算与观测

### Goal

实现 review 预算计数器（按冻结 revision）、窄域 diff 核销与 provider usage+字符级代理指标两层观测落盘；完成 Execution model、材料导航与冻结 packet 分层的阶段输入侧改造。

### Files

- **MODIFY**：`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/material-workspace.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P3 段）、`tests/contract/material-oracle-context-packet.test.mjs`（P3 段）

### Tasks

P3 任务：T009、T010、T011、T012（详见 tasks.md Phase 3）

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T009|budget|T011|usage|context"` — 需覆盖同冻结 revision 重复初始被拒、无变化禁重审、增量续签新配额、窄域核销、provider 空桩不算 pass、usage 缺失标 unavailable；Phase 3 另留独立 wh-review 事实。

### Knowledge

交给 P4：预算与观测事实可回答成本去向；上下文守恒六条已生效。

### STOP

需新增 token 计费/预算机制时停止。

### Done

预算与观测可独立验收；阶段汇报不承诺下降。

### Risks and rollback

- **Risk**：usage 依赖 provider 返回（RISK-010）。
- **Rollback**：保留 unavailable 标注与代理指标，回退计数器分支。

## Phase 4 — 跨阶段协议与回归

### Goal

以统一回退协议贯通五阶段（各 SKILL 不再各写一套条文），完成全链条端到端回归与遗留 FR/AC 的回归覆盖；dogfood 按五要素观察合同记录。

### Files

- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`evidence/diagnostic-report.md`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P4 段）、`tests/contract/material-oracle-context-packet.test.mjs`（P4 段）

### Tasks

P4 任务：T013、T014、T015、T016（收口）及全链回归（详见 tasks.md Phase 4）

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T013|protocol|bound|T015|diag|flow|pref|gov|report"` — 需覆盖五类路由（实现级/规格歧义/方向级/材料 gap/环境不可用）正确分派、回退不演变为整阶段重跑、失败仍可同任务修复；Phase 4 留独立 verify/wh-review 三态事实与诊断报告。

### Knowledge

交付给 verify-code：全量校验器与协议已可复用；回归证据随任务归档。

### STOP

需新增阶段/公共入口/门时停止。

### Done

统一协议可独立验收；全量回归不新增控制面。

### Risks and rollback

- **Risk**：协议回退演变为重跑。
- **Rollback**：回退统一引用至各 SKILL 保留原条文副本作兼容，不新增 persistent 行为。

## Phase 5：verify-code 自动收口与 close 边界回归

### 目标

移除 verify-code 对重复人工确认的依赖，同时保持 review 真实性、失败闭合和 close 授权边界。

### 实施任务

1. 更新 verify-code completion predicate、acceptance policy、stage runner、Stage Agent adapter、task kernel 及 CLI projection。
2. 将 `approve-verification` 统一改为 `finalize-code-review`，同步 workflow manifest、SKILL、标准流程、契约测试和集成夹具；历史材料只读保留。
3. 删除 product release 对 `verify_confirmation` 的硬依赖；验证当前 review 缺失、不可用、过期、错绑和未修复 serious finding 仍不通过。
4. 验证 close preparation 不把 verify confirmation 当作 close authorization；close-plan confirmation、irreversible authorization 和 accepted-risk 约束保持不变。

### Gate command

使用主仓库 vitest binary、认证 worktree root 和受影响测试文件运行 focused contract/integration/e2e 回归；另执行 `node --check`、`git diff --check`、旧 step 名称反向扫描。禁止无范围全量回归。

### Oracle

验收必须同时看到：无 confirmation 的 verify completion；无 `verify_confirmation_missing` 的 release projection；review unavailable/错绑/旧 revision/严重 finding 的 incomplete 或 fail-closed；close authorization 仍独立生效。任一缺失保持 incomplete，不得宣布全链 release。
