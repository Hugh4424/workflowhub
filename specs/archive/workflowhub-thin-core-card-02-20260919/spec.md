# 功能规格：WorkflowHub SDD 文档权威与薄核心重构

content_profile: `spec-content.v3`

> 基于当前 `decision-log.md` 的已接受方向。本文件定义产品行为、边界与验收；未来文档模板结构是本卡交付物，不替代本文件当前必须遵守的规格合同。

- **功能名**：SDD 文档权威、可执行规格与合并规划链
- **来源**：`decision-log.md` 的 U-001、U-002、D-001..D-014、T-059、T-083 与收口清单
- **状态**：草稿（build-spec 当前修订目标）

## 速读卡（30 秒）

- **一句话需求**：让强模型把已确认需求写成精炼、可追溯、无双重权威且能由 luna 级模型可靠执行的规格与 phase，同时删掉重复控制面和伪证明。
- **核心改动点**：重做 decision-log/spec/phase/索引模板；把验收、测试、审查、覆盖与失败语义写成单一权威；把现有 build-spec/build-plan 质量核心合并进未来 13 步规划链；修复覆盖检查并删除 interaction aggregate 依赖。
- **最大影响面**：四材料作者阶段、文档模板、规划审查、需求覆盖检查、阶段交互事实与后续 build-code 执行边界。
- **验收信号**：四类模板可核对；已知需求均有稳定映射；验收可判真；弱模型不需猜产品选择；重复事实与缺失事实被真实报告；不新增 stage、public command、持久对象或第五份材料。

## 材料导航

> 可再生成、非权威。M=make-decision，S=build-spec，B=build-plan，P=后续阶段。

| 章节 | 摘要 | 主要读者 | 读取时机 |
| --- | --- | --- | --- |
| 速读卡 | 目标、影响和验收信号 | 全部 | M/S/B/P |
| 来源与决策映射 | Source→Decision→FR/AC | 规格与审查 | S/B |
| 1–3 | 问题、范围、场景和八态 | 产品与规划 | S/B |
| 4–5 | 产品事实与功能需求 | 规格与实现 | S/B/P |
| 6–9 | 产品职责、实体、生命周期、兼容边界 | 规划与实现 | B/P |
| 10 | 唯一非目标与默认约束 | 全部 | M/S/B/P |
| 11 | 验收标准唯一规格入口 | 测试与审查 | S/B/P |
| 12 | 风险、未决、延期交接 | owner 与下游 | S/B/P |
| 13 | 业务影响与回归范围 | 规划与验证 | B/P |

spec-research: skipped — 已有 18 份专项报告、316 个已知需求单元清点、两次独立审查和根因报告；当前缺口均是已确认边界、实施细化或已登记延期，不缺新的外部事实。

spec-clarify trigger=false reason=当前不存在会改变范围、验收、接口、数据、安全或运行语义的未决产品选择；大材料审查必须完整送达或诚实_unavailable，真实多_phase_抽验延期_CARD-10，跨卡归属均已由_D-014_与承接清单确定 open_direction_changing_questions=0

UI 设计路径: not_applicable — `decision-log.md` 的 UI applicability 为 `non_ui`；本卡不改页面，不运行 UI 初始化、设计源读取、原型渲染或设计审查。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | 状态与影响面 | 交接 |
| --- | --- | --- | --- | --- |
| R-001（母 PRD CARD-02）、R-002（U-001/U-002） | D-001、D-002、D-004、D-011 | FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-DOC-005、FR-OI-001 / AC-DOC-001、AC-DOC-002、AC-DOC-003、AC-DOC-004、AC-DOC-005、AC-OI-001 | current；文档、索引、OI 生命周期 | 本卡交付 |
| R-003（T-006/T-032/T-041/T-055） | D-003、D-005、D-006 | FR-TEST-001、FR-TEST-002、FR-TEST-003、FR-TEST-004 / AC-TEST-001、AC-TEST-002、AC-TEST-003、AC-TEST-004 | current；验收与测试作者边界 | 真实抽验交 CARD-10 |
| R-004（T-039/T-042/T-075） | D-007 | FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003 / AC-REVIEW-001、AC-REVIEW-002、AC-REVIEW-003 | current；合并审查、状态与能力度量 | 工具实测留 CARD-05 |
| R-005（T-040/T-074/T-076） | D-008 | FR-AUTH-001、FR-AUTH-002 / AC-AUTH-001、AC-AUTH-002 | current；无重复与变更传播 | 只对已知事实清单下结论 |
| R-006（T-036/T-043/T-059/T-061） | D-009 | FR-FLOW-001、FR-FLOW-002、FR-FLOW-003 / AC-FLOW-001、AC-FLOW-002、AC-FLOW-003 | current；K1–K12、13 步、单写 | 本卡交付 |
| R-007（T-029/T-031/T-046） | D-010 | FR-COVER-001、FR-COVER-002 / AC-COVER-001、AC-COVER-002 | current；覆盖和格式兼容 | build-code 实现 |
| T-083 | D-001、D-008、D-013 | FR-CLEAN-001 / AC-CLEAN-001 | current；删除 aggregate 依赖 | 精确删除面，本卡交付 |
| T-045、T-070、T-077 | D-012、D-014 | FR-HANDOFF-001 / AC-HANDOFF-001 | deferred/current；跨卡交接 | CARD-03/05/07/10 |

## 1. 问题与紧迫性

现有四材料足够驱动一般开发，但长期暴露出同一组可复现问题：文档过长且过程与结论混写，关键约束被简写而低价值细节被展开；验收缺少可失败 oracle；测试流程和作者边界不清；同一事实会在多份材料重复声明；审查、覆盖与回执机制把质量事实变成推进前置；高智力模型完成方向和规划后，luna 级实现模型仍需猜范围、失败条件和文件边界。

当前任务必须现在处理这些问题，因为后续 CARD-03/04/05/07/10 都消费这里定义的材料与流程接口。继续沿用旧形态会把缺口复制到后续卡；提前启用尚未实现的新拓扑又会制造 bootstrap 假完成。因此本卡必须先用现有 build-spec/build-plan 完成自身规格与规划，再由 build-code 落地新结构。

## 2. 背景、目标与范围

### 背景

WorkflowHub 当前以 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四份材料承载当前工作真相。用户已明确模型分工：强模型负责 make-decision 与 build-plan，luna 级模型负责 build-code 与 verify-code。产品需要把判断力前置为稳定契约、预写测试与可判真验收，而不是靠执行阶段增加“务必全面”等能力补偿型提示。

### 目标

- 让每项已确认需求有唯一权威位置、稳定来源指针、明确行为和可失败验收。
- 让 decision-log、spec、phase 与紧凑索引各负其责，正文精炼但不掩盖未知、偏离、失败或延期。
- 让强方预写规格与测试边界，弱方只在冻结边界内实现，不得静默放宽测试。
- 保留 K1–K12 的质量语义，把原 build-spec/build-plan 机制合并为净新增 0 的未来 13 步规划链。
- 删除 interaction aggregate 及其内容寻址回执依赖，质量缺失真实可见但不阻断同 task 修复。

### 范围内

- 四份模板能力：decision-log、spec、phase、纯指针紧凑索引。
- 无重复契约检查、覆盖校验器接线与逐条粒度、decision-log 字段识别兼容。
- 最小双 phase 模板 smoke fixture、有效 RED、预写测试与禁改边界。
- 合并规划链、K1–K12 映射、6–8 个现有技能的职责重排。
- 合并审查合同及文档审查失败语义；指定 interaction aggregate 删除面。

### 权威矩阵

| 事实类别 | 唯一权威 | 当前任务如何消费 | 禁止的第二权威 |
| --- | --- | --- | --- |
| 全局产品目标、完整用户流程、跨任务需求、总体成功/失败与验收 | 母 PRD | decision-log 只引用并登记本卡承接/偏离 | 在四材料重写一份全局正文 |
| 本任务原始声明、选择、理由、风险、非目标、延期方向 | decision-log | spec 引用并翻译为行为 | spec/plan 静默改方向 |
| 本任务产品行为、状态、FR、AC、产品边界 | spec | phase 与 task 使用稳定 ID | plan/tasks 复制规格正文 |
| 工程方案、phase 边界、测试设计、回滚 | 未来 phase/当前 plan | task 只投影执行卡 | plan/tasks 两份等价正文 |
| 当前执行事实与质量事实 | task store 既有 quality/facts/evidence | 四材料只放稳定引用 | 在材料中伪造执行结果 |

## 3. 用户场景与状态覆盖

### SCN-001：强模型产出可由弱模型执行的当前材料

- **角色**：WorkflowHub 使用者与规划模型
- **Given**：需求、决定、非目标和延期归属已确认
- **When**：依次完成 make-decision、build-spec、build-plan
- **Then**：四材料各有唯一职责，phase 给出目标、契约、写集、禁改、测试与停止条件，luna 无需猜产品选择

### SCN-002：小变更不需要完整附件

- **角色**：规格作者
- **Given**：变更可在短主干中完整表达
- **When**：按新模板写 spec
- **Then**：只保留适用结构，其余写 `N/A — reason` 或稳定指针，不用空表和填充文字制造长度

### SCN-003：同一事实被写成两个权威正文

- **角色**：规格审查者
- **Given**：主干与契约附件重复声明同一验收或范围事实
- **When**：执行无重复契约检查
- **Then**：检查真实报告重复；权威正文只保留一处，其余改为稳定指针；失败不被包装为通过

### SCN-004：需求或验收信息缺失

- **角色**：材料作者
- **Given**：某需求无来源、某 AC 无失败条件、某延期项无 owner 或关闭条件
- **When**：执行当前阶段分析
- **Then**：以具体 ID 和定位报告缺口；方向缺口返回 make-decision，规格缺口留 build-spec 修复，不交给下游猜测

### SCN-005：独立审查仍在运行或当前不可用

- **角色**：WorkflowHub 使用者
- **Given**：冻结材料已提交审查，但 provider 尚未终态、超时、认证失败或完整材料超过传输上限
- **When**：阶段继续处理不依赖审查的工作
- **Then**：状态保持运行中、partial 或 `unavailable` 的真实语义；不得截断材料后声称完整审查，不得把 unavailable 改写为空 findings

### SCN-006：审查被取消或没有语义结果

- **角色**：WorkflowHub 使用者
- **Given**：审查取消、输出无效或没有任何可用语义结果
- **When**：记录审查事实
- **Then**：保留实际 transport/provider/error；只有具体故障发生变化才允许重试，不为获得 clean 标签重跑

### SCN-007：弱模型试图修改预写测试

- **角色**：build-code 执行模型
- **Given**：phase 已标明预写测试和 DO NOT TOUCH 边界
- **When**：实现需要改变测试才能变绿
- **Then**：执行停止并提出显式测试变更请求；未经独立审查不得修改或放宽测试

### SCN-008：不可逆操作缺少当前授权

- **角色**：WorkflowHub 操作者
- **Given**：准备 commit、push、merge、archive 或 cleanup
- **When**：当前任务没有相应明确授权
- **Then**：不得执行；规格或规划完成不自动授权不可逆操作

### SCN-009：并行 phase 发生写集冲突

- **角色**：实现模型与规划模型
- **Given**：两个 phase 或 task 声称修改同一文件或共享契约但未声明依赖
- **When**：计划检查并行性
- **Then**：并行声明失效，必须串行或重划边界；不得把合并冲突留给执行阶段猜测

### SCN-010：本卡处于新旧拓扑 bootstrap 边界

- **角色**：当前任务执行者
- **Given**：未来四阶段拓扑和 13 步规划链尚未实现
- **When**：本卡进入规格与规划
- **Then**：本卡使用现有 build-spec 15 步和 build-plan 13 步完成自身；只有 build-code 落地后，新拓扑才供后续任务使用

### 状态覆盖清单

- [x] **默认态**：SCN-001
- [x] **空态**：SCN-002（不适用内容不造空表）
- [x] **错误态**：SCN-003、SCN-004
- [x] **加载态**：SCN-005（审查未终态）
- [x] **取消态**：SCN-006
- [x] **边界态**：SCN-007、SCN-010
- [x] **权限态**：SCN-008
- [x] **竞态**：SCN-009

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：认证 worktree 内四份材料是当前任务工作真相；母 PRD 仍独占全局产品目标、完整用户流程、跨任务需求和总体成功/失败与验收
  - **status**：verified
  - **证据或来源**：`decision-log.md` D-001、D-008、D-013；项目治理边界
  - **关联**：FR-DOC-001..004、FR-AUTH-001、AC-DOC-001..004、AC-AUTH-001

- **PFACT-002**：用户明确采用强模型规划、luna 级模型实现与验证的不对称分工
  - **status**：verified
  - **证据或来源**：U-001 E-4、D-003
  - **关联**：FR-TEST-001、FR-TEST-002、AC-TEST-001、AC-TEST-002

- **PFACT-003**：现有 build-spec 与 build-plan 质量核心为 K1–K12，不是旧口径的 8 条
  - **status**：verified
  - **证据或来源**：D-009、K1–K12 逐条映射与 I-B 报告
  - **关联**：FR-FLOW-001、FR-FLOW-002、AC-FLOW-001、AC-FLOW-002

- **PFACT-004**：已知需求清点为 316 个单元下界，只能证明已知范围内组级闭合
  - **status**：verified
  - **证据或来源**：U-002-14、D-014、覆盖矩阵更正
  - **关联**：FR-COVER-001、FR-HANDOFF-001、AC-COVER-001、AC-HANDOFF-001

- **PFACT-005**：当前正式文档审查输入曾达到 362477B，超过 307200B 上限，bare 路径结果不能证明正式 run 可用
  - **status**：verified
  - **证据或来源**：T-075、detail 审查原件
  - **关联**：FR-REVIEW-001、AC-REVIEW-001、RISK-003

- **PFACT-006**：UI applicability 为 non_ui，本卡不改前端
  - **status**：not_applicable
  - **不适用理由**：交付对象是 CLI 工作流、材料合同和校验语义，没有页面、组件或视觉状态
  - **关联**：FR-DOC-001、AC-DOC-001

- **PFACT-007**：真实多 phase task 抽验尚未发生；fixture 只能证明模板 smoke
  - **status**：unknown
  - **owner、影响**：CARD-10；影响 AC-TEST-003 的最终实任务外部有效性；关联 OPEN-001、RISK-004
  - **关联**：FR-TEST-003、AC-TEST-003

- **PFACT-008**：make-decision reflection 已有 degraded 原件，但 task store 当前缺 canonical stage facts
  - **status**：verified
  - **证据或来源**：当前 task store `facts.jsonl` 为空；make-decision handoff 与 reflection 原件保留该差异
  - **关联**：FR-HANDOFF-001、AC-HANDOFF-001、RISK-005

## 5. 功能需求

### 文档职责与模板（DOC）

- **FR-DOC-001**：decision-log 模板必须以 ADR 决策块、唯一 OI 状态、原始声明层、三级追溯链、三档结论和 append-only 更正承载方向真相
  - **范围边界**：只定义一个 decision-log 权威，不复制成第五份账本
  - **依据**：D-002、D-004、D-011、PFACT-001
  - **场景**：SCN-001、SCN-004
  - **验收**：AC-DOC-001

- **FR-DOC-002**：未来 spec 模板必须提供可连续阅读的叙事主干与按需读取的契约附件，附件 A 是验收判据唯一权威，主干只留场景与稳定指针
  - **范围边界**：本要求描述待实现模板；当前本文件仍遵守 `spec-content.v3`
  - **依据**：D-002、D-004、T-048、T-055、PFACT-001
  - **场景**：SCN-001、SCN-002、SCN-003
  - **验收**：AC-DOC-002

- **FR-DOC-003**：phase 模板必须提供 L0 目标、L1 契约、L2 可作废参考，并显式给出差异、边界、依赖、写集、禁改、自身验收、全局指针、索引与测试入口
  - **范围边界**：L2 带退出条件；禁止能力补偿型提示
  - **依据**：D-002、D-003、T-017、PFACT-002
  - **场景**：SCN-001、SCN-007、SCN-009
  - **验收**：AC-DOC-003

- **FR-DOC-004**：常驻紧凑索引必须是纯指针表，只登记权威文件、语义锚点、写集/依赖和消费者，不复制正文
  - **范围边界**：不使用会腐化的行号 pin 或推进型 hash gate
  - **依据**：D-002、D-004、T-014、PFACT-001
  - **场景**：SCN-001、SCN-003
  - **验收**：AC-DOC-004

- **FR-DOC-005**：未来 spec 必须可定位四类需求翻译结果：需求说明、验收流程、测试标准和架构边界；布局不能替代内容
  - **范围边界**：fixture 只检查可填充与定位；真实任务内容质量仍由 CARD-10 抽验
  - **依据**：母 PRD 第 7 条功能需求与第 7 条验收、D-002
  - **场景**：SCN-001、SCN-002、SCN-010
  - **验收**：AC-DOC-005

### OI 生命周期（OI）

- **FR-OI-001**：OI 必须区分开放问题、已揭示候选和已确认绑定；reconstruct 不得把未确认候选伪装成选择，reveal/challenge 必须显示候选与状态，build-plan 只能消费已确认绑定
  - **范围边界**：状态是材料语义，不新增运行时状态机或回执控制面
  - **依据**：D-002、D-011、F17/T-077
  - **场景**：SCN-001、SCN-004
  - **验收**：AC-OI-001

### 验收与测试作者边界（TEST）

- **FR-TEST-001**：所有新 AC 必须使用条件、行为、可度量标准、失败场景四段式语义，禁止 V0 不可判定词进入正式验收
  - **范围边界**：证据类型可为机器或人工，但必须可回读
  - **依据**：D-005、D-006、PFACT-002
  - **场景**：SCN-004
  - **验收**：AC-TEST-001

- **FR-TEST-002**：强方必须在 build-plan 设计并冻结 RED/GREEN 与 oracle，build-code 不得静默修改预写测试
  - **范围边界**：合法测试变更需要显式请求和独立审查
  - **依据**：D-003、D-006、PFACT-002
  - **场景**：SCN-007
  - **验收**：AC-TEST-002

- **FR-TEST-003**：本卡必须提供至少双 phase 的最小 fixture 和一条因目标断言失败的有效 RED，但只能宣称模板 smoke，不得据此关闭真实 task 抽验
  - **范围边界**：真实多 phase 抽验由 CARD-10 在首个新格式实施 task 后完成
  - **依据**：T-032、T-041、T-070、PFACT-007
  - **场景**：SCN-001、SCN-004
  - **验收**：AC-TEST-003

- **FR-TEST-004**：首个使用新格式的真实任务必须证明强方产出的 phase 能由弱模型在冻结测试和 DO NOT TOUCH 边界内实现，并由 verify-code 的真实入口复核
  - **范围边界**：本卡只设计 fixture 与交接；真实链路由 CARD-10 在触发后执行
  - **依据**：U-001 E-4、D-003、D-006、T-070
  - **场景**：SCN-007、SCN-010
  - **验收**：AC-TEST-004

### 审查与单一权威（REVIEW/AUTH）

- **FR-REVIEW-001**：未来规划链只发起一次当前材料的合并审查；冻结 packet 必须含被引用来源清单，完整材料无法送达时诚实返回 `unavailable`，不得静默截断
  - **范围边界**：本卡定义文档审查合同，不做 provider 工具选型或真实代码审查实测
  - **依据**：D-007、T-042、T-075、PFACT-005
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-REVIEW-001

> **D-015 实施更正（2026-09-21）**：WorkflowHub 不再设置任何本地审查输入字节上限，也不因 packet 大小在 provider 前生成 `blocked_before_dispatch`。完整 byte/hash manifest 以附件文件传输；内部文件分片可存在，但重组后的 provider 可见字节必须完整。外部 provider 自身拒绝只能如实成为已派发的 unavailable transport fact。

- **FR-REVIEW-002**：审查 finding 的严重度只能是描述性标签；处置必须归一为修复、带理由拒绝或需人工，并为需人工项指定 owner 与期限；单次成功后不重复整轮审查
  - **范围边界**：当前 WorkflowHub 内部 `accepted_risk` 记录语义保留，不能伪装为目标 finding 状态
  - **依据**：D-007
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-REVIEW-002

- **FR-REVIEW-003**：审查合同必须逐次记录 finding 有效率、锚定准确率和耗时，并对无 oracle、无溯源、预写测试被改、不可逆操作缺确认门四项自检逐项给结论
  - **范围边界**：本卡定义可执行测量字段与失败语义，真实对比实验归 CARD-05；不设未获用户确认的阈值
  - **依据**：D-007、T-034、T-042
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-REVIEW-003

- **FR-AUTH-001**：无重复契约检查必须同时验证稳定 ID 定义唯一性与四类全局事实人工抽样：产品目标、完整用户流程、跨任务需求、总体成功/失败与验收；结论只能限定为已知清单内
  - **范围边界**：真实报告失败但不形成推进 gate；不允许声称全局零重复
  - **依据**：D-008、PFACT-001、PFACT-004
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-AUTH-001

- **FR-AUTH-002**：当产品事实变化时，只修改其唯一权威正文，所有其它位置只随稳定引用变化，不得要求第二处手工同步副本
  - **范围边界**：更新引用不是复制正文；历史事实 append-only 保留
  - **依据**：D-008、A-3/L-11
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-AUTH-002

### 流程合并、覆盖和删除（FLOW/COVER/CLEAN）

- **FR-FLOW-001**：未来 build-plan 必须把现有 build-spec 15 步与 build-plan 13 步的 K1–K12 语义合并为 13 步，净新增步骤、技能、stage 和控制面均为 0
  - **范围边界**：本卡仍按现有两阶段完成自身，不能提前使用待实现流程
  - **依据**：D-009、T-043、PFACT-003
  - **场景**：SCN-010
  - **验收**：AC-FLOW-001

- **FR-FLOW-002**：合并必须给 K1–K12 每项保留真实 consumer、保留或改变的语义、oracle、owner 与删除条件，并明确 6–8 个现有技能的职责改造
  - **范围边界**：聚合账不是逐项映射的替代物
  - **依据**：D-009、D-014、PFACT-003
  - **场景**：SCN-001、SCN-010
  - **验收**：AC-FLOW-002

- **FR-FLOW-003**：目标规划产物必须取消 plan.md/tasks.md 等价双写及其相等性协议和校验路径，只保留一个 phase 工程权威与一个纯指针执行索引
  - **范围边界**：旧历史材料只读；不得以兼容层永久保留 active 双写
  - **依据**：母 PRD 第 9 条功能需求与第 9 条验收、D-009、T-061
  - **场景**：SCN-001、SCN-003、SCN-010
  - **验收**：AC-FLOW-003

- **FR-COVER-001**：需求覆盖检查必须接入正式确认路径，以原始需求清点为输入；每条 OI 必须带原始声明逐字引用/source 锚点，并逐条验证 disposition、强度、owner/显式排除理由和计数对账，报告缺失 ID 与位置
  - **范围边界**：只证明当前输入集合，不把 316 下界改写为完备全集
  - **依据**：D-010、PFACT-004
  - **场景**：SCN-004
  - **验收**：AC-COVER-001

- **FR-COVER-002**：decision-log 字段检查必须兼容可选列表前缀与全角冒号，并对 card-01 的 10 块和 card-02 的 14 块共 96 个字段使用同一规则
  - **范围边界**：不得只修本卡输入形态造成跨卡行为分裂
  - **依据**：T-046、T-077
  - **场景**：SCN-004、SCN-010
  - **验收**：AC-COVER-002

- **FR-CLEAN-001**：interaction aggregate、questions-only 投影及其内容寻址回执必须从 active make-decision 完成链删除，旧记录只读保留
  - **范围边界**：删除限定为 T-083 点名的 active consumer、writer、input 与完成依赖；不扩为本卡外广义清理
  - **依据**：T-083
  - **场景**：SCN-001、SCN-010
  - **验收**：AC-CLEAN-001

- **FR-HANDOFF-001**：跨卡未完成项必须保留 owner、触发条件、交接对象与关闭条件；本卡不得把延期或 unavailable 包装为已完成
  - **范围边界**：不回写母 PRD，不替其它卡开工
  - **依据**：D-012、D-014、PFACT-004、PFACT-007、PFACT-008
  - **场景**：SCN-004、SCN-005、SCN-010
  - **验收**：AC-HANDOFF-001

## 6. 模块划分

### 材料作者合同

- **负责什么**：把方向、产品行为、工程计划和执行卡分别固定在四材料的唯一职责中
- **对外提供什么**：可读主干、稳定指针、可执行验收和下游不需猜测的边界
- **依赖谁**：已接受 decision-log 与当前阶段的真实质量事实
- **测试边界**：四材料交叉映射无孤儿、无重复权威、失败语义不丢失

### 规划质量合同

- **负责什么**：合并 K1–K12、测试蓝图、路由建议、单次审查、finding 处置与最终分析
- **对外提供什么**：有序 phase、任务卡、RED/GREEN、oracle、STOP 与回滚边界
- **依赖谁**：当前 spec 的 FR/AC、现有消费者与已验证代码锚点
- **测试边界**：每个 FR/AC 有 task 和 oracle，每个文件只属于一个 phase 写边界

### 需求保真合同

- **负责什么**：原始声明、派生解释、三档处置、强度核对与延期归属
- **对外提供什么**：已知范围内可复算覆盖和真实缺口
- **依赖谁**：原始需求清点、用户确认与独立审查
- **测试边界**：缺失单元逐条可定位，未知不被自动补成通过

## 7. 关键实体

- **Material Authority**：四材料之一及其唯一职责；同一事实不得有两个权威正文。
- **Requirement Slice**：一个稳定 FR，对应来源、场景、PFACT、AC 与下游 task。
- **Acceptance Criterion**：四段式可判真假承诺，包含预期证据类型，不携带执行结果。
- **Phase Contract**：L0/L1/L2、边界、依赖、写集、禁改、验收、测试入口和全局指针的组合。
- **Review Finding**：独立审查返回的建议事实；严重度是描述，不是推进许可。
- **Deferred Handoff**：owner、触发、消费者和关闭条件齐全的未完成项。

## 8. 数据和生命周期

- **数据粒度**：一条需求、决定、FR、AC、finding、风险或延期项各有稳定 ID。
- **数据时效**：四材料只表达当前任务真相；历史 review、旧 handoff 和旧记录只作 provenance。
- **缺失或迟到**：写为 `unknown`、`unavailable`、`incomplete` 或 deferred，不回填默认成功。
- **预览与正式**：模板 smoke、bare review 与正式 run 分开标记，前者不替代后者。
- **当前与历史**：当前材料原位修订；旧 immutable 质量原件保留，不扫描 latest 冒充当前。
- **归属与清理**：T-083 指定 active aggregate 停止生产，旧 aggregate 只读；其它删除需其 owner 与证据。

## 9. 兼容性预留

- **既有消费方**：本卡自身继续使用现行 build-spec/build-plan；新拓扑只在实现完成后服务后续任务。
- **命名预留**：稳定 ID 使用领域前缀；旧紧凑 ID 只读兼容，不成为新输出格式。
- **容器预留**：仍只有四材料；导航、packet 投影和质量事实不是第五材料。
- **状态预留**：失败、partial、unknown、unavailable、incomplete 保持独立含义。
- **扩展边界**：跨卡增强通过明确 handoff 承接，不在本卡偷做 CARD-03/04/05/06/07/08/10 的工作。

## 10. 明确不做与默认必须成立

### 明确不做

- 不回写母 PRD；原因：母/兄弟材料只读，边界差异由本卡登记并交 CARD-10 核对。（D-001、D-013）
- 不做 provider 工具选型、对比实验或真实代码审查实测；原因：属于 CARD-05。（D-001、D-007）
- 不做 T-083 指定删除面之外的广义物理删除；原因：属于 CARD-06 或对应 owner。（D-001、T-083）
- 不改前端或新增 UI；原因：UI applicability=`non_ui`。（D-001）
- 不新增第五份材料、public command、持久对象、stage、技能或独立控制面；原因：薄核心与净新增 0。（D-009）
- 不把检查或质量事实变成推进 gate；原因：真报失败、同 task 可修复。（D-008）
- 不修改 CARD-01 已冻结的阶段/材料接口蓝图；原因：只在 build-plan 对齐其冻结版本。（D-004）

### 默认必须成立

- 一事实一权威；重复处只留稳定指针。（FR-DOC-001..004、FR-AUTH-001）
- 不设任何文档长度数值目标；精炼只按九条语义判据。（FR-DOC-001..004）
- 失败、unknown、unavailable、incomplete 与 deferred 必须原样可见。（FR-REVIEW-001、FR-HANDOFF-001）
- commit、push、merge、archive、cleanup 必须逐类取得当前明确授权。（FR-HANDOFF-001）
- 预写测试和评分逻辑属于 DO NOT TOUCH，除非走显式变更请求与独立审查。（FR-TEST-002）

## 11. 验收标准

- [ ] **AC-DOC-001**：decision-log 模板完整表达方向权威
场景：给定含原始需求、OI、决定、偏离和延期的任务，模板能让读者从原文追到最终处置。
验证：用同一 fixture 填充模板并回读 ADR 块、OI 状态、三级追溯、原始声明与 append-only 更正。
通过：五类结构均有唯一权威位置，每个决定能回到来源和处置，过程记录不覆盖最终决定。
失败：任一决定缺来源、OI 无终态、原文被摘要替换，或同一方向出现两个权威正文。
证据：模板 smoke 记录与结构检查结果。

- [ ] **AC-DOC-002**：未来 spec 模板兼顾叙事阅读与契约查找
场景：同一需求同时供人连续阅读和机器追溯，主干与附件不得双写验收事实。
验证：填充叙事主干与契约附件，并执行主干到附件 A 的稳定指针和重复事实检查。
通过：主干覆盖问题、目标、取舍、机制、验收场景、风险；附件覆盖需求、边界、延期和指针；四段式判据正文只在附件 A。
失败：主干复制附件 A 判据正文、附件退化为空表、或任一 FR 无来源/场景/AC。
证据：模板 smoke、重复检测和人工可读性记录。

- [ ] **AC-DOC-003**：phase 模板让弱模型无需猜测即可执行
场景：luna 级模型只读取当前 phase 与稳定全局指针后实施一个切片。
验证：对双 phase fixture 逐字段检查本包差异、边界、依赖/写集、自身四段式验收、全局目标稳定指针、紧凑索引、L0/L1/L2、测试命令、禁改和退出条件。
通过：全部必填字段有具体值或合法 N/A 理由；只写本 phase 差异、不复制完整 PRD/spec；L1 可机检；L2 可删除且不改变契约；冲突优先级明确。
失败：缺全局指针/紧凑索引/写集/禁改/STOP/测试入口，复制完整 PRD/spec，L2 成为永久权威，或用能力补偿型提示代替契约。
证据：phase 模板 smoke 与字段回读记录。

- [ ] **AC-DOC-004**：紧凑索引保持纯指针
场景：读者通过索引定位跨 phase 的权威事实和消费者。
验证：逐行核对索引是否只含权威文件、语义锚点、写集/依赖和消费者。
通过：索引不复制正文，不使用行号 pin 或推进型 hash gate，目标可由语义锚点定位。
失败：索引出现第二份契约正文、腐化行号，或未标真实消费者。
证据：索引结构检查与人工回读记录。

- [ ] **AC-DOC-005**：spec 四类翻译内容可定位
场景：一个真实需求被翻译为后续规划和实现可消费的 spec。
验证：分别定位需求说明、验收流程、测试标准和架构边界，并核对它们与 FR/AC/场景的指针。
通过：四类内容均有非空语义和稳定位置；架构只写产品边界，测试标准含 oracle 与覆盖限制。
失败：任一类缺失、只有标题/空表，或用模板结构存在替代内容存在。
证据：fixture smoke 定位记录；真实任务复核由 CARD-10 在触发后补充。

- [ ] **AC-OI-001**：OI 生命周期只向下游暴露确认绑定
场景：同一 OI 依次经历开放、候选揭示和用户确认。
验证：回放 reconstruct、reveal、challenge 与 build-plan 输入投影，检查每阶段可见内容和允许迁移。
通过：开放态不伪装选择；候选只在 reveal/challenge 可见；确认后才形成下游绑定；deferred 保留 owner 与触发条件。
失败：reconstruct 泄露候选并当作已选、未确认候选进入 build-plan，或状态跳过真实用户确认。
证据：材料状态回读与输入投影测试。

- [ ] **AC-TEST-001**：正式 AC 全部可判真假
场景：对本卡每条 AC 逐项判断验证方法、通过、失败与证据。
验证：检查四段式字段、不可判定词和 V0 项。
通过：每条 AC 四段非空，成功与失败互斥可观察，V0 数为 0。
失败：出现“合理、优雅、适当”等无 oracle 词，或失败条件只是通过条件的模糊否定。
证据：AC 合同检查结果与定位清单。

- [ ] **AC-TEST-002**：预写测试边界真实保护
场景：实现方发现只有改测试才能让 GREEN 通过。
验证：检查 phase/task 的 DO NOT TOUCH、测试变更请求、独立审查与同命令 RED/GREEN 设计。
通过：未授权修改被停止；合法变更有显式请求与独立 review；RED/GREEN 使用同一 oracle。
失败：实现方可静默删除或放宽断言，或 RED/GREEN 使用不同目标证明。
证据：计划合同、任务卡与后续变更审查原件。

- [ ] **AC-TEST-003**：fixture 与真实抽验边界不混淆
场景：双 phase fixture 跑模板 smoke 和目标断言 RED。
验证：执行 fixture 回读与目标断言，分别记录 exit、失败原因和覆盖限制。
通过：fixture 至少双 phase；RED 非零且由目标断言触发；结果明确标为 smoke，真实 task 抽验仍为 deferred。
失败：RED 由环境故障触发、fixture 只有单 phase，或 smoke 被用来宣称 AC-07/AC-08 已完成。
证据：测试输出、exit 记录与 CARD-10 handoff。

- [ ] **AC-TEST-004**：弱模型真实执行链不靠猜测
场景：首个采用新格式的真实任务由强方完成 build-plan，再交 luna 级模型 build-code/verify-code。
验证：核对冻结测试、DO NOT TOUCH、实现 diff、同 oracle GREEN、真实入口验收和弱模型提出的澄清次数。
通过：实现未修改冻结测试；真实入口覆盖目标成功/失败态；无产品方向猜测；所有必要澄清均指向真实缺料。
失败：模板字段齐全但实现仍需猜产品选择、测试被放宽、只用单元汇总替代真实入口，或无证据宣称可执行。
证据：CARD-10 真实任务执行、测试、review 与 verify-code 原件；触发前保持 deferred。

- [ ] **AC-REVIEW-001**：合并审查只消费完整冻结材料
场景：当前 spec/phase 进入一次合并审查，材料可能超过 provider 输入上限。
验证：核对冻结输入、被引用来源清单、provider/transport provenance、结果或 unavailable attempt，以及是否存在静默截断。
通过：完整材料成功审查并返回可定位 findings，或完整材料不可送达时返回真实 `unavailable`；两者均只有一个 safe review consumer。
失败：截断后声称完整、bare 结果冒充正式 run、unavailable 改写为空 findings，或为 clean 标签重复整轮审查。
证据：canonical review attempt/result 与材料指纹。

- [ ] **AC-REVIEW-002**：finding 处置不制造 severity gate
场景：一次审查同时返回有效、无效和需人工 findings。
验证：逐项检查 finding 标签、处置、理由、owner、期限和后续修复事实。
通过：每项处置为目标三态之一；severity 不决定推进；需人工项 owner/期限齐全；修复后只复验受影响检查。
失败：severity 自动阻断、出现无人负责的需人工项、或修复触发无变化的整轮复审。
证据：review report、finding disposition 与修复对照。

- [ ] **AC-REVIEW-003**：审查能力与失败状态可测
场景：同一冻结材料产生 completed、partial、认证失败、取消、invalid output 或 unavailable 中的一种真实结果。
验证：记录语义 finding 总数、主会话判为有效的 finding 数、可验证锚点数、总 finding 数、开始/结束时间、provider 状态、错误码和重试原因；逐项回答四条自检。
通过：finding 有效率=`有效 finding 数/语义 finding 总数`、锚定准确率=`有效锚点数/需锚定 finding 数`、耗时=`终态时间-开始时间` 均可复算；partial 不等于 pass；认证失败/取消/invalid/unavailable 保留原码；只有无语义结果且具体故障已变化才可重试；四项自检均有结论和定位。
失败：分母/原始计数缺失、锚点 unknown 被写 true、partial 或 unavailable 被写 clean、错误码被改类、无变化重复审查，或任一自检项无结论。
证据：canonical attempt/result、provider execution、finding disposition 与 CARD-05 对比实验记录。

- [ ] **AC-AUTH-001**：无重复契约结论有明确证据边界
场景：材料同时包含 ID 定义和四类事实清单。
验证：运行 ID 唯一性检查，并对产品目标、完整用户流程、跨任务需求、总体成功/失败与验收四类事实保存样本、权威文件、结论和证据。
通过：已知事实清单内双权威为 0；每类人工记录四要素齐全；结论明确限定范围。
失败：只检查 ID 就宣称全局无重复、抽样缺任一类、或检查失败被包装为通过。
证据：无重复契约报告和人工抽样记录。

- [ ] **AC-AUTH-002**：产品事实变更只改一处权威正文
场景：一个已登记产品目标发生变化。
验证：在其唯一权威文件更新正文，回读全部引用处是否只调整稳定指针或派生展示。
通过：无第二处需手工同步的正文副本；历史决定按 append-only supersession 保留。
失败：同一变化必须在两份各自声明权威的文件中分别改写，或引用处变成新的事实正文。
证据：变更传播 diff 与四类事实人工抽样记录。

- [ ] **AC-FLOW-001**：未来 13 步规划链净新增 0
场景：把现有 build-spec 15 步与 build-plan 13 步对照合并。
验证：逐步核对保留、合并、改造与删除关系，并检查 public surface 和技能清单。
通过：目标 13 步均有现有语义来源；新增 stage/skill/public command/持久对象为 0；本卡仍完成当前旧拓扑。
失败：通过改名伪装新增、遗漏原质量语义，或在实现前让本卡跳过 build-spec。
证据：合并账、流程 manifest 对照与 public surface 检查。

- [ ] **AC-FLOW-002**：K1–K12 逐项保真
场景：每个质量核心映射到合并后的步骤与真实 consumer。
验证：逐项检查 consumer、语义、oracle、owner、删除条件并实际按 oracle 核对。
通过：12/12 映射齐全且语义核对无悬空；6–8 个改造技能都有明确旧职责、目标职责和消费者。
失败：只给字段非空不核语义、聚合账替代逐项账，或新增技能承接已有职责。
证据：K1–K12 映射、技能职责表和 oracle 结果。

- [ ] **AC-FLOW-003**：规划产物不存在 plan/tasks 双写与相等性路径
场景：目标 build-plan 产出一个多 phase 任务的工程材料和执行索引。
验证：反向扫描 active writer、reader、validator、模板与测试，核对工程正文的唯一 writer 和索引的纯指针内容。
通过：plan.md/tasks.md 等价双写不再产生；相等性协议与校验代码路径在 active runtime 中为 0；旧历史记录只读。
失败：两份文件仍维护等价正文、用 compatibility bridge 永久双写，或仍存在 active 相等性 validator/consumer。
证据：active consumer census、删除证明和针对性合同测试。

- [ ] **AC-COVER-001**：覆盖检查逐条发现真实缺失
场景：原始清点分别出现缺 source 锚点、缺 disposition、强度削弱、缺 owner/显式排除理由、计数不闭合，以及一份完整材料。
验证：用同一覆盖检查运行五类独立失败 fixture 和现行完整输入。
通过：每类 fixture 均非零并逐条报告 ID/位置/差异；强度比较保留限定词；明确排除有理由；已知输入计数闭合；现行输入 exit 0 且缺失清单为空；生产确认路径真实调用检查。
失败：只报告类别、漏报任一缺失、削弱限定词仍判通过、拒绝项无理由、计数不一致、RED 由环境故障产生，或生产路径仍无调用者。
证据：RED/GREEN 输出与确认路径调用证据。

- [ ] **AC-COVER-002**：两卡 decision-log 字段统一识别
场景：card-01 与 card-02 使用可选列表前缀和全角冒号的字段。
验证：同一检查器读取两份当前 decision-log 的全部决定块。
通过：24 个块 × 4 字段 = 96 个字段全部识别，exit 0，无文件特判。
失败：任一字段漏识别、只修 card-02，或通过文件名分支绕过统一语法。
证据：字段识别检查输出和覆盖计数。

- [ ] **AC-CLEAN-001**：active 流程不再依赖 interaction aggregate
场景：make-decision 在无 aggregate 回执时完成真实问答、审查与用户确认。
验证：检查 active 输入、writer、consumer、完成条件和 questions-only 投影引用。
通过：T-083 点名的 active 依赖均移除；无 `outline_closed` 前置；旧记录只读且不再生成新 aggregate。
失败：任一 active consumer/writer/receipt key 仍要求 aggregate，或以新名字重建同类回执控制面。
证据：消费者反向扫描、public input 合同与针对性测试。

- [ ] **AC-HANDOFF-001**：未完成事实完整交接
场景：本卡结束 build-spec/build-plan 时仍有真实 task 抽验、跨卡增强或质量 unavailable。
验证：逐项核对 owner、触发、交接对象、关闭条件和当前状态。
通过：所有延期项四要素齐全；unknown/unavailable/incomplete 原样出现；母 PRD 和兄弟卡未被写回。
失败：无 owner 延期进入 handoff、质量缺失被写成完成，或本卡替其它卡开工。
证据：风险/未决表、阶段 handoff 与当前 task facts。

## 12. 风险、未决与交接

- **RISK-001**：未来 6 节+A/B/C/D 结构与当前 `spec-content.v3` 外壳不同
  - **受影响 ID**：FR-DOC-002、AC-DOC-002、FR-FLOW-001
  - **触发条件**：本卡在 build-code 前提前把当前 spec 外壳换成未来结构
  - **后果**：当前 strict analyzer 无法消费，本卡用未实现流程自证
  - **缓解或 STOP**：本卡材料继续用当前合同；未来模板作为被实现、被测试的产品行为
  - **处理 Stage**：build-plan / build-code
  - **验证**：当前 spec 合同检查与未来模板 fixture 分开执行

- **RISK-002**：主干与附件双写导致两个权威
  - **受影响 ID**：FR-DOC-002、FR-AUTH-001、AC-DOC-002、AC-AUTH-001
  - **触发条件**：主干手写验收正文，同时附件 A 也维护一份
  - **后果**：两处漂移，弱模型无法判断哪处为准
  - **缓解或 STOP**：附件 A 保留正文，主干只留稳定指针；连续两次重复则主干验收节降为纯指针
  - **处理 Stage**：build-code
  - **验证**：重复检测与 fixture 回读

- **RISK-003**：完整 review packet 超过当前输入上限
  - **受影响 ID**：FR-REVIEW-001、AC-REVIEW-001
  - **触发条件**：冻结材料大于 provider 可接受上限
  - **后果**：正式 review 无法产生语义结果
  - **缓解或 STOP**：不得截断或伪造；记录 `unavailable`，同 task 继续修复；适配合同能力增强交 CARD-05
  - **处理 Stage**：build-spec / build-plan / CARD-05
  - **验证**：canonical attempt 保留 MATERIAL_INCOMPLETE 或真实 transport 错误

- **RISK-004**：fixture smoke 被误当真实 task 外部有效性
  - **受影响 ID**：PFACT-007、FR-TEST-003、AC-TEST-003
  - **触发条件**：使用合成 fixture 宣称 AC-07/AC-08 完成
  - **后果**：模板在真实复杂任务中的可读性与抽取质量未知
  - **缓解或 STOP**：声明未完成；首个新格式实施 task 后由 CARD-10 抽验
  - **处理 Stage**：CARD-10
  - **验证**：真实 task 审查与抽取记录

- **RISK-005**：make-decision handoff 与 canonical task facts 不一致
  - **受影响 ID**：PFACT-008、FR-HANDOFF-001、AC-HANDOFF-001
  - **触发条件**：下游把非权威 handoff 当作已发布 stage facts
  - **后果**：阶段历史被误报为 canonical completed
  - **缓解或 STOP**：handoff 只作指针；当前阶段按真实 task store 发布自己的事实并披露上游缺口
  - **处理 Stage**：build-spec / build-plan
  - **验证**：status/facts 与 handoff 分开读回

- **OPEN-001**：真实多 phase task 抽验
  - **受影响 ID**：PFACT-007、FR-TEST-003、AC-TEST-003
  - **owner**：CARD-10
  - **影响**：不能宣称 AC-07/AC-08 的真实任务外部有效性
  - **处理 Stage**：首个新格式实施 task 之后
  - **关闭条件或 STOP**：真实任务完成可读性、抽取与执行核对；fixture 不得关闭本项

- **OPEN-002**：CARD-05 审查适配合同增强
  - **受影响 ID**：FR-REVIEW-001、AC-REVIEW-001、RISK-003
  - **owner**：CARD-05
  - **影响**：完整大材料可能只能记录 unavailable
  - **处理 Stage**：CARD-05
  - **关闭条件或 STOP**：完整材料在正式 run 中可审查，或产品明确保留稳定 unavailable 边界

- **OPEN-003**：L2 失效条件维护
  - **受影响 ID**：FR-DOC-003、AC-DOC-003
  - **owner**：CARD-07
  - **影响**：无周期复核会让 L2 变成永久规格债
  - **处理 Stage**：CARD-07 / 后续复盘
  - **关闭条件或 STOP**：四条退出条件有 owner、复核时机和删除证据

- **OPEN-004**：跨 phase 契约一致性
  - **受影响 ID**：FR-DOC-003、FR-DOC-004、SCN-009
  - **owner**：CARD-03
  - **影响**：写集、依赖和 owner 声明可能不足以发现跨 phase 冲突
  - **处理 Stage**：CARD-03
  - **关闭条件或 STOP**：五项并行声明和一致性核对由真实 consumer 执行

- **OPEN-005**：弱模型真实端到端可执行性
  - **受影响 ID**：FR-TEST-004、AC-TEST-004、PFACT-007
  - **owner**：CARD-10
  - **影响**：本卡只能证明模板和合同可执行，不能证明真实复杂任务中 luna 无需猜测
  - **处理 Stage**：首个使用新格式的真实任务完成 build-plan 后
  - **关闭条件或 STOP**：完成冻结测试、luna build-code、真实入口 verify-code 与澄清归因核对；缺任一原件保持 incomplete

## 13. 业务影响与回归范围

### 四材料作者流程

- **既有行为**：decision-log/spec/plan/tasks 可用但职责和详略不稳定，部分质量语义分散在多步与重复记录中。
- **本需求影响**：四材料职责明确；新模板和未来规划链成为后续任务的统一输入。
- **回归路径**：用本卡 fixture 从 decision-log 走到 spec、phase、task，再由弱模型按契约执行。
- **验收**：AC-DOC-001..004、AC-FLOW-001..002

### 验收与测试流程

- **既有行为**：AC 可能不可判，测试作者和变更权限不清，fixture 容易被包装成真实验收。
- **本需求影响**：四段式 AC、强方预写、同 oracle RED/GREEN、真实抽验延期边界固定。
- **回归路径**：缺失 AC 失败、有效 RED、GREEN 不误报、预写测试禁改。
- **验收**：AC-TEST-001..003、AC-COVER-001..002

### 审查与质量事实

- **既有行为**：审查输入可能超限，severity 与处置混杂，aggregate 回执成为不合理完成依赖。
- **本需求影响**：一次合并审查、三态目标处置、完整或 unavailable、aggregate active 依赖删除。
- **回归路径**：完整 review、超限 unavailable、invalid output、旧 aggregate 只读、无 aggregate 完成链。
- **验收**：AC-REVIEW-001..002、AC-AUTH-001、AC-CLEAN-001

- **可能受冲击的业务规则**：当前五阶段 public surface、四材料唯一权威、风险确认语义、旧任务只读兼容、跨卡接口边界。
- **明确无影响**：前端与 UI；母 PRD 字节；CARD-01 冻结蓝图；未授权 Git 交付；其它卡未启动的实现工作。
