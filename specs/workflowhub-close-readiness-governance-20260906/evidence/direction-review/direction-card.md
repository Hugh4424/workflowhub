# Approved Direction Card（方向卡·修订版 v4.3）— 经 Talk 1-3 + Talk R1-R3 + 红蓝审查×3 + 四队辩论×2 裁决 + detail 审查修正 + 第二轮 Talk（T-025~T-035）+ 方向审查 v5 修正

> v4.3 修订依据：第二轮 make-decision（R-011）Talk R1 七问+追问（T-025~T-031）与 R2 四项裁决（T-032~T-035）；红蓝方向审查 v5（27 findings，组 A-S）。v4.3 保留 I/II 全部语义（修正 II-1 reject 范围、II-3 审查包口径），新增 III 部分并按其 v5 findings 修订。

## 核心需求与目标

- **核心需求**：① 诊断 WorkflowHub 历史任务"verify-code 堆积缺口→带缺口 close"根因（独立核查为准）+ 落地收口治理改造；② 诊断 build-spec/build-plan 阶段高 token 消耗根因 + 落地质量-成本治理（材料质量升级、verify 独立性、全阶段上下文管理）；③（第二轮）落地阶段治理闭环（III 部分）：让 build-spec/build-plan 基于冻结 decision-log 高效设计，不再在规格化中做决策收敛。
- **目标**：① 经核实诊断交付（含三问诊断 R-007~R-009 的结论、证据、用户确认）；② 收口治理聚焦改造（I 部分，v3 不变）；③ 质量-成本治理（II 部分）；④ 阶段治理闭环（III 部分）：决策冻结前置校验+findings 分类强制路由+needs_human 暂停态+review 预算+轻量 usage/代理观测+跨阶段统一回退；⑤ 本任务后期阶段 dogfood（观察合同）。

## I. 收口治理（v3 全文保留，语义不变）

1. **A+B 收口预检链**（9 字段最小合同；载体=spec.md AC 扩展字段；预检=只读 advisory 三态；覆盖边界声明；不每阶段重跑）。
2. **D 唯一缺口源**（同快照确定性派生 gap_id=规范化内容（**v4.3 修正：冻结算法=规范化字段元组固定（四身份字段：task/material 身份+缺口类别+规范化内容正文）、字段序固定、去首尾/连续空白、UTF-8 SHA-256 全值哈希、算法版本号；跨投影/字段序/空白/快照变化与冲突的固定样例由 build-spec 落盘**）+同快照确定性派生；聚合键不含投影源；投影源为 provenance；**确认消缺=按 snapshot/material 匹配的 human-confirmation fact 消费，且 confirmation 事实必须绑定 gap_id+snapshot+material，防止同快照多缺口错配消费（v4.3 修正）**；不持久）。
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
| product_release_status | deriveProductRelease（五阶段 current completion+AC+**既有 verify human-confirmation receipt**；独立审查三态事实不参与派生、不阻断 release，v4.3 修正 codex#4） | released/not_released | 输入非 current→not_released |
| physical_close_status | close 物理事实（commit/archive/merge/push/cleanup 读回） | not_closed/closed(+失败原因) | 只读物理结果 |

## II. 质量-成本治理（新需求增量，T-013~T-023 收敛）

### II-1 材料质量升级（先做，T-017/T-018/T-023 确认）

- **背景（research-Q3）**：四材料保障度=中；缺口=①模板/校验器标签错位（bold `**验证方法**：` vs 校验器 plain `验证：`，历史用脚本"绕过"）②通过/失败/证据三段零校验 ③拒绝条件类 AC 无表达位 ④verify 不验材料完整性（三任务 verify unknown+零 digest）。
- **锁定语义**：
  1. **模板-校验器对齐**：spec 模板 AC 卡改 plain `验证：`（与校验器 L2948 正则一致），四段式（验证/通过/失败/证据）**全部 AC 强制且四段均须非空**；校验器升级为四段式存在性+非空+占位符拒绝（`TBD`/`TODO`/`待填写` 整行匹配即不通过，v4.3 修正 antigravity/codex 占位符项）；**AC"证据"字段在 build-spec 阶段=预期证据契约（证据类型/产出物声明，如"测试收据路径+关键断言"），实际运行证据由 verify-code 回填校验——不在规格编写期要求运行证据（v4.3 修正 antigravity#3）**；非空校验=结构校验，语义可执行性由 build-plan 独立复核/人工验收（semantic_review_status），结构检查不裁决语义。
  2. **负向 oracle 法定化（v4.3 修正，T-032）**：任务卡 oracle 结构化为机读字段 `{pass: ..., reject: ...}`（reject=可证伪拒绝断言，如"身份不符必须拒绝写入""收据不绑当前快照=不通过""findings:[] 无 provenance 不算通过"）；**机读判定=verification_role=RED 的配对测试任务（paired_task≠N/A）强制 oracle.reject 非空**（RED=测试职责，GREEN=实现职责只要求配对关联+oracle.pass 非空，避免职责倒错）；非配对行为任务提供 oracle.reject 表达位但不强制（缺口③只对配对任务闭合，非配对行为任务若有拒绝边界由 build-plan 在 oracle 中表达，无强制）；校验器同步；聚合/非行为类（verification_role=N/A）不强制；**不采用关键词/语法规则判型**（保证语义）。GREEN 强制 reject 的旧语义（FND-V4-10/D-302）由 T-032 修正作废。
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
  5. **审查材料包内容分层（v4.3 口径修正，T-034）**：投递链路保持现有 file_only 冻结链不变（F-041/F-042：审查者本就读冻结包文件）；包内 review-instructions.md（既有包文件）内容升级为引导先读导航/摘要材料再按需读详细材料；**"审查包 token 下降"列为非承诺项（外部异源审查无交互读工具，包内字节不减；T-034）——上下文优化只作用于主会话侧（导航+摘要+派发），审查包一致性优先**；"task_dir 直读"方案废弃（破坏冻结/零路径暴露/可复现链）。
- **覆盖边界**：build-spec/build-plan 为主；make-decision 已 OK 不动；build-code/verify-code 顺带受益（tasks.md 导航节）；四阶段统一留 DEFERRED-006。
- **目标口径（v4.3 修正，T-035）**：观察指标=主会话重读轮次（read 调用计数）、阶段内子代理输入字节、材料包字节（字符级代理指标）+provider usage（有则落盘、无则 unavailable）；**不做 token 预算/计费机制**；无下降证据时如实写"未证明下降"。

## III. 阶段治理闭环（第二轮新需求增量，T-025~T-031 确认）

- **背景（本次 build-spec 复盘）**：build-spec 实际消耗 5.3 小时、纯审查约 76 分钟、13+ 轮 review 不收敛（18→13→17→11→10→12→12→10→12→5→5→4 条）；根本原因是①上游决策状态不唯一（approval_binding pending 与 accepted 并存）②方向级/规格级问题到 review 才暴露、build-spec 自己"翻译中做决策"③findings 处置把 needs_human 当终点而非暂停④无 review 预算与收敛规则⑤无 usage 记录导致"浪费在哪"不可回答。修正方向=在 make-decision 把治理闭环设计为需求，当前任务实现。

### III-1 决策冻结前置校验（T-026 确认；v5 组E/组17 修正）

- **入口**：build-spec 开始前（阶段入口/手工执行检查）校验 decision-log：①**头部元数据 approval_binding.status=accepted 且与正文"最终确认"节及 step 11 确认记录三方一致**（补查头部，防"头部 awaiting/pending 与正文 accepted 并存"这一实测故障）；②approval_binding 绑定当前材料（material_revision/snapshot_tree 与当前一致）；③无方向级未决（open 方向问题=0）。任一不满足→暂停 build-spec 并回 make-decision 补齐，不开始规格化；不加新 public 入口（并入既有 stage 入口校验/阶段汇报）。
- **增量续签（v5 组E 修正）**：增量决策（III-2）追加 D 记录时同步追加增量 approval_binding 增补（绑定该 D、用户答复回执 ref/hash、当前 snapshot），入口校验接受"基线确认+增量增补链"（对新增/变更 D 做轻量确认，不对历史 step 11 全量重确认），避免增量决策后被入口校验再次阻断。
- **冻结包合同（v5 组17/组T 修正）**：冻结不只是状态一致性，还要求 decision-log 内容覆盖用户流程、数据状态、成功/失败边界、非目标，且 decision-log 与 spec 均绑定同一 revision/snapshot；build-plan 入口对同一冻结版本重校验（spec revision 与 decision revision 配对）。
- **属性**：这是"该阶段是否可以正式开展"的完成条件检查，不是公共 gate；不做第二状态机；检查结果作为事实记录在阶段 outcome。

### III-2 findings 分类+强制路由（T-027/T-031 确认；v5 组L/组13/组O 修正）

- **分类**（review finding 处置前先分类，v5 修正：**分类互斥+优先级顺序+判定依据**）：`direction_change`（最高优先：改变产品行为/状态/接口/数据/验收边界/close 语义/跨材料主键/权限/重试策略）；`spec_ambiguity`（规格歧义）；`implementation_defect`（实现/文字级）；`environment_unavailable`（**移出 finding 分类，作为 review attempt 执行层状态记录**——通道/provider 失败属 attempt 层，v5 组H）；`invalid_finding`（无效/误报）。**判定依据**：每条分类必须附影响维度清单（命中哪些维度）+证据引用；**缺少依据、命中方向维度、跨多分类无法互斥 → 不允许以 fixed 完成**，落入未分类路由=暂停问用户或交独立复核。
- **强制路由**：runtime 校验每条 finding 的 disposition 必须匹配其分类路由（spec_ambiguity→必须存在用户答复绑定；direction_change→必须存在增量决策记录；不许把方向级标为 fixed 后继续）；路由错误→记录并阻断该阶段正式完成，不阻断同任务修复。
- **增量决策语义（用户 T-031 确认；v5 组M/组15 修正）**：发现方向级缺口→只用大白话问用户 1 个问题→追加 1 条 D 决策记录→同步增量 approval_binding 续签（III-1）→重新冻结→build-spec 只从受影响节继续；**已确认部分不重跑、不重写、不重新走完整 Talk/审查/辩论/Grill**；**新增/受影响的 D 本身执行最小质量闭环：受影响闭包（共享状态/接口/验收边界/跨材料键相关节）内做一次 focused review 并留下绑定该 D 的审查证据；依赖闭包外未受影响决策跳过（v5 组M/组15）**。
- **诊断交付验收（v5 组A 修正）**：R-007~R-009 三问诊断结论属交付物：decision-log 对每个问题的核实结论、证据引用、与用户确认状态列为成功边界判据（见成功/失败边界）。

### III-3 needs_human 只能作为暂停态（T-028 确认；v5 组H 修正）

- **语义**：needs_human 不再是最终处置；必须是暂停态：附 next_action（=ask_user 或 return_to_make_decision 或 return_to_spec），禁止作为 formally complete 的最终状态；阶段完成只允许 fixed/rejected_invalid/user_decided/accepted_risk；needs_human 存在时阶段 completion 保持 incomplete 并如实汇报。
- **出口**：needs_human → 用户答复后转 user_decided（绑定 finding_id/card_hash/reply_ref）或方向级增量决策后再处置；accepted_risk 必须绑定用户授权回执+风险记录（v5 组P）。
- **执行层状态分离（v5 组H/codex#1 修正）**：review attempt 可用性（executed/failed/unavailable）与 finding 处置是两层事实：provider/通道不可用=attempt 层 unavailable 记录（不阻断、不算 pass），不产生 needs_human finding，也不进入 disposition 白名单；attempt 层 unavailable 时该次 review 无 findings 可处置。

### III-4 review 预算（T-029/T-033 确认；v5 组B/组D/组6/组12/组P 修正）

- **预算单位与范围**：预算按"同一 review 目标"计数——对同一材料的同一冻结 revision，**一次初始 review**（含其全部 role/provider 调用与单次重试，同一 attempt 内并发调用不算额外轮次）；**材料实际变化后最多一次 focused review**（只复核变化范围）；无变化禁止重审；**build-code 每 phase 的既有 phase 审查（FR-REVIEW-002）=各 phase 独立 review 目标，不计入 build-spec/plan 的预算；每次新的增量决策续签（新冻结 revision）产生一次新的 focused review 配额（v5 组6/12 修正）**。
- **耗尽路由（T-033/v5 组D 修正）**：focused review 后仍有残留缺陷：实现级→再修一次后做**窄域 diff 核销一次**（只核对本次修复的 diff，不再全量）；仍不收敛或属方向级→转问用户或 accepted_risk（带授权回执）；provider 不可用=attempt 层 unavailable 记录、不算 pass、不算空 findings；**预算规则不制造死锁：每个状态都有确定出口（核销→问用户→accepted_risk→记录 unavailable）**。
- **失败/空桩语义**：provider 失败/空桩/超时如实记录 attempt 层 unavailable，不改为空 findings；空 findings 必须有可信 provenance（request_id/provider/role/material_id/snapshot/scope）。

### III-5 轻量 usage+代理观测（T-030/T-035 确认；v5 组Q 修正）

- **语义**：不做 token 预算/计费机制（维持 T-015 精神：预算机制不做）；观测分两层：①provider usage（input/output/cached tokens、duration、失败原因）已返回则落盘到 review attempt 事实，缺失标 unavailable（v5 组Q：能回答"review 调用消耗"）；②字符级代理指标（主会话 read 重读轮次、阶段内子代理输入字节、材料包字节），回答"主会话/子代理/材料包浪费在哪"；两组合起来回答"浪费在哪"，但**成功边界不承诺 token 总量下降**（未获证据如实写"未证明下降"）。

### III-6 跨阶段统一回退协议（T-030 扩展+T-031 确认）

- **协议**：五阶段共用一套 owner/consumer/next_action 路由：实现级=当前阶段自修；规格歧义=返回 build-spec（或 build-plan 的 spec-clarify 通道）问一次；方向级=回 make-decision 做增量决策（III-2）；材料 gap=对应 owner 阶段；环境不可用=attempt 层如实记录。runtime 校验"该回退的没回退"=完成条件不满足；不新建阶段/公开入口/门；各阶段 SKILL 不再各写一套回退条文，统一引用协议。

## 用户流程与展示位（方向级骨架）

- 流程（不变）：make-decision → build-spec（AC 收口合同+四段式+reject 填写）→ build-plan（末端预检只读；执行规范适用）→ build-code（每 phase 实施/测试/审查）→ verify-code（独立审查三态事实；材料轻量校验）→ confirm/authorize → close。
- 展示位（不变）：六状态分离；预检三态只读；同一 gap 只显示一次；无页面 UI。
- 新增（信息面，非公共入口）：阶段汇报含执行规范使用面（导航节/派发记录/独立审查事实），属既有"阶段末遗漏披露"范围。

## 数据状态

- 六状态矩阵（见上表+decision-log）；缺口=同快照确定性派生 id+确认消缺；收口合同=9 字段沿 AC 记录；材料导航节=只读派生（非权威/可再生/不持久）；verify 独立审查事实=quality 事实（不可用如实记录）。

## 非目标（已确认，含新需求）

- 不改历史任务记录；不重放真实外部任务验证；不做页面/前端 UI；不改宪法 close 三义；不新增公共入口/新 store/持久 selector 对象/新 gate/第五材料；外部 provider 不可用时如实记录 unavailable；不做完整状态矩阵转换表与端到端流程设计；不每阶段重跑预检；**不做 token 预算/计费机制（Q2/T-015）**；**观测=provider usage 轻量落盘+字符级代理指标（III-5，T-035），不记录 token 总量与不做预算**；**不做模型-阶段强制绑定/模型使用记录机制（Q4 澄清）**；**不做"task_dir 直读"审查改造（T-023a，破坏冻结链）**；**不做审查"瘦身/切片实验"（机制已存在，F-041；T-034）**；不改五阶段顺序；make-decision 的执行规范不动（已有）；历史材料不回溯迁移（仅新生成材料适用新模板——**rollout 边界=新材料生成路径执行新合同，校验器对既有任务只按既有规则（v4.3 修正 codex#9，不加历史兼容分支）**）；**增量决策不重跑已确认决策的完整 Talk/审查/辩论/Grill（T-031）**；**不新增公共 gate（冻结校验/路由=阶段完成条件检查，非推进许可证）**。
- 边界：材料导航节不得成为权威材料/持久对象；verify 材料校验/独立审查事实不得成为推进许可证；模板升级不改变既有 AC 语义（只对齐表达与校验）；findings 路由校验只约束"正式完成声明"，不阻断同任务修复。

## 成功/失败边界

- 成功（I 部分 v3 不变 + II 部分 + III 部分，全部限本任务可判）：
  - **诊断交付（v5 组A 修正）**：R-007~R-009 三问（convergence 升级效果评估、build-spec/plan 高成本根因、四材料对低智力执行保障度）在 decision-log 或交付报告中有核实结论、证据引用与用户确认记录，可独立复核。
  - 材料质量：本任务按新模板生成的 spec 直接被校验器通过（无需"绕过脚本"）；spec.md 的 AC 四段式（验证/通过/失败/证据）与 tasks.md 的任务卡 oracle（pass/reject）**分别**经各自校验器检查通过（不混淆字段归属，v4.3 修正 antigravity minor）；占位符被拒绝；本任务 verify.json 呈现真实材料身份（非零 digest+当前 snapshot 绑定）。
  - verify 独立性：本任务 verify 发起独立审查请求并留下三态事实记录（unavailable=如实记录）；独立审查三态不参与 product_release_status 派生。
  - 上下文：本任务 build-spec/build-plan 的主会话侧采用"导航+摘要+按需"与派发规范执行（观察记录：主会话 read 重读轮次、子代理输入字节、材料包字节）；审查包保持全量 file_only 冻结链（token 下降为非承诺项，T-034）；无下降证据时如实结论"未证明下降"，不虚构达标。
  - 阶段治理闭环：本任务 build-spec 重开时先通过决策冻结校验（头部 approval_binding=accepted 且与正文/step 11 三方一致、无方向级未决）；本任务 review 若有方向级/规格级 finding，触达大白话问答并留下绑定记录（不再是 needs_human 终点）；本任务 review 轮次遵守预算规则（一次初始+变化后一次 focused+窄域核销出口）；review attempt 有 usage 落盘或 unavailable 标注。
- 失败（I+II+III）：把未核实论断当事实；新增违宪控制面；假绿；方向未确认进入 build-spec；执行规范成为新 gate；模板升级破坏既有 AC 语义；把 needs_human 当最终处置继续正式交接；回退演变为整阶段重跑（违反 T-031）。

## 风险与延期

- 风险：RISK-001~003（v3）+RISK-004 模板/校验器对齐引发存量 spec 合规波动（仅新生成受影响，本任务 spec 是首个新消费者——失败会自卡，属可测风险；rollout 边界见非目标）+RISK-005 verify 独立审查在 provider 不可用时 frequent unavailable（三态如实记录，不阻塞）+RISK-006 执行规范移植导致 build-spec/plan 流程变更面（两 SKILL+三输入契约，20+ 测试交叉——按"一个 phase 一个语义维度"隔离）+RISK-007 III 路由校验与"记录事实不阻断"张力（只约束正式完成声明；路由错误=完成条件不满足，不禁止修复推进）+RISK-008 usage 轻量落盘依赖 provider 返回 usage（拿不到=unavailable，不承诺完整）+RISK-009 增量决策续签与冻结校验的交互复杂度（续签链实现错误会误放行/误阻断——用负向夹具覆盖）。
- 延期：DEFERRED-001~004（v3）+DEFERRED-006 四阶段统一上下文机制（先 spec+plan，后续任务验证后再扩）；**DEFERRED-005（索引载体）已消除**（载体=材料内嵌导航节）；**DEFERRED-007（审查瘦身实验）已消除**（机制已存在，投递链不变只做组织优化）；**新增**：DEFERRED-009 非配对行为任务的 reject 语义扩展（当前仅表达位不强制，是否对纯正向任务豁免留 dogfood 后评估）。

## 主要依据

- 用户 Talk 1-3（T-001~T-012）+Talk R1-R3（T-013~T-023）+Talk R2 第二轮（T-025~T-031+T-032~T-035）；红蓝方向审查 v3 23 条+v4 25 条+v5 27 条（组 A-S）；四队辩论 round-1（7 组裁决）+round-2（7 组+修正）；detail 审查 39 条；核查事实（F-010~F-030）+三问取证（F-031~F-043）；research-Q1/Q2/Q3；两路专项调研（F-042/F-043）；本次 build-spec 复盘（第二轮调研：N-008/N-009，含 16 次审查执行、5.3 小时、无 token 度量证据）；落点审计（六机制现网差距：无冻结校验器、无 finding 分类字段、needs_human 判 recorded、usage 载体在消费缺、无 finding 级确认载体）；宪法硬约束（Q2/Q3/F8/F9/F10/F11；AGENTS.md vNext 边界）。
