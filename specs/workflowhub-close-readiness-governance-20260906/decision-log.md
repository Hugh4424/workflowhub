# Decision Log — workflowhub-close-readiness-governance-20260906

> 生成日期：2026-09-06
> 任务材料路径：specs/workflowhub-close-readiness-governance-20260906/（认证 worktree）
> 当前 stage：make-decision（step 10 detail-advice 完成，findings 处置中；下一步 step 11 approve-decision）

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 最近执行 WorkflowHub 任务时，任务执行到最后都有问题：verify-code 时会发现一大堆问题导致任务无法继续，最终只能进行风险 close | 用户原话："我最近在执行workflowhub任务的时候，发现这些任务执行到最后都有一些问题，verify-code时会发现一大堆问题导致任务无法继续，最终只能进行风险close" | 已覆盖（D-001/D-101/D-202；风险 close 认知差异见 D-101） |
| R-002 | 检查这些任务的过程以及总结文件，找到 workflowhub 出了什么问题 | 用户原话："请检查这些任务的过程以及'/Users/Hugh/Downloads/workflowhub-m17-missing-stage-close-analysis-20260905.md'的总结文件，帮我看看workflowhub是出了什么问题？" | 已覆盖（D-001/D-101；F 表+核实表） |
| R-003 | 必须按标准 WorkflowHub 流程执行：先创建 worktree、从 make-decision 开始、不跳阶段、不依赖 build-spec 补需求 | 用户原话："请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求" | 已覆盖（D-002/D-402；Step 1-8 记录） |
| R-004 | 在 make-decision 过程中与用户一起仔细梳理：完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 用户原话："先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项" | 已覆盖（目标/成功失败边界/范围/非目标节；D-203/D-204） |
| R-005 | Talk 用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接 | 用户原话："Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接" | 已覆盖（T 表+Step 记录；D-401） |
| R-006 | 总结文件里给出的推荐改造方案（canonical gap/current selector/close-readiness 预检/状态分层等）是否作为本任务方向，由 make-decision 与用户收敛后确认 | 来源：总结文件"推荐实施顺序"一段；建议，非已确认需求 | 已覆盖（D-201~D-204；聚焦改造经 Talk2/3+裁决确认） |
| R-007 | 评估 requirement-convergence-depth 任务（make-decision 强升级）的实现效果 | 用户原话："我们之前一起做了...把make-decision阶段做了很强的更新升级，请你基于当前make-decision的执行情况，帮我看看这个任务实现的效果如何？" | 已分析（F-031~F-033；research-Q1） |
| R-008 | 诊断 build-spec/build-plan 阶段 token 消耗巨大（"好几亿"）的根因，并给出优化；评估是否可做 make-decision 式上下文管理与子代理派发优化 | 用户原话："到了build-spec和build-plan阶段缺花费了大量的时间和token，一个任务的spec和plan阶段要花费好几亿token...为什么会这样？应该如何优化？是不是也可以进行类似make-decision一样的上下文管理和子代理派发优化？" | 已分析（F-034~F-036；research-Q2）；优化机制经 Talk R1/R2 收敛（T-014~T-020） |
| R-009 | 评估"高智力模型做 spec/plan 设计、低智力模型做 code/verify 执行"思路的效果；**用户澄清后真实含义**=四材料（decision-log/spec/plan/tasks）是否足够清晰、专业、详细，足以让低智力模型在 build-code/verify-code 也保证交付质量 | 用户原话1："我目前的workflowhub流程主要靠make-decision阶段把需求彻底确定，然后靠着高智力模型在build-spec和build-plan阶段设计详细的执行方案，后面build-code和verify-code阶段派出智力一般的模型来执行...请帮我看看目前这个思路执行的效果如何？"；用户原话2（Q4 澄清）："我只是让你分析一下目前decision-log、spec、plan、tasks是否足够清晰专业详细，足够后面build-code和verify-code使用低智力模型也能保证交付质量，不是让你记录和建议各个stage的模型使用。" | 已分析（F-037~F-039；research-Q3）；模板升级经 Talk R2 收敛（T-017~T-018） |
| R-010 | 三问分析结论作为新需求放入当前任务一起开发；且新需求必须按 make-decision 完整流程收敛（Talk→审查→辩论→Grill→确认），保持与既有 verify-code 质量问题治理同等质量 | 用户原话："请基于上述三个问题帮我仔细分析，可以从make-decision第一步开始，重新收敛一些新需求，放在当前任务的里一起开发"+"我希望这些新需求也能按照make-decision的步骤从talk到审查到grill都完整进行一遍，保证这些需求能和之前的verify-code质量问题保持一样的质量" | 本文件继续 make-decision：R-007~R-009 进入同一决策收敛环（本轮） |

### 需求框架（function/research 先选一类）

- **framework**：外层 `functional`（背景→问题→目标→方案→验收→扩展），`research`（问题→论断→证据→裁决）作为受影响节点（根因诊断）的子树证据；**已按 Talk R1/T-002 确认切换**（用户选定"诊断+治理改造落地"，任务从纯研究型升级为混合任务）。
- **选择理由**：原始需求直接表述为"看看 workflowhub 出了什么问题"（调研/裁决型）；Talk round 1 后用户确认"诊断+改造落地"→ 以 functional 为外层、research 为方案节点证据子树。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 functional 为外层，在受影响节点下挂 research 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 问题：verify-code 堆积问题→风险 close 的事实模式 | confirmed | ready | make-decision 主会话 | 无（核查完成） |
| N-002 | 论断：总结文件根因判定 | confirmed | ready | make-decision 主会话 | 无（框架结论成立、5 条断言证伪，见核实表） |
| N-003 | 证据：4 个任务过程与总结文件一致性 | confirmed | ready | 核查子代理 | 无（F-010~F-016） |
| N-004 | 裁决：治理范围+方案选项 | confirmed | ready | 用户 | 无（D-001/D-201/T-001~T-012） |
| N-005 | 新问题：build-spec/build-plan 阶段 token 消耗巨大+无度量 | confirmed | ready | 取证子代理（b12b32f9） | 无（F-033~F-035；research-Q2） |
| N-006 | 新论断：四材料质量对"低智力执行"保障=中；三缺口（标签错位/拒绝条件无表达位/verify 不验材料） | confirmed | ready | 取证子代理（a4d19fdd/f2368ca8） | 无（F-036~F-039；research-Q3） |
| N-007 | 新裁决：质量-成本治理增量（模板升级+verify 独立性+上下文优化） | confirmed | ready | 用户 | 无（T-013~T-020；本卡第 II 部分） |

## 目标

- 目标（已确认，T-001/T-002/T-006）：①交付经独立核实诊断（以 task store 核查为准，非总结文件原样）；②落地聚焦治理改造（收口预检链+唯一缺口源[弱义]+边界校验+状态分层）；③本任务 dogfood 验证（后期阶段真实使用改造后机制）。

## 成功/失败边界

- 成功边界（已确认）：
  - 诊断：每条根因结论能指认代码/事实位置（或"未验证"如实标注）；诊断含认知差异说明（用户主诉"风险 close" vs 事实：任务1=标准 close 且用户接受 quality incomplete；M17=manual-risk-close delivered_with_risk）；
  - 改造：9 字段收口最小合同+覆盖边界声明、预检三态只读、确认消缺、同快照确定性 gap_id+渲染层聚合、E 边界校验（协议不一致拒绝/语义缺失记录不阻断）、六状态分层展示、quality_status 独立来源；
  - 验收：每条已核查根因至少一条可证伪负向夹具/oracle；本任务后期 phase（D/E/F/G）真实使用新机制，观察到同一缺口不再重复；用户确认。
- 失败边界（已确认）：
  - 把未核实论断当事实（总结文件 5 条断言已证伪，未再引入）；
  - 新增违宪控制面（新 public 入口/新 store/持久 selector/新 gate/第二状态机/双写/永久 bridge）；
  - 假绿（findings:[] 绕过 provenance、unavailable 改写成通过、测试收据不绑当前快照仍算 fresh）；
  - 用户未确认就进入 build-spec。

## 范围

- 当前范围（已确认，T-006）：诊断+聚焦改造=①A+B 收口预检链（9 字段最小合同=producer/consumer/owner/命令/fixture/oracle/证据路径/freshness/close 条件；载体=spec.md AC 扩展字段；预检=只读 advisory 三态 ready/unknown/unavailable；覆盖边界声明）②D 唯一缺口源（同快照确定性派生 gap_id+渲染层聚合去重+消费 human-confirmation 消缺；不持久不登记）③E 边界校验（bridge agent_run_id===attempt_id、测试收据绑当前 snapshot/material）④F 状态分层（六状态分离展示；quality_status 唯一来源=独立质量决议）；C（build-code 首 phase 最小 smoke）与 G（review 语义收紧）并入阶段要求、C 标"未核查根因支撑、实施前先验证、可裁剪"。
- **逐项根因与核查状态**：①预检链←"build-plan 只查静态验收卡/收口可行性前移"（核查：✅支撑，F-022 无预检 ADR+无 preflight 输出；⚠️"aggregate 太晚"未直接核实，并入边界声明）；②唯一缺口源←"同一缺口多投影/无 current-fact selector"（✅支撑，F-018/F-019 别名固化+跨文件 1-6 次；✅确认断裂 F-013）；③边界校验←"内部协议错误在错误边界失败"（✅支撑，F-010/F-020/F-021）；④状态分层←"外部事实缺失分层不清/完成质量两套判定"（✅部分支撑：完成/质量并存属实，但"两套逻辑"准确表述为"派生源未共享"，见 F-017~F-019）；⑤C 冒烟←"aggregate 太晚"（⚠️未独立核实，标可裁剪）；⑥G review 语义←"findings:[] 语义漏洞"（✅支撑，F-015）。
- 用户流程（已确认）：五 stage 标准执行流程；预检→review→confirm/authorize→close 各自展示位；无页面（non_ui）。
- 页面范围：non_ui（三输入规则核实，见 UI applicability 节）。
- 数据状态（已确认）：六状态从既有事实派生、分离展示；预检三态只读；gap_id 域=单次渲染快照；缺口投影消费 confirmations；底层投影来源保留（去重仅渲染层）。
- 非目标/延期：见非目标节；延期项=预检载体形态（lens 复用 vs 新只读 profile）build-spec 按控制面登记规则验证、phase 精确边界归 build-plan、重放验证另立后续任务、diagnostic fixture schema 细节归 build-spec。

## 非目标（已确认，T-008/T-012）

- 不改历史任务记录（只读案例）；不重放真实外部任务验证（另立后续任务）；不做页面/前端 UI（本次为 CLI/JSON 展示改进）；不改宪法 close 三义；不新增公共入口/新 store/持久 selector 对象/新 gate/第五材料；外部 provider 不可用时如实记录 unavailable，不伪造通过；不做完整状态矩阵（归 build-spec 转译）；不做完整端到端流程设计（方向卡只补骨架与展示位表）；不"每阶段重跑预检"。

## 决定

按需求框架 solution 模块分四组：M1 任务形态、M2 诊断交付、M3 改造范围、M4 交付与验收。每条 `decision-entry.v1` 关键字段如下（approval_binding 待 step 11 用户确认后补绑定）。

### M1 任务形态

```text
### D-001
- question/final_option: 这个任务做什么？诊断+治理改造落地（用户 ①② 组合）
- recommendation/plain_language: 推荐；不算报告也不只改机制，而是"先查明再修好"
- decision: 新建独立治理任务，产出经核实的根因诊断与聚焦改造（代码+测试）
- source_type/reference/exact_excerpt: 用户原话"请检查这些任务的过程以及总结文件…看看workflowhub是出了什么问题？"+ Talk R1 ①② 回复
- approval_binding: pending（step 11）
- facts_and_constraints: F-005~F-008、F-010~F-016；宪法边界
- Logic: 历史任务在 verify/close 堆缺口 → 需先核实根因（避免把总结文件当事实）→ 再聚焦改造 → 后续任务受益
- choice_reason/impact: 用户确认；影响=本任务全仓库治理机制面
- consequences_and_risks: 周期长（横跨 5 处）；已明示
- rejected_alternatives: 仅诊断报告（不解决根因）；诊断+改造+重放验证（依赖外部、不可复现，延期）
- unresolved_items/owner: 无
- Supersedes: none
module: 任务形态
requirement_ids: [R-001, R-002]
derived_from: []
artifacts: []
```

```text
### D-002
- question/final_option: 实施形态？一个任务多 phase（用户确认）
- recommendation/plain_language: 推荐；免任务间交接收口
- decision: 本任务内 build-code 分 phase（预检链/唯一缺口源+状态分层/边界校验），每 phase 独立开发测试验收审查
- source_type/reference/exact_excerpt: Talk R2/Q4 回复"① 一个任务多 phase（推荐）"
- approval_binding: pending
- facts_and_constraints: 宪法"同任务修复"；历史任务跨任务交接断裂模式（共同模式 5）
- Logic: 改造面跨 5 处 → 多 phase 分而治之 → 但同一任务内切换无交接
- choice_reason/impact: 用户确认；影响=本任务结构
- consequences_and_risks: phase 边界由 build-plan 锁定（裁决书 D-04）；风险=phase 划分过细
- rejected_alternatives: 拆多个任务（交接断裂）
- unresolved_items/owner: phase 精确边界归 build-plan
- Supersedes: none
module: 任务形态
requirement_ids: [R-003]
derived_from: [D-001]
artifacts: []
```

### M2 诊断交付

```text
### D-101
- question/final_option: 诊断以什么为准？独立只读核查（4 任务），不是总结文件原样
- recommendation/plain_language: 推荐；总结文件是"上一任务自己写的分析"，有 5 条断言与 task store 不符
- decision: 诊断=已核实事实（F-010~F-029）+总结文件框架结论（经核查支持部分）+认知差异说明（B-03）
- source_type/reference/exact_excerpt: 核查报告（F 表核实表/共同模式/总体判断）；用户选"只做内部文献调研"
- approval_binding: pending
- facts_and_constraints: 框架结论成立、5 条断言证伪（核实表）
- Logic: 断言证伪 → 不能直接引用总结文件 → 以核查为准 → 诊断可信
- choice_reason/impact: 用户"两个都要"；影响=诊断交付物内容
- consequences_and_risks: 无新增风险；避免把已证伪断言带入治理
- rejected_alternatives: 以总结文件为准（已证伪）；重新全面审计（超范围）
- unresolved_items/owner: 无
- Supersedes: none
module: 诊断交付
requirement_ids: [R-002]
derived_from: [D-001]
artifacts: []
```

### M3 改造范围

```text
### D-201
- question/final_option: 改造范围？聚焦改造（A+B 预检链+D 唯一缺口源+E 边界校验+F 状态分层；C/G 并入）
- recommendation/plain_language: 推荐；覆盖"前置暴露+状态可信"双痛点且不过度
- decision: 按裁决书 7 组裁决执行（blocked 移除/确认消缺/gap_id 弱义/预检收窄/状态展示层/E 边界/负向验收）
- source_type/reference/exact_excerpt: Talk R2/Q3 回复"① 聚焦改造"+R3 四项"①按裁决…"×4
- approval_binding: pending
- facts_and_constraints: F-017~F-023（无预检 ADR/无唯一 gap 源/别名契约固化/测试收据漏洞/桥接无相等校验/宪法禁持久 selector）
- Logic: 双痛点 → 聚焦四项机制 → 每项对应已核查根因 → 可证伪夹具验收
- choice_reason/impact: 用户确认；影响=workflows/skills/runtime/tests/tools 展示
- consequences_and_risks: 周期最长；已被 debate 收窄（非完整 A-G）
- rejected_alternatives: 完整 A-G（连锁改动）；最小 D+F（只修一半）
- unresolved_items/owner: 无
- Supersedes: none
module: 改造范围
requirement_ids: [R-006]
derived_from: [D-001]
artifacts: []
```

```text
### D-202
- question/final_option: close 语义？保持现状但如实说清（不改宪法 close 三义）
- recommendation/plain_language: 推荐；带缺口可 close 是宪法既有语义，缺的是记录/展示清楚
- decision: close 仍允许质量/发布缺口；但完成记录必须抄写 quality/发布状态，展示分层，同一 gap 只出现一次
- source_type/reference/exact_excerpt: Talk R2/Q1 回复"① 保持现状语义，但如实说清（推荐）"
- approval_binding: pending
- facts_and_constraints: F-012（任务1 normal close 无质量字段）；ADR 0020（抄写不裁判）；宪法 close 三义
- Logic: 历史 close 记录丢语义 → 保持路径不变 → 记录与展示补语义 → 状态可信
- choice_reason/impact: 用户确认；影响=close 记录与展示
- consequences_and_risks: 无（不改路径）
- rejected_alternatives: 显式风险路径（改动大、历史形态被拒）；严禁带缺口 close（需修宪）
- unresolved_items/owner: 无
- Supersedes: none
module: 改造范围
requirement_ids: [R-001, R-006]
derived_from: [D-201]
artifacts: []
```

```text
### D-203
- question/final_option: 预检语义？只读 advisory 三态（ready/unknown/unavailable），移除 blocked；覆盖边界=build-plan 已声明缺口，后期缺口由 F+close 前只读复核暴露
- recommendation/plain_language: 推荐；与核查事实一致、不产生新门禁
- decision: 预检=只读展示位；不接触 can_continue/physical_close/close 三义；不每阶段重跑
- source_type/reference/exact_excerpt: 裁决书组 A/D；Talk R3/Q1、Q4 回复
- approval_binding: pending
- facts_and_constraints: F-016（无 blocked 记录）；用户"不改 close 三义"；聚焦范围
- Logic: blocked 无生产者 → 移除 → 三态只读 → 不阻断 → 无门禁
- choice_reason/impact: 用户确认；影响=预检输出与状态展示
- consequences_and_risks: 预检不能保证后期缺口提前看到（事实限制，由分层展示弥补）
- rejected_alternatives: 保留 blocked（与事实不符/与 close 三义冲突）；全链路每 phase 重跑（范围放大、仍不覆盖后期）
- unresolved_items/owner: 载体形态（lens vs profile）归 build-spec 验证
- Supersedes: none
module: 改造范围
requirement_ids: [R-006, R-004]
derived_from: [D-201]
artifacts: []
```

```text
### D-204
- question/final_option: 非目标/延期清单？按裁决确认（8 项非目标+3 项延期）
- recommendation/plain_language: 推荐；边界写死，防止隐性扩大
- decision: 非目标=不改历史记录/不重放执行/无页面 UI/不改宪法/不新增控制面/不伪造通过/不做完整状态矩阵与端到端流程/不每阶段重跑；延期=lens 兼容验证、phase 边界、重放验证另立任务
- source_type/reference/exact_excerpt: Talk R2/Q5 回复"① 全部接受"；裁决书"驳回与保留"
- approval_binding: pending
- facts_and_constraints: 宪法 F8/F10/F11；核查非目标
- Logic: 边界写死 → 无隐性扩大 → 与"聚焦"一致
- choice_reason/impact: 用户确认；影响=范围控制
- consequences_and_risks: 延期项由后续任务承接
- rejected_alternatives: 无
- unresolved_items/owner: 无
- Supersedes: none
module: 改造范围
requirement_ids: [R-004, R-006]
derived_from: [D-201]
artifacts: []
```

```text
### D-205
- question/final_option: 唯一缺口源的语义定稿？同快照确定性派生+渲染层聚合+确认消缺（detail 审查修正：聚合键=规范化缺口内容，投影源仅作 provenance）
- recommendation/plain_language: 推荐；修正"聚合键含投影源导致同缺口跨源不同 id"的缺陷
- decision: gap_id=规范化缺口内容的同快照确定性派生（不含投影源）；投影源作为每条投影 provenance 保留（去重仅渲染层）；已确认项消缺优先级最高；派生缺口记录绑 snapshot/material、带来源与 owner；现有别名输出（quality_gaps/release_gaps/product_release_reasons/close_preparation_gaps）收敛到同一派生源（列出全部生产者/消费者与移除条件，实现归 build-spec）
- source_type/reference/exact_excerpt: 裁决书组 C/B-02；detail 审查 #17/#37
- approval_binding: pending
- facts_and_constraints: F-013/F-018/F-019；宪法禁持久对象
- Logic: 聚合键含投影源 → 跨源不同 id → 无法去重；修正→内容规范化键→跨源聚合→去重生效；确认消缺→已确认项不再报 missing
- choice_reason/impact: 用户确认 D（T-010）；影响=派生层与展示层实现
- consequences_and_risks: 无；id 不跨时间稳定（缺口消失是预期）
- rejected_alternatives: 聚合键含投影源（无法去重）；持久登记（违宪）
- unresolved_items/owner: 派生源收敛的消费者清单归 build-spec
- Supersedes: none
module: 改造范围
requirement_ids: [R-006, R-004]
derived_from: [D-201]
artifacts: []
```

```text
### D-206
- question/final_option: 边界校验语义？协议不一致=写入拒绝；语义缺失=记录+投影不阻断
- recommendation/plain_language: 推荐；区分"写错"与"没证据"
- decision: bridge 写入时 agent_run_id !== attempt_id → 拒绝；测试收据不绑当前 snapshot/material → 拒绝；unavailable/无证据 → 记录+缺口投影
- source_type/reference/exact_excerpt: 裁决书组 F；Talk R2（E 在聚焦范围内）
- approval_binding: pending
- facts_and_constraints: F-010/F-020/F-021；宪法 F9（记录事实不阻断）
- Logic: 结构性不一致=协议错误 → fail-loud 拒绝；事实缺失=可用性缺口 → 记录不阻断
- choice_reason/impact: 用户确认；影响=写入口与证据校验链
- consequences_and_risks: 拒绝写入需真实错误信息（防止把 unavailable 当拒绝）
- rejected_alternatives: 放行并标记（fake pass 风险）；全阻断（违反记录不阻断）
- unresolved_items/owner: 无
- Supersedes: none
module: 改造范围
requirement_ids: [R-001, R-006]
derived_from: [D-201]
artifacts: []
```

```text
### D-207
- question/final_option: 状态分层语义？六状态分离展示+quality_status 唯一来源+禁展示层推导
- recommendation/plain_language: 推荐；只做展示层分离，不做新状态机
- decision: 六状态从既有事实派生、互不推导、分离展示；quality_status 唯一来源=独立质量决议（预检/收口投影不得写入或推导之）；stale/unavailable 如实展示；完整值域/转换矩阵归 build-spec 转译（方向期为"可执行矩阵"，见数据状态节）
- source_type/reference/exact_excerpt: 裁决书组 E；Talk R2（两个都要）
- approval_binding: pending
- facts_and_constraints: 宪法禁第二状态机；ADR 0020（quality 独立）；F-017
- Logic: 状态可信痛点 → 分离展示 → 单源 quality_status → 不耦合 → 可证伪（六状态独立变化夹具）
- choice_reason/impact: 用户确认；影响=展示层/status 输出
- consequences_and_risks: 值域/转换细节留 build-spec（方向期矩阵足够下游转译）
- rejected_alternatives: 完整状态机规范（违宪/重复）；不分离（痛点未解）
- unresolved_items/owner: 矩阵转译归 build-spec
- Supersedes: none
module: 改造范围
requirement_ids: [R-004, R-006]
derived_from: [D-201]
artifacts: []
```

### M4 交付与验收

```text
### D-401
- question/final_option: 验收方式？逐根因负向夹具/oracle 为主 + 后期 dogfood 补充
- recommendation/plain_language: 推荐；可证伪，不靠"本任务顺利执行"自证
- decision: 成功标准=每条已核查根因至少一条负向夹具（bridge 不匹配拒绝/旧快照收据拒绝/unknown-unavailable 语义保留/findings:[] 无 provenance 不得绕过/确认消缺/六状态独立变化，**共六项**）+合成多投影样本；dogfood 覆盖后期 phase 并按观察合同（阶段/样本/独立观察者/窗口/判定，见"验收细节"节）；风险节补自证风险与独立观察口径
- source_type/reference/exact_excerpt: Talk R3/Q3 回复"① 负向夹具为主 + dogfood 补充（推荐）"
- approval_binding: pending
- facts_and_constraints: 裁决书组 G；辩论丁队 D-05（虚假共识处置）
- Logic: dogfood 自证 → 负向夹具可证伪 → 主回收窄 → 验收可信
- choice_reason/impact: 用户确认；影响=验收标准
- consequences_and_risks: 需设计窄夹具（工作量中等）；无假绿
- rejected_alternatives: 仅 dogfood（自证）；完整验收平台（F10 反例）；故意保留缺口（污染质量事实）
- unresolved_items/owner: 夹具清单与 oracle 归 build-plan
- Supersedes: none
module: 交付与验收
requirement_ids: [R-005]
derived_from: [D-201]
artifacts: []
```

```text
### D-402
- question/final_option: 收口合同载体？=spec.md 的 AC 扩展字段（不新增第五材料、不双写）；方向期锁字段清单与语义，build-spec 只填值
- recommendation/plain_language: 推荐；满足"不依赖 build-spec 补需求"（字段已锁）且不违宪
- decision: 9 字段清单+语义入方向卡；spec.md 的 AC 记录扩展承载单 AC 值；预检只读消费
- source_type/reference/exact_excerpt: 裁决书组 D；B-01；Talk R3/Q4
- approval_binding: pending
- facts_and_constraints: 宪法禁第五材料；四材料为唯一真相
- Logic: 字段清单方向期锁定 → build-spec 填值为转译 → 不越权不补需求
- choice_reason/impact: 用户确认；影响=spec.md 结构与预检读法
- consequences_and_risks: spec.md 同时被预检/展示消费（唯一写入者=build-spec 的 AC 定义）
- rejected_alternatives: 新第五材料（违宪）；字段清单延后 build-spec（补需求）
- unresolved_items/owner: 字段 schema 细节归 build-spec
- Supersedes: none
module: 交付与验收
requirement_ids: [R-003, R-006]
derived_from: [D-201]
artifacts: []
```

## UI applicability（已核实，非草案）

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "conclusion": "non_ui", "reason": "原始需求全部关于任务治理机制/审查/状态投影，无页面、交互或前端诉求；用户提到的'页面范围'是要求梳理范围边界，不是新增页面诉求" },
    "project_inventory": { "conclusion": "non_ui", "reason": "workflowhub 仓库改动面在 workflows/skills/runtime/tools/tests，仓库无 frontend/ 目录或 Web UI 路由（git 树核查）" },
    "planned_or_changed_frontend_fact": { "conclusion": "non_ui", "reason": "本任务无计划前端改动；状态分层仅改进 CLI/JSON 展示与记录字段，非页面。若用户后续要求状态展示 UI，将重算" }
  }
}
```

## 关键事实（本次会话勘探证据）

| fact_id | 事实 | 来源/证据 | 处理状态 |
| --- | --- | --- | --- |
| F-001 | 总结文件诊断 8 类根因：完成/质量判定两套逻辑、缺口五层重复投影、前置阶段 advisory 延迟暴露、build-plan 只查静态验收卡、最终 aggregate 太晚、verify-code 命名误导、内部协议错误在错误边界失败、证据归档与 current-fact 选择断裂 | /Users/Hugh/Downloads/workflowhub-m17-missing-stage-close-analysis-20260905.md 第 59-183 行 | 已核实（框架结论经 4 任务核查部分成立、部分证伪，见核实表） |
| F-002 | 总结文件要求"findings: [] 只说明空结果，不证明 review 通过"；unavailable/cancelled/valid-empty 是四种状态 | 同文件第 185-195 行 | 已核实（T09 invalid_anchor→findings=[] 实锤，F-015） |
| F-003 | 总结文件推荐新建独立治理改造任务而非修改历史；实施顺序 make-decision→…→verify-code，验收标准 8 条 | 同文件第 316-337 行 | 已确认（本任务按此方向执行，D-001） |
| F-004 | 4 个案例任务：workflowhub-requirement-convergence-depth-20260905、workflowhub-m17-repo-skills-multicli-20260903、make-decision-requirement-convergence-20260828、paperbuilder-v2-t09-pause-resume-checkpoint（外部项目）——口径统一为 4 个（诊断样本） | 核查 4 个 task store | 已核实 |
| F-005 | 任务工作真相只在认证 worktree specs/<task-id>/ 四份材料；外置 task store 只放执行文件 | docs/standard-workflow.md:9-12；AGENTS.md 治理边界 | 已确认 |
| F-006 | 本任务 bootstrap 完成：task=workflowhub-close-readiness-governance-20260906，branch=task/workflowhub/...，baseline=b16d5bcf，storage_root=/Users/Hugh/Hugh/Knowledge | 本次 bootstrap 输出 | 已确认 |
| F-007 | scaffold 机制：make-decision 步骤 1-14（steps.json），Skill 3.2.0；dependency=talk-with-zhipeng/grill-with-docs/decision-log/wh-review/deep-research/spec-analyze/stage-reflection | workflows/make-decision/steps.json、SKILL.md、skill-deps.yaml | 已确认 |
| F-008 | 主会话执行约束：Talk/Grill 由主 agent 独占；研究可派子代理；重读动作点默认派子代理（AGENTS.md） | make-decision SKILL.md:94-96；AGENTS.md | 已确认 |
| F-009 | 桥接接受独立 attempt_id 与 agent_run_id；runner 到 verify/E2E 才要求一致（总结文件引用 tools/host/workflowhub-stage-agent-bridge.mjs:201、runtime/stage/stage-runner.mjs:80） | 总结文件第 156-172 行引用 | 已核实（F-010 双证据 + 调研 F-021 精确到调用点） |
| F-010 | attempt_id ≠ producer agent_run_id **属实**：任务1 build-code outcome 同文件内 .attempt_id="attempt-build-code-p9-current-20260906-v3" vs .producer.agent_run_id="codex-build-code-p9-current-20260906-v3"（stage-outcome-proofs/ec9b6978... 同 pair）；M17 亦有同类（attempt-m17-verify-code-stage-outcome-current-20260905-2 vs codex-m17-verify-code-stage-agent-20260905-2） | 核查：quality/evidence/stage-outcomes/build-code/1de42bbb...json 等 | 已核实 |
| F-011 | "333 个 quality fact"**不可复现（属实）**：任务1 facts.jsonl=0 行、quality/facts=338 个 quality-fact.v1；任务3 facts.jsonl=337 行（unavailable 236/missing 54/present 47）；M17 quality/facts=498、evidence=1516。均≠333 | 核查各任务 store 计数 | 已核实 |
| F-012 | **重要出入**：任务1 completed.json 是 close_mode="normal"+status=completed（标准 close，非风险 close）；quality_status=incomplete、product_release=not_released 只写在 close plan；用户确认原文"执行 standard close，接受 quality incomplete"。manual-risk-close 标识只存在于 M17（operations/close/manual-risk-close.json=delivered_with_risk）。"risk close"字样在任务1 仅 p9-t905-rerun.log:21 | 核查：任务1 operations/close/、M17 operations/close/ | 已核实 |
| F-013 | **重要出入**：任务1 用户确认并非缺失——quality/confirmations 有 2 份 verify-code human-confirmation.v3（a418c7b6、e10dff6），但 close plan 仍投影 human_confirmation missing → **确认事实与投影冲突，是 current-fact selector/绑定失效的直接证据** | 核查：quality/confirmations/ + close plan | 已核实 |
| F-014 | 总结文件两处与 task store 不符：L26"verify-code E2E 在 provider dispatch 前失败"无记录；L33 引用的 quality/tests/p9-current-verify-code-tests-v2.json 不存在（实际 tests/output/...v2.output，9/9 通过的 bridge 契约测试） | 核查任务1 store | 已核实 |
| F-015 | T09（PB）verify review：4 provider completed + kimi 报 blocking（diff packet 缺失）但被 invalid_anchor 判为无效 → 最终 findings=[]。**有效阻断被"空 findings"掩盖** | 核查 PB T09 store | 已核实 |
| F-016 | 需求收敛强化"曾被真实标记 blocked"无任何结构化 blocked 记录（仅二进制 bundle 命中） | 核查任务3 store | 已核实 |
| F-017 | 仓库**无**"build-plan 前置收口预检"专门 ADR；已有四状态视角分层（work_progress/stage_quality/product_release/physical_delivery）、close 三义、code_review 唯一 owner=verify-code（ADR 0019）等治理雏形 | 调研 Q1：docs/standard-workflow.md:35-47、docs/adr/0018、0020、0019、0017 | 已核实 |
| F-018 | 存在多个"半成品 current selector"（各投影自行选当前事实 selectLatestTerminalObservation/selectLatestAcceptanceCandidates），但**无唯一结构化 gap 源与稳定 gap_id**；"同一缺口多投影"在 specs/archive 全量 grep 无历史任务讨论过（新问题，无先例） | 调研 Q2：completion-predicates.mjs:152-191、302-345；archive grep | 已核实 |
| F-019 | quality_gaps/release_gaps/product_release_reasons 三输出是**同一数组别名**（stage-runtime.mjs:319/334/592）；close_preparation_gaps 另造一套文本；**status-derivation.test.mjs:270-283 把"重复别名"固化成了契约测试** | 调研 Q2 | 已核实 |
| F-020 | 测试收据漏洞：testFacts 写入边界只要求字段非空、不对比当前快照（stage-handlers.mjs:605-633）；stage-runner testEvidenceStatus:1382-1398 把 record.snapshot_tree 传成期望值（自指）；真正绑定在 freshness 链（freshness.mjs:296-316、418-475，含 recordOnly/material-only delta 豁免） | 调研 Q5 | 已核实 |
| F-021 | bridge 入口无 agent_run_id===attempt_id 校验（两者独立接受，bridge:155/207）；唯一强制点=authenticateCurrentBuildCodeStageOutcome（:751-753，唯一消费者=wh-review-cli.mjs:104）；verify-code 提交已有 rejectStaleVerifyCodeReview 严格校验（snapshot_tree/material_revision 严格相等，bridge:104-125） | 调研 Q5 | 已核实 |
| F-022 | **宪法/历史硬约束**：禁止新增 selector 持久对象、新控制面、双写、永久 compatibility bridge、第二状态机、新公共入口（CONSTITUTION F11、AGENTS.md:59-62、verify-close-protocol-robustness D-012"不得扩展 review invocation 存储/selector/新公共行为"、wh-review-deferred-exception-close"不新增 selector…新公共命令"）；方案 D 必须表述为"现有投影显式化+稳定 gap_id"，**不得新增持久对象**；Q3:105-110 许可把身份/current-fact 校验作为结构事实校验（非质量裁决） | 调研 Q3/Q4 | 已核实 |
| F-023 | 历史已有相关决定：close 五动作只抄写质量不裁判（ADR 0020：风险 close 平行机制删除）；findings:[] 算审查结果但不通过（execution-flow-repair D-011）；manual-close 必须物理六步且不改写质量/发布语义（standard-stage-flow-hardening D-013）；D-008 遗留"实现尚未满足" | 调研 Q4 | 已核实 |
| F-024 | direction 方向审查（红蓝配对）真实执行：status=available、pair_status=complete、outcome=completed、material_consistency=consistent、pair_id=56c91fcb…、material_id=9bb9c5ed…；6 provider 成员全部 completed（red kimi/coding+antigravity/flash+codex/luna 13 条；blue 同组 10 条；去重 23 条=21 major+2 minor+0 blocking）；红蓝无跨 role 重复；耗时 92-143s/成员 | worktree evidence/direction-review/result.json（62,978B 原字节） | 已核实 |
| F-025 | **红蓝审查发现 CLI run 不写 task store 记录**（task store 仍 4 个文件）——公开 run 路径状态与 task 事实分离，符合 SKILL 职责边界，但也印证"任务 store 可复核性"缺口 | 审查执行第五步 | 已核实 |
| F-026 | host_provider 同源排除=provider id 全等；本会话宿主深编 v4 flash vision exp 与配置 opencode/v4flash 精确同模型，故取 opencode/v4flash；direction 路由本身不含 deepseek | third-review-host-config 核查 + 审查运行 | 已核实 |
| F-027 | debate 四队立场书+四份质询书+法官裁决书完成并落盘 evidence/debate/round-1/；23 条 findings 合并为 7 组裁决：blocked 组全部采纳（移除 blocked）；确认消缺组全部采纳（投影消费 human-confirmation）；gap_id 组部分采纳（弱义化=同快照确定性派生+渲染层聚合，不持久）；预检链组部分采纳（9 字段最小合同+覆盖边界声明，每项标根因核查状态）；状态分层组部分采纳（仅展示层+quality_status 独立来源）；边界校验组全部采纳（协议不一致写入拒绝/语义缺失记录不阻断）；验证组改述（逐根因负向夹具为主+后期 dogfood 补充） | 裁决书.md + 8 份 position/challenge | 已核实 |
| F-028 | 辩论中两处事实修正：丙误用 F-016（真实含义=无 blocked 结构化记录，支持移除而非保留）；丙"E 属现状复制"不成立（F-021 证明桥接入口无相等校验、测试收据写入不绑快照，E 是真实修复） | 裁决书"事实判定"节 | 已核实 |
| F-029 | 答辩一致性证据：findings 行号漂移（#11/22 同点异行等）与案卷自引路径错误成立，不影响主题裁决 | 乙 position 核验说明、丙 position 三 | 已核实 |
| F-030 | detail-advice 红蓝审查真实执行：status=available-with-failures、pair_status=partial（grok/grok、pi/v4flash 因 trusted 配置 source_id=null → PROVIDER_IDENTITY_INVALID，身份未绑定非执行失败）；red 21 条+blue 18 条=39 条（28 major+9 minor+2 blocking）；注意 CLI 组合逻辑 error 文案 REVIEW_NO_SEMANTIC_RESULT 与实际语义结果矛盾（组合 bug 证据，归治理范围外记录） | worktree evidence/detail-review/result.json（101,645B） | 已核实 |
| F-031 | **问题1 取证结论**：requirement-convergence-depth 任务实现落盘率≈100%（8 phase+10 项关键能力全在 main：pair_id/role/disputed schema、isPairedMakeDecisionInput、debate skill、deep-research skill、M/S/B/P、决策链提醒、AGENTS.md:21、check-skill-closure、mailbox 契约）；实现=单 snapshot（5a3af360，64 文件+7153/-150）+ merge 699f0a6f + 归档 b16d5bcf；本任务 make-decision 实际完整使用了升级能力（方向审查 pair_status=complete、细节 pair_status=partial 6/10、debate round-1 10 文件、Talk 结构化 12 项） | 子代理审计 0b2049cb + worktree evidence/ + git 历史 | 已核实 |
| F-032 | 红蓝双发**仅限 make-decision**：isPairedMakeDecisionInput 硬性条件 stage==="make-decision"&&track∈{direction,detail}（simple-review-runner.mjs:524）；build-spec/build-plan 审查=多 provider 单发（无 red/blue role 注入，review-materials.mjs roleFocus 分支同样仅 make-decision） | simple-review-runner.mjs:524、review-materials.mjs:958-984 | 已核实 |
| F-033 | **问题2 取证结论（额度）**：系统无 token 度量——task-metrics.jsonl（6 行）tokens 字段全 null；completed 调用 usage 全 null；全库 index.json/stage-reflection grep "tokens" 0 命中；仅 failed 调用有 usage（合计≈145 万 token，单次最大 grok-4.6=534,365）→"几亿 token"无法从档案层证实/证伪，该数字极可能来自 CLI/Web 侧会话统计 | 子代理取证 b12b32f9 | 已核实 |
| F-034 | **问题2 取证结论（结构）**：cost 代理指标——convergence build-spec review 输入 119,325 字符（raw 7,449+decision 71,495+draft_spec 40,381）、build-plan review 输入 282,170 字符（7,449+spec 45,643+acceptance 11,466+plan 67,204+tasks 150,408；input.json 432,482B 曾致 600s 超时）；tasks.md 终稿 206,736B（归档 272,705B）；PB T12 spec+plan+tasks=61,772B+research 6 份 203KB；T12 tasks.md 全篇修订 5 次/spec 3 次/plan 3 次 | 子代理取证 b12b32f9 + 各 worktree 实测 | 已核实 |
| F-035 | **问题2 取证结论（放大因子）**：审查 provider 完成率——convergence：make-decision 16 次 12completed/4failed(75%)、build-spec 2/3、build-plan 2 轮 2/5+3/5、build-code 部分 REVIEW_EXECUTION_TIMEOUT/CANCELLED、**verify-code 0 provider**；m17：make-decision≈2/5、build-spec 2/4、build-plan 1/4；失败模式=grok PROVIDER_IDENTITY_INVALID（source_id=null）、pi PROVIDER_OUTPUT_INVALID、codex PUBLIC_RESULT_INVALID/EVIDENCE_ANCHOR_INVALID | 子代理取证 f2368ca8 + attempts 记录 | 已核实 |
| F-036 | **问题3 取证（模型分工）**：task.json 无 host_provider/model 字段（5 任务核对）；出现的模型名全部是审查者身份；反例①convergence build-code 执行者=codex/luna(gpt-5.6-luna)；反例②m17 五阶段同 host=codex（前三阶段同 session-4625a035）；配置 tiers[0]=[antigravity/opus,opencode/pax3.8,codex/luna] 但实际审查选中 kimi/coding、antigravity/flash（flash/编码档） | 子代理取证 f2368ca8 + ~/.config/3rd-review/config.json | 已核实 |
| F-037 | **问题3 审计（材料质量-缺口①模板/校验器标签错位）**：spec-specify 模板 AC 卡用 `**验证方法**：`（bold），validateAcceptanceDesignMinimum 只认 plain 行首 `验证：|验收：|判定：|oracle：`（L2948）→**按模板生成的 spec 会被判"缺 oracle 规则"**（WH 任务曾用脚本插 28 个 plain 标签行"绕过"而非修模板）；`通过：/失败：/证据：`三段**零校验覆盖**（校验器仅查≥8 字符场景+一个验证类标签） | 子代理审计 a4d19fdd + stage-content-contracts.mjs:2934-2958 | 已核实 |
| F-038 | **问题3 审计（材料质量-缺口②③）**：verify-code steps.json step1 明文"不在本阶段重新验证材料完整性"；三个历史任务 verify.json 全 status=unknown+material_digest 全零→"材料不足→verify 失败"无直接证据链；真实可证关联=**协议/绑定错误风暴**（verify-close 任务因之而生：绑定类错误≥5 次、SCHEMA_VALIDATION_FAILED≥5 次、单任务 build-code 重跑 31 次，见其 decision-log F-001/PFACT-001/002）+gate_cmd 不可执行（m17 3×exit 127=npm test 缺失）；AC 格式三任务三套写法 | 子代理审计 a4d19fdd + archive/verify 记录 | 已核实 |
| F-039 | 材料质量体系保障度评分（审计结论）：无歧义性=中高、可执行粒度=高（tasks 层互反+同命令同 oracle 校验强）、可验证性=中（正向为主）、边界完整=中、可追溯性=高；**最大缺口**：①拒绝条件类 AC 无表达位（模板仅文本提示"负例"非法定字段）②verify 独立性≈0 ③模板/校验器标签错位导致"材料不达标却不知情" | research-Q3-materials-quality.md | 已核实 |
| F-040 | **Talk R1/R2 收敛（新需求）**：Q1=分析+落地（本任务扩展含成本治理+模板升级+verify 独立性的完整实现，多 phase）；Q2=**不做 token 度量机制**（用户自见用量），直接做优化；Q3=材料分层索引+M/S/B/P 派发扩展组合；Q4=澄清问题3 真实含义（四材料质量审计，非模型使用记录）；Q5=审计+模板升级（负向 oracle/拒绝条件位+校验器同步）；Q6=verify 独立性纳入本任务；Q7=上下文机制覆盖 build-spec/build-plan 为主；Q8=先质量后效率+新需求完整走 make-decision 流程 | ask_user_question 用户真实回复（4+4 题卡） | 已确认 |

## 总结文件核实表（与 task store 对账）

| 总结文件论断 | 核实结论 | 证据 |
| --- | --- | --- |
| attempt_id 与 producer agent_run_id 不一致 | ✅ 属实（任务1+M17 双证据） | F-010 |
| 333 个不可变 quality fact 文件 | ✅ 属实（不可复现；实际计数各不相同，均非 333） | F-011 |
| 任务"最终只能风险 close" | ⚠️ 部分属实：M17=manual-risk-close(delivered_with_risk)；任务1=normal close 但 quality incomplete/not_released（用户明示接受） | F-012 |
| verify-code 缺用户确认 | ⚠️ 与事实相反：有 2 份 human-confirmation.v3，但投影仍报 missing（投影/绑定失效） | F-013 |
| L26 verify-code E2E 在 provider dispatch 前失败 | ❌ task store 无此记录 | F-014 |
| L33 p9-current-verify-code-tests-v2.json | ❌ 文件不存在（实为 output 变体，9/9 通过） | F-014 |
| T09 局部绿不等于验收绿 | ✅ 属实且更严重：blocking 被 invalid_anchor 判无效后 findings=[] | F-015 |
| 需求收敛强化曾被真实标记 blocked | ❌ 无结构化记录 | F-016 |

### 跨任务共同模式（核查结论，4 个任务）

1. **局部绿≠验收绿**：三任务本地实现/窄测均绿，但 dsh-code-review、异源/独立 review、Live/真实宿主、用户确认四类外部事实一致以 unavailable/incomplete 收尾。
2. **同一缺口多文本投影**：close 输出把同一 predicate 链写入 quality_gaps 与 product_release.reasons 两处（任务1 同文件 2×；M17 跨 3 文件 1-6×）；"阻塞很多"观感确由重复投影放大。
3. **确认事实与缺口判定断裂**：任务1 有 2 份 verify-code human-confirmation、M17 有 approve-verification 确认，仍被投影 missing/binding invalid → 无共享 current-fact selector。
4. **close 形态三样**：任务1 standard/normal close（quality incomplete 被接受）、M17 正式 manual-risk-close（delivered_with_risk）、任务3 两个 ordinary 计划内嵌 risk_close.accepted 却无 completed.json、T09 无任何 close 记录——边界未按预期分层。
5. **归档-复核断裂**：新任务 facts.jsonl=0、index.json facts=[]，但 quality/facts 数百文件、总证据 1331/2174 个；"333"无法复现。

### 总体判断（核查结论）

总结文件**框架性结论**（①同一缺口多投影 ②外部事实缺失被分层不清 ③局部绿≠验收绿 ④无 current-fact selector ⑤manual-risk-close 必须只表示 delivered_with_risk/quality incomplete）在 4 个任务 store 中均得到支持；但几条具体断言（333 数字、E2E dispatch 前失败因果、blocked 标记、任务1"风险 close"表述、L33 引用文件路径）无法验证或与事实不符。本任务 decision-log 与 talk 以核查事实为准。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 痛点核心：①仅收口前移 ②仅状态可信 ③两者都要 | 见选项卡：①改 build-plan/build-code 行为面最大；②只改展示；③范围最大、周期最长 | ③ 两个都要 | 无新增开放问题；范围细化为 round 2 | R1/Q1 结构化问答 answers[0] |
| T-002 | 成功标准：①仅诊断报告 ②诊断+改造落地 ③+真实任务验证 | ①快但行为不变；②周期长需严格走完；③可能不可复现、容易拖入同坑（建议延期） | ② 诊断+治理改造落地 | 衍生：验证方式→round 2 | R1/Q2 结构化问答 answers[1] |
| T-003 | 调研需求：①不调研 ②仅内部文献 ③内部+外部 | ①可能漏仓库已有结论；②内容在仓库内可控；③外部异构难迁移 | ② 只做内部文献调研 | 无新增开放问题 | R1/Q3 结构化问答 answers[2] |
| T-004 | close 语义期望：①保持现状但如实说清 ②显式风险路径 ③严禁带缺口 | ①不改宪法、修复记录/投影坏点；②需改 close 路径判定，任务1 形态被拒；③改宪法风险最大 | ① 保持现状语义，但如实说清 | 无新增；范围问题得益于此 | R2/Q1 结构化问答 answers[0] |
| T-005 | 验证方式：①测试绿+dogfood ②仅测试绿 ③+真实任务重放（延期） | ①客观+体验并重；②快但无体验证据；③最可信但依赖外部 provider、可能不可复现 | ① 测试绿 + 本任务 dogfood | 无新增开放问题 | R2/Q2 结构化问答 answers[1] |
| T-006 | 改造范围：①聚焦（预检链+唯一缺口源+边界校验+状态分层）②完整 A-G 独立步骤 ③最小 | ①覆盖双痛点、周期长；②范围最大连锁改动；③只解决一半 | ① 聚焦改造 | 无新增开放问题 | R2/Q3 结构化问答 answers[2] |
| T-007 | 实施形态：①一个任务多 phase ②拆多任务 | ①免交接、一致性好；②可能重现"跨任务交接断裂" | ① 一个任务多 phase | 无新增开放问题 | R2/Q4 结构化问答 answers[3] |
| T-008 | 非目标/延期清单确认：①全部接受 ②有异议 | ①边界清楚；②调整 | ① 全部接受（清单见"非目标"节） | 无新增开放问题 | R2/Q5 结构化问答 answers[4] |
| T-009 | blocked 状态：①按裁决移除（三态只读）②保留第四态 | ①与核查事实一致；②与"缺口可 close"冲突且无真实生产者 | ① 按裁决移除 blocked | 无新增开放问题 | R3/Q1 结构化问答 answers[0] |
| T-010 | gap_id 稳定性：①同快照确定性派生 ②坚持跨时间稳定 | ①唯一可去重又不违宪的语义；②需新增持久登记=违宪 | ① 同快照内确定性派生 | 无新增开放问题 | R3/Q2 结构化问答 answers[1] |
| T-011 | 验收方式：①负向夹具为主+dogfood 补充 ②维持 dogfood 为主 | ①可证伪；②自证 | ① 负向夹具为主 + dogfood 补充 | 无新增开放问题 | R3/Q3 结构化问答 answers[2] |
| T-012 | 预检链：①按裁决收窄（9 字段清单+覆盖边界声明）②保留全链路 | ①聚焦、不依赖 build-spec 补需求；②范围最大、仍不能覆盖后期缺口 | ① 按裁决收窄 | 无新增开放问题 | R3/Q4 结构化问答 answers[3] |
| T-013 | 问题1（convergence 任务效果）：独立取证结论=实现 100% 落盘+本任务真实使用+质量改善（详见 research-Q1）——作为事实采纳还是需要进一步验证 | 事实已由 4 路子代理取证（F-031~F-033）；采纳=作为本任务背景事实与交付物 | ① 采纳（事实+分析作为交付物：README 式三问报告） | 无新增；衍生范围问题→Q1 | R1（新）/Q1 陈述 + 用户默认（回答见 T-014） |
| T-014 | 新需求范围：①分析+落地 ②分析+设计 ③仅分析 | ①本任务扩为多 phase 完整实现（周期最长）；②快但多一次跨任务交接；③问题不消失 | ① 分析+落地（推荐） | 无新增开放问题 | R1（新）/Q1 结构化问答（2026-09-06） |
| T-015 | token 度量：是否先补度量再优化？ | 用户明确：度量自己可见（CLI/Web 用量），不需要机制 | ② 不做 token 度量机制，直接优化 | 无新增；度量=用户侧观察 | R1（新）/Q2 自定义答复："不用补度量，我只是想优化，度量我自己可以看得见" |
| T-016 | 上下文机制形态：①材料索引+派发组合 ②只派发 ③只索引 | ①主上下文占用最大下降；②改动小但主会话仍读全量；③重读减 70%+但起草/处置仍占主上下文 | ① 索引+派发组合（推荐） | 无新增；覆盖范围→T-018 | R1（新）/Q3 结构化问答 |
| T-017 | 问题3 真实含义（用户澄清）：四材料质量审计 vs 模型使用记录 | 用户原话："我只是让你分析一下目前 decision-log、spec、plan、tasks 是否足够清晰专业详细，足够后面 build-code 和 verify-code 使用低智力模型也能保证交付质量" | ② 四材料质量审计（模型分工仅背景事实） | 方向修正：research-Q3 重写为材料质量审计 | R1（新）/Q4 自定义答复（重大澄清） |
| T-018 | 材料质量缺口处置深度：①审计+模板升级 ②仅审计报告 ③审计+模板+本任务 dogfood | ①核心机制（负向 oracle/拒绝条件法定化+校验器同步）；②机制没变下个任务还踩坑；③范围最大 | ① 审计+模板升级（推荐） | 无新增；verify 独立性→T-019 | R2（新）/Q5 结构化问答 |
| T-019 | verify 独立性：①纳入本任务 ②延后另立 ③不做 | ①直击 verify 洪流源头（执行率≈0 已证实）；②短期等不到解；③保持现状 | ① 纳入本任务（推荐） | 无新增 | R2（新）/Q6 结构化问答 |
| T-020 | 上下文机制覆盖范围+实施顺序：①spec+plan 为主 ②全部四阶段 ③仅 build-plan；顺序：①先质量后效率… | 消耗大头=spec+plan（WH 587KB）；make-decision 已有收敛环 | ① spec+plan 为主；① 先质量后效率 | 无新增；用户追加要求：新需求完整走 make-decision 流程（Talk→审查→grill），与既有 verify-code 质量问题同等质量 | R2（新）/Q7+Q8 结构化问答（Q8 自定义："先质量后效率，另外我希望这些新需求也能按照make-decision的步骤从talk到审查到grill都完整进行一遍"） |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| R-001 内部文献调研（子代理 c7427902） | Q1 收口既有设计；Q2 状态派生现状；Q3 宪法边界；Q4 历史决策与延期；Q5 身份/freshness 校验现状 | 见 F-017~F-023；要点：无收口预检 ADR 但有四视角/close 三义雏形；存在逐投影 current selector 但无唯一 gap 源与 gap_id；重复别名已被契约测试固化；测试收据写入边界不绑当前快照；bridge 入口无 attempt===agent_run 校验；宪法禁止新 selector 持久对象/新控制面 | completed（全文摘要已落盘 F 表） | D-101/D-201/D-205/D-206/D-207 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 术语冲突：无（"收口预检"复用"阶段收口/预检"既有词，无新领域术语） | 挑战后无改变方向的未决缺口；隐藏前提（gap_id 矛盾/多 phase 自洽/dogfood 自证）已由四队辩论钉出并处置（见裁决书） | ADR=不创建（可逆、无"无背景会意外"架构决策、取舍已入 decision-log D 系列）；四项退出 check 全 pass | 裁决书.md；CONTEXT.md:73/77/331 核实 |

### step 6 direction-advice（completed, 2026-09-06）

- 实际做了什么：构造方向审查输入（evidence/direction-review/raw-requirement.md + direction-card.md），子代理以 wh-review-cli run 真实执行 make-decision direction 红蓝配对审查（host_provider=opencode/v4flash 排除同源）；result.json 原字节落盘。
- 结果：status=available、pair complete、23 条 findings（F-024）；CLI 未写 task store（F-025，与本 stage 按 SKILL 边界一致，如实记录）。
- 处置：23 条 findings 进入 step 6b debate-direction 与 step 7 talk-round-3 处置；主要主题（gap_id 规则、blocked 态冲突、预检重跑点、dogfood 自证、需求第4条未成文、确认消缺未纳入、状态矩阵、负向用例）。
- 未完成/跳过：无；红蓝均有语义结果，provider 无失败事实。

### step 6b debate-direction（completed, 2026-09-06）

- 实际做了什么：法官立案（00-案卷.md）→ 四队独立上下文并行 Phase 1 立场书（甲/乙/丙/丁，各含致命缺陷自述）→ Phase 2 mailbox 一轮交叉质询（challenge-甲/乙/丙/丁，各 ≤200 字/条）→ 法官综合裁决（裁决书.md，含事实判定+7 组裁决+方向卡修订清单+反偏见自检）。
- 产物：evidence/debate/round-1/ 下 10 个文件（案卷+4 position+4 challenge+裁决书+mailbox 4 条）。
- 结果：completed。争议处置见裁决书；4 项需要用户确认的裁决进入 talk-round-3（blocked 移除、gap_id 弱义、验收改负向夹具为主、A+B 收窄）。
- 未完成/跳过：无（debate 机制真实运行：4 独立子代理+mailbox）。

### step 7 talk-round-3（completed, 2026-09-06）

- 实际做了什么：向用户呈递红蓝方向审查 23 条 findings 的裁决争议清单（合并 7 组）+ debate 未决项，4 个独立问题卡（blocked 移除/gap_id 弱义/验收改负向夹具/预检链收窄）全部收到真实回复；本轮无剩余 high/medium 开放项，收敛。
- 用户答复：4 项全部按裁决/推荐采纳（T-009~T-012）。
- 队列变化：无新增开放问题；争议清单全部处置完毕，方向语义定稿。
- 后果/风险：方向卡按"方向卡修订清单 1-8"执行（blocked 移除、gap_id 弱义化、预检三态只读、9 字段最小合同+载体、验收负向夹具化、每项标根因核查状态、C 降级、B-03 认知差异说明），进入 Grill 与草稿。

### step 8 grill-with-docs（completed, 2026-09-06）

- 方法：先核实再提问；沿设计依赖自查；覆盖矩阵以已认证原始消息五类为纲；无机器 gate。
- 覆盖矩阵：
  - goal：诊断+聚焦改造落地——用户 Talk1-3 确认（T-001~T-012）✓
  - flow_or_surface：五 stage 执行流程+预检/审查/确认/close 展示位（方向卡补"用户流程骨架+六状态展示位"）；页面=无（UI applicability non_ui 三输入核实）✓
  - data_or_state：六状态分离+quality_status 独立来源+预检三态只读+gap_id 同快照派生+确认消缺（裁决书组 A/B/C/E）✓
  - success_failure_acceptance：成功=逐根因负向夹具全绿+后期 dogfood；失败=未核实论断当事实/违宪新增控制面/假绿（T-011）✓
  - constraint_non_goal_defer：非目标清单+延期（lens 形态兼容验证、phase 边界归 build-plan、C 项裁剪权在用户）✓
- 挑战结论：未发现与 CONTEXT.md/ADR 术语冲突的新语义（"收口预检"复用"阶段收口/预检"既有词）；未发现改变方向的隐藏假设；四队辩论已把隐藏前提（D-03/D-04/D-05）钉出并处置。
- 面向用户提问：**无**（理由：方向级问题已在 Talk1-3 覆盖并经用户确认；Grill 检查未发现改变方向的缺口——记录，不提问）。
- 四项退出检查：外部接口已核实（wh-review 红蓝/桥接/F-021/spec-analyze 只读通道）pass；命名唯一定义（gap_id=同快照确定性派生；预检三态；六状态沿用既有四视角拆分）pass；失败语义明确（E 组"拒绝写入 vs 记录不阻断"；预检只读不阻断）pass；范围边界写死（非目标+延期项）pass。

### step 9 write-decision-draft（completed, 2026-09-06）

- 实际做了什么：定稿目标/成功失败边界/范围/非目标（用户确认版）；写入决策区 D-001/D-002/D-101/D-201~D-204/D-401/D-402（4 模块决策链，含 source/Logic/后果风险/拒绝方案/未决项/Supersedes）；更新 R 表处理状态、N 节点状态、UI applicability（non_ui 已核实）；修订 direction-card.md v2（裁决修订清单 1-8 全部执行）。
- 产物：decision-log.md 决定区；evidence/direction-review/direction-card.md（v2）。
- 结果：completed。所有用户已确认选择均已映射到 D 系列；无未确认的方向级内容。
- 未完成/跳过：无。

### step 10 detail-advice（completed, 2026-09-06）

- 实际做了什么：构造 detail 审查输入（raw-requirement + direction-card v2 + decision-log 全文），子代理以 wh-review-cli run 真实执行 make-decision detail 红蓝配对审查（host_provider=opencode/v4flash）；result.json 原字节落盘。
- 结果：status=available-with-failures、pair partial（grok/pi 身份未绑定，F-030）；39 条 findings（28 major+9 minor+2 blocking），全部为决策记录一致性/方向语义明确化，**无方向级争议** → 不触发 talk round 4，主会话直接修复（FND-D01~D10）。
- 修复：头部/OPEN/Exit checks/拒绝方案/风险延期表定稿；D-205/206/207 独立条目；9 字段语义表；数据状态矩阵；失败分支表；根因→夹具映射；dogfood 观察合同；R-011 悬空修正；F 表状态更新；框架切换记录。
- 未完成/跳过：pair partial 的两 provider 未重跑（语义结果已由 3 provider×2 role 产出；配置身份问题记录 F-030，不在本 stage 修配置）。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-A01（#3/#8/#9/#19 合并） | blocked 无生产者/与 close 三义冲突/与 task store 不符 | 若保留，状态不可信且触发方向卡自己失败标准 | fixed（按裁决移除 blocked、预检三态只读） | 裁决书·组A；T-009 | owner=build-spec/预检实现；consumer=预检输出；拆除条件=预检机制废弃 |
| FND-A02（#6/#18 合并） | 确认事实与缺口判定断裂（F-013 铁证） | 已确认项仍报 missing，主诉根因零修复 | fixed（投影消费 human-confirmation 消缺） | 裁决书·组B；T-010 | owner=唯一缺口源投影；consumer=状态展示；拆除条件=替代机制 |
| FND-A03（#1/#10/#21 合并） | gap_id 派生/身份/生命周期未定 | 去重不可实现或违宪 | fixed（同快照确定性派生+渲染层聚合，不持久不登记） | 裁决书·组C；T-010 | owner=派生层；consumer=渲染层聚合 |
| FND-A04（#2/#20 合同部分） | 预检只挂 build-plan 末、覆盖边界不明；合同延后=补需求风险 | 后期缺口零覆盖与验收漂移 | fixed（9 字段最小合同+载体 spec.md AC 扩展+覆盖边界声明） | 裁决书·组D；T-012 | owner=build-spec 定义/预检只读消费 |
| FND-A05（#11/#22 合并） | 六状态无权威来源/值域 | 展示层可能推第二状态机 | fixed（仅展示层分离+quality_status 独立来源+禁展示层推导） | 裁决书·组E | owner=展示层；consumer=用户/CLI |
| FND-A06（#5） | E 校验失败行为未定义 | 实现任意化 | fixed（协议不一致=写入拒绝；语义缺失=记录+投影不阻断） | 裁决书·组F | owner=bridge/写入口 |
| FND-A07（#4/#7/#12/#16/#17/#23 合并） | dogfood 自证/无负向边界 | 验收不可证伪 | fixed（逐根因负向夹具为主+后期 dogfood 补充+风险节补自证风险） | 裁决书·组G；T-011 | owner=验收计划 |
| FND-A08（#13/#15 合并） | 用户流程/展示位未成文 | 下游被迫补需求 | fixed（方向卡补用户流程骨架+六状态展示位表；细节归 build-spec） | 裁决书·驳回项外；甲 25/28 | owner=本决策记录 |
| FND-A09（#14） | 根因核查状态未逐项标注 | 方向卡被自己失败标准击中 | fixed（每项标根因+核查状态；C 降级可裁剪） | 裁决书·组D | owner=本决策记录 |
| FND-A10（B-01/B-02/B-03） | 载体/去重边界/认知差异说明 | 实现歧义与交付错位 | fixed（载体=spec.md AC 扩展字段；去重仅渲染层；诊断含认知差异说明） | 裁决书·驳回项外 | owner=build-spec/诊断交付 |
| FND-D01（#4/#5/#10/#15/#22/#27/#34） | 决策记录头部/未决项/Exit checks/拒绝方案致决策状态自相矛盾 | 下游无法以唯一当前快照消费 | fixed（头部已更新；OPEN 表闭合；Exit checks 定稿；拒绝方案汇总；风险延期表补 DEFERRED-001~004） | 本文件各节 | owner=make-decision 主会话 |
| FND-D02（#6/#26） | 需求框架 research→functional 切换未记录 | 框架节点与事实不符 | fixed（已记录切换） | 需求框架节 | owner=主会话 |
| FND-D03（#9/#15/#29） | M3 缺 D/E/F 独立 decision-entry | 关键决策无独立记录 | fixed（D-205/D-206/D-207） | 决定区 M3 | owner=主会话 |
| FND-D04（#16/#30） | 9 字段合同只有名称无语义 | build-spec 补需求风险 | fixed（9 字段语义表，方向级锁定） | 收口合同 9 字段语义表 | owner=主会话 |
| FND-D05（#17） | gap_id 派生键含投影源→跨源同缺口不同 id | 渲染层无法去重 | fixed（聚合键=规范化缺口内容；投影源仅作 provenance；D-205） | 决定区 D-205 | owner=主会话 |
| FND-D06（#18/#35） | 六状态无值域/来源/过期语义 | 展示层风险/下游补需求 | fixed（数据状态矩阵，方向级可执行；完整转换细节归 build-spec） | 数据状态矩阵 | owner=主会话 |
| FND-D07（#19） | 用户流程未定义异常态下一步 | 下游无法设计失败路径 | fixed（失败分支表） | 失败分支表 | owner=主会话 |
| FND-D08（#20/#36） | 根因→夹具未逐项映射 | 验收不可证伪 | fixed（根因→夹具→oracle 映射表） | 验收细节 | owner=主会话 |
| FND-D09（#39） | dogfood 无观察合同 | 自证风险无对冲 | fixed（观察合同：阶段/样本/独立观察者/窗口/判定） | 验收细节 | owner=主会话 |
| FND-D10（#1/#2/#3/#7/#8/#11/#12/#13/#14/#21/#24/#25/#28/#31/#32/#33/#37/#38） | 剩余一致性/语义小项（六项验收数、观察口径、范围节标注、合同描述、Exit checks、F 表状态、展示位回填、R-011 悬空、延期交接、别名收敛、样本口径） | 文本-事实错位 | fixed（逐一已修，见对应节） | 本文件各处 | owner=主会话 |

## 最终确认

- 状态：**pending（等待用户新需求）**——用户对最终决策卡的答复为："请你先把目前的decision落盘存档，我再慢慢提我的新需求"；确认动作未发生。
- 存档点：任务分支 commit `ccfd4a9f`（decision-log.md v1、direction-card v3、direction/detail 审查结果、debate round-1 全部材料共 21 文件）；材料路径 specs/workflowhub-close-readiness-governance-20260906/。
- 处理：make-decision 暂停于 step 11（approve-decision）；用户新需求到达后，先判定是否改变方向——改变则修订决策并重新 Talk/确认，不改变则补记录后继续；不做任何下游阶段推进。
- 未确认内容：最终决策确认（approval_binding）；交互 aggregate（待确认后组装）。

## step 11 记录（暂停已解除，新需求进入收敛环）

- 原状：向用户呈递最终决策卡，用户答复"先落盘存档，再慢慢提新需求"（非确认，也不是拒绝）；已按答复完成存档 commit ccfd4a9f；stage 保持 in_progress。
- **2026-09-06 更新**：用户提出三问新需求（R-007~R-010）；已完成三轮取证分析（research-Q1/Q2/Q3；4 路子代理）+ Talk R1/R2 结构化问答（T-013~T-020，8 项收敛）；方向卡升级 v4（I 收口治理不变+II 质量-成本治理增量）；事实与需求已落盘（F-031~F-040、R-007~R-010、N-005~N-007）。
- 用户要求（T-020）：新需求按 make-decision 完整流程收敛（Talk→审查→辩论→Grill→确认），与既有 verify-code 质量问题治理同等质量。
- **下一步**：step 6 direction-advice 增量轮（方向卡 v4 红蓝审查）→ step 6c debate round-2 → step 7 talk-round-3（裁决争议）→ step 8 grill → 草稿更新 → step 10 detail-advice → step 11 最终确认（整体含 v3+v4）。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 仅诊断报告（不改造） | 不解决根因，后续任务同样堆积 | D-001 |
| 诊断+改造+真实任务重放验证 | 依赖外部 provider/宿主、可能不可复现；另立后续任务 | D-001/D-401 |
| 完整 A-G 改造 | 范围最大、连锁改动，超出聚焦确认 | D-201 |
| 最小改造（D+F 仅展示层） | 用户"两个都要"只解一半，收口前移不落地 | D-201 |
| 显式风险 close 路径 / 严禁带缺口 close | 需改宪法 close 三义或改动路径；用户确认保持现状语义 | D-202 |
| 保留 blocked 为预检第四态 | 与核查事实不符（F-016）、无生产者、与 close 三义冲突 | D-203 |
| 跨时间"稳定" gap_id | 须持久登记=违宪 | D-205 |
| 每阶段重跑预检 / 预检作为 gate | 范围放大、仍不覆盖后期缺口；违反"不新增 gate" | D-203/D-204 |
| dogfood 为主验收 / 故意保留缺口 | 自证不可证伪 / 污染本任务质量事实 | D-401 |
| 收口合同整体延后 build-spec（连字段清单都延后） | 等于依赖 build-spec 补需求；方向期锁定字段清单与语义 | D-402 |
| 完整状态矩阵/端到端流程入方向卡 | 实现契约，归 build-spec 转译；方向期提供可执行矩阵 | D-207 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | make-decision 与历史任务同样可能遇到"证据不可复核/外部 review unavailable"影响完成判定 | 若 detail/direction review provider 不可用 | 本 stage 如实记录 unavailable，不伪造（detail 已发生 2 provider 身份未绑定，已如实记录） |
| RISK-002 | 改造横跨 build-spec/build-plan/runtime/展示/测试 5 处，周期最长 | 若 phase 划分或契约转译不当 | build-plan 锁定 phase 边界；每 phase 独立验收 |
| RISK-003 | dogfood 自证（本任务顺利执行时产生不了重复缺口） | 若只靠 dogfood 验收 | 已改为负向夹具为主（D-401）；观察合同见"验收细节"节 |
| DEFERRED-001 | 预检载体形态：spec-analyze lens 复用 vs 新只读 profile | 需在 build-spec 验证与现有只读分析通道兼容性；不兼容则按控制面登记规则（唯一 consumer/owner/删除条件） | build-spec 验证，owner=build-spec |
| DEFERRED-002 | phase 精确边界（每 phase 交付物/切换条件） | build-plan 锁定 | build-plan，owner=build-plan |
| DEFERRED-003 | 真实任务重放验证（M17/T09 同型） | 依赖外部 provider/宿主 | 另立后续任务，owner=用户 |
| DEFERRED-004 | 完整状态矩阵值域/转换/过期表；夹具与 oracle 明细；9 字段 schema 细节 | 实现契约（方向期语义已锁定） | build-spec/build-plan 转译 |

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 历史任务核查结果（4 个任务） | 已解决：子代理回传并填入 F 表（F-010~F-016） | resolved，证据=核查报告+F 表 |
| OPEN-002 | 改造方向是否被用户采纳、范围多大 | 已解决：Talk round 1/2/3 + 裁决（D-201~D-207） | resolved，证据=T-001~T-012 |
| OPEN-003 | 是否需要外部调研 | 已解决：用户选"只做内部文献"（T-003） | resolved，证据=R-001 调研表 |
| OPEN-004 | detail review 的 2 个 provider（grok/pi）身份未绑定（source_id=null） | 配置问题，非本任务范围；审查语义结果已由其余 3 provider×2 role 产出 | 记录为事实（F-030），不在本 stage 修复配置 |

## 数据状态矩阵（方向级可执行，detail review #18/#35 处置；值域/转换细节归 build-spec 转译）

| 状态 | 唯一来源 | 值域 | 过期/stale 语义 | 展示位 |
| --- | --- | --- | --- | --- |
| can_continue | 执行事实（工作区可读+材料可读） | true/false | 随当前材料重算 | status |
| stage_status | 当前 stage outcome/completion 派生 | completed/in_progress（+unavailable 记录） | outcome 过期=conflict/stale 如实展示 | status |
| quality_status | 独立质量决议（spec-analyze/review 事实） | passed/incomplete/unknown | 事实缺失=incomplete；不得由预检/收口投影写入或推导 | status/close |
| acceptance_status | 逐 AC 验收证据 | pass/fail/unknown/deferred/not_applicable | 证据不绑当前 snapshot=stale | status/close |
| product_release_status | deriveProductRelease（五阶段 current completion+AC+verify 确认） | released/not_released | 输入非 current → not_released | status/close |
| physical_close_status | close 物理事实（commit/archive/merge/push/cleanup 读回） | not_closed/closed（+失败原因） | 只读物理结果 | close |

- 禁展示层推导新状态机；六状态互不推导；同一 gap 只显示一次（渲染层聚合）。

## 收口合同 9 字段语义（方向级，detail review #16 处置；类型/schema 细节归 build-spec）

| 字段 | 语义（方向级） | 允许值/边界 |
| --- | --- | --- |
| producer | 该 AC 证据的真实生产者 | 具体 stage skill/外部入口名；无=unknown |
| consumer | 谁消费该证据/结果 | 具体 stage/入口；无=unknown；不得为"无人消费" |
| owner | 该 AC 负责方（阶段+角色） | stage/角色 |
| 命令 | 可执行验收命令 | 命令字符串或 unavailable（若不存在=预检报 blocked 替代语义：unavailable+原因） |
| fixture | 测试数据/环境 | fixture 引用或 unavailable |
| oracle | 判定通过的标准 | 可判断断言或 unavailable |
| 证据路径 | 证据文件规范路径 | 相对 task store/evidence 路径；不存在=unavailable |
| freshness | 证据有效性规则 | 绑定 task/attempt/material revision/snapshot；不匹配=stale |
| close 条件 | 该 AC 允许 close 的条件 | 明确条件；不能确定=unknown |

- 预检只读消费上述字段；状态只允许 ready/unknown/unavailable（blocked 已移除，语义并入 unavailable+原因）。

## 验收细节（detail review 处置补记）

### 根因→夹具→oracle 映射（方向级）

| 根因（已核查） | 负向夹具/oracle（可证伪） |
| --- | --- |
| 同一缺口多投影（F-019 别名+跨文件 1-6 次） | 构造同根因跨 quality/release/close 输出→断言渲染层仅出现一次；别名输出收敛到同一派生源（跨输出 oracle） |
| 确认事实与缺口判定断裂（F-013） | 已有 2 份 human-confirmation + missing 投影→断言已确认项消缺（"已确认 vs missing"夹具） |
| attempt_id≠agent_run_id（F-010） | 桥接写入不一致 pair→断言写入被拒（exit 非 0/错误码） |
| 测试收据不绑当前快照（F-020） | 旧快照收据提交→断言被拒；freshness 链对缺少 snapshot 的 fact 报 stale |
| findings:[] 绕过（F-015） | 无 provenance 空 findings→断言不得视为 pass（保持 unavailable/incomplete） |
| 完成/质量耦合判定（F-017~F-019） | 六状态独立变化夹具：quality_status=incomplete 时其余状态各自独立（不互相推导） |
| 收口预检缺失（F-022） | build-plan 末端预检输出三态；后期缺口由 close 前只读复核暴露（边界断言） |

### dogfood 观察合同

- 阶段：D/E/F/G 改造后、本任务 build-code 收口及后续验证/确认阶段（A+B 以契约/单元测试+夹具验收，不参与 dogfood）；
- 样本：本任务真实执行记录（status/verify/close 输出）；
- 独立观察者：主会话之外由 build-code/verify-code 的独立审查与 stage-end 检查记录（若不可得则如实记 unavailable，不替代）；
- 窗口：改造机制首次真实运行起至本任务 close 前；
- 判定：观察到同一缺口仅出现一次、确认项不再报 missing、六状态独立显示——记录实际观察结果（正面或负面均记录）。

### 失败分支表（异常态下一步，方向级）

| 场景 | 语义 | 下一步 |
| --- | --- | --- |
| unknown（无法判断） | 保持 unknown，不猜 | 记录原因+evidence_owner+next_review_trigger |
| unavailable（provider/服务不可用） | 保持 unavailable，不得改写成 empty findings/pass | 记录真实原因；恢复时按公共合同重请求 |
| timeout/cancelled | 原状态保留 | 记录；不得记为"通过" |
| findings:[] 无 provenance | 不算审查通过 | 保持 incomplete；补齐 provenance |
| 协议不一致（attempt≠agent_run/receipt 不绑快照） | 写入拒绝 | 修复绑定后重写 |
| 收据/事实与当前 snapshot 不符 | 视为历史（stale） | 不参与当前完成判断；重跑受影响检查 |

## 质量边界

- 质量事实：F 表与核实表全部"已核实/已确认"状态；detail review 39 条 findings 已逐项处置（见下"detail review 处置"）；
- 推进资格：可继续同 task 修复与 Talk；完成判定待步骤 11-14 事实闭合；
- 完成判据：用户确认 + 需求-决策覆盖矩阵五维闭合 + 交互 aggregate + stage-end spec-analyze；
- 不可逆授权边界：本 stage 无不可逆动作；close 需用户明确指令。

## Supersedes

- 无（新任务）。

## 文档结果

- CONTEXT.md：no change——本次未引入新领域术语（"收口预检"复用既有"阶段收口/预检"；CONTEXT.md:73/77/331 核查）。
- ADR：not needed——三项判据均不满足：可逆（既有机制显式化/回退成本低）；无"无背景会意外"的架构决策（未新增状态机/控制面/持久对象）；真实取舍均已完整记录于本文件 D 系列与辩论裁决书（ADR 0020/0018 已覆盖 close 语义）。
- ADR criteria：hard to reverse=false；surprising without context=false；genuine trade-off=true（已记录，无需 ADR 载体）。
- 术语/ADR 冲突及处理：无冲突。
- 不复制 spec 的边界：本文件不展开 schema/测试用例/状态转换细节（归 build-spec/build-plan）。

### Exit checks（定稿）

- 上下文一致：通过——R/N/F/T/D/Step 记录与已确认事实一致（detail review 39 条已处置）。
- owner/接口一致：通过——载体=spec.md AC 扩展字段（唯一写入者=build-spec 定义）；无新公共入口/新持久对象。
- 失败语义明确：通过——协议不一致=写入拒绝；语义缺失=记录+投影不阻断；unknown/unavailable/stale 语义表（见失败分支表）。
- 范围与延期明确：通过——非目标表+DEFERRED-001~004（owner/触发/承接）。

---

## Step 记录

### step 1 load-context（completed, 2026-09-06）

- 实际做了什么：读取 make-decision SKILL.md v3.2.0、steps.json（14 步）、skill-deps.yaml；打开依赖技能 talk-with-zhipeng（三轮职责/每答重排/四维判定）与 decision-log（需求框架/决策链/覆盖矩阵）并遵循；读取总结文件 343 行全文；读取 docs/standard-workflow.md 五阶段规范；核查 bootstrap/workspace/task-store/storage-root 机制；Bootstrap 新任务并创建认证 worktree（F-006）；创建本材料文件。
- 输入与当前快照：原始需求=用户消息（R-001~R-006 表）；当前 worktree=任务分支 b16d5bcf 基线；task store 已初始化。
- 产物/事实引用：worktree=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-close-readiness-governance-20260906；本文件。
- 结果：completed。需要依赖的剩余技能（grill-with-docs/wh-review/deep-research/spec-analyze/stage-reflection）将在对应 step 前读取，不属本 step 缺口。
- 未完成/跳过：无。

### step 2 triage-scope（completed, 2026-09-06）

- 实际做了什么：按 R-001~R-006 拆分范围、不确定性和非目标草案；核查既有机制边界（不可新增公共入口/新 store/compatibility bridge/历史分支/第五材料；AGENTS.md vNext 边界），确认总结文件"推荐改造方案"是可选项而非已确认需求。
- 当前范围草案（待 Talk round 2 定稿）：
  - 必做：诊断（核实总结文件 8 类根因+3 个失败任务证据）；
  - 待定候选（总结文件 A-G 方案）：收口可行性前移（build-plan 末端预检）、唯一结构化 gap 来源与 current-fact selector、状态展示分层（can_continue/stage/quality/acceptance/release/physical close 分离）、边界入口身份与 freshness 校验（attempt_id=agent_run_id、receipt 绑定 material revision/snapshot）、review/测试语义收紧；
  - 明确外延：build-spec 收口合同（总结文件 A）。
- 不确定性（待用户确认）：改造范围候选取舍（哪些进、哪些延期/非目标）；验收方式（是否含真实 provider 参与/是否含验证案例）；是否分 phase；本任务自身是否作为"dogfood"验证。
- 非目标草案：不改历史任务记录、不重放 M17/T09 本身、不新增公共入口/store/gate/第五材料、不做"再加几个最终检查"式补丁、不把外部 unavailable 补成通过。

### step 3 talk-round-1（completed, 2026-09-06）

- 实际做了什么：按 talk-with-zhipeng Round 1 职责（真实痛点/成功标准/是否调研）发出 3 个独立问题卡（结构化问答工具，每题单轴、推荐项、后果/风险可见），收到真实用户回复并重排；本轮无剩余 high/medium 开放项，收敛。
- 用户答复原文：痛点=③两个都要；成功标准=②诊断+治理改造落地；调研=②只做内部文献调研（见 T 表）。
- 队列变化：T-001/T-002/T-003 已答；成功标准衍生"验证方式"问题转入 round 2 队列。
- 后果/风险：方向已定"诊断+改造"，范围待 round 2；risk：改造面大、周期长，需严格按阶段推进并事前定清验收标准（本轮已向用户明示）。

### step 4 research-inputs（completed, 2026-09-06）

- 实际做了什么：按用户选择只做内部文献调研；派出只读调研子代理并回传 5 问结论（Q1-Q5），已落盘 F-017~F-023 与调研表 R-001；历史任务核查（子代理 34efaade）同步完成并落盘 F-010~F-016、核实表、共同模式与总体判断。
- 输入与当前快照：输入=总结文件 A-G 方案、仓库代码与 docs 现状；快照=任务分支 b16d5bcf。
- 产物/事实引用：两份子代理报告（路径见 F 表来源列）。
- 结果：completed。外部调研明确 skipped/unavailable 不适用（用户选择只做内部）。
- 未完成/跳过：无；外部调研未做（用户决定，见 T-003）。

### step 5 talk-round-2（completed, 2026-09-06）

- 实际做了什么：按 talk-with-zhipeng Round 2 职责（方向/范围/非目标/关键取舍/风险）分 2 组发出 5 个独立问题卡（组1=close 语义+验证方式；组2=范围；组3=实施形态+非目标——按依赖拆分，组2 依赖组1），全部收到真实回复并重排；本轮无剩余 high/medium 开放项，收敛。
- 用户答复：close 语义=①保持现状但如实说清；验证=①测试绿+本任务 dogfood；范围=①聚焦改造；实施形态=①一个任务多 phase；非目标=①全部接受（T-004~T-008）。
- 队列变化：无新增开放问题；"方向"已收敛为：诊断 + 聚焦改造（A/B 预检链、D 唯一缺口源、E 边界校验、F 状态分层；C/G 并入阶段要求）。
- 后果/风险：改造横跨 build-spec/build-plan/runtime/展示/测试 5 处，任务周期为最长的部分；已向用户明示；剩余风险移交 direction-advice 与 talk round 3。
