# 功能规格：事实组 2 完整修复与 WorkflowHub 质量恢复

- **功能名**：WorkflowHub 事实组 2 修复与质量恢复
- **来源**：`decision-log.md`、事实组 2 九项问题、后续流程质量修正
- **状态**：build-plan 重建中
- **当前执行材料**：同目录 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`
- **正式恢复基线**：任务记录中的 spec revision `8d167ebf3717a74220fdeccb26d3bc3815d62384dc224ad2d558dc55178d1699`

## 1. 核心原则

WorkflowHub 必须把“能否继续工作”和“能否宣称阶段完成”分开：

1. **推进资格**：当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四份材料逐一存在且可读，即可进入或继续 build-code、verify-code；任一文件缺失或不可读时必须点名该文件并停止本次进入/继续。accepted、receipt、review、provider、audit、checkpoint、历史 snapshot/generation 不得成为额外准入 gate。
2. **完成判据**：阶段的实际核心交付、风险相关测试、逐 AC 结果、独立 review（或真实记录的 unavailable）和人类交接必须真实完成。缺少任何适用于当前阶段的完成证据时，不得宣称阶段完成、验证通过或交付收口。
3. **真实性边界**：审计缺失只记录 `missing/unavailable`；结构事实错误、实际实现失败或验证失败必须真实失败，不能被 `live_plan_execution`、automatic accepted 或 fallback 改写成成功。
4. **同一任务修复**：本轮质量坍塌在 `review-flow-reset` 同一任务修复，不新建 continuation、reset、rebind 或“修复 gate 的修复任务”。
5. **唯一执行清单**：`tasks.md` 是 Task 完成状态的唯一权威。执行者只能在一个 Task 的实际改动、命令与 exit、证据、覆盖 AC、review 事实和完成时间全部填写后勾选完成；未勾选或字段不完整时只能是 `pending/in_progress`。runtime 只认证这些事实，不代替执行者勾选；accepted、receipt、trace、reopen、generation 和 audit 只作记录，不自动完成 Task。

## 2. 目标与范围

### 目标

- 完整修复事实组 2 的九项身份、路径、材料、快照和恢复问题。
- 保留 accepted make-decision `decision-log` 关于合法 review-flow generation/reset 的原始需求。
- 每阶段只有一个逻辑核心结果，辅助审计事实不得独立卡死推进。
- 恢复五阶段应有的 clarify、review、实现、验证和大白话交接质量。
- 修复后从同一任务重新完成 build-code，再执行真正的 verify-code。

### 非目标

- 不因同快照重复发起 provider 审查。
- 不覆盖、删除或伪造旧记录、旧 verdict、provider 结果或 accepted 事实。
- 不改变 make-decision direction/detail 双 track。
- 不用 reset 绕过 accepted stage 的下游失效设计。
- 不新增 provider 路由，不让 caller 指定 provider，不持久绑定临时 runner。
- 不安排最终全量测试，不为追逐 pass 重复审查。

## 3. 场景

- **SCN-001**：正式入口认证 canonical task 和实际执行身份。
- **SCN-002**：用户通过来源绑定的路径卡找到当前工作区和产物。
- **SCN-003**：artifact、receipt、review、attempt、accepted checkpoint 同字节同快照。
- **SCN-004**：技能或材料错误在 provider 调用前本地失败并留真记录。
- **SCN-005**：dirty 工作区经明确授权受控恢复，不删除用户文件。
- **SCN-006**：核心结果完整、辅助审计缺失时仍可推进，但不能伪造审计成功。
- **SCN-007**：同一 run 只修复失效 step，其他步骤和 review 不重放。
- **SCN-008**：review outcome 复用、普通 resolution、真实结构 reset 各走唯一合法路径。
- **SCN-009**：五阶段 clarify、review、测试、摘要和确认动作完整。
- **SCN-010**：竞态或回滚失败只回滚声明记录，不触碰 worktree。
- **SCN-011**：四材料可读时进入 build-code/verify-code；完成判据未满足时保持进行中。

## 4. 产品事实

- **PFACT-SOURCE**：事实组 2 收录问题 2、4、5、11、14、16、26、28、30。
- **PFACT-DECISION**：accepted `decision-log` 要求 reset 只追加 lineage、只由真实结构变化触发、不改变 provider 与正常确认边界。
- **PFACT-CONSTITUTION**：宪法要求真实、可审计、异源 review、不可逆操作经人授权，同时禁止预设质量 gate 卡死推进。
- **PFACT-PROCESS**：五阶段 Skill 声明 clarify、review、组件完成事实和交接；宿主遗漏不能等价为完成。
- **PFACT-CASCADE**：固定 attempt、run-scoped identity、consumer 重裁和 audit 依赖会把局部缺口放大为整链死锁。
- **PFACT-RECOVERY**：现有 credential/generation、锁、CAS 和幂等原语应被复用，不新建平行状态机。
- **PFACT-RECOVERY-SCHEMA**：当前正式恢复记录使用 `workflowhub-recovery-credential.v1` 与 `workflowhub-recovery-generation.v1`；JSON Schema、JS validator、TaskHandle 路径白名单和 CLI 命令白名单目前都只登记 `runner-replacement`、`phase-pointer`，第三种 operation 不能只在其中一层静默放行。
- **PFACT-TESTING**：只做风险相关聚焦验证；证据仅在代码、命令、snapshot 未变时复用。
- **PFACT-QREGRESSION**：后续“去 gate”改造曾把审计非阻断错误扩大为执行和验证可省略，导致 build-code/verify-code 被过早宣称完成。
- **PFACT-QRETRACTION**：此前“build-code 完成”“verify-code 通过”的结论已因缺少当前逐 AC、实质验证和正式证据而撤回；撤回结论必须进入同一任务的需求追踪。

## 5. 功能需求

### 身份、路径与预检

- **FR-IDENTITY-001**：保持 canonical task 身份稳定；正式写成功前认证实际 WorkflowHub 执行内容干净、已提交、合同匹配；临时 runner 不成为业务身份。
- **FR-PATH-001**：accept/close append-only 发布带来源 receipt/generation ref/hash 的机器可读路径卡；路径卡只作说明，后续启动忽略卡中的旧路径并重新读取当前权威记录与磁盘实态。
- **FR-PREFLIGHT-001**：三个 official owner 边界复用一个结构预检合同：`stage-runtime` 负责 receipt/review/reopen/accept，`task-recovery` 负责 recovery/rebind/migration，`task-close` 负责 close。每个 owner 在一次正式写事务前取得一个 shared preflight result，并由该 owner 内全部子写消费；不要求每条 append-only journal 重复运行预检。
- **FR-PREFLIGHT-002**：结构预检失败必须在业务写入前 fail-loud，保留用户文件和第三方变化，不自动清理或写成功记录。
- **FR-SKILL-001**：技能 locator 坚持单一来源、无猜测 fallback；resolver 与 doctor 使用同一诊断 schema，doctor 只记录、不 gate。
- **FR-MATERIAL-001**：provider dispatch 前本地验证 draft、非空 review input、必需材料/map、anchor 合法且唯一；失败时 provider_calls=0、无 provider attempt、有本地审计。
- **FR-ATOMIC-001**：artifact、receipt/hash、review subject、attempt、accepted checkpoint 必须同字节同快照；正常 close 与重绑 close 使用同一校验链。

### 恢复、核心结果与审查

- **FR-RECOVERY-001**：恢复/迁移由 `workflowhub-recovery-operation.v1` registry 描述 kind、credential subject、generation mode、lock ref、可变/追加写集合、授权、rollback scope 和 postcondition，并复用现有原语。三种 kind 的权威白名单必须同时出现在 registry、`workflowhub-recovery-credential.v1`、`workflowhub-recovery-generation.v1`、JS validator、TaskHandle 路径 API 和 CLI；任一层不一致均 fail-loud。
- **FR-RECOVERY-002**：`dirty-cleanup-rebind` 是第三种正式 operation kind。它继续使用兼容扩展后的 credential/generation v1 envelope，以独占 `workspace_subject` 绑定原 dirty workspace、目标 clean workspace、授权 receipt、需保留的 artifact refs 和后续 close stage；操作只追加 recovery/binding 元数据，不执行 Git cleanup/reset、不删除或覆盖原 workspace 字节，并在新绑定上重走正常 close。
- **FR-RECOVERY-003**：通用 rollback 仅恢复声明记录和元数据，排除 worktree；成功操作 append-only，相同 generation 可幂等 replay。
- **FR-CORE-001**：五阶段各只有一个下游核心结果：accepted decision、spec、plan bundle、implementation snapshot/receipt、verification result。辅助审计缺失不 gate；核心结果错误不得发布完成。
- **FR-ATTEMPT-001**：失效 step 在同一 run 由 kernel 派生 attempt-N；依赖只消费该 step 最新、未失效、成功 attempt，其他步骤与 review 不重放。
- **FR-REVIEW-001**：producer 唯一解析和聚合 provider 输出；consumer 只认证 canonical outcome。provider verdict 是建议事实，不等于 stage pass/accepted。
- **FR-REVIEW-002**：相同 subject 零调用复用；普通变化使用认证 resolution；只有真实结构变化可创建 append-only generation reset。旧链不可变、每代最多一次结构 full review、provider 由可信配置选择。

### 流程、交接与验证

- **FR-PROCESS-001**：每阶段按声明组件产生完成事实；build-spec ambiguity/clarify 必须 executed 或 `trigger=false`；五阶段正式 review 必须产生 canonical result 或真实 unavailable。
- **FR-PROCESS-002**：原始需求、accepted decision-log、后续补充要求作为独立来源层；spec 维护来源与 SCN/FR/AC 双向映射，plan/tasks/摘要继承相同来源键。`tasks.md` 的每张唯一 Task 卡同时保存执行者填写的完成勾选、实际改动、命令与 exit、证据、覆盖 AC、review 事实和完成时间；其他记录不得生成第二份完成状态。
- **FR-HANDOFF-001**：正常人工确认仅 make-decision、build-plan、verify-code；build-plan 确认前用大白话总结完整 spec、非目标、Phase、依赖、验证、review 事实、风险和影响，并说明 review verdict 不等于 accepted。
- **FR-VERIFY-001**：每个真实风险有聚焦 RED/GREEN；代码、命令或 snapshot 改变时只重跑受影响组；不跑最终全量、不重复 provider pass-chasing。

## 6. 验收标准

- [ ] **AC-01**：缺 canonical task、目标仓库错误、执行内容 dirty/未提交或合同不匹配时，正式写成功前失败；普通工具升级不改变 task 身份。失败：dirty 内容被记录成 HEAD，或 task 永久换绑临时 runner。
- [ ] **AC-02**：accept/close 后存在 append-only、来源 receipt/generation ref/hash 绑定的路径卡；卡过期或冲突时启动忽略卡并采用当前权威记录和磁盘实态。失败：无来源卡、卡可被覆盖，或旧卡覆盖当前权威。
- [ ] **AC-03**：`stage-runtime`、`task-recovery`、`task-close` 三个 official owner 各在正式写事务前消费一次 shared preflight result，并让 owner 内 receipt/review/reopen/accept、recovery/rebind/migration、close 的全部子写复用该结果。失败：owner 绕过、每条 journal 重跑并产生漂移，或复制结构判断。
- [ ] **AC-04**：结构预检失败时所有业务记录、用户文件和第三方 pointer 的前后字节完全相同。失败：partial receipt/review/attempt/generation、删除或覆盖用户文件，或改写第三方 pointer。
- [ ] **AC-05**：locator 错误无 fallback，resolver/doctor 同 schema，doctor 不阻断启动。失败：猜路径继续或 doctor 成为 gate。
- [ ] **AC-06**：本地材料/anchor 错误在 provider dispatch 前失败，provider_calls=0、无 provider attempt、有本地审计；该零调用要求不扩展为长锁期间或所有 snapshot 漂移都禁止 provider 调用。失败：本地材料/anchor 错误仍消耗 provider，或没有本地审计。
- [ ] **AC-07**：正常/重绑 close 都拒绝跨字节、跨快照复用；成功时 artifact、receipt/hash、review subject、attempt、accepted checkpoint 五类记录同源，并由 receipt-writer、task-kernel publication 与 review-runner 的窄 snapshot atomicity 测试共同证明。失败：任一五类记录与当前文件字节或 snapshot 不同。
- [ ] **AC-08**：`runner-replacement`、`phase-pointer`、`dirty-cleanup-rebind` 都由 `workflowhub-recovery-operation.v1` registry 和同一解释器消费；credential/generation v1 JSON Schema、JS validator、TaskHandle ref/path whitelist、CLI whitelist 对三类 kind 完全一致，旧两类 v1 记录仍可原字节读取/replay。失败：只改 JS validator、schema/路径/CLI 漂移、绕过合同或双系统写同一状态。
- [ ] **AC-09**：dirty workspace cleanup/rebind 经授权保留产物和用户文件，绑定干净工作区后重走 close；未授权只拒绝写。失败：ad-hoc 清理、旧 PASS 复用或内容丢失。
- [ ] **AC-10**：恢复失败只回滚声明记录/元数据，不动 worktree、不覆盖第三方变化；replay 幂等。失败：通用 rollback 执行 Git 内容回退。
- [ ] **AC-11**：五阶段核心结果映射唯一，核心结构错误真实失败。失败：平行主体或结构错误仍宣称成功。
- [ ] **AC-12**：support 缺失仅记 `missing/unavailable`，不成为第二推进 gate；错绑 support 不得当真。失败：support 缺一项卡死或伪造成功。
- [ ] **AC-13**：同一 run 只重做目标 step，kernel 派生 attempt-2；其他步骤/review/provider 计数不变。失败：换 run、误伤其他步骤或 caller 控制序号。
- [ ] **AC-14**：consumer 只消费 canonical outcome；provider verdict 在记录和摘要中保持建议事实，未完成阶段不得显示通过/accepted。失败：consumer 重裁或口头假通过。
- [ ] **AC-15**：相同 subject 因 run/runner/审计变化继续零调用复用；policy 或核心材料变化不得误复用。失败：运行身份触发重审或 policy 变化仍复用。
- [ ] **AC-16**：合法 reset 只在未 accepted、快照不同、完整结构 ledger、旧 head/event 正确时追加新 generation；旧链不变、新代 initial、每代最多一次 full review、caller 不可指定 provider。失败：覆盖旧链、重开 accepted 或无限复审。
- [ ] **AC-17**：build-spec 正文包含 ambiguity 分类；无歧义记录 `trigger=false`，有歧义逐轴 ask→wait→resume；独立 ledger 缺失只记 support missing。失败：漏问、伪造回复或提前 review。
- [ ] **AC-18**：五阶段正式 review 均产生 canonical result 或真实 unavailable；其他 conditional component 有 executed/具体 trigger=false。失败：漏 review、漏 clarify 状态或用摘要补造执行事实。
- [ ] **AC-19**：build-plan 接受前大白话摘要完整；三个正常确认与不可逆授权分离；make-decision 双 track 独立。失败：缺摘要、自动确认、混合授权或误述状态。
- [ ] **AC-20**：每个已证明风险有聚焦 RED/GREEN；证据 stale 时只重跑受影响组；无最终全量或重复 provider 审查。失败：复用 stale evidence、跑全量或追 pass。
- [ ] **AC-21**：FG2 九项、decision-log 五项决策和四项非目标、后续补充要求均双向映射到 SCN/FR/AC，并保留于 plan/tasks/摘要；进入 build-code/verify-code 时逐一检查 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`，任一缺失或不可读都点名报错并停止本次进入/继续；每个 Task 只有 `tasks.md` 内一个完成状态，未勾选或任一完成字段缺失时保持 `pending/in_progress`。build-code 最终 integration 收口前必须认证全部计划 Task 的当前完成填写，verify-code 必须重新独立核对同一 `tasks.md` 与最终代码、测试、AC、review 证据一致。失败：较晚来源覆盖较早来源、隐藏缺口、四材料未逐一检查或错误不点名、runtime 自动勾选、build-code/verify-code 漏检 Task 完成事实，或 accepted/receipt/trace/reopen/generation/audit 被当成 Task 完成。

## 7. 来源双向覆盖

| 来源键 | 场景 | FR | AC |
| --- | --- | --- | --- |
| FG2-02 canonical task/执行身份 | SCN-001 | FR-IDENTITY-001 | AC-01 |
| FG2-04 路径交接卡 | SCN-002 | FR-PATH-001 | AC-02 |
| FG2-05 统一 clean preflight | SCN-001,005 | FR-PREFLIGHT-001,002 | AC-03,04 |
| FG2-11 跨快照旧 receipt | SCN-003 | FR-ATOMIC-001 | AC-07 |
| FG2-14 resolver/doctor | SCN-004 | FR-SKILL-001 | AC-05 |
| FG2-16 provider 前材料预检 | SCN-004 | FR-MATERIAL-001 | AC-06 |
| FG2-26 artifact/receipt/accepted 同源 | SCN-003 | FR-ATOMIC-001 | AC-07 |
| FG2-28 dirty workspace 恢复 | SCN-005 | FR-RECOVERY-002 | AC-09 |
| FG2-30 versioned recovery operation | SCN-005,010 | FR-RECOVERY-001,003 | AC-08,10 |
| MD-D1 reset 只追加 lineage、不制造 pass | SCN-008 | FR-REVIEW-002 | AC-16 |
| MD-D2 仅真实结构变化可 reset | SCN-008 | FR-REVIEW-002 | AC-15,16 |
| MD-D3 新 generation 由认证 reset ref 派生 | SCN-008 | FR-REVIEW-002 | AC-16 |
| MD-D4 不增加日常人工确认 | SCN-009 | FR-HANDOFF-001 | AC-19 |
| MD-D5 可信 provider route/不绑 runner | SCN-001,008 | FR-IDENTITY-001,FR-REVIEW-002 | AC-01,16 |
| MD-NG1 不做同快照重复重审 | SCN-008 | FR-REVIEW-002 | AC-15,16 |
| MD-NG2 不覆盖旧记录 | SCN-008 | FR-REVIEW-002 | AC-16 |
| MD-NG3 direction/detail 独立 | SCN-009 | FR-HANDOFF-001 | AC-19 |
| MD-NG4 不用 reset 重开 accepted | SCN-008 | FR-REVIEW-002 | AC-16 |
| FLOW-CORE 每阶段一个核心结果 | SCN-006,011 | FR-CORE-001 | AC-11,12 |
| FLOW-ATTEMPT 同 run attempt-N | SCN-007 | FR-ATTEMPT-001 | AC-13 |
| FLOW-OUTCOME producer 唯一裁决 | SCN-008 | FR-REVIEW-001 | AC-14 |
| FLOW-REUSE 未变材料零调用 | SCN-008 | FR-REVIEW-002 | AC-15 |
| PROC-CLARIFY 澄清不可遗漏 | SCN-009 | FR-PROCESS-001 | AC-17 |
| PROC-REVIEW wh-review 是建议事实 | SCN-008,009 | FR-REVIEW-001,FR-PROCESS-001 | AC-14,18 |
| PROC-SUMMARY build-plan 大白话确认 | SCN-009 | FR-HANDOFF-001 | AC-19 |
| PROC-VERIFY 聚焦验证且不重复审查 | SCN-003,008 | FR-VERIFY-001 | AC-20 |
| PROC-COVERAGE 三层来源双向保留 | SCN-009 | FR-PROCESS-002 | AC-21 |
| QUALITY-NOGATE 审计不作推进许可证但质量不降级 | SCN-006,011 | FR-CORE-001,FR-PROCESS-001 | AC-11,12,18 |
| QUALITY-REBUILD 同任务重建材料并重做 build-code | SCN-009,011 | FR-PROCESS-002,FR-VERIFY-001 | AC-20,21 |
| QUALITY-RETRACT 撤回无证据的 build/verify 完成结论 | SCN-008,011 | FR-REVIEW-001,FR-HANDOFF-001 | AC-14,19 |

### 规范化来源执行映射

| Source | SCN | FR | AC | Tasks |
| --- | --- | --- | --- | --- |
| FG2-02 | SCN-001 | FR-IDENTITY-001 | AC-01 | T001,T002,T011,T012 |
| FG2-04 | SCN-002 | FR-PATH-001 | AC-02 | T001,T002,T011,T012 |
| FG2-05 | SCN-001 | FR-PREFLIGHT-001 | AC-03 | T001,T002,T011,T012 |
| FG2-05 | SCN-005 | FR-PREFLIGHT-002 | AC-04 | T001,T002,T011,T012 |
| FG2-11 | SCN-003 | FR-ATOMIC-001 | AC-07 | T005,T006,T011,T012 |
| FG2-14 | SCN-004 | FR-SKILL-001 | AC-05 | T005,T006,T011,T012 |
| FG2-16 | SCN-004 | FR-MATERIAL-001 | AC-06 | T005,T006,T011,T012 |
| FG2-26 | SCN-003 | FR-ATOMIC-001 | AC-07 | T005,T006,T011,T012 |
| FG2-28 | SCN-005 | FR-RECOVERY-002 | AC-09 | T003,T004,T011,T012 |
| FG2-30 | SCN-005 | FR-RECOVERY-001 | AC-08 | T003,T004,T011,T012 |
| FG2-30 | SCN-010 | FR-RECOVERY-003 | AC-10 | T003,T004,T011,T012 |
| MD-D1 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-D2 | SCN-008 | FR-REVIEW-002 | AC-15 | T007,T008,T011,T012 |
| MD-D2 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-D3 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-D4 | SCN-009 | FR-HANDOFF-001 | AC-19 | T009,T010,T011,T012 |
| MD-D5 | SCN-001 | FR-IDENTITY-001 | AC-01 | T001,T002,T011,T012 |
| MD-D5 | SCN-008 | FR-REVIEW-002 | AC-16 | T001,T002,T011,T012 |
| MD-NG1 | SCN-008 | FR-REVIEW-002 | AC-15 | T007,T008,T011,T012 |
| MD-NG2 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-NG3 | SCN-009 | FR-HANDOFF-001 | AC-19 | T009,T010,T011,T012 |
| MD-NG4 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| FLOW-CORE | SCN-006 | FR-CORE-001 | AC-11 | T007,T008,T011,T012 |
| FLOW-CORE | SCN-011 | FR-CORE-001 | AC-12 | T007,T008,T011,T012 |
| FLOW-ATTEMPT | SCN-007 | FR-ATTEMPT-001 | AC-13 | T007,T008,T011,T012 |
| FLOW-OUTCOME | SCN-008 | FR-REVIEW-001 | AC-14 | T007,T008,T011,T012 |
| FLOW-REUSE | SCN-008 | FR-REVIEW-002 | AC-15 | T007,T008,T011,T012 |
| PROC-CLARIFY | SCN-009 | FR-PROCESS-001 | AC-17 | T009,T010,T011,T012 |
| PROC-REVIEW | SCN-008 | FR-REVIEW-001 | AC-14 | T009,T010,T011,T012 |
| PROC-REVIEW | SCN-009 | FR-PROCESS-001 | AC-18 | T009,T010,T011,T012 |
| PROC-SUMMARY | SCN-009 | FR-HANDOFF-001 | AC-19 | T009,T010,T011,T012 |
| PROC-VERIFY | SCN-003 | FR-VERIFY-001 | AC-20 | T009,T010,T011,T012 |
| PROC-VERIFY | SCN-008 | FR-VERIFY-001 | AC-20 | T009,T010,T011,T012 |
| PROC-COVERAGE | SCN-009 | FR-PROCESS-002 | AC-21 | T009,T010,T011,T012 |
| QUALITY-NOGATE | SCN-006 | FR-CORE-001 | AC-11 | T011,T012 |
| QUALITY-NOGATE | SCN-011 | FR-CORE-001 | AC-12 | T011,T012 |
| QUALITY-NOGATE | SCN-011 | FR-PROCESS-001 | AC-18 | T011,T012 |
| QUALITY-REBUILD | SCN-009 | FR-PROCESS-002 | AC-21 | T011,T012 |
| QUALITY-REBUILD | SCN-011 | FR-VERIFY-001 | AC-20 | T011,T012 |
| QUALITY-RETRACT | SCN-008 | FR-REVIEW-001 | AC-14 | T011,T012 |
| QUALITY-RETRACT | SCN-011 | FR-HANDOFF-001 | AC-19 | T011,T012 |

反向约束：每个 FR 必须关联场景和 AC；每个 AC 必须有 FR、失败条件和来源键。plan/tasks 任一来源键消失，材料即不完整。

## 8. 当前缺口与交接

当前候选曾把 `live_plan_execution` 和少量局部测试误当 build-code/verify-code 完成，实际没有逐 AC 实现与验证闭环。应按本规格和配套 plan/tasks 在同一任务中：

1. 修复错误的去 gate 实现，恢复完整质量合同。
2. 对实际代码差异逐项完成 build-code。
3. 生成当前快照的逐 AC coverage、聚焦测试证据和独立 review。
4. 再进入真正的 verify-code；automatic accepted 仅是记录，不是验证结论。
