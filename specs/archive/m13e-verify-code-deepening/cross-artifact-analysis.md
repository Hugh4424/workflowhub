# cross-artifact-analysis.md — m13e-verify-code-deepening

**task-id**: m13e-verify-code-deepening
**generated-by**: spec-analyze SKILL.md
**date**: 2026-07-02
**inputs**: spec.md, plan.md, tasks.md
**status**: non-blocking — 发现项仅供人工审查，不阻断后续流程

---

## 1. 执行摘要

扫描三产物，共发现 **5 条**有效发现项。无 inconsistency 类型（FR 覆盖完整）；主要问题为 1 条 ambiguity（字段名歧义）、2 条 underdefined（实现细节待拍板）、2 条 duplicate（逻辑重叠提醒）。无发现项阻断推进。

---

## 2. 发现项列表

### 发现项 001

| 字段 | 值 |
|------|-----|
| **type** | ambiguity |
| **source_artifact** | spec.md |
| **target_artifact** | tasks.md |
| **fr_or_task_id** | FR-TRACE-001 |
| **line_or_anchor** | spec.md:L39（正文定义 `no_browser_test`）vs spec.md:L51（场景用 `skip_ui_test`） |

**描述**：spec.md FR-TRACE-001 正文第 39 行定义跳过留痕字段名为 `no_browser_test`，但同一节验收场景第 51 行使用 `skip_ui_test`，两者不一致。tasks.md T010 已注记以正文为准（`no_browser_test`），但若实现阶段未仔细读 spec 正文可能使用错误字段名。

**escalation_path**: human_confirm（建议在 build-code 开始前由人确认采用 `no_browser_test`，或在 spec.md 中修正场景笔误）

---

### 发现项 002

| 字段 | 值 |
|------|-----|
| **type** | underdefined |
| **source_artifact** | spec.md |
| **target_artifact** | plan.md |
| **fr_or_task_id** | FR-TRACE-002 |
| **line_or_anchor** | spec.md:L57-L65（FR-TRACE-002 正文） |

**描述**：FR-TRACE-002 要求 trace-check 关联比对"机器可查"——能检查 evidence 是否被本次 journal 引用或由本次 capture.mjs 调用链产生——但 spec 明确将"具体验证字段/命令"留给实现阶段定义。plan.md Step 2.2 和 tasks.md T003 均引用此要求，但均未指定具体字段名或命令格式。实现阶段需自行拍板这一细节，存在实现者理解偏差风险。

**escalation_path**: next_iteration（实现阶段拍板，不阻断计划推进）

---

### 发现项 003

| 字段 | 值 |
|------|-----|
| **type** | underdefined |
| **source_artifact** | spec.md |
| **target_artifact** | plan.md |
| **fr_or_task_id** | FR-COLOR-001 |
| **line_or_anchor** | spec.md:L200（yellow 触发条件"非关键 AC 缺失"） |

**描述**：FR-COLOR-001 表格中 yellow 触发条件含"非关键 AC 缺失"，但 spec 未定义"关键 AC"与"非关键 AC"的判定标准（哪些 AC ID 属于关键？由谁判定？）。plan.md Step 2.6 和 tasks.md T008 均引用此条件，但均无法在不引入主观判断的情况下实现"机器硬条件"语义。与 spec 要求的"均为机器硬条件，非 LLM 主观打分"存在内在矛盾。

**escalation_path**: human_confirm（建议 build-code 前由人在 spec 中补充关键/非关键 AC 判定规则，或明确 yellow 只由 flaky_failure=true 触发）

---

### 发现项 004

| 字段 | 值 |
|------|-----|
| **type** | duplicate |
| **source_artifact** | plan.md |
| **target_artifact** | tasks.md |
| **fr_or_task_id** | FR-FRESH-001, FR-L3IRON-001 |
| **line_or_anchor** | plan.md Step 2.1（freshness.mjs 扩展）vs tasks.md T002 + T007 |

**描述**：plan.md Step 2.1 将 freshness.mjs 四段扩展（FR-FRESH-001）和 L3 iron-law（FR-L3IRON-001）合并为单一步骤；tasks.md 将其拆为 T002（freshness.mjs 扩展）和 T007（L3 iron-law 校验步骤插入 SKILL.md）两条任务。逻辑上合理（T002 改 .mjs 文件，T007 改 SKILL.md 调用），但 plan 和 tasks 粒度不一致，实现者需注意 T007 不是重复实现 freshness.mjs，而是在 SKILL.md 中增加调用步骤引用 T002 的扩展逻辑。

**escalation_path**: acceptable_ambiguity（任务拆分合理，仅提醒实现者注意分工边界）

---

### 发现项 005

| 字段 | 值 |
|------|-----|
| **type** | duplicate |
| **source_artifact** | tasks.md |
| **target_artifact** | tasks.md |
| **fr_or_task_id** | FR-STRATEGY-001 |
| **line_or_anchor** | tasks.md T004（test-strategy 调用步骤）与 tasks.md T001（test-strategy SKILL.md 新建） |

**描述**：T001 新建 test-strategy SKILL.md，T004 在 verify-code SKILL.md 中插入 test-strategy 调用步骤。两者都涉及 test-strategy 的机器核查逻辑描述（T001 在 SKILL.md 中定义，T004 在 verify-code 中实现调用+核查）。若 T001 和 T004 由不同人实现，核查逻辑定义（T001）和调用实现（T004）之间需保持契约一致。data-contracts.md Contract 2 已定义接口，作为单一信息源，风险可控。

**escalation_path**: acceptable_ambiguity（data-contracts.md Contract 2 已作为接口单一信息源，风险可控）

---

## 3. Severity 分类

| Severity | 发现项 | 说明 |
|----------|--------|------|
| HIGH | 001（ambiguity）, 003（underdefined） | 字段名歧义和关键AC判定缺失可能导致实现错误；建议人工确认后再进入 build-code |
| MEDIUM | 002（underdefined） | FR-TRACE-002 细节留给实现阶段，有偏差风险但不阻断 |
| LOW | 004, 005（duplicate） | 逻辑重叠/粒度不一致，实现者注意即可 |

---

## 4. Metrics

| 指标 | 值 |
|------|-----|
| 总发现项数 | 5 |
| inconsistency | 0 |
| duplicate | 2 |
| ambiguity | 1 |
| underdefined | 2 |
| 超过上限（50条） | 否 |
| 报告达标 | 是（所有发现项含完整五字段） |

---

## 5. FR 覆盖完整性扫描

| FR | plan.md 覆盖 | tasks.md 覆盖 |
|----|-------------|--------------|
| FR-TRACE-001 | Step 2.2 | T003 |
| FR-TRACE-002 | Step 2.2 | T003 |
| FR-STRATEGY-001 | Step 1.1, Step 2.3 | T001, T004 |
| FR-FRESH-001 | Step 2.1 | T002 |
| FR-L3-001 | Step 2.4 | T005 |
| FR-SUMMARY-001 | Step 2.5 | T006 |
| FR-L3IRON-001 | Step 2.1, Step 2.6 | T002, T007 |
| FR-COLOR-001 | Step 2.6 | T008 |

所有 8 条 FR 均在 plan.md 和 tasks.md 中有对应覆盖。无遗漏 FR。

---

## 6. 宪法对齐标记

plan.md Constitution Check 节已填写 21/21 条（含 F1-F5, Q1-Q3, S1-S8）。任务列表中所有任务均映射至少一条 FR，无无根任务。无宪法违规发现。

---

## 7. 结论

三产物一致性良好，FR 覆盖完整，无 inconsistency 类发现。两条 HIGH 级发现（001 字段名歧义、003 关键AC判定缺失）建议人工在进入 build-code 前确认，不阻断 build-plan 当前阶段推进。
