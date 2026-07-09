# M13d baseline-report — build-code 深化

> M11 vs M10 基线对照。5 项指标定义来自 specs/archive/m10-baseline-switch/baseline-report.md。
> 对照时间：2026-07-01
> non-blocking：任何指标不达标不阻断推进（F3, Q1）。
> 阈值由人工设定，本表仅记录对照事实。

---

## M10 基线快照（4 个历史 agenthub task 均值）

| 指标 | M10 基线均值 | 来源 |
|------|-------------|------|
| missed_step_rate | 0.05（4 task 均值：0.2/0/0/0） | m10-baseline-switch/baseline-report.md |
| test_execution_rate | 0.83（均值：1/0.82/0.5/1） | 同上 |
| review_execution_rate | 1.0（4 task 均值：1/1/1/1） | 同上 |
| rework_rounds | 6.08（均值：4.25/7.5/8.75/3.8） | 同上 |
| rework_proxy_count | 25.25（均值：17/30/35/19） | 同上（D10 推导自 checkpoint_request 计数，weak_proxy） |

---

## M13d 本轮实际值

> 说明：M13d 当前处于 build-spec 阶段，代码尚未实施，实际运行数据不可采集。本表填入已知的设计层事实，实际指标须在 build-code / verify-code 阶段执行后补填。

| 指标 | M13d 实际值 | delta vs M10 基线 | direction | 备注 |
|------|------------|-------------------|-----------|------|
| missed_step_rate | unknown | unknown | lower_better | build-spec 阶段无运行数据 |
| test_execution_rate | unknown | unknown | higher_better | build-spec 阶段无运行数据 |
| review_execution_rate | unknown | unknown | higher_better | build-spec 阶段无运行数据；FR-REVIEW-001 设计上强制两个子代理，预期值 1.0 |
| rework_rounds | unknown | unknown | lower_better | build-spec 阶段无运行数据 |
| rework_proxy_count | unknown | unknown | lower_better | build-spec 阶段无运行数据；见质量事实契约第 5 项 |

---

## 对照结论

- **5 项指标均为 unknown**（build-spec 阶段无执行数据，非错误）。
- 达标判定留待 build-code / verify-code 阶段实际运行后，由 metrics/capture.mjs 采集实际值再对照。
- M10 基线已建立（5 项指标均可从 baseline-report.md 复算）。
- 本表 non-blocking，不阻断 build-spec 推进（F3, Q1）。

---

## 数据来源

- M10 基线：`specs/archive/m10-baseline-switch/baseline-report.md`（source_type: historical_agenthub_tasks, source_ref: 4 tasks）
- M13d 实际值：build-code / verify-code 阶段产出后填充

---

## build-plan 阶段追加对照（2026-07-01）

M13d 此时处于 build-plan 阶段，plan.md/tasks.md 已产出，代码仍未实施。5 项指标定义、来源、non-blocking 规则与上表一致，不重复推导。

| 指标 | 本轮状态 | 说明 |
|------|---------|------|
| missed_step_rate | unknown | 无执行数据，待 build-code 运行后由 metrics/capture.mjs 采集 |
| test_execution_rate | unknown | 同上 |
| review_execution_rate | unknown | 同上 |
| rework_rounds | unknown | 全流程未完成，无返工数据 |
| rework_proxy_count | unknown | 全流程未完成，无代理返工数据 |

阈值仍由人工设定，本表仅记录事实，不阻断 stage-result（F3/Q1）。build-plan 阶段本身不产生可采集的运行时指标，5 项与 build-spec 阶段状态一致（均 unknown），非退化。
