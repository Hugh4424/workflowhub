---
user_decision: true
---

<!-- 本文件系统路径迁移自 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/wh-review-rebuild/decision-log.md（原 task_dir 配置错误导致落盘到仓库外），迁移日期 2026-07-06 -->

# make-decision 决策日志

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
> - pass 自动推进下一 stage 生效（注：已由 D2 收窄为仅 build-spec/build-code 两个 stage）。
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

## 3. 决策记录

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
- 主责阶段：build-plan 负责设计测试方案文档，verify-code 负责执行验证。
- 最小交付物定义：测试方案文档 + 至少一个端到端冒烟用例可在 workflowhub 本地跑通。
- 本阶段只记录该验收要求，具体测试方案设计与执行留给后续 build-plan / verify-code 阶段。

来源证据：用户 2026-07-05 评论"也要有一定的测试方案，保证新的技能和瘦身后的3rd-review技能好用，整个方案能在workflowhub中走通"。

---

### D8 make-decision 优化方案

- **talk-with-zhipeng**（`skills/talk-with-zhipeng/SKILL.md`）：范围四维判定（真实痛点/ROI/风险/时机）前加两条前置检查——(1) 外部工具/接口是否已核实真实调用方式，未核实转 S3 外部调研；(2) 本轮讨论的、会被多处复用的命名/路径/字段本轮必须钉死唯一定义。落地位置：`skills/talk-with-zhipeng/SKILL.md` 新增"4.5 前置检查"节。
- **grill-with-docs**（`skills/grill-with-docs/SKILL.md`）：退出条件从主观"用户能否复述四件事"改为客观 checklist（外部依赖接口是否已核实真实定义 / 字段路径命名是否有唯一权威定义 / 失败路径与异常语义是否明确 / 范围边界做什么不做什么是否写死），四项全过才能退，缺一项转 decision-log"开放问题"节，不许静默放过。
- **decision-log**（`skills/decision-log/SKILL.md`）：7 节结构不变，第 3 节"决策记录"下新增两个子节：
  - **权威定义表**：详见本文件新增的"权威定义表"节（字段/路径/命名 → 值 → 唯一来源文件）。
  - **外部依赖接口核实记录**：详见本文件新增的"外部依赖接口核实记录"节。
  - 并在"What to do"新增第 6 步：落盘后做存在性自检（真实校验文件确实生成在预期路径），不能"执行了写命令"就算完成。
- **盲审 skill**（`skills/intake-decision-review/SKILL.md`）：加第四维 `feasibility`（技术可行性，审外部工具/接口/边界条件假设是否与现实相符）；findings 数量上限从"恰好 3 条"改为每维 0-N 条不设上限，避免真实问题被截断；跳过机制加约束——允许跳过，但跳过前若本轮已产出任意 finding，必须转成 decision-log"开放问题"+生成对应可追踪 issue，不许直接消失。
- **盲审审查合同**（同一文件内 S3/S7）：合同加强制字段 `verified_interface: {tool, checked_at, method}`，调用前须实测跑一次 `--help` 或读源码确认接口，缺该字段直接判不可执行；加"契约漂移检测"——实际返回结构与合同声明不一致时，审查器必须把该不一致本身列为 blocking finding，不能吞掉重试或忽略。

来源证据：用户批准的 `/tmp/d8d9-scope.md`"D8：make-decision 优化方案"全文，2026-07-07 落地执行。

#### 权威定义表（D8 新增，本任务实例）

| 字段/路径/命名 | 值 | 唯一来源文件 |
|---|---|---|
| grill-with-docs 退出 checklist 四项 | 外部依赖接口核实/字段路径命名唯一定义/失败路径与异常语义/范围边界写死 | `skills/grill-with-docs/SKILL.md` |
| `verified_interface` 字段结构 | `{tool, checked_at, method}` | `skills/intake-decision-review/SKILL.md`（S3 审查请求定义） |
| 盲审审查角度 | `direction`/`framing`/`scope`/`feasibility` 四类 | `skills/intake-decision-review/SKILL.md` |
| intake-review-orchestrator 审查维度 | 漂移/盲点/细节自洽/权威定义唯一/外部接口真实性 五维 | `skills/intake-review-orchestrator/SKILL.md` |
| intake-review-orchestrator 挂载点 | make-decision S7 draft 产出后、第二次 debate 门控前 | `workflows/make-decision/SKILL.md` S7 第 4 步 |

#### 外部依赖接口核实记录（D8 新增，本任务实例）

- 已读取 `skills/grill-with-docs/SKILL.md` 真实源文件内容，确认其现有退出条件描述位置（"If a question can be answered by exploring the codebase..."之后），在该处插入客观 checklist，未依赖对该文件内容的假设。
- 已读取 `skills/decision-log/SKILL.md` 真实源文件内容，确认其 7 节结构定义与"What to do"步骤列表的准确位置后插入新子节与新步骤。
- 已读取 `skills/intake-decision-review/SKILL.md` 真实源文件全文（含 S3/S6/S7/S8/S9、输出、约束各节），确认"findings 恰好 3 条"的所有出现位置后统一改写，未遗留旧表述。
- 已读取 `workflows/make-decision/SKILL.md` 真实源文件对应 S5/S7/S7.2/S8.2/S10 各步骤原文（含 journal 事件表），核实后逐处加固，非计划性描述。

---

### D9 细节审查机制设计（ZHI-93 遗漏加固）

- **ZHI-93 遗漏审计结论**（已核实，直接作为加固依据）：高危 3 条——S10.2 taskDir 解析故障需机器级校验、S10.4 收尾自证脱节（收尾评论宣称"产物齐全"但未核实真实路径）、S7.4 blocking finding 假装闭环（格式走完但决策日志写占位符文本）；中危 3 条——S5 盲审跳过未走真实环境变量（agent 手动模拟跳过）、S7.2 grill 退出条件非用户主动逐条复述、S8.2 project-memory.json 该同步未同步且未写"无需变更"理由；低危 3 条不影响本次加固设计，无需处理。
- **新建细节审查 skill**：`skills/intake-review-orchestrator/SKILL.md`，挂载点 make-decision S7 draft 产出后、第二次 debate 门控前；审查对象为 decision-log 草稿全文 + S4 原始需求台账 + 权威定义表 + S5 盲审结果；五维不设条数上限（漂移/盲点/细节自洽/权威定义唯一/外部接口真实性）；不重跑 framing-challenge；不留跳过口子（宪法 F5：gate 谨慎添加、出事再补，新加的不预留后门）；findings 存在 blocking 时走 debate_2，debate 裁决维持 blocking 的必须真改草稿内容或给出真实可跟进 issue 编号，不许用"决定不处理"当挡箭牌。
- **五处加固**（对应上述中低危及高危遗漏，落地于 `workflows/make-decision/SKILL.md`）：
  1. S5 跳过分支：改成必须基于真实环境变量检测判断，agent 手动模拟视为违规。
  2. S7 第 4 步：显式接入 `skills/intake-review-orchestrator/SKILL.md` 作为 orchestrator 实现，不再是抽象占位描述。
  3. S7.2 grill 退出：用户须对四件事逐条确认（或整体"以上都对"），单一是非题回复不算确认。
  4. S8.2：CONTEXT.md/ADR 有更新时，project-memory.json 必须同步或显式写"本次无需变更"+理由，二选一不可默认跳过。
  5. S10 新增机器级自检（非 LLM 审查、脚本级 fail-loud）：落盘后真跑 `parseTaskDir()` 文件存在性校验；grep 全文扫占位符词表（"[占位符]"/"TBD"/"待后续"等）命中决策性字段直接 fail-loud；校验命令与结果写进收尾评论。

来源证据：用户批准的 `/tmp/d8d9-scope.md`"D9：细节审查机制设计 ZHI-93 遗漏加固"全文，2026-07-07 落地执行。

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

D1-D9 均已用户明确定案，无阻断性开放问题遗留。

**已登记的跟进事项（不阻断当前范围）**：

- **3rd-review 调用契约与 SKILL.md 描述不一致**：standalone.sh 实际调用参数/返回结构与 SKILL.md 文档描述（`--engine`/`--output`，返回 findings 三条+direction_divergence）存在不一致。已登记为跟进事项，不阻断当前范围，具体 issue 编号将在 build-plan 阶段创建时补上。

---

## 7. 验收标准

以下判据需在后续实现阶段全部落地校验：

- **D2**（仅 build-spec/build-code 自动推进，其余人工确认）：wh-review 实现中 make-decision/build-plan/verify-code 的 pass 路径须触发人工确认流程，不得自动推进。
- **D6**（5 stage 统一收尾模板）：5 个 stage 的 SKILL.md 收尾步骤均须调用 `docs/human-brief-template.md`，禁止各自写不一致的收尾逻辑；改动后需逐一核实。
- **D7**（配套测试方案，端到端可跑通）：build-plan/verify-code 阶段须产出可执行的测试方案，覆盖 wh-review + 瘦身后 3rd-review 组合，且能在 workflowhub 全流程中端到端跑通。主责阶段：build-plan 负责设计测试方案文档，verify-code 负责执行验证；最小交付物定义：测试方案文档 + 至少一个端到端冒烟用例可在 workflowhub 本地跑通。
- **intake C1-C6**（make-decision 专属合同判据）：wh-review 的 intake 合同实现须覆盖 C1-C6 全部判据，可机器消费的标准字段（decision/scope.in/scope.out/open_questions）均非空。
- **verify-code F1-F6**（新鲜性判据）：wh-review 的 test-acceptance 合同实现须覆盖 F1-F6 全部判据，fresh-capture/evidence 机制须与 build-code 产物记录对齐。

---

## 执行环境

本次 make-decision 执行时环境变量检测结果（2026-07-05）：

- `WORKFLOWHUB_TASK_DIR`：未设置；本次通过 `config/workflowhub.yaml` 的 `task_dir` 字段 fallback 解析，得到 `task_tracking_root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub`。
- `MAKE_DECISION_SKIP_BLIND_REVIEW`：未在 shell 环境实际设置。S5 单次盲审的跳过是按用户 2026-07-05 明确批准（选项A）由 foreman 手动应用该分支逻辑，而非通过实际环境变量触发。journal 记录的 `blind_review: skipped` 反映的是 foreman 的手动决策，不是变量触发的自动跳过。
- `MAKE_DECISION_SKIP_DEBATE`：未设置，使用默认值 `0`。
- `MAKE_DECISION_DEBATE_PATH`：未设置，使用默认值 `/Users/Hugh/Hugh/Project/debate`（已核实路径可达）。
- `THIRD_REVIEW_RUNNER`：未设置，使用默认值 `run-heterologous-review.mjs`。
- `REVIEW_DISPATCH_CONFIG`：未设置，走内置默认调度。
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`：已设置为 `1`（五方法庭模式可用；但本次两次 debate 门控均因 finding 仅为实现层未触发，故实际未启用）。
- 本次检测过程中无 `dispatch_config_invalid` / `debate_path_invalid` / `runner_invalid` 等降级事件触发。
