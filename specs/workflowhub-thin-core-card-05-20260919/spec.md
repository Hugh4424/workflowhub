# CARD-05 审查链替换与审查层修复

- 状态：待 build-plan 用户确认的草稿；当前 decision-log 修订已获材料绑定确认。正式 post build-plan 已读取 spec、Phase 与 index 并发布结构事实，FR/AC 语义覆盖仍缺。
- 来源：本任务 decision-log.md 的 U-001#5、T-016/T-017、D-001–D-044、P1–P22；母 PRD 的 CARD-05、FR-22–FR-26、FR-53–FR-58、AC-22–AC-26、AC-54–AC-58。D-043 撤销比较选型，D-044 将正常流程的 OCR 验收从三面收为两面；旧对照与 integration 审查要求仅作历史来源，显式 CLI/API 兼容仍保留。
- 任务身份：workflowhub-thin-core-card-05-20260919；用户本轮将 activation_cohort 直接改为 post。

## 材料导航

| 节 | 摘要 | 建议读取 |
| --- | --- | --- |
| 速读、范围、场景 | 目标、两代码面、七保留面与诚实状态 | M/S |
| FR 与 Appendix A | 产品行为和唯一验收判据 | S/B/P |
| 实现设计 | 接口、写面、依赖、两面实跑 | B/P |
| 风险与开放项 | 正式 post 阶段的剩余质量缺口 | M/S/B/P |

## 速读卡

审查每路独立派发，成功路的发现并集入账；OCR 委托须在 build-code 每 Phase 与 verify-code 一次终末代码审查两个面经正常路由真实执行并分别验证能力。正常 build-code 流程不再自动派发 integration review，也不将其作为完成要求；显式 CLI/API 请求及历史 reader 兼容保留。跨 Phase 集成测试、最终聚合与逐 AC 验收仍执行并分别记事实。七个其余审查面沿既有 provider 链路修复共同的审查层问题。工具不可用时恰好尝试一次由未参与实现者完成的独立替代审查；替代也不可用则记 unverified 并披露，不伪造通过。六要素适配合同继续适用；不再做双臂比较或阈值选型。完整验收只在 Appendix A。

D-044 当前 active 验收仍为 AC-REVIEW-001/002/003/004/006/007/009/011/013。AC-REVIEW-005/008/010/012 作为原计划义务保留正文与已知结果，标记 deferred；其未闭合事实不计入本轮两面 OCR 能力的完成判定，也不改写为通过。当前两面的诚实失败和 Phase→终末审查顺序检查归 AC-003/009。

## 来源与决策映射

| source | decision | FR / AC | 状态 |
| --- | --- | --- | --- |
| U-001#5、CARD-05、FR-22–FR-26；本轮目标修订 | D-001–D-016、D-022、D-026、D-031、D-043/D-044 | FR-REVIEW-001–004、AC-REVIEW-001–004 | D-044 为现行两面能力范围；旧比较与 integration 必审要求仅历史，显式 API/reader 兼容保留 |
| T-016/T-017 | D-017/D-018/D-021/D-024/D-027/D-028 | FR-REVIEW-005–007、AC-REVIEW-005–007 | AC-005 全量历史闭环 deferred；006/007 当前有效 |
| FR-53/AC-54、FR-54/AC-55；本轮目标修订 | D-019/D-020/D-032–D-035/D-041/D-043/D-044 | FR-REVIEW-004, FR-REVIEW-008–009、AC-REVIEW-004, AC-REVIEW-008–009 | 六要素内容支持两面；AC-008 旧冻结时序 deferred；FR-54/AC-55 比较阈值历史化 |
| FR-56/AC-57、SD-07 | D-023/D-030 | FR-REVIEW-010、AC-REVIEW-010 | deferred；card-02 归档核验另由归档 owner 承接 |
| SD-08、FR-25/AC-25 | D-028/D-035 | FR-REVIEW-011、AC-REVIEW-011 | current；旧 wh-review/broker 仅历史 |
| SD-07、FR-23/AC-23/AC-26 | D-006/D-018/D-023/D-044 | FR-REVIEW-012、AC-REVIEW-012 | 旧全局节奏 deferred；当前 Phase→verify-code 顺序归 AC-003/009 |
| FR-57/AC-58、SD-07 | D-013/D-017 | FR-REVIEW-013、AC-REVIEW-013 | current；派发无材料身份闸门 |
| 本轮用户 post 指令 | 本文件的任务拓扑修订 | OPEN-001 | formal runtime unavailable |

## 1. 需求解释与范围

现有整组配置校验、quorum 聚合和等待/取消边界会造成零派发、丢失已完成 finding、长时间重复审查。现有封闭 bundle 还限制了对真实代码交互的检查。目标是可读仓库的独立审查、可追溯 finding、可判定成本与质量，并把失败事实保留在质量账本。

范围内：build-code/phase、verify-code 两个真实 diff 审查面及其正常 OCR 委托路由；跨 Phase 集成测试、最终聚合和验收继续执行；其余七面共用的审查层派发、聚合、健康轮询、明确取消、自检、成本与诚实事实；3rd-review 跨仓的相关 broker 边界；P1–P22。正常 build-code 流程不再自动派发或要求完成 build-code/integration 审查；既有原件只读保留，显式 CLI/API 请求及历史 reader 兼容保留。原回溯与前瞻对照实验只读保留，不再执行。七个保留面为 make-decision/direction、make-decision/detail、build-spec、build-plan、mini_task/design、mini_task/implementation、non_stage/build_prd。mini_task/implementation 虽为 diff 面，本卡不纳入 OCR 两面（decision-log 的 OI-026）。

## 2. 场景与状态覆盖

- SCN-001 正常：一个审查面配置多路，逐路派发，成功结果进入同一 finding 账本；可回读每路身份、终态和来源强度。
- SCN-002 部分成功：部分路发生真实终态失败或被明确取消，已成功路的 finding 仍入账；失败路保留 unavailable 和原因。
- SCN-003 零成功：没有成功路时，质量事实为 unverified/unavailable；不得记 clean 或已多源核实。
- SCN-004 需求保真：两个代码面的新 OCR packet 都有全文 AC；verify-code 的新合同按 D-041 允许 AC，缺 AC 则明确记录无法审需求保真。
- SCN-005 两面能力：分别从 build-code 每 Phase 与 verify-code 一次终末审查的正常路由执行 OCR 委托；每面独立读回真实输入、执行者、终态、覆盖/finding 和官方质量事实。未验证面保持 incomplete/unavailable，同任务修复。
- SCN-006 身份或路径失败：源漂移、无效 finding 锚点、含宿主绝对路径的错误、空 provider attempt 均有可判定失败事实，不伪造成功。
- SCN-007 工具不可用：恰好一次由未参与实现者完成的独立替代审查；替代也不可用则记 unverified 并披露来源缺口。
- SCN-008 当前节奏：每 Phase 一次 OCR 审查；跨 Phase 集成测试、最终聚合与逐 AC 验收保留；verify-code 对最终实现做一次单独终末 OCR 代码审查，终末审查与功能验收分开记账。旧 build-plan 与 integration 审查轮次只作历史事实。
- SCN-009 派发材料：只用纯文本路径引用，不以材料身份、哈希、sha、快照或回执读回作为审查派发许可；正式写入仍保持身份认证。

状态覆盖：默认态 SCN-001；空态 SCN-003；错误态 SCN-006；加载态为各路派发中的当前事实；取消态 SCN-002；边界态 SCN-004/005；权限态为只读仓库访问失败并归 SCN-006；竞态为多路终态先后到达，归 SCN-002。无 UI 状态。

## 3. 产品事实与假设

- PFACT-001 status: verified。来源：decision-log RF-09、RF-16、RF-19、RF-20 和现有 runtime/review 路径；影响 FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-005、AC-REVIEW-001, AC-REVIEW-002, AC-REVIEW-005。旧审查链存在不同型的零派发、丢 finding 与历史绑定问题。
- PFACT-002 status: verified（历史合同事实）。来源：decision-log D-023 和 runtime/review/stage-materials.json；影响旧 FR-REVIEW-003/004、AC-REVIEW-003/004 的三面设计。integration 旧合同不交 diff；D-023 曾决定改为真实 diff 审查，D-044 已取消该面在正常 build-code 流程中的自动派发和完成要求，旧事实不充作当前验收。
- PFACT-003 status: verified。来源：当前 `runtime/task/material-workspace.mjs`、`runtime/stage/stage-handlers.mjs` 与本任务正式 build-plan 质量事实；影响 OPEN-001。post spec/Phase/index 已被正式读取并发布结构事实；原始需求来源与独立语义覆盖未认证，FR/AC 完成事实保持 missing。
- PFACT-004 status: partial（执行已发生，能力验收未闭合）。owner：build-code/verify-code 实跑；影响 FR-REVIEW-003/009、AC-REVIEW-003/009、OPEN-002。P5 build-code/phase OCR attempt `3fece791-ee35-5b57-a634-f226bc3c2a6e` 和对应 canonical result 可读，只证明该次 Phase 审查真实发生，不证明 finding 处置、官方读回或 AC 通过。verify-code 终末审查尚未执行，两面尚未全部读回/验收。P2/T004 旧路、P3/T006 `candidate_experiment=true`（Kimi 完成、Codex 因账户不支持 `gpt-6-luna` 失败）及 decision-log RF-20 都是历史原件，不能代替当前两面验收。D-043 撤销同型比较目标，D-044 移除正常流程中重复的 integration 自动审查与完成要求；显式 CLI/API 兼容保留。

## 4. 功能需求

每条 FR 的范围、场景和验收如下；Appendix A 是判定正文。

| FR | 行为与边界 | 依据 | 场景 | AC |
| --- | --- | --- | --- | --- |
| FR-REVIEW-001 | 按 initial[] 各路独立派发；mode 仅校验，任一路成功满足派发成功判据 | D-005/D-007/D-008/D-028/D-029，P1/P2 | SCN-001/002 | AC-REVIEW-001 |
| FR-REVIEW-002 | 等所有已派发路终态后并集入账；同 file:line 和 claim 去重，标 corroborated 或 single_source；不得丢成功路 finding | D-035，P3/P15 | SCN-001/002 | AC-REVIEW-002 |
| FR-REVIEW-003 | 两个指定代码面经正常生产路由使用 OCR 委托；OCR 只筛文件/解析规则，独立子代理用自身 LLM 审查可读仓库；每 Phase 审查与 verify-code 一次终末代码审查各有独立 scope 和诚实失败事实，跨 Phase 集成测试及验收照常执行 | D-002/D-004/D-006/D-010/D-023/D-043/D-044 | SCN-001/004/005/008 | AC-REVIEW-003 |
| FR-REVIEW-004 | 两代码面 packet 保留 AC 全文和可识别 diff；verify-code 新合同允许 AC；执行提示词禁 Agent/子代理及等待/轮询工具 | D-032–D-034/D-041/D-044 | SCN-004/006 | AC-REVIEW-004 |
| FR-REVIEW-005 | 统一十面审查层处理派发前故障、源漂移、无效锚点、无 provider attempt、错误脱敏，不伪造 clean | D-017/D-018/D-021/D-037/D-040，P1–P22 | SCN-002/003/006 | AC-REVIEW-005 |
| FR-REVIEW-006 | 依健康状态持续等待、仅明确取消或确认失联时清理、不中断已完成结果；不可用不阻断同任务修复，保留真实原因 | D-003/D-013/D-024，P4–P7/P12/P14 | SCN-002/003 | AC-REVIEW-006 |
| FR-REVIEW-007 | 质量账本保留 provider 身份、usage/时间、覆盖声明、上下文截断和来源强度；单源不写成多源 | D-012/D-019/D-020/D-027/D-028/D-035，P8/P9 | SCN-001/002/003 | AC-REVIEW-007 |
| FR-REVIEW-008 | 接入前冻结输入、finding schema、等待/健康语义、unavailable 集合、provider 身份、事实写入六要素 | D-019/D-020/D-032–D-035 | SCN-004/005 | AC-REVIEW-008 |
| FR-REVIEW-009 | P5 对每 Phase 与 verify-code 一次终末审查两面分别以真实当前 diff 执行正常 OCR 委托，按各面输入、执行、结果、canonical 发布与官方消费核对能力；失败、零派发或不可用不得写 clean/通过，verify-code 功能验收另记。跨 Phase 集成测试、最终聚合及逐 AC 验收继续；旧同型阈值与 go/no-go 不再适用 | D-043/D-044；D-011/D-042 仅历史 | SCN-005/008 | AC-REVIEW-009 |
| FR-REVIEW-010 | 只读核验 card-02 已做的 build-plan 合并审查交付物、命令、exit、时机与双质量核心；缺失的命令/exit 如实记 partial/missing，不重跑该审查 | D-030，FR-56/AC-57 | SCN-005 | AC-REVIEW-010 |
| FR-REVIEW-011 | 工具 unavailable 时只调用一次独立替代审查，执行者未参与实现并记录来源与缺口；替代也不可用则记 unverified 并披露，旧 wh-review/broker 仅作历史对照 | SD-08，FR-25/AC-25，D-028/D-035 | SCN-007 | AC-REVIEW-011 |
| FR-REVIEW-012 (deferred，历史原计划) | 原 SD-07 完整可计数节奏曾要求 build-plan 合并审查一次、每 Phase 一次、最后一个 Phase 后 integration 一次、verify-code 独立终末代码审查一次；功能验收另记，不因修 finding 复审。D-044 已取消正常 build-code 流程中 integration 自动审查及完成要求；本行只供历史核对，不否定显式 CLI/API 兼容 | SD-07，FR-23/AC-23/AC-26，D-018/D-023/D-044 | 历史 SCN-008 | AC-REVIEW-012 |
| FR-REVIEW-013 | 审查派发不以材料身份、哈希、sha、快照或回执读回校验通过为前置；输入用纯文本路径引用，无内容哈希绑定；正式发布的来源身份仍如实记录 | FR-57/AC-58，SD-07，D-013 | SCN-009 | AC-REVIEW-013 |

### Machine trace IDs

- **FR-REVIEW-001**：见上方功能需求表；对应验收为 `AC-REVIEW-001`。
- **FR-REVIEW-002**：见上方功能需求表；对应验收为 `AC-REVIEW-002`。
- **FR-REVIEW-003**：见上方功能需求表；对应验收为 `AC-REVIEW-003`。
- **FR-REVIEW-004**：见上方功能需求表；对应验收为 `AC-REVIEW-004`。
- **FR-REVIEW-005**：见上方功能需求表；对应验收为 `AC-REVIEW-005`。
- **FR-REVIEW-006**：见上方功能需求表；对应验收为 `AC-REVIEW-006`。
- **FR-REVIEW-007**：见上方功能需求表；对应验收为 `AC-REVIEW-007`。
- **FR-REVIEW-008**：见上方功能需求表；对应验收为 `AC-REVIEW-008`。
- **FR-REVIEW-009**：见上方功能需求表；对应验收为 `AC-REVIEW-009`。
- **FR-REVIEW-010**：见上方功能需求表；对应验收为 `AC-REVIEW-010`。
- **FR-REVIEW-011**：见上方功能需求表；对应验收为 `AC-REVIEW-011`。
- **FR-REVIEW-012**：见上方功能需求表；对应验收为 `AC-REVIEW-012`。
- **FR-REVIEW-013**：见上方功能需求表；对应验收为 `AC-REVIEW-013`。

## 5. 模块、实体与生命周期

审查路由负责独立派发与终态；packet 适配负责确定性文件与规则；独立子代理负责推理；canonical review result 负责 finding 合并；quality/reviews 负责不可变原件；正式 stage 只消费质量事实。finding 至少含 path、content、start_line、end_line、category、severity、suggestion_code、证据锚点、来源集合与来源强度。审查尝试区分派发前失败、已派发未完成、部分成功、完成；原件 append-only，旧记录只读。缺失 usage 不补零，缺 AC 不补摘要。

## 6. 兼容性、非目标与默认约束

旧 wh-review 记录只读保留，不作可执行 fallback；七个非替换面继续既有 provider 路径，接受单源通过的已批准语义降级并必须标强度。wh-review 物理删除及身份/哈希/快照/回执机制移除归 CARD-06；但本卡审查派发不能把这些校验当准入前置。并发上限数值归 CARD-09；card-02 验收脚本副产物不纳入本卡。不得新增固定复审轮次、重新引入 307,200B 本地硬闸门、双写事实或新推进许可证。config.json 既有键只读，mode 不改变派发次数。所有失败与未知保留来源，不转成通过。

## 验收流程、测试标准与架构边界

从 source → FR → Appendix A 的 AC → Phase/Task → 同义正反 oracle → 当前质量原件回读。行为变更尽量在 build-plan 写真实测试并见目标 RED，build-code 用同一 gate_cmd 见 GREEN；外部 provider 效果和真实时间成本用隔离实跑记录，不伪造 RED。旧来源与新 OCR 接口只共享现有审查质量事实消费面；adapter 不裁决产品方向，review 不授权继续工作。

## 实现设计（全局权威）

### Code Anchors

- 现状：`runtime/review/review-record-route.mjs` 派发与记录，`runtime/review/canonical-review-result.mjs` 聚合，`review-policy.mjs` 策略；`runtime/review/stage-materials.json` 定十面输入；`skills/wh-review/scripts/review-provider-client.mjs` 与 `simple-review-runner.mjs` 接旧 provider；`runtime/stage/stage-handlers.mjs` 消费 review；`3rd-review/lib/broker.mjs` 与 `lib/runtime.mjs` 管 broker 取消/孤儿。
- 合并后的 post 合同：CARD-07 已在当前分支 `main@35a881ac` 落地；`runtime/task/material-workspace.mjs#phaseFilesFromIndex` 读取 `phases/index.md` 的连续 authority refs，`runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract` 校验每个独立 Phase 的 L0/L1/L2、Task 卡、写集、依赖、gate/oracle、STOP、Done 和 evidence_path，`runtime/stage/stage-handlers.mjs` 以这些结构事实消费 post build-plan。CARD-05 只适配该现有 consumer，不复制 plan/tasks 或新增 store/gate。
- 合并后的 analyzer 边界：post build-plan 的 `spec-analyze` 只报告当前 decision-log、spec、Phase 与 index 的结构/引用事实；不读取或要求 caller-owned `original_requirements`、`coverage` 或单独 raw-requirement inventory。需求语义、量词、否定、行为保真和 finding disposition 继续由既有独立合并审查及用户确认负责。
- 方案：复用现有 review 入口与 quality/reviews 位置，在既有 producer/consumer 之间窄扩展 OCR 委托适配及并集语义；不建第二套 review store。P1–P4 已有设计、实现与原件按原状保留；P3 的隔离候选是历史过渡。P5 将该适配接入 build-code/phase 与 verify-code 两面正常路由，并验证官方事实与两面真实能力；正常 build-code 流程不再自动派发 integration 审查或要求其完成，显式 CLI/API 兼容保留，集成测试和验收继续，不执行新对照。工具 unavailable 时按 SD-08 处理，旧 wh-review/broker 不成为可执行 fallback。
- 运行条件：Node >=24、git worktree、现有 config.json；OCR CLI 和独立子代理能力须在接入前 doctor。外部不可用记 unavailable，不推断通过。

### Interfaces and Failure Semantics

- producer → consumer：config 路由 → 独立派发 → OCR 确定性 packet → 宿主独立子代理 findings → WorkflowHub schema/锚点校验 → 并集合并 → quality/reviews 原件 → stage/facts/status/verify。
- 失败：身份漂移不应留下伪执行 attempt；无效锚点不可标 true；blocked_before_dispatch 的零 provider attempt 可以被正式 run 诚实消费；宿主路径在持久化前脱敏。按 ADR-0032，两个代码面的 direct OCR executor 不设 provider 墙钟终止截止，以直接子进程的启动、输出、存活采样、退出和取消结果观察健康/进度并等待真实终态；内部采样默认间隔 5 秒、可配置，不等于 broker managed-status 轮询。暂时无输出不自动取消，明确取消须清理进程及 packet，未确认退出不得记 clean。采样结果的官方持续读回与 owner 失联清理尚待实现或验证，覆盖保持 unknown。七个保留面/P4 沿用 broker managed-status 契约；已成功路结果始终保留。
- 边界：FR-REVIEW-013 只取消审查派发前的材料身份/hash/快照/readback 闸门；正式 stage 写入时的 task/worktree/runtime 认证仍按宪法 F3/F6 fail-loud。源漂移和无效锚点须记真实质量失败，不得借此伪造 review 成功，也不得变成普通审查派发许可证。
- 现有接入面：OCR adapter 的 owner 为 runtime/review，现行 consumer 为 build-code/phase 与 verify-code；质量来源强度字段的 owner 为 canonical review result，consumer 为 stage/质量回读；删除条件分别是被审核替代实现取代。不得新增并行事实账本。
- P3 的 `candidate_experiment: true` 是历史隔离验证标志；P5 收束其选择逻辑，使两面普通生产 request 经 OCR 委托执行。该标志不再是现行生命周期、公共命令或完成门槛；历史实验与 integration 审查原件只读保留。

### 全局文件边界与依赖

母 PRD 的 CARD-01 是本卡 task 级准备/实现依赖，不属于 P1–P5 的内部 Phase DAG。当前只读 close 原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-01-20260919/operations/close/completed.json` 记 `status=completed`，archive/local/remote OID 指向同一已交付版本（前缀 `b39f34b`）；实施前须读回完整 OID 与交付/质量边界。close 证明物理交付，不代偿 CARD-01 未通过或不可用的质量事实，也不把该原件设为审查派发许可证。

| Phase | 独占主要写面 | 依赖 |
| --- | --- | --- |
| P1 | 适配合同与实验设计：本 spec、docs/adr/0032-review-chain-delegation-and-layer-contract.md | none |
| P2 | runtime/review/review-record-route.mjs、canonical-review-result.mjs；review-policy.mjs 只读 | P1 |
| P3 | runtime/review/stage-materials.json、runtime/review/schemas/stage-materials.schema.json、runtime/review/ocr-delegation-adapter.mjs；两个 workflow SKILL.md 的候选接入编辑仅属历史 P3 范围，现行生产路由写权归 P5 | P2 |
| P4 | 3rd-review broker/runtime 与定向测试；WorkflowHub 既有 managed-status runner 与定向测试（client 只读复用） | P2 |
| P5 | runtime/stage/stage-handlers.mjs、stage-runner.mjs、completion-predicates.mjs、tools/cli/task-bootstrap.mjs、tools/cli/stage-runtime.mjs、workflows/build-code/SKILL.md、workflows/verify-code/SKILL.md（两代码面现行生产路由、移除 integration 自动审查及完成要求；显式 CLI/API 兼容保留；不与 P3 重复写权） | P3/P4 |

其余 NEW/MODIFY 精确文件与 test owner 在各 Phase 中确认。P3 新文件路径明确为 `runtime/review/ocr-delegation-adapter.mjs`，owner=P3；当时三个代码面的隔离候选是历史用途，P5 决定后的生产 consumer 仅为 build-code/phase 与 verify-code，测试=ORACLE-P3-CANDIDATE 及 P5 cutover；被经审查的替代实现取代后删除，不另建第二套 store。该路径是明确的计划写面，首次编辑仍须验证 consumer seam；OPEN-003 的剩余项只涉及第二仓 worktree/WIP 对齐。DO NOT TOUCH：specs/archive/**、母 PRD/规划材料、card-02/card-07 材料、既有 review 原件、config.json；CARD-06 删除面和 CARD-09 并发数值。回滚只回退本卡代码写面，保留已发布质量原件并以新事实说明，不覆盖历史。

### Requirement-to-Task Trace

| source/decision | 原义强度 | FR/AC | Phase/Task | 正反 oracle | 状态 |
| --- | --- | --- | --- | --- | --- |
| CARD-05 / U-001#5、D-019、D-031、D-042 | 原合同与同型实验设计；比较义务由 D-043 覆盖 | FR-REVIEW-004, FR-REVIEW-008, FR-REVIEW-009, FR-REVIEW-010; AC-REVIEW-004, AC-REVIEW-008, AC-REVIEW-009, AC-REVIEW-010 | P1/T001 | ORACLE-P1-STRUCTURE | 历史设计，不重启 P1 |
| CARD-05 / D-005、D-017、D-028 | 逐路派发与失败事实 | FR-REVIEW-001, FR-REVIEW-005, FR-REVIEW-013; AC-REVIEW-001, AC-REVIEW-005, AC-REVIEW-013 | P2/T002 | ORACLE-P2-PLAIN-PATH | 既有 Phase，按原件核验；不重启 |
| CARD-05 / D-019、D-035 | 并集、去重与来源强度 | FR-REVIEW-002, FR-REVIEW-007; AC-REVIEW-002, AC-REVIEW-007 | P2/T003 | ORACLE-P2-UNION | 既有 Phase，按原件核验；不重启 |
| CARD-05 / D-031、D-035、D-042 | 共同事实、消费者与旧路基线；基线不再是现行义务 | FR-REVIEW-005, FR-REVIEW-007, FR-REVIEW-009; AC-REVIEW-005, AC-REVIEW-007, AC-REVIEW-009 | P2/T004 | ORACLE-P2-BASELINE | 历史对照；不补跑 |
| CARD-05 / D-019、D-032、D-041 | 全文 AC 与可识别 diff packet | FR-REVIEW-004, FR-REVIEW-008; AC-REVIEW-004, AC-REVIEW-008 | P3/T005 | ORACLE-P3-PACKET | 既有 Phase，按原件核验；不重启 |
| CARD-05 / U-001#5、D-006、D-023、SD-07、SD-08 | 三面隔离候选与独立执行者，候选生命周期已废止 | FR-REVIEW-003, FR-REVIEW-011, FR-REVIEW-012, FR-REVIEW-013; AC-REVIEW-003, AC-REVIEW-011, AC-REVIEW-012, AC-REVIEW-013 | P3/T006 | ORACLE-P3-CANDIDATE | 历史过渡；不重启 |
| CARD-05 / D-017、D-024、D-027 | 宿主等待、成本与 unavailable | FR-REVIEW-006, FR-REVIEW-007; AC-REVIEW-006, AC-REVIEW-007 | P4/T007 | ORACLE-P4-HOST | 既有 Phase，按原件核验；不重启 |
| CARD-05 / D-024、D-025 | 跨仓 broker 取消与孤儿回收 | FR-REVIEW-005, FR-REVIEW-006; AC-REVIEW-005, AC-REVIEW-006 | P4/T008 | ORACLE-P4-BROKER | 既有 Phase，按原件核验；不重启 |
| CARD-05 / D-037、D-040 | 官方 consumer 接受 unavailable | FR-REVIEW-005, FR-REVIEW-007; AC-REVIEW-005, AC-REVIEW-007 | P5/T009 | ORACLE-P5-UNAVAILABLE | planned |
| CARD-05 / D-037、P20/P21 | source coverage 与未知参数拒绝 | FR-REVIEW-005; AC-REVIEW-005 | P5/T010 | ORACLE-P5-INPUTS | planned |
| CARD-05 / D-043/D-044、SD-07、SD-08 | 两面 OCR 真实能力、节奏与诚实事实；旧对照和 integration 必审要求仅历史，集成测试/验收及显式 CLI/API 兼容继续 | FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003, FR-REVIEW-004, FR-REVIEW-006, FR-REVIEW-007, FR-REVIEW-009, FR-REVIEW-011, FR-REVIEW-013; AC-REVIEW-001, AC-REVIEW-002, AC-REVIEW-003, AC-REVIEW-004, AC-REVIEW-006, AC-REVIEW-007, AC-REVIEW-009, AC-REVIEW-011, AC-REVIEW-013 | P5/T011 | ORACLE-P5-CAPABILITY | P5 Phase 已有真实 attempt；两面尚未全部读回/验收，四项 deferred 不作当前完成条件 |

### Global Verification Strategy

每个 Phase 的 gate_cmd 只跑受影响文件；全局结构门为 `npx vitest run tests/contract/post-phase-contract.test.mjs`。目标 RED 必须是命名断言失败；环境、收集、配置失败记 unavailable。GREEN 复用相同命令和 oracle。单元测试只证明接线与失败边界；OCR 的真实能力须在两面分别通过当前 diff、独立执行者、canonical 原件与官方消费者读回验证。跨 Phase 集成测试、最终聚合与验收继续，逐 AC 读回 producer、schema、writer、facts/status 消费链；不把文档出现或定向测试通过当成两面实跑完成。旧 RF-16、RF-20、P3 候选与 T011 no-go 不作为当前阈值或接入许可证。

## Appendix A — 验收判据（唯一权威）

本轮 active 集合：AC-REVIEW-001/002/003/004/006/007/009/011/013。以下四项带 `deferred` 标签，仅保留原计划文字、已有结果与缺口；deferred 不等于 passed，也不作为本轮 retained limits 的完成前置。

- [ ] **AC-REVIEW-001**：FR-REVIEW-001 多路独立派发。
验证：以一条已配置路、一条未配置路运行定向路由测试。
通过：已配置路发起且终态可读；mode 不改变派发次数。
失败：未配置路使整组零派发，或 mode 额外触发运行。
证据：定向测试输出与 canonical attempt。

- [ ] **AC-REVIEW-002**：FR-REVIEW-002 并集与来源强度。
验证：两路分别报相同与独有 finding，另一路失败，回读结果。
通过：所有成功路 finding 入账；同 file:line 和 claim 合并，强度正确。
失败：独有 finding 丢失，或 single_source 写成 corroborated。
证据：定向聚合测试与 result 原件。

- [ ] **AC-REVIEW-003**：FR-REVIEW-003 两代码面真实 OCR 委托。
验证：build-code 每 Phase 和 verify-code 一次终末审查各经正常 OCR 委托路由，以当前真实 diff、独立执行者与可读仓库跑审查，核对派发身份和官方读回；跨 Phase 集成测试及验收照常记录。
通过：每 Phase 审查与最后一个 Phase 后的 verify-code 终末代码审查依各自 scope 顺序有真实 diff、适用全文 AC、独立审查 attempt/终态，以及 canonical review 与 stage/facts/status 可回读；OCR 不代替 LLM 生成 finding，verify-code 功能验收独立记账。
失败：任一当前面仍走候选标志或旧路、终末代码审查缺失或早于最后 Phase、终末审查与功能验收混记、共用实现者上下文、OCR 输出冒充 LLM finding，或零派发/失败/unavailable 被写成 clean 或已审；正常 build-code 流程仍自动派发重复 integration 审查或要求其完成。显式 CLI integration 请求不属本负例。
证据：逐面 packet、attempt/result、命令与退出码、官方质量事实。

- [ ] **AC-REVIEW-004**：FR-REVIEW-004 需求与 diff 可见性。
验证：检查 packet 的全文 AC、diff 纳入情况及派发前提示词校验。
通过：build-code/phase 与 verify-code 两面均有全文 AC 且 diff 未因扩展名被排除；verify-code 新 OCR 合同允许 AC；禁止子代理/轮询两条约束齐备。
失败：verify-code 缺全文 AC 却声称已审需求保真、diff 被 unsupported_ext 排除、或缺约束仍派发。
证据：packet manifest、OCR 文件清单、定向负例测试。

- [ ] **AC-REVIEW-005 (deferred)**：FR-REVIEW-005 P1–P22 的诚实错误语义。
状态：deferred；owner：原 P1–P22 全量闭环/审查层债务 owner；原因：跨十面和历史 Phase 的完整闭环超出 D-044 两面 OCR 当前能力验收。现有文字、测试与缺口仍属历史事实；当前两面的错误语义归 AC-003/009，未证明部分不得写 passed。
验证：逐项运行审查层负例并回读正式消费方。
通过：每项有真实状态与来源；P15 无假绿、P16 无漂移落盘、P17 可返回 unavailable、P18 脱敏、P19–P22 正式消费链可达。
失败：任一项假绿、静默失败、路径泄漏、或官方 run 不能消费自身 unavailable 原件。
证据：P1–P22 对照表、定向测试、官方 run/facts/status 原件。

- [ ] **AC-REVIEW-006**：FR-REVIEW-006 健康轮询、明确取消与不阻断。
验证：让一路持续存活并推进超过旧 10/20 分钟界限、一路先完成；读回存活状态与最近进度，再覆盖明确取消和 owner 失联。
通过：活跃路不会因经过时间或暂时无输出被杀；状态轮询持续到真实终态；成功路 finding 可读；明确取消/失联有真实清理事实；同任务可继续修复。
失败：仍有活进程被墙钟终止、无法读回健康/进度、丢弃成功路、孤儿被报告为 clean，或 unavailable 变推进闸门。
证据：两代码面的 direct executor 子进程终态、输出/进度与取消清理事实；七个保留面/P4 的 broker managed-status 原件；相应定向测试与质量事实。direct 路径持续健康/进度和 owner-loss 覆盖未知时，不借 broker 原件证明通过。

- [ ] **AC-REVIEW-007**：FR-REVIEW-007 质量账本。
验证：读取单源、多源、usage 缺失、上下文截断四种原件。
通过：身份、强度、覆盖和已知计量可追溯；缺失保持 unavailable。
失败：单源冒充多源、缺失计量补零或截断不记事实。
证据：review result、attempt、stage/status 读回。

- [ ] **AC-REVIEW-008 (deferred)**：FR-REVIEW-008 六要素先于接入冻结。
状态：deferred；owner：原 P1/T001 适配合同 owner；原因：旧方案按首个 OCR 派发时间追溯冻结先后，属于过往时序债务；当前两面仍须使用可核验的六要素合同，但不追认旧冻结时间。原判据与历史结果保留，未证明部分不得写 passed。
验证：历史判据原本核对合同六要素与冻结时间，再核对首个正常生产 OCR 派发时间；早期候选及旧 integration 派发仍按历史如实披露，不成为当前完成条件。
通过：六要素均有确定取值和 owner，合同先冻结，finding 锚点与建议可校验。
失败：缺等待/健康语义或 unavailable 枚举、缺建议/证据，或先接入后补合同。
证据：ADR/合同修订与首个正常生产派发原件；历史候选派发单独标注。

- [ ] **AC-REVIEW-009**：FR-REVIEW-009 两代码面真实能力（逐面判定）。
验证：分别从 build-code 每 Phase 与 verify-code 一次终末审查的正常入口发起对应审查，读取每面的当前 diff 范围、全文 AC、OCR 文件/规则清单、独立执行者与 provider 身份、attempt 终态、覆盖/finding、canonical result 和官方 stage/facts/status；另读跨 Phase 集成测试、最终聚合、逐 AC 与 verify-code 功能验收事实。使用真实无 finding 结果时，核对 completed_zero_findings 与零派发、未覆盖文件的区分。
通过：每 Phase 与 verify-code 终末两面各自具备真实输入、独立执行、诚实结果和官方可回读事实；有效 finding 有锚点、证据与建议，零 finding 有完成与覆盖声明；失败/排除/截断如实记录并由官方 consumer 可读；集成测试与验收仍有独立事实，verify-code 代码审查与功能验收独立。两面按当前顺序各自成立才算本项通过，不要求一定产出 finding。
失败：任一当前面靠候选标志、旧路或模拟 packet 冒充正常实跑，缺真实 diff/全文 AC/执行身份/终态/官方读回，终末审查早于最后 Phase 或与功能验收混记，正常 build-code 流程重复自动派发或要求完成 integration 审查，零派发冒充零 finding，或外部失败/unavailable 冒充 clean/通过；显式 CLI integration 请求不属本项失败。
证据：两面分别绑定当前 task/stage/scope 的 packet、attempt/result、命令/exit、quality/reviews 原件与 facts/status/verify 读回；缺一面记该面 incomplete/unavailable；集成测试和验收保留各自原件。

- [ ] **AC-REVIEW-010 (deferred)**：FR-REVIEW-010 核验合并审查交付物。
状态：deferred；owner：card-02 归档交付物 owner；原因：归档审查命令、exit 与双质量核心的追溯核验属于旧任务债务，超出 D-044 两面 OCR 能力。本条已有 partial/missing 原件保持原状，不推断通过。
验证：只读核对 card-02 归档的实际交付物、命令、exit、时机和双质量核心。
通过：逐项回读并分别判 pass/partial/missing；已找到的 attempt/result/output 不代偿缺失的完整发起命令和 CLI exit；不重跑审查。
失败：只采信自述，或把核验写成新一轮审查。
证据：归档路径、核验命令与结果记录。

- [ ] **AC-REVIEW-011**：FR-REVIEW-011 独立替代审查。
验证：使当前代码面审查工具 unavailable，再使独立替代执行者分别可用与不可用；核对执行者是否参与实现、调用次数和质量原件。
通过：可用时恰好一次未参与实现者完成审查且记录来源、缺口与结论；替代也不可用时记 unverified 并披露，不重派；旧 wh-review/broker 原件仅用于历史对照。
失败：零次或多次替代、实施者自审、旧路冒充可执行 fallback，或两路不可用却记已审。
证据：正常路由的调用记录、独立执行者身份、review attempt 与披露记录。

- [ ] **AC-REVIEW-012 (deferred)**：FR-REVIEW-012 完整审查节奏。
状态：deferred；owner：原 SD-07 全局节奏 owner；原因：build-plan、旧 Phase 与 integration 审查的全局轮次/历史时序追溯不属 D-044 当前两面验收；现行 Phase→verify-code 的 scope、顺序及功能验收分离归 AC-003/009。历史缺口保留，不写 passed。
验证：取至少两个 Phase 的实施 task，按时间和 scope 统计 build-plan、每 Phase、integration、verify-code 审查与 verify-code 功能验收原件。
通过：build-plan 合并审查恰好一次且含 spec 与所有 Phase；每个 Phase 恰好一次 phase-id 绑定审查；最后一个 Phase 后 integration 恰好一次；verify-code 恰好一次单独命名的终末代码审查，功能验收另有独立事实；修 finding 不追加同 scope 轮次。
失败：任一审查缺失或重复、integration 早于最后 Phase、终末审查与功能验收混记，或修复后重派同 scope。
证据：多 Phase 时序 fixture、各真实审查 attempt 的命令/exit/output 与独立功能验收记录；缺原件保持 incomplete。

- [ ] **AC-REVIEW-013**：FR-REVIEW-013 纯文本路径派发。
验证：在隔离 task 中用纯文本路径引用材料，分别移除材料身份、哈希、sha、快照与回执读回事实并尝试审查派发；再给出内容哈希绑定输入负例。
通过：可读路径仍能派发，前述质量/身份事实缺失不构成派发阻断；输入不要求内容哈希绑定；正式发布按既有身份合同认证。
失败：任一前置校验阻断派发，或审查输入必须绑定内容哈希才能派发。
证据：公共审查入口的定向正反例、原始纯文本路径参数与 canonical attempt。

## 12. 风险、未决与交接

- RISK-001：当前 task.json 从 pre 人工改为 post，缺少正式 cohort 迁移 provenance；post build-plan 的当前材料读取与结构事实已实跑，下游 build-code/verify-code/close 的实体 Phase 消费尚未验证；影响全部 FR/AC。关闭条件是同一任务的正式 post 材料发布、语义覆盖及下游读回通过。未关闭前不得宣称阶段完成。
- RISK-002：外部 provider/OCR 实际能力不可由静态测试推断；影响 FR-REVIEW-003, FR-REVIEW-009。处理 Stage：build-code/phase 与 verify-code 分面实跑；跨 Phase 集成测试和验收另行取证；失败保持 incomplete/unavailable。
- OPEN-001：post 正式材料 reader/handler 已可发布结构事实；原始需求来源与独立语义覆盖仍缺，正式完成事实保持 missing。owner：WorkflowHub runtime 与当前 build-plan 会话；影响全部 AC；关闭条件见 RISK-001，不能靠改 task.json 或补空 plan/tasks 绕过。
- OPEN-002：D-043 撤销 P5 对照，D-044 移除正常 build-code 流程的 integration 自动审查与完成要求，保留显式 CLI/API 兼容；OI-033/OI-035 的 unavailable 分类与并集时点沿用 ADR-0032，OI-034 的 AC 方向由 D-041 决定。owner：当前 build-code/verify-code 实跑；影响 AC-REVIEW-003/004/008/009。P5 Phase 已有真实 attempt，但两面任一缺官方读回或 verify-code 终末未执行时保持 incomplete/unavailable，不能用历史候选、旧 integration 原件或旧 no-go 代偿。
- OPEN-003：OCR adapter 路径、P3 owner、consumer、测试及删除条件已在全局边界与 P3 冻结。第二仓隔离 worktree `/Users/Hugh/Hugh/Project/3rd-review-card05-broker-red` 已建立，但其基线不含主 checkout 的 13 份既有 dirty WIP；P4 首写前须对齐这些字节、CARD-09 共享接口与集成 owner。未对齐时只停跨仓写入，不把旧主 checkout 当作可写工作区。

### decision-log 的 deferred OI 交接

以下是当前仍为 deferred 的源项目；它们是承接责任，不自动表示本阶段已闭合。每个 Phase 的 Task 消费这里指定的合同，实际关闭须有当前原件。

| 源 OI | owner / Phase Task | trigger → consumer | 关闭或保留条件 |
| --- | --- | --- | --- |
| OI-003 | build-code/P5-T011 | D-043/D-044 当前目标 → 两面正常 OCR 路由 | 逐面真实执行和官方读回；原选型阈值、旧 integration 审查及 no-go 只作历史 |
| OI-010 | P2-T002、P5-T009 | 派发失败/官方读回 → review facts | ROUTE_UNAVAILABLE、REVIEW_EXECUTION_FAILED 与零 provider attempts 分开且不二次硬失败 |
| OI-014 | P1-T001，CARD-06/CARD-09 集成 owner | 两卡写面启动 → 写集协调 | 同一文件只有一个 owner/时序，无双写；未获对应卡接口冻结则保留待协调 |
| OI-016 | P1-T001，CARD-07 接口 owner | CARD-07 时机/写面确定 → build-plan | 审查时机与写面接口成文，无双写；未知保持待协调 |
| OI-020 | P1-T001 | 与 card-02 归档重叠 → ① 核验 | 逐项核验提前交付物，不重做 ①，不漏本卡验收 |
| OI-022 | P3-T006 | 逐路派发实现 → 现行两代码面；旧三面候选只读 | 每个 initial[] 一独立执行者/身份，能并发且非整组严格派发 |
| OI-023 | P3-T006 | 可读仓库执行者启动 → 质量原件 | 身份、隔离、可读范围、事实位置与上下文成本成文并测试；无字节闸门 |
| OI-026 | P1-T001 | 合同冻结 → 十面路由 | 三 OCR 面/七保留面逐一归属；mini_task/implementation 保留面显式标 diff |
| OI-028 | P1-T001 | 工作包拆分 → 主会话/子代理 | 本阶段分工记录成文；主会话瘦身验证仍归 CARD-09 |
| OI-030 | 历史 P1-T001 | 原实验设计 → 历史原件 | D-043 后不再是当前完成义务；FN1–FN6 未知继续如实 unavailable |
| OI-032 | P1-T001、P5-T009 | 首次宣称审查路径可用 → stage/status | 完整材料正式可审，或稳定 unavailable 明文；失败码原样入库；① 真核验 |
| OI-033 | P1-T001、P3-T005 | 合同冻结 → OCR/旧 provider adapter | 十一种已取证信号归类或明文排除；未知码结构归类，缺依据不接入 |
| OI-035 | P1-T001、P2-T003 | 首次并集入账 → canonical result | 去重、来源强度与全部已派发路终态的入账时点按 ADR-0032 可判真假 |

## 13. 业务影响与回归范围

受影响：原十面审查拓扑中两代码面的现行 OCR 输入与执行者、七保留面的派发与质量回读，以及移除正常 build-code integration 自动审查/完成要求后的正式 stage unavailable 消费；显式 CLI/API 和历史 reader 兼容保留。回归：逐路派发 → managed health/status 轮询 → finding 原件 → stage/facts/status → verify；跨 Phase 集成测试、最终聚合与逐 AC 验收仍保留；明确取消与 owner-loss 清理；历史原件仍只读。活跃时间与总等待时间只作观测，不作终止条件。无页面/前端变更。
