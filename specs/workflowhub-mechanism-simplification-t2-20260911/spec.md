# spec · workflowhub-mechanism-simplification-t2-20260911

## 速读卡（30 秒）

- **做什么**：四批机制简化——C9 将档位精确冻结为 `inner/phase/aggregate`、预算 `{inner:60000,phase:300000,aggregate:null}`、aggregate CI-only，并完成去重/超时保留/public `stageRuntimeMain` preflight；C4 保留 Task I K2 合同，只补真实 review facts 传播/status visibility、删除 budget，另含跨仓判死/通道/T-11；C5 按 OI-26 保留 K2/K5 身份与 proof binding，只删 freshness/currentness invalidation/rerun use sites，并完成 write-boundary/path-card/CONTEXT delta；C6 连对象删除 quality/verify 与 schema，覆盖 Runner distribution、registries/inventory、targeted clean-install/projection tests，并回归 5/4/2 close routes 与 `recordCloseActionRow`。
- **给谁**：跑 workflowhub 五阶段任务的开发者与 CI；审查消费者；后续任务的收口动作。
- **怎么算成**：四张卡各自 FR/AC/oracle 全过（C9 7 FR/11 AC、C4 21 FR/26 AC、C5 9 FR/10 AC、C6 13 FR/17 AC、流程边界 1 AC；卡内原判据按号对应，追加项见 §2 编号约定），再用任务级三条总账（净行数/记录文件数/无 reader 对象数）核对一次；另加三条守卫基线不劣化核对。执行序与合并序 C9→C4→C5→C6，Task I 前置已满足，C5 先合、C6 后合。
- **紧迫边界**：不新增第五份材料 / public command / 持久化对象 / 状态机；整改期间不得净新增控制面；零延期；跨仓（3rd-review）部分动第二个仓库前有一个人工确认点，被拒则只交本仓消费侧、跨仓标 `unknown`、不停批。

## 0.1 Post-Task-I authoritative delta

This delta is the current implementation contract and supersedes stale present-tense assertions elsewhere without rewriting their historical record:

- Implementation input is `35a6fb6f`; Task I merged at `9f9d0c44` and its byte-preserved materials are now under `specs/archive/workflowhub-mechanism-simplification-t1-20260911/`. The merge prerequisite is satisfied and T0 proves ancestry with `git merge-base --is-ancestor 9f9d0c44 HEAD`.
- K2 is already frozen as the exact 16-key `facts.jsonl` row contract with `record_kind: stage | close_action`, `review_origin` five values, and `review_result_ref`. User accepts this discriminator as-is: no rename, migration, compatibility bridge, or backfill. Existing Task I K2 publication and D-015 tests are regression-only.
- C4 creates no K2 fields. It propagates/merges real review facts without erasing prior fields, exposes the existing fields to consumers, and deletes `validateReviewBudget` plus actual imports/callers.
- C5 preserves K2 row identity and K5 immutable proof bindings (OI-26 class A), including required `material_digest`/`snapshot_tree` values. It deletes only freshness/currentness comparisons and invalidation/re-run triggers. A material edit must not invalidate or re-run valid facts. Behavioral, symbol, and use-site checks replace literal-zero gates.
- the predecessor current-plan validator was physically deleted by Task I and must never be recreated or used as a boundary/gate operand. Existing legacy artifacts remain read-only provenance; new execution facts use `facts.jsonl` only, with no migration/backfill.
- User reconfirms physical deletion of the Tier-C quality-verification schema object. Per ADR-0030, C6 must update its active production consumers, Runner distribution closure, architecture move/deletion registries and the current inventory entry, and focused distribution tests. Archived specs stay immutable historical references.
- Close work preserves all three contracts—`LEGACY_DELIVERY_STEPS`, `UNARCHIVED_PLANNING_STEPS`, `POST_CLEANUP_ARCHIVE_STEPS`—and the existing `recordCloseActionRow`; these are regression seams, not new work. `stage-outcome-proofs` remains K5 evidence/history, never current status authority.
- Task I quality truth remains `incomplete` / `unavailable` / `not_run` as applicable; implementation evidence is not rewritten as independent quality passed. Historical guard counts remain labeled historical until T0 remeasurement.

## 1. 问题与紧迫性

母材料记录的工作流机制开销超过 50% 花在流程与机制上（R-006），且「未来也一样会出现很多阻塞和问题」（R-005）。本任务开工实测确认四个痛点仍在：审查卡死需人工收场（R-007/PRD R-013）、慢测试 900 秒空等与 1,717.39 秒单次门（R-009/PRD R-012）、改一个已审文件绿灯即失效（R-008）、`status` 一个根因几十条红字（R-015）。紧迫性：每张后续卡的验收都要跑受影响测试，C9 决定这个成本；C5/C6 是后续任务收口与读取来源的地基。

## 2. 背景、目标与范围

- **背景**：workflowhub 是按 CONSTITUTION 构建的五阶段编排运行时。任务Ⅰ（C0–C3）负责记录重建与 inventory，本任务（任务Ⅱ）在其合入之后按 C9→C4→C5→C6 四批串行落地机制简化。
- **目标**：控制面净减——跑得更快、审查不靠 timeout 收场、改一个文件不再让绿灯失效、`status` 只报根因；四批合并后 M4（主仓 git 净行数）为负。
- **范围**：仅 PRD 任务Ⅱ 四卡（C9 L845–L1017、C4 L1018–L1321、C5 L1949–L2213、C6 L2214–L2642）与决定链追加裁定写定的行为；详细 FR/AC/oracle 细节以 PRD 对应行段为准，本规格以卡号 + PRD 行号引用、不复制原文。
- **UI applicability**：`non_ui`（decision-log §7 三输入合并：无页面/交互/视觉诉求；唯一人看输出是命令行文本）。任一批次引入人看界面改动时必须按 `recompute_trigger` 重算。
- **验收尺子**：以四张卡各自判据为准；四批都过后用任务级三条总账核对一次（OI-05/D-001）。
- **编号约定**：本规格 FR/AC 是 PRD 卡判据的可执行重述加决定链追加项；原有卡内判据按号对应（AC-C9-001~009 = PRD C9 卡第 1~9 条；AC-C4-001~020 = PRD C4 卡第 1~20 条；AC-C5-001~009 = PRD C5 卡第 1~9 条；AC-C6-001~015 = PRD C6 卡第 1~15 条）；追加项 = AC-C9-010/011（§16.3 硬前置 / D-005）、AC-C4-021~026（T-011 / 允许名单 / dispatch_state / 状态转移 / 通道保留 / 跨仓确认点）、AC-C5-010（D-020）、AC-C6-016/017（D-013 / D-021）、AC-FLW-001（OI-25）、AC-TLD-001~006；精确命令表与文件分档清单归 plan.md 细化（规格钉死约束，plan 不得改语义）。
- **主会话与子代理边界（OI-25）**：阶段决策、批准决定链、签发确认只能由主会话发出，子代理不得代答；重读量动作（全仓扫描、多文件对标、测试采集）默认派子代理执行、主会话只收摘要；子代理失败保留真实失败事实，不得补写其结论。

## 3. 用户场景与状态覆盖

### SCN-001 : 开发者按层跑受影响测试（C9）

开发者或 CI 执行受影响测试时，命令按 `inner`（分钟级，契约上限 60,000ms）/ `phase`（3–5 分钟，契约上限 300,000ms）/ `aggregate`（每任务一次，契约上限 `null`，仅 CI）三层分组；仓库档位常量值一次性改名到底（旧名 `medium`/`large` 含权限语义、错误文案、ADR 同步，不得用「新名映射旧值」冒充改名）。两个 900 秒超时命令不再同层；aggregate 单次门 1,717.39 秒不再复现。空状态：无对应层命令时不启动。错误状态：层名与改名后的档位常量无法对应即失败。

### SCN-002 : 同一命令不重复启动（C9）

同一 `command`（`sha256(command)` 相等）已有完成的 receipt 时，第二次请求返回 `dispatch_state:"reused"` 并回读既有 receipt，不启动第二次子进程。边界：并发在途不覆盖（已知后果，不为它造锁）；审查侧同 track 已有 `conducted` 结果时不重复派发。

### SCN-003 : 超时与失败保留已完成部分（C9/C4）

测试或审查执行超时或被健康判死收场，已完成的 provider member / 已跑完的测试文件结果已落盘且可被下一次读回；「被外层 timeout 杀进程才全丢」只是整改前的现状描述，该外层形态随 C4 废除、不再是规格认可的丢结果路径。失败状态：超时/判死后 receipt 输出不可读或 receipt 不存在即失败；判死事件的已完成部分保留与清理 owner 见 §8 状态转移表。

### SCN-004 : 开工前 preflight 拦截坏输入（C9）

昂贵动作（capture-tests / review-record）前，preflight 校验：① 命令与路径存在性；② provider/host 能力（host_provider 在 3rd-review 配置中存在且启用、审查路由可解析、所需外部能力在场）；③ packet 体积不超预算。不合格返回 `status:"protocol_invalid"` + 非空 `diagnostics[{path,expected,actual}]`，总耗时 ≤5 秒，且不启动该次子进程。取消/恢复边界：preflight 不是门禁——不写完成谓词、不改 stage 状态、不阻止其他动作，修正后可原地重试。

### SCN-005 : 审查卡死由健康判死收场（C4）

provider 卡死时，3rd-review 的 manager 心跳 + 健康裁决（probe `busy` 且游标未变连续 5 次 → 内部诊断码 `PROCESS_STALLED`）在判死窗口内把审查置为终态；事件映射分三层：心跳过期或 manager 已死 → 判死 → 公开面终态复用现有合法 outcome（`unavailable`，`SESSION_MANAGER_LOST` 失败组）；3rd-review 内部失败枚举含 `PROCESS_STALLED`（broker 内部诊断可标记 stalled）；wh-review 消费侧把 `stalled` 作归类标签接入下游结果映射（三处接受）。主仓零计时器、无任何外层 `timeout` 命令。误杀防护：probe `progressing`/`retry` 即存活；无 probeSession 的流式 adapter 跳过探测。生命周期状态矩阵：completed（正常终态）/ cancelled / 判死终态（SESSION_MANAGER_LOST 失败组或 unavailable，stalled 仅调用侧标签）/ stuck（等待健康裁决）/ retry（按公共合同重试）；非终态 runtime 的清理 owner = 3rd-review 仓（主仓不得自造清理计时器）；20 分钟有界等待（`DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`）保留但显式标注兜底、只在健康判死失效时触发。

### SCN-006 : 审查做过就算数（C4）

审查结果以 `review_origin` 五态记录：`conducted` / `unavailable`（已收读材料后才失败）/ `not_run`（写明理由）/ `same_source_degraded` / `dispatched_uncollected`；每 Phase 恰好一次核心审查，小修不复审；focus 复审输入一次性组装不落盘且恰好五项；verify-code 读 Phase review 的 `review_result_ref`（K5 原始结果）并显式区分既有 finding 与本阶段新发现。

### SCN-007 : 改一个已审文件绿灯不失效（C5）

材料字节变化不再触发失效或自动重跑；事实记录只记一次命令与退出码，current status 读侧只做身份与具名 ref 核对。按 OI-26 四类处置：A 类 K2/K5 身份、hash、snapshot/material proof binding 必须保留；B 类 freshness/currentness comparison/rejection/rerun use sites 删除；C 类测试/变体快照保留但不作生产 current authority；D 类无 consumer 残留具名删除。判据为 positive preservation + behavioral/symbol/use-site closure，禁止用旧 9 标识符总数或全局 literal-zero 代替分类。

### SCN-008 : 写口三项核对真会拦（C5）

写口身份核对恰好三项：`task_id` + 工作区路径 + 待写字节；第三项在真正写入点内存内比对「即将写入的字节」与「已认证来源的字节」，不符即 fail-loud；本规格定名新错误文案为 `write boundary source bytes mismatch`（旧 `path card source hash is stale` 随 path-cards 整类删除，不再作为判据）；`identity/path-cards/**` 整类删除后强度不变。

### SCN-009 : status 只报根因（C6）

`status` 输出 = 根因行（同一根因只出现一次，main 前进只报一行 `stale` 带具体来源）+ 恰 6 类具名 ref 集合 + 一行 stage-reflection 结论；不再有 product-release 三键、不再有 status_groups、不再有四个派生投影。

### SCN-010 : close 前置检查在 commit 之前（C6）

close 的 merge 预检与 sidecar/允许清单/远端对象检查全部发生在 commit-delivery 之前；当前收口投影文件由本批改写（移除 product_release 域、改按具名 ref 读取路径取事实、文件保留，仍是 task-close 的活 reader）；`non_stage`（build-prd 类）只按自己的材料与事实收口，不被 5 阶段谓词考核。

### SCN-011 : 跨仓交付的人工确认点（C4）

C4 动 3rd-review 仓之前，主会话向用户展示「改哪些文件、改成什么、怎么验收、失败怎么办」，收到真实答复后才动手；被拒或无响应则只交付本仓消费侧，跨仓标 `unknown`，任务不停批。

### SCN-012 : 每批的停止条件

任一批评判不过即停在该批、如实记录，后续批次不开工；Task I ancestry/archive 前置若复核失败则停在 C9 之前；零延期。

### SCN-013 : 主会话与子代理执行边界（OI-25）

重读量动作（全仓扫描、多文件对标、测试采集、研究派发）默认派子代理执行，子代理只回传结论 + 证据 + 置信度摘要；子代理失败保留真实失败事实、不得补写其结论、不得代答用户；阶段决策、批准决定链、签发确认只能由主会话发出；执行入口三前置（先建认证 worktree、阶段准入权威是四材料、不靠 build-spec 补需求）在每批开工前核对。

## 4. 产品事实与假设（PFACT）

- **PFACT-P01（历史测量，需重测）**：612/35、10、2 是旧 `4330290e` 时点测量，只作历史。当前实现输入 `35a6fb6f` 的权威值由 T0 写入 `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`，后续 gate 读回变量。state: unknown
- **PFACT-P02**：档位名一次性改到底：仓库常量 `TEST_RUNTIME_PROFILE_NAMES` 值改为 `inner/phase/aggregate`（含权限语义 `phase↔local_ci`、`aggregate↔ci_only`、错误文案；ADR 0027 的档位表述由 C9 同批改写、C7 复核治理文本同步=HANDOFF-T2-001）；契约上限 inner=60,000ms、phase=300,000ms 写死；`aggregate` 契约上限保持 `null`（仅 CI，900,000ms 只是 supervisor 运行兜底、单列登记、不得写进契约）。state: verified
- **PFACT-P03**：runPreflight 现为只返回 `{status:"valid",diagnostics:[]}` 的空实现，对不存在命令/路径/超预算 packet 一律放行。state: verified
- **PFACT-P04**：同命令去重复用既有判定（canonical-receipt-writer 的 reusableTestCapture + command_hash），不新增锁对象。state: verified
- **PFACT-P05**：健康终止契约（数值 owner = 3rd-review 仓，本仓零计时器、只消费终态）：探测周期 intervalMs 默认 60,000ms、配置层 liveness_interval_ms 1,000ms、判死阈值 = probe busy 且游标未变连续 5 次（v4 实测值；具体接线落地归 C4 跨仓实现，OPEN-001 记录该归属）。state: verified
- **PFACT-P06**：3rd-review v4 已废除 elapsed-time 终止（idle_timeout_ms/max_duration_ms/deadline_ms 出现即 CONFIG_INVALID，max_wall_clock_ms 恒 null）；判死写成外层墙钟即失败。state: verified
- **PFACT-P07**：跨仓判死逻辑本仓不可闭合，本任务只证明调用侧映射正确，跨仓部分按决定链如实标注。state: verified
- **PFACT-P08**：`review_origin` 恰 5 取值，第 5 值字面量名 `dispatched_uncollected`（裁定 J-1）；managedPublic 字段集保持 `{version, request_id, runtime_id, state, material_id}` 不变。state: verified
- **PFACT-P09**：9 个失效链标识符生产命中 993 处；identity/path-cards 零生产 reader、零测试引用。state: verified
- **PFACT-P10**：写口核对从 13 项收敛为恰 3 项；check-extensibility 按裁定 J-5 原样保留（同进程 before/after 比对，非持久化失效链）。state: verified
- **PFACT-P11**：close 模块的 planning 分支哈希校验为跨卡排除项（X47），归 C6 承接。state: verified
- **PFACT-P12**：`status`/`close` 读取来源为恰 6 类具名 ref（K1 task.json、K2 facts.jsonl、K3 四份材料、K4 confirmations/authorizations、K5 被点名原始证据含 stage-outcome-proofs、K6 四份材料与 HEAD 的具名 diff），禁止 readdir 决定读取内容。state: verified
- **PFACT-P13**：quality/verify.json 与 product-release 投影连对象收掉；stage-outcome-proofs 保留为 K5 不迁移不删除（裁定 J-4）；三块事实底座 status_matrix/identity/source_completeness 保留，consumer 逐块点名（FR-C6-013）。state: verified
- **PFACT-P14（post-merge supersession）**：Task I 已冻结 `facts.jsonl` 行型字段为 `record_kind`，值恰为 `stage | close_action`；本任务接受并只做回归保护，不改名、不迁移、不兼容、不回填。state: verified
- **PFACT-P15**：验收不直接证明「机制开销净降」是诚实缺口（RISK-009，accepted_risk），不新增行为型判据。state: verified
- **PFACT-P16**：C9 是整改期间唯一允许净增的卡；+35~+90 行只是 PRD 预估（历史估计，不作为实现预算或失败门槛），准确净增以 build-code 实测回填（OPEN-004）；正行数由 C1/C2/C5/C6 净减吸收；M4 只计主仓 git 净行数，跨仓正行数单列。state: inferred
- **PFACT-P17**：decision_revision = decision-log.md 整文件 sha256，属身份/完整性类（OI-26 A 类保留面），不是被删的 freshness 失效链；C4 方向审查绑定用它，C5 behavioral closure 不删除它。state: verified

## 5. 功能需求

### C9 执行面

- **FR-C9-001**：测试命令按三层节奏分组，每层有硬时间预算——inner 分钟级（契约上限 60,000ms）、phase 3–5 分钟（契约上限 300,000ms）、aggregate 每任务一次（契约上限 `null`，仅 CI）；档位常量值一次性改名 phase/aggregate 到底，改名排 C9 第一步、先于其余三条（T-010/母决定 D-018）。（来源 C9 卡第 1 条 / D-003）

- **FR-C9-002**：同一 `command`（`sha256(command)` 相等）已有完成的 receipt 时不重复启动、回读既有 receipt；并发在途去重不在本 FR 范围。（来源 C9 卡第 2 条 / 裁定 J-6）

- **FR-C9-003**：超时不得抹掉已完成的 provider member / 已跑完的测试文件，已完成部分可读回。（来源 C9 卡第 3 条 / D-026②）

- **FR-C9-004**：开工前 preflight 校验命令与路径存在性、provider/host 能力、packet 体积，5 秒内返回具体原因。（来源 C9 卡第 4 条 / D-026②）

- **FR-C9-005**：preflight 只校验该次昂贵动作、不阻断推进——三条同时成立：不合格不启动子进程；如实返回 `protocol_invalid` + 非空 `diagnostics`；不新增任何门禁。（来源 C9 卡第 5 条 / R-006）

- **FR-C9-006**：档位三条硬前置（§16.3/OI-08）：① 每个档位点名真实 consumer（至少含 run-checks 的 profile 消费、test-runtime-profile 契约测试、runtime-profile-consumer-readback 测试）；② 必须新增独立 npm script 命令入口，名称由本规格写死为 `test:profile`（调 run-checks 的 phase 档；aggregate 档仍走 CI 直调 run-checks；不改现有 test/test:safe/test:exclusive/check 语义；该入口是接线、不是新 public command）；③ 入口未落地不得声明完成——三条不满足即按死代码处理、不得交付。（来源 OI-08 / §16.3）

- **FR-C9-007**：档位改名完成后的第一步：评估 measure-test-runtime-profile 工具能否复用（D-005；「第 0 步/第一步」专指档位改名，本项紧随其后）：能复用则复用接线；不能复用则登记「已知重复」、列进 HANDOFF-T2-004 交接，不得直接删除或忽略。（来源 D-005 / OPEN-005）

### C4 审查生命周期

- **FR-C4-001**：审查去重键改为元组 `(stage, phase_id, track, review_kind, origin)`；写死「大改动」判定人与误判后果；引用第 5 取值字面量名 `dispatched_uncollected`。（来源 C4 卡第 1 条 / 母决定 D-029③）。「大改动」判定人 = 主会话，口径 = 母决定 D-022③（跨接口 / schema / 安全边界 / 公共契约）；误判后果 = 多跑一次 focus 复审（成本浪费）或少审一次（质量缺口），误判处置 = 记录事实并回到每 Phase 一次核心审查基线

- **FR-C4-002**：删 `validateReviewBudget` 及其两个消费点；canonical dedup identity 保持五维 `(stage, phase_id, track, review_kind, origin)`，身份匹配后才读取既有 `review_result_ref` 作为 readback/reuse target；该 ref 不是去重键。（来源 C4 卡第 2 条 / 母决定 D-010）

- **FR-C4-003**：每 Phase 保留 1 次核心审查；废除「反复重审直到 findings 清零」；只有大改动允许一次 focus 复审；小修不触发。（来源 C4 卡第 3 条 / 母决定 D-022）

- **FR-C4-004**：`dispatch_state` 提到聚合面（今天只在 `role_results.red/blue` 内）。（来源 C4 卡第 4 条 / 母决定 D-029⑬）

- **FR-C4-005**：packet 组装补技能材料 lens。（来源 C4 卡第 5 条 / 母决定 D-029⑪）

- **FR-C4-006**：`minimum_heterologous` 按底层模型判定并写明比较键（落到 `identity.model`，非 profile 键）。（来源 C4 卡第 6 条 / 母决定 D-029⑮）

- **FR-C4-007**：降级判据收紧为「已收到并读取材料之后才失败」；`review_origin` 增第 5 取值区分「已派出但未收齐」。（来源 C4 卡第 7 条 / 母决定 D-007）

- **FR-C4-008**：3rd-review manager 心跳 + `managedStatus` 心跳过期判死；复用 `SESSION_MANAGER_LOST`；协议零变更；对所有 provider 有效；健康终止契约 5 条（周期数值与归属、计时器 owner、过期阈值 = 健康裁决非墙钟、忙但存活判据、数值归属 = 3rd-review）连同实现一起落。（来源 C4 卡第 8 条 / 母决定 D-030①）

- **FR-C4-009**：`PROCESS_STALLED` 补进 3rd-review 失败枚举（provider-failure 的 structuredCodes）并从诊断升级为终态（health-runner 可 publish → broker 内部 outcome 标记 stalled）；对 wh-review 公开面复用现有合法 outcome（`SESSION_MANAGER_LOST` 失败组或 `unavailable`）落终态；`stalled` 仅作 wh-review 消费侧归类标签；不改 v3 公开信封字段集、不新增公开 outcome。（来源 C4 卡第 9 条 / 母决定 D-030② + 终态映射 R4-Q2=A）

- **FR-C4-010**：wh-review 侧把 `stalled` 接到下游结果映射；`waitForManagedTerminal` 改等健康裁决，`DEFAULT_MANAGED_TERMINAL_WAIT_MS` 语义随之改写为显式兜底（只在健康判死失效时触发）；明令禁止自造墙钟停滞判定。（来源 C4 卡第 10 条 / 母决定 D-030③）

- **FR-C4-011**：修正 3rd-review 的 ADR 与归档设计文档中「沉默不杀进程」的旧决策（两个文件加方向修正标注）。（来源 C4 卡第 11 条 / 母决定 D-030④）

- **FR-C4-012**：审查通道修复（必须修）：结果归一化器必须接受 `available-with-failures`——成对审查有 provider/role 不完整时不得整包丢弃已产出结果（本任务两次实测复现：20/41 条 findings 因此被丢、exit 1、stdout 0 字节、不写 sink）；含 red+blue 两 role 同时 `PROTOCOL_INCOMPATIBLE` 且 `provider_results=[]` 的丢包形态。（来源 C4 卡第 12 条 / 母决定 D-021④ + 本任务实测）

- **FR-C4-013**：形似允许名单四套收敛为一套；`MATERIAL_FORBIDDEN` 类错误必须直接列出合法取值。（来源 C4 卡第 13 条 / 母决定 D-008①②）

- **FR-C4-014**：focus 复审最小输入 = 一次性组装、不落盘、恰好五项：原 finding 的 ref + 受影响文件的最小 diff + 对应测试 + 当前源码树 + delta 验证结果。（来源 C4 卡第 14 条 / 母决定 R-014）

- **FR-C4-015**：Phase review 复用判据 = 输入未变（具名输入逐项相同，不是哈希失效链）；输入变了照常重跑。（来源 C4 卡第 15 条 / 母决定 R-015③）

- **FR-C4-016**：跨阶段复用：verify-code 读 Phase review 的 `review_result_ref`（K5 原始结果）作为输入；去重只限重叠维度；verify 自己的 lens 与异源代码 review 保留不降级。（来源 C4 卡第 16 条 / 母决定 R-015④）

- **FR-C4-017**：补齐方向完整性指令，使 direction track 的审查载荷含「方向完整性」指令项 + OI 快照；不新增 surface、不改 per-stage 审查标准与 prompt。（来源 C4 卡第 17 条 / OPN-1）

- **FR-C4-018**：把 OI 清单绑定到 `decision-log.md` 的具体修订版本：`decision_revision`（整文件 sha256，身份/完整性类，见 PFACT-P17）+ OI 逐条 ref/sha256 + 交互聚合按官方契约形状（修 X15/X16）。（来源 C4 卡第 18 条 / OPN-5）

- **FR-C4-019**：provider 生命周期的唯一 owner = C4；可执行内容 = FR-C4-008/009/010；不新增机制；C9 不再持有该条。（来源 C4 卡第 19 条 / 母决定 裁定 G）

- **FR-C4-021**：跨仓人工确认点（D-008/母决定 D-008）：C4 动 3rd-review 仓之前，主会话必须向用户呈报「改哪些文件、改成什么、怎么验收、失败怎么办」并等待真实答复；收到答复前禁止任何跨仓写入；被拒或无响应时只交付本仓消费侧、跨仓标 `unknown`、任务不停批。（来源 D-008 / OI-09）

- **FR-C4-020**：T-11 修复（D-009/OI-13）：把协议版本加进审查请求身份（managedRequestId 的 stableValue 输入），本地计算、不改 v3 公开信封字段集（managedPublic exactKeys 不变）；实跑验证一次，定性 = 通道验证（D-023：只记退出码，不产出 findings、不进 sink、不计审查轮次），验证同材料改协议后 24h TTL 内可重跑、不产生 `REQUEST_ID_CONFLICT`。（来源 D-009 / OI-13 / D-023）

### C5 记录失效链

- **FR-C5-001（post-merge narrowing）**：按 OI-26 consumer 分类处置，不做全局字面量清零。A 类必须保留 K2 的 `record_kind` 行身份与 `material_digest`/`snapshot_tree` 条件字段，以及 K5 原始证据的不可变 proof binding（ref/hash/snapshot/material binding）；C 类测试/变体快照可保留但不得成为 production current-status authority。只删除 B 类 freshness/currentness 的比较、判定、拒绝与自动重跑链（如 `evaluateFactFreshness`、`isStageSnapshotCurrent`、`isMaterialOnlySnapshotDelta` 及其 use sites），D 类按具名 consumer 证明删除。材料字节变化后，已有有效事实仍可读、不会自动失效或重跑。`snapshot_tree` 的存在本身不是删除理由。已由 Task I 删除的 the predecessor current-plan validator 只做“不存在且无 consumer/写口”的 predecessor regression，不得重建。（来源 C5 卡第 1 条 / 母决定 D-009① / D-011 / OI-26 / post-merge 用户决定）

- **FR-C5-002**：唯一保留的写口身份核对 = `task_id` + 工作区路径 + 待写字节，恰好三项；第三项在真实写入点内存内比对「即将写入的字节」与「已认证来源的字节」，不符 fail-loud，新错误文案 `write boundary source bytes mismatch`（本规格定名）；不落任何 path card。（来源 C5 卡第 2 条 / D-019 / 裁定 J-3 / 母材料 §16.21 第 10 条）

- **FR-C5-003**：写口预检不再经 snapshot；git-worktree-snapshot 捕获能力从写路径移出。（来源 C5 卡第 3 条 / 母决定 D-009 修订①）

- **FR-C5-004**：声明面同步：check-skill-closure 冻结数组与全等校验、stage-skill-deps schema 的 const、6 个 skill-deps 声明文件四者同批改。（来源 C5 卡第 4 条 / 母决定 D-029⑨(a)）

- **FR-C5-005**：build-prd skill-deps 的 spec-prd consumer identity 同步。（来源 C5 卡第 5 条 / 母决定 T-7#3）

- **FR-C5-006**：check-extensibility 的 content-hash 度量按裁定 J-5 原样保留，不换判据；表述责任由 C7 承担。（来源 C5 卡第 6 条 / 裁定 J-5）

- **FR-C5-007**：去重键不再由材料哈希驱动，且必须继续使用五维 identity `(stage, phase_id, track, review_kind, origin)`；五维匹配后才按 `review_result_ref` 读回复用结果，禁止把 ref 当 dedup key。（来源 C5 卡第 7 条 / 母决定 D-010 修订）

- **FR-C5-008**：close 模块的 planning close 哈希校验为跨卡排除项，归 C6；本卡显式登记不删除。（来源 C5 卡第 8 条 / 裁定 X47）

- **FR-C5-009**：C5 同批改写 CONTEXT.md 的阶段完成判据一句（D-020/HANDOFF-T2-007）：不再引用 `material revision`/`snapshot`，改为 identity 三项 + facts.jsonl 本阶段行 + 六类具名 ref；只改该一句，C7 复核。（来源 D-020）

### C6 收口状态

- **FR-C6-001**：`status` 只输出根因归并条目 + 具名 ref 集合；派生投影不作为独立条目；同一根因只出现一次。（来源 C6 卡第 1 条 / D-012）

- **FR-C6-002**：quality/verify.json 与 product-release 投影连对象收掉；物理删除 `runtime/schemas/quality-verify.v1.json`，并按 ADR-0030 的扩删要求同步清除 active writer/reader、Runner release 目录扫描结果、distribution/clean-install 断言及 architecture registry/inventory 当前条目；删 deriveProductRelease/deriveCurrentProductRelease 及其状态机。归档 specs 中的历史引用不改写。（来源 C6 卡第 2 条 / 母决定 D-023① / post-merge 用户再确认）

- **FR-C6-003**：`status`/`close` 只读 canonical 输出，禁止扫描旁路目录；读取来源恰 6 类具名 ref（K1–K6 闭集）。（来源 C6 卡第 3 条 / 裁定 J-7）

- **FR-C6-004**：close 不再依赖 deriveCurrentProductRelease；`delivery.quality_gaps` 按 semantic reader closure 收口（不把历史“10 处”当当前硬计数；实施时具名列出任务收口与阶段处理两类生产消费者的所有 active readers）；validateRiskCloseQualityReasons 改用等值判定（与 `status` 根因行登记的具名 ref 集合逐项全等，空集仍抛、不等仍抛）。（来源 C6 卡第 4 条 / 裁定 J-7.2）

- **FR-C6-005**：所有入口统一 `project` + `task_id` → 唯一 config resolver → canonical task path；`--task-path` 降为受控诊断 override 并记录来源。（来源 C6 卡第 5 条 / 母决定 D-024①）

- **FR-C6-006**：任务期间 main 前进不冻结 base OID；不静默使用旧快照，必须在 status 根因行报 `stale` 带具体来源。（来源 C6 卡第 6 条 / 母决定 D-024②）

- **FR-C6-007**：close 的 sidecar 发布 / merge 预检 / 允许清单 / 远端对象检查全部发生在 commit 之前；不新增 `close --preflight-only`。（来源 C6 卡第 7 条 / 母决定 D-025①）

- **FR-C6-008**：`non_stage`（build-prd 类）只保证自己的材料与事实，不按 5 阶段谓词收口；谓词遍历集合钉死 `STAGES`（不得改为 `STAGE_KEYS`）。（来源 C6 卡第 8 条 / 裁定 J-2）

- **FR-C6-009**：stage-reflection 结论合并进既有 `record_kind:"stage"` 行的 frozen 16-key 语义，不增加第 17 键/第二行；同 stage replacement 必须保留已记录的真实 `review_origin`、`review_result_ref`、finding disposition 与 reflection/analysis facts，status 仍只读该 K2 行。（来源 C6 卡第 9 条 / 母决定 D-011② / Task I frozen contract）

- **FR-C6-010**：D-015③ 的写完 → status 立即可读 → 重放不产生重复已由 Task I 实现，T2 将其列为 regression-only 前提；不得重新实现另一条 publication path。回归必须同时覆盖 stage 行与 close-action 行的 `record_kind` 身份，并保留既有 5/4/2 三条 close route 与私有 close-action 行写入器。三条 route 数组从起始提交起内容与顺序均保持逐项不变；precheck 是 route 执行前调用的函数，不得插入、重排 route 数组。测试分别证明 precheck 在首个物理动作前调用，以及三种已确认物理动作后 close-action 行可写/回读、失败可见 `unavailable`。历史阶段证据只作 K5 evidence/history，不替代 K2 当前状态权威。（来源 C6 卡第 10 条 / 母决定 D-015③ / Task I merge `9f9d0c44`）

- **FR-C6-011**：承接 X47：close 模块 planning close 哈希校验一并处置；保留 `planning.materials[file]` sha256 与 prd.md 附件绑定，删除对 `material_revision`/`snapshot_tree` 的要求；不得变成不校验任何身份。（来源 C6 卡第 11 条 / 裁定 X47）

- **FR-C6-012**：当前收口投影模块由 C6 同批改写、不删（D-013/R4-Q4）：从状态域中移除 product release，该域改按新的具名 ref 读取路径取事实；模块保留，仍是任务收口的活 reader；治理登记表同步归属与任务Ⅲ C7 对齐。（来源 D-013 / OI-14）

- **FR-C6-013**：保留三块事实底座 status_matrix/identity/source_completeness（D-021），逐块点名真实 consumer：status_matrix 的 consumer = status 根因行渲染与人工判读；identity 的 consumer = 写口三项核对与入口解析；source_completeness 的 consumer = stage-reflection 复盘与质量事实读回；写不出的按 D-013 裁定。（来源 D-021 / §16.13）

## 6. 模块划分

- **C9 执行面层**：档位与预算判定、receipt 复用读取分支、进程启动前存在性校验、preflight 组装、分档 npm script 入口接线；只接线不改既有脚本语义。
- **C4 审查层（主仓）**：审查请求记录与去重、预算删除、packet 组装与 lens、managed 终态等待、消费侧结果映射、请求身份协议版本、provider 配置与异源判定。
- **C4 审查层（跨仓 3rd-review）**：manager 心跳写入、健康裁决升级、失败枚举、broker 内部终态、两份文档标注。
- **C5 记录层**：失效链删除闭包、写口预检三项收敛、声明面四处同步、快照捕获能力移出写路径、CONTEXT.md 判据句改写。
- **C6 收口层**：status 根因行派生、close 计划与五步执行、入口解析统一、谓词遍历集合钉死、planning close 承接、当前收口投影改写、三块事实底座保留。

## 7. 关键实体

- **测试档位**：`inner` / `phase` / `aggregate` 三层命名（仓库常量值一次性改到底，权限语义 `phase↔local_ci`、`aggregate↔ci_only`）。
- **审查五态 `review_origin`**：`conducted` / `unavailable` / `not_run` / `same_source_degraded` / `dispatched_uncollected`。
- **写口三项**：`task_id` + 工作区路径 + 待写字节。
- **K2 两型行**：`facts.jsonl` 的 frozen discriminator 为 `record_kind`，取值恰为 `stage` 与 `close_action`；接受 Task I 合同，不改名、不迁移、不兼容、不回填。
- **具名 ref 闭集（恰 6 类）**：K1 task.json；K2 facts.jsonl；K3 四份材料；K4 quality/confirmations 与 quality/authorizations；K5 被点名原始证据（含 stage-outcome-proofs）；K6 四份材料与 HEAD 的具名 diff。

## 8. 数据和生命周期

- 事实记录只记一次命令与退出码（含失败签名），不因材料改动自动作废；读侧只做身份核对。
- stage-outcome-proofs 保留为 K5，由 stage-runner 按 ref 读；不迁移、不删除、不改写（裁定 J-4）。
- quality/verify.json 与 product-release 投影连对象删除；stage-outcome-proofs 的 ref 仍以第 5 类具名 ref 出现在读取面。
- `facts.jsonl` 成为唯一新执行记录：`record_kind:"stage"` 行（含 `review_origin` + `review_result_ref` + 真实命令与退出码 + 四层状态 + 严重问题处置）与 `record_kind:"close_action"` 行（动作名 + 结果 + 具名 ref）。旧 task artifacts 仅只读 provenance；不迁移、不回填。
- decision_revision（decision-log 整文件 sha256）是身份/完整性引用，不是 freshness 链；C4 方向审查与 OI 快照绑定使用它（PFACT-P17）。
- 审查/执行生命周期状态转移表（统一五态语义：completed / unavailable / incomplete / partial / unknown）：

| 事件 | 公开 outcome / review_origin | 已完成部分与清理 owner | 重试与批次放行 |
| --- | --- | --- | --- |
| 正常完成 | completed / conducted | 全部可读回；无需清理 | 放行 |
| provider 死亡或心跳过期 | unavailable（SESSION_MANAGER_LOST 失败组）/ unavailable | 已落盘 member 可读回；清理 owner = 3rd-review（主仓零计时器） | 按公共合同重试；重试仍失败记 unavailable，不阻断同 task 修复 |
| 已派出未收齐 | partial / dispatched_uncollected | 已收部分可读回；3rd-review | 材料或配置指纹变化允许新一轮 |
| 小修后 | 不重跑 / conducted（沿用） | 沿用；无需清理 | 放行 |
| 同源自降级 | 同源自降级结果 / same_source_degraded | 可读回；无需清理 | 记录事实不伪通过 |
| 取消 | cancelled / not_run（写理由） | 已落盘部分保留；3rd-review | 批次停止条件见 SCN-012 |
| 五态中的 incomplete/unknown | 同左语义 / 对应登记 | 如实标注；对应 owner | 诚实缺口不伪造 |

## 9. 兼容性预留

- 不改 npm test / test:safe / test:exclusive 的语义；不改任何 stage 完成谓词；不改 wh-review 的 per-stage 审查标准与 prompt；不改 verify-code 工作流文件；不扩 `STAGES` 枚举；不新增 public command（public runtime 仍只有 doctor/status/run/review/verify/confirm/authorize 七类）；不新增 close --preflight-only；不做兼容桥、不建双写、不动历史字节。
- v3 公开信封合法 outcome 只有 completed/partial/unavailable/cancelled；判死公开面用现有合法 outcome，`stalled` 只作 wh-review 侧归类标签；broker 内部诊断可标记 stalled，不改公开字段集。
- ADR 0027 的档位表述由 C9 同批改写、治理文本同步由任务Ⅲ C7 复核（HANDOFF-T2-001）；审查主机制/兜底关系与 `review_origin` 五态进治理文本归 C7（HANDOFF-T2-002）；CONTEXT.md 完成判据句由本任务 C5 改写、C7 复核（HANDOFF-T2-007）。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增第五份材料 / public command / 持久化对象 / 状态机；整改期间不得净新增控制面（确有必要的须当场写明唯一 consumer、owner、替代关系与删除条件）。
- 不改写 npm test / test:safe / test:exclusive 语义；不动 stage 完成谓词；不把 preflight 做成门禁；不改 per-stage 审查标准与 prompt；不改 verify-code 工作流文件；不动历史字节、不做兼容桥、不建双写。
- 不为并发在途去重造锁；不在本仓自造健康判死计时器；不改 v3 公开信封字段集（managedPublic exactKeys 不变；T-11 的协议版本只进本地请求身份计算）；不新增 close --preflight-only；不扩 STAGES 枚举；不新增任何「防 stale」机制。
- 不产出任何延期项（零延期）；不替用户补产品方向；E-16 只约束写 PRD 的任务、对本执行任务不适用。

### 默认必须成立

- 同文件串行：C9 先于 C6 改 stage-runtime；C4 先于 C5 改 review-materials、先于 C6 改 stage-handlers；C3 先于 C5 改 task-handle；C5 先于 C6 改 stage-runtime 与 completion-predicates；C6 先于 C7 合 close 主文件。
- 任务Ⅰ已由 `9f9d0c44` 合入，前置已满足；每批做完立刻跑本批判据不推迟；只跑受影响针对性测试，禁止无范围全量回归。
- 守卫当前基线由 T0 在实现输入 `35a6fb6f` 上重测并写入 task-store artifact；后续 gate 读取该 artifact 的命令、退出码和计数变量作前后比较。历史 612/35、10、2 不作为当前阈值。
- 跨仓正行数单列，不计入主仓 M4；C9 净增 +35~+90 行由其余批次净减吸收、M4 为 C8 对全任务的判据。
- 跨仓结算规则：跨仓人工确认点被拒或无响应时，C4 只交付本仓消费侧；跨仓判死相关判据如实标 `unknown`（不视为完成、不阻断本批），本仓消费侧判据必须全过；「`unknown` ≠ 完成」只适用于跨仓部分。

## 11. 验收标准

### 流程边界（OI-25）

- [ ] **AC-FLW-001**：主会话与子代理执行边界可验证：重读量任务派发/回传格式（结论+证据+置信度摘要）、子代理失败保留真实失败事实且不重派代答、阶段决策与确认只能主会话发出、执行入口三前置（认证 worktree/阶段准入权威/不靠 build-spec 补需求）逐批核对。
场景：抽查本任务各批执行事实。
验证：interaction 聚合与问答凭证按官方契约绑定（task store quality/evidence/interactions/）；子代理失败事实在 facts 证据区可见且未被补写结论；每批开工前 worktree 认证与阶段准入核对有记录。
通过：四项全部有证据。
失败：任一只有原则性描述没有可核对证据。
证据：interaction 聚合校验输出、凭证 sha256 复核、执行事实抽查记录。

### 守卫基线（T0 重测后不劣化核对）

- [ ] **AC-TLD-001**：markdownlint 当前基线不劣化且本任务范围内清零。
场景：T0 在 `35a6fb6f` 输入上运行一次并将原始输出、退出码、error 数、出错文件数写入 `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`；整改后同命令重跑。
验证：从该 artifact 读出 `markdownlint.errors` 与 `markdownlint.files` 作为变量，整改后两值均不大于 T0 值，且本任务四份材料与实现改动文件为 0 error。
通过：readback 可复算、不劣化且范围内清零。
失败：artifact 缺失/不可解析，或任一整改后值大于 T0 值。
证据：T0 artifact 与整改后原始输出。

- [ ] **AC-TLD-002**：路径守卫当前基线不劣化且本任务范围内清零。
场景：T0 记录 `check-task-record-paths` 原始输出、退出码和 FAIL 数，整改后重跑。
验证：整改后 FAIL 数 ≤ artifact 中 `record_paths.failures`；被删除对象和本任务文件不新增 FAIL。
通过：不劣化。
失败：artifact 不可读或整改后 FAIL 数上升。
证据：T0 artifact 与整改后守卫输出。

- [ ] **AC-TLD-003**：结构守卫当前基线不劣化且本任务范围内清零。
场景：T0 记录 `verify-structure` 原始输出、退出码和 FAIL 数，整改后重跑。
验证：整改后 FAIL 数 ≤ artifact 中 `structure.failures`；本任务范围内无新增结构失败。
通过：不劣化。
失败：artifact 不可读或整改后 FAIL 数上升。
证据：T0 artifact 与整改后守卫输出。

### 任务级三条总账（D-001/§16.10，只读计算，consumer=任务Ⅲ C8 的 M3/M4）

- [ ] **AC-TLD-004**：净行数总账——主仓 git 净行数为负（M4）。
场景：四批全部合入后统计主仓 git 净行数。
验证：git 主线前后 diff --stat 汇总，主仓净行数 < 0（C9 正行数由 C1/C2/C5/C6 净减吸收；跨仓正行数单列不计入）。
通过：主仓净行数为负。
失败：主仓净行数 ≥ 0。
证据：git diff --stat 汇总记录（C8 末次复核）。

- [ ] **AC-TLD-005**：每任务记录文件数总账——单任务记录文件数对基线不劣化（M3 口径）。
场景：对本任务 task store 执行 find 统计。
验证：find $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911 -type f | wc -l 与开工基线对比不劣化；本任务新增文件均有具名 consumer/owner 登记。
通过：不劣化且新增登记齐全。
失败：文件数劣化或存在未登记新增。
证据：find 统计记录（整改前后各一次）。

- [ ] **AC-TLD-006**：无 reader 对象数总账——§4.4 consumer 扫描口径下无 reader 对象数对基线不增。
场景：按 §4.4 消费者扫描口径复算。
验证：consumer 扫描复算计数 ≤ 开工基线；删除项均有具名处置记录。
通过：不增。
失败：无 reader 对象数增加。
证据：consumer 扫描复算记录（C8 末次复核）。

### C9 验收标准

- [ ] **AC-C9-001**：存在一份写死的三层命令表（inner/phase/aggregate）；契约上限 inner=60,000ms、phase=300,000ms 写死；`aggregate` 契约上限为 `null`（仅 CI），900,000ms supervisor 兜底值单列登记、不写进契约；档位常量值已一次性改名 phase/aggregate。
场景：检查三层命令表与档位改名落点。
验证：受控 profile 入口以 inner 档运行具名受影响用例，退出码为 0 且 evidence 内 ceiling_ms 为 60,000；核对档位常量与 ADR 表述均为 inner/phase/aggregate；aggregate 层无契约数字上限，900,000 仅以 supervisor 兜底注释或登记出现。
通过：三层契约上限写死（aggregate=null）、改名到底、兜底单列。
失败：任一层无契约上限（aggregate 须为 null 而非数字）、层名与改名后常量无法对应、900,000 被写成契约预算、或旧档位名残留。
证据：verify-code 阶段 `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/` 下 evidence 文件与 grep 记录。

- [ ] **AC-C9-002**：两个需要 900 秒 supervisor 兜底的 aggregate 测试不再出现在同一命令；七个文件按 inner/phase/aggregate 分层，任一命令内不得跨层混跑。
场景：检查拆分后命令分组。
验证：核对 plan.md C9 命令表：`vnext-official-stage-run` 与 `vnext-five-stage-current` 是两个独立 aggregate 调用，且不与 inner/phase 文件同命令启动。
通过：两个 900 秒测试分处不同 aggregate 命令，所有命令单层。
失败：两个测试仍同命令，或任一命令混入不同层文件。
证据：拆分后命令表与启动记录。

- [ ] **AC-C9-003**：1,717.39 秒单次门不再复现。
场景：aggregate 层单次实测。
验证：以一个具名审查兼容性用例的历史单文件计时基线 0.371 秒和卡级历史最大值 743,014 毫秒作比较；记录单次 aggregate 命令的实测 wall-clock。
通过：单次 aggregate wall-clock < 1,717.39s 且单文件 < 743,014ms。
失败：单次 aggregate 实测 ≥ 1,717.39s，或单文件实测 ≥ 743,014ms。
证据：verify-code 阶段计时记录（real 时间与 vitest Duration）。

- [ ] **AC-C9-004**：受影响的 7 文件集合被拆成 ≥2 个命令，每个命令预算 ≤5 分钟或标记 aggregate（命令表 = plan.md 的 C9 wave 清单）。
场景：检查拆分后命令数与跨层混跑。
验证：plan.md 命令表逐条核对层标记与预算。
通过：拆分后总启动次数不增、无跨层混跑。
失败：拆分后总启动次数 > 拆分前，或仍存在跨层混跑。
证据：命令表与执行记录。

- [ ] **AC-C9-005**：（PRD C9 卡第 5 条）请求级去重键元组的第二次请求返回 `dispatch_state:"reused"` 且未调用 `runRound`；与 AC-C4-004 的既有 conducted 结果不重复派发互补（本判据管请求级键复用，AC-C4-004 管结果级不重复派发，两层均归 C4 实现）；本判据由 C4 批实现并同批验收、不计入 C9 批的停止条件（SCN-012 只算 C9 自身实现项）。
场景：带计数桩的针对性测试重复同一审查请求。
验证：计数桩断言第二次 runRound 调用数为 0。
通过：第二次返回 reused 且零派发。
失败：第二次仍进入 provider 派发。
证据：针对性测试退出码 0 与桩计数记录。

- [ ] **AC-C9-006**：同一 `command` 的第二次 capture-tests 回读既有 receipt，不启动子进程。
场景：连续两次相同 capture-tests 命令。
验证：runWorkspaceCommand 调用计数 = 1；第二次回读到既有 receipt.output_ref。
通过：不重复启动且 receipt 可读回。
失败：runWorkspaceCommand 被调用第二次，或第二次未回读到既有 receipt.output_ref。
证据：计数桩与 receipt 读回记录。

- [ ] **AC-C9-007**：超时场景下输出与 receipt 均已落盘且可读回。
场景：受控超时调用后读回。
验证：超时后 readRecord(receipt.output_ref) 成功且 receipt 存在。
通过：两者均可读回。
失败：超时后 receipt.output_ref 不可读，或 receipt 不存在。
证据：读回命令输出。

- [ ] **AC-C9-008**：preflight 对不存在的命令/不存在的路径/超预算 packet/能力缺失（host_provider 未配置或未启用、审查路由不可解析）返回具体原因且总耗时 ≤5 秒。
场景：node -e 构造 preflight 四类负例。
验证：node -e 断言 diagnostics[0].path、expected、actual 三字段非空且 Date.now() 差值 ≤5,000。
通过：四类用例均返回非空 diagnostics 且耗时达标。
失败：返回空对象、无 diagnostics、expected/actual 为空、或耗时 >5,000ms。
证据：node -e 断言输出与退出码。

- [ ] **AC-C9-009**：preflight 失败时三条同时成立：子进程未启动、返回 `protocol_invalid` + 非空三字段 diagnostics、任务推进未受阻且修正后可原地重试。
场景：preflight 负例后修正重试。
验证：桩计数 runWorkspaceCommand = 0；返回形状断言；stage 状态断言；修正后重试成功。
通过：三条同时成立。
失败：失败仍启动子进程、preflight 变成门禁、或返回空 diagnostics（任一）。
证据：桩计数、返回形状与重试记录。

- [ ] **AC-C9-010**：档位三条硬前置全部落地：① 每档点名真实 consumer（run-checks 的 profile 消费、test-runtime-profile 契约测试、runtime-profile-consumer-readback 回读测试逐一点名）；② 新增独立 npm script 命令入口（名称写死、不改现有 test/test:safe/test:exclusive/check 语义；该入口是接线不是新 public command）；③ 入口未落地不得声明完成——三条不满足即按死代码处理、不得交付。
场景：核对三档 consumer 点名清单与 package.json 入口。
验证：grep 每档 consumer 点名；npm run test:profile 真实调用 phase 档产出 evidence 且 ceiling_ms=300,000 可读；aggregate 档本地直接调用必须失败（CI-only 语义）；npm test / test:safe / test:exclusive 输出与基线一致（语义未改）；缺任一条时 C9 分档部分不得声明完成。
通过：三条齐备。
失败：任一档无具名 consumer、入口未落地、或入口改了现有脚本语义（任一）。
证据：package.json diff 与 consumer 点名清单。

- [ ] **AC-C9-011**：档位改名完成后立即完成 measure-test-runtime-profile 复用评估（D-005；「第 0 步」专指档位改名）：能复用则复用接线，不能复用则登记「已知重复」并列进 HANDOFF-T2-004。
场景：评估记录核查。
验证：plan/tasks 或 C9 执行事实中含评估结论与处置；关闭条件写清。
通过：评估有结论、处置有登记。
失败：未评估直接新增/直接删除/直接忽略（任一）。
证据：评估记录与交接登记。

### C4 验收标准

- [ ] **AC-C4-001**：去重键含 `phase_id` 与 `track` 两维度。
场景：「同 stage 同 track 不同 phase」的针对性测试。
验证：grep -n "phase_id|review_track" runtime/review/review-record-route 命中 findReusableReview 判断体；针对性测试断言第二次可派发。
通过：两维度在判断体内且第二次能派发。
失败：任一维度缺失，或 focus 复审被旧键永久锁死。
证据：grep 命中与针对性测试退出码。

- [ ] **AC-C4-002**：`validateReviewBudget` 在生产代码中零命中。
场景：源码 grep。
验证：grep -rn "validateReviewBudget" runtime/ → 0。
通过：零命中。
失败：仍存在于 stage-content-evidence 或任一 import。
证据：grep 输出。

- [ ] **AC-C4-003**：npm run check 不劣化于基线且本卡范围内清零。
场景：删预算后守卫复核（PRD C4 卡第 3 条的卡级例外：用户已批准的 PRD 判据要求此命令验证删预算不劣化；执行证据必须写明理由 = 删的是 check 链上的东西、范围 = 守卫三条输出比对；除此之外仍禁止无范围全量，全链路完整执行只归 C8 末次）。
验证：从 T0 current-baseline artifact 读三守卫计数变量，删预算后同命令值不大于 T0，且本卡范围内清零。
通过：不劣化且范围内清零。
失败：任一守卫劣化，或范围内未清零。
证据：三条守卫命令输出（写明例外理由）。

- [ ] **AC-C4-004**：同 track 已有 `conducted` 结果时不再派发（结果级去重；请求级键复用见 AC-C9-005，两层互补）。
场景：重复同 track 审查请求。
验证：计数桩断言第二次 runRound 未调用。
通过：不重复派发。
失败：第二次仍调用 runRound。
证据：桩计数记录。

- [ ] **AC-C4-005**：小修不触发复审；每 Phase 恰好 1 次核心审查。
场景：改一个非「大改动」文件后观察 attempt 数。
验证：attempt 计数 = 1。
通过：无第二次 attempt。
失败：产生第二次 attempt。
证据：attempt 记录。

- [ ] **AC-C4-006**：`review_origin` 5 个取值在 status 可见，第 5 取值有字面量名。
场景：渲染 status 检查取值集合。
验证：node -e 断言渲染取值集合恰好 5 个且与共享定义逐字一致，第 5 值 = dispatched_uncollected。
通过：5 值可见且第 5 值具名。
失败：第 5 值无名字或 status 不可见。
证据：node -e 断言输出。

- [ ] **AC-C4-007**：detail track 的 packet 内必然含技能材料子树（简洁性守卫、计划 CEO 审查、通用审查三张技能卡）。
场景：构造 detail 请求并检查 bundle 中可供审查者读取的技能材料集合。
验证：断言三张具名技能卡均随 packet 提供且内容可读。
通过：三张具名技能卡均存在并可读。
失败：packet 缺少技能材料集合或任一具名技能卡。
证据：bundle 内容清单与读取结果。

- [ ] **AC-C4-008**：异源判定按底层模型；比较键写死。
场景：检查 sameSourceProfile 比较键。
验证：断言新比较键用 broker identity.source_id（含 model）落到 identity.model，非 profile 键字符串相等。
通过：按底层模型判定。
失败：仍以 profile 键字符串相等判定。
证据：源码断言与针对性测试。

- [ ] **AC-C4-009**：故意构造无响应场景，审查在健康判死窗口内进入终态。
场景：fake provider 静默 managed run（构造方法见 PRD C4 §6 O-6）。
验证：轮询 managedStatus 断言 state 变 terminal 且 group.providers[].error.code === "SESSION_MANAGER_LOST"。
通过：判死窗口内终态。
失败：需要外层 timeout 才结束，或 30 分钟仍非终态。
证据：managedStatus 轮询记录。结算：本仓消费侧映射必须全过；判死逻辑本体由 3rd-review 自证（G-4），跨仓确认点被拒时本判据的跨仓部分如实标 `unknown`、不视为完成但不阻断本批。

- [ ] **AC-C4-010**：全流程无 `timeout` 外层命令。
场景：核对执行记录命令原文。
验证：grep -c '^timeout ' 执行记录 = 0。
通过：零外层 timeout。
失败：任何验收命令以 timeout 开头。
证据：grep 输出。

- [ ] **AC-C4-011**：managedPublic 字段集未变。
场景：源码比对字段集。
验证：broker 的 managedPublic 仍 version/request_id/runtime_id/state/material_id 五字段。
通过：字段集逐字不变。
失败：多加任一字段。
证据：源码比对记录。

- [ ] **AC-C4-012**：`PROCESS_STALLED` 进入失败枚举并可达成终态（跨仓确认点被拒时本判据跨仓部分如实标 `unknown`，见 AC-C4-009 结算）。
场景：provider-failure structuredCodes 检查 + FakeClock 驱动 health runner。
验证：枚举含 PROCESS_STALLED；await clock.tick(50) 后 decisions[0].error.code === "PROCESS_STALLED"。
通过：进枚举且 codes.has 可达。
失败：不在枚举，或进枚举仍不可达。
证据：3rd-review node --test 输出。

- [ ] **AC-C4-013**：`stalled` 在三处被接受（调用侧归类）。
场景：检查 review-provider-client（已是）、review-result 映射、attempt schema 的 group_outcome 枚举。
验证：三处均含 stalled（作为消费侧归类标签；v3 公开信封仍只有 4 个合法 outcome）。
通过：三处齐备。
失败：任一处缺 stalled。
证据：三处源码/枚举比对。

- [ ] **AC-C4-014**：ADR 与归档文档「沉默不杀进程」表述已改。
场景：检查 3rd-review 两份文档。
验证：v4-cli-contract ADR 与 v3-redesign 归档文档含指向本次方向修正的标注。
通过：标注存在。
失败：原文仍在而无标注。
证据：文档 diff。

- [ ] **AC-C4-015**：带 OI 快照的方向审查跑通并落 sink。
场景：FR-C4-017/FR-C4-018 落地后跑一次方向审查。
验证：① review_result_ref 可读回且输入含 decision_revision + OI 逐条 ref/sha256；② outline_closed 满足，或（本任务无宿主 bridge 时）如实登记为 unavailable/unknown 并留下可读回的落 sink 审查记录——两者居其一即算该条达成，不得伪造通过。
通过：①达成且②按上述口径达成。
失败：outline_closed 仍无结论且没有任何落 sink 的方向审查记录，或生产路径仍报 interaction_proof: missing。
证据：review_result_ref 读回记录与 status 输出。

- [ ] **AC-C4-016**：本任务两次审查被通道缺陷丢弃的 findings（方向 20 条 + 细节 41 条，合计 61 条，以 task store 原始证据保全件为准；PRD C4 卡第 16 条的 22+13 口径与本任务实测不一致，以实测为准并注明差异）补一次落 sink 的收取 → 关闭 OPN-2（OPN-2 = 3rd-review redesign 文档中的未决项：回收 finding 未落 sink 收取）。
场景：OPN-2 关闭动作。
验证：落 sink 记录可读回；收取件保持原始证据身份（review_origin 状态不因此改变、不作为 conducted 结果或正式 review_result 进入完成判定/status）。
通过：有落 sink 收取记录且身份边界保持。
失败：仍只有未记录证据。
证据：sink 记录。

- [ ] **AC-C4-017**：focus 复审输入组装不产生任何新文件且恰好五项齐备。
场景：组装前后 git status --porcelain 比对 + 五项断言。
验证：node --input-type=module -e 断言 need = finding_ref/minimal_diff/tests/source_tree/delta_verification 五项齐备且 Object.keys(input).length === 5；porcelain 无新增。
通过：零新增且五项齐备。
失败：出现新增/修改落盘对象，或缺任一项。
证据：porcelain 比对与断言输出。

- [ ] **AC-C4-018**：verify 输入是 Phase review 的 `review_result_ref` 指向的既有 K5 文件，结论区分来源，verify lens 未删改。
场景：verify 执行端读取改造。
验证：test -f ref = 0；结论分区断言；stage-materials 的 verify-code.problem_order 保持实测值；stage-handlers 点名段已改动。
通过：读 ref、区分来源、lens 保留。
失败：重审同一批 finding 却读不到 ref；结论不区分来源；problem_order 被改写；执行端未改动（任一）。
证据：读回记录、结论分区与 lens 比对。

- [ ] **AC-C4-019**：本卡 FR 清单含 `C4 卡第 19 条` 所有权条目，落点 FR-C4-008/FR-C4-009/FR-C4-010，C9 内无该职责实现项。
场景：卡间职责核对。
验证：C4 FR 清单含 FR-C4-019；C9 无 provider 生命周期实现项。
通过：所有权与独占成立。
失败：FR-C4-019 缺失；PRD 的 C9 卡第 6 条（provider 生命周期条目）未撤销；或出现第二份健康判死实现（任一）。
证据：两卡 FR 清单比对。

- [ ] **AC-C4-020**：健康终止契约 5 条结构齐备（探测周期存在、计时器 owner = 3rd-review、过期阈值 = 健康裁决非墙钟、忙但存活判据、数值归属 = 3rd-review）；判死不是外层墙钟。
场景：比对 PFACT-P05/PFACT-P06 与实现。
验证：语义项逐条可查（非墙钟、零本仓计时器、progressing/retry/busy 判据、数值归属）；具体数值以 3rd-review 实现证据为最终口径（本仓不重复冻结，OPEN-001）；idle_timeout_ms/max_duration_ms/deadline_ms/max_wall_clock_ms 均未启用；DEFAULT_MANAGED_TERMINAL_WAIT_MS 仅为显式兜底。
通过：5 条结构与语义项齐备、无墙钟。
失败：任一 elapsed-time 字段启用、本仓新增判死计时器、或把判死写成墙钟（任一）。
证据：实现源码与 3rd-review config 比对。

- [ ] **AC-C4-021**：T-11 通道验证实跑：改协议版本后同一材料在 24h TTL 内重跑成功、不产生 `REQUEST_ID_CONFLICT`；记录为通道验证（只记退出码，不产出 findings、不进 sink、不计审查轮次）。
场景：协议版本进请求身份后实跑一次（D-023 定性）。
验证：实跑退出码与重跑记录留证；managedPublic 字段集未变。
通过：可重跑且无冲突。
失败：仍撞 REQUEST_ID_CONFLICT；或 managedPublic 字段集被改；或实跑被计成审查轮次（任一）。
证据：实跑命令退出码与记录。

- [ ] **AC-C4-022**：形似允许名单收敛为一套（唯一来源），且 `MATERIAL_FORBIDDEN` 类错误直接列出全部合法取值（负例：传四个旧名单之一的键名必须报错并枚举合法值）。
场景：允许名单源码与负例测试。
验证：grep 生产代码旧名单定义零命中；构造四个旧键名负例断言报错文本含合法取值全列表。
通过：一套名单、错误枚举齐全。
失败：仍有第二份名单；或报错不列合法取值。
证据：grep 输出与负例测试退出码。

- [ ] **AC-C4-023**：`dispatch_state` 出现在顶层聚合结果（不再只在 `role_results.red/blue` 内）。
场景：构造一次成对审查并读取聚合结果。
验证：断言顶层结果对象含 dispatch_state 字段且取值正确（reused/dispatched 等）。
通过：顶层可见。
失败：仅 role 内可见或缺失。
证据：结果对象比对记录。

- [ ] **AC-C4-024**：§8 审查生命周期状态转移表落地且五态语义一致（completed/unavailable/incomplete/partial/unknown + cancelled/retry），OPEN-002 的 stalled 计入语义有结论。
场景：状态转移核对。
验证：表内每一行的事件、公开 outcome、review_origin、已完成部分、清理 owner、重试与批次放行可查；实现与表一致。
通过：表落地且一致。
失败：五态语义缺口或实现与表矛盾。
证据：§8 表与实现比对。

- [ ] **AC-C4-025**：通道保留 fixtures 可证伪：单侧 provider 失败、双侧均部分失败、provider_results 为空三组 fixture 下，归一化器不抛错、已完成 provider 的 findings 与 role 状态可从 sink/ref 读回、失败角色正确标记、不重复派发、不把正常 partial 情形降级为 unavailable。
场景：三组 fixture（单侧失败/双侧部分/provider_results 空）加两组对照（材料读取完成后失败必须为 unavailable；已派出未收齐必须为 dispatched_uncollected）针对性测试。
验证：vitest 运行断言组全绿（fixture 桩 + sink 读回 + 计数桩 + 五态边界对照）。
通过：三组全过。
失败：任一组抛错、丢已产出 findings、或降级 unavailable。
证据：针对性测试退出码与 sink 读回记录。

- [ ] **AC-C4-026**：跨仓人工确认点可验证：呈报内容（改哪些文件/改成什么/怎么验收/失败怎么办）有记录；收到真实答复前无跨仓写入（git log 3rd-review 仓验证）；被拒/无响应时本仓消费侧判据全过、跨仓判据记 `unknown` 且交接关闭条件登记。
场景：确认点事件与出口核对。
验证：确认记录存在；确认前记录 3rd-review 工作树+索引+未跟踪文件快照（git status --porcelain 全文哈希）、确认后跨仓写入前比对无未授权写入（覆盖任何文件写入，不只 commit 顺序）；出口形态与 §10 跨仓结算规则一致。
通过：确认先于写入、出口正确。
失败：未确认先写跨仓；或出口把跨仓判据记为通过。
证据：确认记录与 3rd-review 仓 git log。

### C5 验收标准

- [ ] **AC-C5-001**：按 OI-26 A/B/C/D 四类做 behavioral/symbol/use-site closure，不使用全局 literal-zero oracle。A 类 K2 `record_kind` 行身份及 `material_digest`/`snapshot_tree` 条件字段必须在 stage/close-action round-trip 后逐字保持；K5 具名 evidence 的 ref/hash/binding 必须不可变。B 类 freshness/currentness 比较、拒绝与自动重跑 use sites 必须消失；C 类仅测试/变体快照不进入当前 status authority；D 类按无 consumer 证明删除。已删 the predecessor current-plan validator 保持不存在且无 active consumer/write boundary。
场景：先读真实 K2 stage/close_action 与 K5 proof，再修改一个普通材料文件并重复 status/readback；另做 symbol/use-site 扫描。
验证：阶段行发布、验证阶段读回与材料编辑保留三组针对性行为用例证明 A 类 round-trip/immutable binding；计数桩证明材料编辑后不失效、不重跑；扫描只针对 freshness 比较函数和调用点，不因 `snapshot_tree` 字面存在而失败；前任 current-plan 校验器及其 active references 为 0。
通过：四类都有具名清单与可复算结果；A/K5 保留，B/D 清除，C 不越权，材料编辑不失效不重跑。
失败：A/K5 任一字段被删/重绑；材料编辑触发失效/重跑；freshness 比较 use site 仍可达；或 validator 被重建/仍有 active consumer（任一）。
证据：task-store/stage-row 测试、material-edit 行为测试、symbol/use-site 清单及删除证明。

- [ ] **AC-C5-002**：skill-deps 的 freshness/currentness dependency 声明被移除，但 K2/K5 identity/proof-binding 声明不因同名字面被误删。
场景：逐文件做 schema/consumer 语义核对。
验证：六份工作流技能依赖声明与对应阶段依赖契约不再把材料变化当失效输入；任务事实存储的 frozen 16 keys 与 K5 evidence validator 的 binding 字段仍在并有 reader。
通过：声明面不再驱动 freshness，身份/完整性声明仍闭合。
失败：仍存在 freshness dependency，或为追求字面 0 删除了 K2/K5 必需字段。
证据：声明 diff、consumer readback 与针对性测试。

- [ ] **AC-C5-003**：check-skill-closure 校验退出码 0。
场景：声明面一致性校验。
验证：技能闭合检查的受控命令退出码为 0。
通过：退出码 0。
失败：非 0（含 consumer identity invalid 与 schema 校验失败）。
证据：命令退出码。

- [ ] **AC-C5-004**：写口核对只比三项。
场景：inspectWriteBoundary 源码检查。
验证：violations 枚举无 SOURCE_SNAPSHOT_UNAVAILABLE/EXECUTION_CONTENT_IDENTITY_INVALID/INVOCATION_RECORD_HASH_MISMATCH；不读 invocation.contracts.*.sha256；不调用 captureGitWorktreeSnapshot/assertCurrentSourceDigest。
通过：三项收敛且禁项全消。
失败：任一禁项仍在。
证据：源码 grep 记录。

- [ ] **AC-C5-005**：写口核对真会拦；三项任一项不符 fail-loud；字节不符抛本规格定名的新文案 `write boundary source bytes mismatch`（旧 path-card 文案已随卡片删除、不作为判据）。
场景：三项负例行为测试。
验证：写口身份与左移校验的具名用例全绿；错 task_id、错工作区路径、字节不符三负例均抛。
通过：三负例均拦且字节项抛新文案。
失败：改任一项仍返回 valid；或字节校验被删/弱化/仍用旧文案断言。
证据：负例测试输出。

- [ ] **AC-C5-006**：改一个已审文件后旧绿灯不失效、不自动重跑。
场景：改材料字节后读既有事实。
验证：任何读路径不以材料字节差异拒绝既有事实。
通过：不失效不重跑。
失败：出现由材料内容变化触发的失效判定。
证据：行为验证记录。

- [ ] **AC-C5-007**：check-extensibility 替代判据可证伪（裁定 J-5 选 A 后判据不变）。
场景：「原内容改写」负例（check-extensibility 测试的 190-242 行段）。
验证：扩展性度量的具名受影响用例全绿。
通过：负例真报失败。
失败：造假后仍 PASS（恒真守卫）。
证据：测试输出。

- [ ] **AC-C5-008**：针对性测试全绿（PRD C5 §17 清单）。
场景：逐条跑 C5 §17 命令。
验证：7 条 vitest 命令 + check-skill-closure 单点全绿。
通过：清单内全绿。
失败：清单内任一文件非绿。
证据：逐条命令退出码。

- [ ] **AC-C5-009**：identity/path-cards 生产代码零命中；createPathCardRecord 与 PATH_CARD_WRITERS 已删；未连带弱化字节比对。
场景：源码 grep。
验证：grep -rn 'path-cards|createPathCardRecord|persistWriteBoundaryPathCard'（runtime/core/tools/skills，测试除外）无命中。
通过：零命中且字节比对强度不变。
失败：仍有命中；或为删卡片弱化字节比对。
证据：grep 输出与 AC-C5-005 负例复跑。

- [ ] **AC-C5-010**：CONTEXT.md 阶段完成判据一句由 C5 同批改写：不再引用 `material revision`/`snapshot`，改为 identity 三项 + facts.jsonl 本阶段行 + 六类具名 ref；只改该一句；C7 复核（HANDOFF-T2-007）。
场景：改写后逐字核对。
验证：grep 该句无 material revision/snapshot 字样，含 identity 三项与具名 ref 引用。
通过：改写达标。
失败：仍引用被删概念，或改了不止该一句。
证据：CONTEXT.md diff。

### C6 验收标准

- [ ] **AC-C6-001**：`status` 输出 = 根因行 + 具名 ref 集合。
场景：status 返回对象键检查。
验证：对象不含 product_release_status/product_release_reasons/product_release_input_refs/status_groups 任一键。
通过：四键全消。
失败：仍含任一键。
证据：status 输出比对。

- [ ] **AC-C6-002**：四个派生投影不存在。
场景：deriveStatusGroups 输出字段检查。
验证：输出不含 quality_gaps/release_gaps/close_preparation_gaps/actionable_now 任一字段。
通过：四投影全收。
失败：仍含任一字段。
证据：输出比对。

- [ ] **AC-C6-003**：`status_groups` 零消费者事实不再被违反。
场景：删除产出后检查新增 reader。
验证：全仓 grep 无新增 status_groups 消费者。
通过：零消费者保持。
失败：删产出后出现任何新消费者。
证据：grep 记录。

- [ ] **AC-C6-004**：quality/verify.json 与 release 投影对象不存在，Tier-C schema 的 distribution/registry closure 同批完成。
场景：具名 writer/reader、Runner release、architecture registry/inventory 与 targeted distribution tests 核查。
验证：① `runtime/schemas/quality-verify.v1.json` 不存在；② active code 不再 bootstrap/write/auth/read `quality/verify.json` 或 `quality-verify.v1`；③ Runner release 从“全量扫 `runtime/schemas/*.json`”收敛为显式 data dependency closure，仍包含所有 import.meta.url 所需 schema，但 release manifest 不含被删 schema；④ `docs/architecture/move-map.json`、`docs/architecture/deletion-plan.json`、`docs/architecture/repository-inventory.tsv` 与 active control-plane docs 登记本次用户再确认、consumer audit、replacement、negative oracle、clean-install 与 rollback evidence；⑤ distribution-closure、runner-clean-install、projection replacement 等针对性测试通过。`specs/archive/**` 命中允许且必须保持字节不变。
通过：对象、发布输入与当前登记完整退役，Runner clean install 不回读 Hub checkout，归档不改。
失败：只删 schema 而活对象仍在；Runner 仍靠全 schema glob/manifest 仍含该 schema；registry 仍 KEEP；或归档被改写（任一）。
证据：具名命中清单、release manifest readback、registry diff、targeted tests 与 archive byte check。

- [ ] **AC-C6-005**：close 不依赖已删投影。
场景：close 主文件依赖检查。
验证：不 import/调用 deriveCurrentProductRelease；不引用 deriveProductRelease。
通过：依赖清零。
失败：仍 import 或调用。
证据：grep 记录。

- [ ] **AC-C6-006**：validateRiskCloseQualityReasons 替代判据为等值判定且仍会拦。
场景：risk_close 负例两则。
验证：quality_reasons 与 status 根因行具名 ref 集合不等 → 抛；空数组 → 抛 delivery risk close requires at least one current quality gap；逐项全等 → 通过。
通过：等值判定且空集仍抛。
失败：可填任意内容而 close 成功；或判据非等值；或比对源仍是已删投影（任一）。
证据：负例/正例执行记录。

- [ ] **AC-C6-007**：Task I D-015③ stage publication 是 regression-only：写完 `facts.jsonl` → status 立即可读 → 同 stage 重放原位替换且不产生重复；不得新增 publication path。
场景：复跑现有 stage-row publication/readback/replay 测试，并验证 replacement 保留真实 review/reflection facts。
验证：阶段行发布与官方阶段运行两组针对性行为用例断言一行、即时可读、重放行数不增；stage-end replacement 不把 `review_origin` 重置为 `not_run` 或清空 `review_result_ref`。
通过：既有 seam 保持且真实 facts 合并保留。
失败：出现第二 writer/第二行，status 读不到，或 replacement 擦除 review/reflection facts。
证据：针对性测试输出与 writer symbol/use-site 清单。

- [ ] **AC-C6-008**：close 前置检查确实发生在 commit 之前。
场景：一次真实 close 中构造 merge 冲突观察顺序（经人确认，不可逆动作）。
验证：commit-delivery 执行前 merge 冲突/sidecar 已被拦下。
通过：冲突在 commit 前拦截。
失败：仍先 commit-delivery 再在 merge-task-branch 报冲突。
证据：close 观测记录。

- [ ] **AC-C6-009**：`non_stage` 工作流不再被 5 阶段谓词考核。
场景：build-prd 类收口检查。
验证：收口不产生 stage_completion_missing:<stage> ×5 或 expected_acceptance_ids_missing；谓词遍历集合仍为 STAGES 逐字未扩为 STAGE_KEYS。
通过：不被考核且集合钉死。
失败：仍产生 5 条判定；或遍历集合被改成 STAGE_KEYS（任一）。
证据：收口输出与源码比对。

- [ ] **AC-C6-010**：入口统一且 `--task-path` 来源被记录。
场景：三个 CLI 入口解析检查。
验证：--task-path 不再静默生效，使用时记录来源；无 --task-path 优先于 config resolver 且无标记的路径。
通过：来源必录。
失败：仍静默生效或无标记优先。
证据：入口行为验证记录。

- [ ] **AC-C6-011**：main 前进只报 stale、不冻结 base OID。
场景：主线前进后 status 与 close 行为。
验证：不再抛 baseline_commit does not match task worktree HEAD / local target baseline changed / task worktree HEAD must equal the make-decision baseline 类硬失败；stale 在 status 根因行报出带具体来源。
通过：报 stale 不冻结。
失败：仍硬失败。
证据：status 根因行输出。

- [ ] **AC-C6-012**：针对性测试全绿（PRD C6 §17 清单）。
场景：逐条跑 C6 §17 命令。
验证：plan/tasks 具名 targeted matrix（含 distribution closure、Runner clean install、投影替换行为）全绿；不以条数作 oracle。
通过：清单内全绿。
失败：清单内任一文件非绿。
证据：逐条命令退出码。

- [ ] **AC-C6-013**：`status`/`close` 读取来源恰 6 类具名 ref 且无 readdir 决定读取内容。
场景：读取路径源码检查。
验证：出现第 7 类来源即失败；readdirSync/readdir 不用于决定读取内容（允许具名目录存在性枚举且逐个 ref 点名）；K5 含 stage-outcome-proofs 仍在读取面。
通过：6 类闭集成立。
失败：第 7 类来源；readdir 决定内容；proofs 读点被删（任一）。
证据：源码 grep 记录。

- [ ] **AC-C6-014**：planning close 删除 freshness/currentness 要求后仍可完成且身份校验未被清空，同时三条既有 close route 与 `recordCloseActionRow` 保持。
场景：分别构造 legacy 5-step、unarchived planning 4-step、post-cleanup archive 2-step close；planning 输入携带 `planning.materials[file]` sha256 与 prd.md 附件。
验证：三 route exact step sets 均通过现有合同；每个已确认物理动作经 `recordCloseActionRow` 写/回读 `record_kind:"close_action"`；planning 分支仍验证材料 sha256/附件，但不拿材料 currentness 作拒绝条件；行写失败保持可见 `unavailable`。
通过：5/4/2 route、身份校验与 close-action readback 均保留。
失败：任一路由消失/混并；动作行不是既有 writer 产生；身份校验被清空；或 freshness 仍阻断正常 close（任一）。
证据：三类 close 合同行为的 targeted cases 与 symbol/readback 记录。

- [ ] **AC-C6-015**：stage-outcome-proofs 的具名 K5 readback 仍可用，但不参与 current-status authority（裁定 J-4）。
场景：构造 proof 与 K2 当前行结论不同时读取 status。
验证：proof 可按具名 ref/hash 认证和展示为 evidence/history；status 当前层状态由 K2 frozen row 决定，不因旧 proof 的 completed 值覆盖 K2 的 incomplete/unavailable。
通过：K5 可读且不越权。
失败：proof reader 被删，或旧 proof 决定当前 status。
证据：针对性行为测试与 reader symbol 清单。

- [ ] **AC-C6-016**：当前收口投影模块改写不删：模块仍存在且是任务收口的活 reader；product release 从状态域移除；该域改按具名 ref 读取路径取事实；治理登记表同步。
场景：改写后核对模块与读路径。
验证：聚焦行为用例从六类具名 ref 构造事实并读回预期投影；断言不再读取 product release 状态域，同时治理登记的 owner/consumer/replacement 一致。
通过：改写达标、文件保留。
失败：文件被删；或 product_release 域残留；或读路径仍是已删投影（任一）。
证据：文件存在性、grep 与登记表 diff。

- [ ] **AC-C6-017**：三块事实底座保留且 consumer 点名：status_matrix（consumer = status 根因行渲染与人工判读）、identity（consumer = 写口三项核对与入口解析）、source_completeness（consumer = stage-reflection 复盘与质量事实读回）；写不出的按 D-013 裁定。
场景：三块底座与 consumer 点名核对。
验证：三块各自存在且 consumer 具名可查。
通过：三块保留、consumer 齐。
失败：任一块被删或 consumer 无名。
证据：源码与文档比对。

## 12. 风险、未决与交接

- spec-clarify trigger=false reason=规格事实全部来自已确认决定链与 PRD 卡（方向、数值、闭集均已写死），无材料层歧义 open_direction_changing_questions=0
- **OPEN-001**：健康判死接线的具体落地归 C4 跨仓实现；阈值数值以 3rd-review v4 config / health-runner 为准（本仓只消费终态，契约值见 PFACT-P05）。
- **OPEN-002**：`stalled` 在下游结果映射中的语义（等同 `unavailable` 计入阶段完成行）—— owner=任务Ⅱ C4。
- **OPEN-003**：T-11 修复的实跑验证结果 —— owner=任务Ⅱ C4 build-code/verify（请求身份白名单修复已落地，协议版本进身份待 C4 实现后实跑）。
- **OPEN-004**：C9 的准确净增行数 —— owner=任务Ⅱ build-code 末回填。
- **OPEN-005**：measure-test-runtime-profile 能否被 C9 复用 —— owner=任务Ⅱ C9 开工评估（FR-C9-007）。
- **U-a ~ U-h**：见 decision-log §4.7（owner=任务Ⅲ C8，HANDOFF-T2-005）。
- **RISK-009**：验收不直接证明「机制开销净降」—— accepted_risk，不加行为型判据。
- **RISK-002**：跨仓部分本仓不可闭合 —— 如实标 `unknown`，HANDOFF-T2-003；跨仓结算规则见 §10 默认必须成立。
- **HANDOFF-T2-001~007**：7 条具名交接项（owner/触发/关闭条件见 decision-log §3.5）。
- **跨仓确认点**：C4 动 3rd-review 仓前一个人工确认点；被拒则只交本仓消费侧、跨仓标 `unknown`、不停批。
- **build-plan 边界**：plan 只细化本规格与决定链，不重新发明需求；测试 oracle 与命令在 plan/tasks 落执行细节。

## 13. 业务影响与回归范围

- 机制开销净降是本任务主线（R-005/R-006）；C9 收益体现在 wall-clock（不再 900 秒空等、单次门不再复现），C4 收益体现在审查不再卡死且做过的算数，C5 收益体现在绿灯不失效、验证成本可预测，C6 收益体现在收口只报根因。
- 回归范围：仅 PRD C9/C4/C5/C6 四卡受影响测试清单（各卡 §17）；每批只跑本批清单，禁止全量回归；npm run check 全链仅 C4 删预算时按例外条款跑一次、C8 末次跑一次记退出码。
- 不劣化判据：三条守卫基线（AC-TLD-001/002/003）+ 任务级三条总账（AC-TLD-004/005/006，C8 消费）+ M4 主仓 git 净行数为负。

## 来源与决策映射

| 原始需求 | 决定 | 规格 FR | 规格 AC |
| --- | --- | --- | --- |
| R-001 | D-016 | FR-C9-001, FR-C9-002, FR-C9-003, FR-C9-004, FR-C9-005, FR-C9-006, FR-C9-007, FR-C4-001, FR-C4-002, FR-C4-003, FR-C4-004, FR-C4-005, FR-C4-006, FR-C4-007, FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011, FR-C4-012, FR-C4-013, FR-C4-014, FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018, FR-C4-019, FR-C4-020, FR-C5-001, FR-C5-002, FR-C5-003, FR-C5-004, FR-C5-005, FR-C5-006, FR-C5-007, FR-C5-008, FR-C5-009, FR-C6-001, FR-C6-002, FR-C6-003, FR-C6-004, FR-C6-005, FR-C6-006, FR-C6-007, FR-C6-008, FR-C6-009, FR-C6-010, FR-C6-011, FR-C6-012, FR-C6-013 | AC-C9-001, AC-C9-002, AC-C9-003, AC-C9-004, AC-C9-005, AC-C9-006, AC-C9-007, AC-C9-008, AC-C9-009, AC-C9-010, AC-C9-011, AC-C4-001, AC-C4-002, AC-C4-003, AC-C4-004, AC-C4-005, AC-C4-006, AC-C4-007, AC-C4-008, AC-C4-009, AC-C4-010, AC-C4-011, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-015, AC-C4-016, AC-C4-017, AC-C4-018, AC-C4-019, AC-C4-020, AC-C4-021, AC-C4-022, AC-C4-023, AC-C4-024, AC-C4-025, AC-C4-026, AC-C5-001, AC-C5-002, AC-C5-003, AC-C5-004, AC-C5-005, AC-C5-006, AC-C5-007, AC-C5-008, AC-C5-009, AC-C5-010, AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005, AC-C6-006, AC-C6-007, AC-C6-008, AC-C6-009, AC-C6-010, AC-C6-011, AC-C6-012, AC-C6-013, AC-C6-014, AC-C6-015, AC-C6-016, AC-C6-017 |
| R-002 | D-017 | FR-C9-001, FR-C9-002, FR-C9-003, FR-C9-004, FR-C9-005, FR-C9-006, FR-C9-007, FR-C4-001, FR-C4-002, FR-C4-003, FR-C4-004, FR-C4-005, FR-C4-006, FR-C4-007, FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011, FR-C4-012, FR-C4-013, FR-C4-014, FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018, FR-C4-019, FR-C4-020, FR-C5-001, FR-C5-002, FR-C5-003, FR-C5-004, FR-C5-005, FR-C5-006, FR-C5-007, FR-C5-008, FR-C5-009, FR-C6-001, FR-C6-002, FR-C6-003, FR-C6-004, FR-C6-005, FR-C6-006, FR-C6-007, FR-C6-008, FR-C6-009, FR-C6-010, FR-C6-011, FR-C6-012, FR-C6-013 | AC-C9-001, AC-C9-002, AC-C9-003, AC-C9-004, AC-C9-005, AC-C9-006, AC-C9-007, AC-C9-008, AC-C9-009, AC-C9-010, AC-C9-011, AC-C4-001, AC-C4-002, AC-C4-003, AC-C4-004, AC-C4-005, AC-C4-006, AC-C4-007, AC-C4-008, AC-C4-009, AC-C4-010, AC-C4-011, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-015, AC-C4-016, AC-C4-017, AC-C4-018, AC-C4-019, AC-C4-020, AC-C4-021, AC-C4-022, AC-C4-023, AC-C4-024, AC-C4-025, AC-C4-026, AC-C5-001, AC-C5-002, AC-C5-003, AC-C5-004, AC-C5-005, AC-C5-006, AC-C5-007, AC-C5-008, AC-C5-009, AC-C5-010, AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005, AC-C6-006, AC-C6-007, AC-C6-008, AC-C6-009, AC-C6-010, AC-C6-011, AC-C6-012, AC-C6-013, AC-C6-014, AC-C6-015, AC-C6-016, AC-C6-017, AC-FLW-001 |
| R-005 / R-006 | D-015 | FR-C9-001, FR-C4-002, FR-C4-003, FR-C5-001, FR-C5-002, FR-C6-002, FR-C6-003 | AC-TLD-001, AC-TLD-002, AC-TLD-003, AC-TLD-004, AC-TLD-005, AC-TLD-006 |
| R-007 | D-006 / D-007 / D-008 / D-009 | FR-C4-001, FR-C4-007, FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011, FR-C4-019, FR-C4-020, FR-C4-021 | AC-C4-004, AC-C4-009, AC-C4-010, AC-C4-011, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-020, AC-C4-021, AC-C4-026 |
| R-008 | D-010 | FR-C5-001, FR-C5-002, FR-C5-003, FR-C5-004, FR-C5-005, FR-C5-006, FR-C5-007, FR-C5-008, FR-C5-009 | AC-C5-001, AC-C5-002, AC-C5-003, AC-C5-004, AC-C5-005, AC-C5-006, AC-C5-007, AC-C5-008, AC-C5-009, AC-C5-010 |
| R-009 | D-003 / D-004 | FR-C9-001, FR-C9-002, FR-C9-003, FR-C9-004, FR-C9-005, FR-C9-006, FR-C9-007 | AC-C9-001, AC-C9-002, AC-C9-003, AC-C9-004, AC-C9-005, AC-C9-006, AC-C9-007, AC-C9-008, AC-C9-009, AC-C9-010, AC-C9-011 |
| R-010 | D-016 | FR-C9-001, FR-C4-001, FR-C5-001, FR-C6-001 | AC-C9-001, AC-C4-001, AC-C5-001, AC-C6-001 |
| R-011 | D-001 | FR-C9-001, FR-C4-001, FR-C5-001, FR-C6-001 | AC-C9-001, AC-C4-001, AC-C5-001, AC-C6-001 |
| R-012（C9 卡） | D-003 / D-004 / D-005 | FR-C9-001, FR-C9-002, FR-C9-003, FR-C9-004, FR-C9-005, FR-C9-006, FR-C9-007 | AC-C9-001, AC-C9-002, AC-C9-003, AC-C9-004, AC-C9-005, AC-C9-006, AC-C9-007, AC-C9-008, AC-C9-009, AC-C9-010, AC-C9-011 |
| R-019（任务Ⅰ 交接） | D-017 / HANDOFF-001 / HANDOFF-002 | FR-C4-012, FR-C5-001 | AC-C5-001, AC-C5-009, AC-C4-012 |
| D-022（行型字段改名） | D-022 | FR-C5-004, FR-C6-009 | AC-C5-002, AC-C5-003 |
| R-013（C4 卡） | D-006 / D-009 / D-030 | FR-C4-001, FR-C4-002, FR-C4-003, FR-C4-004, FR-C4-005, FR-C4-006, FR-C4-007, FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011, FR-C4-012, FR-C4-013, FR-C4-014, FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018, FR-C4-019, FR-C4-020 | AC-C4-001, AC-C4-002, AC-C4-003, AC-C4-004, AC-C4-005, AC-C4-006, AC-C4-007, AC-C4-008, AC-C4-009, AC-C4-010, AC-C4-011, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-015, AC-C4-016, AC-C4-017, AC-C4-018, AC-C4-019, AC-C4-020, AC-C4-021, AC-C4-022, AC-C4-023, AC-C4-024, AC-C4-025 |
| R-014（C5 卡） | D-010 / D-019 | FR-C5-001, FR-C5-002, FR-C5-003, FR-C5-004, FR-C5-005, FR-C5-006, FR-C5-007, FR-C5-008, FR-C5-009 | AC-C5-001, AC-C5-002, AC-C5-003, AC-C5-004, AC-C5-005, AC-C5-006, AC-C5-007, AC-C5-008, AC-C5-009, AC-C5-010 |
| R-015（C6 卡） | D-012 / D-013 / D-021 | FR-C6-001, FR-C6-002, FR-C6-003, FR-C6-004, FR-C6-005, FR-C6-006, FR-C6-007, FR-C6-008, FR-C6-009, FR-C6-010, FR-C6-011, FR-C6-012, FR-C6-013 | AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005, AC-C6-006, AC-C6-007, AC-C6-008, AC-C6-009, AC-C6-010, AC-C6-011, AC-C6-012, AC-C6-013, AC-C6-014, AC-C6-015, AC-C6-016, AC-C6-017 |
| R-018（裁定 G/I/J） | D-006 / OI-10 / OI-12 | FR-C4-001, FR-C4-006, FR-C4-007, FR-C4-019, FR-C4-020, FR-C6-003, FR-C6-004, FR-C6-008 | AC-C4-006, AC-C4-008, AC-C4-019, AC-C4-020, AC-C4-021, AC-C6-006, AC-C6-009, AC-C6-013 |
| R-001（总账） | D-001 / OI-15 | FR-C9-001, FR-C4-002, FR-C5-001, FR-C6-002 | AC-TLD-001, AC-TLD-002, AC-TLD-003, AC-TLD-004, AC-TLD-005, AC-TLD-006 |
