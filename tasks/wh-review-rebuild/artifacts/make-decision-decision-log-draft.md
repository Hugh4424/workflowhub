# make-decision 决策日志草稿

> 核查来源：`artifacts/make-decision-grill-with-docs.md`
> 状态：草稿（待后续阶段终态化）

---

## 1. 原始需求

**背景**（来源：`artifacts/make-decision-original-context.md` 条目1）

> workflowhub 各 stage 用 3rd-review 做异源审查，现在这套技能臃肿、不好用、不好追踪：审查有没有审完不知道、审查报告基本没生成过、审查质量无法保证。
>
> 真根因：workflowhub 5 个 stage 调用 3rd-review 时都没传 stage 标识。3rd-review 靠 `--checkpoint=<stage>` 前缀匹配路由到 stage 专属合同，标识永远为空导致匹配失败，回退到通用合同，挂在 `verifiers/vibecoding/` 下的 11 个 stage 专属合同从未被路由使用。
>
> 同时原版 agenthub 的 3rd-review 已实现的分轮全量/增量审查、成本降级、升级人工、报告渲染机制，迁移到 workflowhub 时全部丢失，退化成一次性通用审查。本任务不修旧 bug，直接重设计。
>
> 注：上述 checkpoint 路由缺失问题已于 commit e96c257 修复，此背景仅作问题溯源，不作为本次重设计的直接触发缺陷。

**目标**（来源：`artifacts/make-decision-original-context.md` 条目2）

> 重设计为两层架构：
> - **3rd-review（瘦身，全局通用）**：纯异源审查引擎，输入 `{mode, contract, materials}`，做环境探测，派审查 agent，返回 `{verdict, findings, actual_mode}`，零 stage/轮次知识，可独立复用。
> - **wh-review（workflowhub 专属，新建）**：拥有 stage→合同映射、5 套 stage 专属合同（从 agenthub verifiers/vibecoding 先搬后补）、轮次状态、降级/升级大脑、Delta Package 构造、报告模板+渲染脚本。
>
> Stage 合同映射：make-decision←intake，build-spec←design，build-plan←plan，build-code←code，verify-code←test-acceptance。
>
> 审查降级机制：第1轮强制全量异源；第2轮起增量Delta Package+降级；异源最多3轮后强制转同源；连续3轮大量blocking或指纹重复blocking→升级人工。裁决枚举：pass/revise_required/escalate_to_human。报告脚本渲染（移植render-review-report.mjs），6章结构，落盘任务目录。

**验收标准**（来源：`artifacts/make-decision-original-context.md` 条目3）

> - 各 stage 触发 wh-review 时传对 stage 标识，对应专属合同被正确加载（日志可验证）。
> - 审查报告由脚本生成、6章齐全、落盘可追踪。
> - 降级（异源→同源）、异源3轮硬顶、升级人工三条路径可触发且有日志记录。
> - pass 自动推进下一 stage 生效。
> - 3rd-review 瘦身后不含任何 stage/vibecoding/轮次逻辑，可独立复用。

**已知风险**（来源：`artifacts/make-decision-original-context.md` 条目4）

> - 接口不强制 stage 参数则前功尽弃：wh-review→3rd-review 接口必须把 stage/contract 设为必填，缺失即报错。
> - 两层协作契约风险：findings schema、verdict 枚举、mode 取值两边必须对齐。
> - 空泛合同首版打折：intake 方向节、verify-code 新鲜性判据先搬后补，首版审查质量偏弱。
> - 硬顶3轮转同源可能放过真bug：需在报告和日志里显式标 actual_mode=same-source，保留人工复核入口。
> - render 脚本移植依赖数据结构对齐，否则报告渲染失败。
> - build-code SKILL.md §7 与 §13 文档矛盾，重设计前需清理歧义。

---

## 2. 问题与目标

**核心问题**

1. **路由失效**：workflowhub 5 个 stage 调用 3rd-review 时均未传 stage 标识（`--checkpoint=<stage>`），导致路由前缀匹配永远失败，退回通用合同；`verifiers/vibecoding/` 下的 11 份 stage 专属合同从未被实际使用。

2. **机制迁移丢失**：原 agenthub 已实现的分轮全量/增量审查、成本降级、升级人工、报告渲染机制，在迁移到 workflowhub 时全部丢失，退化为一次性通用审查，审查质量无保证、报告从未生成、审查进度不可追踪。

**目标**

重设计为两层架构，解耦审查引擎（3rd-review 瘦身）与 stage 专属知识（wh-review 新建），使路由、降级/升级、报告渲染机制全部可运转，并使 3rd-review 可独立复用于非 workflowhub 场景。

---

## 3. 决策（D1–D7）

### D1 两层架构（已确认）

- 3rd-review 瘦身为纯异源审查引擎：`{mode, contract, materials}` → `{verdict, findings, actual_mode}`，零 stage/轮次知识，可独立复用。
- wh-review 新建，workflowhub 专属：stage→合同映射、5套专属合同、轮次状态、降级/升级、Delta Package、报告渲染。

来源证据：issue feb2e69b 原始需求 + 用户 2026-07-05 确认评论"认同，..."。

---

### D2 pass 自动推进范围收窄（修正原始验收标准#4）

- 原始验收标准"pass 自动推进下一 stage"经用户澄清：**只有 build-spec 和 build-code 两个 stage 的 pass 会自动推进到下一 stage**。
- 其余 3 个 stage（make-decision / build-plan / verify-code）pass 后不自动推进，靠人工确认后推进。

来源证据：用户 2026-07-05 评论"审查通过（pass）能自动推进到下一个 stage只有build-spec和build-code" + 用户 2026-07-05 评论"靠人工确认后推进"。

**D2 补充**：make-decision / build-plan / verify-code 这 3 个 pass 后的推进方式确定为人工确认，非自动、非留白后补。

---

### D3 build-code SKILL.md §7/§13 文档矛盾清理

- 矛盾内容：§7（L96-117）定义单次 3rd-review 调用产出单一 verdict 直接决定推进；§13（L221-250）定义两个独立 subagent 聚合，`pass` 需两边都 `pass`。§7 L117 有事后注释承认已被 §13 取代，但操作指令未删除，双轨并存。
- 采纳解决方向（方向1）：以 §13 为准。§7 主体改写为纯概念说明（3rd-review standalone 是每个 subagent 调用的底层入口），删除 §7 的三态 verdict 处理指令和调用命令模板，仅保留降级规则作为 §13 的补充说明。
- 注意：本次 make-decision 阶段只记录该决策方向，不在本阶段直接修改 build-code/SKILL.md；实际改动由后续 build-code 阶段的实现工作执行。
- **§7 改写范围约束**：§7 改后只保留对 §13 的概念性导读（一句话"单次调用语义参见 §13"），删除所有流程步骤/if-else 逻辑描述，须满足"§7 不含任何 numbered step / if/else 逻辑"的机器可检验规则。

来源证据：用户 2026-07-05 评论"文档矛盾一起清理" + explore sub-agent 调研（agentId aa1dff85d4c969705）。

---

### D4 intake 方向节判据（详细规则，定案）

用于 wh-review 新版 make-decision/intake 专属合同：

- **C1** 原始需求原文引用：产物需含至少一处原文引用/来源标注；仅概括描述视为不通过。
- **C2** 决策有证据支撑：每条"选X非Y"结论需附至少一条具体理由（技术约束/风险评估/用户表态）；裸断言视为不通过。
- **C3** 范围边界明确划分 in/out：in-scope 与 out-of-scope 均需至少一条且互不重叠；只有 in 或表述模糊视为不通过。
- **C4** 无悬挂开放问题：开放问题数为 0，或均已标注"不阻断当前范围"+跟进 issue 编号；否则不通过。
- **C5** 方向与上游输入一致：方向结论需覆盖用户明确要求全部条目，无未授权范围扩张；遗漏或擅自扩大视为不通过。
- **C6** 决策产物格式可机器消费：需含 decision/scope.in/scope.out/open_questions 等标准字段且非空；自由文本块视为不通过。

来源证据：architect sub-agent（agentId a85a98f861db2de37），参考 verifiers/vibecoding 现有 11 份合同判据写法风格。

---

### D5 verify-code 新鲜性判据（详细规则，定案）

- **F1** 代码提交晚于最新 decision-log 更新：实现 commit 时间戳 ≥ decision-log 最后修改时间戳，否则不通过。
- **F2** 测试覆盖最新验收标准全集：spec.md 中每条 AC-ID 需在 test-strategy.md 的 ac_routes 中有非空路由，否则不通过。
- **F3** 无引用已废弃字段/接口：diff 范围内不得出现 decision-log/spec 中标记 deprecated/removed/废弃 的字段或接口名，命中即不通过。
- **F4** fresh-capture git_sha 与当前 HEAD 一致：evidence/fresh-capture.json 的 git_sha 需与 `git rev-parse HEAD` 精确匹配，不等或缺失即不通过。
- **F5** L2/RED/GREEN 报告 content_hash 未变：freshness.mjs checkEvidenceFreshness 的 mtime_violations 需为空数组，否则不通过。
- **F6** 测试命令与 build-code 产物记录一致：stage-result-build-code.json 的 facts.tests.command 需与本次 fresh-capture 实际执行命令字符串完全一致，不同或缺失即不通过。

来源证据：architect sub-agent（agentId a85a98f861db2de37）。

---

### D6 五个 stage 收尾总结统一模板

- 要求：5 个 stage（make-decision/build-spec/build-plan/build-code/verify-code）各自的 SKILL.md 收尾步骤都必须调用同一个统一的"大白话总结"模板/渲染脚本生成给用户看的收尾总结，禁止各自写各自格式不一致的收尾逻辑。
- 核查结论：5 个 stage 现状已统一使用 `docs/human-brief-template.md`，A/B 两派收尾类型（人工确认型 vs 自动放行型）正好对应新定的自动推进范围规则（D2），非缺陷，符合新规则。

来源证据：用户 2026-07-05 评论"注意5个stage最后都要有大白话的总结，请检查一下是不是5 stage最后都有调用统一的模板来生成总结" + explore 子代理核查结论（见本 issue 评论）。

---

### D7 测试方案要求

- 验收标准新增：本次两层架构重设计（3rd-review 瘦身 + wh-review 新建）必须配套一份测试方案，验证新的 wh-review 技能与瘦身后的 3rd-review 技能组合可用，且整个方案能在 workflowhub 全流程中端到端跑通。
- 本阶段只记录该验收要求，具体测试方案设计与执行留给后续 build-plan / verify-code 阶段。

来源证据：用户 2026-07-05 评论"也要有一定的测试方案，保证新的技能和瘦身后的3rd-review技能好用，整个方案能在workflowhub中走通"。

---

## 4. 假设

- **(a)** checkpoint 路由 bug 已在 commit e96c257 修复，本次重设计不涉及修复该旧 bug；用户 2026-07-05 明确确认"不影响，继续重设计"。
- **(b)** 5 stage 统一收尾模板现状已核实符合新规则：5 个 stage 均已统一使用 `docs/human-brief-template.md`；A 型（人工确认）对应 make-decision/build-plan/verify-code，B 型（自动放行）对应 build-spec/build-code，与 D2 收窄后的自动推进范围完全对应，非缺陷。
- **(c)** 3rd-review standalone.sh 当前实际支持的调用参数与返回结构（verdict 三态模型）与 SKILL.md 文档描述的调用格式（`--engine`/`--output`，返回 findings 三条+direction_divergence）存在不一致；假设该不一致会在后续 wh-review/3rd-review 瘦身实现阶段一并同步，本阶段不处理。

---

## 5. 明确不做

- 本阶段（make-decision）不直接修改任何 stage 的 SKILL.md 代码；只出决策方向，实际改动由后续实现阶段执行。
- 不设计具体测试方案；只记录 D7 验收要求，具体设计与执行留给 build-plan/verify-code 阶段。
- 不修复旧 checkpoint 路由 bug 本身（e96c257 已修复，用户确认不影响本次重设计方向）。
- 不改动已固化的 verifiers/vibecoding 目录结构本体（除非后续阶段决定迁移）。

---

## 6. 开放问题

无遗留待定项（D1-D7 均已用户明确定案，无遗留待定项）。

**待跟进事项**：

- **3rd-review 调用契约与 SKILL.md 描述不一致**：standalone.sh 实际调用参数/返回结构与 SKILL.md 文档描述（`--engine`/`--output`，返回 findings 三条+direction_divergence）存在不一致。当前范围不阻断，issue 编号待后续 build-plan 阶段创建：[占位符，build-plan 阶段需替换为实际 issue 编号]

---

## 7. 验收标准

以下判据需在后续实现阶段全部落地校验：

- **D2**（仅 build-spec/build-code 自动推进，其余人工确认）：wh-review 实现中 make-decision/build-plan/verify-code 的 pass 路径须触发人工确认流程，不得自动推进。
- **D6**（5 stage 统一收尾模板）：5 个 stage 的 SKILL.md 收尾步骤均须调用 `docs/human-brief-template.md`，禁止各自写不一致的收尾逻辑；改动后需逐一核实。
- **D7**（配套测试方案，端到端可跑通）：build-plan/verify-code 阶段须产出可执行的测试方案，覆盖 wh-review + 瘦身后 3rd-review 组合，且能在 workflowhub 全流程中端到端跑通。主责阶段：build-plan 负责设计测试方案文档，verify-code 负责执行验证；最小交付物定义：测试方案文档 + 至少一个端到端冒烟用例可在 workflowhub 本地跑通。
- **intake C1-C6**（make-decision 专属合同判据）：wh-review 的 intake 合同实现须覆盖 C1-C6 全部判据，可机器消费的标准字段（decision/scope.in/scope.out/open_questions）均非空。
- **verify-code F1-F6**（新鲜性判据）：wh-review 的 test-acceptance 合同实现须覆盖 F1-F6 全部判据，fresh-capture/evidence 机制须与 build-code 产物记录对齐。

## orchestrator-findings

> 来源：Critic agent 审查（基于 make-decision-decision-log-draft.md、make-decision-direction-confirmed.md、make-decision-original-context.md、make-decision-grill-with-docs.md、make-decision-s6-summary.md、internal-research-summary.md）
> 审查时间：2026-07-05

---

- **finding_id**: F-01
  **severity**: non_blocking
  **summary**: 决策日志第 1 节原始需求描述的"真根因"（5 stage 均未传 stage 标识）与 internal-research-summary 核查结论不一致。研究摘要明确记录该 bug 已由 commit e96c257（2026-07-04）修复，5 个 SKILL.md 均已加入 `--checkpoint=<stage>`（见 research-summary §2，行号逐一列出）。Section 1 的背景叙述原文照抄 issue 描述，但未标注"此根因在重设计发起时已修复"，读者易误认为这是重设计的直接驱动缺陷。假设 4(a) 有提及，但与 Section 1 正文的叙述形成信息矛盾，不够自洽。
  **recommendation**: 在 Section 1 背景段末增加一句说明："注：上述 checkpoint 路由缺失问题已于 commit e96c257 修复，此背景仅作问题溯源，不作为本次重设计的直接触发缺陷。"与假设 4(a) 互相呼应，消除信息矛盾。

---

- **finding_id**: F-02
  **severity**: blocking
  **summary**: 开放问题第 6 节将"3rd-review 调用契约与 SKILL.md 描述不一致"列为"不阻断"，但未给出跟进 issue 编号，不符合自身 intake 判据 C4（"均已标注'不阻断当前范围'+跟进 issue 编号，否则不通过"）。决策日志同时作为后续实现阶段的输入和 wh-review intake 合同的评审对象——如果该合同按 C4 机器校验本文档，此条将被判为不通过。
  **recommendation**: 在第 6 节该待跟进事项后补充跟进 issue 编号（若尚未创建则先建 issue 再填编号），或将该项显式标注为"当前范围不阻断，issue 编号待后续 build-plan 阶段创建：[占位符]"并在该阶段补全，不得以空跟进编号通过 C4 机器检查。

---

- **finding_id**: F-03
  **severity**: non_blocking
  **summary**: D7（测试方案要求）只记录了验收要求，但没有指定该要求的负责阶段和具体交付物格式。第 7 节验收标准引用 D7 要求"build-plan/verify-code 阶段须产出可执行的测试方案"，但两个阶段同时被提名，实际由哪个阶段主责、交付格式是文档还是可执行脚本、覆盖什么最小颗粒度，均未定义。执行者无法确定谁在哪个阶段为 D7 负责。
  **recommendation**: D7 节增加一行：指定主责阶段（build-plan 负责设计方案文档，verify-code 负责执行验证），并给出最小交付物定义（如：测试方案文档 + 至少一个端到端冒烟用例可在 workflowhub 本地跑通）。

---

- **finding_id**: F-04
  **severity**: non_blocking
  **summary**: D3（build-code §7/§13 矛盾清理）决定"以 §13 为准，§7 改写为纯概念说明"，但"纯概念说明"的边界未定义。§7（L96-117）目前定义了单次 3rd-review 调用的流程逻辑；改写后应保留哪些内容、删除哪些内容、最终 §7 的定位是什么（概述？废弃声明？纯文字描述？），均无约束。执行者会在此处产生歧义，导致改写结果不可预测。
  **recommendation**: D3 节补充一条"§7 改写范围约束"：明确 §7 改后只保留对 §13 的概念性导读（一句话说明"单次调用语义参见 §13"），删除所有流程步骤、决策分支描述，改写结果须通过"§7 不含任何 numbered step / if/else 逻辑"的机器可检验规则。

## debate 触发判断留痕（第二次）

- 反对 X：F-01~F-04 共 4 条 orchestrator finding，逐条核对：F-01 文档自洽性问题、F-02 机器校验格式缺失、F-03 交付物责任未定义、F-04 改写边界未定义——均为实现/文档层面的具体问题，无一条改变"要解决的问题本身"、"范围/优先级"、或"对原始需求的解释"。
- 决定 Y：不进入 debate。
- 理由 Z：依据 debate SKILL.md 的 MR-2 方向级分歧判定表，"仅实现层：方案/实现细节争议，不改变方向判断"对应"不触发"；4 条 finding 逐条比对均落在此类，无一条属于方向级分歧（问题改变/范围优先级/需求解释）。
