# 功能规格：主 Agent 成本可复跑与阶段自动记账（N1）

读者：N1 的产品、实现与独立验收作者，以及使用成本读数的后续卡作者。
读完要能：从真实需求找到场景、数据口径、边界与唯一验收条件；区分规划、实际执行与质量缺口。

- **状态**：draft；当前是 build-plan 产品规格草稿，尚未取得本轮计划确认，尚未实施或验收。
- **来源**：当前 `decision-log.md` 的 R-001—R-033、ADR-001 与 `## 验收面`；上游只读 PRD 的 `#n1`、`#g1`。
- **原件基准**：下文 `任务库/` 指 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n1-main-agent-cost-20261015/`；相对本仓路径从认证 worktree 解析。
- **确认边界**：历史 make-decision 确认保存答复、材料路径、HEAD 与时间，未保存材料哈希或展示全文；不据此声称本文件或当前决策日志字节已经批准。历史两路审查均为 partial，原件与限制沿决策日志保留。

## 速读卡（30 秒）

使用者希望每个阶段结束后，任务文件夹里自动多一笔能核对的成本记录；需要复查时，也能拿显式记录重新计算。

交付形态沿 ADR-001：一个按次运行的只读测量脚本、四阶段必经交接步骤中的调用、一份任务库 md 账本。读数按组列出；缺报与失败保留；默认包含有界发现的子会话；账本只留原始数字供人工比较。验收正文唯一在 Appendix A，AC-010 按本轮用户真实答复 U-001 移除净字节不增硬要求，保留无新增常驻进程/数据库及针对性测试约束。

## 材料导航

| 节 | 回答什么 | 何时读 |
| --- | --- | --- |
| 来源与决策映射 | 每条原始需求落在哪里 | 核范围、追来源时 |
| 1—3 | 谁使用、怎样操作、异常怎样显露 | 理解旅程时 |
| 4—9 | 事实、功能、实体、生命周期与兼容 | 设计与实施前 |
| 10 | 唯一非目标与产品不变量 | 判断是否越界时 |
| 验收流程、测试标准 | 验收入口、对象、oracle与覆盖限制 | 写 Phase 及执行前 |
| 架构边界、实现设计 | 产品接口与全局工程分工 | spec-plan补齐及实施前 |
| Appendix A | 同号 AC 的完整判据 | 逐条验收时 |
| 12—13 | 缺口、风险与回归责任 | 收尾与承接时 |

导航可按正文再生，不是另一处进度权威。

## 来源与决策映射

当前来源集合沿 decision-log 的 `## 原始需求`，并消费本轮真实用户变更 U-001。U-001 删除本任务“净字节不增”硬要求，不是换分母，也不新设字节上限；原始来源和历史选择保留。变更原件与主文最小索引由主线程按 decision-log owner 写入，本稿不代写。下表只保存关系与处理状态，原义仍由原文生产者持有。新 FR 使用 COST 域编号；AC-001—AC-014 是本任务已确认的既有编号，按 decision-log `## 验收面` 保持同号，不重新编域号。UC 同号只定位可观察用例，不产生第二套判据。

表中决定均引用 ADR-001；R-001 另沿工作包①与 D-001 读取方法事实，D-001 不被改写成方向决定。每条 FR 的场景与 PFACT 在第 5 节反向列明。

| 来源 | 决定 / source_status | FR | AC / 旅程 | 未决或边界 |
| --- | --- | --- | --- | --- |
| R-001 | ADR-001、工作包① / current | FR-COST-016 | AC-010 / SCN-008 | 全阶段方法；不跳阶段 |
| R-002 | ADR-001 / current | FR-COST-001、011 | AC-001、008 / SCN-001 | N10/N11由各自owner承接 |
| R-003 | ADR-001 / current | FR-COST-003 | AC-002 / SCN-001 | 四组分列 |
| R-004 | ADR-001 / current | FR-COST-005、014 | AC-003 / SCN-002 | OPEN-03 |
| R-005 | ADR-001 / current | FR-COST-006 | AC-004 / SCN-003 | 缺失不填0 |
| R-006 | ADR-001 / current | FR-COST-010 | AC-005 / SCN-004 | 本卡交付，不交N11补 |
| R-007 | ADR-001 / current | FR-COST-009、015 | AC-006、014 / SCN-006 | B-009收窄为原始读数 |
| R-008 | ADR-001 / current | FR-COST-007、009 | AC-007 / SCN-006 | 六类嫌疑仅提示 |
| R-009 | ADR-001 / current | FR-COST-007 | AC-007 / SCN-001 | 不固定问题数量 |
| R-010 | ADR-001 / current | FR-COST-008 | AC-004、009、014 / SCN-003、005 | provider补报不在本卡 |
| R-011 | ADR-001 / current | FR-COST-001、011 | AC-001、003、008、014 / SCN-001、002、005 | 显式输入与有界自动解析 |
| R-012 | ADR-001、U-001 / current | FR-COST-016 | AC-010 / SCN-008 | 净字节硬要求已移除；其余约束保留 |
| R-013 | ADR-001 / non-goal | FR-COST-011 | AC-008 / SCN-008 | 历史分母只读 |
| R-014 | ADR-001 / current | FR-COST-001、002 | AC-001、005、013 / SCN-004 | 两宿主条件已由来源核实 |
| R-015 | ADR-001 / current | FR-COST-006、007、009、010 | AC-004、005、006、007、013 / SCN-003、004、006 | 不后补给N11 |
| R-016 | ADR-001、U-001 / current | FR-COST-011、016 | AC-010 / SCN-008 | 小工具定位与常驻约束保留 |
| R-017 | ADR-001 / current | FR-COST-006 | AC-004、013 / SCN-003 | 可缺失但不可假绿 |
| R-018 | ADR-001 / current | FR-COST-010 | AC-005 / SCN-004 | 已有历史样本 |
| R-019 | ADR-001 / current | FR-COST-001、002 | AC-001、005、013 / SCN-004 | B-004已复核选择 |
| R-020 | ADR-001 / current | FR-COST-002、010 | AC-005、013 / SCN-004 | DSH三代与Codex |
| R-021 | ADR-001 / current | FR-COST-011 | AC-012 / SCN-001 | 金额后续项 |
| R-022 | ADR-001 / current | FR-COST-004 | AC-011 / SCN-001、007 | 正式字段与请求去重 |
| R-023 | ADR-001 / current | FR-COST-002、006 | AC-013 / SCN-003、004 | 以B11更正及AC013为准 |
| R-024 | ADR-001 / current | FR-COST-012 | AC-014 / SCN-005 | 必经交接，非可选复盘 |
| R-025 | ADR-001 / current | FR-COST-013 | AC-014 / SCN-005 | 账本在任务库 |
| R-026 | ADR-001 / current | FR-COST-001、005、012 | AC-003、014 / SCN-002、005 | OPEN-02 |
| R-027 | ADR-001、U-001 / current | FR-COST-013、016 | AC-010、014 / SCN-005、008 | 三条例外后另消费U-001 |
| R-028 | ADR-001 / current | FR-COST-014 | AC-003、013、014 / SCN-002、005 | OPEN-03 |
| R-029 | ADR-001 / current | FR-COST-009 | AC-006、007 / SCN-006 | 工具不产收益结论 |
| R-030 | ADR-001 / current | FR-COST-012、013 | AC-014 / SCN-005 | 正式交付范围 |
| R-031 | ADR-001 / current | FR-COST-013 | AC-014 / SCN-005 | 固定列加表头 |
| R-032 | ADR-001 / current | FR-COST-009、015 | AC-006、014 / SCN-006 | 追加保留全部尝试 |
| R-033 | ADR-001 / current | FR-COST-012 | AC-014 / SCN-005 | 阶段名由流程传入 |
| U-001 | 本轮用户明确变更 / current | FR-COST-016 | AC-010 / SCN-008 | 移除净字节不增；不换分母 |

来源核对差异：唯一覆盖原件开头仍称 R-001—R-030，实际表已有 R-033；其 R-023 行仍说 Codex 缺步骤、轮次，该说法已被 research B11 和当前决策日志作废；R-024 行保留了早期可选复盘表述。这里按当前主文、B-008—B-011 与更正来源翻译，不回写历史原件，也不把过时摘要当新选择。

## 1. 需求解释：问题与紧迫性

目前“主 Agent 花了多少”容易只剩一个合计数或不可核对的印象。缓存读取可能远大于输出，用量在流式副本中还会重复出现；跨会话、子代理与人工等待又让同一任务的读数被拆散。使用者需要能从指定记录重跑的分组数字，才知道差异来自哪里。

手动量一次不能满足用户事后统一查看的目标。用户在 B-007—B-009 选择阶段收尾自动留痕，并主动把工具端的对比结论收窄为“只记数字”。本卡交付可核对的观测与留痕能力；自身样本必须真实，其他卡的收益仍由它们各自验证。

## 2. 背景、目标与范围

### 背景

当前方向以 decision-log ADR-001 为准。research B8 证明本机 DSH 三代格式并存且都能提供四组；B11 更正了“Codex无法计算步骤和轮次”的旧推断，同时留下工具计数映射缺口。既有 metrics 用量字段有位置、无数据，不是本卡可直接复用的观测 producer。

### 目标

让使用者通过显式记录重跑，或在阶段结束后打开任务账本，找到分组读数、窗口、会话明细、来源和缺项，再自行对照同条件读数。具体通过与失败边界只在 Appendix A。

### 范围内

只读解析两宿主记录、DSH三代逐代断言、四组指标、去重、窗口与跨会话归并、缺失显露、三类来源分列、真实第二样本，以及任务库账本和四阶段交接调用。全局工程方案、确切路径和逐Task执行卡由本轮 spec-plan 在同一 spec 及 Phase 文件中固化；本稿不实施生产代码。

## 3. 用户场景与状态覆盖

### SCN-001：显式复跑一份原始记录

角色为后续卡作者或复核者。使用者提供一份或多份原始记录路径，工具仅消费这些明确输入，识别宿主和格式族，给出可逐字段追溯的分组读数、口径与消费问题。对应 UC-001、002、007、011、012；FR-COST-001—004、007、011。

### SCN-002：复跑跨会话及父子会话任务

角色为跨会话任务作者。输入会话列表或自动定位的当前父会话后，默认计入父记录事件明确指出的子会话，核对归属，逐会话列明已计入和未匹配对象，并保留窗口解释。后续会话没有明确输入或父记录关系时，不能仅凭目录相邻并入。对应 UC-003；FR-COST-005、014。

### SCN-003：只读到部分、未知格式或坏输入

角色为复核者。空文件、解析损坏、缺字段、无效数值或未知代次出现时，工具展示检测到的格式、行类型、缺项与位置。各组独立，能读的保留；末尾集中指出未读到的组与不完整性。未知不能变成0；缺报不能被其他来源顶替。对应 UC-004、009、013；FR-COST-006、008。

### SCN-004：换另一份已有记录

角色为独立验证者。使用已有历史记录，并覆盖另一格式代次及另一宿主，重跑相同口径、解释字段差异。DSH旧两代推理字段可选，不能因此废掉其他指标；Codex响应数与DSH步骤的语义差异须可读。对应 UC-005、013；FR-COST-002、010。

### SCN-005：阶段交接自动留下一笔

角色为执行 make-decision、build-plan、build-code、verify-code 的主会话。流程进入必经交接步骤，传入阶段名，按环境识别当前会话及其子会话，将本次窗口记录追加到任务库该任务账本。首笔从本卡开工计入；后续按上次记录界限计算。记账失败由交接读者看见，阶段收尾继续；不能仅因可选复盘未运行而漏账。对应 UC-014；FR-COST-001、012—014。

### SCN-006：同阶段返工后人工比较

角色为查看账本的使用者。同阶段重跑或返工后保留新旧行与全部尝试；使用者能并排查看原始读数，工具不代写“变好/变差/省了百分之几”。样本不足、任务不同、等待和缓存差异都不能被改写为收益。对应 UC-006、007、014；FR-COST-007、009、015。

### SCN-007：测量或写入中断与竞态

角色为阶段主会话及复核者。读取权限不足、解压失败、输入被活动写入、当前会话无法定位、任务库不可写、追加取消或同任务同时追加时，已观察事实与写入结果分别显露，不能损坏旧行、覆盖并发结果或补造成功。具体原子追加接口、取消与尾行处理由实现设计核定。对应 UC-003、004、011、014；FR-COST-004—006、012—015。

### SCN-008：交付边界与负担核对

角色为本卡实施者和独立验收者。核对新增面、三项采用内容、针对性测试范围与耗时、受影响字节及常驻面，确认仍是按次调用的小工具；只读历史，不扩大到 N10/N11。U-001 只移除净字节硬要求，不能把“无常驻进程”充当整条通过，针对性测试的范围与耗时仍须核实。对应 UC-008、010；FR-COST-011、016。

### 状态覆盖清单

| 状态 | 落点 | 说明 |
| --- | --- | --- |
| 默认 | SCN-001、005 | 显式重跑或交接自动调用 |
| 空 | SCN-003 | 空文件、零输入不报成功 |
| 错误 | SCN-003、007 | 格式、解析、字段、解压、写入错误显露 |
| 加载 | SCN-007 | 按次CLI的读取中；无浏览器加载视图 |
| 取消 | SCN-007 | 不补成功，不破坏已有账本 |
| 边界 | SCN-002、004、005 | 首末事件、代次、增量与首笔归属 |
| 权限 | SCN-007 | 只读原记录；写入仅任务库目标 |
| 竞态 | SCN-007 | 活动记录与同任务追加分别处理 |
| 缺报 | SCN-003 | 三来源与分组独立标注 |
| 历史/重跑 | SCN-006、008 | 追加保尝试，历史不重写 |

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：用户选择小脚本、阶段收尾自动记账与任务库md，并选择原始读数和追加保全部尝试。
  - **状态**：`verified`
  - **证据**：`任务库/quality/evidence/decision-log-refs/talk-batches.md` 的 B-007—B-010；只证明这些真实选择，历史字节确认限制见文件开头。
  - **关联**：FR-COST-009、012、013、015；AC-006、007、014。
- **PFACT-002**：DSH三代格式的四组字段可读，重复副本是三代共同风险。
  - **状态**：`verified`
  - **证据**：`任务库/quality/evidence/decision-log-refs/research.md` 的 B4—B8；这是同一任务调研的现场证据，后续实现仍须重跑真实样本，不宣称兼容未来格式。
  - **关联**：FR-COST-001—007、010；AC-001—005、007、011、013。
- **PFACT-003**：Codex用量、时间、轮次、响应数的来源已实测，工具与子代理调用数仍未映射。
  - **状态**：`verified`
  - **证据**：同一 research 的 B9、B11，以及当前 decision-log AC-013 的已核范围；不采信覆盖矩阵的旧可算性表述。
  - **关联**：FR-COST-001—006、010、014；AC-001—005、011、013、014。
- **PFACT-004**：当前DSH真实环境键/目录编码与子cwd、Codex线程/根会话区别及有界引用已核；任意自定义存储不承诺自动定位。
  - **状态**：verified（当前接口事实，尚未实施）。
  - **证据、影响**：合同4与EFACT-003—007；真实环境调用seq750/751、首行与usage身份、安装源定义。超出有限候选报unavailable，不扫历史。
  - **关联**：FR-COST-001、005、012；AC-003、014；OPEN-02、RISK-02。
- **PFACT-005**：用户在本轮澄清中明确移除本任务“净字节不增”硬要求。
  - **状态**：`verified`
  - **证据**：本轮spec-clarify第1批真实答复 U-001，原话“这个要求去掉，这是哪里来的需求啊？太过分了”；变更记录由主线程按原owner保存。此答复不等于计划已批准，无新增常驻进程/数据库和针对性测试约束仍保留。
  - **关联**：FR-COST-016；AC-010；OPEN-01、RISK-01。
- **PFACT-006**：按上次记录时间切阶段是时间窗口近似，不是会话记录内存在真实阶段标记。
  - **状态**：`inferred`
  - **推断与限制**：源于R-028及B-007展示的“记录没有阶段标记”；保留等待、首笔归属和跨阶段缺记录提示，不能把时间切片宣称为纯计算成本。精确边界去重待OPEN-03。
  - **关联**：FR-COST-005、014；AC-003、013、014。
- **PFACT-007**：宿主实际注入、provider上报与材料字节不是同一量，当前未取得所有来源的可用读数。
  - **状态**：`unknown`
  - **负责人、影响**：build-code与verify-code作者；逐来源确认可读与缺报，补报能力由后续owner负责。本卡不能估算填空。
  - **关联**：FR-COST-006、008；AC-004、009、014；RISK-03。
- **PFACT-008**：开工前已记录现有规模、常驻面与既有metrics测试失败；已有metrics没有可用token producer。
  - **状态**：`verified`
  - **证据**：`任务库/quality/evidence/pre-work-baseline-2026-10-15.md` 的第2、5、6、8节；只读保留其时间与失败性质，不以历史结果代替本次定向验证。
  - **关联**：FR-COST-011、016；AC-008、010、012。
- **PFACT-009**：本卡CLI/md无网页service/route/viewport，按真实范围保null；不编网页输入。
  - **状态**：verified（non_UI范围；唯一对象检查已执行、缺3个不适用字段；CLI业务执行未发生）。
  - **负责人、影响**：build-plan主会话运行唯一模板checker保缺项，P1/P2按真实CLI入口验收；不向用户索取不存在的UI，不把缺项改成新准入门。
  - **关联**：FR-COST-001、012；AC-001、014；OPEN-04。

## 5. 功能需求

### 观测与留痕（COST）

使用者可以从显式记录核对成本，阶段主会话可以从当前环境留下一行。两条入口共享指标口径、来源说明与失败语义；按源能取得多少就报告多少，账本保留历史尝试而不产生收益裁决。

- **FR-COST-001**：显式路径只消费所给记录；无路径的自动调用从环境定位当前会话，不能猜任意历史会话
  - 来源 / 决定：R-002、011、014、019、026 / ADR-001；PFACT / 场景：PFACT-002、003、004 / SCN-001、005；唯一AC：AC-001、003、014。
- **FR-COST-002**：区分DSH三代与Codex，按真实字段族断言；保留两者步骤/响应语义差异
  - 来源 / 决定：R-014、019、020、023 / ADR-001；PFACT / 场景：PFACT-002、003 / SCN-004；唯一AC：AC-005、013。
- **FR-COST-003**：输出四组独立指标，窗口、单位、等待与轮次内时长可读
  - 来源 / 决定：R-003 / ADR-001；PFACT / 场景：PFACT-002、003 / SCN-001；唯一AC：AC-002、014。
- **FR-COST-004**：仅从正式用量来源取数，按请求/消息标识去重；Codex累计与last不能同时累加
  - 来源 / 决定：R-022 / ADR-001；PFACT / 场景：PFACT-002、003 / SCN-001、007；唯一AC：AC-011、013。
- **FR-COST-005**：跨会话给各会话读数与合计，默认含父记录事件有界发现的子会话；未匹配和缺文件显露
  - 来源 / 决定：R-004、026 / ADR-001；PFACT / 场景：PFACT-002、004、006 / SCN-002；唯一AC：AC-003、014。
- **FR-COST-006**：分组独立报告有效/不可用/未上报，末尾汇总缺项；空、坏、漂移不得填0或报完整成功
  - 来源 / 决定：R-005、015、017、023 / ADR-001；PFACT / 场景：PFACT-002、003、007 / SCN-003；唯一AC：AC-004、013。
- **FR-COST-007**：每个指标标明其回答的真实消费问题，并以原数对账验证遥测自身
  - 来源 / 决定：R-008、009、015 / ADR-001；PFACT / 场景：PFACT-002 / SCN-001、006；唯一AC：AC-001、007。
- **FR-COST-008**：宿主实际注入、provider用量、材料字节分列并标来源和缺报；不得代理或互换
  - 来源 / 决定：R-010 / ADR-001；PFACT / 场景：PFACT-007 / SCN-003、005；唯一AC：AC-004、009、014。
- **FR-COST-009**：同阶段原始读数可并排读，工具不写任何收益性结论
  - 来源 / 决定：R-007、008、015、029、032 / ADR-001；PFACT / 场景：PFACT-001 / SCN-006；唯一AC：AC-006、007、014。
- **FR-COST-010**：用已存在历史样本独立复跑并说明跨格式稳定性；本卡承担真实第二样本
  - 来源 / 决定：R-006、015、018、020 / ADR-001；PFACT / 场景：PFACT-002、003 / SCN-004；唯一AC：AC-005、013。
- **FR-COST-011**：交付边界遵守第10节，工具输出可读说明归属，不造检查器/总分/金额/公共控制面
  - 来源 / 决定：R-002、011、013、016、021 / ADR-001；PFACT / 场景：PFACT-008 / SCN-001、008；唯一AC：AC-008、010、012。
- **FR-COST-012**：四阶段必经交接调用并传阶段名；自动定位失败或未记账可见，不能阻塞阶段收尾
  - 来源 / 决定：R-024、026、030、033 / ADR-001；PFACT / 场景：PFACT-001、004 / SCN-005、007；唯一AC：AC-014。
- **FR-COST-013**：任务库该任务的单一md账本使用固定列加表头，记录时间、阶段、指标、来源与缺项
  - 来源 / 决定：R-025、027、030、031 / ADR-001；PFACT / 场景：PFACT-001 / SCN-005；唯一AC：AC-014。
- **FR-COST-014**：首笔含本卡开工至本次记录；后续以既有行界限求增量，Codex累计前后相减
  - 来源 / 决定：R-004、028 / ADR-001；PFACT / 场景：PFACT-003、006 / SCN-002、005；唯一AC：AC-003、013、014。
- **FR-COST-015**：重跑与返工追加保全部尝试，不覆盖既有行，不因失败删历史
  - 来源 / 决定：R-007、032 / ADR-001；PFACT / 场景：PFACT-001 / SCN-006、007；唯一AC：AC-006、014。
- **FR-COST-016**：复用已有能力与样本、只补真缺口；负担按AC-010及U-001核对，方法执行沿R-001
  - 来源 / 决定：R-001、012、016、027、U-001 / ADR-001、工作包①；PFACT / 场景：PFACT-005、008 / SCN-008；唯一AC：AC-010。

## 6. 模块划分

| 产品职责 | 负责与对外结果 | 真实消费者 / 依赖 | 测试边界 |
| --- | --- | --- | --- |
| 认记录 | 识别宿主、格式与明确输入 | 复跑者；原始记录、系统解压 | 已知格式与未知格式 |
| 算数字 | 四组、窗口、去重与三来源读数 | 账本和人读输出；正式字段 | 原数逐项对账、重复副本负例 |
| 归并与缺项解释 | 会话归属、明细、缺失汇总 | 使用者；父记录明确事件 | 丢子会话、字段缺报、部分可用 |
| 阶段留痕 | 四阶段调用、任务库追加 | 交接读者；任务根、阶段输入 | 真实追加、失败与并发不破坏 |
| 人工对照与自证 | 保存全部尝试、消费问题与边界 | 使用者、后续卡作者 | 不产收益结论、负担核对 |

以上为产品职责，不强制拆成同数量文件或Phase；实现分工由全局设计按独立交付与真实写集确定。

## 7. 关键实体

- **原始会话记录**：明确路径或当前环境定位结果；带宿主、格式族、会话标识、事件与时间轴。只读，不复制整个记录目录，不改原文件。
- **成本窗口**：任务或阶段的起止及其来源、首末事件、等待是否计入；自动增量与显式完整窗口须可区分，边界重复问题由OPEN-03承接。
- **分组读数**：时间；输入/输出/缓存读取；步骤/轮次；子代理/命令调用。各字段标有效或缺项，不能仅凭其他组有效就称完整。
- **会话归并明细**：父/子关系来源、计入列表、各会话数值及未匹配对象；子代理调用次数与实际找到的子记录份数分开。
- **来源栏**：宿主实际注入字节、provider上报用量、材料字节，保单位、来源和缺报，不能与主会话token混成一列。
- **账本行**：一次阶段收尾或返工尝试对应一行，含时间点与流程传入的阶段名；固定表头、追加保留。它是人读观测记录，不是任务完成或继续执行的许可。

## 8. 数据和生命周期

按次读取被授权的原始记录，生成当前读数；人工复跑可只打印，交接调用追加到任务库。首次账本行建立基线界限，后续行消费前次已记边界；没有可靠前值时具体标缺口，不能以0猜前值。缺失与写入失败须在当次交接中可见。

输入可能仍被宿主写入。实现设计须区分观测结束点、未完成尾行、累计重置或缺失边界，避免一次解析错误吞掉已读组、避免把不完整文件当完整记录。没有阶段标记时按PFACT-006的限制解释归属。

账本历史行追加保留；失败尝试、不可用组与原件引用不被新成功覆盖。账本归用户与后续材料作者，owner沿ADR-001；只有上游官方观测入口完全承接后，脚本与自动记账动作才一并退出。删除账本会丢失历史对照能力，不能在普通临时文件清理中删除。

## 9. 兼容性预留

显式路径复跑与环境自动调用共享产品契约。已核实格式只按该格式字段读取，不承诺兼容未知未来格式；旧两代可选推理字段不升级为本任务必填指标。Codex响应数不能无说明冒称DSH步骤计数。

既有任务事实、阶段流程、退出与交接权限沿原owner。本工具不改变任务进度语义，不从旧run/receipt/accepted对象推导工作许可；pre/history原件只读，不创建新的schema版本、长期兼容bridge或宿主后台采集服务。

## 10. 明确不做与默认必须成立

### 明确不做

- N10检查器接线、N11最终同条件总评测及54项总复核；本卡3项采用仍由本卡交付和验证，不能后交其他卡补尾（R-002、015）。
- 重做或混用95记录/284路线、28路线、22路线历史分母；保留各自原生产者与原ref（R-013）。
- 扫描宿主全部历史、靠目录相邻猜任务归属、为找子会话遍历其他历史目录（R-011、AC-003）。
- 接现有metrics的tokens空壳、改写facts进度字段、造成本平台/仪表盘/数据库/汇总服务或第八个公共runtime命令（ADR-001）。
- 估算补齐缺失组、把常驻字节称宿主实际注入token、让本卡保证provider补报（R-010、017）；补报缺口由后续owner承接。
- 换算金额、采信记录内金额、内置价格表或联网取价（R-021）；金额问题按OI-014后续处理。
- 工具替使用者下收益结论、固定六项嫌疑门或固定2—4个消费问题（R-008、009、029）；解释沿真实问题和原数。
- 账本写进代码仓库、只挂可选复盘、覆盖返工行或把记账失败变成阶段失败（R-024、025、032）。
- 为成本采集额外跑一个业务任务、常驻采集进程、无范围全量回归，或为了抵账而删除无关代码/历史（R-016、018；U-001）。

simplicity-guard取舍：P0成立于B-007—B-010的真实留痕目标；P1优先系统解压、标准库及已有安全I/O；P2复用已有四阶段交接而非新增流程节点；既有metrics没有可用producer，P3仅在补这个已证缺口时成立。取舍不能替代代码锚点核实，也不授权额外退役或新控制面。

### 默认必须成立

原记录只读；字节与数值来源真实；支持与未知分开；生产方失败与业务检查结果分开；缺报不填0；质量、测试、Git交付及物理close分别报告。只读测量与账本写入分权，只有任务库当前任务目标可被本功能追加。

## 验收流程

从当前decision-log `## 验收面`取同号UC/AC入口，依SCN找到FR，再读Appendix A完整条件。Phase作者把同一oracle接到逐Task命令；build-code保存实际原件及失败，verify-code逐条读回。相同字节引用同一原件，无法证明字节相同记deduplication unknown，不复制测试输出或review原件到镜像证据区。

四阶段自动调用的端到端证明，须由真实主会话消费交接方法、调用脚本、回读任务库新增行与异常提示；仅检索SKILL或steps里出现脚本名不算业务验证。没有跨会话真实任务样本时沿AC-003区分构造验证与真实覆盖。

## 测试标准

以下是本项目实际测试面。当前精确Node命令、fixture取值与冻结的逐Task正负oracle沿已存在的phases/P1.md、phases/P2.md及两份Node测试读取；实际执行原件为任务库quality/tests/2026-10-15-013-build-plan-cost-contract-red.json、2026-10-15-014-build-plan-cost-closeout-red.json与2026-10-15-016-build-plan-cost-closeout-tcr-001-red.json，已执行到具名入口RED。数值、真实CLI读数与账本行为断言尚未到达，生产尚未实现；不能把本表、测试已写或入口RED当作功能通过或阶段确认。

| 测试面 / 适用性 | oracle | 预期证据 | 覆盖AC | 当前命令owner / 限制 |
| --- | --- | --- | --- | --- |
| 记录解析、格式族 / 适用 | ORACLE-COST-READ：真实事件字段直接重算与工具值逐项相等 | 定向命令raw、输入路径+hash | 001、002、005、013 | spec-plan；未来宿主版本不在覆盖内 |
| 去重、窗口、归并 / 适用 | ORACLE-COST-WINDOW：去重唯一、按会话读回与边界事件核对 | 正负例raw、明确窗口和缺记录 | 003、011、013 | spec-plan；真实跨任务缺样不能冒测 |
| 缺失、权限、失败 / 适用 | ORACLE-COST-MISSING：缺项显露且不填0、不报完整成功 | 空/坏/未知/权限样本raw | 004、009、013 | spec-plan；字段状态逐项断言 |
| 交接→脚本→账本 / 适用 | ORACLE-COST-LEDGER：新增行与实际输入相符，失败可见且交接继续 | 实际调用、前后行差异、失败原件 | 006、014 | spec-plan；不能只做文本存在检查 |
| 解释、来源与范围 / 适用 | ORACLE-COST-BOUNDARY：指标对应问题、来源分列、无越界输出 | 人读输出、范围/登记对照 | 007、008、009、012 | spec-plan；不证明全任务收益 |
| 负担与回归 / 适用 | ORACLE-COST-LOAD：相对原基线读回常驻、定向命令范围与耗时，实际新增字节仅作事实 | 原基线ref、差值、命令raw | 010 | spec-plan；U-001移除净字节硬要求 |
| 浏览器E2E、视觉/无障碍 / N/A | 本卡无网页、交互视图、URL或设计稿 | raw_requirement事实见下 | 无新增UI验收 | CLI与md仍须人读回；对象分支沿唯一模板的真实三源合同 |

测试维度另逐项保持：行为与数据流见前两面；错误、取消、恢复及权限见缺失面与SCN-007；并发和原子性见账本面；跨模块seam见四阶段交接链；可观测性来源见解释面。运行成本随受控样本观察，不能用全量回归证明“日常范围不扩大”。

### 验收对象

~~~json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n1-main-agent-cost-20261015",
  "service": null,
  "route": null,
  "state": {
    "defined_by": "decision-log.md#验收面",
    "planned_cases": ["显式合法记录", "跨会话与缺子会话", "空/坏/未知格式", "阶段自动追加", "追加失败与返工"],
    "execution": "not_run"
  },
  "viewport": null,
  "cli": {
    "command": "node tools/cli/measure-main-agent-cost.mjs --session=tests/fixtures/main-agent-cost/dsh-v4.jsonl",
    "entry_ref": "phase_P1",
    "sample_ref": "sample_dsh_v4",
    "oracle_ref": "cost_contract"
  },
  "owner": "N1 build-plan主会话（验收对象规划与检查执行责任）"
}
~~~

workspace 来自认证 worktree；state 为真实待验场景，execution=not_run 不冒已运行。service/route/viewport 保 null：本任务计划本地 Node CLI、文件 I/O 和按次 zstd，无 HTTP 服务、页面路由或浏览器视窗。cli.command 是 P1 已声明的显式样本读取入口，尚未实施；entry_ref 引已有 phases/P1.md 的计划权威，sample_ref 引已存在 tests/fixtures/main-agent-cost/dsh-v4.jsonl 的真实最小脱敏事件，oracle_ref 引冻结 tests/contract/measure-main-agent-cost.node-test.mjs。检查只核来源与对象结构，不能把这些引用说成计量 CLI 已执行或数值通过。

UI 三来源实读安排：raw_requirement 读 decision-log.md 的 R-002/003/011/016/024—033、ADR-001、V-001 与 B-007—010；project_inventory 读 package.json、README.md 及合同8的本地 Node/任务 I/O 作用面，不声称全仓无 UI；planned_or_changed_frontend_fact 读本 spec 合同8与已存在 P1/P2 计划，确认本卡无页面/组件/前后端 API 写集。消费者依唯一模板合同核这些实际范围和理由，三项均 false 时才传 CLI 分支；变更或冲突保持未知并沿原 Web 检查。

本次调用内 context.ui_applicability 三项 source_ref 分别为 decision_source、inventory_source、frontend_source；context.sources 使用实际读到的最小必要片段或结构化字段，附原路径、具体行/节、hash 和截取理由：decision-log.md 对应需求行，package.json 必要字段/README.md 入口说明，本 spec 合同8/P1/P2 声明写集。上述 CLI 引用的 sources key 为 phase_P1（P1 明确入口的计划文字片段）、sample_dsh_v4（fixture 的真实样本身份事件和原路径/hash）、cost_contract（冻结 Node 合同测试的具名原断言片段）。这些值就是实际执行输入，不能保存成另一份虚拟布尔或声称已读全文；它们只是现 consumer 本次内存映射，不写持久 context、第二 schema 或 checker，不复制整份材料到证据。具体三源角色、真实内容和矛盾仍由消费者核实，纯函数不能认证事实真值。

唯一 producer 仍为 skills/spec-specify/templates/spec-template.md marker 后的 checkAcceptanceObject(input, context={})。旧009原件保留：当时按旧五项实际返回 ok=false、missing_fields=[service,route,viewport]、exit1，原件为 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n1-main-agent-cost-20261015/quality/tests/2026-10-15-009-build-plan-acceptance-object.json；不把后续方法变化回写成旧检查成功。用户在 quality/evidence/human-confirmations/2026-10-15-003-build-plan-scope-approved.json 仅批准候选006的共享方法窄修，不是 N1 计划 approve。C01 经具名 TCR-SHARED-CLI-001 与独立018批准，实际新增目标 RED 见 quality/tests/2026-10-15-023-c01-shared-cli-target-red.json；旧 Web 判据保留；第一次同 oracle 复测024因本作者少写围栏换行而源提取失败，原件保留，随后仅恢复合法围栏，未改冻结断言。同一单文件 C01 的025原件 quality/tests/2026-10-15-025-c01-shared-cli-after-fence-repair.json 实际 exit0、221/221通过（旧31、新190），sha256 1702065a27eebe057b238059005f8f916de89070ed8b54708b1ffa1d6488f189；只证明本次对象方法行为。新实际对象执行原件 quality/tests/2026-10-15-shared-cli-actual-object.json（19291B，sha256 5b7864ef8f60896f5ee205c9d8421369eace37f4ff22ed1ca98af61ee5f05882）：本节真实对象和上述实际最小源片段得到 ok=true、missing_fields=[]；原 C01 valid() 构造 Web 形状对照同为 ok=true，不冒服务/页面已观察。state.execution 仍 not_run、009字节前后不变。此次仅实现获批的共享对象检查方法及现 consumer，未实施 N1 计量工具，不据此宣告数值/账本验收或阶段通过。

## 架构边界

产品边界为明确记录输入→分组人读读数，以及交接阶段名/任务目录→单一任务库md追加。四阶段主会话是自动调用消费者；使用者与后续材料作者是账本消费者。缺项/命令失败/追加结果是观测事实，不能改变阶段许可。

测量脚本读取宿主格式细节，账本动作独占观测追加职责；现有task facts继续独占任务进度，现有review producer继续独占审查事实。本功能不接管这两者。准确路径、函数、锁、写入边界和失败传播由下节核实，Phase只承接自己的差异。

## 实现设计（全局权威）

本节是全局工程合同；独立Phase只承接本Phase差异、任务和验证，不重定义接口。仍为draft：未获本轮计划确认，未实施、未执行生产测试。原FR/AC/R编号与已选方向保留。U-001仅删除净字节不增，不设同义字节门、不删metrics抵账；无新增常驻进程/数据库及“日常针对性测试耗时与范围不因此扩大”强度保留。后者具体为不扩既有默认测试命令/套件，新Node文件只由本任务显式命令运行；受影响既有测试同条件成本比较，无可比基线时保持unknown，不能宣称无变化，不加耗时阈值、不跑全回归。

### Code Anchors

`tools/cli/measure-main-agent-cost.mjs` 为唯一NEW生产owner；复用 `runtime/task/load-config.mjs` 的resolveCanonicalTaskPath、`runtime/task/task-handle.mjs` 的openTask/withRecordLock/writeRecordAtomic、`runtime/task/task-store.mjs` 的readTaskFacts、`runtime/task/material-workspace.mjs` 的materialFilesForCohort/phaseFilesFromIndex。实际依赖与四阶段精确文件/符号见合同8，保护边界保持原owner。

### Interfaces and Failure Semantics

以下八合同是P1/T001与P2/T002共同消费的唯一接口、读写及错误定义；不是公共runtime第八命令或阶段推进许可证。

#### 合同1：入口、参数、依赖与只读边界

唯一新生产文件 tools/cli/measure-main-agent-cost.mjs，使用Node内建库与下表既有窄工具；压缩输入按次调用zstd，无语言绑定/网络/常驻进程/价格表。import本文件不得执行CLI或I/O。入口固定：

~~~text
node tools/cli/measure-main-agent-cost.mjs --session=<file> [--session=<file> ...]
  [--from=<UTC-ISO>] [--until=<UTC-ISO>] [--project=<name> --task=<id>]
  [--stage=<make-decision|build-plan|build-code|verify-code>]
node tools/cli/measure-main-agent-cost.mjs --project=<name> --task=<id>
  --stage=<make-decision|build-plan|build-code|verify-code> --record
  [--session=<file> ...] [--start-ref=<source>#seq=<n>|<source>#item_id=<id>]
~~~

--session可重复，只收已存在绝对原件文件，支持.jsonl/.jsonl.zst/.jsonl.zstd；显式模式不运行环境定位，只读指定源及父记录明确指向的后代。无session按合同4定位。project/task必须成对；record同时要求project/task/stage，stage只四个合法值，由流程传入，不猜。未知/冲突参数、重复单值参数、无效ISO/selector为错误。from/until只供只读复跑，record并用则错误；record的until必须锁内真实采样。start-ref仅首次开工来源，不替代当前会话参数；已有历史边界不允许借start-ref重置。

只读复跑可不带任务身份，届时材料/provider来源not_reported:task_not_supplied，不扫描specs猜任务。带身份时复用 `resolveCanonicalTaskPath({project,task,env,home})`与`openTask(path,{projectName,taskId})`；不新增task-path参数或storage根策略。record仅写post当前task，不改pre/history。材料来自认证checkout，不能因manifest.target_repo_root是main而跑到main读取任务材料。

源文件只读打开并核regular file、非symlink、文件身份及打开时字节上界；拒绝目录/设备/路径穿越/打开期间替换。压缩字节经spawn参数数组给zstd -dc，不走shell拼串、不保存解压副本、不调用宿主恢复/迁移、不碰session.lock。JSONL逐完整行解码；坏JSON、截断尾行、坏压缩、活动写入变化都保真实sourcePath/行号或未知/原因，不吞错或把前缀冒完整源。源文件不写、不修、不删。

#### 合同2：正式纯函数、输入类型与返回

正式导出 measureSessions(sources, options = {})；其余helper在同文件，非新增跨模块API。纯函数不读fs/env/时钟、不启动子进程、不写账本、不变异输入。CLI读/解压、解码并收集真实来源事实后调用同一导出；测试使用该导出加真实Node CLI，不造第二计算器。

~~~typescript
type Issue = {
  code:string; sourcePath?:string; eventId?:string; line?:number;
  metric?:string; message:string; expected:boolean;
};
type LoadedSource = {
  sourcePath:string;
  records:Record<string,unknown>[];
  readIssue?:Issue;
};
type Metric<T = number> =
  | {status:"available"; value:T}
  | {status:"not_reported"; reason:string}
  | {status:"unavailable"; reason:string};
type SourceFact<T> = {
  metric:Metric<T>; refs:string[]; scope:string; unit:string;
};
type UsageMetricName =
  "inputTokens"|"outputTokens"|"cacheReadTokens"|"cacheWriteTokens"|"reasoningTokens";
type SourcePosition =
  | {kind:"dsh_seq"; seq:number; eventId:string|null; recordSha256:string}
  | {kind:"codex_ordinal"; ordinal:number; eventId:string|null; recordSha256:string};
type CumulativeObservation = {
  metric:UsageMetricName;
  series:"token_usage_record.thread_token_usage"|"event_msg.token_count.total_token_usage";
  eventRef:string; at:string; value:number;
};
type ObservedBoundary = {
  sourcePath:string; sessionId:string; family:"dsh"|"codex";
  observedAt:string; lastPosition:SourcePosition|null; prefixSha256:string|null;
  cumulative:CumulativeObservation[];
};
type MeasureOptions = {
  window?:{
    from:string|null; until:string|null;
    includeFrom:boolean; startRef:string|null;
    previousBoundaries?:ObservedBoundary[];
  };
  sourceFacts?:{
    hostInjectedBytes:SourceFact<number>;
    reviewProviderUsage:SourceFact<unknown[]>;
    materialBytes:SourceFact<number>;
  };
};
~~~

sourcePath是实际原件绝对路径；records是逐行已读JSON事件对象数组，不是路径数组、原始文本、iterator或副本目录。readIssue承接CLI真实读取失败；可传已读前缀加问题，不能把问题丢掉。省略window表示已选日志首末有效执行事件全窗；window存在而from=null表示任务开工未知，绝不回退会话起点。until=null代表真实cutoff未取得，纯函数不得补Date.now。时间均带时区且规范化为UTC ISO毫秒，要求from<=until；合法零跨度窗可有真实0，零输入不能成功。

真实输入结构例：读取EFACT-003原件后，sources[0].sourcePath是其绝对路径，records[0]为顶级type=session/version=4/id=session-d72c6146-1cf4-4c2c-ba48-0e279bc4d0c5/createdAt=1792057540660/cwd等；records中seq9为user/message、time1792064655860、data.id=83228ad9-0e53-4daf-8cb7-244f6e9a6e3d。DSH正式用量真实路径`assistant/message.data.{turn,step,message:{role,content,source,id},usage,stream}`；7088960d样本首usage是inputTokens8923/outputTokens210/totalTokens25517/cacheReadTokens16384。Codex真实记录是`{timestamp,ordinal,type:"token_usage_record",payload:{thread_id,session_id,response_id,usage,turn_token_usage,thread_token_usage,...}}`。这些是已读源的真实结构/值示例，非复制完整会话，也不冒删节对象可独立跑通。

~~~typescript
type Measurement = {
  status:"available"|"incomplete";
  window:{
    from:string|null; until:string|null; includeFrom:boolean;
    startRef:string|null; waitingIncluded:true;
  };
  sessions:Array<{
    sessionId:string; parentSessionId:string|null;
    family:"dsh"|"codex"; version:number|null; sourceRefs:string[];
    spanMs:Metric; activeMs:Metric;
    usage:{inputTokens:Metric; outputTokens:Metric; cacheReadTokens:Metric;
      cacheWriteTokens:Metric; reasoningTokens:Metric};
    counts:{dshSteps:Metric; codexResponseItems:Metric; turns:Metric;
      toolCalls:Metric; subagentCalls:Metric; commandCalls:Metric};
    observedBoundaries:ObservedBoundary[];
    cumulativePoints:Array<{
      sourceRef:string; threadId:string; series:string; metric:UsageMetricName;
      from:{eventRef:string; at:string; value:number}|null;
      until:{eventRef:string; at:string; value:number}|null;
    }>;
    missingChildren:string[];
  }>;
  totals:{
    wallMs:Metric; sessionSpanSumMs:Metric;
    activeUnionMs:Metric; waitingMs:Metric;
    usage:{inputTokens:Metric; outputTokens:Metric; cacheReadTokens:Metric;
      cacheWriteTokens:Metric; reasoningTokens:Metric};
    counts:{dshSteps:Metric; codexResponseItems:Metric; turns:Metric;
      toolCalls:Metric; subagentCalls:Metric; commandCalls:Metric};
  };
  sources:{
    hostInjectedBytes:SourceFact<number>;
    reviewProviderUsage:SourceFact<unknown[]>;
    materialBytes:SourceFact<number>;
  };
  issues:Issue[];
};
~~~

Metric的available值必须非负safe integer，拒绝非有限/负/-0/不安全值；缺报不得放value:0。未适用family指标not_reported:not_applicable。只有全部应计会话都有对应读数，才显示完整合计；某源/子会话required指标缺失时相应合计unavailable，仍展示已读每会话原数，不拿部分合计冒总量。DSH步骤与Codex响应项分别存、不跨语义相加。session.spanMs为会话有效执行事件首末与窗口交集跨度；跨度和可大于任务墙钟，不可互替。

文本输出每个分组邻接真实问题：时间“这段多久、轮次内/等待各多久”；token“上报哪些输入/输出/缓存量”；步骤/轮次“源发生多少步骤或响应项、多少轮”；调用“发起多少子代理与命令工具调用”。总末行列所有缺报/错误；显示会话明细/三来源与N1不产N10检查器/N11总分、金额/收益结论的边界。


#### 已读位置、同timestamp与累计快照的闭合规则

只读显式时间复跑且window没有previousBoundaries属性时，按所选完整记录的时间边界读取C(from)=最后timestamp<=from的点；这定义的是本次复跑时已选源的时间窗，不声称复现过去某次未保存的观察。record则始终显式传previousBoundaries数组（首次也传[]），采用下述已观察位置口径；纯函数调用者可传该属性复放同一记账观察，缺历史位点不能猜。window.previousBoundaries由前一实际账行sessions[].observedBoundaries扁平读取；本次sessions[].observedBoundaries保存每个实际source当前已观察事实，仍在既有“会话明细与累计点”格，不增列、sidecar、流程游标或新持久对象。cumulativePoints.metric及cumulative[].metric只用UsageMetricName的五个camel键，绝不混input_tokens等原生名；series仍固定合同3两种原始累计容器名称。DSH无累计容器，cumulative=[]，不是用量0。lastPosition为空、prefixSha256为空、cumulative为空只说明没有取得已读位点/累计快照，不能当首次0基线。

每source按文件完整JSONL记录顺序处理，DSH position为真实seq；Codex为每个完整记录的真实ordinal，不仅统计token事件。eventId尽量取该原记录真实身份：DSH message.id或data.id/callId；Codex token_usage_record.response_id、item_completed.item.id或response_item.id，确实没有时为null，不编替代ID。ordinal/seq必须非负safe integer；同身份同值完整副本先折叠一次，不同值报冲突；“唯一有序”约束应用在去重后。recordSha256是该记录canonical JSON的SHA256；prefixSha256是去重后从header至lastPosition的已观察完整前缀各canonical JSON加LF拼接的SHA256；同值重复行在指纹与计数前一并折叠，不因后来追加同值副本误报前缀改变。canonical JSON定义为递归按Object.keys(...).sort()排序对象键、数组保持顺序，再JSON.stringify，无空白，UTF-8；这是一致性指纹，不冒原文件逐字节hash。observedAt等于本次实际cutoff；cumulative的at/eventRef是原累计点真实时间/位置，两者不得混用。

当前snapshot只消费不晚于until的完整连续前缀；遇首个timestamp>until的完整事件就停止该次消费，后缀留下一笔，不越过未来事件更新lastPosition。只读解码可能已看见该后缀，但不能把它记为已消费位置。无合法带位置完整事件时lastPosition/prefixSha256=null；不以header伪造seq0/ordinal0执行基线。snapshot本身是本次观察，可在阶段差值不可用时仍保存确实得到的累计值，用来让下一笔恢复有效增量，不回写旧结果。

带previousBoundaries时，先核每项observedAt与window.from相等，再从实际原件核sourcePath、header sessionId/family、前笔position的seq/ordinal/eventId/recordSha256及prefixSha256，核前笔cumulative每点在该前缀内的series/metric/eventRef/at/value仍相等。任何缺位置、改ID/内容/前缀、跨线程或换series均报previous_boundary_mismatch，说明实际原因，受影响指标unavailable/exit1；不能重找“看起来相近”的点/默默当新线程/改旧账。缺source只影响该source和依赖它的完整合计，其它可信会话保留。当前新观察可按真实数据留新snapshot与缺口，以后从此真实点开始，不能称旧缺口已恢复。

后续归属先按已核position划分：已消费前缀不重计；position之后新事件若timestamp==from，即使标量窗写(from,until]也只归本次，因为上一笔没有观察它；若timestamp>from且<=until同样归本次。position之后事件timestamp<from则显式late_event_before_window，保eventRef/原时间/受影响指标，相关指标unavailable，不silent skip、不塞入当前正常总量、不回写历史；当前快照仍记录真实已观察位置，过去缺口一直可见。新source没有前笔已读位置时按首/后窗时间规则求值；若from同timestamp归属无法确定则boundary_position_unavailable，不猜哪一笔已经算过。

Codex前后差分优先取该source前笔实际cumulative快照为C(from)，必须在原件位点验证一致；绝不能重读后把新追加的同timestamp累计值当作“原C(from)”。本次C(until)取该次已消费前缀内最后真实点。前笔快照没有该metric时，只有严格早于from的真实累计点或合同3正面完整前缀证明的0可作有据基线；恰等于from而无前笔位点不能猜。即使前笔窗口from未知/结果unavailable，只要前笔until及累计快照真实，本次可以从它得到有效差值；这不将前笔unknown变0。DSH前笔位置同样用于排除旧正式消息/计数，只计新位置有效事件。

下面是专为边界oracle构造的最小示例，不冒真实样本。source当前有三行：header ordinal0、r1 ordinal1、后来追加r2 ordinal2；r1/r2时间完全相同。上一行实际看过到ordinal1、input10/output2/cache4；本次新增累计input16/output3/cache4，期望差6/1/0而非0/0/0；window跨度仍为实际一分钟。previousBoundaries中的hash按上面的完整prefix定义可复算。

~~~json
{
  "sources": [
    {
      "sourcePath": "/tmp/codex-boundary.jsonl",
      "records": [
        {
          "timestamp": "2026-10-15T00:00:00.000Z",
          "ordinal": 0,
          "type": "session_meta",
          "payload": {
            "id": "controlled-thread",
            "session_id": "controlled-thread",
            "thread_source": "user"
          }
        },
        {
          "timestamp": "2026-10-15T00:00:00.000Z",
          "ordinal": 1,
          "type": "token_usage_record",
          "payload": {
            "thread_id": "controlled-thread",
            "session_id": "controlled-thread",
            "response_id": "r1",
            "thread_token_usage": {
              "input_tokens": 10,
              "output_tokens": 2,
              "cached_input_tokens": 4
            }
          }
        },
        {
          "timestamp": "2026-10-15T00:00:00.000Z",
          "ordinal": 2,
          "type": "token_usage_record",
          "payload": {
            "thread_id": "controlled-thread",
            "session_id": "controlled-thread",
            "response_id": "r2",
            "thread_token_usage": {
              "input_tokens": 16,
              "output_tokens": 3,
              "cached_input_tokens": 4
            }
          }
        }
      ]
    }
  ],
  "options": {
    "window": {
      "from": "2026-10-15T00:00:00.000Z",
      "until": "2026-10-15T00:01:00.000Z",
      "includeFrom": false,
      "startRef": null,
      "previousBoundaries": [
        {
          "sourcePath": "/tmp/codex-boundary.jsonl",
          "sessionId": "controlled-thread",
          "family": "codex",
          "observedAt": "2026-10-15T00:00:00.000Z",
          "lastPosition": {
            "kind": "codex_ordinal",
            "ordinal": 1,
            "eventId": "r1",
            "recordSha256": "7bffc0447f48eeaee3b7cc34f9a14e3dc83229cb4dba79b8001e004af0af0b91"
          },
          "prefixSha256": "636682bc56e89bee39e6c420e4f681a9497a56a283cfaed49d11a144a0ec77ac",
          "cumulative": [
            {
              "metric": "inputTokens",
              "series": "token_usage_record.thread_token_usage",
              "eventRef": "/tmp/codex-boundary.jsonl#ordinal=1",
              "at": "2026-10-15T00:00:00.000Z",
              "value": 10
            },
            {
              "metric": "outputTokens",
              "series": "token_usage_record.thread_token_usage",
              "eventRef": "/tmp/codex-boundary.jsonl#ordinal=1",
              "at": "2026-10-15T00:00:00.000Z",
              "value": 2
            },
            {
              "metric": "cacheReadTokens",
              "series": "token_usage_record.thread_token_usage",
              "eventRef": "/tmp/codex-boundary.jsonl#ordinal=1",
              "at": "2026-10-15T00:00:00.000Z",
              "value": 4
            }
          ]
        }
      ]
    }
  },
  "expectedUsageDelta": {
    "inputTokens": 6,
    "outputTokens": 1,
    "cacheReadTokens": 0
  },
  "expectedCurrentPosition": {
    "kind": "codex_ordinal",
    "ordinal": 2,
    "eventId": "r2"
  }
}
~~~
DSH同形边界的lastPosition改为`{kind:"dsh_seq",seq:<原事件seq>,eventId:<真实消息/callID或null>,recordSha256:<同canonical hash>}`，family=dsh、sessionId取header.id、cumulative=[]；不得拿seq当token累计。测试还须分别变更旧位点/前缀、追加同timestamp重复请求、追加更早迟到记录、首笔缺snapshot，逐项核不重不漏/显式缺口。

#### 合同3：字段、去重、累计与退出

DSH支持无版本文件+header.version=0、v3+3、v4+4；文件名与首行冲突/未知代次报unavailable，不偷偷认旧代。只读assistant/message.data.usage，忽略stream.*.chunk.usage；inputTokens/outputTokens/cacheReadTokens必需，cacheWriteTokens/reasoningTokens可选，缺not_reported。旧两代不保证有推理：本次v3真源没有。totalTokens仅作辅助，不拼含缓存总量，不反推缺字段；源input口径不自行换算。

正式消息按message.id去重，事件按sessionId+seq、turn/step核一致性；同消息同值副本只取一次，同ID异值conflicting_usage，不选较大/较新或相加。缺稳定message.id使该用量不可用，不用正文hash猜请求。step/start按sessionId+turn+step、turn/start按sessionId+turn、tool/call按sessionId+callId去重；重复冲突显露。toolCalls是全部tool/call；subagentCalls是name=subagent；commandCalls是name=bash或pwsh的命令工具发起次数，不是shell内部子进程数。完整源观察不到该类事件时才可0。seed/fork不能重复计算继承前缀：DSH显式session/end-seed且data.inherited=true定位前缀；Codex用subagent_history_start_ordinal。检测继承却无可靠界限则相关指标unavailable，不按同正文删数据。

Codex线程身份为session_meta.payload.id，payload.session_id可能是整棵树根。仅消费本thread_id的同一连续累计series：优先token_usage_record.payload.thread_token_usage；该系列完全不存在才可全程用event_msg/token_count.info.total_token_usage。series名固定token_usage_record.thread_token_usage或event_msg.token_count.total_token_usage，不能同一差分换源；last_token_usage、单请求usage、turn_token_usage均不加到thread累计。response_id/usage仅去重与一致性辅助。首窗/无前笔时按合同2位点规则取有据边界累计点；后续C(from)取前笔已观察并经原件验证的cumulative快照，C(until)取本次前缀末点，逐字段相减。重复点同值只用一次，异值/倒退/重置/缺基线该指标unavailable。C(from)=0必须有以下正面完整前缀证据；线程创建在窗内仅是可能条件，不是唯一条件，也不凭创建时间独自推出0。不得任意缺值填0。cumulativePoints保sourceRef/threadId/series/metric与两端真实eventRef/at/value，可回读实际容器时间，不以记录时刻替代。


零baseline的正面证明只适用于原记录所定义的本thread累计系列，必须同时具备：真实session_meta建立线程身份；从该线程最初header开始的完整已读记录前缀，ordinal从0连续且无缺行/截断/读错/替换；不存在未界定或已省略的历史、继承、compaction/上下文压缩、paginated导出；from前没有任何用量点，且该完整前缀证明没有本线程模型/响应/工具执行等可能已消耗却尚未上报的活动，没有无法解释的事件或计数重置。满足这些条件，即使header创建比from早，也可将“该源可观察累计在from前为0”作为有据基线；输出注明完整前缀依据，而不说实际服务计费绝对为0。已有真实累计点直接报告0时按该点计算，不需要靠缺值推断。

以下均不能证明0：仅metadata时间在窗内/附近、仅“没看到token行”、删除parent_thread_id/history_mode/subagent_history_start_ordinal来伪装主线程、保留compaction却声称无继承、最小脱敏fixture有ordinal缺口却冒完整前缀、未知或截断历史、替换过源而无连续性证据。对应指标unavailable并列具体基线缺口，不能为测试期望换规则。物理zstd无损解压本身不等于逻辑历史压缩：校验成功且解压后完整连续可继续核前缀；但compaction/继承/分页/ordinal缺口不能以压缩文件可解码为由忽略。保留真实已有累计点/前笔快照差分的其它可信范围，不因隐式零基线不可用整份丢弃。

实读界限：EFACT-006原43行Codex源header是history_mode=paginated、存在parent_thread_id和subagent_history_start_ordinal=2，ordinal1为compaction；原始ordinal0—42完整。当前最小fixture是经抽取的事件，不具有完整前缀证明。冻结integration的codexMain构造删除上述继承/分页字段但仍保留compaction和抽样ordinal缺口，其“header早start1ms即可累计绝对值”的期望缺证，不能算已证明的合法0。该测试数据/期望由原测试owner按具名TCR与独立非实施者核定，旧字节/原RED保留；本作者不改冻结测试、不把构造伪装真实源，也不据此宣布实施可通过该case。

Codex input_tokens/output_tokens/cached_input_tokens必需，cache_write_input_tokens/reasoning_output_tokens可选；cached为源input子量不再次加总。turn_context按turn_id去重；响应数明确为response_item条数，包含message/reasoning/tool output等，不冒DSH步骤或模型请求数。Codex工具/子代理/命令组始终not_reported:unsupported_in_this_task，锁定AC-013；新核CommandExecution/CollabAgentToolCall/SubAgentActivity只记OI-020事实。

exit0：required读取/计算有效，record时新增行已读回；可选字段、宿主注入无入口、审查provider未报、Codex未支持工具组/未适用family等明确预期缺报可0，但仍列缺报。exit1：合法调用发生required源/解析/用量/时间基线/子文件缺失、冲突、取消、账本失败，输出可信部分。exit2：错误参数/record缺身份或阶段、纯函数错误入参或自身异常。零输入不0。无非预期issue时Measurement.status=available，否则incomplete；这不是质量或阶段完成判定。

#### 合同4：自动定位、后代与首窗口

DSH读真实DSH_SESSION_ID，根取DSH_HOME或homedir()/.dsh下sessions；项目候选只有认证cwd、task workspace、manifest.target_repo_root有限集合，不能把工具cwd当会话创建cwd。projectKey按UTF-16码元处理：/、反斜杠、冒号连续段变一个-；安全A-Z/a-z/0-9/._-保留，其他含~为~XXXX大写；去前导-后空为root，截251码元，外包--。sessionId单段同样编码，单独.与..特殊转义。只在该精确session目录识别session.jsonl、session.vN.jsonl及.zstd，选择最高实际代次并核header.id/cwd。多代同逻辑会话不得逐代求和；未知更高代不能静默退旧版，多路径同ID不一致报冲突。自定义根/候选找不到报unavailable，可显式复跑，不递归查历史。

Codex根取实际CODEX_HOME或homedir()/.codex；自动用CODEX_THREAD_ID核header.payload.id；CODEX_SESSION_ID仅辅助根归属。THREAD_ID缺失时，仅SESSION_ID候选首行id同值且非subagent才可用。UUIDv7前48bit毫秒只定位日期线索，因本地/UTC跨日仅查该日期及相邻两日sessions/archived_sessions叶目录，按完整UUID精确匹配，不遍历其他日期、不挑最新文件。非v7无线索则无参unavailable。文件名UUID、首行id、usage.thread_id必须一致；明文/压缩副本一致只取一份，不一致报冲突。无参record若当前线程为subagent，报stage_caller_is_subagent；必须阶段主会话直接执行，不能拿根SESSION_ID混算父成本。

子来源只来自已读父事件：DSH subagent/catalog.data.childId/childCreatedAt，按父header.cwd直达child目录，子header.parentSession反核；源程序childSessionMeta确实继承父cwd。Codex只从父item_completed.item中的SubAgentActivity.agent_thread_id或CollabAgentToolCall.receiver_thread_ids取UUID，再核子header.parent_thread_id，排除仅接收消息而非本父派出的非子线程。spawn_agent output可能只有task_name，不猜UUID。递归沿已证关系，以sessionId访问集防环/重复。缺子文件列ID；派出次数、找到份数、已核归属数分开。来源集合仅当前/账本明确refs与其后代，不扫描别的头反找归属。

首次record的start-ref严格选择真实开工事件：DSH #seq=<非负十进制safe integer>匹配恰好一条user/message，取time；Codex #item_id=<URI编码真实item.id>匹配恰好一条event_msg/item_completed且item.type=UserMessage，取该行timestamp。解码ID非空且无控制符/路径分隔符；无匹配/多匹配不可用，不按正文关键词搜索。阶段主会话负责从当前task真实原件指明开工事件，脚本核身份/时间，不新增tracker或要求用户每次给路径。start-ref对应会话同时作为明确任务根source保留，支持本卡跨DSH/Codex续跑。

本卡可用原件：/Users/Hugh/.dsh/sessions/--Users-Hugh-Hugh-Project-workflowhub--/session-d72c6146-1cf4-4c2c-ba48-0e279bc4d0c5/session.v4.jsonl.zstd#seq=9，时间2026-10-15T11:44:15.860Z。task.created_at=11:48:16.787Z晚240.927秒，task-bootstrap.mjs:108创建时new Date()；metadata创建时刻和会话开始均不可默认任务开工。

首笔有据时含首末[from,until]；以后以(from,until]加合同2已读位置为完整边界：同timestamp后来追加归新笔，更早迟到显式缺口，不只凭标量时间筛掉。只读无边界是日志全窗，明确不冒任务窗口。首次缺起点仍锁内采样真实until、追加窗口unavailable行，绝不假用task.created_at算此前。失败/缺口行只要有真实until，下次即取它为from，过去unknown保留不倒填；重读明确sources验证前笔位置与累计快照作为C(from)，可从这个实际观察点开始下一有效增量，不永远卡首次unknown。缺某指标基线只影响该指标。连until都没取到则不写假边界行，下一次仍读最后持久行。

#### 合同5：时间口径

wallMs=until-from，明确包含等待；sessionSpanSumMs为每会话有效执行事件首末与窗口交集跨度之和，按AC-003列每会话明细与求和，但不冒任务墙钟。不同父子可并行，跨度和可大于wall。任务from未知时wall/active/waiting unavailable，会话自身可信跨度仍列但不冒阶段成本。

DSH同turn的turn/start与turn/end、Codex同turn_id的event_msg/task_started与task_complete配对；区间裁窗后先逐会话、再跨父子求并集为activeUnionMs，waitingMs=wallMs-activeUnionMs。有真实start的当前open轮次可裁至until并标open_turn；正式名为轮次内时长，不称模型计算/CPU时间。缺start有end、重复冲突、负区间或继承界限不明使对应指标unavailable；缺子文件使完整活动/等待unavailable，保已读细节。完整合法空区间集才可0。ms原数不提前四舍五入。

阶段归属是时间切片，源无stage标记；迟写累计用量按真实观察点归下一差分，不能声称精确推理发生时刻。实际累计点时间与本次记录时间分别显示。

#### 合同6：唯一md账本与事务

固定目标taskPath/main-agent-cost.md；不写仓库/全局metrics/facts/index，不建sidecar、版本状态或累计schema。表头完整逐字冻结：

~~~text
| 记录时间(UTC) | 阶段 | from(UTC) | until(UTC) | 起点来源 | 窗口状态 | 任务墙钟(ms) | 会话跨度和(ms) | 轮次内并集(ms) | 等待(ms) | 输入(token) | 输出(token) | 缓存读(token) | 缓存写(token) | 推理(token) | DSH步骤(次) | Codex响应项(次) | 轮次(次) | 工具调用(次) | 子代理调用(次) | 命令调用(次) | 宿主实际注入(byte) | 审查provider上报(原口径) | 当前材料(byte) | 来源refs | 会话明细与累计点 | 缺报与错误 |
~~~

第二行同列数Markdown分隔行，每次完整逻辑追加一行。历史表头/行截断/列数异常拒绝修改，显露ledger_format_invalid并写实际handoff缺口，不升级/重建/删旧行。数值格十进制整数；缺报为not_reported:<reason>，失效为unavailable:<reason>，不空白或0。provider格为具名provider按合同7投影的真实数量字段、usage_status/result ref紧凑JSON；不复制整个usage对象，金额/价格字段省略，缺报与错误格列省略说明及原ref。来源refs格为原件路径数组。会话明细与累计点格是合同2 sessions紧凑JSON，保存每会话原数、refs、observedBoundaries的每source位置/前缀指纹/实际累计，及thread/series/两端eventRef/at/value，便于后续重读既有明确源，不是第二持久对象。缺报与错误格保存issues，不存正文/arguments/preset/凭据/完整日志。

格内容先生成文本/JSON，再依次转义&为&amp;、反斜杠为&#92;、竖线为&#124;、CR/LF为&#13;/&#10;、小于/大于为&lt;/&gt;。读取仅对已知实体单次还原，再解析JSON，不执行HTML或用<br>拆数据。管线/换行/反斜杠路径无损回读。记录时间是实际发布前时刻，until是锁内采样cutoff，分别保存。

完整record顺序：核任务→task.withRecordLock("main-agent-cost",...)→锁内读/校验旧账→取最后真实until与既有task source refs→锁内采样until→定位/读取本次source/材料/current review ref→measureSessions→拼完整行→task.writeRecordAtomic("main-agent-cost.md", oldBytes+newRow)→读回旧字节严格前缀和新增行→释放锁。禁止锁外读旧账/采样/source后仅锁内写。复用record-lock/safe-write，不造锁协议、不删别人锁。底层原子replace承接逻辑追加，历史字节不得改变。

源读失败可写账时仍记缺口行及真实until、exit1；此行也是全部尝试。账本不可写、格式损坏、锁失败或取消未发布时不谎称新增，stderr与实际handoff写“本阶段无记录+错误”。AbortSignal传解压进程，取消释放自己的锁/临时资源、不半行；若发布已成功后才取消，读回保“已发布+随后取消”，不删除行。记账失败不阻止阶段收尾，不形成新gate。

#### 合同7：三来源精确读集

宿主实际注入byte：当前无权威producer，not_reported:no_authoritative_host_injection_source；不得拿request header/常驻方法大小/材料bytes/会话input token代替，不新增埋点/网络。

审查provider实际上报：只读入口可显式提供stage；有任务身份但未提供stage时reviewProviderUsage=not_reported:stage_not_supplied，不从当前facts、最近记录、分支或材料猜stage；没有任务身份仍为not_reported:task_not_supplied。只有已提供合法stage才读取readTaskFacts，过滤record_kind=stage且stage严格等于指定值。0条为not_reported:no_stage_fact；1条只从这条现有stage事实读取review_result_ref；超过1条是异常来源review_source_ambiguity，reviewProviderUsage=unavailable、exit1，不挑第一/最后、不扫描reports找替代、不把多行视为正常attempt历史。ref按现owner解读：裸非空string直接使用；plain object包装仅解其value，value为唯一非空string时使用，额外未消费metadata不影响唯一性，不能新设仅value/reason字段schema拒合法包装；`{value:null,reason}`按现owner未审查/未上报状态为not_reported。value为数组、空/不确定字符串、无合法唯一value或其它真歧义则review_source_ambiguity、unavailable/exit1，不能猜取数组首项。只openTask保护读已明确的单一ref，不遍历review历史；读取后核completed_at为真实有效时间且落在该次窗口，之前报告为no_new_report_in_window，缺失/坏时间为来源不可用，不伪造成窗内。唯一producer review-record-route.mjs保存review_facts.providers[]的provider/status/usage/usage_status；reportedUsage只认非空对象并未统一token键，不能因此把整对象当可展示数量。review原件完整只读保留；CLI展示和账本只投影有实际producer口径依据的数量字段，保原键、原数、provider和原ref，不归一、不换算、不与主Agent tokens合计。当前真实015的pi/v4flash仅投影input=267、output=12732、cacheRead=207744、cacheWrite=0、reasoning=11758、totalTokens=220743；其实际pi-ai Usage类型明确这些为token数量，reasoning是output子集，不再相加。原usage中的cost对象即使各值为0也全部省略；cost/price/金额/价表类字段均不得作为数量读数或输出到CLI/账本，在既有issues/来源说明中记省略字段类别与原review ref，不输出其金额值、不改写原件。其它producer或未来字段只沿已核实数量口径投影；未识别字段不猜单位、不递归透传，数量口径未核实的缺报须明列，不伪造数量或货币换算。usage_coverage.reported/total只是上报数量，不是token。无ref或未上报为预期not_reported；声明reported却坏类型/冲突、真实ref不可读为unavailable并显露错误。该ref.completed_at落本窗口才显示本窗报告，之前同ref为not_reported:no_new_report_in_window，不每阶段重复当增量；scope明确当前stage指向的review原件，不冒整任务所有review成本。不用主Agent会话token填审查provider栏，不实现provider补报，不输出findings/raw正文。

当前owner事实：runtime/task/task-store.mjs的writeStageRow在锁内按record_kind+stage查找并原位替换（91—103行），不是append同stage多attempt；currentRow的conducted分支（76行）接受string或plain wrapper.value的非空string，未限制wrapper额外metadata；默认未审查为value:null及reason。readTaskFacts只解析/保留现有普通事实，历史/手工异常可能传来重复行或异形ref，所以本段补消费者异常语义，不新增producer字段、attempt join、phase历史或额外账本。该stage单ref只限定本次读取来源，不宣称代表整任务历次审查。P2实施者在唯一末验收前按phases/P2.md本Task的manual输入异常程序，以受控临时task验证0条、1条合法string/合法wrapper/null缺报、重复stage行/value数组等真歧义，原测试owner的冻结Node断言不改；独立验收者读真实返回/ref/缺口，未执行不报自动覆盖。

材料byte：读认证checkout/specs/<task>原字节，make-decision仅decision-log.md；其余三阶段为decision-log.md、spec.md、phases/index.md与index实际权威引用的物理Phase。复用materialFilesForCohort/phaseFilesFromIndex，不猜P文件名、不读post无关plan/tasks；build-plan尚未生成项、缺索引/文件、损坏/逃逸/重复或不可读均unavailable，不能当0。每ref读一次，仅全部成功才求和；保path+byteCount+sha256内存明细与本行来源说明，不复制材料正文。大小是采样材料体积，不是阶段读取次数或宿主注入总量。无任务身份的纯显式模式not_reported:task_not_supplied，不扫材料目录。

#### 合同8：挂点、写集、Phase与验证

四阶段末步主会话在本次已授权图更新、非破坏性交付与收口工作取得各自实际结果后、生成最终交接前直接record，流程传project/task/stage，首次传已有真实start-ref；回读行/缺口后写同一handoff。图的代码/文档状态、未批准付费路径及收口失败各自如实披露，不因本次计量变成完成或工作许可。若现收口将删除唯一可用的工具worktree，caller在物理删除前先record并回读外置task根账本，再继续既有授权内的删除/清理；记录实际until，handoff明确until之后的物理清理、最终交接发布和回复不计入该笔。阶段观测切片与最终physical close分别报告，不补假行覆盖采样后的动作。

执行入口与会话来源分别核实：当前只知道计划工具位于任务worktree，不默认目标repo已交付同版CLI或其runtime import闭包，更不在原树消失后默认原cwd/入口可用。若未来从存续入口运行，先核该入口真实路径、代码版本/依赖闭包、外置task访问与原主会话身份和有限source候选；工具执行cwd不能冒DSH原会话创建cwd，不能用子代理环境、挑最新或全历史搜索补身份。缺可证存续入口时采用上述删前record，不扩CLI参数/自动定位算法。shared stage-closeout、knowledge-graph和stage-handoff保持原职责；record仍归四阶段caller与唯一现脚本，不新增共享writer、第五个build-prd挂点或第二账本。触发未执行/没行须在实际handoff写“本阶段无记录+原因”，不新增自动成功或后台补记。通用skills/stage-handoff/SKILL.md不加owner/writer；stage-reflection仅可选核账。

| 精确路径 | 动作/职责 | 唯一写owner与consumer | 替代与删除/保留条件 |
| --- | --- | --- | --- |
| tools/cli/measure-main-agent-cost.mjs | NEW纯测量/CLI/唯一账本包装 | P1先写，P2串行扩展；四阶段末步、人工调用、两Node测试消费 | 替代临时手工测量；官方稳定入口完全承接后连挂点移除 |
| tests/contract/measure-main-agent-cost.node-test.mjs | NEW，P1纯函数/显式CLI；P2串行受影响补例 | P1测试作者→P2；node --test消费 | 脚本全部consumer退役后随行为删除 |
| tests/integration/main-agent-cost-closeout.node-test.mjs | NEW，P2自动/账本/挂点/唯一末验收 | P2测试作者；node --test/验收者消费 | 自动留账职责正式退役后删除 |
| tests/fixtures/main-agent-cost/dsh-v0.jsonl | NEW，既有v0真实源最小脱敏事件 | P1测试作者；两Node文件消费 | 该代职责正式退役且无consumer后删除 |
| tests/fixtures/main-agent-cost/dsh-v3.jsonl | NEW，既有v3最小脱敏事件 | 同上 | 同上 |
| tests/fixtures/main-agent-cost/dsh-v4.jsonl | NEW，保正式/stream双副本最小事件 | 同上 | 同上 |
| tests/fixtures/main-agent-cost/codex.jsonl | NEW，保同thread累计的最小事件 | 同上 | 同上 |
| workflows/make-decision/SKILL.md | MODIFY第15步stage-handoff | P2；阶段主会话 | 官方入口承接后去调用 |
| workflows/make-decision/steps.json | MODIFY step_id15 observable_result | P2；现有manifest消费者 | 与方法同批一致，id/slug/schema不变 |
| workflows/build-plan/SKILL.md | MODIFY第12步confirm-plan-and-handoff | P2；阶段主会话 | 同收尾调用条件 |
| workflows/build-plan/steps.json | MODIFY step_id12 observable_result | P2；现有manifest消费者 | 同上 |
| workflows/build-code/SKILL.md | MODIFY第12步stage-handoff | P2；整个stage末主会话，不每Phase调用 | 同收尾调用条件 |
| workflows/build-code/steps.json | MODIFY step_id12 observable_result | P2；现有manifest消费者 | 同上 |
| workflows/verify-code/SKILL.md | MODIFY第8步与阶段末说明相关一句 | P2；终末阶段主会话 | 同收尾调用条件 |
| workflows/verify-code/steps.json | MODIFY step_id8 observable_result | P2；现有manifest消费者 | 同上 |
| skills/stage-reflection/SKILL.md | MODIFY可选核已记账行，非唯一触发 | P2；选择复盘的主会话 | 成本职责退役去说明 |
| THIRD_PARTY_NOTICES.md | MODIFY两源版权/许可及固定内容引用，复用已有MIT正文 | P1唯一写主；分发/审查与P2验收者消费 | 采用全部退役后按既有notice owner处理，旧版权不删 |
| skills/catalog.yaml | MODIFY既有projects两源及三采用普通元数据/注释，不伪新skill | P1唯一写主；既有来源登记/人读投影消费 | 无新dispatch或持久对象，原登记owner保留 |
| skills/reuse-registry.md | MODIFY三项采用/差异/首次consumer的人读投影 | P1唯一写主；维护者/P2验收者消费 | catalog为来源原件，不另建采用账本 |
| docs/architecture/move-map.json | MODIFY登记新职责与实际consumer | P1先登记、P2串行完善；治理/实施/审查消费 | 不作许可；真实职责/consumer退役后按owner处理 |
| taskroot/main-agent-cost.md | NEW运行产物，单一md账本 | record按锁追加；使用者/后续材料作者消费 | 官方观测完全承接前保留，close不擅删历史 |
| runtime/task/load-config.mjs、task-handle.mjs、task-store.mjs、material-workspace.mjs；runtime/evidence/storage-root.mjs；runtime/interface/record-lock.mjs、safe-write.mjs | REUSE既有导出，不改实现 | 新脚本为直接consumer，move-map同步直接引用 | 现owner/删除条件保留，不复制实现 |

四份steps仅末步observable_result增加调用→真实行/缺口→交接回读，不改completion_evidence、不增stage/step/schema/状态。move-map脚本module_consumers列四阶段真实文件和实际import测试；named_data_readers列账本人读角色，不写无模块consumer；新增测试/fixture同样逐项登记。共享脚本/测试/move-map严格串行。DO NOT TOUCH：metrics/**、verify-code/metrics-writer及旧测试；runtime公共命令与task/review writer/schema；core/scripts兼容区；历史raw/review/handoff及specs/archive、docs/research；protected断言。无新package依赖、服务/端口/DB/定时器、全局store、金额/价格表。

P1“显式读数”→P2“自动留账与唯一末验收”。P1完成纯函数/显式CLI、字段/去重/累计窗口/错误及真实源核读；P2消费P1真实接口，串行加环境定位、首/失败边界、三来源、受保护账本与四阶段调用，再作唯一完整AC末验收。每Phase边写边验证并独立审查；P1结果不冒整卡通过。当前计划设计材料已经存在：phases/P1.md、phases/P2.md及纯指针phases/index.md；这是计划文件已写入，不代表实施已开始、测试业务已通过或阶段已获确认。

四fixture必须从EFACT-005/006已知真源抽最小所需事件并脱敏：去正文/arguments/结果正文/环境/preset/凭据，保指标与必要身份/父子/时间关系，说明改过的ID/路径/时间。原ref+hash/选择与脱敏说明写测试源码fixture说明，不新建README/报告；unknown/malformed/重置/冲突等在测试内存构造并标构造。zstd按次在测试临时目录压缩已有fixture字节，不提交压缩副本。真实三代/两编码/第二样本复跑必须直接读原件，保path+hash/脱敏读数/argv/cwd/exit，不能fixture冒真实验收；不保存整目录或会话副本。


#### 三项采用的首次生效与普通登记

上游只读specs/archive/skills-framework-redesign-20261014/prd.md的N1共享资源责任、54项首次生效规则及本任务research A4要求本卡直接完成来源/采用内容/本地差异/普通登记/许可notice，不交N2/N11补尾，不另建采用账本。本轮直接实读固定原文件/许可，来源如下；这些是可核采用依据，不冒实现生效。

| 来源条目与固定字节 | 采用内容与本地差异 | 首consumer与验证 |
| --- | --- | --- |
| addyosmani/agent-skills，git HEAD aeac41d4d005999432bb7312f7ff06383a91d59d；skills/observability-and-instrumentation/SKILL.md，sha256 e7fcb0820306d46268de9594d676ad98e35040858926c412b7000faa52a61f87 | 问题→信号与遥测自验；按R-009不固定2–4问题，不建设遥测平台；输出邻接真实消费问题且数字可独立复跑 | P1脚本的人读四组与原数核对；P1/T001原样本/坏字段/重复副本负例，P2最终消费其实际原ref |
| 同一addy固定commit；skills/performance-optimization/SKILL.md，sha256 bd36a30e55a5f84329a6977eba5e1ab7654146e71eaba88e34337d4ee020460f | 同命令/条件/预算、噪声与所有尝试；按R-029工具不产收益判决，R-032追加保全部尝试，不自动回滚用户/上游改动；只撤没有其它已确认价值的本次实验且留理由，不能删不利尝试 | P1显式可复跑/不宣收益与来源首交，P2账本全部尝试/返工负例；N1整卡本次首次consumer闭合，不以P1局部绿冒整项完成 |
| backnotprop/pstack读取包sha256 f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8；skills/principle-explain-the-number/SKILL.md，sha256 cd5a25f9e7cf023627ccb470dc5faa97542f29b4319496a32b839a8e1e988047 | 运行次数/spread/具名limiter或unknown及替代解释；六嫌疑仅提示不凑门；按已选方向工具只给原数不宣收益，未具profiler/计数器事实时不得把代码猜测当limiter | P1输出scope/缺报与原数，P2账本保原数/全部尝试供人对照；验收输出无无据收益、缺条件不伪造解释 |

实际源码位置只作本轮来源：/private/tmp/wh-ext/addy-agent-skills（git HEAD已核），/tmp/pstack-research/pstack-main（无.git）；生产不得import这些路径。pstack无git历史，API观察短HEAD 1f0f9c3bac与镜像上游坐标只保原research事实，不能证明包等于该commit；以读取包hash+子文件hash固定实际内容，不伪造commit pin。原研究为上游任务quality/evidence/research/s1-skills/backnotprop-pstack.md §0/1.4；本地三文件当前已实读，许可也已核正文。

addy LICENSE为MIT，Copyright (c) 2025 Addy Osmani，sha256 6f202f8bd568cd730dbb2b0d1f8e243bc74c2fa1f64dbce9b2c7ea08bd5c9fd7；pstack LICENSE为MIT，Copyright (c) 2026 Lauren Tan，sha256 bc957ca6bee02792566a1a028d105e02e247c6e77cf057061674273da77b200e。pstack的MIRROR来源/其API commit与包绑定仍有上述范围限制，不将MIT正文已读冒所有历史许可链都已证明；其它未读许可或commit缺证保持unknown。

P1/T001与首脚本consumer同批唯一写主串行补三份既有普通文件：THIRD_PARTY_NOTICES.md增加两源/版权/固定内容引用，并复用既有完整MIT文本保版权许可，不搬整包或另写LICENSE副本；skills/catalog.yaml在既有projects登记两来源及固定commit或明确unresolved-pstack内容hash，三条原路径/采用内容/差异/consumer作为普通来源元数据或注释，不虚构新skills注册/新顶层采用对象/active dependency；skills/reuse-registry.md仅在人读投影补三采用及N1 owner/实际脚本/测试/来源引用，catalog仍为登记原件，不复制另一采用账本。未实施前不把review_outcome写accepted或说生效；pstack commit未知明标，不能把tarhash塞成git commit。

三文件共享写入锁内重读、当次唯一P1 writer；P2只核P1实际登记/notice/首consumer与本Phase账本效果原ref，不借同批合入掩盖缺闭包。三路径必须纳入move-map实际职责/consumer，现有普通文件原owner/保留条件不变；新增N1条目在对应采用及全部consumer真实退役后处理，不能删旧来源。U-001来源引用使用任务库quality/evidence/decision-log-refs/requirement-change-log.md文件路径并文字定位“U-001条目”，不猜自动锚点、不改原件。


### Global Verification Strategy

固定入口 `node --test tests/contract/measure-main-agent-cost.node-test.mjs` 与 `node --test tests/integration/main-agent-cost-closeout.node-test.mjs`；按下列现有oracle逐面执行，保raw/exit/覆盖，不运行全量。P1=ORACLE-COST-READ、P2=ORACLE-COST-LEDGER，其余子oracle保持当前AC强度。新Node文件不进Vitest默认套件；日常受影响检查同条件成本无法比较则unknown，不冒无扩大。

~~~sh
node --test tests/contract/measure-main-agent-cost.node-test.mjs
node --test tests/integration/main-agent-cost-closeout.node-test.mjs
node --test tests/contract/measure-main-agent-cost.node-test.mjs tests/integration/main-agent-cost-closeout.node-test.mjs
node --check tools/cli/measure-main-agent-cost.mjs
~~~

P1第一条与语法；P2第二条，唯一末验收两文件聚合一次，不机械重复。READ覆盖显式/代次/压缩；WINDOW覆盖去重/累计/首末/活动并集；MISSING覆盖零输入/坏字段/未知/取消/权限；LEDGER覆盖自动/重跑/锁并发/旧行保留/失败后下一有效增量；BOUNDARY覆盖解释/三来源/无金额；LOAD核无常驻与默认套件不扩容。真实Node子进程/临时task环境执行重复session、环境父子ID分离、首start-ref、无起点缺口→下一笔、缺baseline局部影响、双record时间不倒置/不覆盖、取消不半行、写失败与handoff可见。静态关键词仅证明接线，不替代CLI行为。未跑逐面写原因/恢复条件。


Node覆盖边界与补充实际验收：两冻结Node文件只证明其实际断言到达的面，不能拿同一Node命令代称未写case已经测过。AUTO缺ID场景即便原件/无关marker hash未变，也仅证明未改写，不能证明未读取或未枚举。P2的具名独立读者在实际实现后、唯一末验收前，沿真实CLI参数分支→自动resolver→每个fs枚举/open与zstd实参逐调用点核对，记录实际文件/符号/目录参数及有限允许集合；发现其它历史目录进入调用即ORACLE-COST-READ/BOUNDARY失败。未能读全动态路径时明确未覆盖，不以hash代证。

权限拒绝、活动源替换/追加漂移在当前两冻结Node文件没有具名case，不能声称已自动覆盖。具体操作、原件与可证伪oracle唯一承接在phases/P2.md的“冻结Node测试之外的三项实际验收”，P2执行者实施完成后执行、独立验收者同Task核对：非root受控临时源chmod000/任务根不可写，先独立probe证真实EACCES，再实际CLI，分别核缺口行/无记录与旧字节保留；活动源在真实首次open/fstat后、最终复核前用本地调试断点暂停，独立进程追加完整事件或同路径rename替换源，保断点/时点/两端stat及实际结果，核非零与源变化issue，不造生产hook/永久控制文件/服务。没进入真实竞态窗口、权限未真正拒绝或工具不可用则该面未覆盖/unavailable，不能以Node总退出码代通过。上述操作只针对本次受控临时输入，不改真实会话或旧证据，不改冻结测试；Phase原owner留manual结果与失败/恢复条件。

便携扫描纠正：tests/host-independence.test.mjs扫core/scripts/metrics、workflow SKILL、技能闭包、CI/少量合同，没扫新增tools/cli、runtime或steps；禁词是退役宿主耦合，不是DSH/Codex名或一切绝对路径。check-skill-consistency只查注册/闭包。新Node测试定点验证本脚本home/env/cwd参数化、无用户绝对路径、有界只读；不扩大旧扫描器。真需复验既有受影响面时仅npx vitest run tests/host-independence.test.mjs并保真实覆盖/失败，不冒新脚本被它覆盖。禁止裸vitest/npm test/test:safe/全量check。

### Requirement-to-Task Trace

本表只连接原来源、FR、同号AC、实际Phase/Task与已声明oracle，不复制Appendix判据；采用登记属于对应任务的既有责任，不另立AC。

| 来源 | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-002、R-008 | FR-COST-001、FR-COST-007 | AC-001 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-003 | FR-COST-003 | AC-002 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-002、R-004 | FR-COST-001、FR-COST-005、FR-COST-014 | AC-003 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-005、R-010 | FR-COST-006、FR-COST-008 | AC-004 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-014、R-006 | FR-COST-002、FR-COST-010 | AC-005 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-007 | FR-COST-009、FR-COST-015 | AC-006 | P2/T002 | ORACLE-COST-LEDGER |
| R-008、R-007 | FR-COST-007、FR-COST-009 | AC-007 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-002 | FR-COST-011 | AC-008 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-010 | FR-COST-008 | AC-009 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-002、R-001、U-001 | FR-COST-011、FR-COST-016 | AC-010 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-022 | FR-COST-004 | AC-011 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-002 | FR-COST-011 | AC-012 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-014、R-022、R-005、R-006、R-004 | FR-COST-002、FR-COST-004、FR-COST-006、FR-COST-010、FR-COST-014 | AC-013 | P1/T001、P2/T002 | ORACLE-COST-READ / ORACLE-COST-LEDGER |
| R-002、R-003、R-004、R-010、R-007、R-024、R-025 | FR-COST-001、FR-COST-003、FR-COST-005、FR-COST-008、FR-COST-009、FR-COST-012、FR-COST-013、FR-COST-014、FR-COST-015 | AC-014 | P2/T002 | ORACLE-COST-LEDGER |

### 工程事实与来源（已核不等于实施）

| EFACT | 实际读取定位/事实 | 使用与限制 |
| --- | --- | --- |
| EFACT-001 | runtime/task/load-config.mjs.resolveCanonicalTaskPath；task-handle.mjs.openTask/readRecord/writeRecordAtomic/withRecordLock；record-lock/safe-write导出 | 复用身份/锁/写保护，不新造owner |
| EFACT-002 | material-workspace.mjs:8 phaseFilesFromIndex/:39 materialFilesForCohort；task-store.mjs当前stage/review_result_ref；review-record-route.mjs:44 reportedUsage/:229—241 review_facts；skills/third-review/lib/adapters/pi.mjs:53、pi-supervised-cli.mjs:93；本机已安装@earendil-works/pi-ai/dist/types.d.ts:289—309的Usage类型；quality/reviews/2026-10-15-015-build-plan-document.json#/review_facts/providers（taskroot原件18476B，sha256 efd1f5ed52c94971a82f6d63a390247d547c6c5d931d792a7c32d1190a8f4ab5） | 材料/审查来源；pi原样转发usage，实际类型将token数量与cost分开；015同时含六个数量键和cost对象，故只投影数量并保原件/ref；usage键未统一，coverage是上报计数而非token量。已安装包仅为本次口径核实来源，不新增宿主路径运行依赖 |
| EFACT-003 | DSH d72c6146原件seq9精确V-001、time1792064655860；seq750使用DSH_SESSION_ID，seq751返回相同session id | 首开工真源/环境真调用；created_at晚240.927秒 |
| EFACT-004 | 已安装 /Applications/DSH Desktop.app/Contents/Resources/app/node_modules/@deepseek-ai/ 下dsh-shell-env/lib/index.js:20,86—89；dsh-subprocess/lib/index.js:13；dsh-home-paths/lib/index.js；dsh-session-persistence-jsonl/lib/index.js:853—936；dsh-subagent/lib/index.js:470—476 | 环境/编码/子cwd定义；生产不得import这些机器绝对路径，升级漂移保unavailable |
| EFACT-005 | DSH root为~/.dsh/sessions；workflowhub编码目录/dd997862-5ea6-43e2-bc3b-163e0e66a00e/session.jsonl.zstd为17消息/17步骤/1轮/36工具，input62404/output15098/cache750720；KnowledgeDigest编码目录/015db1f5-380e-4a35-9f6e-d1bf69015769/session.v3.jsonl.zstd为8/8/1/8，51192/8365/294400；workflowhub编码目录/session-7088960d-5f55-4116-ae6d-318b8d9833c3/session.v4.jsonl.zstd为373/374/31/368，2358831/322485/121517312 | 本轮字段级实读，v3无推理字段；不复制完整记录 |
| EFACT-006 | ~/.codex/sessions/2026/10/03/rollout-2026-10-03T07-02-22-01a0feda-b95f-7163-a9c1-0ea058d0fa95.jsonl.zst：43行/3用量，末累计271369/382/182528；10/15明文01a13fbf父与01a13fd7子首行/usage已核 | id为线程，session_id可能根；活动计数不冒未来固定事实 |
| EFACT-007 | 父DSH subagent/catalog childId/childCreatedAt；父Codex item_completed含CommandExecution/CollabAgentToolCall/SubAgentActivity | 有界子引用与OI-020事实，不扩大Codex调用支持 |
| EFACT-008 | host-independence.activeSurfaceFiles、check-skill-consistency.checkSkillConsistency、vitest.config.mjs include tests/**/*.test.mjs | Node文件用.node-test.mjs避误收，扫描范围如合同8 |
| EFACT-009 | 四steps末步15/12/12/8、已有phase_task_facts；package.json /scripts 与README的CLI入口/文件式workflow说明 | 只改observable_result；本任务无前端写集，不据此断言全repo零UI |
| EFACT-010 | runtime/task/task-store.mjs:34—44的factLines/readTaskFacts保留普通既有行；:76 conducted允许string或plain wrapper.value；:91—103 writeStageRow同record_kind/stage原位replace | 消费者0/1/异常多行及ref唯一性按合同7处理；不新增attempt级join，不拒未消费的合法wrapper metadata |

中途main同步后的增量读集基线为9dc964f02ad0ac3c11cc943ec5d2914aa99f7969中的skills/knowledge-graph/SKILL.md（sha256 b2c1b9329a7e073f098d5f45368be1de6a258b7dbf7535deae842b2d1b69af10）、skills/stage-closeout/SKILL.md（587febcbc86f4d6601720a6fd13082e7caa95d68a03875a5357043d4d1ee7e55）；skills/catalog.yaml当前85143B、sha256 0033bb0afafa2fd6103182a0b29a175a7e9da0a1d8a99f083438e4a033dfb4e4，已登记两方法的native职责/consumer/dependency_closure；docs/architecture/move-map.json当前277806B、sha256 725cbbc13cbe7f02f2f7868281b797f7f76e5c89f2414616a76c29a815c4039d，已保知识owner、shared-closeout、图allowlist及各原consumer。P1/P2实施时读届时当前登记，仅增本卡已声明项，保这些同步入来的职责/closure/图边界，不拿旧基线整份覆写；该基线是本次实读事实，不是跨Phase版本绑定或新门。图产物按既有知识方法另列非源码已知改动，本卡不扩功能写集。

本次归因为“历史补强+当前consumer核验”：quality/evidence/2026-10-16-003-main-sync-independent-impact.md（sha256 b5925d684810e15d1afb3676b9c2a36080450fb3e743b9da52f927af2905b8a4）先直读stage-closeout第7步及caller最终handoff，已指出唯一工具被删除的时序风险；之后004-graph-internal-research.md（sha256 5b4e6d1266c963f6cef4867c7b35368f9e2cc9f0b197a860cc0b5bf8e3da1423）与原执行quality/tests/2026-10-16-005-graph-query-research.json（a5c8a8e27428aba3046880bc42309b5e62de3f0e124fffe36f03d734edaceb0b）补读Card06 decision-log.md:875—891 ADR-024“去门留交接”及751—767 ADR-017删前损失先例，并回当前stage-closeout:64—94核实际保留/删除/交接职责。历史人类确认条款不泛化为本卡新审批门，图也不是该风险的首次发现。query实际展示36/177节点，其余受budget裁剪；当前N1规划尚未入图，会话/窗口没有新增当前实现图依据，原合同维持。这里只记录任务中途同步后的实际增量研究，不追认此前开工已用图，不重新绑定旧确认，也不宣计划approve或生产验收。


### 非UI三来源的组包依据

raw_requirement只读decision-log.md原始需求R-002/003/011/016/024—033与ADR-001、V-001和B-007—010，真实要求为本地记录/CLI/md，无页面/组件/前后端API需求。project_inventory实际读取范围是package.json的name/dependencies/devDependencies/scripts、README.md的项目/命令入口，以及本节逐路径写集和所复用Node模块：npm脚本是check/定向test，新增执行是Node CLI和zstd、本地task材料I/O；此证据说明本任务作用面，不声称未扫描全repo就证明全repo无UI。planned_or_changed_frontend_fact来自本节合同8 NEW/MODIFY/REUSE/DO NOT TOUCH与P1/P2分工，确无前端/页面/组件/HTTP API改动；Phase作者须保持同一写集，若实际改变则重新判适用性。

review组包可用context_map中的原文事实，不用任务名nonUI代来源；各false输入引用包内实际键：raw_requirement.source_ref=#/context_map/raw_requirement，project_inventory.source_ref=#/context_map/project_inventory，planned_or_changed_frontend_fact.source_ref=#/context_map/planned_or_changed_frontend_fact。组包owner将这些键实际放入同一送审对象，值写以上实际source路径/节/读取范围；缺键则保缺失，不写虚假pointer。结论仅本任务non_UI：CLI/md仍须实际验收，对象按唯一模板三源合同实际检查；不创建service/route/viewport填充。

本节只保存轻研究内存结果进入唯一spec的工程设计，不另存研究报告。规划读数不替代后续RED/GREEN/独立审查/验收，真实执行原件仍由所属owner按原路径保存一次。

## Appendix A — 验收判据（唯一权威）

本节完整承接decision-log同号AC-001—AC-014；新增场景和oracle只是具体化，未取消原有强度。所有条目当前均未执行、未通过。预期证据写类型与唯一原件安排，实际路径、命令与结果由Phase/task facts owner填写。AC-010 已按本轮真实用户变更 U-001 移除净字节硬要求；其他改变仍须真实用户决定，不能在实现时静默放宽。

- [ ] **AC-001**：拿一份显式原始记录复跑主Agent成本；关联FR-COST-001、003、007。
验证：ORACLE-COST-READ；对已有真实记录显式传路径，工具运行后独立按原始事件/字段重算四组，逐字段对账；同时验证带路径只消费所给输入，运行入口和精确命令由所属Phase固化。
通过：四组数字可复现且与原始记录逐字段对得上，任一不可得字段与口径差异均明确，不以代理数据造数。
失败：任一数字无法从原始记录推出；只有一次性未能复跑的读数；或显式路径被自动发现的其他历史记录替代。
证据：真实输入路径+hash、实际argv/cwd/exit、工具raw及独立逐字段对账；原始记录留原处，未取得的字段如实保留。

- [ ] **AC-002**：四组指标分列输出；关联FR-COST-003。
验证：ORACLE-COST-READ；在已核实可提供四组的真实DSH样本上逐列读取墙钟、输入/输出/缓存读取token、步骤/轮次、子代理/命令计数，查单位与口径。
通过：墙钟、三类token、步骤与轮次、子代理与命令计数各自成列，不被一个合计值淹没；四组的可用性独立呈现。
失败：只输出一个合计数；任一组被静默省略或不同含义字段无说明混用。
证据：人读输出唯一raw、原始字段对照与格式族标识；缺报组的说明沿AC-004/013。

- [ ] **AC-003**：一次任务横跨多个会话；关联FR-COST-005、014。
验证：ORACLE-COST-WINDOW；显式给跨会话列表并校验各自窗口；用真实父子样本核父记录自身事件中的子会话标识、归属、已匹配/未匹配项及合计。真实跨会话任务不存在时另用构造合法输入验证并明确真实覆盖未取得。
通过：按会话列表分别求和并列明细；窗口包含首末事件，等待是否计入写明；默认计入可核子会话；发现来源仅为父会话记录自身事件；缺记录或未匹配如实列出，不能把调用次数当找到的文件数。
失败：只取单一会话、明细缺失、隐去缺子会话、窗口或等待口径不明，或扫描其他历史目录凑子会话；增量边界重计且未显露。
证据：会话列表、父记录标识来源与各会话路径+hash、窗口/明细/合计raw、缺记录负例；真实与构造证据分开。

- [ ] **AC-004**：坏字段、缺字段、零输入均不能假绿；关联FR-COST-006、008。
验证：ORACLE-COST-MISSING；同命令核合法对照，并分别运行空文件、有内容无用量字段、字段值为空或非数字三类负例，追加解析失败与格式漂移场景；核各组状态及末尾缺项汇总。
通过：坏、缺、零输入标unavailable或not_reported并与0明确区分；能读的组独立保留，未读到的组、检测到什么及缺什么可读；零输入不报成功。
失败：三类坏输入中，把缺失、坏值、未知或未读到的指标在任何输出位置用0代替，或将对应required失败报成功；吞解析失败；把字段缺失冒有效0；或因一组缺失隐去其他已读组。
证据：各负例的输入定义、argv/cwd/exit与输出raw，合法对照和逐组状态读回；不把缺报当零值通过。
口径澄清（同号AC-004，不新增U或放宽未知要求）：decision-log原始需求R-005禁止对坏/缺/解析/零输入/漂移填0，R-017允许缺报但已交部分必须真实；模块三及B-006明确分组独立、保留能读的组。因此“任何位置填0”约束的是拿0代替未知，不能把其它已读组真实available的0或源明确上报的缓存写0当失败。真实0必须有对应源/事件或完整合法空集合的依据并标available；缺失组继续unavailable/not_reported、required负例继续非零退出，零输入始终非成功。原决策原件不由本段回写。


- [ ] **AC-005**：第二份历史样本能独立复跑并说明格式差异；关联FR-COST-002、010。
验证：ORACLE-COST-READ；选已存在历史会话，不为取样额外跑任务；至少两份真实样本，其中第二份覆盖另一个格式代次，另以DSH三代各一份及Codex一份验证已承诺范围，逐字段对账并解释格式语义差异。
通过：第二份样本独立跑通，跨代字段断言和稳定性范围可读；该能力由本卡验证，不后交N11补。
失败：只对一份有效、格式漂移静默吞掉、两种格式被无说明给相同数字，或新增业务任务伪造历史样本。
证据：样本标识/路径+hash、格式差异说明、独立复跑raw与对账；样本不足逐项保持缺口，不宣整条通过。

- [ ] **AC-006**：同条件对照按收窄后的原始读数口径交付；关联FR-COST-009、015。
验证：ORACLE-COST-LEDGER、ORACLE-COST-BOUNDARY；同一份记录以同条件复跑核一致性，同阶段重跑/返工后回读先后行和全部尝试；全文核工具不产收益结论。
通过：账本完整保留同阶段先后原始读数、可并排对照；追加不覆盖保全部尝试，次数与波动可由原始读数回读；工具不输出任何收益性结论。
失败：工具输出“变好/变差/省了百分之几”等结论，或覆盖/筛掉失败与不利尝试而冒称完整对照。
证据：同条件输入与两次raw、账本追加前后相关行及保留尝试读回；此证据不自行证明成本下降。

- [ ] **AC-007**：每个数字有真实消费问题，工具不越界下结论；关联FR-COST-007、009。
验证：ORACLE-COST-BOUNDARY；逐个输出指标核其邻接解释能回答真实问题，并用AC-001/011的原数对账做遥测自验；检查输出未出现收益结论，六类嫌疑仅作提示、不凑门。
通过：每个指标对应一个真实消费问题且在输出可读，原数可核；工具不输出任何未经同条件验证的收益性结论，并继续遵守AC-006更强的无收益结论边界。
失败：指标无消费问题、只写“已采用”而无可观察自验，或工具越界输出未经同条件验证的收益结论。
证据：输出指标—问题对照、实际读数raw与自验原件引用；样本数/波动/瓶颈不足不被包装成收益。

- [ ] **AC-008**：与检查和总评测边界可读；关联FR-COST-011。
验证：ORACLE-COST-BOUNDARY；核工具/账本输出与本卡写集职责，反查N10/N11及历史分母是否被越界承包。
通过：本卡不产出检查器与总分，边界可读；N1观测、对照、解释及三项采用由本卡闭合，其余归原owner。
失败：越界实现N10/N11的内容、重做历史分母，或以其他卡未来补齐代替N1当前交付。
证据：实际输出、声明写集与真实diff逐路径对照、来源/consumer/owner登记；不保存目录快照。

- [ ] **AC-009**：三类来源必须分列；关联FR-COST-008。
验证：ORACLE-COST-MISSING、ORACLE-COST-BOUNDARY；读宿主实际注入字节、provider上报用量与材料字节三个来源栏，以某类未提供的样本验证列仍存在并标not_reported。
通过：三类各自成列、单位与来源可辨，缺报记not_reported；主Agent token、provider token及材料/常驻代理字节不互替。
失败：三类混用、合并、互相替代；缺报时省列或填0；把常驻字节称宿主实际总注入token。
证据：三来源列raw、各自原ref与缺报负例；不要求本卡实现provider补报。

- [ ] **AC-010**：本卡不得增加负担；关联FR-COST-016。
验证：ORACLE-COST-LOAD；沿开工前原基线核受影响常驻面；同范围针对性测试记录命令和耗时，核无新增常驻进程/数据库。实际新增/修改字节与去向可如实报告，但U-001已删除净字节不增硬要求，不设字节上限、不找无关删减抵账。
通过：常驻不增；日常针对性测试耗时与范围不因此扩大；无新增常驻进程或数据库。ADR-001与U-001按真实范围消费；净字节/体积零增不再是本条成败条件，其他未验证项保持incomplete。
失败：需要全量回归才能验证，或引入新增常驻开销、常驻进程/数据库；本次改变使日常针对性测试耗时或范围扩大，或相关约束未验证却声称通过。不能以U-001为由取消这些独立约束。
证据：开工前基线原ref、实际影响路径、受影响常驻读回、同范围命令raw与耗时，以及U-001唯一原件引用；本条不由“无daemon”单项替代，字节差值不是通过门。

- [ ] **AC-011**：累加前去重，不能翻倍；关联FR-COST-004。
验证：ORACLE-COST-WINDOW；按请求/消息标识与正式用量字段独立对账；同一含重复副本DSH真实样本同时演示错误遍历全部对象与只读正式字段的2.000倍关系；Codex分别读last与累计并验证未相加。
通过：同一份用量只计一次；DSH实现只取正式字段并去重，真实2.000倍负例可复现；Codex不把last与累计同时相加。
失败：2倍虚高、同请求多次累加，或把Codex“最后一次”与“累计”相加。
证据：真实样本路径+hash、正确数与错误路径反例raw、去重标识及逐字段对账；负例不改生产原件。

- [ ] **AC-012**：不产出金额；关联FR-COST-011。
验证：ORACLE-COST-BOUNDARY；核输出全文和本卡代码/依赖，验证无货币金额、无内置价格表、无网络取价，也不采信记录已有金额字段。
通过：仅报告本任务指标与来源、没有金额或价格表，没有联网取价。
失败：出现金额字段、货币换算、内置价格表或网络取价。
证据：人读输出raw及具名代码/依赖检查记录；不以来源原文提到外部价格事故冒判实现含金额。

- [ ] **AC-013**：未知格式与未支持字段如实读不到；关联FR-COST-002、004、006、014。
验证：ORACLE-COST-READ、ORACLE-COST-MISSING、ORACLE-COST-WINDOW；验证未知代次、未知格式和缺字段输出；DSH三代四组及Codex已核字段逐项读取；用Codex前后累计值验证阶段差值，核未相加last字段。
通过：缺组报“读不到”并说明检测到什么、缺什么；已核实范围为DSH三代四组，Codex时间/用量/轮次/响应数；Codex工具与子代理调用数映射尚未确定，该组暂报读不到，不声称已支持；Codex取累计最后值，阶段增量必须前后累计相减。
失败：用其他数据顶替、静默少一组、累计与last相加、把累计直接当本阶段增量，或声称Codex工具调用数已经支持；未知格式伪造正常读数。
证据：已知/未知格式与缺字段raw、字段族与语义差异读回、Codex累计差值的原始前后点；OI-020实跑结论保真，若改变当前支持承诺须按真实范围修订。

- [ ] **AC-014**：阶段收尾自动追加可核对记录；关联FR-COST-001、003、005、008、012—015。
验证：ORACLE-COST-LEDGER、ORACLE-COST-WINDOW；主会话实际消费四阶段必经交接调用，流程传阶段名，回读任务库账本新增行；分别核显式路径复跑、无参数环境识别、有界子会话、首笔/后续增量、同阶段返工、读取/写入失败及未触发提示；追加原子性与中断不损旧行由所属Phase定向验证。
通过：四阶段收尾自动多一行，账本为任务库该任务md，固定列加表头；含时间点、流程传入阶段名、四组数字、等待与轮次内时长分列、宿主实际注入/服务方用量/材料字节三来源分列且逐项标缺报，以及未读到的组。首笔含开工至今，后续从上次记录界限计算，Codex累计前后相减；返工追加保全部尝试。带路径只用显式路径，无参数从环境推当前会话并只用父记录事件发现子会话；触发未执行或记账失败在账本或交接留下“本阶段无记录”等可见痕迹，失败不阻塞阶段收尾。
失败：写进代码仓库、需使用者手填阶段名、等待与干活合一、三来源混用或缺报不标、累计充阶段增量、覆写历史行、无参必须人工指定路径才可记账、扫描其他历史目录找子会话，或未触发/失败静默缺失；把人工传入路径本身当失败也不符合统一契约。
证据：四阶段真实方法消费与argv/cwd/exit、账本前后相关行、显式/自动与返工读回、失败/未触发可见痕迹和独立核对；无法写账本时保留原始错误及交接提示，不编追加成功。

## 12. 风险、未决与交接

### RISK-01：负担强度被解释性放宽

影响PFACT-005、FR-COST-016、AC-010。U-001已经真实移除净字节硬要求；若仍把它当门，会违背用户指令；若顺带取消无新增常驻进程/数据库或针对性测试约束，也会扩大变更。build-plan与verify-code按U-001精确范围读回，实际负担与未测项如实报告，不设新字节预算。

### RISK-02：自动定位或父子关联扩大读取

影响PFACT-004、FR-COST-001、005、012、AC-003、014。自动发现接口若只得ID而得不到限定路径，可能诱发扫描历史；实现设计核真实来源与有界定位，不能核定就显露缺口，交接留缺记录事实。测试以不扫描其他历史目录及缺子记录为负例。

### RISK-03：私有格式与缺报伪装为零

影响PFACT-002、003、007、FR-COST-002—006、008及AC-004、009、011、013。宿主升级、字段类型变化、累计重置或provider缺报会使读数失真；逐格式断言、去重与缺项状态必须可观察，原始失败保留；不以其他来源补数。

### RISK-04：阶段边界或并发追加丢失尝试

影响PFACT-006、FR-COST-014、015及AC-003、006、014。相同时间戳、缺前值、重跑或同时写入可能重计/覆盖；spec-plan须明确边界、锁与原子追加，失败留痕并继续阶段收尾；验收查实际前后行与对应事件。

### 未决项

| ID / 分类 | 问题与影响 | owner / 处理阶段 | 关闭条件 |
| --- | --- | --- | --- |
| OPEN-01 / 已由U-001解决 | 用户明确删除净字节不增硬要求；影响FR-COST-016、AC-010 | build-plan主会话记录真实变更 | 当前答复已取得；主线程落唯一U-001原件与最小索引，不再问分母，不声称计划确认 |
| OPEN-02 / 当前接口已核 | DSH环境/目录与Codex线程、有界子引用已核；自定义根保可见降级 | P1/P2作者 / build-code | 合同4、EFACT-003—007已闭合设计；实际实现/环境验证未执行，不冒支持通过 |
| OPEN-03 / 设计已闭合 | 首含首末/后续(from,until]，任务墙钟/跨度和/活动并集分列，缺口行保真实cutoff | P1/P2作者 / build-code | 合同3—6；真实首源已核，未知不伪恢复，下一笔可用；未实施/测试不冒通过 |
| OPEN-04 / 已执行并保适用性限制 | 唯一checker已实跑ok=false、缺service/route/viewport三项；本任务non_UI保null | build-plan主会话 | 009实际对象检查原件已保存，缺3项如实保留；CLI验收另按真实入口，不伪造UI、不新设准入门 |
| OPEN-05 / 上游OI-020 | Codex工具与子代理计数字段未映射；影响FR-COST-002、006 | build-code宿主适配作者 | 定向实跑确认并保原件；当前AC-013仍暂报读不到，不默宣支持 |
| OPEN-06 / 上游OI-019 | make-decision骨架内部必填节未定义；不归N1 | 上游方法owner | 沿原OI交接，不在本卡扩写方法治理 |
| OPEN-07 / 上游OI-021 | 盲审不能针对已选方向挑战；两历史review partial | 上游方法owner | 保原限制；本卡不追加历史方向审查、不改写partial |

锁定决定：两宿主/DSH三代、只报数量、正式字段去重、分组缺失、默认子会话、自动记账、任务库md、原数无收益结论、固定列与追加、流程传阶段名、四阶段必经交接、ADR三条例外及本轮U-001删除净字节硬要求。新歧义与工程未知不被静默写成用户已选方案。

## 13. 业务影响与回归范围

新增影响面为明确记录读取、人读输出、四阶段交接及任务库md追加。既有阶段完成语义和Git/close授权不被成本记录改写；记账出错仍完成原收尾并说明观测缺口。

回归范围由真实写集确定：显式合法输入、各格式/去重/缺失路径、四阶段既有交接行为、任务库旧账行保留、路径安全和共享追加。历史metrics-smoke与OCR两文件既有RED仅保留来源；不改它们、不靠全量回归掩盖当前针对性结果。可读CLI/md不是网页，未声称任何浏览器或视觉验收完成。

## 补充材料

- 当前 `decision-log.md` 全文，重点原始需求、ADR-001、验收面、未决项与质量边界；产品目标与决定理由留原owner。
- `任务库/quality/evidence/decision-log-refs/talk-batches.md`：B-003小工具边界，B-004两宿主/无金额/去重，B-006分组/默认子会话，B-007—B-011留痕与确认；历史确认不能逐字节认证当前材料。
- 同目录 `research.md`：B4—B8 DSH实测、B9/B11 Codex更正、A4三项采用及D分路来源；候选A1已被后续真实选择部分取代，不能整份当当前决定。
- 同目录 `coverage-matrix-5d.md`：逐R来源索引，已说明过时行；不回写或复制为另一覆盖账本。
- `任务库/quality/evidence/pre-work-baseline-2026-10-15.md`：开工前一次性读数及失败；字节基线仅为历史事实；U-001已移除AC-010的净字节硬要求。
- 上游只读 `specs/archive/skills-framework-redesign-20261014/prd.md#n1` 与 `#g1`；上游任务库 `quality/evidence/decision-log-refs/module-convergence/M12-main-agent-cost-metrics.md`、`s3/T0-verifiability.md#t0-c`：沿当前决定读取历史来源，不恢复被替代的不写文件/不接流程方向。
