# Approved Direction Card（方向卡·修订版 v4.1）— 经 Talk 1-3 + Talk R1-R3 + 红蓝审查×2 + 四队辩论×2 裁决 + detail 审查修正

> v4.1 修订依据：direction review v4（25 findings，FND-V4-01~13）+ debate round-2 裁决书（7 组+修正）+ Talk R3（T-021/T-023 用户确认）+ 两路调研（异源审查隔离 F-042、spec/plan 全流程现状 F-043）。v4.1 保留 v3 全部收口治理语义；II 部分按裁决修正（锁最小语义、弃"审查瘦身"、扩展全阶段执行规范）。

## 核心需求与目标

- **核心需求**：① 诊断 WorkflowHub 历史任务"verify-code 堆积缺口→带缺口 close"根因（独立核查为准）+ 落地收口治理改造；② 诊断 build-spec/build-plan 阶段高 token 消耗根因 + 落地质量-成本治理（材料质量升级、verify 独立性、全阶段上下文管理）。
- **目标**：① 经核实诊断交付；② 收口治理聚焦改造（I 部分，v3 不变）；③ 质量-成本治理（II 部分）：材料质量升级（模板/校验器对齐+四段式+负向 oracle 法定化）+ verify 独立性（三态事实记录）+ build-spec/build-plan 全阶段 Execution model（上下文守恒+材料索引+子代理派发）；④ 本任务后期阶段 dogfood（观察合同）。

## I. 收口治理（v3 全文保留，语义不变）

1. **A+B 收口预检链**（9 字段最小合同；载体=spec.md AC 扩展字段；预检=只读 advisory 三态；覆盖边界声明；不每阶段重跑）。
2. **D 唯一缺口源**（同快照确定性派生 gap_id=规范化内容（去首尾/连续空白、字段序归一）+同快照确定性派生；聚合键不含投影源；投影源为 provenance；**确认消缺=按 snapshot/material 匹配的 human-confirmation fact 消费（stale 确认不消费）；多投影优先级=同一派生源发散（实现归 build-spec）**；不持久）。
3. **E 边界校验**（bridge agent_run_id!==attempt_id→拒绝；收据不绑快照→拒绝；语义缺失→记录+投影不阻断）。
4. **F 状态分层**（六状态分离展示；quality_status 唯一来源=独立质量决议；禁展示层推导新状态机）。
5. **C/G 并入**（C 冒烟实施前验证可裁剪；G review 语义收紧）。

### 六状态契约摘要（嵌入方向卡，详细矩阵见 decision-log）

| 状态 | 唯一来源 | 值域 | stale 语义 |
|---|---|---|---|
| can_continue | 执行事实（工作区+材料可读） | true/false | 随当前材料重算 |
| stage_status | 当前 stage outcome/completion | completed/in_progress/failed/timeout/cancelled(+unavailable 记录) | 过期=conflict/stale 如实展示；failed/timeout/cancelled 保持原状态不得改写成 completed |
| quality_status | 独立质量决议（spec-analyze/review 事实） | passed/incomplete/unknown | 缺事实=incomplete；禁预检/收口投影写入或推导 |
| acceptance_status | 逐 AC 验收证据 | pass/fail/unknown/deferred/not_applicable | 证据不绑当前快照=stale |
| product_release_status | deriveProductRelease（五阶段 current completion+AC+verify 确认） | released/not_released | 输入非 current→not_released |
| physical_close_status | close 物理事实（commit/archive/merge/push/cleanup 读回） | not_closed/closed(+失败原因) | 只读物理结果 |

## II. 质量-成本治理（新需求增量，T-013~T-023 收敛）

### II-1 材料质量升级（先做，T-017/T-018/T-023 确认）

- **背景（research-Q3）**：四材料保障度=中；缺口=①模板/校验器标签错位（bold `**验证方法**：` vs 校验器 plain `验证：`，历史用脚本"绕过"）②通过/失败/证据三段零校验 ③拒绝条件类 AC 无表达位 ④verify 不验材料完整性（三任务 verify unknown+零 digest）。
- **锁定语义**：
  1. **模板-校验器对齐**：spec 模板 AC 卡改 plain `验证：`（与校验器 L2948 正则一致），四段式（验证/通过/失败/证据）**全部 AC 强制且四段均须非空**；校验器升级为四段式存在性+非空校验。
  2. **负向 oracle 法定化**：任务卡 oracle 结构化为机读字段 `{pass: ..., reject: ...}`（reject=可证伪拒绝断言，如"身份不符必须拒绝写入""收据不绑当前快照=不通过""findings:[] 无 provenance 不算通过"）；**机读判定=具有 RED/GREEN 配对的任务（verification_role∈{RED,GREEN} 且 paired_task≠N/A）强制 oracle.reject 非空**（复用现成机读字段，无新增分类元数据），校验器同步；聚合/非行为类（verification_role=N/A）不强制；**不采用关键词/语法规则判型**（保证语义）。
  3. **verify 入口材料轻量只读校验**（4 项：材料存在/身份绑定/非占位符/非零 digest+当前 snapshot 绑定）——事实校验，非 gate、不阻断。
  4. AC 写法模板统一（三套→一套）。
- **宪法边界**：模板+校验器=既有机制修正；verify 材料校验=只读事实校验。

### II-2 verify 独立性（T-019/T-023 确认）

- **锁定语义**：verify-code 阶段**发起**异源独立审查请求（复用既有 verify E2E/dsh-code-review 通道，不新增公共入口）+ **三态事实记录**（executed=成功产出审查事实 / failed=已发起但执行失败，记录失败原因（允许一次重试，重试纪律=既有通道）不阻塞 / unavailable=通道不可用，如实记录原因）+ 阶段汇报如实声明；**不是步骤完成条件、不是收口条件、不是 pass 门槛**（记录事实不阻断推进）；异源判定=既有身份校验链（provider_identities/source_id 比对执行者身份；**OPEN-004 配置修复=实施前置环境动作（修改 3rd-review config 的 source_id 绑定，属用户侧配置，build-plan 前置执行、用户授权后动）**）；unavailable/failed=如实记录（不算失败、不阻塞、不替代自查）。
- 目标：本任务 verify 阶段"只有审查事实"不再缺失（自查证据≠独立审查事实）。

### II-3 全阶段上下文管理（T-016/T-020/T-023 确认：完整移植执行规范）

- **背景（research-Q2/F-033~F-035/F-043）**：成本大头=主会话全量重读（8-15 轮×587KB）+ 阶段内子代理独立上下文 + 审查材料包（28.2 万字符×5 provider×2 轮）；system 无 token 度量（用户自见，不做机制）；build-spec/plan 无 Execution model/上下文守恒/索引规范（make-decision L279-313 规则壳可复用）。
- **锁定语义**：
  1. **Execution model 移植**：build-spec/build-plan SKILL 各加"Execution model"章节=step×M/S/B 矩阵+上下文守恒 6 条（全量落盘/主会话只留 ref+sha256+摘要≤500 字/S 回传≤500 字且"severity|位置|问题|建议"一行一条/并行上限（调研≤4、debate≤4、审查=2 role）/交互 M 独占/每步只依赖上一步摘要+ref 不回塞全文）+争议分级（方向级交用户/实施级交独立复核，M 只登记）。
  2. **材料输入契约改造**：spec-specify/spec-plan/spec-tasks 的输入从"Read the current…全文"改为"收冻结 packet"（对齐 spec-research 模式：宿主侧组装→脱敏冻结→按需读）。
  3. **材料分层索引（载体=材料内嵌"材料导航"节）**：每份四材料在文件头部内嵌导航节（节列表+每节 1 句摘要+读取时机建议）；零新文件、随材料更新、可再生、非权威；读法=节标题锚点（grep 定位）→按 offset 读片段；生成时机=起草即生成+定稿更新（不是 build-plan 末端）。
  4. **子代理派发扩展**：findings 处置/终检复查/调研子代理化（主会话只审摘要定稿，回传≤500 字）；simplicity-guard/plan-eng-review 的 inline 声明与实际执行位置对齐。
  5. **审查材料包内容分层**：投递链路保持现有 file_only 冻结链不变（F-041/F-042：审查者本就读冻结包文件）；优化=包内 review-instructions.md（**既有包文件，内容升级为引导：先读导航/摘要材料、再按需读详细材料**）+材料分层组织；**零新文件**=四材料导航节（见 3）不新增材料文件；"task_dir 直读"方案废弃（破坏冻结/零路径暴露/可复现链）。
- **覆盖边界**：build-spec/build-plan 为主；make-decision 已 OK 不动；build-code/verify-code 顺带受益（tasks.md 导航节）；四阶段统一留 DEFERRED-006。
- **目标口径**：主会话窗口占用最小化 + 材料包组织优化（不承诺总 token 下降；不做 token 度量）。

## 用户流程与展示位（方向级骨架）

- 流程（不变）：make-decision → build-spec（AC 收口合同+四段式+reject 填写）→ build-plan（末端预检只读；执行规范适用）→ build-code（每 phase 实施/测试/审查）→ verify-code（独立审查三态事实；材料轻量校验）→ confirm/authorize → close。
- 展示位（不变）：六状态分离；预检三态只读；同一 gap 只显示一次；无页面 UI。
- 新增（信息面，非公共入口）：阶段汇报含执行规范使用面（导航节/派发记录/独立审查事实），属既有"阶段末遗漏披露"范围。

## 数据状态

- 六状态矩阵（见上表+decision-log）；缺口=同快照确定性派生 id+确认消缺；收口合同=9 字段沿 AC 记录；材料导航节=只读派生（非权威/可再生/不持久）；verify 独立审查事实=quality 事实（不可用如实记录）。

## 非目标（已确认，含新需求）

- 不改历史任务记录；不重放真实外部任务验证；不做页面/前端 UI；不改宪法 close 三义；不新增公共入口/新 store/持久 selector 对象/新 gate/第五材料；外部 provider 不可用时如实记录 unavailable；不做完整状态矩阵转换表与端到端流程设计；不每阶段重跑预检；**不做 token 度量机制（Q2）**；**不做模型-阶段强制绑定/模型使用记录机制（Q4 澄清）**；**不做"task_dir 直读"审查改造（T-023a，破坏冻结链）**；**不做审查"瘦身/切片实验"（机制已存在，F-041）**；不改五阶段顺序；make-decision 的执行规范不动（已有）；历史材料不回溯迁移（仅新生成材料适用新模板）。
- 边界：材料导航节不得成为权威材料/持久对象；verify 材料校验/独立审查事实不得成为推进许可证；模板升级不改变既有 AC 语义（只对齐表达与校验）。

## 成功/失败边界

- 成功（I 部分 v3 不变 + II 部分，全部限本任务可判）：
  - 材料质量：本任务按新模板生成的 spec 直接被校验器通过（无需"绕过脚本"）；AC 四段式+oracle.reject 经校验器检查为通过；本任务 verify.json 呈现真实材料身份（非零 digest+当前 snapshot 绑定）。
  - verify 独立性：本任务 verify 发起独立审查请求并留下三态事实记录（unavailable=如实记录）。
  - 上下文：本任务 build-spec/build-plan 的审查材料包与阶段内子代理输入采用"导航+摘要+按需"组织；主会话重读/派发行为按执行规范执行（观察记录）；材料包内容对比 convergence 基线（review-input 字节数实测记录；**无最低阈值——未获下降证据时如实结论"未证明下降"，不虚构达标**）。
- 失败（I+II）：把未核实论断当事实；新增违宪控制面；假绿；方向未确认进入 build-spec；执行规范成为新 gate；模板升级破坏既有 AC 语义。

## 风险与延期

- 风险：RISK-001~003（v3）+RISK-004 模板/校验器对齐引发存量 spec 合规波动（仅新生成受影响，本任务 spec 是首个新消费者——失败会自卡，属可测风险）+RISK-005 verify 独立审查在 provider 不可用时 frequent unavailable（三态如实记录，不阻塞）+RISK-006 执行规范移植导致 build-spec/plan 流程变更面（两 SKILL+三输入契约，20+ 测试交叉——按"一个 phase 一个语义维度"隔离）。
- 延期：DEFERRED-001~004（v3）+DEFERRED-006 四阶段统一上下文机制（先 spec+plan，后续任务验证后再扩）；**DEFERRED-005（索引载体）已消除**（载体=材料内嵌导航节）；**DEFERRED-007（审查瘦身实验）已消除**（机制已存在，投递链不变只做组织优化）。

## 主要依据

- 用户 Talk 1-3（T-001~T-012）+Talk R1-R3（T-013~T-023）；红蓝方向审查 v3 23 条+v4 25 条；四队辩论 round-1（7 组裁决）+round-2（7 组+修正）；detail 审查 39 条；核查事实（F-010~F-030）+三问取证（F-031~F-043）；research-Q1/Q2/Q3；两路专项调研（F-042/F-043）；宪法硬约束（Q2/Q3/F8/F9/F10/F11；AGENTS.md vNext 边界）。
