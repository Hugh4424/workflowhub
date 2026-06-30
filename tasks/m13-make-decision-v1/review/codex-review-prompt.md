You are conducting a HETEROGENEOUS drift/blindspot/detail review of a decision-log draft. You must cover all THREE lenses. Output findings in the exact format: `[severity: blocking|major|minor] <lens> <finding> | <fix>`.

---
## REVIEW TARGET — decision-log.md (DRAFT)

version: draft
task: m13-make-decision-v1
stage: make-decision

DRAFT — awaiting S7d drift/blindspot/detail review + possible 2nd debate before finalizing.

# M13 make-decision 深化 — 决策日志

## 1. 原始需求（原文）

用户路线图 M13 原始要求（verbatim）:
"M13 deepens make-decision. M7 只有 scope-triage + decision-log 两个动作，太薄。M13 加五类护城河动作：
1. 双路调研（parallel dual-path heterologous research）
2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
3. talk-with-zhipeng（inline）——一次只问一个问题，按影响排序
4. grill（grill-with-docs-lite shell）
5. debate（EXTERNAL /Users/Hugh/Hugh/Project/debate，OPTIONAL，仅方向级分歧或 blocking finding >2 时）——Agent Teams 不可用时降级，输出裁决书.md
全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"

范围确认：全做五类动作（双路调研 / 方向盲审 / talk-with-zhipeng / grill / debate），M13 一次交付完整深化版 make-decision skill，通过 workflowhub 自身 dogfooding 验证。

## 2. 问题与目标

核心问题：M7 版 make-decision 只有 scope-triage + decision-log 两个动作，缺乏调研、异源审查、收敛对话、逐层追问和方向级辩论能力，决策日志质量依赖单人单次推理，护城河不足。

目标：
- 实现 11 步流程（S0–S10），覆盖完整链路。
- 每个护城河动作由独立 skill 封装，orchestrator 只做薄编排。
- 产出可溯源、有台账的 decision-log，下游 build-spec / build-plan / build-code 直接消费。
- 所有机制记录态非 blocking，唯一 hard gate 为 S9 用户明确批准（符合宪法 D5）。
- 通过 workflowhub 自身 dogfooding 验证整套流程可走通。

## 3. 决策记录

### D1 — 11 步流程（S0–S10）作为 make-decision 正式流程

决策内容: make-decision 采用 11 步流程：S0 背景扎根 → S0.5 scope-triage+台账 → S1 内部调研(≥3子代理) → S2 talk#1 门控外部调研 → S3 条件性外部双路调研 → S4 方向设计+talk#2 收敛+方向基线确认 → S5 三角度并行盲审+第一次 debate 门控 → S6 给用户看盲审/debate 结果 → S7 talk#3→grill→decision-log 草稿→漂移/盲点/细节审查+第二次 debate 门控 → S8 同步 CONTEXT/ADR → S9 唯一 hard gate 用户批准 → S10 落盘
理由: 内部调研先行可建立问题基线，talk#1 门控外部调研避免盲目调研成本，两次 debate 门控分别保护方向阶段和细节阶段，唯一 hard gate 在 S9 确保人类最终裁决
备选项: 原 M7 两步流程；原始 intake 双道并行顺序
来源类型: 原文要求 + 衍生
来源证据: tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md §步骤排序 S0–S10 全节；原始 intake.md M13 要求五类护城河动作；用户修正：外部调研条件触发、talk 共三次、两次 debate 门控
用户批准: 是
批准证据: 用户路线图 M13 原始要求 + 流程对齐研究文档已确认

### D2 — Skill 复用分类（六类动作复用来源）

决策内容: 各 skill 复用来源如下：双路调研=muyu-search-mcp照搬(须修extra_sources>=3参数坑)+anysearch照搬开源；talk-with-zhipeng=gstack office-hours+superpowers brainstorming改造+问题权重排序自研；盲审三角度=3rd-review异源(默认异源非同源降级)；debate=外部repo照搬(/Users/Hugh/Hugh/Project/debate)；grill=grill-with-docs-lite优化(去全文注入保留盘问骨架)；scope-triage/decision-log=workflowhub已有直接复用
理由: D15 三档分类（照搬/优化/自研）保证复用清晰可审查；各动作按最小改动原则选取上游
备选项: 全部自研（成本过高）；agenthub route-review.mjs 作为双路调研来源（已纠正）
来源类型: 原文要求 + 衍生
来源证据: tasks/m13-make-decision-v1/research/skill-reuse-classification.md §汇总表全节；用户修正：双路调研来源为 muyu-search-mcp + anysearch，非 agenthub route-review.mjs
用户批准: 是
批准证据: skill-reuse-classification.md 已确认复用分类

### D3 — 所有盲审默认异源（via 3rd-review）

决策内容: 三角度盲审（intake-direction-review / intake-framing-challenge / intake-scope-review）统一走 3rd-review 异源链，默认异源非同源降级；不走裸派子代理
理由: 异源是独立性保证，同源降级破坏盲审意义；3rd-review 链已有覆盖率/失败回退/独立性四条硬护栏
备选项: 裸派子代理做盲审（独立性不保证）；同源允许（失去盲审价值）
来源类型: 原文要求
来源证据: 用户指令：所有 review 默认异源；skill-reuse-classification.md §3 盲审三角度：reuse_class=走3rd-review异源
用户批准: 是
批准证据: 用户路线图 M13 原文 "dual-path heterologous"；用户指令明确

### D4 — 两次 debate 门控，触发门槛 = blocking finding >2

决策内容: debate 设两次门控：Gate1 在 S5 三角度盲审后（触发条件：blocking finding 数 >2 或存在方向级分歧）；Gate2 在 S7d intake-review-orchestrator 后（触发条件：产出 severity:blocking finding）。debate 不只收敛冲突，丙/丁组可产新想法（按 D15 回退判定）。红线：禁止在审查前自造争点触发辩论
理由: 仅方向级分歧一个触发条件过窄；blocking finding >2 更客观可量化；两次门控分别保护方向阶段和细节阶段
备选项: 仅一次 debate；仅方向级分歧触发；debate 仅用于收敛
来源类型: 衍生
来源证据: 用户指令修正：触发门槛 = blocking finding >2，非仅方向级分歧；make-decision-flow-aligned.md §S5 第一次debate门控 + §S7d 第二次debate门控
用户批准: 是
批准证据: 用户明确修正触发条件

### D5 — Env var 设计：全部可选+安全默认+降级

决策内容: 引入六个 env var，全部可选+安全默认+降级：CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS（debate五方法庭，缺失降级单人三档）、MAKE_DECISION_DEBATE_PATH（debate路径，默认/Users/Hugh/Hugh/Project/debate）、MAKE_DECISION_SKIP_DEBATE（强制跳过，调试用）、THIRD_REVIEW_RUNNER（3rd-review runner命令）、REVIEW_DISPATCH_CONFIG（dispatch配置路径）、MAKE_DECISION_SKIP_BLIND_REVIEW（跳过盲审，调试用）。不在 config/workflowhub.yaml 注册
理由: workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断
备选项: 在 config/workflowhub.yaml 新增业务 env 节（破坏注册表语义）；硬编码路径
来源类型: 衍生
来源证据: tasks/m13-make-decision-v1/research/env-var-design.md §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则
用户批准: 是
批准证据: env-var-design.md 已确认设计

### D6 — 横切质量机制全部记录态非 blocking，唯一 hard gate = S9

决策内容: 以下机制贯穿全流程，均为记录态非 blocking：原始需求台账D28（已覆盖/待处理/已丢弃带理由，无静默踢出，丢弃必须有理由）；方向基线确认（S4 talk#2后S5前，未确认挡住流程但非机器gate）；三角度输入隔离硬约束（framing只喂原始需求明文禁含拟定方向）；防漏阀留痕（blocking级反对→必须留痕格式：反对X/决定Y/理由Z，缺失阻断落盘标记）；新想法回退判定D15（动摇方向新想法→判回退点→告知→确认后重跑）；双路返空即停；交互简洁≤4选项。唯一 hard gate = S9 用户明确批准「同意」
理由: 宪法 D5 记录事实而非阻断；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃
备选项: 每个机制都做机器 blocking gate（违反 D5）；不做台账
来源类型: 原文要求
来源证据: make-decision-flow-aligned.md §横切质量机制表；原始 intake.md 各条；CONSTITUTION.md D5 非阻断原则
用户批准: 是
批准证据: 流程对齐文档已确认；CONSTITUTION 原则一致

## 4. 假设

- [ASSUMPTION] workflowhub 无既有业务 env-var 惯例
- [ASSUMPTION] debate 外部 repo 路径 /Users/Hugh/Hugh/Project/debate 在执行环境可访问；不可访问时 MAKE_DECISION_DEBATE_PATH 可覆盖
- [ASSUMPTION] muyu-search-mcp 存在参数坑（extra_sources 默认=0 导致纯 LLM 幻觉），须在调用时硬传 extra_sources>=3 并后置 get_sources 验证
- [ASSUMPTION] historical-lessons-used 字段按需记录，不强制，不做格式校验阻断推进

## 5. 明确不做

- 不引阻断 gate（除 S9 人确认）
- historical-lessons-used 非强制
- 不照搬 agenthub route-review.mjs 作为双路调研来源
- 不修改 build-spec / build-plan / build-code / verify-code 行为
- 不在 config/workflowhub.yaml 注册 env-var
- clarify-lite 不创建独立 SKILL.md

## 6. 开放问题

- 本文档为 DRAFT，尚待 S7d 漂移/盲点/细节审查完成
- intake-review-orchestrator 在 M13 适配时，framing-challenge 已在 S5 前置跑，orchestrator 本步不重复跑 framing——此接线细节待 SKILL.md 实现时确认
- muyu-search-mcp get_sources 核实失败时的停止报告流程（等人处理还是降级 anysearch 单路）：当前设计为停下等人

## 7. 验收标准

1. 五类动作全部可跑：make-decision 执行后能产出内部调研汇总、盲审三角度结果（各角度独立落盘）、grill 压测记录、debate 裁决（或降级记录）、落盘 decision-log
2. debate 登记 reuse-registry：reuse-registry.md 中 debate 以 category + source path 形式登记
3. 各动作可异源审查：盲审三角度均走 3rd-review 异源链
4. 指标记录完整：tasks/m13-make-decision-v1/task-metrics.jsonl 中存在对应记录
5. 台账无静默踢出：全流程台账 D28 中任何「已丢弃」条目均带驳回理由
6. 唯一 hard gate 可验证：S9 必须有用户明确说「同意」的批准记录

---
## BASELINE — make-decision-flow-aligned.md (agreed 11-step flow)

Steps S0–S10:
- S0: 背景扎根（读project-memory/ADR/代码/conversation history + 产出完整性自检）
- S0.5: scope-triage + 建原始需求台账 D28（全档必调，低风险可跳 S1-S5）
- S1: 内部调研（≥3子代理，五类：问题/根因/风险/方向/扩展）[full档]
- S2: talk#1（基于内部调研，聊外部调研是否需要 + 调研方向）[full档]
- S3: 外部双路调研（CONDITIONAL—由S2决定；muyu+anysearch双路互证）[full档，条件触发]
- S4: 方向设计+talk#2六维方向确认+方向基线确认+落盘make-decision-original-context.md
- S5: 三角度并行盲审（方向/框架/范围，输入隔离）+ 第一次debate门控 [full档]
- S6: 给用户看盲审/debate结果
- S7: talk#3→grill-with-docs-lite→decision-log草稿（7节，不落盘）→intake-review-orchestrator（漂移/盲点/细节）+ 第二次debate门控
- S8: 同步CONTEXT/ADR/project-memory
- S9: 方向确认hard gate（唯一强制门控，用户明确批准「同意」，台账逐条核对）
- S10: 落盘decision-log（版本锚点=git commit hash，落盘失败即停）

横切质量机制 (all mandatory):
- 原始需求台账D28（丢弃必须有理由，无静默踢出）
- 方向基线确认（S4后S5前，挡住流程，非machine gate）
- 三角度输入隔离（framing只喂原始需求禁含拟定方向）
- 防漏阀留痕（blocking级反对→反对X/决定Y/理由Z格式，缺失阻断落盘标记）
- 新想法回退判定D15（动摇方向→判回退点→确认→重跑）
- 双路返空即停（不用自身记忆替代）
- 交互简洁硬约束（一次只问一个问题，≤4选项，每选项≤15字）
- 唯一hard gate = S9 用户明确批准「同意」

Required Skills:
- scope-triage (S0.5, 所有档)
- talk-with-zhipeng round=1 (S2)
- make-decision-background-research muyu+anysearch (S3, conditional)
- talk-with-zhipeng round=2 (S4)
- intake-direction-review via 3rd-review (S5)
- intake-framing-challenge via 3rd-review (S5, 输入隔离最严)
- intake-scope-review via 3rd-review (S5)
- debate (S5/S7, conditional)
- talk-with-zhipeng round=3 (S7a)
- grill-with-docs-lite (S7b)
- intake-review-orchestrator (S7d)
- decision-log (S10)

Original requirement 5 moats:
1. 双路调研（parallel dual-path heterologous research）
2. 方向盲审（blind review）via 3rd-review, 异源, 非阻断
3. talk-with-zhipeng（inline）一次只问一个问题，按影响排序
4. grill（grill-with-docs-lite shell）
5. debate（EXTERNAL /Users/Hugh/Hugh/Project/debate，OPTIONAL，仅方向级分歧或blocking finding >2时）—降级，输出裁决书.md

---

## YOUR TASK

Cover ALL THREE lenses. Output each finding as:
[severity: blocking|major|minor] <lens> <finding> | <fix>

### Lens 1 — DRIFT CHECK (MUST run)
Compare every item in: original 5 moats + 11-step flow S0-S10 + cross-cutting quality mechanisms vs the draft. What requirement is uncovered? What is distorted? Does the draft deviate from the baseline?

### Lens 2 — BLINDSPOT
What risks or edge cases did the draft miss? Consider: state machine transitions, data migration, multi-file coupling, concurrency/timing, signal triggering edge cases.

### Lens 3 — DETAIL
Are there internal contradictions, ambiguities, unfalsifiable acceptance criteria, or missing source evidence in the decision entries?

After all findings, give final verdict: PASS / REVISE_REQUIRED / ESCALATE_TO_HUMAN
