# WorkflowHub 可信度恢复

> 状态：方向已由用户确认；本文件只冻结恢复方向、边界和交接，不授权实施、提交、推送、合并或关闭。
> 当前正式任务：`workflowhub-trust-recovery`；正式工作树由 WorkflowHub `stage-runtime` 准备。

## 原始需求

- **R-001**：在可信 clone 中恢复 WorkflowHub 交付可信度，严格从 `make-decision` 开始，真实使用 Talk、Grill、独立 `wh-review`、decision-log、build-spec、build-plan；不得跳阶段，不得让 build-spec 补方向需求。来源：用户 delegation `source_thread_id=01a02cc9-efeb-7fa1-bf1a-a57dfd531979`；原文：“必须按标准 WorkflowHub 从 make-decision 开始……不要跳阶段，也不依赖 build-spec 补需求。” 处理：current，D-001。
- **R-002**：WorkflowHub 恢复优先；PaperBuilder 前端 WIP 冻结但保留，不迁移、追认或提交。来源：同一 delegation；原文：“先恢复 WorkflowHub 交付可信度，PaperBuilder 前端 WIP 冻结但保留。” 处理：current，D-002。
- **R-003**：只有干净、已提交、可定位快照能产生正式阶段事实；dirty worktree 只能本地诊断。来源：同一 delegation；原文：“只有干净、已提交、可定位快照能产生正式阶段事实，dirty worktree 只能本地诊断。” 处理：current，D-003。
- **R-004**：`dsh-code-review` 只做诊断；带 broker provenance 的 `wh-review` 才能满足正式 `verify-code.code_review`。来源：同一 delegation；原文：“dsh-code-review 仅诊断，带 broker provenance 的 wh-review 才能满足正式 verify-code.code_review。” 处理：current，D-004。
- **R-005**：使用已有 bundle/catalog 生成与校验流程恢复技能闭包，优先修已有能力。来源：同一 delegation；原文：“用已有 bundle/catalog 生成与校验流程恢复技能闭包。” 处理：current，D-005。
- **R-006**：`stage-runtime` 是唯一正式 writer，bridge 只传窄 session outcome；不增加第二 writer。来源：同一 delegation；原文：“stage-runtime 是唯一正式 writer，bridge 只传窄 session outcome。” 处理：current，D-006。
- **R-007**：必做 skill/step 必须 `completed`；`not_applicable` 只用于明确条件项，不能替代 `wh-review`；旧 evidence 只能展示，不能满足 vNext 完成谓词。来源：同一 delegation；原文：“必做 skill/step 必须 completed，not_applicable 仅用于明确条件项且绝不替代 wh-review；旧 evidence 只能展示，不能满足 vNext 完成谓词。” 处理：current，D-007。
- **R-008**：actionable major/blocking finding 要么修复，要么明确承担风险；保留 unavailable/unknown/incomplete；禁止新增第二状态机、永久 compatibility/replacement 链、stage 或把 local/self review 伪装成异源质量结论。来源：同一 delegation；原文：“actionable major/blocking finding 保留‘修复或明确承担风险’……任何 unavailable/unknown/incomplete 如实保留。” 处理：current，D-008。
- **R-009**：交付四份材料，并覆盖宪法逐条设计审查、旧消费者兼容矩阵、RED/GREEN 合同与运行时验证设计、精确文件边界、rollback、逐 AC oracle、独立 review 计划。来源：同一 delegation；原文：“需要完成：宪法逐条设计审查、旧消费者兼容矩阵、RED/GREEN 合同与运行时验证设计、精确文件边界、rollback、逐 AC oracle、独立 review 计划。” 处理：current，D-009。
- **R-010**：历史 PaperBuilder 材料与当前归档 UI 合同只可读参考；旧 P3/T005-T007 的 runtime/session/freshness/code-review 越界改动不构成当前授权。来源：同一 delegation 的历史输入约束。处理：historical/evidence-only，D-010。

## 目标

- 恢复一个可验证的 WorkflowHub 正式交付链：skill closure、唯一 writer、窄 bridge、当前 snapshot 绑定、异源 review 和 vNext 完成谓词各自可观察。
- 保持 PaperBuilder 当前 WIP 不动；恢复完成后，下一项产品验收只规划“核心策略列表 → 工作台状态矩阵”，再规划全站前端批次。
- 让所有缺失、未知、过期、不可用、未完成和冲突结果原样可见；不把绿色局部测试、注册可见、空 finding 或旧 evidence 当作交付通过。

## 成功/失败边界

- 成功边界：四份当前材料完整；恢复计划能逐 AC 指出行为、场景、oracle、测试命令、证据路径、限制和回滚；现有 bundle/catalog、stage-runtime、bridge、review、旧 evidence 消费者的兼容边界被明确；并且至少能观测到三类恢复信号：同一生成/校验命令对发布物和 catalog 给出一致闭包结果、正式 quality namespace 只有 stage-runtime/TaskKernel 写入、bridge 只交付窄 session outcome 且乱序/重叠 fail-closed。任一信号无法绑定当前干净 snapshot，计划不得宣称“可信度已恢复”；当前计划经独立 `wh-review` 和 `spec-analyze` 后等待用户确认。
- 失败边界：当前任务不实施 WorkflowHub 修复、不触碰 PaperBuilder WIP、不提交/推送/合并/关闭；不能证明的 provider、runtime、浏览器、旧 evidence 消费或历史结果保持 `unknown`/`unavailable`/`incomplete`。

## 范围

- 当前范围：恢复现有技能闭包生成/校验链；收紧正式质量事实写入到 `stage-runtime`/TaskKernel；验证 bridge 只传窄 session outcome；明确 `dsh-code-review` 与带 broker provenance 的 `wh-review` 分层；验证旧 evidence 只读展示；设计兼容矩阵、RED/GREEN、逐 AC oracle、回滚和独立 review。
- 当前正式材料：只在正式 task worktree 的 `specs/workflowhub-trust-recovery/` 维护 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。
- 当前产品后续交接：WorkflowHub 恢复后，PaperBuilder 先做核心策略列表到回测工作台状态矩阵验收；全站前端拆批次延期。
- 历史输入：用户列出的 PaperBuilder 四份材料与本仓 `specs/archive/ui-frontend-delivery-contract/` 只做证据参考，不成为当前文件边界或实现授权。

## 非目标

- 不修改或读取旧损坏 WorkflowHub 目录的 WIP，不迁移、追认、提交或修复其中的 Git 对象。
- 不实施本任务的代码修复；不提交、推送、合并、归档、清理或关闭。
- 不新增 stage、公共命令、第五材料、独立状态机、第二 writer、第二 quality store 或永久 replacement/compatibility/rebind 链。
- 不把 PaperBuilder 前端 WIP 改成当前 WorkflowHub 的正式证据；不把 T04 或历史 accepted/review/receipt 当当前事实。
- 不把 `dsh-code-review`、本地 self-review、Git clean、注册/doctor、bundle 可见性或空 findings 当作异源质量结论。

## 决定

### D-001

- question/final_option：从哪里开始；选择标准 `make-decision` 全流程。
- recommendation/plain_language：推荐；先把方向和边界说清，再写规格和计划，后面不能偷偷补需求。
- decision：按 `make-decision → build-spec → build-plan` 执行，实际实施留给用户后续明确授权。
- source_type/reference/exact_excerpt：user_requirement / R-001 / “必须按标准 WorkflowHub 从 make-decision 开始……不要跳阶段，也不依赖 build-spec 补需求。”
- approval_binding：用户已在 source thread 的方向确认中批准流程；当前材料仍等待 build-plan 计划确认，不把方向确认扩大为实现授权。
- facts_and_constraints：四份材料是当前工作真相；旧正式结果不是当前 task 的许可。
- 可观测恢复判据：P1 必须让现有 bundle/catalog 生成与校验对同一发布物闭合；P2 必须证明正式 `quality/*` 只有 `stage-runtime`/TaskKernel 写入且 bridge 只交付窄 outcome；P3 必须证明 broker-provenance `wh-review` 与旧 evidence 的 current-snapshot 边界。缺任一当前 snapshot 绑定、真实 oracle 或失败语义，保留 `unknown`/`incomplete`，不请求把“可信度已恢复”写成通过。
- Logic: 明确流程约束 -> 保持阶段 owner -> 先完成方向/规格/计划 -> 再请求计划确认。
- choice_reason/impact：避免后续阶段补产品决策；影响所有材料顺序和用户交互点。
- consequences_and_risks：节奏较慢但可追溯；若 Talk/Grill/review 缺失，阶段只能保持 incomplete。
- rejected_alternatives：直接 build-spec/build-plan（会补需求）；先实现再补证据（越界）。
- unresolved_items/owner：计划确认由用户在 build-plan 末尾完成。
- Supersedes：none。

### D-002

- question/final_option：两个项目先做什么；选择先恢复 WorkflowHub，PaperBuilder WIP 冻结保留。
- recommendation/plain_language：推荐；先修工具链可信度，后续 PaperBuilder 才有可靠验收依据。
- decision：本任务只恢复 WorkflowHub 可信交付链；PaperBuilder 下一阶段只接收恢复后的交接范围。
- source_type/reference/exact_excerpt：user_requirement / R-002 / “先恢复 WorkflowHub 交付可信度，PaperBuilder 前端 WIP 冻结但保留。”
- approval_binding：用户已确认 1A；冻结不等于接受 WIP，也不授权提交。
- facts_and_constraints：PaperBuilder 历史材料有跨阶段越界内容；旧 WIP 不在当前可信 clone 的授权边界。
- Logic: 工具链不可信 -> 产品验收无法解释 -> 先恢复工具链 -> 再做列表到工作台验收。
- choice_reason/impact：缩小当前交付到可信基础；PaperBuilder 全站工作延期。
- consequences_and_risks：短期没有产品页面交付；后续必须重新绑定真实 PaperBuilder snapshot。
- rejected_alternatives：同步修两个项目（边界混杂）；先改 PaperBuilder（无法证明 WorkflowHub 质量）。
- unresolved_items/owner：PaperBuilder 状态矩阵由后续 make-decision/build-spec 重新绑定。
- Supersedes：none。

### D-003

- question/final_option：什么能产生正式事实；选择 clean、committed、locatable snapshot。
- recommendation/plain_language：推荐；同一份提交才能让别人复核“谁在什么内容上跑了什么”。
- decision：dirty worktree 只做本地诊断；正式 stage outcome、review 和 completion 必须绑定当前干净提交与当前材料 revision。
- source_type/reference/exact_excerpt：user_requirement / R-003 / “只有干净、已提交、可定位快照能产生正式阶段事实。”
- approval_binding：用户已确认 2A；不因旧记录可读而放宽当前绑定。
- facts_and_constraints：F3/F6/F9 要求正式 publication fail-loud；当前 closure 与 runtime 都有 snapshot/hash 校验。
- Logic: dirty 内容可变 -> 事实不可复核 -> 只允许诊断 -> 正式 writer 认证当前 snapshot。
- choice_reason/impact：增加一次认证成本，换取 lineage 可信度。
- consequences_and_risks：本地调试结果不能直接完成阶段；误绑时必须报错而不是回退。
- rejected_alternatives：把 dirty 内容映射到 HEAD；复用历史 snapshot；自动 rebind。
- unresolved_items/owner：后续实现需验证乱序/重叠事件不会绕过 snapshot 认证。
- Supersedes：none。

### D-004

- question/final_option：正式代码质量来自哪里；选择 broker-provenance 的 `wh-review`，`dsh-code-review` 仅诊断。
- recommendation/plain_language：推荐；本地看代码可以发现问题，但不能冒充异源评审。
- decision：`verify-code.code_review` 只接受当前 snapshot/material 绑定的 canonical `wh-review` review fact；dsh 结果只能作为诊断输入。
- source_type/reference/exact_excerpt：user_requirement / R-004 / “dsh-code-review 仅诊断，带 broker provenance 的 wh-review 才能满足正式 verify-code.code_review。”
- approval_binding：用户已确认 3A；provider unavailable/timeout 仍保留真实状态。
- facts_and_constraints：Q3 要求异源质量裁决；review runner 已有 provider/source/material identity 合同。
- Logic: local/self review 无异源 provenance -> 不能满足正式质量结论 -> canonical wh-review -> verify completion 才可消费。
- choice_reason/impact：避免把结构检查误报为质量通过；需要保持 review attempt/result/output provenance。
- consequences_and_risks：provider 不可用时 verify 保持 incomplete；不能用空 finding 绕过。
- rejected_alternatives：dsh 直接写 code_review；本地 launcher 自评；旧 review 迁入当前 completion。
- unresolved_items/owner：后续实现验证不同 profile/source_id/model binding 的异源性。
- Supersedes：none。

### D-005

- question/final_option：如何恢复 skill closure；选择复用现有 bundle/catalog 生成与校验流程，先修漂移。
- recommendation/plain_language：推荐；少造一套系统，先让已有发布和校验路径对同一内容负责。
- decision：以 `skill-bundle-release`、local resolver、catalog 和现有 closure tests 为唯一计划入口；禁止新增第二 bundle truth。
- source_type/reference/exact_excerpt：user_requirement / R-005 / “用已有 bundle/catalog 生成与校验流程恢复技能闭包。”
- approval_binding：用户确认恢复范围；当前基线的 7 个 bundle hash mismatch 保留为事实。
- facts_and_constraints：当前 `npm run check:skill-closure` 失败；发布器与 checker 的闭合关系需要 RED/GREEN 证明。
- Logic: 现有闭包有可定位漂移 -> 复用同一生成/校验链 -> 修复 hash/consumer 绑定 -> 同命令恢复。
- choice_reason/impact：只扩充现有检查语义；影响发布、resolver、catalog 和相关 contract tests。
- consequences_and_risks：catalog 与发布包边界仍可能不同；未验证前不能宣称 closure 完成。
- rejected_alternatives：手工改 bundle hash；复制旧 bundle；新建替代 catalog。
- unresolved_items/owner：实现阶段确认发布命令是否强制先做 closure validation。
- Supersedes：none。

### D-006

- question/final_option：正式 quality 写入由谁负责；选择 `stage-runtime`/TaskKernel 单一写入链，bridge 只传窄 outcome。
- recommendation/plain_language：推荐；一个地方写正式事实，bridge 只搬运结果，出了错能尽早报出来。
- decision：禁止 direct `quality/*` production writer 竞争 canonical namespace；旧 quality-store 只能保留为明确历史读取或测试 fixture，是否删除由实现验证决定。
- source_type/reference/exact_excerpt：user_requirement / R-006 / “stage-runtime 是唯一正式 writer，bridge 只传窄 session outcome。”
- approval_binding：用户确认恢复范围；不新增第二 writer 或永久 compatibility 链。
- facts_and_constraints：当前代码存在 TaskKernel/canonical writer 与 quality-store direct write 的并存风险；bridge 已有窄 outcome 入口。
- Logic: 多 writer -> 同名事实可覆盖/分叉 -> 单一 writer -> 正式 namespace 可认证。
- choice_reason/impact：增强 immutable lineage；需要迁移现有 direct writer 的消费者到既有 owner。
- consequences_and_risks：旧测试/调用方可能失败；不能用双写过渡长期掩盖问题。
- rejected_alternatives：再加 compatibility writer；保留双写；让 bridge 自己写 quality facts。
- unresolved_items/owner：实现阶段列出所有 direct writer 反向引用并按最小边界处理。
- Supersedes：none。

### D-007

- question/final_option：缺条件/缺证据如何表示；选择 required completed、conditional not_applicable、真实 unavailable/unknown/incomplete。
- recommendation/plain_language：推荐；没做就是没做，条件不适用也要说清原因。
- decision：必做 step/skill 必须 completed；not_applicable 必须有明确条件、`trigger=false`、`executed=false`，不能替代 wh-review；旧 evidence 只可展示。
- source_type/reference/exact_excerpt：user_requirement / R-007 / “必做 skill/step 必须 completed……旧 evidence 只能展示，不能满足 vNext 完成谓词。”
- approval_binding：用户确认恢复范围；不把 legacy read 变成 current completion。
- facts_and_constraints：vNext stage runner 已拒绝旧 namespace；completion predicates 依赖当前质量事实与 snapshot。
- Logic: 完成谓词需要当前事实 -> 旧/缺失事实不能满足 -> 保留真实状态 -> completion 保持未完成。
- choice_reason/impact：让 status/close/release 真实；可能暴露更多 incomplete。
- consequences_and_risks：恢复初期质量状态会变差；必须提供同 task 修复路径。
- rejected_alternatives：空 findings 视为 completed；历史 receipt 自动 rebind；not_applicable 代替 review。
- unresolved_items/owner：实现阶段验证旧 `receipts/`、`reviews/`、`evidence/` 的所有 current readers。
- Supersedes：none。

### D-008

- question/final_option：严重 finding 如何处理；选择修复或绑定具体风险承担，保留原 verdict。
- recommendation/plain_language：推荐；发现大问题后可以继续修，但不能假装问题不存在。
- decision：actionable major/blocking finding 必须在完成/交接前有 `fixed` 或绑定该 finding 的 `accepted_risk`；一般 finding、unavailable、unknown、incomplete 原样保留。
- source_type/reference/exact_excerpt：user_requirement / R-008 / “actionable major/blocking finding 保留‘修复或明确承担风险’。”
- approval_binding：用户确认恢复范围；不把风险承担写成 reviewer pass。
- facts_and_constraints：F4/Q1 已规定 serious finding 处置不作为修复准入 gate；当前 stage handlers 有 disposition/risk acceptance 路径。
- Logic: serious finding 未处置 -> 完成声明不可信 -> 修复或明确承担 -> 保留事实并限制结论。
- choice_reason/impact：质量结论有后果绑定；同 task 仍能继续修复。
- consequences_and_risks：需要额外人工选择；风险承担必须精确到 finding 和 current snapshot。
- rejected_alternatives：删除 finding；自动 accepted；因 finding 新建 successor task。
- unresolved_items/owner：实现阶段验证 disposition 与 review result 的 hash/identity 绑定。
- Supersedes：none。

### D-009

- question/final_option：恢复设计是否扩大平台；选择最小复用、无新 stage/状态机/第二 writer。
- recommendation/plain_language：推荐；只补真实缺口，不为了机器可校验再堆一套控制面。
- decision：恢复范围限于现有 closure、writer、bridge、review、legacy-reader 和 tests 的窄修改；每个新增机制若无法证明 consumer/owner/deletion condition 就停回计划。
- source_type/reference/exact_excerpt：user_requirement / R-008/R-009 / “禁止新增第二 writer、永久 compatibility/replacement 链、新状态机、新 stage。”
- approval_binding：用户确认恢复范围；当前只写设计，不授权实现。
- facts_and_constraints：F5/F8/F10/S1 约束复杂度；当前 baseline 已有可复用入口。
- Logic: 目标是恢复可信度而非平台重写 -> 复用已有 owner -> 只增最小 contract tests -> 保留 rollback。
- choice_reason/impact：降低回滚面；需要精确文件边界和逐 AC 证明。
- consequences_and_risks：有些历史路径只能保留 read-only；不能承诺一次性清空全部遗留代码。
- rejected_alternatives：新 recovery state machine；永久 replacement chain；把 architecture inventory 变成 runtime dependency。
- unresolved_items/owner：实现阶段由 plan task 的 STOP 条件处理真正的新架构需求。
- Supersedes：none。

### D-010

- question/final_option：恢复后 PaperBuilder 怎么排；选择先做策略列表→工作台状态矩阵，再拆全站批次。
- recommendation/plain_language：推荐；先验证最重要的真实闭环，再扩到全站，风险更可控。
- decision：本任务只写交接顺序，不把 PaperBuilder 实现加入恢复计划。
- source_type/reference/exact_excerpt：user_requirement / R-010 / “WorkflowHub 恢复后，先补 PaperBuilder 核心列表→工作台状态矩阵验收，再拆全站前端批次。”
- approval_binding：用户确认 4A；当前不改变 PaperBuilder WIP。
- facts_and_constraints：历史 PaperBuilder 四份材料只可读；其 core list→workbench 方向是后续输入，不是当前 WorkflowHub code boundary。
- Logic: WorkflowHub 恢复是前置 -> 真实产品验收先选最小核心闭环 -> 再按事实拆批次。
- choice_reason/impact：后续验证更集中；全站视觉/前端优化延期。
- consequences_and_risks：PaperBuilder 当前状态矩阵仍需重新核验；不能提前复用旧 execution facts。
- rejected_alternatives：先全站重构；先做 T04 全量基础；同步修改两个仓库。
- unresolved_items/owner：恢复完成后由新 make-decision 任务确认真实页面、状态与 AC。
- Supersedes：none。

## 三轮 talk

- **T-001 / Talk round 1**：四个独立轴：恢复顺序、正式 snapshot、review authority、后续产品顺序。实际用户回复：`好的，确认这些决策；1A 2A 3A 4A，按计划执行吧。` 来源：source thread `01a02cc9-efeb-7fa1-bf1a-a57dfd531979`；队列变化：方向收敛为 D-002 至 D-004、D-010；未把该回复扩展成实现授权。
- **T-002 / Talk round 2**：当前用户 delegation 又明确 bundle/catalog、唯一 writer、窄 bridge、completion 语义和旧 evidence 边界。处理：`no_new_requirement`，这些是已确认约束，不另造产品选择；队列变化：转入事实研究、宪法审查和兼容矩阵。
- **T-003 / Talk round 3**：当前用户明确交付物、STOP 边界和“build-plan 后请求计划确认”。处理：`no_new_requirement`，只补执行设计，不改变方向；队列变化：转入 build-spec/build-plan，最终实现需等待用户计划确认。
- Talk 真实性边界：T-001 的 ask/wait/reply/resume 来自 source thread 的真实用户交互；T-002/T-003 是当前 delegation 对已确认方向的重述，不声称产生新的用户选择；若正式 session recorder 无法绑定跨线程生命周期，质量事实必须保留 `incomplete`，不得以文档文字补绿。

## 调研

- **F-001 / 当前 snapshot**：可信 clone 分支为 `codex/workflowhub-trust-recovery`，HEAD `b519f974b1d4066d00a8f819766db8a2eb12ef10`，`git fsck --full` 通过，工作树干净；正式任务工作树由 runtime 准备。状态：verified；关联 D-003。
- **F-002 / skill closure**：`npm run check:skill-closure` 当前 exit 1，报告五个 stage 的 `wh-review/scripts/review-materials.mjs` 与独立 `wh-review` bundle hash mismatch，以及 `mini-task-runner.mjs` mismatch。状态：verified；关联 D-005。
- **F-003 / selected runtime tests**：正确使用 `npx vitest` 后 93/94 个选定测试通过；同会话自动消费场景因显式 taskPath 与 launcher-derived taskPath 不一致失败。一次误用 `node --test` 的 Vitest internal-state 错误不作为产品事实。状态：verified；关联 D-003/D-006。
- **F-004 / writer**：静态审查发现 TaskKernel/canonical writer 与可直接写 `quality/*` 的 quality-store 并存，需要反向引用审计；不能先宣称唯一 writer 已闭合。状态：verified；关联 D-006。
- **F-005 / bridge**：现有 bridge/adapter 已有窄 outcome 和缺包 unavailable 路径；乱序、重叠时间、依赖顺序的当前运行时证明仍缺。状态：verified + unknown；关联 D-006/D-007。
- **F-006 / review**：`wh-review` 有 provider/material/provenance 绑定；`dsh-code-review` 是本地 lens；当前 direction 与 detail track 均完成真实 broker call 并有 semantic available 结果；不同 review source 的 current completion 边界仍需后续按阶段实跑。状态：verified；关联 D-004/D-008。
- **F-009 / direction wh-review**：正式 broker report `quality/reviews/reports/b4001359-19af-40db-8dce-9971deb8e550.md` 绑定 snapshot `8b02a490a5f84cde61fb12cc8734bcfc6fe6f5cb`、material `63d550494721e9579ce28cb76e75153845e517afdd6da61a8bce4a8134f7da45`，结果 `semantic/available`，包含两个 actionable major 和一个 minor：方向没有可观测恢复判据，且没有明确失败后果/决策门槛，也未说明更小可逆的第一步。状态：verified；处理：当前 decision-log 补齐判据、STOP 和可逆 P1 设计，原 findings 保留并逐条处置。
- **F-010 / detail wh-review**：正式 broker report `quality/reviews/reports/2c728fa5-2544-4b5c-9dee-bd727cf6502a.md` 绑定 snapshot `8b02a490a5f84cde61fb12cc8734bcfc6fe6f5cb`、material `dbffb53ebfa0b49038624f0d58f555055a809a1990b85bbb731705d775ca71f6`，结果 `semantic/available`，3/1 valid reviewers，6 个 valid findings（3 minor）。状态：verified；处理：FND-008 至 FND-016 保留原始 verdict 并映射到当前 spec/plan 修复；build-spec/build-plan 的独立 track 仍未完成。
- **F-011 / build-spec wh-review**：正式 broker report `quality/reviews/reports/b995de74-b616-4a4e-9949-3e37ec691f27.md` 绑定 snapshot `c2b78c2195532df78892ea78bb582f32ea044061`、material `0feb454a4cf86f286e0f8176de33bcdae1ddf288234f616af07039b137fa792f`，结果 `semantic/available`，2/1 valid reviewers，5 个 valid major/actionable findings。状态：verified；处理：FND-017 至 FND-021 补齐路径/副作用、finding 绑定、真实 stage evidence、bridge 唯一结果和 retry/replay 合同；build-plan 独立 track 仍未完成。
- **F-012 / build-plan wh-review**：正式 broker report `quality/reviews/reports/8083c56e-bcd5-46a7-a589-1b2b49470554.md` 绑定 snapshot `c2b78c2195532df78892ea78bb582f32ea044061`、material `cd57b31a1fb91705a007fed74af57af9b8f0e98a6ad157e75af89d2a04cc6e2a`，结果 `semantic/available`，3/1 valid reviewers，8 个 major/actionable、2 个 minor findings；broker group 为 `partial`，`opencode/v4flash` 明确为 `SESSION_IDLE_WITHOUT_TERMINAL`，该 unavailable 不被改写为空 findings。状态：verified + unavailable；处理：FND-022 至 FND-031 保留原 verdict 并补齐任务链；verify-code 独立 track 仍未执行。
- **F-007 / historical material**：PaperBuilder 历史四份材料和当前 UI archive 可说明旧需求/边界，但其中旧 runtime/session/freshness/code-review 改动不是当前授权。状态：evidence_only；关联 D-010。
- **F-008 / constitution**：宪法 21 条、版本 1.5.0；需要逐条映射到恢复边界，不能以“结构大体符合”替代逐条设计审查。状态：verified；关联 D-009。

## grill

- **G-001 / 当前真相边界**：冲突是“旧 evidence 可展示”与“旧 evidence 可完成”不能混同；结论：展示只读、current completion 只消费当前 hash/snapshot/quality fact；CONTEXT 不改，ADR 不新增，原因是现有宪法/运行时已有边界且本任务不应新建控制面。
- **G-002 / writer 边界**：冲突是兼容旧 quality-store 与单一 writer；结论：先反向审计消费者，再将 direct write 限为历史读取/测试 fixture或删除；不能加永久 replacement 链；真正需要新 authority 时 STOP 回 decision/spec。
- **G-003 / review 分层**：冲突是 dsh 本地诊断很方便但不具异源 provenance；结论：dsh 结果保留诊断，正式 verify 只认 broker-provenance `wh-review`；provider unavailable 仍是 unavailable。
- **G-004 / 范围退出检查**：目标、用户结果、状态/失败、约束/非目标/延期五类均有覆盖；所有后续新产品选择交回 PaperBuilder 后续任务；四项客观检查为：上下文一致、owner/接口一致、失败语义明确、范围/延期明确，均通过设计审查，运行时证明仍交给 plan。

## 审查处置

- **FND-001**：bundle 发布器与 closure checker 是否强制同一闭包；来源：独立结构审查；后果：单跑 checker 绿而发布物仍漂移；status `needs_human`；next_action：实现阶段用 RED/GREEN 证明 release path 先校验 closure；owner：bundle owner；consumer：发布与本地 resolver；retain_or_delete：retain。
- **FND-002**：quality-store direct writer 与 TaskKernel 并存；来源：独立宪法/结构审查；后果：canonical quality 可能有第二写入面；status `needs_human`；next_action：反向引用、收窄为只读/fixture或删除；owner：stage-runtime；consumer：quality facts/status/close；retain_or_delete：retain。
- **FND-003**：bridge 乱序/重叠 lifecycle 的真实约束未证明；来源：独立审查；后果：全部 completed 可能掩盖错误顺序；status `needs_human`；next_action：增加当前 existing contract test 的负例，不新增 state machine；owner：bridge/adapter；consumer：official stage runner；retain_or_delete：retain。
- **FND-004**：旧 review/receipt 是否只读展示；来源：兼容矩阵审查；后果：过期事实可能满足 current completion；status `needs_human`；next_action：legacy-zero 与 completion predicate 实跑；owner：completion owner；consumer：status/close/release；retain_or_delete：retain。
- **FND-005**：direction wh-review `F-aca7043ea3c1`（major/actionable）：原始需求只有定性“恢复可信度”，没有可观测成功判据；status `fixed_in_current_material`；处理：已在“成功边界”和 D-001 写入三类可观测恢复信号及 current-snapshot 绑定/失败语义；实现阶段仍须用真实 RED/GREEN oracle 证明，未证明前不写通过；owner：stage-runtime/build-code；consumer：build-spec/build-plan/verify-code；retain_or_delete：retain。
- **FND-006**：direction wh-review `F-de6d435109a8`（major/actionable）：current selection 只是口号，没有失败后果和决策门槛；status `fixed_in_current_material`；处理：D-001 绑定缺失即 `unknown/incomplete`、不请求恢复确认，且将 P1 RED 作为最小可逆第一步；owner：make-decision/build-plan；consumer：用户计划确认；retain_or_delete：retain。
- **FND-007**：direction wh-review `F-e9420f543574`（minor/nonblocking）：未说明更小可逆步骤；status `fixed_in_current_material`；处理：把“先做只读基线/RED 设计，失败即 STOP，再进入 GREEN 实施”写入 plan/tasks，不能把诊断事实当完成；owner：build-plan；consumer：T001/T002；retain_or_delete：retain。
- **FND-008**：detail wh-review `F-001fb14d4b2d`（major/actionable）：AC-WH-009 只有要求没有可执行映射；status `fixed_in_current_material`；处理：plan/tasks 已补 21 条宪法映射、兼容矩阵、精确边界、命令/预期退出结果、oracle、evidence path、rollback/STOP、逐 AC 追踪和 review provenance；实现阶段仍须实跑；owner：build-plan；consumer：build-code/verify-code；retain_or_delete：retain。
- **FND-009**：detail wh-review `F-10775bb6dc1a`（major/actionable）：bridge 非法输入缺确定结果和禁止写入边界；status `fixed_in_current_material`；处理：spec 已加入合法/乱序/重复/重叠回拨/缺包/身份错绑表，每类绑定确定状态、reason 和 current quality 不写入，plan/tasks 绑定同一 RED/GREEN oracle；owner：bridge owner；consumer：stage-runtime；retain_or_delete：retain。
- **FND-010**：detail wh-review `F-2387cd4074a5`（minor/nonblocking）：已知 taskPath 失败未锚定；status `fixed_in_current_material`；处理：补 PFACT-WH011，并让 AC-WH-002 直接引用该事实；owner：stage-runtime；consumer：snapshot gate；retain_or_delete：retain。
- **FND-011**：detail wh-review `F-350dfe1a67c1`（major/actionable）：writer contract 在拒绝/历史 fixture 间未收敛；status `fixed_in_current_material`；处理：spec 已写死 current namespace 只允许 stage-runtime/TaskKernel，其他 current 写入明确拒绝且无 quality delta；历史读取和隔离 fixture 不进入 current namespace；若实现发现需新 authority，按 STOP 回 make-decision；owner：stage-runtime；consumer：quality/status/close；retain_or_delete：retain。
- **FND-012**：detail wh-review `F-3c764219c895`（minor/nonblocking）：7 个 mismatch 清单少一项；status `fixed_in_current_material`；处理：PFACT-WH003 现枚举 7 个精确路径，和当前命令输出一致；owner：bundle owner；consumer：T001；retain_or_delete：retain。
- **FND-013**：detail wh-review `F-4bbf5ca267c7`（major/actionable）：阶段用户流程缺输入/输出/停止/确认合同；status `fixed_in_current_material`；处理：spec 已补正式阶段输入/输出/停止、单决策轴、review 不可用传播和 build-plan 确认前禁止实施；owner：stage agent；consumer：后续 stage handoff；retain_or_delete：retain。
- **FND-014**：detail wh-review `F-660a23d50485`（minor/nonblocking）：AC-WH-001 oracle 偏人工；status `fixed_in_current_material`；处理：改为当前材料与声明 steps manifest 的 owner/输入/输出/确认点比对，并绑定 `ORACLE-WH-STAGE-HANDOFF`；owner：make-decision/build-plan；consumer：stage handoff；retain_or_delete：retain。
- **FND-015**：detail wh-review `F-7244c938aaad`（major/actionable）：缺 current completion 聚合优先级；status `fixed_in_current_material`；处理：spec 已补 snapshot/material/provenance → requiredness → review/finding → stage predicate → handoff 的固定优先级与 truth table；owner：completion owner；consumer：status/close/release；retain_or_delete：retain。
- **FND-016**：detail wh-review `F-f9fd02a18e3e`（major/actionable）：R/FR trace mapping 错挂；status `fixed_in_current_material`；处理：按 FR 正文重写映射，R-002 明确为流程级决策并由 AC-WH-010 覆盖；owner：spec owner；consumer：plan/tasks；retain_or_delete：retain。
- **FND-017**：build-spec wh-review `F-0f1b29b915dc`（major/actionable）：旧损坏目录和外部副作用边界不够硬；status `fixed_in_current_material`；处理：spec/plan 写明可信 clone、正式 task worktree、四份正式材料允许范围，明确禁止读取旧损坏目录，以及本任务不实施/提交/推送/合并/关闭/清理；owner：stage agent；consumer：all stages；retain_or_delete：retain。
- **FND-018**：build-spec wh-review `F-28dde034afd5`（major/actionable）：fixed/accepted_risk 未绑定当前 finding/review/snapshot/material 和真实确认；status `fixed_in_current_material`；处理：spec completion truth table、FindingDisposition、AC-WH-008、plan `ORACLE-WH-FINDING` 和 T006 已写死绑定与缺失结果；owner：completion owner；consumer：status/close/release；retain_or_delete：retain。
- **FND-019**：build-spec wh-review `F-bc699c69a070`（major/actionable）：AC-WH-001 只有静态阶段声明，不能证明真实 Talk/Grill/review/确认；status `fixed_in_current_material`；处理：AC-WH-001 与 `ORACLE-WH-STAGE-HANDOFF` 现在同时要求当前 task 的真实交互、Grill 终态、review attempt/result/provenance 和 confirmation evidence；缺失保持 incomplete/unavailable；owner：make-decision/build-plan；consumer：stage-runtime；retain_or_delete：retain。
- **FND-020**：build-spec wh-review `F-ec1b255c558f`（major/actionable）：bridge 表有二选一状态；status `fixed_in_current_material`；处理：spec/plan/tasks 统一为时间非法 `failed/BRIDGE_TIME_INVALID`、identity 错绑 `failed/BRIDGE_IDENTITY_MISMATCH`，缺包 `unavailable`，并逐场景绑定 oracle；owner：bridge owner；consumer：stage-runtime；retain_or_delete：retain。
- **FND-021**：build-spec wh-review `F-f7c186c95168`（major/actionable）：缺 retry/replay/partial write 幂等合同；status `fixed_in_current_material`；处理：spec/plan/tasks 补稳定 idempotency key、同字节重放零 delta、冲突重放 `BRIDGE_REPLAY_CONFLICT` 和部分写入只能同 key 原子恢复或保留 incomplete/unknown；owner：stage-runtime/bridge owner；consumer：writer/bridge tests；retain_or_delete：retain。
- **FND-022**：build-plan wh-review `F-0d45d1875edb`（major/actionable）：AC-WH-002 未锁定 PFACT-WH011 和 clean/dirty/旧 snapshot/材料漂移组合；status `fixed_in_current_material`；处理：T003/T004 增加 taskPath 错绑、clean/current、dirty、旧 hash、材料 revision 变化矩阵和 current quality delta oracle；owner：stage-runtime；consumer：AC-WH-002；retain_or_delete：retain。
- **FND-023**：build-plan wh-review `F-186de534b683`（major/actionable）：AC-WH-003 缺 empty closure 负例；status `fixed_in_current_material`；处理：T001/T002 增加 empty manifest/dependency closure/package/resolver result 的具体非零断言和 evidence path；owner：bundle owner；consumer：AC-WH-003；retain_or_delete：retain。
- **FND-024**：build-plan wh-review `F-1fa855cc7ff8`（major/actionable）：AC-WH-001/009 缺真实 handoff 验证链；status `fixed_in_current_material`；处理：T005/T006 承接既有 stage package contract test，加入 steps 对照、Talk/Grill/wh-review/confirmation evidence 的缺失负例和 `ORACLE-WH-STAGE-HANDOFF`；owner：stage agent；consumer：T007；retain_or_delete：retain。
- **FND-025**：build-plan wh-review `F-23757bdfa4a9`（minor/nonblocking）：P4/T007 误重复 MODIFY P3 文件且 AC-WH-010 缺 oracle；status `fixed_in_current_material`；处理：P4 改为只读 source、只生成声明的 runtime evidence，并让 AC-WH-010 绑定 `ORACLE-WH-PLAN` 结构断言；owner：build-plan；consumer：handoff；retain_or_delete：retain。
- **FND-026**：build-plan wh-review `F-3a4d19ec275c`（minor/nonblocking）：P2 回滚数量为 14 而文件为 15；status `fixed_in_current_material`；处理：修正为 15 个文件；owner：build-plan；consumer：rollback；retain_or_delete：retain。
- **FND-027**：build-plan wh-review `F-66dc119b433e`（major/actionable）：T003/T004 缺 AC-WH-002 与 dirty/旧 hash/材料变更 RED；status `fixed_in_current_material`；处理：补 FR-WH-002/AC-WH-002、PFACT-WH011 复现和组合矩阵；owner：stage-runtime；consumer：T003/T004；retain_or_delete：retain。
- **FND-028**：build-plan wh-review `F-871a885e0c99`（major/actionable）：P4 N/A 聚合仍修改 P3 测试；status `fixed_in_current_material`；处理：P4 source files 改为 READ ONLY，唯一 NEW 是既有 runtime 生成的 current-snapshot evidence output；owner：build-plan；consumer：T007；retain_or_delete：retain。
- **FND-029**：build-plan wh-review `F-c7c59b133d64`（major/actionable）：T003/T004 漏 FR-WH-002/AC-WH-002 trace；status `fixed_in_current_material`；处理：两张任务卡补齐 FR/AC 和 clean snapshot/taskPath 断言；owner：build-plan；consumer：T003/T004；retain_or_delete：retain。
- **FND-030**：build-plan wh-review `F-d33504f7255f`（major/actionable）：writer consumer reverse audit 没有任务、命令和 evidence；status `fixed_in_current_material`；处理：T003/T004 增加全量 current-quality writer consumer 分类、未登记 production consumer 失败和独立 evidence path；owner：stage-runtime；consumer：ORACLE-WH-WRITER；retain_or_delete：retain。
- **FND-031**：build-plan wh-review `F-f9a7f2b2ec5d`（major/actionable）：AC-WH-001 oracle 未被任务卡/gate 承接；status `fixed_in_current_material`；处理：T005/T006 和 T007 gate 明确声明 `ORACLE-WH-STAGE-HANDOFF`、既有 contract test、evidence path 和真实 lifecycle 缺失负例；owner：stage agent；consumer：T007；retain_or_delete：retain。
- 独立 review 的真实 provider 结果：direction、detail、build-spec 与 build-plan track 已完成真实 broker call 并保留 `available` 结果；build-plan 的 `opencode/v4flash` unavailable、原 findings 已按 FND-005 至 FND-031 处置；verify-code 独立 track 仍未执行，任何 unavailable/incomplete 不能写成空 findings或通过。

## 最终确认

- 状态：方向 `accepted`；用户原文与 host-visible 绑定：source thread `01a02cc9-efeb-7fa1-bf1a-a57dfd531979` 的 `1A 2A 3A 4A` 回复；当前 build-plan 计划尚未获得新的计划确认。
- 已确认内容：WorkflowHub 优先、clean snapshot 正式、wh-review 正式、PaperBuilder 后续核心闭环顺序。
- 未确认内容：具体实现文件的最终变更、是否删除某个旧 direct writer、provider 当前可用性、测试/浏览器/host 实跑结果；这些不能由本方向确认推导。

## 拒绝方案

- 先改 PaperBuilder，再顺手补 WorkflowHub：拒绝，不能在不可信工具链上产生可信产品验收。
- 把 dirty worktree 或旧 evidence 认证成当前正式事实：拒绝，违反 snapshot/lineage 边界。
- 让 dsh 或 self-review 满足 `verify-code.code_review`：拒绝，不是异源 broker-provenance。
- 复制一套 recovery writer、replacement chain、stage 或状态机：拒绝，增加第二真相源和长期维护面。
- 用 `not_applicable`、空 findings 或旧 receipt 代替必做完成：拒绝，掩盖 unknown/unavailable/incomplete。

## 风险

- **RISK-001**：bundle hash 修复可能只改 manifest，不修生成/校验关系；触发：单命令通过但发布包复算失败；后果：交付闭包仍不可信；处理阶段/owner：build-code，bundle owner；关闭条件：同一生成/校验命令与发布物清单/哈希均通过。
- **RISK-002**：direct writer 收窄时遗漏真实 consumer；触发：旧测试或运行时仍写 canonical namespace；后果：第二 writer 继续存在；处理阶段/owner：build-code，stage-runtime owner；关闭条件：反向引用审计、负例和回归通过。
- **RISK-003**：bridge 接受乱序或重叠 lifecycle；触发：事件全部 completed 但依赖/时间不合法；后果：假绿 stage outcome；处理阶段/owner：build-code，bridge owner；关闭条件：负例保持 incomplete/fail-loud。
- **RISK-004**：old evidence 被 completion reader 当 current；触发：旧 ref 无 current hash/snapshot；后果：错误 release/close；处理阶段/owner：verify-code，completion owner；关闭条件：legacy-zero 与 status/close 结果明确只读。
- **RISK-005**：provider unavailable 被误写为空 finding；触发：broker 没有终态或 provenance 不完整；后果：错误 code review pass；处理阶段/owner：verify-code，wh-review owner；关闭条件：unavailable/unknown/incomplete 原样传播。
- **RISK-006**：恢复判据只写在材料里、没有绑定实际 oracle；触发：四份材料完成但 bundle、writer 或 bridge 事实未被当前 snapshot 证明；后果：把文档完成误报成 WorkflowHub 可信度恢复；处理阶段/owner：build-plan/build-code，stage-runtime owner；关闭条件：每个恢复信号都有 RED/GREEN 命令、预期退出码、oracle、evidence path 和 STOP。
- **RISK-007**：retry/partial write 产生重复或冲突 canonical fact；触发：同 key 重放、进程中断或部分写入恢复；后果：lineage 分叉或 immutable fact 被覆盖；处理阶段/owner：build-code，stage-runtime/bridge owner；关闭条件：稳定 idempotency key、同字节零 delta、冲突 fail-loud、恢复歧义保留 incomplete/unknown。

## 未决项

- **OPEN-001**：发布入口是否在每次正式 build 前强制调用现有 closure checker；原因：当前代码存在生成器/检查器两条路径；owner：build-code；触发：closure RED/GREEN；交接：计划 T001/T002；关闭：同一入口的可执行负例与 GREEN。
- **OPEN-002**：quality-store 哪些消费者只能读历史、哪些应删除；原因：当前静态审查发现 direct write；owner：stage-runtime；触发：writer reverse audit；交接：计划 T003/T004；关闭：唯一 writer negative/positive proof。
- **OPEN-003**：bridge 是否已有足够的 dependency/time ordering；原因：现有代码合同未提供当前实跑证明；owner：bridge owner；触发：T005 RED；交接：T006；关闭：乱序/重叠负例结果。
- **OPEN-004**：verify-code 及后续 authoring stage 的 wh-review provider 当前是否可用、profile 是否满足 broker provenance；原因：direction/detail/build-spec/build-plan 已有真实结果，但 build-plan 仍有 `opencode/v4flash` unavailable；owner：review owner；触发：各阶段独立 review；交接：当前质量 facts；关闭：真实 attempt/result 或明确 unavailable。

## Supersedes

- 本任务不改写历史 PaperBuilder decision/spec/plan/tasks，也不承认旧 P3/T005-T007 的越界 runtime/session/freshness/code-review 变更为当前授权。
- `trust-recovery-frontend-followup` 的失败 task-bootstrap 尝试没有 facts、没有正式结果；本任务不引用、不迁移、不追认它。

## 文档结果

- CONTEXT.md：no-change；当前恢复不需要改项目上下文，且不把任务状态写进通用上下文；引用：`CONTEXT.md` 的现有治理边界。
- ADR：not-needed；当前选择复用既有 owner，不新增难以回滚的架构决策；若实现发现必须新增 authority，按 STOP 回到 make-decision。
- ADR criteria：hard to reverse：新 writer/状态机/永久链会满足但已明确拒绝；surprising without context：旧 evidence 只读与 dsh/wh-review 分层需要在本材料记录；genuine trade-off：兼容旧读取者与单一 current writer之间有真实取舍，记录为 D-006/D-007。
- 术语/ADR 冲突及处理：`completed`、`not_applicable`、`unavailable`、`unknown`、`incomplete` 保留原语义；“恢复”只表示恢复交付可信度，不表示迁移历史 evidence；“review”指 wh-review 正式事实时必须带 broker provenance。
- 不复制 spec 的边界：本日志只记录原始需求、事实、选择、理由、风险和交接；用户流程、实体、AC 细节由 spec 维护；代码文件、命令、任务步骤由 plan/tasks 维护。

## Exit checks

- 上下文一致：通过设计检查；可信 clone、正式 task worktree、旧目录禁用和历史输入边界一致。
- owner/接口一致：通过设计检查；bundle/catalog、stage-runtime、bridge、wh-review、completion reader 各有唯一 consumer/owner 候选，未证明处保留 OPEN。
- 失败语义明确：通过；closure mismatch、dirty snapshot、provider unavailable、old evidence、乱序 bridge、serious finding 均有明确失败/未完成语义。
- 范围与延期明确：通过；当前不实施；PaperBuilder 核心列表→工作台先于全站批次，均延期到后续确认。

## 阶段结果

- 大白话交接：现在只确定“先把 WorkflowHub 的证据链修可信，再做 PaperBuilder”。计划会先处理 bundle 闭包、唯一 writer、bridge 顺序和 review/旧 evidence 边界；每项都先写会失败的测试，再写修复。计划完成后请用户确认，确认前不改代码。
