# M11 vs M10 Baseline 对照报告

> 任务：m11-build-spec-v1
> M10 基线来源：`specs/archive/m10-baseline-switch/baseline-report.md`（4 个 agenthub task 的指标均值）
> M11 数据来源：`tasks/m11-build-spec-v1/task-metrics.jsonl`（当前 6 条 stage 记录：make-decision / scope-triage / decision-log / build-spec / build-plan / build-code，verify-code 待执行后会再加 1 条）
> 规则：记录事实，不阻断推进。算不准的诚实标注，不做假绿编数。

## 5 指标对照表

| Metric | M11 Actual | M10 Baseline | Direction Delta |
| ------ | ---------- | ------------ | --------------- |
| missed_step_rate | 0.2（近似，见注 1） | 0.05 | ↑ 变差 +0.15（方法论不同，见注 1） |
| test_execution_rate | unknown（见注 2） | 0.8295 | unknown |
| review_execution_rate | 0（见注 3） | 1 | ↓ 变差 -1（记录口径不同，见注 3） |
| rework_rounds | 6 | 6.075 | ↓ 略优 -0.075 |
| rework_proxy_count | unknown（见注 4） | 25.25 | unknown |

## 计算说明

### rework_rounds（M4 核心字段，可直接采集）

M11 各 stage 的 rework_rounds：
- make-decision: 0
- scope-triage: 0
- decision-log: 0
- build-spec: 1
- build-plan: 4
- build-code: 1

**M11 实值** = 0 + 0 + 0 + 1 + 4 + 1 = **6**（当前 6 条记录之和。verify-code 执行后若 rework_rounds=0，总量仍为 6）。

此指标在 M4 核心字段中直接存在，计算口径与 M10 一致（M10 的 rework_rounds 也是任务级别求和，4 个 agenthub task 的均值 6.075）。

### 注 1：missed_step_rate（近似值，方法论不同）

M10 定义：proxy from journal stage_enter/stage_exit —— 统计 journal 中 stage_enter 事件有记录但缺少对应 stage_exit 的比例。M10 的 4 个 agenthub task 使用 journal.jsonl 事件流，有完整的 step 级 enter/exit 配对追踪。

M11 现状：collector.mjs 产出的 task-metrics.jsonl 是 **stage 级别**记录，不包含 step 级的 enter/exit 事件。无法用同口径计算。

**近似值 0.2 的计算方式**：M4 五段工作流预期 5 个主 stage（make-decision / build-spec / build-plan / build-code / verify-code）。当前 task-metrics.jsonl 中 4 个主 stage 已执行（make-decision 含 scope-triage + decision-log 子阶段），verify-code 待执行。按"已执行 stage / 预期 stage"的口径：1 - 4/5 = 0.2。这是 stage 级完成度近似，非 M10 的 step 级 missed 算法。

**诚实标注**：方法论差异显著（stage 级 vs step 级、collector.mjs vs journal.jsonl），此值仅供参考。verify-code 执行后该值将变为 0（5/5 全量执行）。

### 注 2：test_execution_rate（无法计算）

M10 定义：weak_proxy from journal phase_pre_review events —— 统计 journal 中 phase_pre_review 事件的发生比例。

M11 现状：task-metrics.jsonl 由 M4 collector schema 定义，核心字段为 `execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref`，不包含 test_execution 或 phase_pre_review 字段。build-code 阶段可能执行了测试，但 collector 不采集此维度。

**无法计算的原因**：M11 的记录基础设施（collector.mjs M4 schema）不覆盖 test_execution 维度。需扩展 M4 schema 才能在后续 task 中采集此指标。

### 注 3：review_execution_rate（记录口径不同）

M10 定义：proxy from journal checkpoint_request events —— 统计 journal 中 checkpoint_request 事件的比例。

M11 现状：task-metrics.jsonl 中 6 条记录 `review_invoked` 字段均为 `false`。

**M11 实值 = 0/6 = 0**。

**需注意**：build-spec v1 SKILL.md §7 定义了一次性人审检查点（HUMAN_REVIEW_CHECKPOINT），要求在宪法检查/baseline 对照/F10 gate 完成后停顿等人确认。若此检查点在 M11 build-spec 执行时被实际触发并获人确认，则 build-spec 阶段实际发生了 review 行为。但 `review_invoked` 字段未记录此行为（全部为 false）。这可能导致 review_execution_rate 低估。

此差异的根因是：M10 用 journal checkpoint_request 事件（自动记录），M11 用 review_invoked 布尔字段（依赖执行者手动设置），两者记录口径不同。建议后续统一 review 行为的记录方式。

### 注 4：rework_proxy_count（无法计算）

M10 定义：weak_proxy from journal checkpoint_request —— 统计 checkpoint_request 事件的原始计数（D10 定义口径）。4 个 agenthub task 的均值 25.25。

M11 现状：workflowhub 不使用 journal.jsonl 事件流（M10 的 agenthub 基础设施），task-metrics.jsonl 不包含 checkpoint_request 或等效事件计数。

**无法计算的原因**：rework_proxy_count 的定义依赖 journal checkpoint_request 事件计数，这是 agenthub 基础设施的特有字段。workflowhub 的 collector.mjs 当前不记录 checkpoint_request 等效事件。task-metrics.jsonl 中的 `rework_rounds` 是粗粒度轮次计数（求和 = 6），与 checkpoint_request 原始事件计数（M10 均值 25.25）是不同的量纲，不可相互替代。

需在 metrics 基础设施层面引入 checkpoint_request 等效事件记录，才能采集此指标。

## 数据质量评估

| 指标 | 可计算 | 数据质量 | 可信度 |
| ---- | ------ | -------- | ------ |
| rework_rounds | 是 | M4 核心字段直接采集 | 高（同口径） |
| missed_step_rate | 近似 | stage 级代理，非 step 级 | 低（方法论差异） |
| test_execution_rate | 否 | M4 schema 不覆盖 | 不可用 |
| review_execution_rate | 是但低信 | review_invoked 均为 false，与实际人审行为可能不一致 | 低（记录偏差） |
| rework_proxy_count | 否 | 缺少 checkpoint_request 等效事件 | 不可用 |

**结论**：5 项中 1 项可精确计算（rework_rounds），1 项可近似（missed_step_rate），1 项可计算但低信（review_execution_rate），2 项无法计算（test_execution_rate / rework_proxy_count）。根源在于 M11 自举环境使用 M4 collector schema（10 核心字段），而 M10 基线指标中的 4 项（除 rework_rounds 外）依赖 agenthub journal.jsonl 事件流中的特定事件类型。要实现同口径对照，需扩展 M4 schema 或在 workflowhub 中引入等效的事件记录层。
