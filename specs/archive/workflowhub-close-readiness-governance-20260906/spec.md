# 功能规格：WorkflowHub 收口准备治理与质量-成本治理

> `content_profile: spec-content.v3`。本规格只定义产品行为、事实、边界和验收；不定义实现文件、代码符号或工程命令。

- **功能名**：WorkflowHub 收口准备治理、质量-成本治理与阶段治理闭环
- **来源**：已冻结的 decision-log（第二轮 R-011 收口 accepted，确认回执 f1e28231，绑 revision-e9bc49bc/snapshot e94e3cee）与 Approved Direction Card v4.3；D-001、D-002、D-101、D-201～D-207、D-301～D-306、D-401、D-402、D-501～D-506；当前 phase 验收增量依据 D-507（不由旧 spec-clarify 回执代替）
- **状态**：草稿（继续 build-spec；基于 decision-log v4.3 基线及 D-507 phase 验收增量修订，含 III 阶段治理闭环；GAP/packet 固定向量证据已落盘并独立核对（见 evidence/build-spec-review/hash-contract-vectors.json 与 hash-contract-vectors-check.json），DEFERRED-001 兼容性核查等受影响 findings 证据仍待补齐（见 §12 OPEN-005），不表示阶段完成或已获 build-plan 授权）
- **spec-clarify**：trigger=false；理由：decision-log v4.3 第二轮已冻结 I/II/III 全部方向语义，phase 验收已由 D-507 增量选择明确，本规格只做受影响闭包转译及 D-205/D-304 授权的确定性合同细化；open_direction_changing_questions=0

## 材料导航（可再生，非权威）

> 本节是材料内嵌的只读导航视图，随正文更新再生，不构成第五材料或第二权威。

| 章节 | 一句话摘要 | 建议读取时机 |
| --- | --- | --- |
| 速读卡与来源映射 | 快速确认需求、范围和 FR/AC 追溯 | 首次进入或交接时 |
| 1～2 | 问题、目标、范围与非 UI 边界 | 判断产品方向时 |
| 3～4 | 场景、状态和 PFACT | 核对行为覆盖时 |
| 5 | 20+ 条功能需求 | 转译 build-plan 前 |
| 6～10 | 模块、实体、生命周期、兼容性和非目标 | 设计边界与方案时 |
| 11 | 全部 AC 与九字段收口合同 | 验收和预检前 |
| 12～13 | 风险、OPEN/DEFERRED、交接与回归范围 | 排程和收尾前 |
| 3、8 | III 阶段治理闭环场景与状态出口（SCN-013～016、失败分支表） | 核对 III 行为与异常路径时 |
| 5（LOOP）、11 | 六条阶段治理闭环 FR 与 AC-LOOP-001～006 | 转译 build-plan 前 |

## 速读卡（30 秒）

- **一句话需求**：操作者在 WorkflowHub 五阶段流程中，需要看到可信、去重、可追溯的收口准备事实，并让新生成的四份材料、verify 独立审查事实和 build-spec/build-plan 上下文组织足够清楚，使后续执行者能按同一份已确认方向完成交付。
- **核心改动点**：
  - 以前置边界声明和九字段收口合同驱动只读三态预检，以同一快照派生并聚合缺口，以当前确认事实消缺，并把六种状态分开呈现。
  - 让材料模板、材料质量检查、负向 oracle、verify 材料事实检查和异源独立审查形成可观察但不阻断推进的质量事实链。
  - 把执行模型、材料导航、冻结 packet、按需读取和摘要派发用于 build-spec/build-plan，保留现有审查冻结链，不把效率优化变成新的质量门。
  - 把阶段治理闭环（III）固化为决策冻结前置校验、findings 互斥分类强制路由、needs_human 暂停态、review 预算、轻量 usage 与字符级代理观测、跨阶段统一回退协议，让 build-spec/build-plan 基于冻结决策高效设计，不在规格化中做决策收敛。
- **最大影响面**：五阶段的收口准备、状态与质量事实展示；新生成的 spec、plan、tasks 材料；verify 阶段的独立审查事实；build-spec/build-plan 的主会话、子代理和审查材料组织。
- **验收信号**：诊断报告能区分已核实与未核实论断；同一缺口在一次渲染中只出现一次；确认项不再报缺失；协议错配被拒绝而证据缺失被如实记录；材料质量、独立审查和上下文行为均能从用户可读事实中判定。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001、R-002、F-004、F-010～F-016 | D-001、D-101、D-202 | FR-DIAG-001、FR-REPORT-001 / AC-DIAG-001、AC-REPORT-001 | current / 诊断、收口事实和展示 | 诊断只读历史样本；详细交付交 build-plan |
| R-007、R-008、R-009 | D-301、D-302、D-304 | FR-DIAG-002、FR-MATERIAL-001～003、FR-CONTEXT-001～003 / AC-DIAG-002、AC-MATERIAL-001～003、AC-CONTEXT-001～003 | current / 三问诊断和质量-成本治理 | 先材料质量，再上下文组织，再 verify 独立性 |
| R-003、R-004、R-006、F-005、F-022、F-043 | D-002、D-201、D-204、D-305、D-306 | FR-FLOW-001～002、FR-GOV-001 / AC-FLOW-001～002、AC-GOV-001 | current / 五阶段、多 phase、治理边界 | phase 精确边界交 build-plan |
| R-004、R-006、F-017～F-023 | D-201、D-202、D-203、D-204、D-207、D-402 | FR-PREF-001～002、FR-STATUS-001～002 / AC-PREF-001～002、AC-STATUS-001～002 | current / 预检、合同、六状态和 close 记录 | 详细值域与转换细节在本规格锁定 |
| R-001、R-004、R-006、F-013、F-018～F-021 | D-205、D-206、D-207 | FR-GAP-001～002、FR-BOUND-001～002 / AC-GAP-001～002、AC-BOUND-001～002 | current / 缺口、确认消缺、边界事实 | 旧投影 producer/consumer 与拆除条件已在 FR-GAP-001 锁定 |
| R-008、R-009、R-010、F-033～F-039 | D-302、D-303、D-306 | FR-REVIEW-001～002、FR-MATERIAL-001～003 / AC-REVIEW-001～002、AC-MATERIAL-001～003 | current / 材料质量、phase 审查和 verify 独立审查 | 异源配置事实 OPEN-004 交 build-plan 前置处理 |
| R-008、R-010、F-041～F-043 | D-304、D-305 | FR-CONTEXT-001～003 / AC-CONTEXT-001～003 | current / Execution model、导航、packet 分层 | 导航节格式已在本规格定稿；四阶段统一机制延期 |
| R-005、R-006、R-010 | D-301、D-401、D-402 | FR-FLOW-002～003、FR-DIAG-003、FR-REPORT-001、FR-GOV-001 / AC-FLOW-002～003、AC-DIAG-003、AC-REPORT-001、AC-GOV-001 | current / 阶段验收、dogfood 观察、事实报告、控制面边界 | 逐项夹具与阶段排程交 build-plan |
| R-010、R-011、本次 phase 增量选择 | D-507（承接 D-301/D-502/D-506） | FR-FLOW-003 / AC-FLOW-003、第 8 节 phase 事实与恢复建议 | current / phase 用户验收事实 | 当前方向来源为增量 D；旧 a71319ff 仅历史佐证，绑定以 decision-log 当前增量链为准 |
| 历史 build-spec 用户澄清确认 | 用户确认记录（2026-09-06，两轮）及各 FR 所列 D | FR-GAP-001～002、FR-BOUND-002、FR-STATUS-002、FR-MATERIAL-001～003、FR-REVIEW-001～002、FR-CONTEXT-001 / 对应 AC | current / 既有规格澄清追溯 | 历史回执不替代新增方向所需 D；phase 部分已单列 D-507 |
| R-011、N-008、N-009、F-044、F-045 | D-501～D-506（decision-log M6 阶段治理闭环、方向卡 III-1～III-6） | FR-LOOP-001～006 / AC-LOOP-001～006 | current / III 阶段治理闭环 | 分类判定维度、答复绑定载体、预算计数口径已在本规格锁定；实现 schema 归 build-plan |
| 方向审查 v5 组C 裁决（T-032） | D-302（v4.3 修正语义，作废 GREEN 强制 reject 旧语义） | FR-MATERIAL-002 / AC-MATERIAL-002 | current / II-1 reject 强制范围 | 仅 verification_role=RED 且 paired_task≠N/A 强制 reject 非空；GREEN 仅配对关联加 oracle.pass 非空 |

III 部分来源与决策索引（FR→D 条目→decision-log 章节）：FR-LOOP-001→D-501→M6 决定区、方向卡 III-1、失败分支表冻结校验行、验收细节 III-1 行；FR-LOOP-002→D-502→M6、方向卡 III-2、验收细节 III-2 行与增量决策行；FR-LOOP-003→D-503→M6、方向卡 III-3、失败分支表 needs_human 行；FR-LOOP-004→D-504→M6、方向卡 III-4、失败分支表预算行；FR-LOOP-005→D-505→M6、方向卡 III-5、验收细节 III-5 行；FR-LOOP-006→D-506→M6、方向卡 III-6。

每条 FR 和 AC 都能回到本表以及对应的 PFACT、场景；本表不另建需求账本。非目标只在第 10 节维护，延期与交接只在第 12 节维护。

## 1. 问题与紧迫性

操作者在任务接近收口时，常看到 verify-code 集中暴露大量问题，随后只能带着不完整质量事实完成风险 close，因而产生“流程最后才发现问题”或“只能风险 close”的体验。独立核查显示，这种体验由多个可区分的问题共同造成：同一缺口在多个投影重复出现，用户已经确认的事实没有被当前投影消费，协议错配在错误边界才暴露，完成、质量、验收、发布和物理 close 的含义混在一起，空 findings 被误读为质量通过，历史摘要中的具体断言又有与任务事实不符的情况。

同一任务的事实并不总是“风险 close”：核查样本中既有标准 close 但 quality incomplete、product release 未发生且用户明确接受的情况，也有明确的 delivered-with-risk close。产品必须把这种认知差异如实说明，而不是用一个更强的状态或新 gate 掩盖它。

三问取证还显示，build-spec/build-plan 的高消耗主要来自主会话反复重读大材料、阶段内工作没有统一的摘要和派发边界、审查 packet 没有导航与按需读取层次，以及材料模板和检查器的标签与失败语义不一致。已有材料因此可能“看起来详细”，却没有给后续执行者一个稳定、可判断、可拒绝的质量契约。

本需求必须同时解决收口可信度和材料质量/上下文成本问题。它记录事实、提前暴露边界和减少重复阅读，但不把 review、预检、材料检查或上下文规则改造成推进许可证。

第二轮 build-spec 复盘提供了第三类证据：上游决策状态不唯一（头部 approval_binding 与正文 accepted 并存）、方向级和规格级问题到 review 才暴露、findings 处置把 needs_human 当终点、无 review 预算与 usage 记录，使一次 build-spec 消耗 5.3 小时、约 16 次审查不收敛。III 部分因此把“基于冻结决策高效设计”做成机制：入口决策冻结校验、findings 互斥分类强制路由、needs_human 暂停态、review 预算、轻量 usage 与字符级代理观测、跨阶段统一回退协议。这些机制全部是阶段完成条件检查，不是新 gate，也不改变“记录事实不阻断”的总原则。

## 2. 背景、目标与范围

### 背景

- **诊断交付物**：本任务交付一份只读的 README 式综合诊断，内容分为 `research-Q1`、`research-Q2`、`research-Q3` 和“综合结论”四个可定位部分；它以四个历史任务和内部取证事实为准，不改写历史任务。Q1 说明 requirement-convergence-depth 的能力已大体落盘且在当前 make-decision 中真实 dogfood；Q2 说明档案没有 token 度量，“好几亿”无法由档案证实或证伪，并解释字符量、反复读取和 provider 放大；Q3 说明四材料保障度为中及模板/校验、拒绝 oracle、verify 材料检查和独立 review 缺口；综合结论把诊断事实连接到本规格的治理行为。

WorkflowHub 的正式流程仍是 make-decision → build-spec → build-plan → build-code → verify-code，当前真相仍是同一任务的四份材料。make-decision 已经完成用户 Talk、审查、辩论、Grill、确认和阶段末检查；本任务的方向、范围、成功失败边界、非目标和延期项已被用户确认。当前任务属于 functional 外层，历史核查与三问分析作为诊断证据节点。

方向 I 保留既有 close 三义，不改变 close 是否允许质量或发布缺口；只补足收口前的事实暴露、投影一致性、边界校验和分层展示。方向 II 先提升新材料的可执行质量，再组织 build-spec/build-plan 的上下文，最后补 verify 的异源独立审查事实。材料导航是材料内的可再生、非权威视图，不是第五份材料或新的持久对象；审查仍消费冻结、只读、file-only 的材料包。

### 目标

- 交付一份经独立核实的诊断报告：对四个历史样本和总结性材料逐条标注事实状态，说明标准 close 与风险 close 的认知差异，并不把未核实论断写成事实。
- 交付三问综合诊断：说明 make-decision 强化的实际效果、build-spec/build-plan 高消耗的结构性原因，以及四份材料对后续执行质量的保障度和缺口；不引入 token 度量机制。
- 让收口准备具备九字段合同、覆盖边界声明、三态只读预检、同快照缺口派生、确认消缺、协议边界拒绝和六状态分层展示。
- 让新生成材料具有统一的四段式 AC、可机读的负向 oracle 和 verify 入口的四项只读材料事实检查；让 verify 记录真实的异源独立审查三态事实。
- 让 build-spec/build-plan 的主会话、子代理和审查材料按执行模型工作，减少全量回读和重复注入；成本结论以可观察材料组织和读取行为为准，没有下降证据时报告“未证明下降”。
- 落地阶段治理闭环（III）：决策冻结前置校验与增量续签链、findings 互斥分类与强制路由、needs_human 暂停态与完成出口白名单、review 预算与耗尽路由、provider usage 落盘与字符级代理观测、跨阶段统一回退协议，让 build-spec/build-plan 基于冻结 decision-log 高效设计，不在规格化中做决策收敛。

### 范围内

- **收口准备治理（I）**：九字段收口合同；预检 ready、unknown、unavailable 三态；覆盖边界声明；canonical gap 派生与渲染层聚合；当前 confirmation 消缺；协议与 freshness 边界；六状态分离展示；close 记录抄写质量和发布事实但不裁判。
- **材料质量治理（II-1）**：新生成 spec/plan 的 AC 四段卡和 tasks 的结构化 oracle 口径统一；验证、通过、失败、证据四段对全部 AC 强制且四段非空；行为验证 oracle 使用 `pass` 与 `reject` 两部分；verification_role=RED 且 paired_task≠N/A 的配对行为验证强制 reject 非空（GREEN 配对仅要求配对关联与 oracle.pass 非空，不强制 reject）；verify 入口只读检查材料存在、身份绑定、非占位符、非零 digest 与当前 snapshot 绑定。
- **verify 独立性（II-2）**：verify 发起异源独立审查请求，记录 executed、failed 或 unavailable，保留原因并在阶段汇报中如实声明；该事实不成为步骤完成、close 或 pass 门槛。
- **上下文管理（II-3）**：build-spec/build-plan 使用 step×M/S/B/P 执行模型、上下文守恒、争议分级、冻结 packet、材料内嵌导航、摘要派发和审查包内容分层；不改变 file-only 冻结投递链，审查包字节不减、零新文件，“审查包 token 下降”为非承诺项。
- **阶段治理闭环（III）**：build-spec/build-plan 入口决策冻结校验与增量 approval_binding 续签链；findings 互斥分类与强制路由及增量决策局部继续；needs_human 暂停态与完成出口白名单；review 预算计数与耗尽路由；provider usage 落盘与字符级代理观测；五阶段统一回退协议与 runtime 完成条件校验。
- **交付组织**：一个任务内分多个 phase，每个 phase 独立形成开发、相关契约和测试事实、用户验收和异源审查事实；实施顺序先材料质量、再上下文组织、再 verify 独立性，精确 phase 边界交 build-plan。
- **页面范围**：N/A — 任务涉及任务治理、CLI/JSON/阶段汇报和质量事实，没有页面、前端路由或视觉交互诉求；“页面范围”只用于确认本范围不新增 UI。
- **条件式 UI 路径记录**：N/A — decision-log 的 UI applicability 三输入核实结果为 `non_ui`；因此 `ui-project-init`、`design-source-readiness` 与 `plan-design-review` 不适用于本任务，本规格不记录 Design.md、预览或页面确认事实。

## 3. 用户场景与状态覆盖

> 本产品的用户可观察面是阶段汇报、CLI/JSON 结果、材料内容和质量事实，而不是页面。每个场景都说明角色、条件、动作和可观察结果。

### SCN-001：正常态——五阶段按已确认方向推进并准备收口

- **角色**：操作者（阶段主会话）与用户。
- **Given**：任务从 make-decision 开始，四份当前材料和用户确认已绑定当前任务；build-spec 只需把已确认方向转成可执行规格。
- **When**：依次进入 build-spec、build-plan、build-code、verify-code，并在收口前读取预检、状态、验收和独立审查事实。
- **Then**：预检只读展示三态；六状态彼此分离；同一缺口只展示一次；确认项按当前 snapshot/material 消缺；质量和发布缺口仍能被 close 记录如实抄写；下一阶段只消费当前材料和交接摘要。

### SCN-002：空态——独立审查真实完成但没有 findings

- **角色**：verify-code 操作者。
- **Given**：异源独立审查请求已执行并返回可信终态，但没有发现问题。
- **When**：阶段汇总审查结果。
- **Then**：记录“已执行且无 findings”的独立审查事实；它不被改写为 unavailable，也不被单独改写为 quality passed；若 provenance 缺失，则保持不完整并明确缺口。

### SCN-003：加载态——后台检查或审查尚未结束

- **角色**：操作者。
- **Given**：预检、独立审查、子代理工作或阶段材料整理已开始但尚未产生终态。
- **When**：操作者查看当前阶段汇报。
- **Then**：stage_status 保持 in_progress 或对应的真实进行中事实；不提前显示 completed、passed 或 released；无页面加载动画，等待状态通过既有事实汇报表达。

### SCN-004：错误态——服务不可用、材料不完整或执行失败

- **角色**：操作者与用户。
- **Given**：预检无法判断、provider 不可用、独立审查执行失败、材料四项检查异常，或输入缺少必要证据。
- **When**：阶段写入或汇总结果。
- **Then**：保留真实 unavailable、failed、unknown 或 incomplete 及原因；协议错配走拒绝写入，语义证据缺失走记录和缺口投影；修复者可在同一任务修复后重验，不因缺失事实伪造通过。

### SCN-005：取消态——用户中止交互或审查

- **角色**：用户与操作者。
- **Given**：用户确认、风险接收或异源审查仍在进行。
- **When**：用户取消，或外部执行被取消或超时。
- **Then**：已收到的答复和已完成成员事实保留；用户明确取消的未答项标为 deferred 且 reason=user_cancelled；未收到答复且没有取消回执时保持 deferred/unavailable，reason=user_no_response 或 receipt_missing，不把三种原因混写；审查成员原始状态可保留 cancelled；成员 cancelled 的聚合映射谓词固定且可判定：该成员存在已发起的 attempt（provider 已执行，无论输出有效与否）→ 聚合事实记 failed；该成员无 attempt（未发起或通道不可用）→ 聚合事实记 unavailable；两种情形各进入 AC-REVIEW 回归夹具；聚合的独立审查事实只能映射为 failed 或 unavailable，不得记为 executed，也不得猜测剩余答复、把取消改成完成或自动接受风险。

### SCN-006：边界态——协议错配、旧收据或无法判断的收口合同

- **角色**：操作者。
- **Given**：写入身份不一致、测试收据不绑定当前 snapshot/material，或九字段合同中的值无法判断。
- **When**：提交事实或运行收口预检。
- **Then**：结构协议错误被明确拒绝；旧事实被标为 stale；合同语义缺失被标为 unknown 或 unavailable 并带原因、owner 和下一复核触发点；缺证据本身不变成阻断门。

### SCN-007：权限态——不可逆操作或风险接收需要人确认

- **角色**：用户与操作者。
- **Given**：准备进行 commit、push、merge、archive、cleanup 等不可逆动作，或要在存在质量/发布缺口时由用户明确接受风险。
- **When**：操作者提交操作或风险处置。
- **Then**：操作必须等待用户明确授权；风险接收必须绑定具体事实、当前 snapshot 和认证回执；没有授权时保持待处理，不能由阶段事实或独立审查代替。若用户要消除当前缺口，status/close 先展示该缺口的 canonical payload 和绑定，用户通过既有 confirmation 边界确认后，确认才参与消缺；payload 缺失时显示 unavailable。

### SCN-008：竞态态——材料、身份或确认在审查期间漂移

- **角色**：操作者。
- **Given**：两次读取之间材料内容、material revision、snapshot 或 provider 身份发生变化，或同一确认被并发提交。
- **When**：系统聚合审查、收据和 confirmation。
- **Then**：旧事实不参与当前判断；不一致的 pair 或收据按边界规则拒绝或标 stale；确认只消费与当前 snapshot/material 匹配的事实；同一当前缺口仍按规范化内容聚合。

### SCN-009：诊断态——操作者阅读三问诊断交付

- **角色**：用户、操作者和独立核查者。
- **Given**：四个历史样本、总结材料和三问取证结果均已整理。
- **When**：用户查看诊断报告。
- **Then**：报告分别展示已核实事实、支持的框架结论、被事实否定或尚未核实的论断；说明正常 close 与风险 close 的差异；回答三问并列出本任务采用、非目标和延期边界。

### SCN-010：材料质量态——新 AC 与负向 oracle 可直接被检查

- **角色**：build-spec 操作者和材料质量检查者。
- **Given**：新生成的 spec 含多个正常、边界和拒绝条件类 AC。
- **When**：按统一材料规则检查 AC 与行为验证角色。
- **Then**：四段式全部存在且非空；verification_role=RED 且配对行为的 oracle 同时有可通过和可拒绝断言（GREEN 配对仅要求配对关联与 oracle.pass 非空）；不满足时直接显示材料不完整，不靠额外脚本改写材料。

### SCN-011：上下文态——按导航和冻结 packet 按需读取

- **角色**：阶段主会话、子代理和独立审查者。
- **Given**：本任务新生成或可写的 spec/plan/tasks 含导航节，历史只读 decision-log 不含导航但保持可读，审查材料包已冻结并分层组织。
- **When**：阶段需要定位一个主题、派发 findings 或发起审查。
- **Then**：主会话先读导航和摘要，再按主题读取详细段落；子代理和审查者只收到相应冻结 packet 并按需读；主会话保留引用、摘要和 hash，不把全文反复塞回上下文；阶段汇报披露导航、派发和 packet 事实。

### SCN-012：独立审查态——三态事实如实记录

- **角色**：verify-code 操作者与用户。
- **Given**：verify 已具备当前材料和异源身份判断。
- **When**：发起独立审查，出现成功、执行失败或通道不可用之一。
- **Then**：分别记录 executed、failed、unavailable 及原因；failed 允许一次既有通道重试；无论结果如何，都不替代自查、不变成 pass 门、不阻止同任务修复或由用户决定 close。

### SCN-013：冻结校验态——build-spec 重开先验证决策冻结

- **角色**：build-spec/build-plan 操作者与用户。
- **Given**：decision-log 已收口，头部 approval_binding、正文“最终确认”节与 step 11 记录的状态及材料绑定可能一致也可能不一致。
- **When**：阶段入口执行决策冻结前置校验。
- **Then**：三方一致、绑定当前材料 revision/snapshot、无方向级未决且冻结包合同满足时，校验通过并开始规格化；任一不满足时暂停该阶段并回 make-decision 补齐，不开始规格化；增量决策后的“基线确认+增量增补链”被入口接受，不对历史确认全量重确认。

### SCN-014：路由态——review finding 分类决定处置方

- **角色**：当前阶段操作者与用户。
- **Given**：一次 review 产生若干 findings，每条可能属于 direction_change、spec_ambiguity、implementation_defect 或 invalid_finding。
- **When**：逐条分类并处置。
- **Then**：实现级当前阶段自修；规格歧义用大白话问用户一次并绑定答复；方向级回 make-decision 走增量决策、续签并只从受影响闭包继续；无效 finding 拒收并附依据；缺依据、命中方向维度或无法互斥分类的 finding 不得以 fixed 完成；路由错误被记录并阻断该阶段正式完成，但不阻断同任务修复。

### SCN-015：暂停态——needs_human 等待用户而不是完成

- **角色**：用户与当前阶段操作者。
- **Given**：某条 finding 需要用户决定，阶段主会话不能自行裁决。
- **When**：处置标为 needs_human。
- **Then**：它只作为暂停态出现，必须附 next_action（ask_user、return_to_make_decision 或 return_to_spec）；阶段 completion 保持 incomplete 并如实汇报；禁止作为 formally complete 的最终处置；用户答复后转 user_decided（绑 finding_id、card_hash、reply_ref），或方向级增量决策后再处置，或 accepted_risk（绑用户授权回执与风险记录）。

### SCN-016：预算态——review 轮次按冻结 revision 守预算

- **角色**：当前阶段操作者与审查 provider。
- **Given**：同一材料的同一冻结 revision 上已做过一次初始 review，材料之后发生实际变化或增量续签产生新冻结 revision。
- **When**：再次发起审查。
- **Then**：无变化禁止重审；材料变化后最多一次 focused review（只复核变化范围）；每次增量续签产生一次新的 focused 配额；focused 后仍有残留时实现级再修一次并做窄域 diff 核销一次，仍不收敛或属方向级则转问用户或 accepted_risk；provider 失败、空桩或超时记录 attempt 层 unavailable，不算 pass、不改写为空 findings。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-009、SCN-010、SCN-011。
- [x] **空态**：SCN-002；“可信空 findings”与“无 provenance 的空结果”分别呈现，不共享通过语义。
- [x] **错误态**：SCN-004、SCN-006、SCN-012。
- [x] **加载态**：SCN-003；非 UI 产品以真实 in_progress 事实表达等待，不引入页面加载状态。
- [x] **取消态**：SCN-005。
- [x] **边界态**：SCN-006、SCN-008；覆盖协议拒绝、stale、unknown 和 confirmation 竞态。
- [x] **权限态**：SCN-007；不可逆动作和风险接收均要求用户明确授权。
- [x] **竞态**：SCN-008；材料、身份、确认和聚合均按当前快照处理。
- [x] **冻结校验态**：SCN-013；入口完成条件检查通过才开展规格化，不满足暂停回 make-decision。
- [x] **路由态**：SCN-014；finding 互斥分类决定处置方，路由错误阻断正式完成不阻断修复。
- [x] **暂停态**：SCN-015；needs_human 保持 completion=incomplete 并附 next_action，答复后走四个出口之一。
- [x] **预算态**：SCN-016；review 轮次按冻结 revision 计数，耗尽有确定出口，provider 空桩不算 pass。

## 4. 产品事实与假设（PFACT）

> 每条 PFACT 只声明一个状态。status 只允许 `verified`、`inferred`、`not_applicable`；verified/inferred 必须带“证据或来源”，not_applicable 必须带“不适用理由”。`inferred` 只表示受证据限制的产品推断，不把推断写成已核实事实。

- **PFACT-001**：四个历史任务样本共同显示，verify/close 期间存在重复投影、外部事实缺失或边界错配；总结材料的部分具体数字和因果断言与任务事实不一致。
  - **status**：verified
  - **证据或来源**：F-004、F-010～F-016、总结文件核实表。
  - **关联**：FR-DIAG-001、FR-REPORT-001；AC-DIAG-001、AC-REPORT-001。

- **PFACT-002**：核查样本同时包含标准 close 且 quality incomplete 的任务、明确 delivered-with-risk 的任务，以及确认事实与缺口投影冲突的任务。
  - **status**：verified
  - **证据或来源**：F-012、F-013、D-202。
  - **关联**：FR-DIAG-001、FR-GAP-002、FR-STATUS-001、FR-REPORT-001；AC-DIAG-001、AC-GAP-002、AC-STATUS-001、AC-REPORT-001。

- **PFACT-003**：现有流程有多个局部事实选择和多个缺口文本投影，但没有统一的非持久缺口派生和渲染层去重语义。
  - **status**：verified
  - **证据或来源**：F-017～F-019、D-205。
  - **关联**：FR-GAP-001、FR-GAP-002、FR-PREF-002；AC-GAP-001、AC-GAP-002、AC-PREF-002。

- **PFACT-004**：协议身份与当前快照绑定的校验存在边界缺口；结构不一致和语义证据缺失需要不同处理。
  - **status**：verified
  - **证据或来源**：F-020、F-021、D-206。
  - **关联**：FR-BOUND-001、FR-BOUND-002、FR-PREF-001；AC-BOUND-001、AC-BOUND-002、AC-PREF-001。

- **PFACT-005**：四份材料对后续执行的保障度为中等，最大缺口包括模板标签错位、通过/失败/证据段落没有统一检查、拒绝条件缺少正式表达位，以及 verify 不检查材料身份完整性。
  - **status**：verified
  - **证据或来源**：F-037～F-039、三问材料质量取证。
  - **关联**：FR-DIAG-002、FR-MATERIAL-001、FR-MATERIAL-002、FR-MATERIAL-003；AC-DIAG-002、AC-MATERIAL-001、AC-MATERIAL-002、AC-MATERIAL-003。

- **PFACT-006**：系统档案没有可用于本任务的 token 度量机制；build-spec/build-plan 的主要成本放大因素是主会话全量重读、阶段内上下文重复、审查材料包缺少分层和 findings 处置集中在主会话。
  - **status**：verified
  - **证据或来源**：F-033～F-035、F-043、三问成本取证。
  - **关联**：FR-DIAG-002、FR-CONTEXT-001、FR-CONTEXT-002、FR-CONTEXT-003；AC-DIAG-002、AC-CONTEXT-001、AC-CONTEXT-002、AC-CONTEXT-003。

- **PFACT-007**：审查系统已有冻结材料包和 file-only 投递边界；审查者应读取冻结副本而不是任意读取宿主或任务目录，当前差距是包内缺少导航、摘要和按需引导层次。
  - **status**：verified
  - **证据或来源**：F-041、F-042、D-304、D-305。
  - **关联**：FR-REVIEW-001、FR-CONTEXT-002、FR-CONTEXT-003；AC-REVIEW-001、AC-CONTEXT-002、AC-CONTEXT-003。

- **PFACT-008**：make-decision 已真实使用交互、独立研究、红蓝审查、辩论、结构化确认和上下文守恒；本任务不重新定义 make-decision 的执行规范。
  - **status**：verified
  - **证据或来源**：F-031、F-040、最终确认与阶段末检查记录。
  - **关联**：FR-DIAG-002、FR-FLOW-001、FR-CONTEXT-001；AC-DIAG-002、AC-FLOW-001、AC-CONTEXT-001。

- **PFACT-009**：本任务没有页面、前端路由或视觉交互；用户可见结果来自阶段汇报、CLI/JSON 结果、材料和质量事实。
  - **status**：not_applicable
  - **不适用理由**：原始需求和已确认方向只涉及任务治理、材料、审查、状态和 close 事实；若未来出现页面诉求，应另行重新收敛范围。
  - **关联**：FR-FLOW-001、FR-REPORT-001；AC-FLOW-001、AC-REPORT-001。

- **PFACT-010**：用户已确认保持五阶段顺序、close 三义、不新增公共入口或新 gate，并接受在一个任务中分 phase 实施；新增能力必须保持现有材料真相和人类授权边界。
  - **status**：verified
  - **证据或来源**：R-003、R-004、D-002、D-202、D-204、D-305、D-306。
  - **关联**：FR-FLOW-001、FR-FLOW-002、FR-GOV-001、FR-STATUS-001；AC-FLOW-001、AC-FLOW-002、AC-GOV-001、AC-STATUS-001。

- **PFACT-011**：导航和摘要是否能让每个审查者按需读取足够详细材料，取决于审查引导的实际有效性；该效果需要本任务观察而不能预先宣称。
  - **status**：inferred
  - **证据或来源**：G-002、RISK-007、F-041；限制是审查者按清单读取的深度尚无统一最低阈值。
  - **关联**：FR-CONTEXT-002、FR-CONTEXT-003；AC-CONTEXT-002、AC-CONTEXT-003。

- **PFACT-012**：历史 verify 阶段缺少可信独立审查事实是已核查的质量缺口；异源判定应沿用既有身份校验链，而不是模型等级或阶段绑定。
  - **status**：verified
  - **证据或来源**：F-035、F-038、F-042、D-303。
  - **关联**：FR-REVIEW-001、FR-REPORT-001；AC-REVIEW-001、AC-REPORT-001。

- **PFACT-013**：第二轮 build-spec 复盘显示，上游决策状态不唯一、无冻结校验、findings 无分类路由、needs_human 被当终态、无 review 预算与 usage 记录，导致一次 build-spec 消耗 5.3 小时、约 16 次审查不收敛。
  - **status**：verified
  - **证据或来源**：F-044、N-008、N-009、D-501～D-506。
  - **关联**：FR-LOOP-001～006；AC-LOOP-001～006。

- **PFACT-014**：落点审计确认现网无运行期冻结校验器、finding disposition 无分类字段、needs_human 被判 recorded 而非 incomplete、review attempt 已有 usage 字段但无消费方、finding 级用户答复无持久载体。
  - **status**：verified
  - **证据或来源**：F-045、D-502、D-503、D-505。
  - **关联**：FR-LOOP-001、FR-LOOP-002、FR-LOOP-003、FR-LOOP-005；AC-LOOP-001、AC-LOOP-002、AC-LOOP-003、AC-LOOP-005。

- **PFACT-015**：decision-log 第二轮已收口 accepted（确认回执 f1e28231，绑 revision-e9bc49bc 与 snapshot e94e3cee），I/II/III 方向语义全部冻结且无方向级未决，build-spec 输入决策即该冻结版本。
  - **status**：verified
  - **证据或来源**：decision-log“第二轮状态”节、方向卡 v4.3、D-501。
  - **关联**：FR-LOOP-001、FR-FLOW-001；AC-LOOP-001、AC-FLOW-001。

- **PFACT-016**：独立审查 provider 完成率约四到七成且 completed 调用的 usage 全 null；usage 与字符级代理指标只能如实落盘或标 unavailable，不能据此承诺成本下降。
  - **status**：verified
  - **证据或来源**：F-035、F-044、D-505、T-030、T-035。
  - **关联**：FR-LOOP-004、FR-LOOP-005；AC-LOOP-004、AC-LOOP-005。

## 5. 功能需求

### 诊断交付（DIAG）

本域把历史核查和三问取证交付成用户可读的诊断事实，不把研究报告变成推进门，也不把总结材料的未经核实断言直接升级为产品事实。

- **FR-DIAG-001**：交付综合诊断报告，按独立核查结果说明四个历史样本的共同模式、样本差异、总结材料的支持项与不支持项，并明确标准 close、质量不完整、发布未发生和 delivered-with-risk 之间的认知差异。
  - **范围边界**：覆盖已批准的历史样本和内部材料；canonical 诊断载体固定为当前任务的 stage evidence 文件 `evidence/diagnostic-report.md`，文件必须包含 research-Q1、research-Q2、research-Q3、综合结论四个固定部分，并声明 task_id、材料 revision、来源文件和 build-plan 消费者；它是 evidence，不是第五材料。不重放真实外部任务，不改写历史记录，不把未核实断言写成事实。
  - **依据**：R-001、R-002、D-001、D-101；PFACT-001、PFACT-002。
  - **场景**：SCN-009。
  - **验收**：AC-DIAG-001。

- **FR-DIAG-002**：诊断报告必须回答三问并给出综合结论：make-decision 强化实际实现效果；build-spec/build-plan 高消耗的结构性原因和不做 token 度量的边界；四份材料是否足以让后续执行者按明确判据交付，以及模板、oracle、verify 独立性和上下文管理如何补足缺口。
  - **范围边界**：交付分析和已批准治理方向；不记录模型与阶段的强制绑定，不承诺总 token 下降，不扩展 make-decision 规范。
  - **依据**：R-007、R-008、R-009、R-010、D-301、D-302、D-304、D-306；PFACT-005、PFACT-006、PFACT-008。
  - **场景**：SCN-009。
  - **验收**：AC-DIAG-002。

- **FR-DIAG-003**：本任务的 dogfood 观察必须携带五要素合同：观察阶段、样本、独立观察者、观察窗口和判定口径；它只补充负向夹具和独立质量事实，不自证完成。
  - **范围边界**：观察对象是本任务“收口治理 I”与“质量-成本治理 II”机制改造完成后的真实运行记录；具体 phase 边界由 build-plan 使用同一命名锁定；独立观察者=decision-log 已批准定义：主会话之外由 build-code/verify-code 的独立审查与 stage-end 检查记录（若不可得则如实记 unavailable，不替代）（定义出处=decision-log「验收细节」节）；独立观察者不可得时如实记 unavailable。
  - **依据**：D-401；PFACT-002、PFACT-012。
  - **场景**：SCN-009、SCN-012。
  - **验收**：AC-DIAG-003。

### 流程与 phase 组织（FLOW）

本域保持标准流程和一个任务多 phase 的连续性，让后续阶段只细化已确认方向而不重新决定产品范围。

- **FR-FLOW-001**：任务必须按 make-decision → build-spec → build-plan → build-code → verify-code 的顺序运行；make-decision 开始前必须已有认证 worktree 事实，绑定 task_id、branch、worktree path 和创建时 snapshot；一个任务可以分多个 phase，但 phase 之间共享同一组当前材料和交接事实；build-spec 只细化已确认需求，不新增方向。
  - **范围边界**：允许同任务内按语义维度分 phase；不拆成需要跨任务交接的替代任务，不改变五阶段顺序。
  - **依据**：R-003、R-004、D-001、D-002、D-402；PFACT-008、PFACT-010。
  - **场景**：SCN-001。
  - **验收**：AC-FLOW-001。

- **FR-FLOW-002**：每个 phase 都必须能单独汇报本 phase 工作、相关契约与测试事实、用户验收事实、异源审查事实和下一 phase 边界；本任务的实施顺序遵循材料质量、上下文组织、verify 独立性；早期 smoke 只有在实施前核实其根因支撑时采用，若不被支撑可裁剪；review 语义收紧不形成新的推进门。
  - **范围边界**：phase 失败或 provider unavailable 只记录退化事实，不吞掉其他独立 phase；精确 phase 边界、夹具和 oracle 由 build-plan 承接。
  - **依据**：D-201、D-301、D-306、D-401；PFACT-006、PFACT-010。
  - **场景**：SCN-003、SCN-004。
  - **验收**：AC-FLOW-002。

- **FR-FLOW-003**（当前方向依据=D-507，承接 D-301；第一轮 spec-clarify 回执 quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json 仅为历史执行佐证，不替代 D-507 或当前增量确认绑定）：每个 phase 的用户验收必须形成独立事实，复用既有 human-confirmation/interactions 载体，不新增 store、第二状态机或独立 phase 账本；事实绑定 task、phase、当前 material revision、snapshot、confirmation receipt 和用户回执；owner 是当前 phase 主会话，读取方是阶段汇报、build-plan 和 verify-code。验收事实只能如实记录用户明确 accepted、rejected、deferred，或交互/回执 unavailable；这些值是对用户事实的记录，不是新的自动状态机、推进门或 current 选择算法。验收记录是被动的、非阻断的事实记录：只消费既有 human-confirmation/interactions 载体上已存在的真实用户答复，仅当既有交互载体已有真实答复时记录 accepted/rejected/deferred；不存在既有确认交互时直接记录 unavailable（带真实原因）或 deferred，不得新增 build-code 阶段的用户确认提示或日常确认（宪法 F7：正常确认只保留 make-decision、build-plan、verify-code 三处，build-code 不增加日常确认），也不得为形成验收事实发起新的确认请求。用户未答、取消或回执缺失保持 deferred/unavailable，不得由阶段完成或风险接收推断。恢复建议固定为：rejected 提示当前 phase 修复后重新请求验收；deferred 提示待用户答复并只做不依赖该验收的工作；unavailable 记录真实原因并可按既有公共合同重试；系统只如实消费这些事实和建议，不新增自动阻断 gate。phase 验收事实与第 8 节的 acceptance_status 是两个并列事实：accepted 只表示用户接受该 phase 的验收请求，不从逐 AC 证据推导 pass；acceptance_status 只由逐 AC 验收证据派生，也不由 phase accepted 改写；阶段汇报必须并列展示二者及原因。deferred/unavailable 的 reason 只允许 user_cancelled、user_no_response、receipt_missing、unknown_reason 或 unavailable 的真实通道原因；无法区分时使用 reason=unknown_reason，不新增 unknown 顶层验收值，也不猜。phase 验收事实不参与 product_release_status 或 physical_close_status 的派生；product_release_status 仍只由五阶段当前完成、逐 AC 验收证据和既有 verify human-confirmation receipt 派生，physical_close_status 仍只由授权后的物理读回派生；phase rejected/deferred/unavailable 必须在阶段汇报和 close 记录旁显示，由用户决定下一步，不产生自动阻断或自动完成。
  - **范围边界**：该事实是验收记录，不是新的 stage、gate、质量决议、attempt 重试链或 current 选择算法；rejected/deferred 只影响该 phase 的验收可见性和后续用户决定；不发起任何新的逐 phase 确认请求，F7 的确认边界保持不变。
  - **依据**：D-507（当前 phase 验收方向）、D-301、D-401；PFACT-010。
  - **场景**：SCN-003、SCN-004、SCN-005、SCN-007。
  - **验收**：AC-FLOW-003。

### 收口预检与合同（PREF）

本域把收口可行性前移为只读事实，避免下游补需求，同时保持预检不是 close 或继续工作的门槛。

- **FR-PREF-001**：本规格第 11 节所有 in-scope AC 都默认适用九字段收口合同：producer、consumer、owner、命令、fixture、oracle、证据路径、freshness、close 条件；没有豁免清单；每个字段都说明其业务含义和缺失时的可观察处理。
  - **范围边界**：build-spec 填写产品级字段值；精确命令、fixture 文件和实现 schema 若不能在产品规格中锁定，必须写 `unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)`，不得猜成已知；build-plan 在冻结 tasks 前必须逐项替换为具体命令、fixture、证据路径和可判定 oracle，或保留 unavailable 并写明真实原因；保留 unavailable 的 AC 只能得到 preflight=unavailable 和 acceptance=incomplete，不能被标 ready 或 accepted；这不改变既有 close 语义，用户明确授权时仍可保留缺口事实进行 close，physical_close_status 仍由物理读回决定；不得新增第五份材料、另建需求账本或缩小覆盖面。
  - **依据**：D-201、D-402；PFACT-003、PFACT-004、PFACT-010。
  - **场景**：SCN-001、SCN-006。
  - **验收**：AC-PREF-001。

- **FR-PREF-002**：预检只读消费九字段合同和覆盖边界声明，且只产生 ready、unknown、unavailable 三种 advisory 状态；ready 表示合同足以定位可验证行为，unknown 表示有事实但当前不能判定，unavailable 表示生产者、消费方或验证资源不可用；预检不产生 blocked，不接触 can_continue、physical_close 或 close 三义，也不要求每个 phase 重跑。覆盖边界声明是 build-plan 末端生成的 evidence 对象，不是第五材料；字段固定为 task_id、material_revision、snapshot_tree、ac_ids、每条 AC 的 producer/consumer/owner/命令/fixture/oracle/证据路径/freshness/close 条件、明确排除项及原因、source_hash；producer=build-plan 主会话，consumer=status/close 只读展示，owner=build-plan；未列出的 in-scope AC 必须产生 unknown/unavailable，不能通过缩小范围得到 ready。build-spec 只保证每条 in-scope AC 有九字段合同和交接语义；命令、fixture 或可执行 oracle 仍为 unavailable 时，预检如实输出 unavailable，不把 build-plan 尚未替换的产品级延期误报为 ready。
  - **范围边界**：build-plan 末端提供已声明覆盖范围的预检；后期缺口由状态、投影和 close 前只读复核暴露；不把预检扩成全链路门禁。
  - **依据**：D-203、D-204；PFACT-003、PFACT-010。
  - **场景**：SCN-003、SCN-004、SCN-006。
  - **验收**：AC-PREF-002。

### 缺口派生与确认消缺（GAP）

本域提供一个当前渲染快照内的 canonical 缺口语义，消除同一缺口多处放大的观感，同时保留来源以便追溯。

- **FR-GAP-001**：同一渲染快照内的 gap_id 必须由规范化缺口语义确定性派生；canonical payload 固定为 `subject_id、gap_kind、expected_fact、actual_fact、reason` 五字段，字段序与 D-205 v4.3 冻结元组一致（第 1 字段 task/material 身份、第 2 字段缺口类别、第 3 字段规范化内容正文）；其中 `subject_id` 固定为 task/material 身份字段（绑定 task_id 与当前材料身份），`gap_kind` 为缺口类别，`expected_fact`+`actual_fact` 组成规范化内容正文（两事实字段顺序固定）；其中 reason 是非空 provenance 列表，每项为 `{producer, reason_text}`，只用于用户阅读和追溯，不参与 gap_id 身份；canonical 缺口展示记录必含 `owner` 字段（owner=产生该缺口的当前阶段主会话，路由语义=该缺口的修复责任方；owner 不参与 gap_id 哈希，绑定 snapshot/material 与来源）。gap_id 的唯一可执行字节合同见下方“GAP 字节合同”；固定测试样例（跨投影/字段序/空白/快照变化与冲突）已由 build-spec 针对性生成、独立核对并落盘（证据绑定见下方“GAP 字节合同”末尾），本条锁定算法且向量已可核对。collision 判定只限两种情形：①同一 gap_id 的四身份字段规范化值不一致（不同缺口被误判为同一 ID）或②发生 SHA-256 哈希冲突。任一情形成立时，当前渲染显示 `gap_projection_unavailable`、reason=invalid_gap_collision，不自动合并，也不允许任何 gap-bound confirmation 消缺，直到生产者修复（溯源注记：本节的 collision 不自动合并与确认消缺禁用语义、以及 malformed 身份字段的 fail-loud 展示语义，由 D-205 的“human-confirmation 确认事实必须绑定 gap_id+snapshot+material，防同快照多缺口错配消费；跨投影/字段序/空白/快照变化与冲突的固定样例由 build-spec 落盘”与 D-206 的“结构性不一致=协议错误→fail-loud 拒绝，不得被静默丢弃或改写成 unavailable 通过”共同授权，属于 D-205/D-206 授权的确定性合同细化，不是方向新增）。canonical payload 仅在 reason/provenance 上的差异按本节去重排序规则合并，不触发 collision。不同投影为同一 gap_id 提供多个 reason 时，每项的 producer 和 reason_text 都做 Unicode NFC、去首尾空白、连续空白归一；按 `(producer, reason_text)` 精确去重，再按 producer、reason_text 的 UTF-8 字节无符号字典序排序，形成 canonical provenance 列表；reason 列表不改变 gap_id，也不把任一 producer 的 reason 提升为唯一原因。若任一 gap_id 身份字段是数字、数组或对象，该缺口不得被静默丢弃：当前渲染必须显示 `gap_projection_unavailable`，保留 producer、subject_id、reason=invalid_gap_identity、owner=当前阶段主会话和修复建议；此时不生成 gap_id，也不参与确认消缺。
  - **范围边界**：同快照同内容得到同一 gap_id；材料或 snapshot 变化可以得到新值或使缺口消失；不得建立持久 selector、登记表或第二缺口状态机；既有旧投影固定为 `quality_gaps`、`release_gaps`、`product_release_reasons`、`close_preparation_gaps`：producer 分别是质量决议、发布派生、发布解释和收口预检；consumer 统一收敛到 status/close 只读展示；canonical 投影替代它们的重复展示，旧别名投影在消费者迁移后删除。材料检查不完整映射为 `material_integrity_gap`，独立审查失败映射为 `review_execution_gap`，provider 不可用映射为 `provider_unavailable_gap`，review_result=executed 但 provenance_status=incomplete 映射为 `review_provenance_gap`；这些映射只决定当前渲染的 canonical 展示，不改写原始事实，也不新增 store 或 gate。
  - **依据**：D-205、D-206（fail-loud 与防错配消费语义授权本节 collision/malformed 的展示与禁用消缺细节）；本轮用户澄清确认；PFACT-003。
  - **场景**：SCN-006、SCN-008。
  - **验收**：AC-GAP-001。

#### GAP 字节合同（FR-GAP-001，D-205 授权的确定性转译）

- 本合同只补齐 D-205 已冻结的四身份字段、固定字段序、空白规范化、UTF-8 SHA-256 全值和版本号，不新增身份维度、持久对象或方向选择。`algorithm_version` 的类型为 string，唯一合法值为 `gap-id.v1`；未知版本不回退猜测，显示 `gap_projection_unavailable(reason=invalid_gap_identity)`。
- 定义文本规范化 `N(x)`（仅用于内容字段与留空哨兵场景）：缺失或 null 先变成字面字符串 `unknown`；其他输入必须为 string（boolean、number、array、object 均拒绝）。身份字段（task_id、material_name、material_revision）不适用该 unknown 回退：任一身份字段缺失或 null 一律判定 invalid_gap_identity，禁止生成 gap_id、禁止参与确认消缺，也不进入 subject 构造；unknown 哨兵只保留给 gap_kind、expected_fact、actual_fact 这类内容字段。拒绝未配对 UTF-16 surrogate；按 Unicode 15.1 NFC 规范化，然后将下列固定码点集合中每个最大连续串替换成一个 U+0020，再删除首尾 U+0020：U+0009～U+000D、U+0020、U+0085、U+00A0、U+1680、U+2000～U+200A、U+2028、U+2029、U+202F、U+205F、U+3000。不依赖语言运行库的 `trim`/`\s` 定义；U+FEFF、U+200B 不属于本集合。保留大小写；空字符串仍为空字符串，不改成 unknown。
- 定义规范 JSON 文本 `J(x)`：数组保序；对象键按未转义键的 UTF-8 字节无符号字典序递归排序（本合同的固定字段名全为 ASCII，因此等价 ASCII 字典序）；重复键拒绝。字符串及对象键必须只含 Unicode 标量值，未配对 surrogate 拒绝；字符串不额外做 NFC/空白处理；双引号转义为 `\"`，反斜线为 `\\`；U+0008/0009/000A/000C/000D 分别为 `\b`/`\t`/`\n`/`\f`/`\r`；其余 U+0000～001F 为小写十六进制 `\u00xx`；斜线和其他 Unicode 标量值直接输出（含非 ASCII、U+2028/U+2029），不输出 surrogate 转义。null/boolean 分别为 `null`/`true`/`false`；数值只接受绝对值不大于 9007199254740991 的整数，以十进制无前导零表示，负零为 `0`；其他数值拒绝。冒号、逗号两侧无空白，不输出缩进、BOM 或末尾换行。`B(x)` 是 `J(x)` 的严格 UTF-8 编码，不加终止字节。JSON 中对象字段出现顺序不得改变输出。
- `subject_id` 是一个 string，唯一构造为 `J([N(task_id),N(material_name),N(material_revision)])`；材料身份明确由 material_name 与 material_revision 组成，material_name 非缺失且非 null 时只允许 `decision-log`、`spec`、`plan`、`tasks`（经 N 后检查）。缺失/null 身份分量不归一 unknown、不参与身份构造，判定为 invalid_gap_identity；不能用路径、冒号拼接、对象或任意预拼字符串代替。生产者提交的 subject_id 必须与绑定分量重算值精确相同；不一致为 invalid_gap_identity。subject_id 已由分量规范化构造，不再对整段 JSON 字符串二次 N；缺 subject_id 时由绑定分量构造，绑定分量缺失不猜（判定 invalid_gap_identity，不生成 ID）。material_revision 指被观察的当前材料 revision，不是 producer、review attempt 或证据刷新次数；同一当前材料的跨投影证据刷新必须复用该 revision，所以不破坏同快照同内容去重。其入 subject 依据是原 FR-GAP-001 的“当前材料身份”及材料变化可得新 ID；不承诺跨材料版本 ID 稳定。snapshot_tree 是独立 freshness 绑定，不添加到 subject 元组或 hash 输入，因为 D-205 只要求同快照确定性而不是以快照作为缺口语义；只换 snapshot 可保留相同 ID，但旧确认仍因四元组绑定不匹配而 stale。
- 唯一预像数组（恰好五项）为 `["gap-id.v1",subject_id,N(gap_kind),N(expected_fact),N(actual_fact)]`，下标 0 为版本，1～4 保持 D-205 四身份字段序；subject_id 在外层是经 J 再转义的字符串，不是嵌套数组。`gap_id = "gap-" + lowercase_hex(SHA-256(B(预像数组)))`，digest 恰好 64 位十六进制，不截断。payload 的 reason、producer/provenance、owner、snapshot_tree、展示文本、时间戳及其他外层字段均不入预像；material_revision 已在 subject 内，不重复加入。
- owner 必须随正常缺口记录保留并路由修复，但改 owner/reason/provenance 不改变 ID。provenance 的 producer/reason_text 使用 N，二元组精确去重，再按两字符串的 UTF-8 字节无符号字典序排序。四身份字段规范化后相等才可合并；仅 provenance 不同不算 collision。非法类型、缺失/null 身份字段、编码、版本或 subject 绑定不生成 ID且不参与消缺，按 FR-GAP-001 保留原输入、来源、owner 和修复建议；不能静默丢弃缺口。
- AC-GAP-001 的固定向量须包含输入绑定、规范化分量、subject 字符串、完整预像 UTF-8 hex 与完整期望 digest，并覆盖字段序、空白/Unicode、跨 producer、owner 排除、快照变化和非法输入/冲突。算法已在本条锁定，不由 build-plan 重新决定，后续 build-spec/verify 仅按固定向量核对；固定向量已落盘并独立核对：`evidence/build-spec-review/hash-contract-vectors.json`（gap 6 向量、packet 5 向量、24 项变异/非法样例检查）与自检记录 `evidence/build-spec-review/hash-contract-vectors-check.json`（exit 0，绑定生成时 spec sha），并绑定为 AC-GAP-001 的验收证据项。

- **FR-GAP-002**：只有 gap-bound human-confirmation 参与消缺：status/close 的当前缺口投影负责生成用户可读的确认内容，内容必须包含 canonical 五字段 payload（其中 reason 为 FR-GAP-001 定义的 canonical provenance 列表）、`task_id、material_revision、snapshot_tree` 和由 payload 派生的 gap_id；用户通过既有 confirmation 边界确认后，写入既有 human-confirmation 载体并保留确认回执，不新增公共入口或新的确认 store。该类确认的消费方是 canonical gap 投影，owner 是当前阶段主会话；同一既有 human-confirmation/interactions 载体上的 phase 验收或风险接收确认若不携带该 payload，缺口投影必须忽略，不得要求它们改 schema。渲染时由 gap-bound payload 重新派生 gap_id，并要求 `task_id、material_revision、snapshot_tree、gap_id` 四元组与当前缺口匹配；匹配的确认优先消除对应缺口，旧确认不消费；多个旧投影必须收敛到同一派生源，同一当前缺口只展示一次，同时保留每个投影的 provenance。并发确认按完全相同的 payload 与绑定去重，绑定不同则各自 stale 或 current，不靠文本相似度合并；若 status/close 无法生成完整 payload，消缺入口显示 unavailable，不伪造确认。
  - **范围边界**：确认只改变当前缺口的可观察投影，不改写原始事实；close 仍由既有 close 语义处理，不因确认消缺自动宣称质量或发布通过；任一绑定字段不匹配即视为 stale，不得靠文本相似度消费。
  - **依据**：D-202、D-205、第二轮用户澄清确认；PFACT-002、PFACT-003。
  - **场景**：SCN-002、SCN-008。
  - **验收**：AC-GAP-002。

### 边界校验与证据缺失（BOUND）

本域严格区分“写入协议错了”和“事实暂时没有”，前者 fail-loud，后者如实记录并允许同任务修复。

- **FR-BOUND-001**：当桥接写入中的 agent identity 与 attempt identity 不一致，或测试收据不绑定当前 snapshot/material 时，写入必须被拒绝并显示具体错配原因；被拒绝的记录不能作为当前事实。
  - **范围边界**：只拒绝结构性协议错误；不把 provider unavailable、无证据或 unknown 当成相同错误，不改写底层真实错误。
  - **依据**：D-206；PFACT-004。
  - **场景**：SCN-006、SCN-008。
  - **验收**：AC-BOUND-001。

- **FR-BOUND-002**：当证据缺失、provider unavailable、材料检查不完整或独立审查 failed 时，产品必须记录状态、原因、owner 和下一步，而不是阻断同任务修复；缺失事实必须进入缺口或 incomplete 投影，且不得被写成 pass。材料检查不完整、provider unavailable、独立审查 failed，以及 review_result=executed 但 provenance_status=incomplete 的可信度缺口，必须按 FR-GAP-001 的固定映射进入 canonical gap 展示，保证用户能在 status/close 的同一处看到当前缺口；review_provenance_gap 的 owner=verify-code 阶段主会话，next_action=补齐 provenance 后重验；其他缺失事实仍按 incomplete/unknown 投影如实显示。
  - **范围边界**：不自动接受风险、不自动 close、不把“没有结果”变成“空结果”；用户仍可在事实可见后决定是否 close。
  - **依据**：D-203、D-206、D-303、本轮用户澄清确认；PFACT-004、PFACT-012。
  - **场景**：SCN-002、SCN-004、SCN-005、SCN-012。
  - **验收**：AC-BOUND-002。

### 六状态分层（STATUS）

本域只分离展示既有事实，不建立新的状态机或从一个状态推导另一个状态。

- **FR-STATUS-001**：产品必须独立展示六种状态及其唯一来源：can_continue 来自工作区和材料可读事实；stage_status 来自当前 stage outcome；quality_status 来自独立质量决议；acceptance_status 来自逐 AC 验收证据；product_release_status 来自五阶段当前完成、逐 AC 验收证据和既有 verify human-confirmation receipt；这里的 verify confirmation 只指用户验收回执，不指 dispatch_attempt 或 review_result；独立审查结果是证据，除非被独立质量决议另行消费，否则不参与 release 派生；physical_close_status 来自 close 的物理事实。“独立”表示展示状态不能从其他展示状态直接复制或改写；多个状态可以共享底层事实，但必须按各自来源规则重新派生。
  - **范围边界**：六状态互不推导；quality_status 不由预检或 close 投影写入；展示层不创建第二状态机；共享事实变化可以同时影响多个派生结果，但不能让一个状态覆盖另一个状态。
  - **依据**：D-202、D-207；PFACT-002、PFACT-010。
  - **场景**：SCN-001、SCN-003、SCN-004、SCN-008。
  - **验收**：AC-STATUS-001。

- **FR-STATUS-002**：close 记录必须如实抄写当前 quality_status、product_release_status、acceptance_status 和 physical_close_status，并绑定当前 snapshot/material。授权物理动作完成后，必须以动作后的 snapshot/material 重新读取物理结果并保留真实失败原因；close 记录不写死 pre-close/post-close 两段结构，也不要求维护独立 close 账本。任一输入缺失或 stale 时保持 unknown/incomplete/stale，不得由 close 记录裁判质量、发布或验收，也不得改变既有 close 三义。
  - **范围边界**：close 记录只是当前事实抄写给用户和后续审计；不新增 close gate、不自动接受风险、不把 unavailable 改写成通过。
  - **依据**：D-202、D-207、本轮用户澄清确认；PFACT-002、PFACT-004、PFACT-010。
  - **场景**：SCN-001、SCN-004、SCN-007、SCN-012。
  - **验收**：AC-STATUS-002。

### 材料质量与负向 oracle（MATERIAL）

本域只约束新生成材料的产品表达和可判定性，既有 AC 语义不变，历史材料不回溯迁移。

- **FR-MATERIAL-001**：新生成 spec、plan、tasks 使用两套职责分明的材料 schema：`AC 四段卡`（plain `验证：` 加验证、通过、失败、证据四个非空段）用于 spec/plan 中的验收表达；`任务 oracle`（结构化 `pass`/`reject`）用于 tasks 中的行为验证。两类 schema 不互相替代；spec 中的 `fr_id`/`ac_id` 是跨材料稳定主键；plan 必须原样继承，不得改写；tasks 每个 oracle 恰好映射一个当前 AC，且 ac_id/fr_id 必须在当前 spec/plan 中存在；同一 task_id 不得重复，同一 oracle 不得指向多个 AC；RED/GREEN 配对任务允许共享同一个 ac_id/fr_id，但必须通过 paired_task 显式连接，非配对的重复映射判材料不完整。缺失、重复、错指或 plan/tasks 漂移均判材料不完整。plan 的“原样继承”不仅包括 ac_id/fr_id，还包括 AC 的验证、通过、失败、证据四段语义，以及九字段合同中的产品语义字段（producer、consumer、owner、freshness、close 条件）；命令、fixture、证据路径、oracle 是 FR-PREF-001 明确授权 build-plan 在 tasks 冻结前替换或继续标注 unavailable 的延期字段，按该规则替换不算漂移；plan 可以在独立实现节追加 phase、命令、fixture 和任务拆分，但不得在同一 AC 上改写产品语义；漂移检查比较规范化后的 AC payload，规范化规则为 Unicode NFC、LF 换行、去首尾空白、字段顺序固定。AC 四段卡语法固定为四个标签独占一行、行首无缩进、无 bullet/bold、顺序为验证→通过→失败→证据；标签后内容可为多行，直到下一标签或 AC 结束；重复标签、空段、旧粗体标签均判材料不完整；占位符按整行精确匹配拒绝——材料正文任一行整行等于 TBD、TODO 或 待填写 即判材料不完整，不做子串猜测。AC 四段卡的“证据”段在 spec 期是预期证据契约：只声明证据类型与产出物（对应第 11 节 AC 卡辅助字段“证据类型”，取值 evidence、test、manual），不要求运行证据；实际运行证据由 verify-code 回填校验。四段非空是结构校验，语义可执行性由 build-plan 独立复核或人工验收，结构检查不裁决语义。
  - **范围边界**：只对新生成材料生效；spec/plan 检查器检查 AC 四段卡，tasks 检查器检查结构化 oracle；统一表达不改变 AC 的业务含义，不把历史材料自动改写。
  - **依据**：D-302、本轮用户澄清确认；PFACT-005。
  - **场景**：SCN-010。
  - **验收**：AC-MATERIAL-001。

- **FR-MATERIAL-002**：任务的行为验证 oracle 采用结构化对象：`pass` 与 `reject` 两部分；`pass` 必须存在、非空、非占位，并映射到对应 AC 的正向断言；`reject` 必须包含 `input`（输入条件）、`expected_rejection`（预期拒绝结果）、`observation`（观察断言）三个非空字段，且不得使用 TBD、空泛“拒绝”或同义反复。仅当 verification_role=RED 且 paired_task ≠ N/A 时强制 oracle.reject 三段齐备；verification_role=GREEN 且 paired_task ≠ N/A 的配对任务只强制配对关联存在与 oracle.pass 非空，不强制 reject；非配对行为任务提供 reject 表达位但不强制；聚合/非行为类 verification_role=N/A 不强制；GREEN 强制 reject 的旧语义已由 T-032 修正作废；verification_role 和 paired_task 都必须始终存在，非行为或聚合任务使用显式 `N/A`；字段缺失、非法值或该用 N/A 却留空均判材料不完整，不能只记 unknown；分类只能依据既有验证角色和配对事实，不采用关键词或语法猜测。结构检查器只判三段存在、非空、字段合法和明显占位值；语义有效性不由结构检查器裁决，必须由 build-plan 独立复核或人工验收记录，且每个需要语义判断的 oracle 都必须带 `semantic_review_status=completed|incomplete|unavailable`、复核来源和原因；结构通过但 semantic_review_status 不是 completed 时，AC 只能保持 unknown/incomplete，不能被写成语义通过；冲突或无法判定时保持 unknown；无语义复核时不得写语义通过。`AC 四段卡`的“通过/失败”与 tasks 的 `oracle.pass/oracle.reject` 是同一行为边界在不同材料职责中的映射，不把 oracle 嵌回 AC 四段卡。tasks 冻结前，build-plan 必须逐条列出每个行为 AC 的当前验证方式，或列出真实 unavailable 原因、owner、下一次修复点和继续影响；unavailable 不得写成 ready、accepted 或质量通过；该交接只防止误报，不改变用户明确授权时保留缺口 close 的既有语义。
  - **范围边界**：oracle 描述产品行为的通过和拒绝边界，不把模型分工、阶段绑定或 token 记录加入材料契约。
  - **依据**：D-302、D-305、本轮用户澄清确认；PFACT-005。
  - **场景**：SCN-006、SCN-010。
  - **验收**：AC-MATERIAL-002。

- **FR-MATERIAL-003**：verify 入口对当前四份材料执行四个固定检查项：①存在性（材料存在且必备字段齐全）；②身份绑定（task_id、material_name、material_revision 精确匹配）；③内容完整性（正文非占位符，content_sha256 非零，且 recomputed_sha256(current_full_body) 与 content_sha256 精确相等；current_full_body 的规范字节串=当前材料正文的规范化 UTF-8 字节：材料完整正文的 UTF-8 编码，换行统一为 LF、保留末尾换行、包含材料头部和导航节；digest 属于外部元数据（runtime binding/packet manifest 的材料条目字段），从正文哈希范围完全排除——材料正文内不存在需排除的 digest 行，正文不要求也不允许自写 digest 行；占位符、zero_digest、digest_mismatch 是该检查项的三个 subcheck）；④快照新鲜度（snapshot_tree 与当前快照精确相等）。材料身份元数据由对应 stage runtime 在材料冻结时从当前 task、材料路径和 worktree snapshot 派生，字段固定为 task_id、material_name、material_revision、snapshot_tree、content_sha256；它是材料绑定事实，不是第五材料；规范载体是 stage runtime 的当前材料绑定事实和冻结 packet manifest 的材料条目，不要求材料正文自写 snapshot；material_revision 在材料冻结时生成，content_sha256 对上述规范化正文计算（digest 为外部元数据，不在正文内，哈希范围不含任何 digest 行）。每项输出固定为 `{status, reason, subchecks}`；subchecks 只在内容完整性项中使用。每项都有独立事实和原因；总体状态为 ready、incomplete、stale 或 unavailable：identity 缺失/错配为 unavailable；缺字段为 unknown 原因下的 unavailable；snapshot 不等为 stale；占位符、零 digest 或 digest_mismatch 为 incomplete；全部通过为 ready。多重异常原因优先级固定为 missing → identity_mismatch → stale_snapshot → zero_digest → digest_mismatch → placeholder。占位符判定规则固定：正文为空字符串判占位符；非空正文按整行精确匹配 `TBD`、`TODO`、`待填写`；不做子串猜测；检查结果只读，不成为步骤完成条件、close 条件或 pass 门槛。
  - **范围边界**：只报告材料完整性，不取代质量决议，不修改历史材料，不因检查异常阻断同任务修复；任一字段缺失时归为 unknown/unavailable，不猜为 ready。
  - **依据**：D-302、D-303、本轮用户澄清确认；PFACT-005、PFACT-012。
  - **场景**：SCN-004、SCN-012。
  - **验收**：AC-MATERIAL-003。

### verify 异源独立审查（REVIEW）

本域补齐 verify 的独立质量事实，不改变既有自查、close 或人类授权语义。

- **FR-REVIEW-001**：verify-code 必须记录两个分离事实：`dispatch_attempt` 表示是否真实发起异源独立审查请求，`review_result` 表示该请求的终态。`dispatch_attempt` 只能是 attempted 或 unavailable；`review_result` 只能记录终态 executed、failed、unavailable。审查已发起但尚未到达终态时，不呈现 review_result，只展示 dispatch_attempt=attempted 和 attempt 进行中事实；不得提前猜终态。unavailable 只有在通道不可用或请求未能发起时成立，且必须带真实原因；若 dispatch_attempt=unavailable，不得宣称“已发起”。failed 允许一次既有通道重试；provider 成员可保留 cancelled/timeout 原始状态，但聚合事实不得新增 cancelled/timeout 顶层值。可信空 findings 必须带 provenance：request_id、provider/role、material_id、snapshot_tree、执行者身份、结果状态和审查范围；审查范围必须明确为当前整份冻结材料，或列出当前 phase/AC 覆盖清单；scope 缺失或绑定不正确的空 findings 不得视为可信空结果。发起审查前必须先校验 reviewer 与 executor 身份关系；身份字段缺失、reviewer 与 executor 相同或身份关系无法证明时，不发送审查请求，dispatch_attempt=unavailable，review_result=unavailable，reason=invalid_identity，FR-REVIEW-002 的身份规则优先适用；仅非身份 provenance 字段缺失时，review_result 可保持 executed，但 provenance_status=incomplete；provenance_status 单独取 complete/incomplete/unknown，只说明结果可信度，不新增 review_result 顶层值，也不得参与 quality_status pass。三态均在阶段汇报如实出现，均不是步骤完成、close 或 pass 门槛，也不替代自查。
  - **范围边界**：异源只表示审查执行者身份与当前执行者不同，沿用既有身份校验链；不做模型等级绑定、模型使用记录或新公共入口。
  - **依据**：D-303、D-305、本轮用户澄清确认；PFACT-007、PFACT-012。
  - **场景**：SCN-002、SCN-004、SCN-005、SCN-012。
  - **验收**：AC-REVIEW-001。

- **FR-REVIEW-002**：每个实施 phase 都必须留下独立审查事实：审查请求是否发起、attempt 标识、phase executor_identity、reviewer provider/role/source_id、当前 material/snapshot 绑定、结果 executed/failed/unavailable 和原因；发起审查前必须校验 reviewer 身份可证明不同于 executor_identity，沿用既有身份校验链。identity 缺失、reviewer 与 executor 相同或身份关系无法证明时，不发送审查请求，审查请求事实和结果事实均记为 `unavailable`，reason code 固定为 `invalid_identity`，不得写成 executed；顶层结果仍只允许 executed、failed、unavailable。该事实沿用该 phase 的既有审查通道，不新增 gate，不可用时不阻断同 phase 修复。
  - **范围边界**：phase 审查事实独立于 verify-code 的整体验收审查；不把一个 verify 审查回填为所有 phase 已审查，不把阶段自查写成独立审查。
  - **依据**：D-301、D-303、D-305、本轮用户澄清确认；PFACT-007、PFACT-010、PFACT-012。
  - **场景**：SCN-003、SCN-004、SCN-012。
  - **验收**：AC-REVIEW-002。

### 执行模型与上下文管理（CONTEXT）

本域把主会话作为调度和判断者，把重读、研究、草稿、复核和落盘组织成可回收的上下文边界。

- **FR-CONTEXT-001**：build-spec 和 build-plan 必须以 step×M/S/B/P 矩阵说明每步的主会话、子代理、后台执行和并行职责，并遵守六条上下文守恒规则：全量产物落盘；主会话只保留引用、sha256 和不超过 500 字摘要；子代理回传不超过 500 字且复核 finding 一条一行；研究并行不超过 4、debate 不超过 4；审查拓扑按阶段保持：make-decision 保持 2 个 role，build-spec/build-plan 保持多 provider 单发；交互由 M 独占；每步只依赖上一步摘要和引用，不把全文回塞；派发、摘要或覆盖校验失败也不例外，禁止把完整材料或完整 packet 回灌主会话。恢复只能交独立上下文读取同一冻结 packet 详情，保留原 hash/snapshot 后返回合格摘要；无法恢复时如实记录 unavailable/degraded，不宣称优化成功。方向级争议交用户，实施级争议交独立复核，M 只登记。每个摘要必须保留 source finding/FR/AC 映射、源条目数量校验和关键字段覆盖（状态、原因、owner、oracle/判据、证据引用）；覆盖失败时主会话必须派发独立上下文读取冻结 packet 详情并重建摘要，主会话只收引用、hash 和不超过 500 字摘要，且不得宣称上下文优化成功。字符级代理指标固定为三项：主会话全文重读轮次、阶段内子代理输入字节、审查材料包字节；三者与 provider usage 落盘（FR-LOOP-005）组合回答成本去向，不做预算计费，无下降证据如实写未证明下降。
  - **范围边界**：本规则主要覆盖 build-spec/build-plan；make-decision 的既有执行规范不改；不做四阶段统一机制，不记录模型与阶段绑定；效率观察固定基线为 `evidence/context-baseline.json` 中 convergence build-plan 282170 字符（来源 decision-log F-034（字符量）与 F-043（上下文调研））；该文件是本任务正式观察输入，producer=build-spec 主会话，生成时机为当前 build-spec 完成基线采集且 spec 冻结前，consumer=build-plan 主会话，owner=build-spec 主会话，数据只用于观察上下文行为，不承诺 token 下降；字符计算范围为 UTF-16 code units、只统计注入主会话的材料/packet 内容；一次“全文重读”定义为同一材料在同一阶段内从开头到结尾的完整顺序读取；观察窗口为当前 build-spec 开始到 build-plan 阶段末大白话交接结束，并分别记录 build-spec 段与 build-plan 段；报告格式固定为 packet_injected_chars、full_reread_count、baseline_chars、current_chars、conclusion；观察事件来源固定为当前 stage outcome 的 step evidence，不新增 store：每次 packet 注入记录 packet_ref、packet_hash、material_revision、snapshot_tree、packet_injected_chars，每次全文重读记录 material_name、material_revision、snapshot_tree、read_chars；packet_injected_chars 和 current_chars 由这些事件求和，full_reread_count 由全文重读事件计数，独立复核者必须能按同一事件记录重算结论。
  - **依据**：D-304、D-306、本轮用户澄清确认；PFACT-006、PFACT-008、PFACT-010。
  - **场景**：SCN-003、SCN-011。
  - **验收**：AC-CONTEXT-001。

- **FR-CONTEXT-002**：四份当前材料的规范名称固定为 `decision-log`、`spec`、`plan`、`tasks`；导航规则只适用于本任务新生成或本阶段可写的材料（本规格及后续 plan/tasks），不回溯改写已完成并冻结的 decision-log；每份适用材料必须在材料头部包含可再生的“材料导航”节，列出各节、每节一句摘要和读取时机；导航在起草时生成、定稿时更新，随材料更新，不作为权威材料或新的持久对象；主会话先按标题锚点定位导航，再按需读取详细段落。
  - **范围边界**：导航只改善定位和阅读顺序，不替代正文、不新增第五材料、不承诺总 token 下降；decision-log 的缺失导航是历史只读事实，不构成当前规格缺口；四阶段统一导航延期。
  - **依据**：D-304、D-305；PFACT-006、PFACT-007、PFACT-011。
  - **场景**：SCN-011。
  - **验收**：AC-CONTEXT-002。

- **FR-CONTEXT-003**：spec、plan、tasks 的输入必须以宿主组装、脱敏并冻结的 packet 交付，packet 由冻结材料正文、packet manifest、包内导航/摘要和按需详情文件组成；**本 packet 为阶段输入 packet（consumer=spec-specify/spec-plan/spec-tasks 的主会话与派发子代理），与审查 packet 边界分明：审查 packet 维持既有 file_only 冻结链、字节不减、零新文件（D-304/T-034），diagnostic-report.md、context-baseline.json 等派生文件只作为本 packet 派生层条目供阶段输入消费，不得进入审查冻结链；导航首选载体=材料内嵌导航节（D-305），内嵌导航节为每份材料的强制结构：位于材料头部，含节清单（每节=标题+一句话摘要+建议读取时机 M/S/B/P），草稿期生成、材料定稿前更新一次；存在性由材料结构校验器检查（结构校验不裁决语义），阶段输入 packet 内导航/摘要与派生副本均为可再生、非权威、随 packet 生命周期存在的临时派生，不另立持久对象、不成为第五材料、不回写材料正文；源 evidence 按原事实生命周期保留，不等同 packet 内临时副本**；diagnostic-report.md、context-baseline.json 等 build-plan 需要的 evidence 文件以 packet 派生层条目进入，manifest 记录其 path、source_digest、sha256、producer、consumer 和“非材料”声明；packet manifest 至少记录 task_id、stage、material_revision、snapshot_tree、每份源材料 sha256、派生文件清单、每个派生文件的 source_digest 和权威声明；packet 冻结 hash 覆盖 manifest、正文和派生层，禁止投递后与源材料漂移。`spec-specify`、`spec-plan`、`spec-tasks` 的输入契约必须改为只消费冻结 packet，禁止以“Read the current ... 全文”方式直读当前材料；`simplicity-guard` 与 `plan-eng-review` 保持 inline 声明，其声明、调用位置和失败回退必须与实际执行路径一致。包内导航/摘要是 packet 的可再生派生内容，不是第五材料；findings 处置、终检复查和调研必须派发给独立上下文，主会话只审结构化摘要；审查 packet 维持 file-only 冻结链，并在既有审查说明材料中先引导导航和摘要、再按需读取详情，不允许审查者直接读取任务目录。冻结 packet 失败恢复按阶段拆分：若组装、manifest 或冻结本身失败，owner=对应阶段主会话，consumer=当前 stage 输入消费者；触发方式为同一 task/material_revision/snapshot_tree 下由主会话重新发起 packet 组装一次；重建失败则标 unavailable，并记录真实原因、owner、next_action=修复 packet 组装环境或输入绑定后重新发起当前 stage；主会话不得读取任务目录，也不得宣称 packet 可回退。若冻结已成功但派发或摘要回传失败，可按既有通道重试一次，仍失败时标 unavailable，owner=对应阶段主会话，next_action=用户决定是否修复通道后重试；阶段输入 packet 的 packet_freeze_hash 唯一算法见下方“阶段输入 packet 字节合同”；该算法不替换既有 review packet 的 manifest/hash 协议。固定向量已由 build-spec 针对性生成、独立核对并落盘（见下方“阶段输入 packet 字节合同”末尾的证据绑定），不再声称未落盘。若冻结已成功但派发或摘要回传失败，可按既有通道重试一次，仍失败时标 unavailable，owner=对应阶段主会话，next_action=用户决定是否修复通道后重试；恢复路径不得把 packet 完整内容回灌主会话——主会话按 D-304 上下文守恒只保留 ref+sha256+摘要（≤500 字），重读与恢复操作派发给独立上下文执行，hash 和 snapshot 不变，且不得把降级写成优化成功。
  - **范围边界**：只优化输入组织和信息层次，不改变审查投递边界、不做审查瘦身或切片实验、不把派生摘要提升为权威材料；派发事实必须记录发起方、回传摘要、引用和失败原因；降级回退只保证工作可继续，不宣称上下文节省已达成。审查投递链维持全量 file_only 冻结链不变：审查包字节不减、零新文件，仅升级既有审查说明材料的引导内容（先读材料内导航与摘要、再按需读详细材料）；“审查包 token 下降”为非承诺项，上下文优化只作用于主会话侧（导航、摘要、派发）。
  - **依据**：D-304；PFACT-006、PFACT-007、PFACT-011。
  - **场景**：SCN-011。
  - **验收**：AC-CONTEXT-003。

#### 阶段输入 packet 字节合同（FR-CONTEXT-003，D-304/T-034）

- 适用对象仅为 stage 输入 packet；consumer=`spec-specify`/`spec-plan`/`spec-tasks` 的当前阶段主会话与派发子代理（主会话读取仍受 FR-CONTEXT-001 摘要边界约束）。审查 packet 仍由既有 file_only 全量冻结链投递，零新文件、字节不减；只在既有审查说明中引导读取已冻结材料内的导航、摘要和详情，不借 stage packet 给 reviewer 增加诊断、基线、派生摘要或 manifest 文件。stage manifest 中出现 evidence 引用不构成 review 纳入授权。
- `algorithm_version` 固定为 string `stage-input-packet.v1`，必须存在于 manifest。manifest 为 JSON object，去除其顶层 `packet_freeze_hash` 一个字段所得对象为 `manifest_minus_hash`；它仍是对象，不是 JSON 字符串。嵌套同名字段不排除，缺失/未知版本、重复键或非合法 JSON 值为组装 unavailable，保留 owner/真实原因/next_action，不猜旧算法。
- manifest 至少含 `algorithm_version`、`task_id`、`stage`、`material_revision`、`snapshot_tree`、`source_materials`、`derived_files`。后两项为数组，无条目时用 `[]`；source_materials 每项至少为 `{material_name,path,sha256}`，derived_files 每项至少为 `{path,source_digest,sha256,producer,consumer,authority}` 且 `authority` 固定 string `non-material`。source_digest 指该副本来源内容按本合同文本字节规则计算的完整小写 SHA-256；多个来源则用按来源 path 排序的 `[{path,sha256}]` 数组表达，不用无序 map 或未定义拼接。sha256 指实际投递副本内容摘要；source_materials 与 derived_files 各按 path 的 UTF-8 字节无符号字典序排序。其他数组保留原次序，不按对象排序规则重排；所有 manifest 字段（含 owner/producer/consumer 如有）均参与 hash，只有顶层 packet_freeze_hash 排除；gap 的 owner 排除规则不适用于 packet。
- 文件集合是 manifest 显式列举的全部源材料副本与派生副本，含正文、独立导航/摘要和详情（若内嵌则只计算所属材料文件一次）；不包括 manifest 自身，也不包括未声明的任务目录文件。列举文件必须恰好与投递文件集合相等，缺文件、多文件、重复 path、同一路径在两个数组出现或 digest 不匹配均 unavailable，不静默去重。manifest 单独由下面预像覆盖，避免 hash 自包含。
- path 为相对 packet 根的 POSIX 路径 string：严格 Unicode 标量字符串，无空路径、前导/末尾 `/`、反斜线、空段、`.`/`..` 段、NUL；不做大小写折叠、trim、Unicode NFC、URL 编码或路径自动修正。path 比较/排序按原样 UTF-8 无符号字节，平台不得换成本地路径规则。路径不合规为 unavailable。
- 文件规范字节 `T(file)`：严格 UTF-8 解码（非法序列拒绝），按从左到右把 CRLF 替换 LF，再把残余 CR 替换 LF，再严格 UTF-8 编码；不做 Unicode NFC、不删除/折叠空白、不增删末尾换行，开头 U+FEFF 若存在也保留。投递副本必须就是 T(file) 字节，不能 hash 归一版本却投递另一版本。`sha256` 为 lowercase_hex(SHA-256(T(file)))，64 位且不加前缀；manifest 中各副本 sha256 必须与其相等。source_digest 与副本 sha256 即使相同也分别保留来源/投递语义。
- `file_entries` 为按 path 排序的数组，每项恰好两个 key：`{"path":path,"sha256":digest}`，第二 key 明确为 sha256。唯一外层预像对象恰好为 `{"manifest_minus_hash":manifest_minus_hash,"file_entries":file_entries}`；对象字段按 GAP 字节合同的 J 递归排序，所以实际顶层输出顺序为 file_entries、manifest_minus_hash。复用同一 J/B 的转义、数值、UTF-8、无 BOM/末尾换行规则；manifest 字符串保留原 Unicode 和空白，绝不调用 N。`packet_freeze_hash = lowercase_hex(SHA-256(B(外层预像对象)))`，完整 64 位十六进制，不加前缀；不是哈希多个 hex 的拼接，也不是嵌套 JSON 字符串的 hash。
- 冻结后任何被覆盖字节变化使当前 hash 校验失败，不允许原绑定下投递漂移副本；按 FR-CONTEXT-003 重建/失败建议处理，不新增 review 通道或状态机。AC-CONTEXT-003 的固定向量须给出 manifest、每个文件原始与规范 UTF-8 hex、排序后的 file_entries、完整预像 hex 与期望 hash，覆盖字段顺序、换行/末尾换行、Unicode/空白、hash 自身排除、owner 纳入和非法路径；固定向量证据已落盘并独立核对（见 `evidence/build-spec-review/hash-contract-vectors.json` 与 `evidence/build-spec-review/hash-contract-vectors-check.json`，packet 5 向量、24 项变异/非法样例检查），绑定为 AC-CONTEXT-003 的验收证据项；向量文件为已生成证据，本规格不再声明 packet 向量 incomplete。

### 阶段汇报与治理边界（REPORT/GOV）

本域让操作者能看懂结果和下一步，同时把所有 accepted、deferred、unavailable 和风险接收保持在真实治理边界内。

- **FR-REPORT-001**：阶段汇报必须用大白话分开说明 findings、处置、失败、unknown/unavailable/incomplete、时间和上下文观察、下一阶段边界以及独立审查三态；空 findings 不得被写成质量通过，缺失事实不得被省略。
  - **范围边界**：报告是事实和建议，不是新的状态机、质量门或 close 裁判；不承诺总 token 下降，观察无下降证据时写明未证明下降。
  - **依据**：D-101、D-202、D-303、D-304、D-401；PFACT-001、PFACT-002、PFACT-006、PFACT-012。
  - **场景**：SCN-001、SCN-002、SCN-004、SCN-009、SCN-012。
  - **验收**：AC-REPORT-001。

- **FR-GOV-001**：治理边界必须保持四份当前材料、五个正式 stage、既有 public runtime 和 close 三义；不新增 public 入口、store、持久 selector、gate、第五材料、第二状态机或永久兼容桥；任何被保留的新控制面都必须能说明唯一 consumer、owner、替代关系和删除或保留条件。
  - **范围边界**：结构化问答工具卡仅作为已登记的既有交互边界使用；风险接收沿用既有用户确认语义；本规格不新增其他控制面。
  - **依据**：D-204、D-305、D-402；PFACT-010。
  - **场景**：SCN-001、SCN-007、SCN-011。
  - **验收**：AC-GOV-001。

### 阶段治理闭环（LOOP）

本域把“基于冻结决策高效设计”做成可校验的阶段机制：入口冻结校验、findings 互斥分类强制路由、needs_human 暂停态、review 预算、轻量 usage 观测与统一回退协议。它们全部是阶段完成条件检查，不是新 gate，不改变“记录事实不阻断”的总原则。

- **FR-LOOP-001**：build-spec 与 build-plan 开展规格化前必须执行决策冻结前置校验并记录结果事实：①decision-log 头部 approval_binding.status=accepted，且与正文“最终确认”节及 step 11 确认记录三方一致；step 11 记录的 canonical 选择规则固定为：稳定 record_id=step 11-v4（approve-decision）及其后的最新 accepted 记录，绑定 decision-log 当前 revision/snapshot（revision-e9bc49bc/snapshot e94e3cee，第二轮确认回执 f1e28231）；选择优先级=最新 accepted 记录优先，早期“先落盘存档、非确认、stage 保持 in_progress”的历史迁移记录一律排除，不参与三方一致判定；②approval_binding 绑定当前材料（material_revision、snapshot_tree 与当前一致）；③无方向级未决（开放方向问题为零）。冻结包合同同时要求 decision-log 内容覆盖用户流程、数据状态、成功/失败边界与非目标，且 decision-log 与 spec 绑定同一 revision/snapshot；build-plan 入口对同一冻结版本重校验，spec revision 与 decision revision 配对。任一不满足→暂停该阶段并回 make-decision 补齐，不开始规格化；校验结果作为阶段 outcome 事实记录。增量决策（FR-LOOP-002）追加 D 记录时同步追加增量 approval_binding 续签（绑定该 D、用户答复回执 ref/hash、当前 snapshot），入口校验接受“基线确认+增量增补链”，只对新增或变更 D 做轻量确认，不对历史 step 11 全量重确认。
  - **范围边界**：不新增公共入口（并入既有 stage 入口校验与阶段汇报）；不写入或推导 quality_status；不是第二状态机；冻结校验器实现细节与续签链载体由 build-code 按本规格语义实施，夹具归 build-plan；旧 step 11 记录与当前确认并存的拒绝/通过夹具由本阶段固定向量覆盖，本阶段未落盘该夹具，如实保持 incomplete 声明，不声称已生成。
  - **依据**：R-011、D-501；PFACT-013、PFACT-015。
  - **场景**：SCN-013。
  - **验收**：AC-LOOP-001。

- **FR-LOOP-002**：每条 review finding 处置前必须分类；分类互斥且按优先级 direction_change > spec_ambiguity > implementation_defect > invalid_finding 判定；environment_unavailable 不属于 finding 分类，它是 review attempt 执行层状态（见 FR-LOOP-003 两层事实分离）。每条分类必须附影响维度清单与证据引用；判定维度固定为产品行为、状态、接口、数据、验收边界、close 语义、跨材料主键、权限、重试策略。缺少依据、命中方向维度或无法互斥分类的 finding 不得以 fixed 完成，落入未分类路由=暂停问用户或交独立复核。runtime 校验每条 finding 的 disposition 必须匹配其分类路由：spec_ambiguity 必须存在用户答复绑定（finding 级答复复用既有 human-confirmation 载体扩展 finding_id 绑定，不新增 store）；direction_change 必须存在增量决策记录；不许把方向级标为 fixed 后继续。路由错误→记录并阻断该阶段正式完成，不阻断同任务修复。增量决策语义：发现方向级缺口→只用大白话问用户一个问题→追加一条 D 决策记录→同步增量 approval_binding 续签（FR-LOOP-001）→重新冻结→当前阶段从受影响节继续；已确认部分不重跑、不重写、不重新走完整 Talk、审查、辩论、Grill 序列；新增或受影响 D 本身执行最小质量闭环：受影响闭包（共享状态、接口、验收边界、跨材料键相关节）内做一次 focused review 并留下绑定该 D 的审查证据，闭包外未受影响决策跳过。
  - **范围边界**：分类只依据影响维度与证据引用，不采用关键词或语法规则判型；路由校验插入点为各阶段 handler 汇总 dispositions 之后、写入阶段 completion 之前；答复绑定复用既有 confirmation 载体，不新增 store。
  - **依据**：R-011、D-502；PFACT-013、PFACT-014。
  - **场景**：SCN-014、SCN-008。
  - **验收**：AC-LOOP-002。

- **FR-LOOP-003**：needs_human 只能作为暂停态：必须附 next_action（ask_user、return_to_make_decision 或 return_to_spec），禁止作为 formally complete 的最终处置；阶段完成只允许 fixed、rejected_invalid、user_decided、accepted_risk 四个出口，accepted_risk 必须绑定用户授权回执与风险记录。needs_human 存在时阶段 completion 保持 incomplete 并在汇报中如实说明。出口：用户答复后转 user_decided（绑定 finding_id、card_hash、reply_ref，写入既有载体，不新增持久对象）或经增量决策后再处置。review attempt 可用性（executed、failed、unavailable）与 finding 处置是两层事实：provider 或通道不可用=attempt 层 unavailable 记录，不阻断、不算 pass、不产生 needs_human finding、不进入 disposition 白名单；attempt 层 unavailable 时该次 review 无 findings 可处置。
  - **范围边界**：收紧的是完成判定口径，不新增状态机；userReply 持久化复用既有 confirmation 载体，不新增 store。
  - **依据**：R-011、D-503；PFACT-013、PFACT-014。
  - **场景**：SCN-015、SCN-005。
  - **验收**：AC-LOOP-003。

- **FR-LOOP-004**：review 预算按同一 review 目标计数：对同一材料的同一冻结 revision，允许一次初始 review（含其全部 role/provider 调用与单次重试，同一 attempt 内并发调用不算额外轮次）；材料实际变化后最多一次 focused review（只复核变化范围）；无材料变化禁止重审。build-code 每个 phase 的既有 phase 审查（FR-REVIEW-002）是各 phase 独立 review 目标，不计入 build-spec/build-plan 的预算；每次新的增量决策续签（新冻结 revision）产生一次新的 focused review 配额。耗尽路由：focused review 后仍有残留缺陷→实现级再修一次后做窄域 diff 核销一次（只核对本次修复的 diff，不再全量）；仍不收敛或属方向级→转问用户或 accepted_risk（带授权回执）。provider 失败、空桩或超时如实记录 attempt 层 unavailable，不算 pass、不改写为空 findings；空 findings 必须有可信 provenance（request_id、provider/role、material_id、snapshot、scope）。预算规则不制造死锁：每个状态都有确定出口（核销→问用户→accepted_risk→记录 unavailable）。
  - **范围边界**：预算计数单位=review 目标（stage、material、frozen revision）；预算只约束审查纪律与阶段完成条件，不阻断修复推进。
  - **依据**：R-011、D-504；PFACT-013。
  - **场景**：SCN-016。
  - **验收**：AC-LOOP-004。

- **FR-LOOP-005**：成本观测分两层且只做轻量记录，不做 token 预算或计费机制：①provider usage（input/output/cached tokens、duration、失败原因）已返回则落盘到 review attempt 事实，缺失标 unavailable，使“review 调用消耗”可回答；②字符级代理指标=主会话 read 重读轮次、阶段内子代理输入字节、审查材料包字节，回答主会话、子代理、材料包的浪费去向。两层组合回答“浪费在哪”，但成功边界不承诺 token 总量下降；无下降证据时如实写“未证明下降”，不虚构达标。
  - **范围边界**：观测写入既有 attempt 事实与阶段 outcome，不新增 store；代理指标是字符级口径，不等同 token；provider 不返回 usage 时相应观测保持 unavailable。
  - **依据**：R-011、D-505、T-030、T-035；PFACT-016。
  - **场景**：SCN-016、SCN-011。
  - **验收**：AC-LOOP-005。

- **FR-LOOP-006**：五阶段共用一套 owner/consumer/next_action 回退路由协议：实现级=当前阶段自修；规格歧义=返回 build-spec（build-plan 走 spec-clarify 通道）问一次；方向级=回 make-decision 做增量决策（FR-LOOP-002）；材料 gap=回到对应 owner 阶段；环境不可用=attempt 层如实记录。runtime 校验“该回退的没回退”：路由不满足时该阶段完成条件不满足；不新建阶段、公开入口或门；各阶段 SKILL 不再各写一套回退条文，统一引用本协议。
  - **范围边界**：协议只统一路由语义与完成条件校验；不改变五阶段顺序，不新增公共控制面；回退不演变为整阶段重跑。
  - **依据**：R-011、D-506；PFACT-013。
  - **场景**：SCN-014、SCN-015。
  - **验收**：AC-LOOP-006。

## 6. 模块划分

### 诊断与决策事实模块

- **负责什么**：汇总独立核查、三问分析、已确认决策、事实状态、非目标和延期边界。
- **对外提供什么**：可读的诊断报告、来源映射、成功失败边界和 build-spec 交接事实。
- **依赖谁**：历史只读样本、内部取证、用户确认和当前四份材料。
- **测试边界**：能够区分核实、推断、不可用和不适用，不把总结性文字当作事实，不改变历史材料。

### 收口预检与状态模块

- **负责什么**：消费九字段合同和覆盖边界，派生三态预检、六状态和当前收口展示。
- **对外提供什么**：ready、unknown、unavailable 预检；六状态独立值；同一缺口一次展示。
- **依赖谁**：当前材料、阶段事实、质量决议、验收证据、确认事实和物理 close 事实。
- **测试边界**：能够验证同快照去重、stale 失效、确认消缺和状态不互相推导。

### 材料质量模块

- **负责什么**：统一 AC 表达、四段式完整性、负向 oracle 和 verify 材料四项只读事实检查。
- **对外提供什么**：材料是否可判定、拒绝断言是否存在、材料身份是否真实的可读事实。
- **依赖谁**：新生成四份材料、验证角色、配对事实、当前 snapshot 和材料身份。
- **测试边界**：能够让坏材料直接显示不完整，让合格材料无需额外改写即可被检查。

### 独立审查与阶段汇报模块

- **负责什么**：发起 verify 异源审查，保存三态事实和原因，并把 findings、质量缺口和下一步用大白话汇报。
- **对外提供什么**：executed、failed、unavailable 独立审查事实；阶段质量摘要和用户可读的退化说明。
- **依赖谁**：既有异源身份校验、冻结审查 packet、当前材料和自查结果。
- **测试边界**：能够区分空 findings、失败、不可用和质量决议，不把审查事实变成 gate。

### 上下文与材料导航模块

- **负责什么**：组织 build-spec/build-plan 的执行角色、摘要、导航、冻结 packet、按需读取和派发边界。
- **对外提供什么**：可定位的材料导航、受控 packet、结构化回传和阶段执行观察。
- **依赖谁**：四份当前材料、阶段输入、审查冻结链和各阶段主会话。
- **测试边界**：能够证明主会话不重复回读全文、审查不越出冻结链、导航非权威且可再生。

### 阶段治理闭环模块

- **负责什么**：阶段入口决策冻结校验与增量续签链、findings 互斥分类与强制路由、needs_human 暂停态与完成出口、review 预算计数与耗尽路由、usage 与代理观测落盘、跨阶段统一回退协议校验。
- **对外提供什么**：冻结校验结果事实、finding 分类与 disposition 路由校验结果、阶段 completion 判定、review 预算与核销记录、usage 与代理指标观测事实。
- **依赖谁**：当前 decision-log 冻结状态、review attempt 事实、finding disposition、既有 human-confirmation 载体与各阶段主会话。
- **测试边界**：能够用负向夹具证明误放行与误阻断都被拒绝；路由错误只阻断正式完成不阻断修复；预算不制造死锁；attempt 层 unavailable 不产生 needs_human。

## 7. 关键实体

- **诊断报告**：
  - **定义**：对历史核查和三问分析的用户可读综合结果。
  - **字段和约束**：问题、已核实事实、支持或否定的论断、认知差异、综合结论、成功失败边界、非目标和延期；每个结论保留来源状态。
  - **关系**：由诊断事实和用户确认组成，供本规格和 build-spec 交接消费，不改变历史任务。

- **收口合同**：
  - **定义**：单个 AC 对其证据生产、消费、验收和 close 关系的九字段业务描述。
  - **字段和约束**：producer、consumer、owner、命令、fixture、oracle、证据路径、freshness、close 条件；每项可为明确值、unknown 或 unavailable，并带处理边界。
  - **关系**：由 build-spec 写入，预检只读消费，验收和阶段汇报引用。

- **预检结果**：
  - **定义**：对收口合同在声明覆盖边界内的只读可判断性结果。
  - **字段和约束**：ready、unknown、unavailable 三态；含原因、owner、下一复核触发点；不含 blocked。
  - **关系**：引用收口合同和当前材料，不写入六状态质量来源。

- **当前缺口投影**：
  - **定义**：当前渲染快照中尚未由匹配确认消除的规范化缺口。
  - **字段和约束**：gap_id、规范化内容、provenance、owner、task/material/snapshot 绑定；gap_id 只在同一快照内确定性有效。
  - **关系**：由多个事实投影聚合生成；status/close 负责为当前缺口生成消缺确认内容；既有 confirmation 载体承载用户确认；消费匹配 confirmation，不替代原始事实。

- **六状态视图**：
  - **定义**：六种互不推导的当前产品状态集合。
  - **字段和约束**：can_continue、stage_status、quality_status、acceptance_status、product_release_status、physical_close_status；每种状态有唯一来源和 stale 规则。
  - **关系**：由既有事实即时派生，供 status 和 close 展示，不创建第二状态机。

- **独立审查事实**：
  - **定义**：verify 发起异源审查后的真实执行结果。
  - **字段和约束**：executed、failed、unavailable 三态；记录原因、身份关系、当前材料和 snapshot 绑定；不带推进许可。
  - **关系**：与自查事实并列，quality_status 仍只由独立质量决议提供。

- **冻结材料 packet 与材料导航**：
  - **定义**：阶段输入 packet 与既有审查 packet 是两个消费者边界，不互相替代。
  - **字段和约束**：stage packet 可含显式登记的源材料和临时 evidence 副本；review packet 只保持既有全量 file_only 文件集合，不隐式包含 stage 派生文件；导航内嵌于材料，非权威、可再生。
  - **关系**：宿主分别按对应冻结合同投递；stage 的 manifest/hash 不替换 review 的既有协议，审查者不得读任务目录或 stage 派生副本。

- **冻结校验结果**：
  - **定义**：阶段入口对 decision-log 冻结状态的前置校验结果。
  - **字段和约束**：三方一致性（头部 approval_binding、正文最终确认节、step 11 记录）、当前材料绑定、方向级未决计数、冻结包合同四项覆盖；不满足时暂停并回 make-decision。
  - **关系**：写入阶段 outcome 事实；增量续签链作为输入被校验；不写入 quality_status，不是 gate。

- **finding 分类与路由记录**：
  - **定义**：每条 review finding 的互斥分类、影响维度清单、证据引用与 disposition 路由校验结果。
  - **字段和约束**：direction_change、spec_ambiguity、implementation_defect、invalid_finding 四类互斥；路由匹配用户答复绑定或增量决策记录；路由错误阻断正式完成不阻断修复。
  - **关系**：依附 review attempt 事实；消费方为阶段完成条件校验。

- **review 预算计数与 usage 观测**：
  - **定义**：按 review 目标（stage、material、frozen revision）的预算计数事实与 provider usage 落盘记录。
  - **字段和约束**：一次初始加变化后一次 focused；增量续签产生新 focused 配额；usage 含 input/output/cached tokens、duration、失败原因，缺失标 unavailable。
  - **关系**：约束审查纪律与阶段汇报；与字符级代理指标（主会话重读轮次、子代理输入字节、材料包字节）并列回答成本去向。

## 8. 数据和生命周期

- **数据粒度**：一条诊断结论代表一个已核实或受限的产品论断；一条收口合同代表一个 AC；一条预检结果代表当前合同覆盖边界的一次只读判断；一条 gap 投影代表当前快照的一项规范化缺口；一条独立审查事实代表一次 verify 异源审查请求；一条导航代表一份当前材料的可再生定位视图。
- **数据时效**：合同和导航随当前材料 revision 更新；预检和六状态随当前可读事实即时重算；gap_id 只对同一渲染快照确定；confirmation、测试收据和审查事实必须绑定 task、material revision 和 snapshot 才能参与当前判断。
- **缺失或迟到**：缺失或不可用的 provider、证据、材料或身份事实保留 unavailable、unknown、failed 或 incomplete 及原因；迟到或旧事实标 stale，不覆盖当前事实；修复后可在同任务重验，不能把旧事实强行复用。
- **预览与正式**：预检、导航和阶段汇报是只读预览或事实视图；正式 quality_status 只来自独立质量决议；正式 close 只读取当前认证质量、验收、发布和物理事实，不由预检或导航裁判。
- **当前与历史**：新事实追加并绑定当前材料；历史任务和历史材料只读保留，不回溯迁移、不重放真实外部任务；材料变化会使旧确认、收据或审查变 stale，而不是覆盖历史。
- **归属与清理**：任务持有当前四份材料和其事实引用；审查持有冻结 packet 的只读副本；导航随材料再生，不另立持久归属；历史事实在被正式替代并完成独立归档前保留，清理或物理 close 仍需人类授权。

### 状态契约（build-spec 定稿）

> 上游 decision-log 中的早期头部和状态矩阵保留为历史 provenance；本表是 build-plan 及下游消费的唯一当前产品状态契约，不回溯改写已冻结的 decision-log。

| 状态 | 唯一来源 | 允许值 | 展示位 | stale/缺失语义 |
| --- | --- | --- | --- | --- |
| can_continue | 当前 Workspace 与四份材料可读事实 | true / false | status | 随当前材料和快照即时重算 |
| stage_status | 当前 stage outcome | completed / in_progress / failed / timeout / cancelled / unavailable | status | outcome 不绑当前 snapshot 或材料时标 stale；缺失为 unavailable |
| quality_status | 独立质量决议 | passed / incomplete / unknown | status / close | 缺失或不可复核为 unknown/incomplete，不由预检或展示推导 |
| acceptance_status | 逐 AC 验收证据 | pass / fail / unknown / deferred / not_applicable | status / close | 证据不绑当前 snapshot/material 为 stale；无证据为 unknown |
| product_release_status | 五阶段当前完成、逐 AC 和 verify 确认派生 | released / not_released | status / close | 任一输入非 current 即 not_released，不猜发布 |
| physical_close_status | commit/archive/merge/push/cleanup 的物理读回 | not_closed / closed | close | 只读物理事实，失败原因原样保留 |

- 六状态只按各自来源变化；同一条当前事实不因为另一个状态改变而被改写。展示优先级固定为当前绑定事实优先于历史事实；并列事实不互相覆盖，stale 单独显示。phase 验收事实不是第七状态，也不与 acceptance_status、product_release_status 或 physical_close_status 互相推导；阶段汇报和 close 记录并列展示 phase 验收事实，product_release_status 仍按既有五阶段、逐 AC 和 verify 确认来源派生，physical_close_status 仍按授权后的物理读回派生。
- 正常流转：材料可读使 can_continue=true；stage outcome 更新 stage_status；独立质量决议更新 quality_status；逐 AC 证据聚合 acceptance_status；product_release_status 只在五阶段 current 完成、逐 AC current 且 verify 确认 current 后为 released，否则 not_released；physical_close_status 只由授权后的物理读回从 not_closed 变 closed。
- 异常与修复重试：材料缺失、身份错配或证据不可用只让对应来源显示 unavailable/unknown/incomplete/stale；不自动阻断同任务修复；修复后新事实绑定新 snapshot/material revision，旧事实保留为历史且不得参与 current 展示。
- 独立审查聚合只允许 executed、failed、unavailable；provider 成员的 timeout/cancelled 保留原始成员状态，聚合为 failed 或 unavailable 时必须带真实原因，不得记为 executed。
- close 记录抄写 quality_status、acceptance_status、product_release_status、physical_close_status 及绑定身份；它不提供新裁判，不改变 close 三义。

### 历史事实保留与修复建议

- **依据**：phase 验收事实及恢复建议以 D-507 为当前方向来源，其他历史事实保留以 D-303、D-304、D-401 为据；第一轮 spec-clarify 回执 quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json 仅为历史佐证，不代替 D-507 的当前增量绑定；本节只保留事实和恢复建议，不新增状态机、attempt 重试链或 current 选择算法。
- 独立审查、phase 验收和冻结 packet 重建保留实际发起、终态、原因、material revision 和 snapshot 绑定；历史记录只读，不因新事实被改写。
- 当前展示只消费与当前 material revision/snapshot 精确绑定的事实；绑定漂移的历史事实显示 stale，不通过 attempt 链裁判 current。
- 若同一当前绑定出现无法调和的多条终态，current 保持 unknown，不能由生产者任选一条。

### Phase 验收事实转换（事实，不是机制化 gate）

| 状态 | 语义 | 允许的系统动作 | 人工/恢复动作 |
| --- | --- | --- | --- |
| accepted | 用户明确接受该 phase | 阶段汇报可建议进入下一 phase；不得自动把建议写成强制门 | 用户决定是否继续 |
| rejected | 用户明确拒绝该 phase | 如实展示拒绝及修复建议；不据此新增授权条件或阻断修复 | 用户决定下一步；建议当前 phase 修复后重新请求验收 |
| deferred | 用户延期或未答 | 保持待答复；不得推断 accepted | 后续向用户重问；仅继续做不依赖该验收的工作 |
| unavailable | 验收交互或回执不可用 | 记录原因；不得推断 accepted | 按既有公共合同重试；仍不可用则保持 unavailable |

- 上表以 D-507 为据，只定义事实和建议消费，不新增自动阻断、日常确认门或授权条件；accepted 只表示用户接受本 phase 的验收，不顺带授权下一阶段或不可逆操作，继续工作仍依既有合同。验收事实只被动记录既有确认/交互载体上已存在的真实用户答复；无既有交互时直接记录 unavailable/deferred，不得新增 build-code 阶段的用户确认提示或日常确认（宪法 F7）。

### 阶段治理闭环状态与出口（build-spec 定稿）

finding disposition 白名单与阶段完成出口：

| 处置/出口 | 语义 | 完成条件 | 下一步 |
| --- | --- | --- | --- |
| fixed | 实现级修复完成 | 可附修复证据 | 正常继续 |
| rejected_invalid | 审查误报拒收 | 附判定依据 | 关闭该 finding |
| user_decided | 用户答复决定 | 绑 finding_id、card_hash、reply_ref | 按答复处置 |
| accepted_risk | 用户接受风险 | 绑用户授权回执与风险记录 | 记录并继续 |
| needs_human | 暂停态，非最终处置 | 必须附 next_action | completion 保持 incomplete；答复后转出 |

review attempt 执行层状态（与 finding 处置两层事实分离）：

| attempt 状态 | 语义 | 是否产生 finding |
| --- | --- | --- |
| executed | 审查真实执行 | 产生 findings 待分类处置 |
| failed | 已发起但执行失败 | 不产生 needs_human；记录原因，允许一次重试 |
| unavailable | 通道或 provider 不可用 | 不产生 needs_human finding，不进 disposition 白名单 |

失败分支表（III 新增四行，承接 decision-log 失败分支表）：

| 场景 | 语义 | 下一步 |
| --- | --- | --- |
| 决策冻结校验不通过（approval_binding 非 accepted、三方不一致、绑定非当前材料或有方向级未决） | 阶段不可正式开展（完成条件检查，非公共 gate） | 暂停 build-spec 并回 make-decision 补齐，不开始规格化 |
| finding 路由错误（disposition 与分类路由不匹配） | 完成条件不满足 | 阻断该阶段正式完成；不阻断同任务修复推进 |
| review 预算耗尽（focused 后仍有残留或属方向级） | 预算不制造死锁，各状态有确定出口 | 实现级再修一次加窄域 diff 核销一次；仍不收敛转问用户或 accepted_risk（带授权回执） |
| needs_human（真实问题等待用户） | 暂停态，非最终处置 | 保持 completion=incomplete 并附 next_action；答复后转 user_decided |

## 9. 兼容性预留

- **既有消费方**：make-decision、build-spec、build-plan、build-code、verify-code 和既有 close 消费者继续使用同一五阶段顺序、四份当前材料和现有用户授权语义；旧任务事实保持可读。
- **命名预留**：六状态名称、三态预检名称、三态独立审查名称和九字段名称保持稳定；未来可增加解释字段，但不改变既有状态含义或把 unknown/unavailable 改写成通过。
- **容器预留**：AC 卡可容纳四段式和九字段合同；审查 packet 仅在既有说明与已冻结材料内组织导航、摘要和详情，不新增文件；stage packet 的临时派生副本不进入 review；既有 provenance、来源和失败事实继续保留，新增视图不得覆盖原始事实。
- **状态预留**：quality_status 允许 passed、incomplete、unknown；acceptance_status 允许 pass、fail、unknown、deferred、not_applicable；stage_status 保留 completed、in_progress、failed、timeout、cancelled，并可记录 unavailable；stale 作为当前绑定结果如实呈现，不生成新状态机。
- **扩展边界**：未来可以在用户重新确认后扩展状态解释、材料导航或其他 phase 的上下文机制；本期不承诺四阶段统一导航、不引入模型阶段绑定、不引入总 token 统计、不新增公共控制面。

### 新增事实/派生视图登记

| 事实/视图 | 性质与消费者 | owner | 替代关系 | 删除或保留条件 |
| --- | --- | --- | --- | --- |
| 三态收口预检结果 | 只读 evidence/advisory 视图；consumer=status/close 只读展示 | build-plan | 替代每阶段重复预检和末尾才发现缺口 | 当 AC 收口合同被经审查的替代机制替换时删除 |
| canonical gap 投影 | 非持久派生视图；consumer=status/close 只读展示 | build-code | 替代 quality/release/close 中的重复文本缺口 | 旧别名投影迁移完成后删除重复展示，仅保留事实来源 |
| gap-bound 确认 payload | 既有 confirmation 的消缺输入；consumer=canonical gap 投影 | 当前阶段主会话 | 替代无 payload 的泛化确认被误消费 | 若 gap 消缺机制被经审查的替代确认机制替换时删除 |
| phase 验收事实 | 既有 human-confirmation/interactions 事实；consumer=阶段汇报、build-plan、verify-code | 当前 phase 主会话 | 替代用阶段完成冒充用户验收 | 若产品明确取消逐 phase 验收时删除 |
| 材料身份元数据 | stage runtime 派生的绑定事实；consumer=verify 材料检查 | 对应 stage runtime | 替代从材料正文猜测 task/revision/snapshot | 若材料绑定由经审查的统一事实源替代时删除 |
| 材料导航节 | 材料内可再生、非权威视图；consumer=主会话、build-plan、审查者 | 材料编写 stage 主会话 | 替代每次全量重读定位 | 若消费者不再使用导航或材料格式被替代时删除 |
| context-baseline.json | 观察 evidence；consumer=build-plan 主会话 | build-spec 主会话 | 替代无来源的临时基线引用 | 观察窗口结束并完成独立复核后可归档 |
| diagnostic-report.md 与 build-plan 所需 evidence 条目 | 源 evidence 事实；consumer=build-plan 阶段输入，不含 reviewer | 产生该 evidence 的 stage 主会话 | 替代无来源的诊断引用 | 源事实按原 evidence 生命周期保留/归档，不随 packet 副本销毁 |
| 阶段输入 packet 派生副本 | 非权威临时副本；consumer=spec-specify/spec-plan/spec-tasks 阶段输入，不含 reviewer | 对应阶段宿主 | 替代消费者直读任务目录 | packet 生命周期结束即不再保有临时副本，不另建归档材料 |
| 阶段输入 packet manifest/hash | 宿主组装的 stage 投递绑定；consumer=当前阶段输入消费者 | 对应阶段宿主 | 替代阶段输入无绑定读取 | 随 stage packet 生命周期使用；原派发事实按既有 evidence 保留 |
| 既有审查 packet manifest/hash | 既有 file_only 冻结链绑定；consumer=既有审查投递与审查者 | 既有审查宿主 | 保持原链，不被 stage packet 协议替换 | 按既有审查事实保留，不新增派生文件 |
| 冻结校验结果 | 阶段 outcome 事实；consumer=阶段汇报与下一阶段入口 | 对应阶段主会话 | 替代 build-spec 翻译中做决策 | 当冻结校验被经审查的替代完成条件检查替换时删除 |
| finding 分类与路由记录 | review attempt 内事实；consumer=阶段完成条件校验 | 对应阶段主会话 | 替代主会话自由判断处置 | 当分类路由被经审查的替代机制替换时删除 |
| needs_human 暂停事实 | finding 级暂停事实；consumer=阶段汇报与用户答复出口 | 对应阶段主会话 | 替代把 needs_human 当终态 | 当暂停态语义被经审查的替代机制替换时删除 |
| review 预算计数事实 | 按 review 目标计数；consumer=阶段审查纪律与汇报 | 对应阶段主会话 | 替代无预算重审 | 当预算机制被经审查的替代收敛机制替换时删除 |
| usage 与代理观测事实 | review attempt 与阶段 outcome 观测；consumer=阶段汇报与成本回顾 | 对应阶段主会话 | 替代无记录导致成本不可答 | 当 provider 统一返回 usage 且观测口径被替代时归档 |
| 增量 approval_binding 续签链 | decision-log 内增量绑定事实；consumer=冻结校验入口 | make-decision 主会话 | 替代增量决策后全量重确认 | 当增量决策机制被经审查的替代机制替换时删除 |

> 以上均为事实、evidence 或可再生视图；没有任何一项是第五材料、持久 selector、第二状态机或推进 gate。

## 10. 明确不做与默认必须成立

### 明确不做

- 不改历史任务记录和历史材料；历史样本只读用于诊断和回归事实，依据 D-101、D-204。
- 不重放真实外部任务验证；真实 replay 另立后续任务，依据 D-001、D-401。
- 不做页面、前端 UI 或 dashboard；本期只改善 CLI/JSON、阶段汇报、材料和质量事实，依据 UI applicability 结论。
- 不改宪法 close 三义；不以“严禁带缺口 close”替代现有语义，依据 D-202。
- 不新增公共入口、store、持久 selector、第二状态机、新 gate、第五材料或永久 compatibility bridge，依据 D-204、D-305、D-402。
- 不把 unavailable、failed、unknown、incomplete 或无 provenance 的空 findings 伪造成通过；它们只记录事实并浮现缺口，依据 D-203、D-206、D-303。
- 不在本规格展开实现级夹具 schema 或 phase 精确边界；这些由 build-plan 转译。状态值域、展示位、过期语义和 close 抄写规则已在本规格第 8 节定稿。
- 不每个 phase 重跑预检，不把预检、材料检查、独立审查、review、debate、测试或导航变成推进许可证，依据 D-203、D-303、D-304。
- 不做 token 度量机制；只观察材料组织、读取和审查包行为，依据 D-301、D-304。
- 不做模型与阶段强制绑定、模型使用记录或能力分级路由，依据 D-302、D-303、D-306。
- 不让审查者直接读取 task directory，不改变 file-only 冻结链，不做审查瘦身或切片实验，依据 D-304、F-041、F-042。
- 不改变五阶段顺序，不修改 make-decision 已接受的执行规范，不把本任务的新规则回溯迁移到历史材料，依据 D-002、D-304、D-306。
- 不改 verify-code 的阶段命名；总结文件中的“verify-code 命名易误解”只进入诊断说明和认知差异，不在本期改阶段名。
- 不做 token 预算、预警或计费机制；只落盘 provider 已返回的 usage 与字符级代理指标（主会话重读轮次、子代理输入字节、材料包字节），缺失标 unavailable，依据 D-505、T-030、T-035。
- 增量决策不重跑已确认决策的完整 Talk、审查、辩论、Grill 序列；只对新增缺口做一次真实问答与一条 D 记录，已确认部分不重跑不重写，依据 D-502、T-031。
- 冻结校验、findings 路由校验与统一回退校验只约束阶段正式完成声明，不新增公共 gate、推进许可证或第二状态机，依据 D-501、D-502、D-506。
- 审查包不做物理分切或瘦身，不承诺审查包 token 下降；投递链字节不减、零新文件，仅升级既有审查说明材料引导，依据 T-034。
- 历史材料不回溯迁移：仅新生成材料适用新模板与新校验规则，既有任务只按既有规则校验，不加历史兼容分支，依据 D-302 与方向卡 v4.3。

> 以上清单是本规格唯一权威的非目标列表；上游已接受的 out-of-scope 均在此继承，不在其他章节建立第二份非目标真相。

### 默认必须成立

- 标准流程从 make-decision 开始，先建立任务工作区，不跳阶段；build-spec 不补产品方向，只细化已接受决策。关联 FR-FLOW-001、AC-FLOW-001。
- 与用户的交互用大白话说明选项、后果和风险；决策材料保留原始需求、关键事实、选择、理由和延期交接。关联 FR-DIAG-001、FR-REPORT-001、AC-DIAG-001、AC-REPORT-001。
- 所有 unavailable、unknown、failed、partial 和 incomplete 都如实保留；质量、审查、测试、研究和历史事实不是继续工作的许可证。关联 FR-BOUND-002、FR-REVIEW-001、AC-BOUND-002、AC-REVIEW-001。
- commit、push、merge、archive、cleanup 和风险接收必须经过人类明确授权；阶段事实不能代替授权。关联 FR-GOV-001、AC-GOV-001。
- 针对自身产物的质量质疑必须由异源或独立上下文提供事实；主会话只登记和汇报，不自审自判。关联 FR-REVIEW-001、FR-CONTEXT-001、AC-REVIEW-001、AC-CONTEXT-001。
- 新能力必须说明唯一 consumer、owner、替代关系以及删除或保留条件；不得以重复投影、双写或永久桥接扩大控制面。关联 FR-GOV-001、AC-GOV-001。
- 四份当前材料是同一任务的唯一产品交接真相；build-spec、build-plan、build-code 和 verify-code 只能消费或细化当前材料和当前事实。关联 FR-FLOW-001、FR-CONTEXT-003、AC-FLOW-001、AC-CONTEXT-003。

## 11. 验收标准

- **AC 卡辅助字段**：`证据类型` 只描述预期证据载体，允许值为 `evidence`（事实记录）、`test`（测试或可执行检查）、`manual`（人工验收）；缺失或取其他值判材料不完整；它不替代九字段收口合同，也不改变 AC 的通过/失败断言。AC 卡的“证据”段与本字段一致，是 spec 期的预期证据契约，实际运行证据由 verify-code 回填校验。

本节验收完整覆盖 decision-log 成功/失败边界的 I、II、III 三部分：I 部分七项负向夹具由 AC-PREF、AC-GAP、AC-STATUS、AC-BOUND 承载；II 部分七项由 AC-MATERIAL、AC-REVIEW、AC-CONTEXT 承载；III 部分六项由 AC-LOOP-001～006 承载。失败边界（把未核实论断当事实、违宪新增控制面、假绿、方向未确认进入 build-spec、把 needs_human 当终态、回退演变为整阶段重跑、把独立审查当 pass）分别落入下列 AC 的失败条件与第 8 节失败分支表。

验收映射表（III 六行夹具，承接 decision-log 验收细节 III 各行）：

| 机制 | 负向夹具 | 判定 |
| --- | --- | --- |
| III-1 决策冻结校验三方不一致 | 头部 pending 与正文 accepted 并存→冻结校验拒绝开始；绑定非当前材料→拒绝 | build-spec 不开始规格化，可证伪 |
| III-1 增量续签链（RISK-009） | 缺用户答复回执仍 accepted→误放行拒绝；合法增量增补被拒→误阻断负向夹具 | 续签链双向覆盖 |
| III-2 finding 分类路由不匹配 | spec_ambiguity 无用户答复绑定、direction_change 无增量决策记录→阻断正式完成 | disposition 与分类路由匹配被校验 |
| III-3 needs_human 终态 | 无 next_action 或当正式完成→disposition 校验拒绝且 completion 保持 incomplete | 暂停态语义被强制 |
| III-4 超预算重审 | 同冻结 revision 无变化重复初始 review→预算拒绝；focused 后残留无核销出口→拒绝放行 | 预算计数与出口可证伪 |
| III-5 review attempt usage 缺失 | provider 未返回 usage→attempt 事实标 unavailable，不算 pass、不伪造 | 观测如实性 |
- [ ] **AC-DIAG-001**：操作者能从诊断报告看见四个历史样本的经核实共同模式、差异和总结材料的支持或不支持项，并能区分标准 close、质量不完整和 delivered-with-risk。
  - **来源/决策**：R-001、R-002；D-001、D-101、D-202。
  - **需求**：FR-DIAG-001。
  - **可观察场景**：SCN-009；用户阅读诊断报告时逐项查看事实状态和认知差异。
验证：人工逐项对照诊断报告中的样本、事实状态、差异说明和来源映射；打开 `evidence/diagnostic-report.md` 检查四个固定部分、task/material revision、来源绑定和 build-plan 消费者。
通过：每个关键结论都有核实状态和来源；唯一 canonical 载体存在且四个固定部分完整；内容版本、来源绑定和 build-plan 消费者明确；报告明确指出不支持或未核实的具体论断；标准 close 与风险 close 没有被合并成一个含混结论。
失败：把总结材料原样当事实；遗漏样本差异；诊断散在多处或唯一载体缺失；把 quality incomplete 或 not_released 写成物理风险 close；或没有说明用户主诉与核查事实的差异。
证据：用户可读诊断报告、来源映射和独立核查回读记录。
  - **收口合同**：producer=build-spec 主会话；consumer=用户与 build-plan；owner=build-spec 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前历史核查与三问取证材料；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=evidence/diagnostic-report.md；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=证据 current 且不替代用户授权
  - **证据类型**：`evidence`

- [ ] **AC-DIAG-002**：诊断交付完整回答三问，并把已接受的材料质量、verify 独立性和上下文治理方向与各自根因连接起来。
  - **来源/决策**：R-007～R-010；D-301、D-302、D-303、D-304、D-306。
  - **需求**：FR-DIAG-002。
  - **可观察场景**：SCN-009；用户阅读三问和综合结论。
验证：人工检查报告是否分别回答 make-decision 效果、build-spec/build-plan 成本结构、四份材料质量，并检查不做 token 度量和不做模型绑定的边界。
通过：三问均有事实、限制和综合结论；采用的治理增量与已接受决策一致；没有把模型使用记录或总 token 下降承诺加入需求。
失败：只交分析不交治理方向；把模型分工误写成强制产品规则；把无法度量的 token 数字当成事实；或遗漏材料质量和独立审查问题。
证据：三问诊断报告、决策映射和范围边界回读记录。
  - **收口合同**：producer=build-spec 主会话；consumer=用户与 build-plan；owner=build-spec 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前历史核查与三问取证材料；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=evidence/diagnostic-report.md；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=证据 current 且不替代用户授权
  - **证据类型**：`evidence`

- [ ] **AC-DIAG-003**：本任务 dogfood 只在五要素观察合同下消费，且正面或负面观察都如实记录。
  - **来源/决策**：R-005、R-006、R-010；D-401。
  - **需求**：FR-DIAG-003。
  - **可观察场景**：SCN-009、SCN-012；操作者查看本任务真实运行观察。
验证：检查观察合同是否写明阶段、样本、独立观察者、窗口和判定口径，并核对实际观察记录是否绑定当前事实。
通过：五要素全部出现；样本限定为本任务真实执行；独立观察者不可得时记录 unavailable；判定只看同一缺口一次、确认消缺和六状态独立显示；dogfood 不单独宣称质量通过。
失败：缺少任一要素；用主会话顺利执行替代独立观察；隐藏负面观察；或把 dogfood 当成主验收。
证据：dogfood 观察合同、窗口内事实和独立观察者可用性记录。
  - **收口合同**：producer=build-code/verify-code 主会话；consumer=用户与 verify/status 只读展示；owner=build-code/verify-code 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=本任务真实运行观察记录与独立观察者可用性记录；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/verify-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=五要素观察事实 current 且不单独宣称质量通过
  - **证据类型**：`evidence`

- [ ] **AC-FLOW-001**：任务按五阶段顺序推进，并在一个任务内共享当前材料而不要求跨任务交接方向。
  - **来源/决策**：R-003、R-004；D-001、D-002、D-402。
  - **需求**：FR-FLOW-001。
  - **可观察场景**：SCN-001；操作者从 make-decision 进入后续阶段。
验证：人工观察阶段汇报和材料交接顺序，检查 make-decision 开始前是否存在认证 worktree 事实，并检查 build-spec 是否只细化已确认方向。
通过：认证 worktree 事实先于 make-decision 存在并绑定 task_id、branch、worktree path 和创建时 snapshot；阶段顺序保持；多 phase 仍在同一任务内；build-spec 没有新增方向、替代任务或第五份材料。
失败：缺少认证 worktree 或绑定字段仍进入 make-decision；跳过 make-decision；build-spec 补充未确认需求；phase 之间丢失当前材料；或通过新任务承接本任务方向。
证据：阶段交接事实、当前材料身份和用户可读下一阶段说明。
  - **收口合同**：producer=对应 stage 主会话；consumer=用户与下一阶段；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前阶段真实执行记录；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=证据 current 且 phase 验收不被阶段完成冒充
  - **证据类型**：`evidence`

- [ ] **AC-FLOW-002**：每个 phase 的完成汇报都能分别显示工作、相关质量事实、用户验收、异源审查和下一阶段边界，且 phase 失败不会伪造完成或吞掉独立 phase。
  - **来源/决策**：D-301、D-306、D-401；R-010。
  - **需求**：FR-FLOW-002。
  - **可观察场景**：SCN-003、SCN-004；phase 处于进行中或遇到 unavailable 时查看汇报。
验证：观察正常、失败和 unavailable phase 的汇报，比较材料质量→上下文→verify 独立性顺序，并检查早期 smoke 的根因说明。
通过：每个 phase 有独立事实和下一边界；失败保留原因并允许独立修复；早期 smoke 仅在有根因支撑时采用；没有“phase 通过”这一新 gate。
失败：缺一个独立事实仍宣称 phase 完成；把 unavailable 变成 pass；无依据强制 smoke；或用 phase 状态阻断本可继续的独立修复。
证据：phase 汇报、事实状态和 phase 边界观察记录。
  - **收口合同**：producer=对应 stage 主会话；consumer=用户与下一阶段；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前阶段真实执行记录；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=证据 current 且 phase 验收不被阶段完成冒充
  - **证据类型**：`evidence`

- [ ] **AC-FLOW-003**：每个 phase 的用户验收事实独立存在，并且未答、取消、拒绝或延期不被阶段完成事实冒充。
  - **来源/决策**：D-507（当前 phase 验收方向）、D-301、D-401；R-010。
  - **需求**：FR-FLOW-003。
  - **可观察场景**：SCN-003、SCN-004、SCN-005、SCN-007；分别观察已答、未答、取消和拒绝。
验证：逐 phase 查看既有 human-confirmation/interactions 载体、用户回执、task/material/snapshot 绑定和事实记录，并核对没有新增 store、状态机、phase 账本、attempt 重试链或 current 选择算法；同时核对无既有交互的 phase 是否直接记录 unavailable/deferred 而未发起新的确认提示、是否新增了违反宪法 F7 的 build-code 日常确认。
通过：每个 phase 有 accepted/rejected/deferred/unavailable 之一；confirmation receipt、绑定字段、owner 和读取方完整；未答或取消保持 deferred/unavailable；无既有确认交互的 phase 直接记录 unavailable/deferred（带真实原因），未新增 build-code 用户确认提示或日常确认（宪法 F7）；deferred/unavailable 的 reason 使用 user_cancelled、user_no_response、receipt_missing、unknown_reason 或真实通道原因，无法区分时使用 reason=unknown_reason；rejected 不被改写为 accepted；accepted 只表示用户明确接受该 phase，不等于继续或不可逆操作的授权、rejected 建议回本 phase 修复并重问、deferred 建议等用户、unavailable 记录原因并建议按既有公共合同重试；系统不把这些事实变成自动 gate；phase 验收事实与 acceptance_status 并列展示，accepted 不推导 AC pass，AC pass/fail/unknown 也不改写 phase accepted；phase rejected/deferred/unavailable 不改变 product_release_status 或 physical_close_status 的来源规则，但必须并列显示并由用户决定下一步；普通 phase 验收不与风险接收混用。
失败：缺少 phase、confirmation receipt 或用户回执绑定；阶段完成被当成用户验收；未答被猜为 accepted；为形成验收事实新增 build-code 阶段的用户确认提示或日常确认（违反宪法 F7）；无既有交互时推断 accepted/rejected；拒绝/延期/取消后没有恢复建议；用一个总验收覆盖所有 phase；或为该事实新增 store、状态机、phase 账本、attempt 重试链或 current 选择算法。
证据：逐 phase 用户验收事实、回执绑定和异常样本观察。
  - **收口合同**：producer=对应 stage 主会话；consumer=用户与下一阶段；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前阶段真实执行记录；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=证据 current 且 phase 验收不被阶段完成冒充
  - **证据类型**：`evidence`

- [ ] **AC-PREF-001**：本规格所有 in-scope AC 都携带九字段收口合同，且缺失字段具有明确的 unknown/unavailable 处理。
  - **来源/决策**：R-004、R-006；D-201、D-402。
  - **需求**：FR-PREF-001。
  - **可观察场景**：SCN-001、SCN-006；操作者查看一个完整合同和一个字段缺失合同。
验证：逐 AC 阅读 producer、consumer、owner、命令、fixture、oracle、证据路径、freshness、close 条件及其缺失说明。
通过：所有 in-scope AC 均出现九字段；缺失值显示 unknown 或 unavailable 与处理责任；deferred 字段有 build-plan/tasks 替换点；保留 unavailable 的合同只得到 preflight=unavailable/acceptance=incomplete，不改变既有用户授权 close；没有豁免项；合同没有引入新的材料或需求方向。
失败：任一 in-scope AC 缺字段；字段缺失但无状态；把“无人消费”当合法 consumer；以模糊句替代 oracle 或 freshness；build-plan 冻结 tasks 前仍把 deferred 字段当 ready；或要求 build-plan 再决定字段语义。
证据：AC 合同内容、预检消费结果和字段覆盖回读记录。
  - **收口合同**：producer=build-plan（收口预检载体形态待验证，见 DEFERRED-001/OPEN-005，未定案前不假定 profile 已存在）；consumer=status/close 只读展示；owner=build-plan；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前 spec AC 合同；oracle=ready/unknown/unavailable 与原因；证据路径=quality/evidence/build-plan/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=合同可读且不阻断同任务修复
  - **证据类型**：`test`

- [ ] **AC-PREF-002**：预检只输出 ready、unknown、unavailable 三态，并且不输出 blocked 或阻断 close/continue。
  - **来源/决策**：R-004、R-006；D-203、D-204。
  - **需求**：FR-PREF-002。
  - **可观察场景**：SCN-003、SCN-004、SCN-006；分别提供可判断、无法判断和资源不可用的合同。
验证：观察三类合同的预检结果、原因、owner 和下一复核触发点，并观察后续同任务修复路径；同时检查覆盖边界声明的 task/material/snapshot/source_hash 绑定和逐 AC 字段。
通过：ready、unknown、unavailable 各自语义稳定；覆盖声明是 build-plan 末端 evidence，列出全部 in-scope AC、producer/consumer、覆盖阶段、每条 AC 九字段、排除项及原因，并绑定当前 task/material/snapshot/source_hash；遗漏 AC 产生 unknown/unavailable；命令或 oracle 仍为 unavailable 时如实显示 unavailable；unknown 不猜；blocked 不出现；预检异常不阻止同任务修复。
失败：生成 blocked；通过缩小覆盖声明得到 ready；遗漏 in-scope AC 仍判 ready；把 unavailable 当拒绝或通过；把 build-plan 尚未替换的产品级延期误报为 ready；预检写入质量状态；或每个 phase 无条件重复运行预检。
证据：预检结果、状态展示和同任务修复后的重验事实。
  - **收口合同**：producer=build-plan（收口预检载体形态待验证，见 DEFERRED-001/OPEN-005，未定案前不假定 profile 已存在）；consumer=status/close 只读展示；owner=build-plan；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=当前 spec AC 合同；oracle=ready/unknown/unavailable 与原因；证据路径=quality/evidence/build-plan/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=合同可读且不阻断同任务修复
  - **证据类型**：`test`

- [ ] **AC-GAP-001**：同一快照中的同一规范化缺口只有一个 gap_id 和一个可见投影，且每个来源仍可追溯。
  - **来源/决策**：R-001、R-006；D-205、D-206、本轮用户澄清确认。
  - **需求**：FR-GAP-001。
  - **可观察场景**：SCN-006、SCN-008；将同一内容放入多个事实投影并改变空白或字段顺序。
验证：比较聚合前后的缺口数量、gap_id、五字段 canonical payload、规范化内容和 provenance，并改变 snapshot 观察生命周期。
通过：五字段 payload 完整；gap_id 严格按 GAP 字节合同使用五项保序数组（gap-id.v1 版本常量加四身份字段）、唯一 subject 编码、N/J/B 与完整小写 SHA-256，reason/provenance/owner/snapshot 不影响 ID，material_revision 变化按 subject 身份变化处理；跨生产者同一缺口即使用不同 reason 文案也得到同一 gap_id；多个 reason 规范化为非空 provenance 列表，按 producer、reason_text 去重排序且不改 ID；Unicode NFC、空白和序列化规则固定；缺失/null 内容字段（gap_kind、expected_fact、actual_fact）经 N 归一为 unknown，缺失/null 身份字段（task_id、material_name、material_revision）判定 invalid_gap_identity、不生成 gap_id、不参与确认消缺；数字、数组或对象身份字段触发 gap_projection_unavailable 并显示 invalid_gap_identity、producer、subject_id、owner 和修复建议，不静默丢缺口；材料检查不完整映射为 material_integrity_gap，独立审查失败映射为 review_execution_gap，provider 不可用映射为 provider_unavailable_gap，executed 但 provenance incomplete 映射为 review_provenance_gap；投影来源只作为 provenance；同一缺口只显示一次；跨快照不要求稳定；quality_gaps、release_gaps、product_release_reasons、close_preparation_gaps 的 producer/consumer、canonical 替代和拆除条件可见。
失败：聚合键带投影源而产生多个 id；去重丢失来源；缺口被持久登记；跨时间复用已消失缺口；非法身份字段被静默丢弃；缺失/null 身份字段被归一为 unknown 参与身份构造或确认消缺；或 canonical payload 字段/等价规则缺失。
证据：同快照聚合观察、provenance 回读和 snapshot 变化记录。
  - **收口合同**：producer=build-code 收口投影实现；consumer=status/close 只读展示；owner=build-code 阶段实现者；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=同根因多投影与确认样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree/gap_id；close 条件=当前快照投影可信且旧确认不消费
  - **证据类型**：`test`

- [ ] **AC-GAP-002**：与当前 snapshot/material 匹配的 human-confirmation 能消除对应缺口，旧确认不能消缺，close 语义不被确认投影改写。
  - **来源/决策**：R-001、R-006；D-202、D-205、第二轮用户澄清确认。
  - **需求**：FR-GAP-002。
  - **可观察场景**：SCN-002、SCN-008；分别提交匹配确认、旧确认和多个来源投影。
验证：观察 status/close 是否从当前缺口生成包含 canonical payload 的确认内容，观察确认写入的 canonical payload、确认前后的缺口投影、`task_id/material_revision/snapshot_tree/gap_id` 绑定、并发确认去重、provenance 和六状态，检查旧确认是否被排除。
通过：确认内容由 status/close 当前缺口投影生成，用户通过既有 confirmation 边界确认；确认事实带 canonical payload（reason 为排序后的 provenance 列表）与回执；四元组匹配的确认后对应缺口不再报 missing；任一字段不匹配的旧确认保持 stale 或不消费；并发相同确认去重；同一缺口仍只显示一次；payload 不完整时显示 unavailable，不伪造确认；quality_status、product_release_status 和 physical_close_status 不被确认投影直接推导。
失败：确认事实没有 payload 或回执；已有确认仍报 missing；旧确认消除当前缺口；确认覆盖原始事实；用文本相似度代替绑定匹配；并发确认产生重复消费；或确认自动宣称质量通过或物理 close。
证据：确认绑定事实、缺口投影差异和状态回读记录。
  - **收口合同**：producer=build-code 收口投影实现；consumer=status/close 只读展示；owner=build-code 阶段实现者；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=同根因多投影与确认样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree/gap_id；close 条件=当前快照投影可信且旧确认不消费
  - **证据类型**：`test`

- [ ] **AC-BOUND-001**：协议身份错配或收据未绑定当前 snapshot/material 时，事实写入被拒绝并显示具体原因。
  - **来源/决策**：R-001、R-006；D-206。
  - **需求**：FR-BOUND-001。
  - **可观察场景**：SCN-006、SCN-008；提交 agent identity 与 attempt identity 不一致或旧 snapshot 收据。
验证：观察写入响应、错误原因、当前事实集合和后续修复重写行为。
通过：错配在进入当前事实前拒绝；错误指出身份或快照绑定问题；拒绝结果不被当成 unavailable 通过；修复绑定后可重新提交。
失败：错配写入成功；只给笼统错误而丢底层原因；旧收据参与当前判断；或通过标记 unavailable 掩盖结构错误。
证据：正反边界观察、错误事实和修复后重写事实。
  - **收口合同**：producer=build-code 协议边界实现；consumer=status/close 只读展示；owner=build-code 阶段实现者；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=身份错配、旧收据、缺失证据样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=边界错误被拒且语义缺失如实可见
  - **证据类型**：`test`

- [ ] **AC-BOUND-002**：语义证据缺失、provider unavailable 或独立审查 failed 时，系统记录事实和缺口但不阻断同任务修复，也不产生 pass。
  - **来源/决策**：R-001、R-006、R-010；D-203、D-206、D-303、本轮用户澄清确认。
  - **需求**：FR-BOUND-002。
  - **可观察场景**：SCN-002、SCN-004、SCN-005、SCN-012；分别观察空结果、不可用、失败和取消。
验证：检查状态、原因、owner、下一步、缺口投影和继续修复路径。
通过：证据缺失与协议错误区分；unknown/unavailable/failed/incomplete 原样保留；材料检查不完整、provider unavailable、独立审查 failed、executed 但 provenance incomplete 分别进入对应 canonical gap；同任务仍可修复；没有自动 pass、close 或风险接受。
失败：缺证据被当作写入拒绝；provider 失败被改成空 findings/pass；错误导致同任务无法修复；或系统静默丢失原因。
证据：退化事实、缺口投影和同任务修复后的状态观察。
  - **收口合同**：producer=build-code 协议边界实现；consumer=status/close 只读展示；owner=build-code 阶段实现者；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=身份错配、旧收据、缺失证据样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=边界错误被拒且语义缺失如实可见
  - **证据类型**：`evidence`

- [ ] **AC-STATUS-001**：六状态分别来自其唯一来源，并能在一个状态改变时保持其他状态独立。
  - **来源/决策**：R-004、R-006；D-202、D-207。
  - **需求**：FR-STATUS-001。
  - **可观察场景**：SCN-001、SCN-003、SCN-004、SCN-008；分别改变执行、阶段、质量、AC、发布和物理 close 事实。
验证：观察六状态的名称、来源、值域和 stale 语义，构造 quality incomplete、acceptance stale、stage cancelled 等组合。
通过：can_continue、stage_status、quality_status、acceptance_status、product_release_status、physical_close_status 均按各自来源规则派生；product_release_status 的 verify confirmation 只指既有用户验收回执；dispatch_attempt/review_result 不参与 release 派生；quality_status 只来自独立质量决议；共享底层事实可同时影响多个状态，但展示状态不能互相复制；非 current 输入不会显示 released；stale/unavailable 原样可见。
失败：展示层推导第二状态机；一个状态直接覆盖另一个状态；预检或缺口写入 quality_status；旧事实被显示为当前完成；或把共享事实派生误写成状态间直接赋值。
证据：六状态组合观察、来源说明和 stale 事实回读。
  - **收口合同**：producer=verify-code 状态展示实现；consumer=status/close 展示与用户；owner=verify-code 阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=六状态组合和 close 绑定样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/verify-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=状态原样抄写且不新增裁判
  - **证据类型**：`test`

- [ ] **AC-STATUS-002**：close 记录如实抄写当前质量、验收、发布和物理 close 状态，并且缺失或 stale 输入不会被裁判为通过。
  - **来源/决策**：R-004、R-006；D-202、D-207、本轮用户澄清确认。
  - **需求**：FR-STATUS-002。
  - **可观察场景**：SCN-001、SCN-004、SCN-007、SCN-012；分别观察完整、缺失、stale 和用户授权后的 close 记录。
验证：对照 close 记录中的 quality_status、acceptance_status、product_release_status、physical_close_status、snapshot/material 绑定和原始事实，并核对授权动作完成后的物理读回是否基于新的 snapshot/material。
通过：四项状态原样抄写；授权动作后必须重新读取物理事实；post-action 读回绑定动作后的 snapshot/material；不固定 pre-close/post-close 两段结构；缺失为 unknown/incomplete；stale 保持可见；用户授权和 close 三义不被改写；close 记录不新增质量或发布裁决。
失败：close 把 unavailable 写成 pass；用旧 snapshot 状态充当当前；隐藏 acceptance_status；不做动作后物理读回；或由 close 记录推导第二状态机。
证据：close 记录、原始状态事实、snapshot/material 绑定和用户授权事实。
  - **收口合同**：producer=verify-code 状态展示实现；consumer=status/close 展示与用户；owner=verify-code 阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=六状态组合和 close 绑定样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/verify-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=状态原样抄写且不新增裁判
  - **证据类型**：`test`

- [ ] **AC-MATERIAL-001**：新生成 spec/plan 的 AC 四段卡和 tasks 的结构化 oracle 分别被对应检查器识别，错误标签、空失败段或缺失映射会被识别为材料不完整。
  - **来源/决策**：R-009、R-010；D-302、本轮用户澄清确认。
  - **需求**：FR-MATERIAL-001。
  - **可观察场景**：SCN-010；分别提供符合 plain 标签的 AC、旧样式标签的 AC 和缺少失败内容的 AC。
验证：直接以材料原文分别检查 spec/plan 的 AC 四段卡和 tasks 的结构化 oracle，不先人工补写标签；覆盖旧粗体标签、缩进/bullet、空段、多行内容、重复标签、错误 ac_id/fr_id 和一对多冲突样本。
通过：spec/plan 的验证、通过、失败、证据四段均按唯一语法存在且非空；spec 的 fr_id/ac_id 为稳定主键，plan 原样继承 AC 四段语义和九字段合同中的产品语义字段；命令、fixture、证据路径、oracle 可按 FR-PREF-001 在 build-plan 中替换延期值或继续标注 unavailable，不算漂移；tasks 的行为验证具备稳定 ac_id/fr_id、恰好映射一个当前 AC 且可映射回 AC 的 pass/reject；同一 task_id 不重复，同一 oracle 不指向多个 AC；RED/GREEN 配对任务可共享同一 AC 但必须通过 paired_task 显式连接；缺失、错指和 plan/tasks 语义漂移被判材料不完整；符合新规则的材料直接通过检查；不符合者明确显示材料缺口。
失败：模板与检查器需要不同标签；只检查验证段而放过空失败段；tasks oracle 缺少 ac_id/fr_id、指向错误 AC、与 AC 通过/失败无法映射、同一 task_id 重复、出现一对多冲突，或把未配对的重复 AC 映射误判为合法 RED/GREEN 配对；或依赖额外脚本把不合格材料改成合格。
证据：材料检查结果、正反 AC 原文和用户可读缺口说明。
  - **收口合同**：producer=build-spec/build-plan 材料校验实现；consumer=build-plan/verify-code/status/close；owner=build-spec/build-plan 阶段实现者；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=新旧 AC、oracle、材料身份样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=材料事实 current 且不成为 pass 门槛
  - **证据类型**：`test`

- [ ] **AC-MATERIAL-002**：verification_role=RED 且有配对任务（paired_task≠N/A）的行为验证，在 oracle 缺少非空 reject 时被判材料不完整；GREEN 配对任务仅要求配对关联与 oracle.pass 非空；含可证伪拒绝断言时通过该项检查；非配对行为任务提供 reject 表达位但不强制；非行为验证不被关键词规则误判。
  - **来源/决策**：R-009、R-010；D-302（v4.3 修正语义）、D-305、T-032、本轮用户澄清确认。
  - **需求**：FR-MATERIAL-002。
  - **可观察场景**：SCN-006、SCN-010；分别提供 RED 配对缺 reject、GREEN 配对、非配对行为、身份拒绝、旧收据拒绝和聚合类验证 oracle。
验证：按验证角色和配对事实检查 oracle 的 pass/reject 结构，观察 RED 缺 reject、GREEN 配对、非配对行为、空 reject、有效 reject 和非行为类材料六类样本。
通过：结构检查通过只表示 oracle.pass 存在、非空、非占位并映射到 AC 正向断言；verification_role=RED 且 paired_task≠N/A 时 oracle.reject 的 input、expected_rejection、observation 三个字段均非空；verification_role=GREEN 且 paired_task≠N/A 时只强制配对关联存在与 oracle.pass 非空，不因缺 reject 判不完整；非配对行为任务提供 reject 表达位但不强制；聚合或非行为验证按约束显式 N/A 不被强制；语义通过另由独立复核或人工验收记录，结构检查器不得宣称语义通过；verification_role/paired_task 始终存在；tasks 冻结前，每个行为 AC 都有逐条验证方式，或真实 unavailable 原因、owner、下一次修复点和继续影响；unavailable 不会被写成 ready、accepted 或质量通过。
失败：oracle.pass 缺失、为空、占位或无法映射到 AC；RED 配对任务缺 reject 三段仍被判完整；GREEN 配对任务因缺 reject 被误判不完整；省略 verification_role/paired_task 以规避 reject；`reject: TBD`、空泛“拒绝”或同义反复未经独立/人工复核就被判语义有效；把任意包含“拒绝”文字的句子当成有效 oracle；或对非行为验证强制新增字段。
证据：oracle 结构、验证角色与配对事实的检查结果。
  - **收口合同**：producer=build-spec/build-plan 材料校验实现；consumer=build-plan/verify-code/status/close；owner=build-spec/build-plan 阶段实现者；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=新旧 AC、oracle、材料身份样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=材料事实 current 且不成为 pass 门槛
  - **证据类型**：`test`

- [ ] **AC-MATERIAL-003**：verify 入口对材料存在、身份绑定、内容完整性（非占位符、非零 digest、digest 匹配）与快照新鲜度四项事实逐项报告，检查异常不变成推进门。
  - **来源/决策**：R-009、R-010；D-302、D-303、本轮用户澄清确认。
  - **需求**：FR-MATERIAL-003。
  - **可观察场景**：SCN-004、SCN-012；逐项缺失材料、身份、内容完整性和当前绑定。
验证：观察四项检查的逐项结果、原因、当前材料状态和同任务修复后重验。
通过：四个检查项均有独立事实；存在性、身份、内容完整性、快照新鲜度分别可判；content_sha256 与当前完整正文重算值精确相等；总体状态只取 ready/incomplete/stale/unavailable；占位符按空正文或整行精确匹配 TBD/TODO/待填写；零 digest、digest 不匹配、旧 snapshot、错误 task_id、占位符或缺字段按固定优先级归因；检查只读、不修改材料、不阻断修复、不写 quality pass。
失败：遗漏任一检查项；把五个信号混成无法判定的字段；用零 digest、错误 digest 或旧绑定作为当前事实；同一异常被不同实现分到不同类别；把材料检查通过写成质量通过；或因材料检查异常禁止同任务修复。
证据：四项材料事实检查、异常原因和修复后重验记录。
  - **收口合同**：producer=verify-code 材料检查实现；consumer=verify-code/status/close；owner=verify-code 阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=新旧 AC、oracle、材料身份样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/verify-code/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=材料事实 current 且不成为 pass 门槛
  - **证据类型**：`evidence`

- [ ] **AC-REVIEW-001**：verify 分别留下 dispatch_attempt 与 review_result 事实；可信空 findings 具备完整 provenance，失败/不可用保留原因且不阻断语义。
  - **来源/决策**：R-009、R-010；D-303、D-305、本轮用户澄清确认。
  - **需求**：FR-REVIEW-001。
  - **可观察场景**：SCN-002、SCN-004、SCN-005、SCN-012；观察成功、失败、不可用、一次重试、取消和可信/假空 findings。
验证：查看 verify 阶段汇报、dispatch_attempt、review_result、空结果 provenance、异源身份、当前材料绑定、原因和重试次数。
通过：dispatch_attempt 与 review_result 分开；发起后未达终态时只显示 attempted 而不显示 review_result；聚合终态只能是 executed、failed 或 unavailable 之一；成员 cancelled/timeout 保留原始状态但按规则聚合；failed 最多一次既有通道重试；failed→executed 的重试记录保留为历史，当前展示只消费绑定当前 material/snapshot 的事实；可信空 findings 带 request_id、provider/role、material_id、snapshot_tree、身份、结果状态和审查范围；范围为当前整份冻结材料或当前 phase/AC 覆盖清单，scope 缺失的空结果不可信；身份缺失、reviewer 与 executor 相同或身份关系无法证明时，发起前校验拒绝发送，dispatch_attempt=unavailable，review_result=unavailable，reason=invalid_identity；仅非身份 provenance 缺失时 provenance_status=incomplete，且该结果不得参与 quality pass；独立审查不替代自查、不成为 pass 或 close 门。
失败：dispatch_attempt=unavailable 被写成已发起；failed/unavailable 被改写成空 findings 或通过；空 findings 缺 provenance 仍被当成可信；异源被解释为模型等级；或审查结果阻断同任务修复和用户决定。
证据：verify 独立审查事实、阶段汇报、空结果 provenance 和身份绑定回读。
  - **收口合同**：producer=verify-code 异源审查通道；consumer=用户/status/close；owner=verify-code 阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=成功、失败、不可用与重试样本；oracle=executed/failed/unavailable 与原因；证据路径=quality/reviews/results/<name>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=三态事实可见且不替代自查或用户决定
  - **证据类型**：`evidence`

- [ ] **AC-REVIEW-002**：每个实施 phase 都有独立审查事实，且不可用或失败不会被阶段自查冒充。
  - **来源/决策**：R-009、R-010；D-301、D-303、D-305、本轮用户澄清确认。
  - **需求**：FR-REVIEW-002。
  - **可观察场景**：SCN-003、SCN-004、SCN-012；分别观察 phase 审查成功、失败、不可用和修复后重验。
验证：逐 phase 检查审查请求、attempt、executor_identity、reviewer source_id、material/snapshot 绑定、三态结果和原因，并核对 reviewer 与 executor 不同。
通过：每个实施 phase 有独立审查事实；发起前完成 reviewer 身份校验，且 reviewer 身份可证明不同于 executor_identity；顶层结果只能是 executed、failed、unavailable；identity 缺失、相同或无法证明时不发送审查，请求事实和结果事实均为 unavailable 且 reason=invalid_identity；unavailable 带真实原因且不阻断修复；verify 整体审查不被回填为所有 phase 已审查。
失败：某 phase 只引用自查或同身份审查；缺 attempt、绑定或身份证据仍称已审查；failed/unavailable 被隐藏；或一个整体验收审查替代全部 phase 审查事实。
证据：逐 phase 审查事实、attempt 绑定和阶段汇报。
  - **收口合同**：producer=对应 phase 既有审查通道；consumer=阶段汇报/verify-code/status；owner=对应 phase 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=phase 审查成功、失败、不可用样本；oracle=executed/failed/unavailable 与原因；证据路径=quality/reviews/results/<name>.json；freshness=绑定当前 task/material_revision/snapshot_tree/phase；close 条件=phase 审查事实可见且不成为 gate
  - **证据类型**：`evidence`

- [ ] **AC-CONTEXT-001**：build-spec/build-plan 的执行模型能被阅读者看到 step×M/S/B/P 职责、六条上下文守恒、并行上限、交互独占和争议分级，并且运行时主会话只保留引用、hash 和摘要。
  - **来源/决策**：R-008、R-010；D-304、D-306、本轮用户澄清确认。
  - **需求**：FR-CONTEXT-001。
  - **可观察场景**：SCN-003、SCN-011；观察研究、草稿、复核、交互、落盘和并行阶段。
验证：阅读执行模型和阶段汇报，观察完整产物是否落盘、主会话摘要是否不超过 500 字、复核 finding 是否一条一行、并行是否遵守上限、交互是否由 M 独占，并记录 packet 注入字符数、主会话全文重读次数和既有 build-plan 字符量基线。
通过：M/S/B/P 角色边界清晰；六条规则均可追溯；研究≤4、debate≤4；审查拓扑按阶段保持 make-decision=2 role、build-spec/build-plan=多 provider 单发；方向级争议到用户、实施级争议到独立复核；主会话不回塞全文；派发/摘要/覆盖校验失败后仍禁止完整 packet 回灌主会话，恢复只能由独立上下文读取同一冻结 packet 详情并保留 hash/snapshot，再回传不超过 500 字摘要及引用；摘要保留 source 映射、数量校验和状态/原因/owner/判据/证据覆盖，恢复失败保持 unavailable/degraded；效率观察使用固定 context-baseline、定义字符范围和全文重读事件；baseline 文件由 build-spec 在 spec 冻结前生成，build-plan 消费，记录基线、窗口和实际读取行为；packet 注入和全文重读事件必须来自当前 stage outcome 的 step evidence，并带 packet/material hash、revision、snapshot 和字符数；packet_injected_chars、current_chars、full_reread_count 可由同一事件记录独立重算，无下降证据时写“未证明下降”。
失败：交互外包；并行超限；主会话保留或反复回读全文；摘要没有引用或 hash；摘要丢失状态、原因、owner、判据或证据映射仍继续使用；争议由主会话单方裁决；执行模型变成推进 gate；或把字符观察包装成 token 度量承诺。
证据：执行模型文本、阶段摘要、派发记录和并行/交互观察。
  - **收口合同**：producer=build-spec/build-plan 主会话；consumer=阶段交接/verify-code；owner=build-spec/build-plan 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=导航、packet、派发和读取行为样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-spec/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=上下文行为可见且不宣称 token 必降
  - **证据类型**：`evidence`

- [ ] **AC-CONTEXT-002**：本任务新生成或可写材料均有起草时生成、定稿时更新的材料导航，历史只读 decision-log 不被回溯改写，主会话和消费者按导航到详细段落按需读取。
  - **来源/决策**：R-008、R-010；D-304、D-305。
  - **需求**：FR-CONTEXT-002。
  - **可观察场景**：SCN-011；分别观察起草、定稿、材料变化和按主题读取。
验证：检查每份材料头部的节清单、每节摘要和读取时机，改变材料后观察导航是否更新，并核对正文仍是权威来源。
通过：spec 及后续 plan/tasks 都有导航；导航非空、可再生、随材料更新；decision-log 保持历史只读；主会话先读导航再按需读正文；不新增持久材料对象；没有总 token 下降承诺。
失败：适用材料导航只在末端生成；材料改变后仍显示旧摘要；导航取代正文成为唯一真相；为导航新增第五材料；或把历史 decision-log 回溯改写。
证据：适用材料导航、材料更新前后观察和按需读取记录。
  - **收口合同**：producer=build-spec/build-plan 主会话；consumer=阶段交接/verify-code；owner=build-spec/build-plan 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=导航、packet、派发和读取行为样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-spec/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=上下文行为可见且不宣称 token 必降
  - **证据类型**：`test`

- [ ] **AC-CONTEXT-003**：spec-specify/spec-plan/spec-tasks 消费阶段输入冻结 packet；审查者只消费既有 file_only 审查 packet，stage 派生文件不得隐式进入 review 链；findings 处置和终检使用独立上下文回传的结构化摘要。
  - **来源/决策**：R-008、R-010；D-304、D-305。
  - **需求**：FR-CONTEXT-003。
  - **可观察场景**：SCN-011；观察宿主组装、冻结、子代理派发和审查材料读取。
验证：比较消费者实际收到的材料层次、摘要与详情读取顺序，检查 spec-specify/spec-plan/spec-tasks 三个输入契约和 simplicity-guard/plan-eng-review 的 inline 声明、调用位置、失败回退，检查审查者不能访问任务目录，观察 file-only 冻结链和既有审查说明材料的导航引导。
通过：阶段输入消费者只读 stage 冻结 packet；stage packet 含正文、manifest、导航/摘要和按需详情，临时副本与源 evidence 生命周期分离；manifest 绑定 task/stage/material_revision/snapshot/source digest，冻结 hash 覆盖正文与派生副本；packet_freeze_hash 严格使用 FR-CONTEXT-003 的 stage-input-packet.v1、精确 file_entries/path/sha256 字段、J/B/T 字节与外层预像合同，排除且仅排除 manifest 顶层自身 hash；review 消费者不使用 stage manifest/hash，diagnostic-report/context-baseline 与派生文件不因 stage manifest 登记而进入审查链；三个输入契约都禁止全文直读；simplicity-guard/plan-eng-review 的声明与实际执行位置一致；findings 处置、终检复查和调研实际派发到独立上下文；主会话只审摘要和引用；审查者先看到导航/摘要、再按需读详情；审查包维持全量 file_only 冻结链，字节不减、零新文件，token 下降为非承诺项；无 task directory 直读、无审查瘦身实验、无新增权威材料；packet 重建/重试保留历史，当前展示只消费绑定当前 material/snapshot 的记录；组装、manifest 或冻结失败后的 unavailable 必须带 owner、真实原因和 next_action，派发/摘要失败后可按既有通道重试，不能死锁当前任务；阶段汇报披露派发与 packet 事实。
失败：把任务目录直读开放给审查者；stage 派生文件隐式进入 review 链；stage/review manifest/hash 或副本/源 evidence 生命周期混用；hash 字节合同或固定向量不一致；恢复时向主会话回灌完整 packet；向 provider 反复注入全文；摘要丢失关键语义；冻结链被替换或审查包被物理分切；应派发工作留在主会话；packet/派发失败后静默降级或伪装节省；或把分层宣称为已证明总 token 下降。
证据：packet 内容分层、消费者读取观察、摘要回传和审查边界事实。
  - **收口合同**：producer=build-spec/build-plan 主会话；consumer=阶段交接/verify-code；owner=build-spec/build-plan 主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=导航、packet、派发和读取行为样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-spec/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=上下文行为可见且不宣称 token 必降
  - **证据类型**：`evidence`

- [ ] **AC-REPORT-001**：阶段汇报始终用大白话区分 findings、处置、失败、空结果、unknown/unavailable/incomplete、独立审查三态和下一步，不把任何质量事实伪造为 pass。
  - **来源/决策**：R-001、R-005、R-010；D-101、D-202、D-303、D-401。
  - **需求**：FR-REPORT-001。
  - **可观察场景**：SCN-001、SCN-002、SCN-004、SCN-009、SCN-012。
验证：人工阅读正常、空、失败、不可用、取消和成本观察汇报，核对状态、原因、用户下一步和“未证明下降”口径。
通过：每类事实有独立标签和原因；空 findings 不等于通过；failed/unavailable 不等于质量失败或质量通过；成本无下降证据时诚实报告；用户能知道下一步和是否需要授权。
失败：省略失败或不可用；用空列表暗示通过；将 review/debate/材料检查变成门；报告使用未经解释的模型或 token 承诺；或用户无法知道下一步。
证据：阶段汇报、状态投影、失败事实和用户阅读观察。
  - **收口合同**：producer=当前 stage 主会话；consumer=用户/build-plan/verify-code；owner=当前阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=正常、空、失败、不可用和取消汇报样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=事实完整且不伪装 pass
  - **证据类型**：`manual`

- [ ] **AC-GOV-001**：治理边界和新能力登记保持一致，且本任务没有新增公共入口、持久 selector、第五材料、第二状态机或推进 gate。
  - **来源/决策**：R-003、R-004、R-006、R-010；D-204、D-305、D-402。
  - **需求**：FR-GOV-001。
  - **可观察场景**：SCN-001、SCN-007、SCN-011；观察正常收口、风险接收和材料/packet 生命周期。
验证：文档和产品行为核对四份材料、五阶段、close 三义、用户授权、控制面 owner/consumer/替代关系/删除或保留条件。
通过：结构化问答工具卡仅按登记的 owner/consumer 使用；风险接收沿用既有用户授权语义；导航和材料检查均为非权威事实视图；第 9 节登记的所有事实/派生视图都有 owner、唯一 consumer、替代关系和删除/保留条件；无新增 public 入口、store、selector、gate、第五材料或第二状态机。
失败：以新入口或新持久对象承载本需求；以 preflight、review、独立审查或材料检查阻断推进；新增双写/永久桥；或没有控制面责任和删除条件。
证据：治理边界核对、消费者观察、授权记录和控制面登记事实。
  - **收口合同**：producer=build-plan 主会话；consumer=用户/build-code/verify-code；owner=build-plan；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=控制面登记与授权样本；oracle=unavailable(reason=product_level_ac; replacement=build-plan/tasks executable oracle)；证据路径=quality/evidence/build-plan/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=边界保持且用户授权不被替代
  - **证据类型**：`evidence`

- [ ] **AC-LOOP-001**：build-spec/build-plan 入口先通过决策冻结校验（三方一致、绑当前材料、无方向级未决）才开始规格化；不满足暂停回 make-decision；增量续签链被正确接受。
  - **来源/决策**：R-011；D-501。
  - **需求**：FR-LOOP-001。
  - **可观察场景**：SCN-013；分别提供一致冻结、头部 pending 正文 accepted、绑定非当前材料、有方向级未决与合法增量增补五种样本。
验证：在阶段入口执行冻结校验，检查头部 approval_binding 与正文最终确认节及 step 11 记录三方一致、material_revision 与 snapshot_tree 绑定、开放方向问题计数、冻结包合同四项内容覆盖，以及增量续签链的接受与拒绝行为。
通过：一致冻结通过并开始规格化；任一不满足暂停并回 make-decision，不开始规格化；校验结果记录为阶段 outcome 事实；step 11 canonical 记录按稳定 record_id 与选择优先级取最新 accepted（step 11-v4 及第二轮 accepted），历史未确认的迁移记录不参与三方一致；增量续签（基线确认+增量增补链，绑 D、答复回执与当前 snapshot）被入口接受；缺回执的增补被拒绝；合法增补不被误阻断；build-plan 对同一冻结版本重校验且 spec revision 与 decision revision 配对。
失败：头部 pending 与正文 accepted 并存仍放行；绑定非当前材料仍开始规格化；有方向级未决仍翻译中做决策；以历史未确认的 step 11 存档记录冒充 accepted 三方一致而放行；增量续签被要求全量重确认而阻断；或校验被实现为公共 gate 或写入阻断。
证据：冻结校验结果事实、暂停与回退记录、续签链双向夹具执行记录。
  - **收口合同**：producer=对应阶段主会话；consumer=阶段汇报与下一阶段入口；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=三方一致、三方不一致、非当前绑定、方向级未决与增量增补样本；oracle=通过或暂停回退判定与原因；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=校验事实 current 且不成为推进门
  - **证据类型**：`test`

- [ ] **AC-LOOP-002**：每条 finding 被互斥分类并强制路由，缺依据、命中方向维度或无法互斥不得以 fixed 完成，路由错误阻断正式完成但不阻断修复。
  - **来源/决策**：R-011；D-502、T-027、T-031。
  - **需求**：FR-LOOP-002。
  - **可观察场景**：SCN-014、SCN-008；对四类分类、缺依据样本与增量决策闭包继续分别观察。
验证：对 direction_change、spec_ambiguity、implementation_defect、invalid_finding 与缺依据、无法互斥样本逐条执行分类与 disposition 路由校验，检查影响维度清单、证据引用、用户答复绑定与增量决策记录。
通过：分类互斥且按优先级判定；每条附影响维度与证据引用；spec_ambiguity 有用户答复绑定、direction_change 有增量决策记录才允许对应处置；缺依据、命中方向维度或无法互斥的 finding 不得以 fixed 完成，落入问用户或独立复核；路由错误记录并阻断正式完成，同任务修复仍可推进；增量决策后只从受影响闭包继续并留一次绑定该 D 的 focused review 证据，不重跑不重写已确认部分。
失败：方向级标 fixed 继续；规格歧义无答复绑定放行；缺依据判 fixed；environment_unavailable 被当 finding 分类；路由错误阻断修复推进；或采用关键词判型。
证据：分类记录、路由校验结果、增量决策与闭包复核事实。
  - **收口合同**：producer=对应阶段主会话；consumer=阶段完成条件校验与阶段汇报；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=四类分类、缺依据、无法互斥与增量决策样本；oracle=路由匹配判定与原因；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=路由事实 current 且只约束正式完成
  - **证据类型**：`test`

- [ ] **AC-LOOP-003**：needs_human 只能作为附 next_action 的暂停态，完成出口限四白名单，attempt 可用性与 finding 处置两层事实分离。
  - **来源/决策**：R-011；D-503、T-028。
  - **需求**：FR-LOOP-003。
  - **可观察场景**：SCN-015、SCN-005；构造无 next_action、当正式完成、无回执 accepted_risk、答复转 user_decided 与 provider 不可用五类样本。
验证：检查 disposition 校验、completion 判定、next_action 绑定、accepted_risk 授权回执、user_decided 的 finding_id/card_hash/reply_ref 绑定，以及 attempt 层状态与 finding 处置的分离。
通过：无 next_action 或当正式完成的 needs_human 被拒绝且 completion 保持 incomplete；完成出口只限 fixed、rejected_invalid、user_decided、accepted_risk；accepted_risk 绑用户授权回执与风险记录；user_decided 绑 finding_id、card_hash、reply_ref；attempt 层 unavailable 如实记录、不算 pass、不产生 needs_human finding、不进 disposition 白名单。
失败：needs_human 无绑定回复仍判完成；accepted_risk 无回执放行；attempt unavailable 被改写为空 findings 或通过；或新增状态机或持久对象承载暂停态。
证据：暂停事实、出口绑定事实与两层分离观察记录。
  - **收口合同**：producer=对应阶段主会话；consumer=阶段完成条件校验与阶段汇报；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=暂停态、四出口、无回执与 attempt 不可用样本；oracle=出口白名单判定与原因；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=处置事实 current 且暂停态不冒充完成
  - **证据类型**：`test`

- [ ] **AC-LOOP-004**：review 轮次按同一材料同一冻结 revision 守预算（一次初始加变化后一次 focused），耗尽走窄域核销或问用户或 accepted_risk，provider 空桩不算 pass。
  - **来源/决策**：R-011；D-504、T-029、T-033。
  - **需求**：FR-LOOP-004。
  - **可观察场景**：SCN-016；重复初始、无变化重审、增量续签新 focused、残留修复与窄域核销、provider 空桩六类样本。
验证：在同冻结 revision 上检查预算计数、focused 范围、增量续签配额、窄域 diff 核销与 attempt 层记录。
通过：同冻结 revision 重复初始 review 被预算拒绝；无变化禁重审被执行；build-code 每 phase 审查为独立目标不计入 spec/plan 预算；每次增量续签产生新 focused 配额；残留缺陷实现级再修一次加窄域 diff 核销一次后放行；仍不收敛或方向级转问用户或 accepted_risk（带授权回执）；provider 失败、空桩、超时记 attempt 层 unavailable 不算 pass；空 findings 有可信 provenance；每个状态都有确定出口，无死锁。
失败：同 revision 无变化重审放行；核销不限定窄域 diff；耗尽无出口造成死锁；空桩改空 findings；或 phase 审查被错误计入 spec/plan 预算。
证据：预算计数事实、核销记录与 attempt 层不可用记录。
  - **收口合同**：producer=对应阶段主会话；consumer=阶段审查纪律与阶段汇报；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=预算正反、核销与空桩样本；oracle=预算计数与出口判定；证据路径=quality/reviews/results/<name>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=预算事实 current 且出口可达
  - **证据类型**：`test`

- [ ] **AC-LOOP-005**：review attempt 有 usage 落盘或 unavailable 标注，字符级代理指标可回答主会话、子代理与材料包去向，无下降证据如实写未证明下降。
  - **来源/决策**：R-011；D-505、T-030、T-035。
  - **需求**：FR-LOOP-005。
  - **可观察场景**：SCN-016、SCN-011；completed 带 usage、usage 缺失、三类代理指标采集与汇报口径。
验证：检查 completed 调用 usage 落盘、usage 缺失标 unavailable、主会话重读轮次、子代理输入字节与材料包字节三类代理指标的采集与汇报。
通过：provider 返回 usage 时落盘到 attempt 事实（input/output/cached tokens、duration、失败原因）；缺失标 unavailable 且不伪造零值；三项字符级代理指标随阶段 outcome 记录；无下降证据时结论写未证明下降；不做 token 预算或计费。
失败：usage 缺失被写成零消耗；观测被包装成 token 预算或计费；代理指标缺失仍宣称下降达标；或观测依赖新增持久 store。
证据：attempt usage 事实、代理指标记录与阶段汇报口径。
  - **收口合同**：producer=对应阶段主会话；consumer=阶段汇报与成本回顾；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=usage 正反与代理指标样本；oracle=落盘或 unavailable 判定；证据路径=quality/reviews/results/<name>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=观测事实 current 且口径如实
  - **证据类型**：`evidence`

- [ ] **AC-LOOP-006**：五阶段共用统一回退路由，runtime 校验该回退的没回退，协议不新增公共 gate、入口或阶段。
  - **来源/决策**：R-011；D-506、T-030、T-031。
  - **需求**：FR-LOOP-006。
  - **可观察场景**：SCN-014、SCN-015；实现级、规格歧义、方向级、材料 gap、环境不可用五类 finding 的路由行为。
验证：构造五类 finding，检查各阶段路由行为、完成条件校验、SKILL 统一引用与重跑防护。
通过：实现级当前阶段自修；规格歧义回 build-spec 或 spec-clarify 问一次；方向级回 make-decision 增量决策；材料 gap 回对应 owner 阶段；环境不可用 attempt 层如实记录；该回退的没回退时完成条件不满足；各阶段 SKILL 不再各写一套回退条文，统一引用协议；回退不演变为整阶段重跑；不新增阶段、公开入口或门。
失败：方向级在 build-spec 内自修；规格歧义被当实现级吞掉；回退演变为整阶段重跑；路由校验阻断修复推进；或协议以新公共入口承载。
证据：路由事实、完成条件校验记录与 SKILL 引用核对。
  - **收口合同**：producer=对应阶段主会话；consumer=五阶段阶段完成条件校验；owner=对应阶段主会话；命令=unavailable(reason=deferred_to_build_plan; replacement=build-plan/tasks)；fixture=五类回退路由样本；oracle=路由匹配判定；证据路径=quality/evidence/<stage>/<sha256>.json；freshness=绑定当前 task/material_revision/snapshot_tree；close 条件=路由事实 current 且只约束正式完成
  - **证据类型**：`test`

## 12. 风险、未决与交接

- **编号对齐说明（crosswalk）**：本表风险与延期编号按已批准 decision-log「风险与延期交接」表恢复：外部 review/证据不可复核风险=approved RISK-001（修订前 draft 误标为 RISK-008）；usage 记录风险=approved RISK-008（修订前 draft 误标为 RISK-010）；RISK-010 编号作废不再使用；DEFERRED-009 已补回（见下）。本规格后续新增条目只使用 approved 表未占用的新编号，并同步给出 supersedes/crosswalk（DEFERRED-010 为此类新增，见其条目说明）。

- **RISK-001**：证据不可复核或外部 review/独立审查通道不可用，影响完成判定（decision-log 已批准语义：make-decision 与历史任务同样可能遇到；本任务 detail 阶段已发生 2 provider 身份未绑定并如实记录）。
  - **受影响 ID**：PFACT-012、FR-REVIEW-001～002、FR-BOUND-002、AC-REVIEW-001～002、AC-BOUND-002。
  - **触发条件**：detail/direction review 或独立审查 provider 不可用、身份配置或冻结 packet 不可用。
  - **后果**：操作者没有独立审查语义结果，但仍需继续看见真实质量缺口和下一步；完成判定不得凭伪造证据。
  - **缓解或 STOP**：本 stage 如实记录 unavailable，不伪造（detail 已发生 2 provider 身份未绑定，已如实记录）；failed 按既有通道最多重试一次；不得改写为 pass；只有结构协议错误才停止该次写入。
  - **处理 Stage**：build-plan / build-code / verify-code（决策-log 归属=本 stage 如实记录 unavailable；spec 侧映射为三态与非阻断观察）。
验证：AC-REVIEW-001、AC-BOUND-002 的三态和非阻断观察。

- **RISK-002**：I 与 II 的范围横跨收口投影、材料、verify 和上下文组织，phase 过细或边界不清会造成新交接损耗。
  - **受影响 ID**：FR-FLOW-001～003、FR-CONTEXT-001～003、AC-FLOW-001～003、AC-CONTEXT-001～003。
  - **触发条件**：phase 同时改变多个语义维度，或下一 phase 依赖未冻结材料。
  - **后果**：问题难以归因，主会话重新全量读取，后续执行者补方向。
  - **缓解或 STOP**：build-plan 以一个 phase 一个语义维度锁定边界；每 phase 独立验收和交接；发现方向变化时返回 make-decision，不在 build-spec 偷补。
  - **处理 Stage**：build-plan。
验证：AC-FLOW-001、AC-FLOW-002、AC-FLOW-003、AC-CONTEXT-001 的 phase 和交接事实。

- **RISK-003**：本任务 dogfood 可能因为自身顺利运行而无法暴露重复缺口或材料缺陷，形成自证。
  - **受影响 ID**：FR-GAP-001～002、FR-STATUS-001、FR-MATERIAL-001～003、AC-GAP-001～002、AC-STATUS-001、AC-MATERIAL-001～003。
  - **触发条件**：只观察本任务正向结果，不运行可证伪的负向边界。
  - **后果**：假绿、重复投影、旧确认误消费或坏材料仍被宣称合格。
  - **缓解或 STOP**：以协议错配、旧收据、unknown/unavailable、空 findings 无 provenance、确认消缺、六状态独立变化、四项材料检查和负向 oracle 为主；dogfood 仅按 AC-DIAG-003 的阶段、样本、独立观察者、窗口、判定五要素补充观察，缺失任一要素时不消费为验收证据。
  - **处理 Stage**：build-plan / build-code / verify-code。
验证：对应 AC 的正反场景均须留下产品级事实；任何负例未失败都视为仍有风险。

- **RISK-004**：模板和检查器对齐可能使存量材料出现合规波动。
  - **受影响 ID**：PFACT-005、FR-MATERIAL-001～002、AC-MATERIAL-001～002。
  - **触发条件**：旧材料仍使用旧标签或没有四段式。
  - **后果**：历史材料被误判为新契约，或本任务新 spec 自身无法被消费。
  - **缓解或 STOP**：新生成材料采用统一口径；历史材料只读不回溯迁移；本任务先验证新材料可直接检查，再决定兼容提示。
  - **处理 Stage**：build-spec / build-plan。
验证：AC-MATERIAL-001、AC-MATERIAL-002；检查新旧材料边界没有历史改写。

- **RISK-005**：异源独立审查频繁 unavailable，可能让用户误以为 verify 没有质量价值。
  - **受影响 ID**：PFACT-012、FR-REVIEW-001、FR-REPORT-001、AC-REVIEW-001、AC-REPORT-001。
  - **触发条件**：provider 成功率低或异源身份未绑定。
  - **后果**：独立审查事实稀缺，阶段汇报不完整。
  - **缓解或 STOP**：把 executed、failed、unavailable 和原因分开显示；不把 unavailable 变成 pass，也不把它设为阻断；配置修复作为实施前置环境动作交 build-plan。
  - **处理 Stage**：build-plan / verify-code。
验证：AC-REVIEW-001 的三态观察和 OPEN-004 关闭事实。

- **RISK-006**：Execution model 移植涉及多个阶段输入和汇报面，错误的摘要或派发边界会丢失关键语义。
  - **受影响 ID**：PFACT-006、FR-CONTEXT-001～003、AC-CONTEXT-001～003。
  - **触发条件**：摘要超过约束、finding 被压扁、主会话只保留摘要却没有引用，或 packet 分层隐藏关键行为。
  - **后果**：上下文变小但验收质量下降，或审查者漏读关键材料。
  - **缓解或 STOP**：全量材料落盘；主会话保留引用、hash 和摘要；复核 finding 一条一行；关键行为、接口、consumer、测试和 oracle 不得被摘要删除；效果不足时加强既有审查说明材料的引导，而不宣称已达标。
  - **处理 Stage**：build-spec / build-plan。
验证：AC-CONTEXT-001～003 与 PFACT-011 的观察结果。

- **RISK-007**：III 路由校验与“记录事实不阻断”原则存在张力，路由错误若被误用为修复阻断会违宪。
  - **受影响 ID**：PFACT-013、FR-LOOP-002、FR-LOOP-006、AC-LOOP-002、AC-LOOP-006。
  - **触发条件**：路由校验被实现为写入拒绝或推进阻断，而不是完成条件检查。
  - **后果**：同任务修复被卡死，重演“记录事实不阻断”违例。
  - **缓解或 STOP**：校验只约束阶段正式完成声明（汇总 dispositions 之后、写入 completion 之前）；路由错误=完成条件不满足，不禁止修复推进；负向夹具覆盖“阻断修复”误实现。
  - **处理 Stage**：build-spec / build-plan / build-code。
验证：AC-LOOP-002、AC-LOOP-006 的路由校验只阻断正式完成、不阻断修复。

- **RISK-009**：增量决策续签链与冻结校验交互复杂，实现错误会误放行或误阻断。
  - **受影响 ID**：FR-LOOP-001、FR-LOOP-002、AC-LOOP-001。
  - **触发条件**：续签链缺用户答复回执仍 accepted，或合法增量增补被入口校验拒绝。
  - **后果**：未确认方向进入规格化，或增量决策后再次被误阻断。
  - **缓解或 STOP**：负向夹具双向覆盖（缺回执的误放行拒绝、合法增补的误阻断拒绝）；续签绑 D、用户答复回执 ref/hash 与当前 snapshot；基线确认加增量增补链，不对历史 step 11 全量重确认。
  - **处理 Stage**：build-spec / build-code。
验证：AC-LOOP-001 的续签链双向夹具。

- **RISK-008**：usage 轻量落盘依赖 provider 返回 usage，缺失时“浪费在哪”/“review 调用消耗”不可答（decision-log 已批准语义：usage 轻量落盘依赖 provider 返回 usage，方向卡 v4.3；owner=build-spec）。
  - **受影响 ID**：FR-LOOP-005、AC-LOOP-005、PFACT-016。
  - **触发条件**：provider completed 但 usage 全 null 或字段缺失。
  - **后果**：成本观测部分缺失，易被误写成零消耗；浪费去向部分不可答。
  - **缓解或 STOP**：缺失标 unavailable 并保留字符级代理指标层；不承诺完整、不伪造零值（III-5/T-030）。
  - **处理 Stage**：build-code / verify-code。
验证：AC-LOOP-005 的 unavailable 标注夹具。

### 交接给 build-plan 的延期项

- **DEFERRED-001（build-spec 兼容性核查，状态=待验证，未定案）**：预检载体形态候选为 stage-end spec-analyze lens 复用与新只读收口预检 profile（decision-log 已批准语义：需在 build-spec 验证与现有只读分析通道兼容性；不兼容则按控制面登记规则=唯一 consumer/owner/删除条件登记）。现有分析性判断：stage-end spec-analyze 在阶段末产出语义/证据报告；收口预检在 build-plan 末端只读输出 ready/unknown/unavailable——二者触发点和输出语义不同，不能直接复用同一 lens；但该判断尚未形成可提交的兼容性核查证据，本规格不宣布“已定案”，也未选择 profile。owner=build-spec（验证）/build-plan（实施排程）；consumer=status/close 的只读收口展示；替代关系=替代“每阶段重跑预检”和“复用 stage-end lens”的候选；删除条件=该 profile 被经审查的既有只读收口能力完全替代。在验证完成前，build-plan 不得假定该 profile 已存在：AC-PREF-001/002 的 producer 字段相应表述为“build-plan（载体形态待验证，见 DEFERRED-001/OPEN-005）”；预检按既有只读分析通道可执行语义输出三态，或如实 unavailable。该未定案不新增 public 入口、store、selector、gate 或第五材料；未决证据登记见 OPEN-005。
- **DEFERRED-002**：phase 的精确边界、每 phase 交付物、切换条件和独立验收节奏；由 build-plan 锁定，不改变本规格的先质量后效率顺序。
- **DEFERRED-003**：真实任务 replay 验证；另立后续任务，不在本任务伪造外部执行证据。
- **DEFERRED-004**：实现级端到端流程、夹具与 oracle 细节、九字段的实现级 schema；build-plan 在冻结 tasks 前必须把本规格中的 deferred 合同字段替换为具体命令、fixture、证据路径和可判定 oracle，或保留 unavailable 并写明真实原因；II 部分七项负向夹具映射必须单列模板标签、reject 结构、verify 材料、独立审查、执行模型、材料导航生成/刷新、审查包分层；保留 unavailable 的 AC 只能得到 preflight=unavailable 和 acceptance=incomplete，不能被标 ready 或 accepted；这不改变既有 close 语义，用户明确授权时仍可保留缺口事实进行 close，physical_close_status 仍由物理读回决定；这不是新增推进 gate，而是材料完整性验收。
- **DEFERRED-006**：build-code/verify-code 的完整上下文机制和导航统一移植；本期先验证 build-spec/build-plan，后续任务再评估。
- **DEFERRED-008**：simplicity-guard 与 plan-eng-review 的 provider packet lens 路径和 build-plan 直接调用位置的对齐；实施期核实，不改变 file-only 冻结链。
- **DEFERRED-009**：非配对行为任务的 reject 语义扩展（当前仅表达位不强制，是否对纯正向任务豁免）；需真实任务使用后评估；dogfood 后评估，owner=用户（方向卡 v4.3；decision-log「风险与延期交接」表 DEFERRED-009）。受影响：FR-MATERIAL-002、AC-MATERIAL-002。
- **DEFERRED-010**：III 机制（冻结校验器、续签链存储形态、disposition 路由校验、预算计数、usage 消费方）的实现级 schema、代码落点与测试夹具；本规格已锁定产品语义（FR-LOOP-001～006、第 8 节阶段治理闭环状态契约、失败分支表），实现细节由 build-plan 转译、build-code 实施。（本条为 spec 侧新增编号，不在 approved_decision 延期表中：按“新增条目必须使用新 ID 并给 supersedes/crosswalk”规则登记，supersedes=none；它承接 D-501～D-506 的实现级转译边界，与 DEFERRED-004 的转译语义并列，不作为新方向。）

已消除的 DEFERRED-005（导航载体）已由材料内嵌导航节定稿，已消除的 DEFERRED-007（审查瘦身实验）不再作为延期；它们不构成当前开放问题。

### OPEN-004：异源审查身份配置的实施前置事实（非方向问题）

- **受影响 ID**：PFACT-012、FR-REVIEW-001、AC-REVIEW-001。
- **owner**：用户授权的配置维护者与 build-plan 负责人。
- **影响**：若异源身份仍未绑定，verify 会如实记录 unavailable 或 failed，不能形成 executed 独立审查事实，但不改变已接受的 verify 独立性方向。
- **处理 Stage**：build-plan 在实施前完成环境配置确认；verify-code 消费确认后的事实。
- **触发条件**：进入 verify 独立审查实施且当前配置仍无法证明执行者身份不同。
- **handoff**：把配置身份修复和一次可观察的三态结果交给 verify-code；不得把配置问题写成材料质量通过。
- **关闭条件或 STOP**：有当前身份绑定事实并能记录 executed、failed 或 unavailable 及原因；若无法授权或配置不可用，则保持 OPEN-004 的事实状态并继续非依赖部分，不改变方向。

### OPEN-005：DEFERRED-001 兼容性核查证据（spec 侧未决证据清单，非方向问题）

- **受影响 ID**：FR-PREF-001～002、AC-PREF-001～002。
- **owner**：build-spec（验证）；build-plan 在验证完成前不得假定 profile 已存在。
- **影响**：AC-PREF-001/002 的 producer 载体形态（stage-end spec-analyze lens 复用 vs 新只读收口预检 profile）未定案；未验证前，预检按既有只读分析通道的可执行语义输出 ready/unknown/unavailable，无法满足时如实 unavailable，不新增选择、不宣布已定案。
- **处理 Stage**：build-spec 验证（交接 build-plan 前完成，或如实记录 unavailable 并保持 open）。
- **触发条件**：build-spec 产生“兼容性核查证据”声明之前。
- **handoff**：把两类候选的触发点、输出口径与失败语义对照证据（或如实 unavailable 说明）交给 build-plan；不得只交“已定案”结论。
- **关闭条件或 STOP**：对照证据落盘并绑定 AC-PREF-001/002 证据项；若验证不可得，保持 OPEN-005 open，载体形态表述保持待验证，不改变方向。

### 规格澄清记录（非权威说明）

- **spec-clarify trigger=false reason=decision-log v4.3 第二轮（R-011）已冻结 I/II/III 全部方向语义，phase 验收已由 D-507 增量选择明确，本规格只做受影响闭包转译及 D-205/D-304 授权的确定性合同细化；open_direction_changing_questions=0**。
- **第三轮澄清事实**：方向审查 v5 后，用户确认四项裁决——①oracle.reject 仅对 verification_role=RED 且 paired_task≠N/A 的配对任务强制，GREEN 仅要求配对关联与 oracle.pass 非空（T-032，修正 D-302 旧语义）②review 预算耗尽走实现级再修一次加窄域 diff 核销一次，仍不收敛转问用户或 accepted_risk（T-033）③审查包维持全量 file_only 冻结链，字节不减、零新文件，“审查包 token 下降”为非承诺项（T-034）④观测扩展为主会话重读轮次、子代理输入字节、材料包字节的字符级代理指标，不做 token 预算或计费（T-035）。第二轮确认回执 quality/confirmations/f1e2823181f9c7d39419466c19456757f2f90d06d4fbb33ad5896ae5509a0dc3.json。
- **历史澄清事实（仅佐证）**：第一轮独立审查后，用户在结构化交互卡中确认八项内容；其中 phase 验收的当前权威方向已由 D-507 及其本次增量批准承接，下面旧回执不证明 D-507 或当前快照已获批准：阶段验收只记录事实和恢复建议、close 不固定 pre/post 两段而只保留授权后物理读回、FR/AC 编号作为跨材料稳定主键、build-plan 逐条列出行为 AC 的验证或 unavailable 原因、材料检查/审查失败/provider 不可用进入统一 gap 展示、上下文基线成为正式观察输入、verify 材料检查采用四项且内容完整性带子项、审查身份不合法时发起前校验且不发送审查。用户确认 receipt=`quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json`。
- **第二轮澄清事实**：复审后，用户确认 gap-bound 消缺复用现有人工确认边界：status/close 生成当前 gap 的确认内容，用户确认后写入既有 confirmation，并附带 canonical gap payload 与当前 task/material/snapshot/gap_id 绑定；不新增公共入口。用户确认 receipt=`quality/confirmations/3780154af915c3a476076c917cfa29527a4e2990fb75c5a3e99fd3e5b7e9cba2.json`。
- **交互凭证边界**：当前宿主没有提供已登记 transcript binding，因此 canonical interaction receipt 不可用，本规格不伪造 ask/reply 生命周期；两次真实用户答复均以 human-confirmation receipt 记录。
- **说明**：本记录说明当前无未决澄清问题，不替代来源映射、风险、延期或 build-plan 交接；若后续用户改变这些已确认方向，必须回到 make-decision。

## 13. 业务影响与回归范围

### 收口准备、状态与 close 展示

- **既有行为**：预检、缺口、确认、质量、发布和 physical close 事实可能在不同投影中重复或含义不清；close 仍遵循既有三义。
- **本需求影响**：新增九字段合同和三态只读预检；当前快照内同一缺口只显示一次；匹配 confirmation 消缺；六状态分别显示；close 记录如实抄写质量和发布状态但不裁判。
- **回归路径**：从 build-spec 的 AC 合同到 build-plan 预检，再到 build-code/verify 的缺口、确认、六状态和 close 前只读复核；覆盖正常、空、失败、stale、取消和权限路径。
- **验收**：AC-PREF-001、AC-PREF-002、AC-GAP-001、AC-GAP-002、AC-STATUS-001、AC-BOUND-001、AC-BOUND-002。

### 材料质量与 verify 独立事实

- **既有行为**：AC 的标签、通过/失败/证据段和 oracle 口径不统一；verify 可能只有自查或留下零 digest/unknown 的材料事实；独立审查缺少稳定三态。
- **本需求影响**：新 AC 统一四段且非空；行为验证有结构化 pass/reject；verify 只读检查四项材料事实；异源审查记录 executed、failed、unavailable 和原因，不设质量 gate。
- **回归路径**：新 spec 的正常 AC、缺失败段、RED 配对缺 reject（GREEN 配对不强制）、非行为验证、材料缺失/旧绑定/占位符/零 digest、独立审查成功/失败/不可用/成员取消（原始 cancelled 仅保留在成员级，聚合独立审查事实按 D-303 映射 failed 或 unavailable，不作第 4 聚合态）；检查历史材料只读不变。
- **验收**：AC-MATERIAL-001、AC-MATERIAL-002、AC-MATERIAL-003、AC-REVIEW-001、AC-REVIEW-002、AC-REPORT-001。

### build-spec/build-plan 上下文与审查 packet

- **既有行为**：主会话经常全量重读四份材料；阶段内 findings、研究和终检主要由主会话处理；审查者消费冻结 packet，但包内导航和摘要层次不足。
- **本需求影响**：执行模型明确 M/S/B/P 职责和上下文守恒；适用的新生成/可写材料头部有可再生导航，历史 decision-log 保持只读豁免；输入通过冻结 packet 按需读取；finding 处置、终检和研究可派发；审查说明先引导导航/摘要再按需读详情，file-only 冻结链和 task directory 隔离保持。
- **回归路径**：起草导航、定稿更新、按主题读取、结构化摘要回传、并行上限、交互独占、审查 packet 分层、关键材料完整性和成本观察；无下降证据时检查是否如实报告。
- **验收**：AC-CONTEXT-001、AC-CONTEXT-002、AC-CONTEXT-003。

### 阶段治理闭环（III）

- **既有行为**：阶段入口无冻结校验，上游决策状态不唯一时 build-spec 在翻译中做决策；findings 由主会话自由处置，needs_human 可当终态；review 无预算导致多轮不收敛；usage 有字段无消费方，浪费去向不可答。
- **本需求影响**：build-spec/build-plan 入口做决策冻结校验（三方一致、绑当前材料、无方向级未决），不满足暂停回 make-decision；增量决策走续签链并只从受影响闭包继续；findings 互斥分类强制路由，路由错误阻断正式完成不阻断修复；needs_human 只能暂停并附 next_action，完成出口限 fixed、rejected_invalid、user_decided、accepted_risk；review 按冻结 revision 计一次初始加一次 focused，耗尽走窄域核销或问用户或 accepted_risk；usage 与字符级代理指标如实落盘或标 unavailable。
- **回归路径**：冻结校验正反夹具、续签链双向夹具、四类 finding 分类路由、needs_human 暂停与四个出口、预算计数与窄域核销、provider 空桩与 usage 缺失；覆盖正常、路由错误、预算耗尽、暂停待答与 attempt 不可用路径。
- **验收**：AC-LOOP-001、AC-LOOP-002、AC-LOOP-003、AC-LOOP-004、AC-LOOP-005、AC-LOOP-006。

- **可能受冲击的业务规则**：五阶段顺序；四份当前材料唯一真相；close 三义；人类授权不可逆动作；质量事实不作推进许可证；独立审查与自查分离；历史事实只读；协议错配拒绝与证据缺失非阻断；不新增公共入口、store、持久 selector、gate、第五材料或第二状态机。
- **明确无影响**：本任务不新增页面或前端路由；不改变 make-decision 已接受的执行模型；不改变既有 close 三义；不修改历史任务；不引入 token 度量、模型阶段绑定或审查瘦身实验；不改变 file-only 冻结投递边界；III 冻结校验、路由校验与回退校验只做完成条件检查，不新增公共 gate、入口、store、第五材料或第二状态机。

> 当前继续 build-spec：GAP/packet 固定向量与自检证据已落盘并独立核对；DEFERRED-001 兼容性核查等受影响 findings 证据保持 incomplete/待验证（见 §12 OPEN-005），未完成项不被宣布完成；本次修订不是进入 build-plan 的许可。后续获准交接时，build-plan 只把已锁定产品行为转译为 phase、消费边界、夹具和验收安排；若发现方向变化，停止该部分并返回 make-decision，不在 plan 或 tasks 中创造新的产品需求。

## 增量规格 R-012：verify-code 自动收口代码审查（2026-09-07）

### 功能要求

- verify-code 的正式完成谓词只要求当前绑定且可验证的 `code_review` 与 `stage_outcome`；不再要求 `human_confirmation`。
- 步骤 10 使用 `finalize-code-review` 自动记录当前审查结果，步骤 11 继续发布 verification result；不新增 public command、store 或独立状态机。
- review 必须继续绑定当前 task、stage、material revision、snapshot、`dsh-code-review` 及质量 review ref/hash。缺失、过期、错绑、`unavailable` 或未修复 actionable serious finding 均保持 `incomplete`，不得自动变成 pass。
- product release 不再把 `verify_confirmation` 作为硬条件；仍要求五阶段当前 completion、当前 acceptance facts、无冲突及完整绑定证据。
- close-plan 的人工确认、不可逆操作授权、`accepted_risk` 处置和 `manual-risk-close` 的 `delivered_with_risk`/`not_released` 边界不变。

### 失败边界

| 情况 | 结果 | 可继续修复 |
|---|---|---|
| 当前 review 完整且绑定 | verify 可完成 | 是 |
| 无 review 或 review unavailable | incomplete | 是 |
| 旧 revision 或错绑 evidence | fail-closed | 是 |
| serious finding 未处置 | incomplete | 是 |
| close 未授权 | 不可物理 close | 是 |

### 验证场景（不新增正式 AC）

- 场景 1：没有 verify-code confirmation 时，当前 code review 完整且绑定正确即可完成 verify-code 并进入 close preparation。
- 场景 2：没有 verify-code confirmation 时，product release 不再生成 `verify_confirmation_missing`。
- 场景 3：缺 review、review unavailable、旧 snapshot、错 material、未修复 serious finding 仍 fail-closed。
- 场景 4：close-plan 仍要求 plan-bound confirmation；风险接受仍要求 finding、risk record 和 authorization receipt。
