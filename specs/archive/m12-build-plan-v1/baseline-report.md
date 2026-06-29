# M12 vs M10 Baseline 对照报告（飞行中快照）

> 任务：m12-build-plan-v1
> M10 基线来源：`specs/archive/m10-baseline-switch/baseline-report.md`（4 个 agenthub task 的指标均值）
> M12 数据来源：`tasks/m12-build-plan-v1/task-metrics.jsonl`（当前 4 条 stage 记录：make-decision / build-spec / spec-specify / spec-clarify）
> 状态：**飞行中** — 仅 make-decision 和 build-spec（含 spec-specify/spec-clarify）两段完成，build-plan/build-code/verify-code 三段待执行。大部分指标因数据不足无法计算。
> 规则：记录事实，不阻断推进。算不准的诚实标注 `unknown`，不做假绿编数（F9）。

## 5 指标对照表

| Metric | M12 Actual | M10 Baseline | Direction Delta |
| ------ | ---------- | ------------ | --------------- |
| missed_step_rate | 0.6（近似，见注 1） | 0.05 | unknown（见注 1） |
| test_execution_rate | unknown（见注 2） | 0.8295 | unknown |
| review_execution_rate | 0（见注 3） | 1 | unknown（见注 3） |
| rework_rounds | 0 | 6.075 | ↓ 优 -6.075（飞行中，见注 4） |
| rework_proxy_count | unknown（见注 5） | 25.25 | unknown |

## 计算说明

### rework_rounds（M4 核心字段，可直接采集）

M12 各 stage 的 rework_rounds：
- make-decision: 0
- build-spec: 0
- spec-specify: 0
- spec-clarify: 0
- build-plan / build-code / verify-code: 待执行

**M12 实值** = 0 + 0 + 0 + 0 = **0**（当前 4 条记录之和。飞行中，前两段无返修；build-plan/build-code 执行后此值将上升）。

此指标在 M4 核心字段中直接存在，计算口径与 M10 一致。

### 注 1：missed_step_rate（近似值，方法论不同，飞行中）

M10 定义：proxy from journal stage_enter/stage_exit —— 统计 journal 中 stage_enter 有记录但缺少 stage_exit 的比例。

M12 现状：task-metrics.jsonl 不含 step 级 enter/exit 事件。M12 已执行 2 个主 stage（make-decision、build-spec），预期 5 个主 stage（make-decision / build-spec / build-plan / build-code / verify-code），按 M11 的近似口径"1 - 已执行/预期"：1 - 2/5 = 0.6。

**Delta 标记 unknown 的原因**：差值 -0.55 看似"变差"但无意义——此近似值在飞行中偏大是正常现象（build-plan/build-code/verify-code 执行后自然归零），方法论本身也不同（stage 级近似 vs step 级追踪），直接比差值会误导。待全段执行完毕后以同口径重算。

### 注 2：test_execution_rate（无法计算）

M10 定义：weak_proxy from journal phase_pre_review events。

M12 现状：task-metrics.jsonl 由 M4 collector schema 定义，核心字段不包含 test_execution 或 phase_pre_review 维度。build-code/verify-code 执行后仍无法从此 schema 中提取。

**无法计算的原因**：记录基础设施（M4 schema）不覆盖 test_execution 维度。需扩展 M4 schema 才能在后续 task 中采集。

### 注 3：review_execution_rate（记录口径不同）

M10 定义：proxy from journal checkpoint_request events。

M12 现状：4 条 task-metrics.jsonl 记录中 review_invoked 均为 false（build-spec 的 record 无 facts 字段，视为 false）。

**M12 实值 = 0/4 = 0**。

**Delta 标记 unknown 的原因**：M10 用 journal checkpoint_request 自动记录，M12/M11 用 review_invoked 布尔字段（依赖执行者手动设置），口径不同。此外 build-spec SKILL.md §7 定义的人审检查点若实际触发，review_invoked=false 会导致低估。方向 Delta 在口径统一的条件下才能比较。

### 注 4：rework_rounds 的 Delta 说明

M12 实值 0 vs M10 基线 6.075，差 -6.075。但这不代表"质量更好"——M12 才走了 2 段，build-plan 和 build-code 通常是返修集中段，rework_rounds 将在后续阶段累积上升。待全段完成后重算才有对照意义。

### 注 5：rework_proxy_count（无法计算）

M10 定义：weak_proxy from journal checkpoint_request —— journal 中 checkpoint_request 事件的原始计数。4 个 agenthub task 的均值 25.25。

M12 现状：workflowhub 不使用 journal.jsonl 事件流，task-metrics.jsonl 不含 checkpoint_request 或等效事件。

**无法计算的原因**：rework_proxy_count 依赖 journal checkpoint_request 事件，这是 agenthub 基础设施的特有字段。workflowhub 当前不记录 checkpoint_request 等效事件。需在 metrics 层引入等效记录。

## 飞行中填补路径

| 指标 | 当前状态 | 填补条件 |
| ---- | -------- | -------- |
| missed_step_rate | 近似 | build-plan/build-code/verify-code 执行后，5/5 完成时近似值 = 0 |
| test_execution_rate | unknown | M4 schema 不覆盖，需扩展 schema |
| review_execution_rate | 0 | build-plan/build-code/verify-code 执行后 review_invoked 可能变为非零；口径差异需统一 |
| rework_rounds | 0（飞行中） | build-plan/build-code/verify-code 执行后累积 |
| rework_proxy_count | unknown | 需引入 checkpoint_request 等效记录 |

**结论**：5 项中 1 项可直接计算但值不完整（rework_rounds = 0，飞行中），1 项可近似但方法论不同（missed_step_rate），1 项可计算但口径不同（review_execution_rate），2 项无法计算（test_execution_rate / rework_proxy_count）。非 unknown 的三项之中仅 rework_rounds 计算口径与 M10 同源，其余两项因 M4 schema 不含 agenthub journal 的事件类型，无法同口径对照。根源与 M11 一致：M10 基线指标依赖 agenthub journal.jsonl 事件流，而 workflowhub 的 M4 collector schema 不覆盖这些事件类型。
