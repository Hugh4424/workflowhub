# 任务列表：m13-make-decision-v1

**Task ID**: `m13-make-decision-v1` | **Date**: 2026-06-29
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)
**Total Tasks**: 19 | **Stages**: 6

---

## 概览

| Stage | 主题 | Tasks |
|-------|------|-------|
| Stage 1 | 读现有实现，确认改动基线 | T001 |
| Stage 2 | SKILL.md 骨架 + env var + reuse-registry + recordSkeleton | T002, T003, T004 |
| Stage 3 | S0 背景扎根 / S0.5 scope-triage / S1–S4 核心流程 | T005, T006, T007, T008, T009, T010 |
| Stage 4 | S5–S7 护城河动作（盲审 / 展示 / talk#3 / grill / draft / debate） | T011, T012, T013 |
| Stage 5 | S8–S10 台账 / 用户批准 / 落盘 + journal 完整性 | T014, T015, T016, T017 |
| Stage 6 | Scope boundary + dogfooding 验收 | T018, T019 |

---

## Stage 1

### T001：读现有 skills/make-decision/SKILL.md，确认 M7 基线
- **FR 映射**：FR-FLOW-01（了解现有两步骤 scope-triage + decision-log）
- **依赖**：无
- `(stage:1, depends:无)`
- **输入**：`skills/make-decision/SKILL.md`（现有文件）
- **输出**：基线笔记（内部，不落盘产物）
- **完成条件**：已记录现有步骤结构、env var 现状、artifacts 路径约定

---

## Stage 2

### T002：写入 SKILL.md 新 frontmatter + 6 个 env var 声明
- **FR 映射**：FR-ENV-01（6 个 env var：`MAKE_DECISION_DEBATE_PATH`、`MAKE_DECISION_SKIP_DEBATE`、`MAKE_DECISION_SKIP_BLIND_REVIEW`、`THIRD_REVIEW_RUNNER`、`REVIEW_DISPATCH_CONFIG`、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`），FR-ENV-02（不进 config/workflowhub.yaml 注册表）
- **依赖**：T001
- `(stage:2, depends:T001)`
- **输入**：M7 基线（T001）
- **输出**：`skills/make-decision/SKILL.md`（frontmatter 节 + env var 节写入）
- **完成条件**：frontmatter 含 name/version/description；6 个 env var 各含默认值、说明、override 方式；无任何 config/workflowhub.yaml 写入

### T003：登记 debate 外部 skill 到 reuse-registry.md
- **FR 映射**：FR-DEBATE-03（reuse-registry 登记外部 debate skill 依赖）
- **依赖**：T002
- `(stage:2, depends:T002)`
- **输入**：`reuse-registry.md`（现有文件）；`MAKE_DECISION_DEBATE_PATH` 默认路径
- **输出**：`reuse-registry.md`（追加一行 debate 条目）
- **完成条件**：reuse-registry.md 含 debate skill 条目，含路径变量名、默认路径、降级行为说明

### T004：stage start — 调用 recordSkeleton
- **FR 映射**：FR-METRIC-01（make-decision 阶段开始记录 metrics skeleton）
- **依赖**：T002
- `(stage:2, depends:T002)`
- **输入**：`skills/make-decision/SKILL.md`（frontmatter 已写入）
- **输出**：`skills/make-decision/SKILL.md`（最前置执行步骤写入 recordSkeleton 调用指令）
- **完成条件**：SKILL.md 最前置步骤明确写"调用 `metrics/collector.mjs recordSkeleton`"，传 M4 十核心字段（`execution_id`、`skill_or_stage`、`stage`、`skill_version`、`executed`、`tokens`、`duration_ms`、`rework_rounds`、`human_intervention`、`friction_ref`）；业务字段放 facts/扩展字段；写失败 warn 不 throw，不阻断流程

---

## Stage 3

### T005：实现 S0 背景扎根
- **FR 映射**：FR-FLOW-01（S0 背景扎根步骤）
- **依赖**：T002
- `(stage:3, depends:T002)`
- **输入**：现有 CONTEXT.md / 相关 decision-log / artifacts
- **输出**：`skills/make-decision/SKILL.md`（S0 节写入）
- **完成条件**：S0 读取现有背景文件建立基线；journal 写入 `s0_context_loaded` 事件

### T006：实现 S0.5 scope-triage（lite/full 分档）
- **FR 映射**：FR-FLOW-01（S0.5 scope-triage），FR-FLOW-02（lite/full 分档，删除 quick 档概念）
- **依赖**：T005
- `(stage:3, depends:T005)`
- **输入**：S0 背景基线
- **输出**：`skills/make-decision/SKILL.md`（S0.5 节写入）
- **完成条件**：按 scope-triage 逻辑判定 lite 或 full 档；journal 写入 `s0_5_scope: lite|full`；lite 档仅跳过 S1 内部调研和 S3 外部调研（各记 `skipped: scope=lite`）；S2 talk#1 以空内部调研上下文进入；S4–S10 正常执行；无 quick 档概念

### T007：实现 S1 内部调研（full 档专属）
- **FR 映射**：FR-RESEARCH-00（≥3 sub-agents 并发，五类内容，internal-research-summary.md，失败处理）
- **依赖**：T006
- `(stage:3, depends:T006)`
- **输入**：S0.5 判定为 full 档
- **输出**：`skills/make-decision/SKILL.md`（S1 节写入）；运行时产出 `tasks/{task-id}/research/internal-research-summary.md`
- **完成条件**：≥3 sub-agents 并发调研；五类内容覆盖；任一失败记录继续；全失败记 `s1_all_agents_failed: true` 继续到 S2

### T008：实现 S2 talk#1（呈现内部调研摘要 + 问 Q1 外部调研需求）
- **FR 映射**：FR-TALK-01（一次一问，三轮结构），FR-TALK-02（按影响排序）
- **依赖**：T007
- `(stage:3, depends:T007)`
- **输入**：`tasks/{task-id}/research/internal-research-summary.md`
- **输出**：`skills/make-decision/SKILL.md`（S2 节写入）
- **完成条件**：S2 先向用户呈现内部调研摘要；仅提一个问题（是否需要外部双路调研）；用户回答后触发 S3 或 journal 记 `s3: skipped(user_decision)` 进 S4

### T009：实现 S3 双路外部调研（条件触发）
- **FR 映射**：FR-RESEARCH-01（muyu-search-mcp，`extra_sources >= 3`），FR-RESEARCH-02（anysearch），FR-RESEARCH-03（双路返空处理）
- **依赖**：T008
- `(stage:3, depends:T008)`
- **输入**：S2 用户回答（需要外部调研）
- **输出**：`skills/make-decision/SKILL.md`（S3 节写入）；运行时产出 `tasks/{task-id}/research/external-research-*.md`；`tasks/{task-id}/artifacts/make-decision-background-research.md`（双路均空时）
- **完成条件**：
  - muyu 调用必须传 `extra_sources >= 3`
  - 调用后必须执行 `get_sources` 校验；`get_sources` 无法核实时立即停下等用户指令，不得自动降级
  - 单路返空：记录该路 skip，另路有效则继续
  - 双路均空：立即停止，向用户报告"双路调研均无结果"，等待用户明确"继续/重试/中止"指令；记 `artifacts/make-decision-background-research.md` 字段 `dual_research_empty: true`，不合成摘要，不得用 journal 字段替代 artifact 字段

### T010：实现 S4 方向设计 + talk#2 + 台账渲染点①（非阻断记录态）
- **FR 映射**：FR-ACCEPT-01（S4 方向基线，非阻断），FR-TALK-01（talk#2），FR-LEDGER-01（渲染点①：original-context.md 在 S4 后 S5 前落盘）
- **依赖**：T009
- `(stage:3, depends:T009)`
- **输入**：S3 产出（或 S3 skip 记录）
- **输出**：`skills/make-decision/SKILL.md`（S4 节写入）；运行时产出 `tasks/{task-id}/artifacts/make-decision-original-context.md`（渲染点①，S5 前必须存在）
- **完成条件**：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认直接继续）；渲染点①写入 `make-decision-original-context.md`（原始需求逐条初始状态）；S5 依赖此文件存在，T011 depends T010

---

## Stage 4

### T011：实现 S5 三角度异源盲审 + 第一次 debate 门控
- **FR 映射**：FR-REVIEW-01（三角度：intake-direction-review / intake-framing-challenge / intake-scope-review），FR-REVIEW-02（3rd-review 链，异源，输入隔离），FR-REVIEW-03（留痕字段），FR-DEBATE-01（触发条件，禁止无来源触发），FR-DEBATE-04（降级）
- **依赖**：T010
- `(stage:4, depends:T010)`
- **输入**：S4 产出；`tasks/{task-id}/artifacts/make-decision-original-context.md`（必须已存在）
- **输出**：`skills/make-decision/SKILL.md`（S5 节写入）；运行时产出三个盲审 findings artifact；`tasks/{task-id}/artifacts/make-decision-debate-1.md`（触发时）
- **完成条件**：
  - 三角度并行走独立 3rd-review 链，三 agent 输入互不可见（隔离）
  - 每个审查结果含字段：`reviewer_runtime_id`、`reviewer_source`、`source_family`（三个 source_family 两两不同）、`fallback_used`、`input_hash`
  - 产出含 `direction_divergence` 标记和 findings list
  - **blocking 留痕**：任一角度含 `severity: blocking` 意见，必须以固定三行格式写入审查产物：
    ```
    反对 X：<反对内容>
    决定 Y：<决定内容>
    理由 Z：<理由内容>
    ```
    缺此三行则该角度留痕不完整，S10 落盘前须补全
  - **fallback 失败语义**：任一角度出现 `fallback_used: true` 或 source_family 与其他角度相同时，该角度审查失败，结果不进合并，立即停下向用户报告，不得静默降级后继续合并
  - debate 门控：无来源 ID 记 `debate_triggered_invalid: true`；触发产出 `make-decision-debate-1.md`；未触发记 `debate_1: skipped`；路径不可达记原因降级继续

### T012：实现 S6 展示盲审/debate 结果给用户
- **FR 映射**：FR-FLOW-01（S6 独立展示步骤），FR-REVIEW-03（留痕可见）
- **依赖**：T011
- `(stage:4, depends:T011)`
- **输入**：S5 三角度盲审 findings；debate 裁决或 skip 记录
- **输出**：`skills/make-decision/SKILL.md`（S6 节写入）
- **完成条件**：向用户展示三角度盲审 findings 摘要、direction_divergence 状态、debate 裁决结论或 skip 原因；journal 记 `s6_results_shown`；不等确认，展示完即继续；S7 依赖 S6 产物

### T013：实现 S7 talk#3 → grill → draft → orchestrator → 第二次 debate
- **FR 映射**：FR-TALK-01（talk#3，依赖 S5/S6 产物），FR-GRILL-01（grill 四件事退出条件，纯委托），FR-DRAFT-01（decision-log-draft.md 7 节），FR-DEBATE-02（orchestrator blocking 触发二次 debate，attach 不覆盖）
- **依赖**：T012
- `(stage:4, depends:T012)`
- **输入**：S5/S6 产出（盲审结果 + debate 裁决）
- **输出**：`skills/make-decision/SKILL.md`（S7 节写入）；运行时产出 `tasks/{task-id}/artifacts/make-decision-decision-log-draft.md`；`tasks/{task-id}/artifacts/make-decision-grill-with-docs.md`（grill 会话记录）；`make-decision-debate-2.md`（触发时）
- **完成条件**：
  - 严格按顺序：talk#3 → grill-with-docs-lite → decision-log-draft → orchestrator 审查 → 第二次 debate（有 blocking 时）
  - talk#3：按影响排序问 Q3，依赖 S5/S6 产物；不得在 S7 之前执行
  - grill：四件事退出条件明确，纯委托给 grill-with-docs-lite（不在此实现 grill 内部逻辑）；产出 `artifacts/make-decision-grill-with-docs.md`
  - draft 含 7 节（原始需求/问题与目标/决策D1-D6/假设/明确不做/开放问题/验收标准）；draft 正文须引用 `make-decision-grill-with-docs.md` 路径
  - orchestrator 产出 blocking 时 debate-2 attach 到 draft 末尾 `## orchestrator-findings` 节，不覆盖正文
  - journal 事件：`s7_talk3_done`、`s7_grill_done`、`s7_draft_complete`、`debate_2_triggered/skipped`

---

## Stage 5

### T014：实现 S8 台账渲染点② + CONTEXT 同步
- **FR 映射**：FR-LEDGER-01（渲染点②：S7 后逐条渲染），FR-LEDGER-02（禁静默丢弃，丢弃条目含驳回理由），FR-LEDGER-03（新想法回退判定），S8 宪法条款（可搬运内容同步）
- **依赖**：T013
- `(stage:5, depends:T013)`
- **输入**：S7 产出；渲染点①产出（T010 已完成）
- **输出**：`skills/make-decision/SKILL.md`（S8 节写入）；运行时产出台账渲染文件（渲染点②）
- **完成条件**：
  - 同步 `CONTEXT.md`、ADR、`project-memory.json`（有内容变更时更新，无变更不强制写入）
  - journal 记 `s8_context_synced`（有更新）或 `s8_context_no_change`（无更新）
  - 渲染点②逐条标注台账；无"状态未知"条目；所有丢弃条目含驳回理由；新想法有回退路径；产出新 task 候选列表（可为空列表，FR-LEDGER-03）；新想法不得自动扩大当前 task 范围

### T015：实现 S9 用户批准（唯一硬门）
- **FR 映射**：FR-ACCEPT-02（S9 唯一强制确认，无限等待，不得自动通过），FR-ACCEPT-03（台账逐条核对）
- **依赖**：T014
- `(stage:5, depends:T014)`
- **输入**：台账渲染结果（T014）
- **输出**：`skills/make-decision/SKILL.md`（S9 节写入）
- **完成条件**：S9 展示完整决策摘要（方向/范围/关键约束/待办列表台账）；等待用户明确"同意"或等效确认；用户未确认时无限等待；journal 记 `s9_user_approved: true`；跳过 S9 直接到 S10 视为错误（明确写入 SKILL.md）

### T016：实现 S10 decision-log 落盘 + stage end updateOwnResult
- **FR 映射**：FR-FLOW-01（S10 步骤），FR-METRIC-01（metrics/collector.mjs updateOwnResult，10 核心字段）
- **依赖**：T015
- `(stage:5, depends:T015)`
- **输入**：S9 `s9_user_approved: true`；decision-log-draft.md 7 节
- **输出**：`skills/make-decision/SKILL.md`（S10 节写入）；运行时产出 `tasks/{task-id}/decision-log.md`（7 节，`user_decision: true`）
- **完成条件**：
  - 落盘前检查：若存在 `severity: blocking` 的审查意见但对应审查产物缺少三行留痕（反对 X：/决定 Y：/理由 Z：），不得标"落盘完整"，须先补全留痕
  - decision-log.md 7 节结构；`user_decision: true` 字段为真
  - 调用 `metrics/collector.mjs updateOwnResult`，写 M4 十核心字段（`execution_id`、`skill_or_stage`、`stage`、`skill_version`、`executed`、`tokens`、`duration_ms`、`rework_rounds`、`human_intervention`、`friction_ref`）；业务字段（user_decision、s9_approved、debate_triggered 等）放 facts/扩展字段；写失败 warn 不 throw

### T017：实现 journal 事件流完整性（S0–S10 全覆盖）
- **FR 映射**：FR-METRIC-01（每步写 journal 事件，格式统一）
- **依赖**：T005, T006, T007, T008, T009, T010, T011, T012, T013, T014, T015, T016
- `(stage:5, depends:T005,T006,T007,T008,T009,T010,T011,T012,T013,T014,T015,T016)`
- **输入**：S0–S10 全部节已写入 SKILL.md
- **输出**：`skills/make-decision/SKILL.md`（journal 规范节补充）；运行时产出 `tasks/{task-id}/journal.json`
- **完成条件**：每个步骤 S0–S10 在 SKILL.md 中均有明确 journal 写入指令；事件 key 格式统一（`s{N}_{event}` 形式）；lite 档跳过的 S1/S3 均有对应 `skipped: scope=lite` journal 事件

---

## Stage 6

### T018：Scope boundary 核查（验收 FR-SCOPE-01）
- **FR 映射**：FR-SCOPE-01（不改下游阶段文件，scope boundary 可验收）；附带：FR-ACCEPT-01/02/03 验收条件逐条确认
- **依赖**：T017
- `(stage:6, depends:T017)`
- **输入**：`skills/make-decision/SKILL.md`（最终版）；下游阶段文件列表
- **输出**：核查记录（写入 SKILL.md 注释或 plan.md 附录）
- **完成条件**：确认 `workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`config/workflowhub.yaml` 均未被改动；FR-ACCEPT-01/02/03 验收条件逐条确认

### T019：dogfooding 验收（workflowhub 自身 M13 任务跑完整流程）
- **FR 映射**：FR-FLOW-01 AC（12 步流程全部可走通）；FR-FLOW-02 AC（lite/full 分档可触发）；验收信号（五类护城河均可独立触发并留产物）；FR-ACCEPT-02 AC（S9 S10 decision-log 落盘）
- **依赖**：T018
- `(stage:6, depends:T018)`
- **输入**：`skills/make-decision/SKILL.md`（最终版）
- **输出**：dogfooding 产出 artifacts（`tasks/m13-make-decision-v1/artifacts/` 下各产物）
- **完成条件**：五类护城河动作均触发一次并有可追溯产物；S9 用户批准后 decision-log 落盘；journal 有完整事件流；无 quick 档触发，仅 lite/full

---

## 依赖拓扑图

```
T001
 └─ T002
     ├─ T003 (stage 2)
     ├─ T004 (stage 2)
     └─ T005
         └─ T006
             └─ T007
                 └─ T008
                     └─ T009
                         └─ T010
                             └─ T011
                                 └─ T012
                                     └─ T013
                                         └─ T014
                                             └─ T015
                                                 └─ T016
                                                     └─ T017 (also depends T005..T016)
                                                         └─ T018
                                                             └─ T019
```
