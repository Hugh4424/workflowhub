---
version: final
task: m13-make-decision-v1
stage: make-decision
---

> ---

# M13 make-decision 深化 — 决策日志

## 1. 原始需求（原文）

> **用户路线图 M13 原始要求（verbatim）**：
> "M13 deepens make-decision. M7 只有 scope-triage + decision-log 两个动作，太薄。M13 加五类护城河动作：
> 1. 双路调研（parallel dual-path heterologous research）
> 2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
> 3. talk-with-zhipeng（inline）——一次只问一个问题，按影响排序
> 4. grill（grill-with-docs-lite shell）
> 5. debate（EXTERNAL /Users/Hugh/Hugh/Project/debate，OPTIONAL）——make-decision 只传审查 findings、Claude 决策和 decision-log 版本；是否触发及五方法庭/单人三档模式由 debate 技能 Step 1 自判。
> 全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
>
> **范围确认**：全做五类动作（双路调研 / 方向盲审 / talk-with-zhipeng / grill / debate），M13 一次交付完整深化版 make-decision skill，通过 workflowhub 自身 dogfooding 验证。

---

## 2. 问题与目标

**核心问题**：M7 版 make-decision 只有 scope-triage + decision-log 两个动作，缺乏调研、异源审查、收敛对话、逐层追问和方向级辩论能力，决策日志质量依赖单人单次推理，护城河不足。

**目标**：
- 实现 12 步流程（S0、S0.5、S1–S10），覆盖「背景扎根 → scope-triage → 内部调研 → talk#1/双路外部调研 → 方向基线确认 → 三角度盲审+第一次debate门控 → 展示盲审/debate结果 → grill/talk#3/draft/第二次debate门控 → 台账渲染 → 用户批准 → 落盘」完整链路。
- 每个护城河动作由独立 skill 封装，orchestrator 只做薄编排。
- 产出可溯源、有台账的 decision-log，下游 build-spec / build-plan / build-code 直接消费。
- 所有机制记录态非 blocking，唯一 hard gate 为 S9 用户明确批准（符合宪法 D5）。
- 通过 workflowhub 自身 dogfooding 验证整套流程可走通。

---

## 3. 决策记录

### D1 — 12 步流程（S0、S0.5、S1–S10）作为 make-decision 正式流程

| 字段 | 内容 |
|------|------|
| 决策内容 | make-decision 采用 12 步流程（S0、S0.5、S1–S10）：S0 背景扎根 → S0.5 scope-triage → S1 内部调研(≥3子代理) → S2 talk#1 门控外部调研 → S3 条件性外部双路调研 → S4 方向设计+talk#2 收敛+方向基线确认 → S5 三角度并行盲审+第一次 debate 门控 → S6 给用户看盲审/debate 结果 → S7 talk#3→grill→decision-log 草稿→漂移/盲点/细节审查+第二次 debate 门控 → S8 同步 CONTEXT/ADR → S9 唯一 hard gate 用户批准 → S10 落盘 |
| 理由 | 内部调研先行可建立问题基线，talk#1 门控外部调研避免盲目调研成本，两次 debate 门控分别保护方向阶段和细节阶段，唯一 hard gate 在 S9 确保人类最终裁决 |
| 备选项 | 原 M7 两步流程（scope-triage+decision-log）；原始 intake 双道并行（调研道/收敛道）顺序 |
| 来源类型 | 原文要求 + 衍生 |
| 来源证据 | `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md` §步骤排序 S0–S10 全节；原始 intake.md M13 要求五类护城河动作；用户修正：外部调研条件触发、talk 共三次、两次 debate 门控 |
| 设计依据已确认 | 是（用户已对齐流程/分类/触发条件设计） |
| S9 最终批准 | 已批准（用户 2026-06-29「好的，没问题了」，ZHI-6 thread dc0b302c） |
| 批准证据 | 用户路线图 M13 原始要求 + 流程对齐研究文档已对齐设计依据（非 S9 最终批准） |

---

### D2 — Skill 复用分类（六类动作复用来源）

| 字段 | 内容 |
|------|------|
| 决策内容 | 各 skill 复用来源如下：双路调研=muyu-search-mcp照搬(须修extra_sources>=3参数坑)+anysearch照搬开源；talk-with-zhipeng=gstack office-hours+superpowers brainstorming改造+问题权重排序自研；盲审三角度=3rd-review异源(默认异源非同源降级)；debate=外部repo照搬(/Users/Hugh/Hugh/Project/debate)；grill=grill-with-docs-lite优化(去全文注入保留盘问骨架)；scope-triage/decision-log=workflowhub已有直接复用 |
| 理由 | D15 三档分类（照搬/优化/自研）保证复用清晰可审查；各动作按最小改动原则选取上游 |
| 备选项 | 全部自研（成本过高）；agenthub route-review.mjs 作为双路调研来源（已纠正，route-review.mjs 是内部路由工具，不是外部调研 skill） |
| 来源类型 | 原文要求 + 衍生 |
| 来源证据 | `tasks/m13-make-decision-v1/research/skill-reuse-classification.md` §汇总表全节；用户修正：双路调研来源为 muyu-search-mcp + anysearch，非 agenthub route-review.mjs |
| 设计依据已确认 | 是（用户已对齐流程/分类/触发条件设计） |
| S9 最终批准 | 已批准（用户 2026-06-29「好的，没问题了」，ZHI-6 thread dc0b302c） |
| 批准证据 | skill-reuse-classification.md 已对齐设计依据（非 S9 最终批准） |

---

### D3 — 所有盲审默认异源（via 3rd-review）

| 字段 | 内容 |
|------|------|
| 决策内容 | 三角度盲审（intake-direction-review / intake-framing-challenge / intake-scope-review）统一走 3rd-review 异源链，默认异源非同源降级；不走裸派子代理 |
| 理由 | 异源是独立性保证，同源降级破坏盲审意义；3rd-review 链已有覆盖率/失败回退/独立性四条硬护栏 |
| 备选项 | 裸派子代理做盲审（独立性不保证）；同源允许（失去盲审价值） |
| 来源类型 | 原文要求 |
| 来源证据 | 用户指令：所有 review 默认异源；`tasks/m13-make-decision-v1/research/skill-reuse-classification.md` §3 盲审三角度：reuse_class=走3rd-review异源；D8 原文要求 heterologous |
| 设计依据已确认 | 是（用户已对齐流程/分类/触发条件设计） |
| S9 最终批准 | 已批准（用户 2026-06-29「好的，没问题了」，ZHI-6 thread dc0b302c） |
| 批准证据 | 用户路线图 M13 原文 "dual-path heterologous" + 用户指令已对齐设计依据（非 S9 最终批准） |

---

### D4 — 两次 debate 门控，触发判断委托 debate 技能 Step 1

| 字段 | 内容 |
|------|------|
| 决策内容 | debate 设两次门控：Gate1 在 S5 三角度盲审后，Gate2 在 S7 orchestrator 审查后。make-decision 不内联判断 `blocking > 2`、方向分歧或 `debate_triggered_invalid`；它只做 skip 开关、debate 路径检查、提取 artifact 来源 finding ID 列表（可为空）、传入 debate 技能 + Claude 决策 + decision-log 版本，并读回裁决书。是否触发、无有效争点时如何跳过、以及 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1/0` 对应五方法庭/单人三档，均由 `/Users/Hugh/Hugh/Project/debate` 技能 Step 1 自判。红线：make-decision 禁止在审查前或审查外自行制造争点。 |
| 理由 | debate 技能已经封装触发判断和模式选择；make-decision 重复内联门槛会造成两套规则漂移。两次调用点仍分别保护方向阶段和细节阶段，但判断权归 debate，make-decision 只保持薄编排。 |
| 备选项 | make-decision 内联 `blocking > 2`/方向分歧门槛（已废弃，R3 复审要求移除）；仅一次 debate（缺细节阶段保护）；debate 仅用于收敛（压制新想法） |
| 来源类型 | 衍生 |
| 来源证据 | 用户 2026-06-29 指出 debate 技能在 `/Users/Hugh/Hugh/Project/debate`，能否 debate 应由该技能内部判断；codex verify-code R3 复审通过：`specs/m13-make-decision-v1/reviews/codex-verify-code-r3/verdict.md`；最终实现：`workflows/make-decision/SKILL.md` S5/S7 debate 门控。 |
| 设计依据已确认 | 是（用户已对齐流程/分类/触发条件设计） |
| S9 最终批准 | 已批准（用户 2026-06-29「好的，没问题了」，ZHI-6 thread dc0b302c） |
| 批准证据 | 用户确认按 debate 技能委托方案修复；verify-code R3 `VERDICT: pass`。 |

---

### D5 — Env var 设计：全部可选+安全默认+降级

| 字段 | 内容 |
|------|------|
| 决策内容 | 引入六个 env var，全部可选+安全默认+降级：CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS（debate五方法庭，缺失降级单人三档）、MAKE_DECISION_DEBATE_PATH（debate路径，默认/Users/Hugh/Hugh/Project/debate）、MAKE_DECISION_SKIP_DEBATE（强制跳过，调试用）、THIRD_REVIEW_RUNNER（3rd-review runner命令）、REVIEW_DISPATCH_CONFIG（dispatch配置路径）、MAKE_DECISION_SKIP_BLIND_REVIEW（跳过盲审，调试用）。不在 config/workflowhub.yaml 注册（保持注册表为纯组件路由表） |
| 理由 | workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断 |
| 备选项 | 在 config/workflowhub.yaml 新增业务 env 节（破坏注册表语义）；硬编码路径（不可覆盖） |
| 来源类型 | 衍生 |
| 来源证据 | `tasks/m13-make-decision-v1/research/env-var-design.md` §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则 |
| 设计依据已确认 | 是（用户已对齐流程/分类/触发条件设计） |
| S9 最终批准 | 已批准（用户 2026-06-29「好的，没问题了」，ZHI-6 thread dc0b302c） |
| 批准证据 | env-var-design.md 已对齐设计依据（非 S9 最终批准） |

---

### D6 — 横切质量机制（台账D28/方向基线/输入隔离/防漏阀/回退判定等）全部记录态非 blocking，唯一 hard gate = S9

| 字段 | 内容 |
|------|------|
| 决策内容 | 以下机制贯穿全流程，均为记录态非 blocking：原始需求台账D28（已覆盖/待处理/已丢弃带理由，无静默踢出，丢弃必须有理由）；方向基线确认（S4 talk#2后S5前，记录态软衔接点；未确认会提示但不机器阻断；唯一机器硬门=S9）；三角度输入隔离硬约束（framing只喂原始需求明文禁含拟定方向）；防漏阀留痕（blocking级反对→必须留痕格式：反对 X：/决定 Y：/理由 Z：，缺失阻断落盘标记）；新想法回退判定D15（动摇方向新想法→判回退点→告知→确认后重跑）；双路返空即停；交互简洁≤4选项。唯一 hard gate = S9 用户明确批准「同意」 |
| 理由 | 宪法 D5 "记录事实而非阻断"；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃 |
| 备选项 | 每个机制都做机器 blocking gate（违反 D5）；不做台账（需求可被静默丢弃） |
| 来源类型 | 原文要求 |
| 来源证据 | `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md` §横切质量机制表；原始 intake.md D28台账/方向基线确认衔接点/三角度输入隔离/防漏阀留痕/新想法回退判定D15/双路返空即停/交互简洁各条；CONSTITUTION.md D5 非阻断原则 |
| 设计依据已确认 | 是（用户已对齐流程/分类/触发条件设计） |
| S9 最终批准 | 已批准（用户 2026-06-29「好的，没问题了」，ZHI-6 thread dc0b302c） |
| 批准证据 | 流程对齐文档已对齐设计依据；CONSTITUTION 原则一致（非 S9 最终批准） |

---

## 4. 假设

- [ASSUMPTION] workflowhub 无既有业务 env-var 惯例（config/workflowhub.yaml 为纯静态路由注册表），M13 引入的 env var 不破坏现有惯例。
- [ASSUMPTION] debate 外部 repo 路径 `/Users/Hugh/Hugh/Project/debate` 在执行环境可访问；不可访问时 MAKE_DECISION_DEBATE_PATH 可覆盖，debate action 记录 skip 原因后继续。
- [ASSUMPTION] muyu-search-mcp 存在参数坑（extra_sources 默认=0 导致纯 LLM 幻觉），须在调用时硬传 extra_sources>=3 并后置 get_sources 验证；编排层负责此约束，不改 skill 本体。
- [ASSUMPTION] historical-lessons-used 字段按需记录，不强制，不做格式校验阻断推进（M13 沿用 D22 结论）。

---

## 5. 明确不做

- **不引阻断 gate（除 S9 人确认）**：盲审/debate/grill 结果均写入 decision-log 后继续，不做机器 blocking gate，不自审自判（宪法 D5）。
- **historical-lessons-used 非强制**：字段可选，不做格式校验，缺省不阻断。
- **不照搬 agenthub route-review.mjs 作为双路调研来源**：route-review.mjs 是内部路由工具，不是外部调研 skill；双路调研来源已纠正为 muyu-search-mcp + anysearch。
- **不修改 build-spec / build-plan / build-code / verify-code 行为**：M13 只深化 make-decision，不动下游阶段。
- **不在 config/workflowhub.yaml 注册 env-var**：保持注册表为纯组件路由表，env 检测在 SKILL.md 入口处理。
- **clarify-lite 不创建独立 SKILL.md**：M13 流程重新对齐后，clarify 功能已融入 S0 背景扎根和 S2 talk#1，不单独拎出 clarify-lite 步骤（YAGNI）。

---

## 6. 开放问题

- **OPEN-2**：S7 intake-review-orchestrator 在 M13 适配时，framing-challenge 已在 S5 前置跑，orchestrator 本步不重复跑 framing——此接线细节待 SKILL.md 实现时确认。

---

## 7. 验收标准

以下均为可证伪标准，缺任一视为 M13 失败：

1. **五类动作全部可跑**：make-decision 执行后能产出内部调研汇总、盲审三角度结果（各角度独立落盘）、grill 压测记录、debate 裁决（或降级记录）、落盘 decision-log——缺任一类判定失败。
2. **debate 登记 reuse-registry**：`reuse-registry.md` 中 debate（源 /Users/Hugh/Hugh/Project/debate）以 category + source path 形式登记；缺登即失败。
3. **各动作可异源审查**：盲审三角度均走 3rd-review 异源链，非裸派子代理；可由独立 reviewer 验证。
4. **指标记录完整**：make-decision stage 完成后，`tasks/m13-make-decision-v1/task-metrics.jsonl` 中存在对应 execution_id 记录（skill_or_stage=make-decision）；无记录即失败。
5. **台账无静默踢出**：全流程台账 D28 中任何「已丢弃」条目均带驳回理由；存在无理由丢弃项即失败。
6. **唯一 hard gate 可验证**：S9 必须有用户明确说「同意」的批准记录，缺失不得落盘正式 decision-log。
