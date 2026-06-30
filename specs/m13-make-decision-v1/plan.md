# 实施计划：m13-make-decision-v1

**Task ID**: `m13-make-decision-v1` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/m13-make-decision-v1/spec.md`
**Status**: Draft

---

## 概述

将 `skills/make-decision/SKILL.md` 从 M7 的两步骤（scope-triage + decision-log）全面重写为带五类护城河动作的 12 步流程（S0、S0.5、S1–S10）。新增：S0 背景扎根、S0.5 scope-triage(分档 lite/full)、S1 内部调研（full档专属）、S2/S4/S7 三轮 talk 交互、S3 双路外部调研、S5 三角度异源盲审+第一次debate门控、S6 展示盲审/debate结果给用户、S7 talk#3→grill→draft→orchestrator→第二次debate门控、S8 台账渲染、S9 用户批准（唯一硬门）、S10 decision-log 落盘。所有步骤均为记录态非阻断，S9 是唯一强制等待点。

---

## Technical Context

**Language/Version**: Markdown (SKILL.md 剧本文件), Node.js v20（metrics/collector.mjs）
**Primary Dependencies**: 外部 skill `debate`（路径 `MAKE_DECISION_DEBATE_PATH`，可降级）；`3rd-review` skill（异源盲审链）；`grill-with-docs-lite` shell
**Storage**: Filesystem — `skills/make-decision/SKILL.md`（核心产物）；`tasks/{task-id}/artifacts/`（运行时产物）；`tasks/{task-id}/research/`（调研产物）；`tasks/{task-id}/journal.json`（事件流）
**Testing**: dogfooding — workflowhub 自身 M13 任务跑一遍完整流程
**Target Platform**: workflowhub 执行环境（Claude Code / Multica agent）
**Performance Goals**: N/A（编排剧本，无性能要求）
**Constraints**: 不改下游阶段文件（build-spec/build-plan/build-code/verify-code）；不引入阻断式 gate（S9 以外）；env var 不进 config/workflowhub.yaml 注册表
**Scale/Scope**: 1 核心文件全面重写（`skills/make-decision/SKILL.md`）；可能微调 `reuse-registry.md`（debate 依赖登记）

---

## Constitution Check

所有 21 条逐条检查，条款名称严格使用 `constitution-checklist.md` 原名，判据引用本计划实际设计决策。[x] 仅表示该条款已核且符合；不符合时写 [ ] 加事实理由，不改条款名。

| 条款 | 状态 | 判据 |
|------|------|------|
| **F1 薄核心** | [x] | make-decision 核心只做 12 步调度编排，重活（调研/盲审/grill/debate）全部下沉到独立 sub-skill / sub-agent。SKILL.md 本身是剧本，不含业务逻辑实现。|
| **F2 窄契约** | [x] | 各步骤间走明确的 artifact 文件接口（internal-research-summary.md / 盲审 findings / decision-log-draft.md）；每步只暴露输出路径，不暴露内部执行细节。|
| **F3 物理事实靠机器校验但不阻断** | [x] | 所有 journal 事件（s1_all_agents_failed、debate_1: skipped、s9_user_approved 等）机器客观写入，不阻断流程推进。仅记录事实，供人审查。|
| **F4 质量靠异源审查与人而非阻断式质量门** | [x] | 盲审（S5 三角度异源 3rd-review）、debate（S5/S7 门控）、S9 用户确认均为质量机制；无任何自动化阻断 gate（S9 唯一硬门且需人确认）。|
| **F5 gate谨慎添加出事再补无用则移除** | [x] | 全流程仅 S9 一个 gate（人工确认），其余检查点均为记录态非阻断；F10 Gate 章节对每个机制逐条过四问，零冗余机制。|
| **F6 统一外置执行记录** | [x] | journal.json 统一外置记录所有执行事件（s0_context_loaded / s9_user_approved 等）；metrics 通过 collector.mjs recordSkeleton/updateOwnResult 统一上报，不散落在各步骤内部。|
| **F7 推进与不可逆操作不自动越过人** | [x] | decision-log 落盘（S10）唯一不可逆操作，须经 S9 用户明确批准（`s9_user_approved: true`）后方可执行；S9 无限等待，不得自动通过。|
| **F8 简单优先** | [x] | 流程结构线性 12 步，无树状分支复杂度；debate 可选且可降级；sub-skill 调用复用已有 3rd-review/grill-with-docs-lite，无新基础设施。|
| **F9 可证伪不假绿** | [x] | S9 等待用户"同意"时无限等待、不得自动通过；若跳过 S9 直接到 S10 视为错误——检查在"实际为假"时真报失败；双路均空写 dual_research_empty 不合成虚假摘要。|
| **F10 自动化按真实收益添加不为机器可校验本身堆基建** | [x] | 见下方 F10 Gate 章节，15 个机制全部过四问，无冗余自动化机制被引入；journal/metrics 记录对应真实可追溯收益。|
| **Q1 记事实而非阻断** | [x] | 所有失败/跳过路径（s1_all_agents_failed、debate_1: skipped、debate_triggered_invalid 等）均记录事实到 journal，继续推进，不阻断。|
| **Q2 gate三类划分(入口校验/记录采集/人工确认,S9唯一硬门)** | [x] | S9 是唯一人工确认硬门；journal 写入属记录采集；muyu get_sources 校验属入口校验（失败停下等人，不自动降级）；无其他阻断 gate。|
| **Q3 异源审查加人工把关** | [x] | 盲审走异源 3rd-review 链（D3 决策），三角度 source_family 两两不同，确保独立性；debate 触发须基于已存在 artifact finding ID（D4，FR-DEBATE-01 §禁止行为），禁止自审自判；S9 加人工把关。|
| **S1 能用外部就不造轮子** | [x] | 盲审复用 3rd-review 链、grill 复用 grill-with-docs-lite、debate 复用外部 repo，无新基础设施；metrics 复用 collector.mjs。|
| **S2 外部技能可针对项目改造合宪** | [x] | 3rd-review 链通过 THIRD_REVIEW_RUNNER / REVIEW_DISPATCH_CONFIG env var 针对项目配置，不改 skill 本体；debate 通过 MAKE_DECISION_DEBATE_PATH 配置路径。|
| **S3 迭代时保持最新并就地检查** | [x] | S0 背景扎根步骤读取当前 CONTEXT.md / decision-log / artifacts 建立基线，就地检查最新状态；不假设 M7 旧状态有效。|
| **S4 自定义技能必须有指标系统** | [x] | SKILL.md 最前置调用 recordSkeleton，S10 调用 updateOwnResult，传入 M4 10 个核心字段（execution_id/skill_or_stage/stage/skill_version/executed/tokens/duration_ms/rework_rounds/human_intervention/friction_ref）；业务字段放扩展字段。|
| **S5 自定义技能方便子代理调用省主上下文** | [x] | SKILL.md 只依赖 task-id 参数和 env var，不绑死任何 workflowhub 内部状态；子代理可独立调用，主上下文无需持有执行细节。|
| **S6 自定义技能参考市面方案不闭门造车** | [x] | 盲审参考 3rd-review 市面链路；grill 参考 grill-with-docs-lite；debate 参考外部 /Users/Hugh/Hugh/Project/debate；reuse-registry 登记依赖（FR-DEBATE-03）。|
| **S7 一阶段一技能一工作流一文件夹** | [x] | make-decision 阶段唯一核心文件 `skills/make-decision/SKILL.md`，在 skills/make-decision/ 文件夹，一阶段一技能，符合目录约定。|
| **S8 自定义技能可独立调用可搬运** | [x] | S8 步骤职责：同步 CONTEXT.md / ADR / project-memory（FR-FLOW-01 S8），并完成台账渲染点②（FR-LEDGER-01）。SKILL.md 整体只依赖 task-id 和 env var，可在独立环境 dogfooding 触发，可搬运。|

**Constitution Check Result**: 21/21 条按真实清单原名逐条核查，判据引用本计划实际设计决策。

---

## Project Structure

### Documentation (this feature)

```text
specs/m13-make-decision-v1/
├── spec.md              Build-spec 权威输入 (UNCHANGED)
├── plan.md              本文件 (NEW)
├── tasks.md             spec-tasks 产出 (NEW)
└── cross-artifact-analysis.md  spec-analyze 产出 (NEW)
```

### Source Code (repository root)

```text
skills/make-decision/
└── SKILL.md             核心剧本 (MODIFY - 全面重写)

reuse-registry.md        debate 外部 skill 依赖登记 (MODIFY - 追加一行)
```

**Structure Decision**: 只改 `skills/make-decision/SKILL.md`（核心产物），符合 S6 核心零改动原则。`reuse-registry.md` 追加一行是 F9/S4 强制要求，最小改动。

---

## Complexity Tracking

> WHY: 12 步流程相比 M7 两步骤显著增加，因护城河动作（盲审/debate/grill）本身需要多步编排。
> TRADEOFF: 剧本更长，维护成本增加。
> JUSTIFICATION: 每步均为线性顺序，无分支嵌套；所有复杂动作下沉到独立 sub-skill，SKILL.md 只做调度。复杂度增量对应护城河价值。

---

## Implementation Steps

### Phase 1: 基础骨架与环境变量（FR-FLOW-01, FR-ENV-01, FR-ENV-02）

**Step 1.1 — 读 M7 现有 SKILL.md，确认改动基线**
- 文件：`skills/make-decision/SKILL.md`（读）
- FR 映射：FR-FLOW-01（了解现有两步骤），FR-ENV-01（识别现有 env var）
- 动作：记录现有 scope-triage + decision-log 结构，作为重写基线

**Step 1.2 — 写入新 SKILL.md frontmatter + 6 个 env var 声明**
- 文件：`skills/make-decision/SKILL.md`（MODIFY）
- FR 映射：FR-ENV-01（6 个 env var：`MAKE_DECISION_DEBATE_PATH`、`MAKE_DECISION_SKIP_DEBATE`、`MAKE_DECISION_SKIP_BLIND_REVIEW`、`THIRD_REVIEW_RUNNER`、`REVIEW_DISPATCH_CONFIG`、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`），FR-ENV-02（不进 config 注册表）
- 验收：frontmatter 含 version/description；6 个 env var 有默认值和说明

**Step 1.3 — 登记 debate 外部 skill 到 reuse-registry.md**
- 文件：`reuse-registry.md`（MODIFY，追加一行）
- FR 映射：FR-DEBATE-03（reuse-registry 登记）
- 验收：reuse-registry 含 debate skill 条目，含路径变量说明

**Step 1.4 — stage start: 调用 recordSkeleton**
- FR 映射：FR-METRIC-01（make-decision 阶段开始记录 skeleton）
- 动作：在 SKILL.md 最前置执行步骤写入"调用 `metrics/collector.mjs recordSkeleton`"指令；写失败 warn 不 throw，不阻断流程

---

### Phase 2: 核心 12 步流程实现（FR-FLOW-01 全部 12 子步骤，FR-FLOW-02 lite/full 分档）

**Step 2.1 — S0 背景扎根**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-FLOW-01（S0）
- 动作：读取现有 CONTEXT.md / decision-log / 相关 artifacts，建立背景基线；写 journal 事件 `s0_context_loaded`

**Step 2.2 — S0.5 scope-triage（lite/full 分档，移植 M7 逻辑）**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-FLOW-01（S0.5），FR-FLOW-02（lite/full 分档）
- 动作：按 scope-triage 逻辑判定 lite 或 full 档；journal 写入 `s0_5_scope: lite|full`；lite 档仅跳过 S1 内部调研和 S3 外部调研（各记 `skipped: scope=lite`），S2 talk#1 以空内部调研上下文进入，S4–S10 正常执行

**Step 2.3 — S1 内部调研（full 档专属）**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-RESEARCH-00（≥3 sub-agents 并发，五类内容，internal-research-summary.md）
- 验收：sub-agent 失败记录继续；全失败记 `s1_all_agents_failed: true` 继续到 S2

**Step 2.4 — S2 talk#1（呈现内部调研摘要，问 Q1 外部调研需求）**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-TALK-01（一次一问），FR-TALK-02（按影响排序）
- 动作：呈现内部调研摘要；仅问一个问题（是否需要外部双路调研）；用户回答触发 S3 或 journal 记 `s3: skipped(user_decision)` 后进 S4

**Step 2.5 — S3 双路外部调研（条件触发）**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-RESEARCH-01（muyu-search-mcp，`extra_sources >= 3`），FR-RESEARCH-02（anysearch），FR-RESEARCH-03（双路返空处理）
- 动作：
  - muyu 调用必须传 `extra_sources >= 3`
  - 调用后必须执行 `get_sources` 校验；`get_sources` 无法核实时立即停下等用户指令，不得自动降级
  - 单路返空：记录该路 skip，另路有效则继续
  - **双路均空即停**：muyu 和 anysearch 两路结果均为空时，立即停止流程，向用户报告双路均空，等待用户明确指令（继续/重试/中止），记录 `dual_research_empty: true` 到 `artifacts/make-decision-background-research.md`，不得合成任何摘要
- 验收：双路并发；muyu 无来源失败停下等指令；双路均空立即停止等人

**Step 2.6 — S4 方向设计 + talk#2（非阻断，记录态）**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-ACCEPT-01（S4 方向基线），FR-TALK-01（talk#2）
- 动作：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认即继续）；渲染点①：写 `artifacts/make-decision-original-context.md`（原始需求逐条初始状态），此文件落盘后 S5 方可执行

**Step 2.7 — S5 三角度异源盲审 + 第一次 debate 门控**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-REVIEW-01（三角度），FR-REVIEW-02（3rd-review 链，输入隔离），FR-REVIEW-03（blocking 留痕），FR-DEBATE-01（触发条件），FR-DEBATE-04（降级）
- 依赖：`artifacts/make-decision-original-context.md` 已存在（渲染点①已落盘）
- 动作（盲审）：三角度并行走 3rd-review 链，三 agent 输入互不可见；每个审查结果含字段：`reviewer_runtime_id`、`reviewer_source`、`source_family`（三个 source_family 两两不同）、`fallback_used`、`input_hash`；产出含 `direction_divergence` 标记和 findings list
- **FR-REVIEW-03 blocking 留痕**：任一角度若含 `severity: blocking` 意见，必须用固定三行格式写入审查产物：
  ```
  反对 X：<反对内容>
  决定 Y：<决定内容>
  理由 Z：<理由内容>
  ```
  缺此三行则该角度审查视为留痕不完整，S10 落盘前须补全
- **fallback 失败语义**：任一角度出现 `fallback_used: true` 或 source_family 与其他角度相同时，该角度审查失败，结果不进合并，立即停下向用户报告，不得静默降级后继续合并
- 动作（debate 门控）：基于 findings 判定触发；无来源 ID 记 `debate_triggered_invalid: true`；触发则调用外部 debate，产出 `artifacts/make-decision-debate-1.md`；未触发记 `debate_1: skipped`；路径不可达降级并记原因

**Step 2.8 — S6 展示盲审/debate 结果给用户**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-FLOW-01（S6 独立步骤），FR-REVIEW-03（留痕可见）
- 动作：向用户展示三角度盲审 findings、direction_divergence 状态、debate 裁决结论或 skip 原因；记 journal 事件 `s6_results_shown`；不等确认，展示完即继续

**Step 2.9 — S7 talk#3 → grill-with-docs-lite → decision-log-draft → orchestrator → 第二次 debate**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-TALK-01（talk#3），FR-GRILL-01（grill 四件事退出条件），FR-DRAFT-01（7 节结构），FR-DEBATE-02（第二次 debate）
- 动作（严格按顺序）：
  1. talk#3：依赖 S5/S6 产物，按影响排序问 Q3
  2. grill-with-docs-lite：四件事退出条件（纯委托，不在此实现 grill 内部逻辑）；产出 `artifacts/make-decision-grill-with-docs.md`（grill 会话记录）；draft 正文须引用此文件路径
  3. decision-log-draft.md（7 节：原始需求/问题与目标/决策D1-D6/假设/明确不做/开放问题/验收标准）
  4. orchestrator 扫描 draft；含 blocking 则触发第二次 debate（结果 attach 到 draft 末尾 `## orchestrator-findings` 节，不覆盖正文）
- journal 事件：`s7_talk3_done`、`s7_grill_done`、`s7_draft_complete`、`debate_2_triggered/skipped`

**Step 2.10 — S8 台账渲染（渲染点②）+ 同步 CONTEXT**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-LEDGER-01（渲染点②），FR-LEDGER-02（禁静默丢弃），FR-LEDGER-03（新想法回退），S8 宪法条款（可搬运）
- 动作：
  1. 同步 `CONTEXT.md`、ADR、`project-memory.json`（若有变更则更新，不强制写入无内容变更）
  2. 渲染点②（S7 后）逐条标注台账，丢弃条目含驳回理由；新想法有回退路径（超出当前 task 范围的新想法须记录到新 task 候选列表，不得自动扩大当前 task 范围，候选列表可为空列表）；无"状态未知"条目
- 验收：台账渲染产物存在；无状态未知条目；新 task 候选列表已产出（可为空列表）；CONTEXT 同步事件写入 journal（`s8_context_synced` 或 `s8_context_no_change`）
- 注：渲染点①已在 Step 2.6（S4 后）完成

**Step 2.11 — S9 用户批准（唯一硬门）**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-ACCEPT-02（S9 唯一强制确认，无限等待），FR-ACCEPT-03（台账逐条核对）
- 验收：展示完整决策摘要 + 台账；用户确认前不得落盘；journal 记 `s9_user_approved: true`

**Step 2.12 — S10 decision-log 落盘 + stage end: updateOwnResult**
- 文件：`skills/make-decision/SKILL.md`
- FR 映射：FR-FLOW-01（S10），FR-METRIC-01（metrics）
- 动作：
  - 写 `tasks/{task-id}/decision-log.md`（7 节结构），`user_decision: true`
  - 调用 `metrics/collector.mjs updateOwnResult`，写 M4 十个核心字段（`execution_id`、`skill_or_stage`、`stage`、`skill_version`、`executed`、`tokens`、`duration_ms`、`rework_rounds`、`human_intervention`、`friction_ref`）；业务字段（user_decision、s9_approved、debate_triggered 等）放扩展字段/facts；写失败 warn 不 throw

---

### Phase 3: 验收与 dogfooding（FR-FLOW-01 AC, FR-ACCEPT-01/02/03 AC）

**Step 3.1 — Scope Boundary Verification + dogfooding 验证**
- 确认未改动文件清单：`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`config/workflowhub.yaml`
- FR 映射：FR-SCOPE-01（不改下游阶段文件）；FR-ACCEPT-01/02/03 AC；验收信号

---

### Scope Boundary Verification

**禁止触碰的文件/路径**：
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `config/workflowhub.yaml`（env var 不进注册表，FR-ENV-02）
- 任何下游阶段产物

---

## F10 Anti-Over-Engineering Gate

逐条过四问：

| 机制 | Q1 真实威胁 | Q2 已有覆盖？ | Q3 可绕过？ | Q4 维护成本 | 裁决 |
|------|------------|--------------|------------|------------|------|
| S1 ≥3 sub-agents 并发调研 | 单点推理覆盖盲区，历史先例/生态最佳实践缺失 | 无（M7 无调研步骤） | 可跳过（lite 档不触发），非机器门 | 极低（行为规范） | **保留** |
| S1 失败记录继续 | sub-agent 失败导致全流程阻断 | 无 | N/A（本身即降级路径） | 极低 | **保留** |
| S3 双路外部调研（muyu-search-mcp + anysearch） | 单路调研偏差，缺异源对照 | 无外部调研机制 | 条件触发，用户控制 | 低 | **保留** |
| S3 muyu get_sources 校验 | muyu 无来源时静默返回空结果误导决策 | 无 | 校验失败停下等人，不可自动绕过 | 极低（一次调用） | **保留** |
| S5 三角度异源盲审（3rd-review） | 同源审查失去独立性，agenthub 曾直接观察到此失败 | 3rd-review 链已有独立性护栏 | 可降级，但降级破坏盲审价值 | 低（复用已有 skill） | **保留** |
| S5/S7 debate 门控（条件触发） | 方向级分歧或 blocking 无裁决机制 | 无（M7 无 debate） | 触发条件严格（来源 ID 必须存在），不自造争点 | 低（外部 repo，可降级） | **保留** |
| FR-DEBATE-03 reuse-registry 登记 | 外部 skill 依赖不可追踪 | reuse-registry.md 已有惯例 | 一行条目，低绕过风险 | 极低 | **保留** |
| FR-DEBATE-04 debate 降级 | 路径不可达是真实运营风险 | 无降级机制 | N/A（本身即降级路径） | 低 | **保留** |
| FR-TALK-01/02 三轮结构，一次一问 | 批量提问抑制对话收敛 | 无 | 行为规范，无机器强制 | 低 | **保留** |
| FR-GRILL-01 grill 四件事退出条件（纯委托） | 用户未理解范围即过早退出 | 无 | 行为规范，grill 内部逻辑由 grill-with-docs-lite 实现 | 低 | **保留** |
| FR-LEDGER-01/02/03 台账两渲染点 | 需求静默丢弃（D28，agenthub 失败直接观察） | 无 | 可绕但义务文档化 | 低（artifact 写入） | **保留** |
| FR-ACCEPT-01 S4 方向基线记录（非阻断） | 带错方向进入高成本盲审 | 无 S5 前检查点 | 可跳过（非代码门），记录态继续 | 低 | **保留** |
| FR-ENV-01/02 6 个 env var | 功能开关无覆盖机制；硬编码路径僵化 | 无 override 机制 | 覆盖时需设 env var | 极低 | **保留** |
| FR-METRIC-01 journal 事件流 + recordSkeleton/updateOwnResult | 步骤执行无追踪，无法复盘 | 无 | 可部分遗漏，但属记录义务 | 极低（每步追加写入） | **保留** |
| FR-DRAFT-01 decision-log-draft.md 7 节 | S10 落盘前无人可审草稿 | 无草稿机制 | 可跳过，但跳过破坏 orchestrator 扫描基础 | 极低 | **保留** |

**F10 结论**：15 个机制全部通过四问，零条目被删除。无冗余自动化机制。

---

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|------|-------------|----------------|
| Step 1.1 读现有 SKILL.md | FR-FLOW-01, FR-ENV-01 | baseline 已确认 |
| Step 1.2 写 frontmatter + 6 env var | FR-ENV-01, FR-ENV-02 | 6 个 env var（DEBATE_PATH/SKIP_DEBATE/SKIP_BLIND_REVIEW/THIRD_REVIEW_RUNNER/REVIEW_DISPATCH_CONFIG/CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS）含默认值和说明 |
| Step 1.3 reuse-registry 登记 | FR-DEBATE-03 | reuse-registry 含 debate 条目 |
| Step 1.4 recordSkeleton | FR-METRIC-01 | stage start 写 metrics skeleton；失败 warn 不 throw |
| Step 2.1 S0 背景扎根 | FR-FLOW-01(S0) | journal 有 `s0_context_loaded` 事件 |
| Step 2.2 S0.5 scope-triage lite/full | FR-FLOW-01(S0.5), FR-FLOW-02 | journal 有 `s0_5_scope: lite\|full`；lite 档各跳过步有 skip 事件 |
| Step 2.3 S1 内部调研 | FR-RESEARCH-00 | internal-research-summary.md 存在；全失败记 `s1_all_agents_failed` 继续 |
| Step 2.4 S2 talk#1 | FR-TALK-01, FR-TALK-02 | 仅问一问；用户回答触发 S3 或记 skip |
| Step 2.5 S3 双路调研 | FR-RESEARCH-01/02/03 | muyu 传 extra_sources>=3；get_sources 失败停下；双路均空立即停止等人 |
| Step 2.6 S4 + talk#2 + 渲染点① | FR-ACCEPT-01, FR-TALK-01, FR-LEDGER-01 | `s4_baseline_recorded: true`（非阻断）；original-context.md 在 S5 前落盘 |
| Step 2.7 S5 盲审+debate门控 | FR-REVIEW-01/02/03, FR-DEBATE-01/04 | 三审 source_family 两两不同；含 reviewer_runtime_id/reviewer_source/fallback_used/input_hash；blocking 反对有三行留痕；fallback/source_family 冲突停下报告不进合并；debate 触发/skip 均有 journal 记录 |
| Step 2.8 S6 展示结果 | FR-FLOW-01(S6), FR-REVIEW-03 | journal 有 `s6_results_shown`；用户可见盲审+debate 结论 |
| Step 2.9 S7 talk#3+grill+draft+debate2 | FR-TALK-01, FR-GRILL-01, FR-DRAFT-01, FR-DEBATE-02 | 顺序 talk#3→grill→draft→orchestrator→debate2；grill 产出 make-decision-grill-with-docs.md；draft 7 节存在且引用 grill 路径；debate2 attach 不覆盖 |
| Step 2.10 S8 台账渲染点②+CONTEXT同步 | FR-LEDGER-01/02/03, S8宪法 | 两渲染产物均存在；无状态未知条目；丢弃条目含驳回理由；journal 有 s8_context_synced 或 s8_context_no_change |
| Step 2.11 S9 用户批准 | FR-ACCEPT-02, FR-ACCEPT-03 | `s9_user_approved: true`；台账逐条展示；不得自动通过 |
| Step 2.12 S10 落盘 + updateOwnResult | FR-FLOW-01(S10), FR-METRIC-01 | decision-log.md 7 节；`user_decision: true`；M4 十核心字段（execution_id/skill_or_stage/stage/skill_version/executed/tokens/duration_ms/rework_rounds/human_intervention/friction_ref）写入 metrics；失败 warn 不 throw |
| Step 3.1 scope boundary + dogfooding | spec §14, FR-ACCEPT-01/02/03 AC | 禁止文件未被改动；五类护城河均可触发并留产物 |

---

## M10 Baseline Comparison

| 指标名 | M13 实值 | M10 baseline | delta |
|--------|---------|-------------|-------|
| missed_step_rate | unknown（M13 build-plan 阶段无执行记录，需 build-code/verify-code 完成后由 journal 统计） | 0.05 | unknown |
| test_execution_rate | unknown（M13 无测试用例执行记录，dogfooding 尚未完成） | 0.8295 | unknown |
| review_execution_rate | unknown（build-code 尚未开始，审查执行率需 verify-code 阶段记录） | 1 | unknown |
| rework_rounds | unknown（M13 无 journal 事件流记录返工轮次，无执行历史可算） | 6.075 | unknown |
| rework_proxy_count | unknown（M13 无执行历史 commit/diff 记录，需 build-code 实际执行后统计） | 25.25 | unknown |

> 注：五项实值均为 unknown，原因是 M13 build-plan 阶段结束时上游仅有 make-decision + build-spec 两个 stage-result，不含任何运行时执行数据。不得使用占位值（0、-、--）。

> **模板注**：build-plan 剧本硬编列名"M12 实值"为模板遗留，本 plan 用"M13 实值"语义正确，已浮现供后续剧本泛化清理，不改剧本。
