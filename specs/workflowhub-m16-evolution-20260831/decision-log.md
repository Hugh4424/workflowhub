---
version: 1
task: workflowhub-m16-evolution-20260831
stage: make-decision
---

# Decision Log

> 本文档为 make-decision 阶段工作稿：原始需求回放、关键事实、Talk 轮次、决策条目逐步落盘。
> 状态标注：`OPEN`=待用户拍板；`DRAFT`=初稿待确认；`DECIDED`=已定并带 approval_binding。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 把流程退化/复盘事实整理成"人可以决定下一步怎么改"的候选池，不允许系统自己改自己 | roadmap.md:446「把 M15 暴露出来的流程退化事实，整理成"人可以决定下一步怎么改"的候选池，而不是让系统自己改自己」；「所有主动修改 harness/skill 的行为仍需人把决策写进 decision-log」 | OPEN（候选池范围=DRAFT） |
| R-002 | 候选池 schema 白名单：只允许事实字段，不设自由文本方案字段 | roadmap.md:449「schema 白名单只允许 pattern/frequency/severity/affected_surface/run_refs/transcript_refs/artifact_refs/facts_refs/open_decision_ref 等事实字段」 | OPEN（是否允许判断层引用，Q3） |
| R-003 | 迭代入口：改某 skill/surface 时自动带出相关候选、失败案例、负例、上游 skill 更新、市场对照 | roadmap.md:446,454,459「迭代某 skill/surface 时自动生成 iteration-brief.md，含相关 candidates、negative-results、preserve behaviors、外部更新检查、市场对照、未解决 decision-log 项」 | OPEN（用户流程，Q1） |
| R-004 | negative-results.jsonl 只收 harness/process/skill-edit 失败尝试与回归，与 D24 eval 失败案例库分域不重复 | roadmap.md:450,457 | DRAFT（分域规则=事实字段，详见 F-006） |
| R-005 | attempted-edits.jsonl 必须含 decision_id/changed_surface/before_facts_ref/after_facts_ref/validation_method/revert_ref | roadmap.md:451,458「缺任一字段即失败」 | DRAFT |
| R-006 | 迭代入口消费 D13，评估系统是优先级器不是优化器（D14） | roadmap.md:462「D13（迭代入口消费）；D14（评估系统非优化器）」 | DRAFT |
| R-007 | brief 只能引用 facts refs 和 open decisions，不直接下结论替人决策；active harness 修改必须有人类批准的 decision_id | roadmap.md:460 | DRAFT |
| R-008 | M16 依赖本任务（stage-reflection）与 m15-retirement 产出；候选池/迭代入口/负例库为后续独立任务 | stage-reflection spec.md:328（DEFER-001）；stage-reflection decision-log.md:204（D-011） | 事实（F-001） |
| R-009 | remove_candidate 的最终裁决权归 M16 消融实验 | stage-reflection spec.md:249；decision-log.md:354（DEFER-002） | OPEN（消融实验范围，Q4） |
| R-010 | 全局页面/投影器唯一 consumer = 用户浏览器 / M16 数据输入 | stage-reflection spec.md:253（FR-PAGE-001）；decision-log.md:18（R-006 原话「全局 overall 待处理任务结果，未来给 M16 进行数据输入」） | OPEN（M16 是否动页面，Q2） |
| R-011 | 业务目标（用户原话）：要"知道 workflowhub 的每一个 stage 接下来应该如何改进和优化，而不是不停地新增 step、新增 skill"；"每一个 stage 里面的每一个 step 和 skill 到底有没有必要？应该如何优化，或者说整个 workflowhub 有没有更系统性的优化方式"；"前期做得更好，后面就越不用我操心"（make-decision/build-spec 质量决定后期自动化程度） | 用户会话原始需求（2026-08-30/31 多轮） | OPEN（核心目标=系统性优化线索，非补丁式新增） |
| R-012 | 前期质量假设验证：希望量化"后期人工介入有多少归因于上游 stage 考虑不周"（前期质量税），并观察其随改进是否下降 | 用户会话 + 上轮调研结论 | OPEN（是否正式产出，Q6） |
| R-013 | 约束：M15 遥测已退役，本任务不得重建 token/耗时/per-provider 采集；历史任务不回填 | stage-reflection spec.md（D-011：无 token/耗时数据源）；m15-retirement 结论 | 非目标（DRAFT） |
| R-014 | 约束：判断≠事实；录入判断必须带 record_kind/confidence/evidence_refs 标注，不得伪装成机器事实 | stage-reflection ADR 0021（judgment≠fact）；decision-log 模板「事实与约束」 | OPEN（判断入池边界，Q3） |

## 目标

- 把 stage-reflection 已落地的"每 stage 判断层数据"变成**可消费的优化输入闭环**：跨任务聚合出候选池（两档分层：机器信号强=建议行动，仅判断=仅供参考），当用户准备优化某 stage/skill 时按需生成完整迭代简报（含候选、负例库、改动台账、外部 skill 更新检查；市场对照槽位），并让 remove/merge 类裁决有可回溯的消融协议与台账支持。
- 回答用户的三个真实问题：哪些 step/skill 有必要、哪里值得系统化优化、前期质量对后期人工介入的影响能否被观测。本期交付**基础设施**：三个问题中"必要性判断"与"人工介入减少"明确标注【未验证，待真实任务数据】。
- 全程零新增遥测、零 AI 成本聚合、候选池只供人拍板（不自动改）。

## 成功/失败边界

- 成功边界：
  - 候选池聚合器能基于现有任务（哪怕样本不足）确定性产出 evolution-candidates.jsonl：条目=跨任务判断分布+机器信号状态+证据引用+生命周期字段；样本不足时诚实标注 insufficient_samples；严格两档分层。
  - 页面只读趋势区：候选池/质量税聚合视图，如实显示 unknown/unavailable/insufficient，不补零；任务视图与既有视图不被破坏（契约测试保持绿）。
  - 迭代简报生成器：按需渲染候选/负例库/改动台账/外部更新检查四区块，含"市场对照"槽位；只给事实与证据引用，不产生方案文本。
  - 消融协议+台账：attempted-edits 全字段 schema（含 decision_id/revert_ref）；negative-results 与 D24 分域；remove_candidate 明确标"待裁决"。
  - 完成判据（用户拍板）：确定性测试绿+独立审查完成即结束；业务目标标【未验证】。
- 失败边界：
  - 候选池或简报出现"把 X 改成 Y"的方案文本 / 自动改法。
  - 判断被写进机器事实通道 / LLM 推断关键事实（D30）。
  - 无真实数据却输出聚类/趋势结论（insufficient_samples 必须生效）。
  - 重建遥测或新增 per-provider 采集。
  - 独立审查不可用时宣称完成（保持 incomplete 等用户确认）。

## 范围

- 当前范围：候选池聚合器（基于 build-reflection-page 同源输入）+ evolution-candidates.jsonl + 页面只读趋势区（任务视图不动）+ 迭代简报生成器 + negative-results/attempted-edits 台账 schema 与写入通道 + 消融协议 + 外部 skill 更新检查 + 前期质量税口径与诚实视图。
- 用户流程/结果只记索引和验收影响，细节进入 spec。

## 非目标

- 不重建 M15 遥测、不补 per-provider token/耗时采集。
- 不做自动修改 harness/skill；不替代人或 decision-log 拍板。
- 不改五阶段主骨架、不新增 stage；不新增控制面（定时器/消息等）。
- 不做历史任务回填（lessons/stage-reflection 冷启动从零积累）。
- 不重复维护 eval 失败案例库（与 D24 分域）。
- 页面只加只读区，不破坏任务视图；不做独立新页面。
- 本期不产生 remove 最终裁决、不执行消融实验、不实际跑市场对照调研；"step/skill 必要性"与"人工介入减少"不做真实数据验证。

## 决定

### D-001（使用方式：按需简报+聚合随页面）
- question/final_option: M16 怎么用？→ 平时自动聚合+定期摘要，准备优化某 stage/skill 时按需生成完整迭代简报
- recommendation/plain_language: 推荐；默认候选中已含，无需单独维护"很全的视图"
- decision: 候选池聚合随 build-reflection-page 同一次运行产出（零 AI、单一消费者）；迭代简报由 CLI 按需生成
- source_type/reference/exact_excerpt: Talk round1 q1-flow「两者都要」；T-001
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）（待最终确认）
- facts_and_constraints: F-101（页面投影器参数/overall_pending 聚合逻辑可复用）；页面不能执行逻辑（静态）
- Logic: 用户要"平时有印象+动手时才深挖" → 无 cron 不新增控制面 → 聚合挂页面重建点、简报 CLI 按需 → 成本最低且不造新控制面
- choice_reason/impact: 覆盖两种使用场景；影响页面投影器与新增 CLI
- consequences_and_risks: 聚合频率取决于用户何时刷页面；简报生成是手动动作
- rejected_alternatives: 定时器/自动任务（违反"不新增控制面"）
- unresolved_items/owner: 无
- Supersedes: none

### D-002（页面范围：只读趋势区）
- question/final_option: 动不加页面？→ 在现有 monitor 页面加只读趋势区（方案 A 扩展投影器）
- recommendation/plain_language: 推荐；文件面 3 个，复用全套校验
- decision: 扩展 tools/cli/build-reflection-page.mjs + 模板 + 契约测试；schema_version 保持 v1 向后兼容加键；不改任务视图
- source_type/reference/exact_excerpt: Talk round1 q2-page「加只读趋势区」；F-101 结论
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: overall_pending 已是候选池雏形；Object.freeze/fail-closed/safeRef 约束
- Logic: 需要触发趋势视图 → 复用现有投影与约束 → 方案 A → 单一 consumer 不破坏
- choice_reason/impact: 见 F-101 方案 A vs B；影响 3 个文件
- consequences_and_risks: 与 stage-reflection 共享投影器，改动需保既有测试绿
- rejected_alternatives: 独立脚本+独立页面（第二 consumer，否决）；不动页面（用户已选要趋势区）
- unresolved_items/owner: 无
- Supersedes: none

### D-003（判断入池+D31 白名单修订+两档分层）
- question/final_option: 候选池是否允许带标签判断？→ 允许，显式修订 D31 白名单，两档分层
- recommendation/plain_language: 推荐；这是"智能优化"的数据基础
- decision: 候选条目允许引用判断层（record_kind=judgment/confidence/evidence_refs 原样保留）；每次来源事实用 `observation_id.v1(task_id,confirmation_ref,occurred_at)` 保持任务/时间身份，跨任务候选聚合改用 `candidate_group_id.v1(target-ref + normalized intervention kind/payload)` 且明确排除 task/time，frequency 只按 distinct task_id；target-ref 支持 stage/step/skill/surface，其中 step 只由 versioned stage manifest 的唯一 step_slug→stage 映射解析，缺失/歧义 fail-loud 或仅 reference_only；白名单新增生命周期字段 candidate_id/schema_version/observed_at/status/supersedes 及去重陈旧规则；两档＝机器信号强（零消费边/同 subject 跨至少两个任务介入/机器门槛）→建议行动档，仅判断→仅供参考档；自由文本方案字段仍禁止
- source_type/reference/exact_excerpt: Talk round1 q3-judgment「允许带标签的判断（推荐）」；grill g1-tiers「两档」；ADR 0022
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: ADR 0021 判断层；D31 原白名单；stage-reflection 机器门槛
- Logic: 数据主体是判断 → 不进池则用户核心问题无数据源 → 放宽但带全部身份标注+生命周期 → 透明可控
- choice_reason/impact: 实用价值换白名单纯度；影响候选池 schema、页面、简报
- consequences_and_risks: 自评偏袒残留（机器信号优先+消融定案缓解）；需要 ADR 0022 记录
- rejected_alternatives: 只收机器事实（信号弱）；先允许后验证（多一步）
- unresolved_items/owner: 候选记录完整 schema/聚合主键与类型/机器信号阈值与优先级/去重陈旧冲突规则/subject 粒度映射（step_slug、skill_id、stage 与无观测状态）→ build-spec 定义（detail 审查 FND-D05/D07）
- Supersedes: 修订 roadmap M16 候选池 schema 白名单（D31 原语义）

### D-004（消融实验：协议+台账，裁决延期）
- question/final_option: 消融做到什么程度？→ 本期协议+台账，执行与 remove 裁决延期
- recommendation/plain_language: 推荐；当前无候选可实验，不做空转
- decision: 交付消融协议 schema；attempted-edits.jsonl 带 R-005 全字段（缺任一字段即失败），只绑定 current approved decision，不消费 D24 authority；negative-results.jsonl 建库（只收 harness/process/skill-edit 失败尝试与回归，与 D24 eval 分域），只有 negative-result 写入才必须绑定 D24 authority。本期 D24 分域权威由 T002 在组合 schema 内产出，固定为 `runtime/schemas/workflow-evolution.v1.json#/$defs/d24_eval_boundary`：owner=`runtime/evidence/workflow-evolution.mjs` deep module，ref=该 anchor；T002 冻结 canonical subschema UTF-8 bytes、sha256 与 schema identity，T004/T010 必须用 fixed vector 逐字节复核，任何漂移零写/验收失败；它不是第五个持久对象。remove_candidate 标【待裁决】；本期不产生任何删除动作
- source_type/reference/exact_excerpt: Talk round2 q11a「只做架子（推荐）」+ round3 q14「只准备工具，裁决延期（推荐）」；R-004/R-005
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: DEFER-002（stage-reflection 的 remove 裁决权交接）；R-004（负例分域）；R-005（attempted-edits 字段）
- Logic: 裁决权需要实验证据 → 但无候选可实验 → 工具先备好、裁决延期 → 不悬空不空转
- choice_reason/impact: 范围可控；DEFER-002 的裁决落地条件写明
- consequences_and_risks: 期间 remove_candidate 只展示，人可凭证据自行判断
- rejected_alternatives: 本期执行消融（无候选）；完全不做（裁决权悬空无工具）
- unresolved_items/owner: 负例库字段与分域校验器 → build-spec 定义（detail 审查 FND-D04）
- Supersedes: none

### D-005（完成判据：测试+审查即结束；业务目标标未验证）
- question/final_option: 完成判据与业务目标关系？→ 收窄为基础设施+标未验证
- recommendation/plain_language: 推荐（用户 T-012 原判）
- decision: 完成=确定性测试绿+独立审查完成；"step/skill 必要性""人工介入减少"标【未验证，待真实任务数据】；真实数据验证延期（后续有问题→用户重开任务）；独立审查 unavailable 时完成声明=incomplete 等用户确认，不伪造
- source_type/reference/exact_excerpt: Talk round2 q12-real-dep 原文 + round3 q13/q16
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: 治理（缺质量事实不能宣称完成）；F-003（上游 AC-001 deferred）；方向审查 FND-002/006
- Logic: 用户明确不等待真实数据 → 本期交付物范围=基础设施 → 业务目标如实标注未验证 → 完成声明与目标分离
- choice_reason/impact: 快收尾、不拖周期；代价：本期无法证明业务收益
- consequences_and_risks: 后续需靠真实任务验证；负面：可能基于未验证判断被引用（由"待验证"标注缓解）
- rejected_alternatives: 加真实抽查门槛（周期风险）；维持原样（审查指出冲突）
- unresolved_items/owner: 无
- Supersedes: 覆盖 T-005 中"2 个真实任务抽查作为完成条件"

### D-006（前期质量税：口径+诚实视图）
- question/final_option: 质量税形态？→ 口径定义+聚合视图，样本不足诚实标注
- recommendation/plain_language: 推荐；有数据出真值、无数据标 insufficient
- decision: 质量税＝口径定义（interventions.attribution+step_slug 对上游 stage 归因规则）+页面趋势区聚合视图；数据不足显示 insufficient_samples；不作因果结论
- source_type/reference/exact_excerpt: Talk round1 q6-tax「要，正式产出」+ round3 q15「口径+诚实视困（推荐）」
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: interventions 字段（schema v1）；F-101；方向审查 FND-005/009
- Logic: 需要业务导向指标 → 无遥测+无真实数据 → 口径+诚实视图 → 不撒谎不悬空
- choice_reason/impact: 正式产出但口径诚实；影响页面趋势区与聚合器
- consequences_and_risks: 早期全 insufficient；归因基于自评干预记录，置信度有限
- rejected_alternatives: 只定义口径（无视图）；全延期
- unresolved_items/owner: 质量税分子/分母、上游 stage 归因规则、多重归因与未知归因、时间窗口、最小样本、confidence 计算 → build-spec 定义（detail 审查 FND-D08）
- Supersedes: none

### D-007（持久化位置与治理登记）
- question/final_option: 新文件放哪？→ 全局存储根，独立候选池文件
- recommendation/plain_language: 推荐；与 monitor 同层、跨任务聚合直
- decision: evolution-candidates.jsonl / negative-results.jsonl / attempted-edits.jsonl 落 `<storageRoot>/Projects/<proj>/`；按对象真实 consumer 不变。owner=本任务机制；删除条件=M16 退役时一并删除或只读归档。move-map 只登记新增生产文件/命令/schema、四个 runtime object metadata 和修改过的生产 producer；任何 test-only wrapper/checker/browser/review/aggregate 文件都不进入 move-map，而由各自 fixture manifest 或 canonical gate evidence 跟踪。T001 创建并拥有 P1 RED baseline/checker/wrapper；T009 只拥有最终治理/browser/review/aggregate test-only checks，并在 allowed temp storage root 用真实 producer 创建四对象、绑定 hash/producer identity、验证 runtime metadata 后清理，再完成生产面 move-map 双向 closure。T007 零 repo 写，只消费 frozen T009 move-map hash与这些脚本并成为 browser evidence 唯一 producer；脚本缺陷返回 T009 修复并重做 closure，旧 evidence 自动 stale。T010 对 repo/product/material/move-map/browser evidence 只读；task-quality 只有两类受控 writer：现有 `review --action=record` 写 immutable review receipt，final aggregate runner 原子写唯一 `quality/tests/m16-final-aggregate.json`，其中同时绑定 focused/repository 结果与 review receipt refs/hashes，不另写 focused/repository 持久 JSON。正式 review record input 只能由 T010 orchestration 写入 task-owned 0700 temp root 的 canonical JSON 文件，绑定 attempt/owner/sha256，并在所有出口只清理同 owner/hash temp；全局存储根决策不变
- source_type/reference/exact_excerpt: Talk round1 q7-storage「全局存储根（推荐）」+ round2 q9「独立候选池文件（推荐）」
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: 治理（新增持久对象登记 consumer/owner/删除条件）；F-101
- Logic: 用户选择全局根 → 文件存在 → 一个消费者声明 → 治理合规
- choice_reason/impact: 与页面模式一致；需写 move-map 登记
- consequences_and_risks: 仓外文件，无版本管理
- rejected_alternatives: 仓库内（读取绕）；任务目录（双写复杂）
- unresolved_items/owner: 无
- Supersedes: none

### D-008（非目标与延期清单）
- question/final_option: 非目标/延期确认？→ 六条全部接受；消融执行/市场对照调研/真实数据验证延期
- recommendation/plain_language: 推荐；边界写死防隐性扩大
- decision: 非目标＝不重建遥测/不自动改/不改五阶段 workflows 或其入口技能/不重复 eval 库/不回填/不破坏任务视图；D-008 已授权修改的 `stage-reflection` diagnostic skill、bundle 与 catalog 是当前生产 consumer contract，不是五阶段 workflow/入口技能目录变更，其 owner=stage-reflection producer，保持现有 invocation 兼容，并由 skill contract+stage-reflection E2E 验收；延期＝消融执行与 remove 裁决、市场对照实际调研（只留槽位）、真实任务数据验证；外部 skill 更新检查本期做
- source_type/reference/exact_excerpt: Talk round2 q10「全部接受（推荐）」+ q11 追问答案
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: 用户对术语解释后选择；R-013/R-014
- Logic: 边界收敛 → 防范围吞并 → 延期项显式交接
- choice_reason/impact: 本期范围稳定
- consequences_and_risks: 延期项需要后续任务承接（记录在风险与延期交接）
- rejected_alternatives: 市场对照自动搜（成本高）；消融本期限
- unresolved_items/owner: 无
- Supersedes: none

### D-009（迭代简报与负例/台账写入通道）
- question/final_option: 简报与写入通道形态？→ CLI 按需生成；负例/台账按需写入（人/agent 拍板时）
- recommendation/plain_language: 推荐；零 AI 装配、无历史可挖
- decision: iteration-brief.md 由模板渲染，区块=候选池（两档）+负例库+改动台账+外部 skill 更新检查+【保留行为清单（preserve behaviors）】+【未决 decision-log 项（open decisions）】+市场对照槽位；CLI generate-iteration-brief 按需触发（输入/筛选/输出路径/失败态由 spec 定义）；negative-results/attempted-edits 不做历史自动挖掘，由 agent 在用户拍板改动时写入（含 decision_id，附校验器）
- source_type/reference/exact_excerpt: R-003/R-005/R-007；roadmap M16 产出物 4（preserve-behaviors.md）；Talk round2 q9；grill 不提问推理记录
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: roadmap 要求简报含候选/负例/外部更新/市场对照/保留行为/未决 decision 项；无历史 attempted-edits；页面不能执行
- Logic: 迭代入口=准备改时用 → CLI 按需 → 零 AI 模板渲染 → 台账写入点=决策时
- choice_reason/impact: 成本低、可追溯；影响新增 CLI 与 schema
- consequences_and_risks: 早期负例库/台账为空（诚实 empty 态）
- rejected_alternatives: 自动挖历史（LLM 推断违规/成本）
- unresolved_items/owner: 简报输入/输出/失败态与简报窗口 → build-spec 定义（detail 审查 FND-D09）
- Supersedes: none

### D-010（候选池诚实状态与证据门槛）
- question/final_option: 上游证据不足时如何呈现？→ 强制 unavailable/deferred/待验证状态
- recommendation/plain_language: 推荐；防把待验证证据当可决策结论（审查 FND-010）
- decision: 候选池/趋势区/简报强制保留状态标注（empty/stale/insufficient_samples/待验证）；上游 stage-reflection 真实验证未完成时，候选只出"待验证候选"；不输出完成性结论
- source_type/reference/exact_excerpt: 方向审查 FND-010；D26/D30 精神
- approval_binding: accepted（2026-08-31 用户最终确认 approve1；host-visible 绑定=GUI ask_user_question，无正式 host attestation，如实保留）
- facts_and_constraints: F-003（AC-001 deferred）；F-101（投影器 fail-closed）
- Logic: 上游未验证 → 下游不准装结论 → 状态显式 → 诚实
- choice_reason/impact: 治理合规；影响页面与简报文案
- consequences_and_risks: 页面早期多为待验证/insufficient
- rejected_alternatives: 照常输出（把不完整证据当可决策结论）
- unresolved_items/owner: 无
- Supersedes: none

## 关键事实

| fact_id | 事实 | 来源 |
| --- | --- | --- |
| F-001 | stage-reflection 已合入 main（merge f4dc0174e，归档 706d9e974），五个 workflow 的 steps.json 均已挂 on_stage_end 复盘 step；skills/stage-reflection/SKILL.md 在 repo | git log；workflows/*/steps.json |
| F-002 | 复盘数据层已就绪：每 stage 产出 quality/stage-reflection/<stage>.json（judgments 六类 + interventions + lessons_added）、lessons 索引（raw_observation/merged_lesson）、消费边（derive-consumption-edges）、remove 双硬信号门槛 + validate-stage-reflection.mjs 强制降级 | stage-reflection spec §5.1-5.8（归档 worktree） |
| F-003 | stage-reflection 自身验收缺口：AC-001（真实任务端到端 + 用户判断质量抽查）标 deferred_to_next_real_task；wh-review 异源审查 unavailable。即：**真实业务任务上尚无用户确认的复盘质量背书** | archive tasks.md T20/T21；spec AC-001 |
| F-004 | 本任务 bootstrap：baseline=706d9e974，worktree=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-m16-evolution-20260831，session_binding=unavailable:session_task_binding_mismatch（保留为事实，不伪造绑定） | task-bootstrap 输出 |
| F-005 | roadmap M16 原设计依赖 M15 遥测事实；M15 退役后该依赖已被 stage-reflection 判断层取代（D-011） | roadmap.md:462；stage-reflection decision-log.md:204 |
| F-006 | 负例库/尝试台账的消费者：D24 eval 分域（negatives 只收 harness/process/skill-edit 失败，执行失败仍归 D24）；attempted-edits 由 decision_id 关联本仓库 decision-log | roadmap.md:450,451,457,458 |
| F-007 | 市场借鉴（上轮调研）：OpenAI Eval Skills（分层检查、LLM-judge 兜底+结构化 schema、人工修复=测试信号）、compound-learning（经验候选≤3 条/phase、分库）、Anthropic（skill 最小可测单元、with/without 基线、5 类迭代触发）、Agent-as-a-Judge（中间步骤评估）、Opik（可抄指标分类不引入平台） | artifacts .research-*.md；调研记录 |
| F-008 | 上轮分析结论：M16 候选池主键建议 skill/stage 粒度；"必要性只能实验证明"；候选池应显式标注 judgment≠fact | 会话分析（2026-08-31） |

## 需求→决策覆盖矩阵（五维）〔更新至 2026-08-31 direction/detail 后〕

| 维度 | 需求 | 当前处置 |
| --- | --- | --- |
| business goal | R-011/R-012 | DECIDED：D-001/D-006/D-005（本期基础设施+质量税视图；必要性标未验证） |
| flow/surface | R-003/R-010 | DECIDED：D-002/D-009（页面只读趋势区+简报 CLI） |
| data/state | R-001/R-002/R-005/R-008/R-014 | DECIDED：D-003/D-007/D-010（判断入池+全局根+诚实状态）；schema 细节 OPEN-12/15 |
| success/failure/acceptance | R-009 及验收标准 | DECIDED：D-004/D-005（协议+台账；测试+审查即结束） |
| constraints/non-goals/deferrals | R-004/R-006/R-007/R-013 | DECIDED：D-008（六条非目标+延期清单）；简报区块补 preserve behaviors（OPEN-14） |

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001（Q1 使用方式） | 按需为主 / 定期批量 / 两者都要 | 按需成本低但平时无感；定期可能看旧数据；两者最全但实现面更宽 | 两者都要（用户选择「两者都要」） | 候选池增加定期聚合态 | talk round 1 用户答案（ask_user_question id=q1-flow） |
| T-002（Q2 页面范围） | 不动页面 / 只读趋势区 / 独立新页 | 不动范围最小；趋势区直观但要改页面投影器；独立页是又一套维护面 | 加只读趋势区（「加只读趋势区」） | M16 范围纳入 build-reflection-page 扩展 | 同轮 q2-page |
| T-003（Q3 判断入池） | 允许带标签判断 / 只收机器事实 / 先允许后验证 | 允许=智能判断基础，需修订 D31 白名单；只收=信号弱；先允许后验证=多一步回头 | 允许带标签的判断（「允许带标签的判断（推荐）」） | D31 白名单修订列为 D 条目 | 同轮 q3-judgment |
| T-004（Q4 消融实验） | 只做协议和台账 / 完整机制 / 全延期 | 协议+台账不空转；完整机制当前无候选可用；延期则裁决无着落 | 只做协议和台账（「只做协议和台账（推荐）」） | 完整实验执行延后为延期项 | 同轮 q4-ablation |
| T-005（Q5 验收样本） | 构造+2真实抽查 / 只等真实 / 仅构造 | 构造+抽查周期可控且真实；只等真实周期长；仅构造真实性未知 | 构造+2个真实任务抽查（「构造+2个真实任务抽查（推荐）」） | 验收判据=机制全链路+2 个真实任务抽查达标 | 同轮 q5-acceptance |
| T-006（Q6 前期质量税） | 正式产出 / 简报按需 / 延期 | 正式产出=系统级指标可验证主线；按需简单平时无感；延期范围最小 | 要，正式产出（「要，正式产出（推荐）」） | 聚合器正式输出该维度 | 同轮 q6-tax |
| T-007（Q7 存储位置） | 全局存储根 / 仓库内 / 任务目录 | 全局根与 monitor 同层、跨任务聚合直；仓库内版本管理好但读取绕；任务目录双写复杂 | 全局存储根（「全局存储根（推荐）」） | 持久化位置确定，待治理登记 | 同轮 q7-storage |
| T-008（Q8 达标线） | 70% / 80% / 自由裁量 | 硬线可能因风格差异卡验收；自由裁量靠人把关 | 自由裁量（「自由裁量」）：抽查后由用户自由决定是否认可，完成声明以用户口头确认为准 | 认可率不设硬阈值 | round 2 q8-threshold |
| T-009（Q9 候选池形态） | 独立候选池文件 / 不单独存 | 文件符合 roadmap 白名单 schema 且简报直读；不存则每次现算 | 独立候选池文件（「独立候选池文件（推荐）」）：evolution-candidates.jsonl 放全局存储根 | 候选池=持久化产物 | round 2 q9-pool-form |
| T-010（Q10 非目标） | 全接受 / 要调整 | — | 全部接受（「全部接受（推荐）」） | 非目标定稿 | round 2 q10-nongoals |
| T-011（Q11 消融/市场对照） | 只做架子/连执行/全延期；槽位/自动搜/不留 | 用户初看不懂术语，解释后选择 | 「只做架子（推荐）」+「只留槽位（推荐）」；外部 skill 更新检查本期做（用户原文：外部skill更新检查可以做） | 消融=协议+台账（执行延期）；市场对照=槽位；外部更新检查=本期 | round 2 追问 q11a/q11b |
| T-012（Q12 真实任务依赖） | 接受等待 / 真实抽查延后 | 等待真实数据会拖住完成声明 | 用户自定义：**完成=测试+审查通过即结束，不等待真实任务数据**（原文：当前任务不用等待后续数据再完成，只要完成测试和审查当前任务就可以结束，如果后续有问题我会重新开启这个任务进行修改，不要等待真实任务数据） | **Supersedes T-005 中的"2 个真实任务抽查作为完成条件"**；真实数据验证改为延期交接（后续问题→用户重开任务） | round 2 q12-real-dep |

> 第 2 轮补充事实：用户对术语"消融实验/市场对照"不熟悉，本轮先解释后重选（round 2 内完成）；Q11 最终=消融只做架子、市场对照只留槽位、外部更新检查本期做。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-01 | ~~用户使用流程~~ | 已定：两者都要 | Talk round 1 ✓ → D-001 |
| OPEN-02 | ~~页面范围~~ | 已定：只读趋势区 | Talk round 1 ✓ → D-002 |
| OPEN-03 | ~~判断入池~~ | 已定：允许带标签判断（D31 修订） | Talk round 1 ✓ → D-003 |
| OPEN-04 | ~~消融实验范围~~ | 已定：协议+台账 | Talk round 2 ✓ → D-004 |
| OPEN-05 | ~~验收样本~~ | 已定：完成=测试+审查；真实数据验证延期（Supersedes 原 2 真实抽查） | Talk round 2 ✓ → D-005 |
| OPEN-06 | ~~前期质量税~~ | 已定：正式产出 | Talk round 1 ✓ → D-006 |
| OPEN-07 | ~~存储位置~~ | 已定：全局存储根，独立候选池文件 | Talk round 2 ✓ → D-007 |
| OPEN-08 | ~~抽查阈值~~ | 已定：自由裁量 | Talk round 2 ✓ → D-005 |
| OPEN-09 | ~~非目标清单~~ | 已定：全部接受 | Talk round 2 ✓ → D-008 |
| OPEN-10 | ~~趋势区接入~~ | 已定：复用 overall_pending 聚合逻辑，方案 A 扩展投影器（F-101） | 调研+Talk 2 ✓ |
| OPEN-11 | ~~独立方向建议处置~~ | 已定：findings 全部已处置（见审查处置） | direction-advice ✓ |
| OPEN-12 | 候选池完整 schema/聚合键/机器信号阈值/去重陈旧规则/subject 粒度映射 | detail 审查指出方向只到字段级 | build-spec 在 spec.md 定义（决策不变） |
| OPEN-13 | 质量税口径（分子分母/归因规则/多重归因/窗口/最小样本/confidence） | detail 审查指出仅概念无法实现 | build-spec 定义 |
| OPEN-14 | 简报输入/输出/失败态与 preserve behaviors、open decisions 区块定义 | detail 审查指出 R-003 区块未全 | build-spec 定义 |
| OPEN-15 | negative-results 字段与 D24 分域的机器校验规则 | detail 审查指出治理无法强制 | build-spec 定义（配校验器） |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-101 | 页面投影器/候选聚合输入的可扩展性（round 1 后调研） | 见下方展开 | 已完成，结论提交 round 2 | 待定 D-002/D-007 |
| F-102 | 市场方案对比（M0 调研 + 外部） | 见关键事实表 F-007/F-008 | 已完成 | 待定 D-003 |

**F-101 展开**（source: build-reflection-page.mjs / -template.html / validate-stage-reflection.mjs / stage-reflection.v1.json / append-lesson-observation.mjs）：

1. 投影器参数 `--root/--tasks-root/--out/--now`；输出 `globalThis.__WH_MONITOR_DATA__ = Object.freeze(...)`，顶层键 schema_version=`workflowhub-reflection-page.v1`、tasks[]、overall_pending[]、lessons、consumption_edges、filters、states、coverage、diagnostics、source.ai_used:false（build-reflection-page.mjs:427-462）。
2. **overall_pending 已是判断层候选池雏形**：按 subject_id×subject_kind×classification 分组，字段 score/frequency/first_seen/recent_seen/source_task_stages/reason/severity/suggested_action/judgment_layer:"judgment"/is_fact:false；30 天窗口、权重 high3/medium2/low1、任务×stage×subject 去重（:338-385）。
3. 复盘文件 schema：judgments[]（subject_id/subject_kind/classification 七类/severity/reason/evidence_refs[]/confidence/next_review_trigger）、interventions[]（confirmation_ref/step_slug/reply_text/attribution/confidence）、lessons 行（raw_observation: merged:false；merged_lesson: lesson/severity/occurrence_count/source_refs/supersedes）（runtime/schemas/stage-reflection.v1.json；append-lesson-observation.mjs:177-186,264-274）。
4. 只读趋势区接入点：方案 A 扩展现有投影器（project() 追加候选/趋势键 + 模板加第三 Tab 区块 + 测试同步），文件面 3 个：`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tests/contract/build-reflection-page.test.mjs`；可复用 SEVERITY_WEIGHT/WINDOW_MS/SAFE_REF/freeze/fail-closed 全套约束，不新增数据源与 spawn。方案 B（独立脚本+独立页面）需重写保证机制并产生第二个 consumer，否决。
5. `overall_pending` 已有 `suggested_action` 字段（页面按 classification 映射显示），判断层标记 `judgment_layer:"judgment", is_fact:false`，judgment≠fact 防线已存在。

> 本轮执行事实：research-inputs 完成（2026-08-31）；结论：Q2 只读趋势区可行且文件面小；候选池可复用 overall_pending 聚合逻辑。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 候选池排序对自评偏袒的暴露面；两档 vs 一档 | 用户拍板：两档（机器信号强=建议行动，仅判断=仅供参考）；自评偏袒用机器信号优先+消融定案缓解（沿用 ADR 0021 自审边界） | ADR 0022 创建；退出四项 check 见下 | grill round 1（g1-tiers） |

- **Grill 覆盖矩阵**：goal=R-011/R-012 ✓；flow_or_surface=R-003/R-010 ✓；data_or_state=R-001/R-002/R-005/R-008/R-014 ✓；success_failure_acceptance=R-009+验收 ✓；constraint_non_goal_defer=R-004/R-006/R-007/R-013 ✓——五类全覆盖，无未决消息类。
- **四项退出检查**：①外部依赖接口已核实真实定义（F-101：derive-consumption-edges/append-lesson-observation/build-reflection-page 契约实测）pass；②字段/路径唯一权威来源（roadmap R-002/R-005 给出 evolution-candidates.jsonl/negative-results.jsonl/attempted-edits.jsonl/iteration-brief.md 规范名，stage-reflection schema 给出输入字段）pass；③失败路径语义明确（投影器 fail-closed/fatal/empty/stale，候选池 insufficient_samples/待验证标注）pass；④范围边界写死（非目标六条用户确认，无隐性扩大）pass。
- **不提问的推理记录**：①简报触发方式=CLLI 手动/按需（monitor 页面纯静态不能执行、新增 stage 违反非目标，CLI 是唯一可行承载）→不提问；②负例库写入=按需手工/agent 在决策时记录（无历史 attempted-edits 可挖、LLM 推断违规）→不提问；③"定期聚合"承载=随页面投影运行顺带产出（无 cron 控制面，不新增控制面）→不提问。
- **grill 后文档**：CONTEXT.md＝changed（新增候选池/迭代简报/负例库与改动台账/消融实验/前期质量税五术语，docs 引 ADR 0022:FILE docs/adr/0022-candidate-pool-judgment-whitelist.md）；ADR＝created 0022（三判据均为真：难反转/无背景意外/真实取舍）；术语与 ADR 0021 冲突＝无（本 ADR 继承判断层身份标注）。
- G-001 决策更新：候选池两档分层。

## 审查处置（direction-advice，2026-08-31）

- 独立方向建议（wh-review make-decision/direction）：**available**，4 家异源 provider 完成（kimi/coding、antigravity/flash、opencode/pax3.8、codex/luna）；material_id=b207c0df…，runtime_id=7827e6ed…；完整 findings 见 `quality/evidence/direction-review-d1a1c3ef.json`。
- 执行事实：worktree 无 node_modules，以符号链接复用 main node_modules 后 CLI exit 0；provider 真实返回（antigravity 无 usage 字段，如实保留）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | attempted-edits 必须含 decision_id（R-005）未体现 | 改动不可追溯 | fixed（方向补充） | 折入决策草稿 D-00x | agent/用户/保留 |
| FND-002 | 完成判据 vs 业务目标（必要性验证）冲突 | 可能基于未验证数据优化 | needs_human | Talk round 3（Q13） | 用户 |
| FND-003 | remove 裁决权 vs 消融执行延期 | 治理缺口 | needs_human | Talk round 3（Q14） | 用户 |
| FND-004 | 市场对照槽位 vs R-001..R-007 | 槽位待定义 | accepted_risk（用户已决 T-011）+ 槽位 schema 留 build-spec | 用户决定记录 | 用户/保留 |
| FND-005 | ⑦质量税正式产出 vs 数据源缺失 | 只降级为 schema/协议 | needs_human | Talk round 3（Q15） | 用户 |
| FND-006 | ⑧审查硬门 vs wh-review 历史 unavailable | 交付时可能无法完成 | needs_human | Talk round 3（Q16） | 用户 |
| FND-007 | 迭代入口四项自动带出，方向漏 negative-results | 简报缺负例 | fixed（方向补充） | 折入决策草稿 | agent/保留 |
| FND-008 | 候选池无身份/版本/去重/陈旧/冲突模型 | 长期聚合漂移 | fixed（方向补充） | 折入决策草稿（candidate_id/schema_version/status/supersedes 入白名单） | agent/保留 |
| FND-009 | 质量税口径/归因规则/基线未定义 | 因果不可证 | fixed（与 FND-005 合并处置） | 口径定义折入决策草稿 | agent/保留 |
| FND-010 | 上游 evidence 门槛（AC-001 deferred 等） | 可能把待验证证据当可决策结论 | fixed（诚实状态原则折入） | 候选/趋势/简报强制保留 unavailable/deferred 状态 | agent/保留 |

**detail-advice（2026-08-31）**：available，5 家 provider（kimi/coding、grok/grok、antigravity/flash、opencode/pax3.8、codex/luna）；material_id=359d7d62c6ec…；完整 findings 见 `quality/evidence/detail-review-1012d69b-d4a2-4523-8048-bc3002681360.json`；provider 真实返回，耗时约 16 分钟（低模型配置，如实保留）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-D01 | D-004 误把 R-005 全字段挂到 negative-results | schema 归属错 | fixed | D-004 改写：attempted-edits 全字段；negative-results 字段/分域规则归 spec | agent/保留 |
| FND-D02 | OPEN-11 未清理 | 文档陈旧 | fixed | OPEN-11 标记已解决 | agent/保留 |
| FND-D03 | DEFER-001/002 与 stage-reflection 编号冲突 | 交接歧义 | fixed | 本任务延期改 DE-xxx 编号 | agent/保留 |
| FND-D04 | 简报缺 preserve behaviors / open decision 项（R-003/R-007） | 简报不完整 | fixed | D-009 补两块；细节 OPEN-14 | agent/保留 |
| FND-D05 | 覆盖矩阵/追踪行未随进展更新 | 文档陈旧 | fixed | 矩阵与未决项已更新 | agent/保留 |
| FND-D06 | approval_binding pending 却写"可进入 build-spec" | 提前启动风险 | fixed（待用户确认后补 binding） | 质量边界/最终确认措辞修正；确认卡待用户 | 用户 |
| FND-D07 | 候选 schema/聚合键/阈值/去重/粒度映射未定义 | 无法实现可重复聚合器 | fixed（索引到 spec） | OPEN-12 → build-spec 定义 | agent/build-spec/保留 |
| FND-D08 | 质量税口径未定义 | 无法实现 | fixed（索引到 spec） | OPEN-13 → build-spec 定义 | agent/build-spec/保留 |
| FND-D09 | 简报输入/输出/失败态未定义 | 无法实现 | fixed（索引到 spec） | OPEN-14 → build-spec 定义 | agent/build-spec/保留 |
| FND-D10 | attempted-edits 校验器/decision_id 检查/D24 分域机器规则缺失 | 治理无法强制 | fixed（索引到 spec） | OPEN-15 → build-spec 定义（配校验器） | agent/build-spec/保留 |

> direction-advice 是可成文事实，非 pass gate：available 仅表示至少一家返回有效 findings；findings 处置随 Talk round 3 用户答复收敛。

| T-013（Q13 目标与完成标准） | 收窄基础设施+标未验证 / 加真实抽查 / 维持原样 | 独立审查 blocking 指出完成判据与业务目标冲突 | 收窄为基础设施+标未验证（「收窄为基础设施+标未验证（推荐）」） | 目标分层：本期=候选池+简报+台账+协议；"step/skill 必要性""人工介入减少"标注【未验证，待真实任务数据】 | round 3 q13-goal |
| T-014（Q14 删 step 裁决权） | 只准备工具裁决延期 / 本期最小消融 | 独立审查指出裁决权悬空 | 只准备工具，裁决延期（「只准备工具，裁决延期（推荐）」） | remove 裁决权明确延期；remove_candidate 标【待裁决】 | round 3 q14-remove |
| T-015（Q15 质量税形态） | 口径+诚实视图 / 只定义口径 / 全延期 | 独立审查指出无数据源 | 口径+诚实视图（「口径+诚实视困（推荐）」） | 质量税=口径定义+聚合视图；数据不足显示 insufficient_samples | round 3 q15-tax |
| T-016（Q16 审查不可用） | 挂 incomplete 等确认 / 人工复核替代 | 独立审查指出 wh-review 历史不可用 | 挂 incomplete 等确认（「挂 incomplete 等确认（推荐）」） | 审查 unavailable 时完成声明=incomplete，由用户知情确认，不伪造 | round 3 q16-review-fail |

**findings 处置更新**：FND-002→needs_human 已答 fixed（T-013）；FND-003→fixed（T-014）；FND-005/009→fixed（T-015）；FND-006→accepted_risk（T-016，挂 incomplete 等确认）；FND-004 保留 accepted_risk（用户已决 T-011）。

## 风险与延期交接

> 编号说明：为避免与 stage-reflection 的 DEFER-001/002（数据依赖/消融裁决）混淆，本任务延期项编号用 DE-xxx。

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 判断层自评偏袒（stage-reflection D-002 遗留） | 候选排序带偏 | 两档分层+机器信号优先+消融定案；用户 |
| RISK-002 | wh-review 不可用 | 完成声明挂 incomplete | 用户知情确认或重试；用户 |
| RISK-003 | 上游真实验证 deferred（AC-001） | 候选/质量税只能出"待验证" | 状态显式标注；后续真实任务 |
| RISK-004 | 与 stage-reflection 共享投影器 | 改动破坏既有视图 | 契约测试保持绿；本任务 |
| DE-001 | 消融实验执行与 remove 最终裁决 | 出现候选后无裁决机制 | 延期；后续任务/用户按需触发 |
| DE-002 | 真实任务数据验证（必要性/人工介入减少/用户判断抽查） | 业务目标无法本期验证 | 延期；有问题用户重开任务（用户拍板 T-012） |
| DE-003 | 市场对照实际调研 | 简报只有槽位 | 延期；用户按需触发外部调研 |

## 质量边界

- 质量事实：direction-advice available（4 provider，evidence=direction-review-d1a1c3ef.json）；detail-advice available（5 provider，evidence=detail-review-1012d69b….json）；测试/审查事实由 build-code/verify 阶段产生。
- 推进资格：Talk 三轮/Grill/调研/两次独立建议全部完成并处置；**等待用户最终确认（approval_binding 补齐前不宣称可进入 build-spec）**。
- 完成判据：确定性测试绿+独立审查完成即结束；业务目标【未验证】；wh-review unavailable 时 incomplete 等确认。
- 不可逆授权边界：本阶段无不可逆动作；后续 close 五动作按既有确认流程。

## 最终确认

- 状态：**accepted**（2026-08-31）
- 用户原文与 host-visible 绑定：用户原文＝「确认，收口当前阶段吧，然后停下来通知」（approve1）——经 GUI ask_user_question 真实回复；host-visible 绑定（正式 host attestation/receipt）在本会话环境不可用，如实保留为 unavailable，不伪造绑定。
- 未确认内容：无方向性未决；OPEN-12~15（schema/口径/简报/分域细节）由 build-spec 在 spec.md 中定义，决策已定。

## 阶段收口校验（spec-analyze，2026-08-31）

- make-decision 语义覆盖自检（verifier=main agent 手动执行 spec-analyze  профиль的 7 项检查；runtime 认证的 spec-analyze outcome 因未走 stage-runner 保持 unavailable，如实保留）：
  1. 原始需求 R-001..R-014 → D-001..D-010 映射：全表无遗漏（见覆盖矩阵，5/5 维度 DECIDED）✓
  2. 原始需求/FR/AC/流程/状态/边界/非目标/延期一致表示：原始需求表+目标+成功/失败边界+范围+非目标+D 条目+风险延期交接+未决项存在且互指 ✓
  3. 无矛盾/漂移/范围吞并：detail 审查 FND-D03/D06 已修复（DE 编号、确认措辞）✓
  4. 任务与 AC：本阶段为决策阶段，无 Phase；AC 由 build-spec 承接（决策卡指明）✓
  5. DEFER/OPEN 交接：DE-001~003 与 OPEN-12~15 均有 owner/触发/消费/关闭条件（见各自表格）✓
  6. packet 证据 vs 推断：两轮审查均为真实 provider 输出，findings 逐条处置 ✓
  7. 发现项（若有）在本地修复后再声明完成：无遗留语义 finding（OPEN-12~15 属下层 spec 定义，方向不变）✓
- 结论：make-decision 语义覆盖通过（手动口径）；认证口径 unavailable，如实保留。

> 本轮执行事实：task-bootstrap exit 0（见 F-004）；session-event 记录命令因 session_task_binding_mismatch 失败，保留为 unavailable；load-context 工作稿初写；Talk round 1 真实 ask→reply 完成（2026-08-31）。
> 下一步：research-inputs（调研页面投影器/候选聚合输入的可扩展性），随后 Talk round 2。
