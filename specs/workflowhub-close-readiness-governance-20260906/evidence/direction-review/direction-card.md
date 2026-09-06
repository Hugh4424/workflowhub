# Approved Direction Card（方向卡·修订版 v4）— 经 Talk 1-3 + 红蓝审查 + 四队辩论裁决 + detail 审查修正 + Talk R1/R2（新需求）

> 修订依据：v3 定稿（Talk 1-3 + 红蓝 + debate round-1 + detail 39 条处置）；v4 增量=用户新需求三问（R-007~R-010）经 Talk 结构化问答 R1/R2 收敛（Q1~Q8，见 decision-log"三轮 talk"T-013~T-020）与三轮取证分析（research-Q1/Q2/Q3）。v4 保留了 v3 全部方向语义（收口治理不变），新增"质量-成本治理"增量。

## 核心需求与目标

- **核心需求**：诊断 WorkflowHub 历史任务"verify-code 堆积缺口→带缺口 close"的根因（以独立只读核查为准），并落地聚焦治理改造，让收口可行性提前暴露、状态可信；**同时**（新需求）诊断 build-spec/build-plan 阶段 token 消耗巨大与"低智力执行保障"缺口，落地质量-成本治理改造。
- **目标**：① 经核实诊断交付（含认知差异说明）；② 收口治理聚焦改造（v3 不变）；③ 质量-成本治理增量（本卡第 II 部分）：材料质量升级（模板/校验器对齐+负向 oracle 法定化）+ verify 独立性 + build-spec/build-plan 上下文优化（材料索引+派发扩展）；④ 本任务后期阶段 dogfood 真实使用新机制（按观察合同）。

## I. 收口治理（v3 全文保留，语义不变）

1. **A+B 收口预检链**（9 字段最小合同=producer/consumer/owner/命令/fixture/oracle/证据路径/freshness/close 条件；载体=spec.md AC 扩展字段；预检=只读 advisory 三态 ready/unknown/unavailable，不接触 can_continue/physical_close/close 三义；覆盖边界声明；不每阶段重跑）。
2. **D 唯一缺口源**（gap_id=规范化缺口内容同快照确定性派生；聚合键不含投影源；投影源为 provenance；已确认项消缺；不持久/不登记/不承诺跨时间稳定）。
3. **E 边界校验**（bridge 写入 agent_run_id !== attempt_id → 拒绝；测试收据不绑当前 snapshot/material → 拒绝；语义缺失 → 记录+投影不阻断）。
4. **F 状态分层**（六状态分离展示；quality_status 唯一来源=独立质量决议；展示层不得推导新状态机）。
5. **C/G 并入**（C 冒烟实施前先验证、可裁剪；G review 语义收紧：findings:[] 不得绕过 provenance、timeout/cancelled/unavailable 原状态保留）。

## II. 质量-成本治理（新需求增量，Talk R1/R2 收敛）

### II-1 材料质量升级（Q4/Q5/Q8：先质量后效率；审计+模板升级）

- **依据（research-Q3，F-037~F-039）**：四材料体系保障度=中；最大缺口①模板/校验器标签错位（模板 AC 用 `**验证方法**：` bold，校验器只认 plain `验证：`，按模板生成会被判"缺 oracle"，历史上用脚本"绕过"而非修正）②`通过：/失败：/证据：`三段零校验 ③拒绝条件类 AC 无表达位（tasks oracle 模板仅文本提示"负例"，非法定字段）④verify-code 不校验材料完整性（verify.json 三任务全 unknown+零 digest）。
- **落地方向**（语义在方向期锁定，细节 build-spec 转译）：
  1. **模板-校验器对齐**：spec-specify AC 模板改为校验器可识别的 plain 标签（`验证：`）并保留四段式（验证/通过/失败/证据）；校验器升级为四段式校验（当前只验"场景+一个验证标签"）；
  2. **负向 oracle 法定化**：AC"失败："段与 tasks 卡 oracle 的"负例"从文本提示升级为**字段级要求**——关键断言类 AC 必须含可证伪拒绝条件（如"身份不符必须拒绝写入"、"证据不绑当前快照=不通过"、"findings:[] 无 provenance 不算通过"），校验器对"行为变更类任务"检查负例存在性；
  3. **verify 入口材料校验**：verify-code 阶段在材料消费前重验"材料完整性四件套"（当前 step1 明文不验——改为轻量只读校验：材料存在+绑定身份+非占位符；这是事实校验不是新 gate，不改推进规则）；
  4. 三任务三套 AC 写法 → 模板统一（m17/verify-close/exec-efficiency 差异表见 research-Q3）。
- **宪法边界**：模板+校验器=既有机制修正（非新控制面）；verify 材料校验=只读事实校验（非质量裁决、非 gate，沿用"记录事实而非阻断"）。

### II-2 verify 独立性（Q6：纳入本任务）

- **依据**：verify-code 阶段独立审查执行率≈0（convergence 0 provider；m17 1 次、simplicity 2/2 是不稳定证据）；verify 洪流可证关联=协议/绑定错误风暴+gate_cmd 不可执行（F-038）。
- **落地方向**：verify-code 阶段必须产生**至少一个异源独立审查事实**（复用既有 verify E2E/dsh-code-review 通道，不新增公共入口/通道；通道不可用时如实记录 unavailable，不得以"自查证据"代替独立审查事实）；执行率守卫（如步骤级完成条件）在 build-spec 定义具体形态（是步骤条件还是收口条件，构建期验证，避免新 gate 嫌疑——审查是事实不是推进许可证）。

### II-3 上下文管理优化（Q3/Q7：spec+plan 为主；Q2：不做 token 度量机制）

- **依据（research-Q2，F-033~F-035）**：成本构成=材料全量重读（8-15 轮）×（WH 587KB/T12 121KB+research 203KB）+ 审查全量注入（28.2 万字符×5 provider×2 轮）+ 子代理独立上下文 + 模板返工；无 token 度量（用户自见用量，不做机制）。
- **落地方向**：
  1. **材料分层索引**：spec/plan/tasks（及需要时的 decision-log）生成"节-摘要-行号"索引；主会话默认读索引，按需按行号片段读原文；索引=**只读派生视图**（非权威材料、可再生成、不登记为第五材料、不做持久对象——违宪红线），载体形态（材料内嵌导航节 vs evidence/ 派生文件）由 build-spec 按"不新增持久对象"规则验证；
  2. **M/S/B/P 派发扩展**：build-spec/build-plan 的起草（已有）+ **findings 处置/终检复查/调研**全部子代理化（子代理产出处置建议，主会话只审摘要并定稿）；审查材料注入改为"摘要+关键段+文件引用"（子代理读文件而非全量注入）——审查输入瘦身；
  3. **模板口径单源**：任务卡模板与机检规则同源（消除"ID 写法/固定措辞"返工两轮问题）；
  4. 覆盖边界：build-spec/build-plan 为主；make-decision 保持不变（已有收敛环）；build-code/verify-code 顺带受益（tasks.md 索引）——若后续验证有同模式再扩展。

## 用户流程与展示位（方向级骨架）

- 流程（不变）：make-decision → build-spec（AC 收口合同字段+四段式+负向 oracle 填写）→ build-plan（末端预检只读；材料索引生成）→ build-code（每 phase 实施/测试/审查）→ verify-code（独立审查事实；材料轻量校验）→ confirm/authorize → close。
- 展示位（不变）：六状态分离；预检三态只读；同一 gap 只显示一次；无页面 UI。
- 新增展示位（质量-成本）：阶段完成的大白话汇报含"材料索引/子代理派发"使用面与独立审查事实（属既有"阶段末遗漏披露"范围，不新增公共入口）。

## 数据状态

- 六状态矩阵（不变）：唯一来源/值域/stale 语义/展示位见 decision-log。
- 缺口（不变）：同快照确定性派生 id；已确认项消缺；missing/unavailable/stale/conflict 语义保留。
- 收口合同（不变）：9 字段+语义沿 AC 记录。
- 新增：材料索引=只读派生（非权威、可再生、不持久）；verify 独立审查事实=quality 事实（不可用如实记录）。

## 非目标（已确认，含新需求）

- 不改历史任务记录；不重放真实外部任务验证；不做页面/前端 UI；不改宪法 close 三义；不新增公共入口/新 store/持久 selector 对象/新 gate/第五材料；外部 provider 不可用时如实记录 unavailable；不做完整状态矩阵转换表与端到端流程设计；不每阶段重跑预检；**不做 token 度量机制（用户自见用量，Q2）**；**不做模型-阶段强制绑定/模型使用记录机制（Q4 澄清：非需求，模型分工仅作背景事实）**；不改五阶段顺序；不重做红蓝/审查为四阶段通用（Q7：spec+plan 为主，make-decision 已 OK 不动）。
- 边界：材料索引不得成为权威材料或持久对象；verify 材料校验不得成为推进许可证（事实校验，非 gate）；模板升级不改变既有 AC 语义（只对齐表达与校验）。

## 成功/失败边界

- 成功（v3 不变 + 新增）：
  - 材料质量：按模板生成的 spec 能被校验器通过（无"绕过脚本"）；四段式（验证/通过/失败/证据）法定；行为变更类任务卡的 oracle 负例经校验器检查；verify 阶段三任务历史"unknown+零 digest"不再出现（本任务 dogfood verify 有真实材料身份）。
  - verify 独立性：本任务 verify-code 产生至少 1 个异源独立审查事实（通道不可用如实 unavailable）。
  - 成本：本任务 build-spec/build-plan 的审查输入瘦身（对比 convergence 28.2 万字符）；主会话重读轮次下降（以材料索引使用面+派发记录为观察证据，不做 token 度量）。
- 失败（新增）：索引成为权威材料/持久对象；verify 材料校验变成推进门；模板升级破坏既有 AC 语义；审查瘦身导致漏审（以 findings 召回对比为观察，不达标则回退）。

## 风险与延期

- 风险（v3 不变）+新增：RISK-004 模板/校验器对齐可能引发存量 spec 合规波动（迁移面：仅影响新生成 spec）；RISK-005 verify 独立性要求可能使 verify 阶段在 provider 不可用时频繁 unavailable（如实记录，不阻塞）；RISK-006 审查瘦身（摘要注入）可能降低 findings 召回（需对照验证，可回退为全量注入）。
- 延期：DEFERRED-001~004（v3 不变）+DEFERRED-005 材料索引载体形态与"不新增持久对象"边界的具体兼容判定归 build-spec 验证；DEFERRED-006 四阶段统一上下文机制（含 build-code/verify-code）留待后续任务（Q7：先 spec+plan）。

## 主要依据

- 用户 Talk 1-3（T-001~T-012，v3）+ Talk R1/R2（T-013~T-020，Q1~Q8）；红蓝方向审查 23 条（result.json）；四队辩论裁决书（7 组）；detail 审查 39 条；核查事实（F-010~F-030）+三问取证（F-031~F-040）；research-Q1/Q2/Q3（3 份取证分析）；子代理审计（0b2049cb/b12b32f9/f2368ca8/a4d19fdd）；宪法硬约束（Q2/Q3/F8/F9/F10/F11；AGENTS.md vNext 边界）。
