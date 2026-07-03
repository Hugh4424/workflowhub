# Cross-Artifact Analysis: step-gated-audit

**Task ID**: `step-gated-audit`
**Date**: 2026-07-03
**Skill**: spec-analyze
**Artifacts scanned**: spec.md, plan.md, tasks.md, data-contracts.md
**Status**: 只读报告，不阻断下游推进

---

## Metrics

| Category | Count |
|----------|-------|
| Total findings | 8 |
| Critical (inconsistency) | 1 |
| Warning (ambiguity) | 4 |
| Info (underdefined) | 3 |
| Duplicate | 0 |
| Findings exceeding 50-item cap | No |

---

## Findings

### F001

- **type**: inconsistency
- **source_artifact**: spec.md
- **target_artifact**: plan.md
- **fr_or_task_id**: FR-SGA-013
- **line_or_anchor**: spec.md 影响范围分析 § "受影响文件清单"
- **description**: spec.md 的受影响文件清单列出 `core/receipt-writer.mjs` 为"新建"，但未列出 `core/stage-result-writer.mjs`（audit_summary 追加入口）。plan.md Step 3.1 提到"若 core/stage-result-writer.mjs 不存在，则在各 stage SKILL.md 中补充说明"，但 spec.md 受影响文件清单没有这个条件分支。两者存在轻微不一致：spec.md 暗示 audit_summary 追加入口已存在，plan.md 需要做存在性判断。
- **severity**: warning
- **escalation_path**: next_iteration（build-plan 阶段确认 stage-result-writer.mjs 是否存在后补强）

---

### F002

- **type**: ambiguity
- **source_artifact**: spec.md
- **target_artifact**: tasks.md
- **fr_or_task_id**: FR-SGA-003
- **line_or_anchor**: spec.md FR-SGA-003 "回退范围：上一 step（不是整个 stage），最多回退至 第一个"
- **description**: spec.md 原文在"最多回退至"后有截断（推测原文为"最多回退至第一个 step"），但截断文字在压缩后不可见。tasks.md T010 描述"连续 2 次无效升人工"，与 decision-log D9 一致，但"第一个 step 时仍 blocked" 的边界场景未在 tasks.md 中单独建任务。该场景在 spec.md AC-003 中有 Given/When/Then，但任务列表无对应实现任务。
- **severity**: warning
- **escalation_path**: next_iteration（T004–T008 实现 SKILL.md 钩子时须覆盖此边界场景）

---

### F003

- **type**: ambiguity
- **source_artifact**: data-contracts.md
- **target_artifact**: spec.md
- **fr_or_task_id**: FR-SGA-007
- **line_or_anchor**: data-contracts.md Contract 2 "review sub-record 10 fields"
- **description**: spec.md FR-SGA-007 列出 10 个 review 字段的表格在原文中有截断（spec.md 压缩后仅显示前 5 字段）。data-contracts.md 根据 spec.md 上下文补全了 10 字段（skill/executed/source/provider/true_cross_engine/verdict/findings_count/findings_ref/skipped_reason/timestamp），但后 5 字段的字段名是基于推断而非完整原文。存在字段命名偏差风险。
- **severity**: warning
- **escalation_path**: human_confirm（建议人工核对 spec.md 原始完整文本中 review 10 字段的确切名称，尤其是 findings_ref / skipped_reason / timestamp）
- **resolution**: resolved — 已用 Read 工具核对 spec.md 第175-198行原文，确认正确字段名为 round/report_path/raw_result_path/fix_status，data-contracts.md 已修正。

---

### F004

- **type**: underdefined
- **source_artifact**: plan.md
- **target_artifact**: tasks.md
- **fr_or_task_id**: FR-SGA-008
- **line_or_anchor**: plan.md Step 2.1–2.5 "writer_namespace / executor_namespace 对比规则"
- **description**: plan.md 要求各 stage SKILL.md 说明 writer_namespace / executor_namespace 对比规则，但未定义 namespace 值的格式（字符串？UUID？agent-id？）。data-contracts.md 只说"non-empty string"。tasks.md T004–T008 也未要求实现者定义 namespace 格式。实现时可能各 stage 自行选择不同格式，破坏跨 stage 一致性。
- **severity**: warning
- **escalation_path**: next_iteration（build-plan 补强 namespace 格式约定）

---

### F005

- **type**: underdefined
- **source_artifact**: spec.md
- **target_artifact**: plan.md
- **fr_or_task_id**: FR-SGA-010
- **line_or_anchor**: spec.md FR-SGA-010 "step_seq 为从 1 起的序号"
- **description**: spec.md 对 build-code 的 step_seq_label 使用 `ph{N}`（如 `bc.work.ph1`），而对其他 4 个 stage 只说"从 1 起的序号"，未给出是否也用 `ph` 前缀或用纯数字（如 `bs.review.1` vs `bs.review.ph1`）。data-contracts.md 选择了"其他 4 stage 用纯数字，build-code 用 ph{N}"，但该区分在 spec.md 中未明确声明。
- **severity**: info
- **escalation_path**: next_iteration（实现时统一确认 step_seq_label 格式，build-code 以外是否用 ph 前缀）

---

### F006

- **type**: underdefined
- **source_artifact**: tasks.md
- **target_artifact**: spec.md
- **fr_or_task_id**: FR-SGA-006
- **line_or_anchor**: tasks.md T010 "(stage:3, depends:T004,T005,T006,T007,T008)"
- **description**: T010 描述 rollback 计数隔离由 runner 维护，但 tasks.md 没有专门针对"runner/workflow 层如何存储 rollback_count"的实现任务。spec.md 说 runner 在执行 rollback 时写入 journal（event_type: step_auto_rollback），但 runner 层自身是否需要修改（内存状态还是从 journal 读取计数）未在任务中明确。
- **severity**: info
- **escalation_path**: next_iteration（runner 层实现细节留 build-plan/build-code 阶段确认）

---

### F007

- **type**: ambiguity
- **source_artifact**: plan.md
- **target_artifact**: tasks.md
- **fr_or_task_id**: FR-SGA-011
- **line_or_anchor**: plan.md Step 2.3 "before-step 须在 phase-manifest 加载完毕后触发"
- **description**: plan.md Step 2.3 和 tasks.md T006 均描述 build-code 的 before-step 须在 phase-manifest 加载后触发，但未指明如果 phase-manifest 加载失败，before-step 是 fail-closed 还是 warn-only。spec.md FR-SGA-011 只说"before-step 钩子在 phase-manifest 加载后触发"，对失败路径无说明。
- **severity**: info
- **escalation_path**: next_iteration（build-code SKILL.md 修改时需明确 phase-manifest 加载失败路径）

---

### F008

- **type**: inconsistency
- **source_artifact**: tasks.md
- **target_artifact**: spec.md
- **fr_or_task_id**: FR-SGA-005
- **line_or_anchor**: tasks.md T009 vs spec.md AC-005
- **description**: AC-005 要求 `exit_receipt.audit_summary` 含 5 个独立计数字段，但 plan.md Step 3.1 和 tasks.md T009 将 audit_summary 定位为写入 `stage-result.json`（而非 exit_receipt）。spec.md AC-004 明确说 stage-result.json 含 audit_summary 聚合字段，AC-005 的"exit_receipt.audit_summary"措辞与 AC-004 的"stage-result.json"存在路径歧义。data-contracts.md Contract 5 以 stage-result.json 为准（与 AC-004 一致）。
- **severity**: warning
- **escalation_path**: human_confirm（建议人工确认 AC-005 中 audit_summary 归属：是 exit_receipt 子字段还是 stage-result.json 顶级字段；data-contracts.md 与 AC-004 一致，建议以此为准）

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| Warning (inconsistency/ambiguity requiring attention) | 5 | F001, F002, F003, F004, F008 |
| Info (underdefined, low risk) | 3 | F005, F006, F007 |
| Blocking | 0 | — |

**最高优先级处理项**:
1. **F003** (human_confirm): spec.md review 10 字段名称需人工核对，影响 data-contracts.md 和 T004–T008 实现。
2. **F008** (human_confirm): AC-005 中 audit_summary 归属（exit_receipt vs stage-result.json）需澄清，影响 T009 实现路径。
3. **F001**: core/stage-result-writer.mjs 存在性确认，影响 T009 实现方式。

**不阻断下游**: 所有发现均为记录性质，不阻断 build-plan 后续步骤推进（per spec-analyze SKILL.md 规则）。

---

## F10 阶段修正记录

**修正时间**: 2026-07-03（build-plan Step 7 F10 gate 执行阶段）

**修正内容**（实质性修改，不只是补章节）：

1. **`core/journal-schema.mjs` MODIFY → NEW**：plan.md 和 tasks.md（T001）原标注为"修改"，实际 core/ 目录下不存在该文件，已修正为"新建"。影响 T001 任务描述及 plan.md 文件清单。

2. **5 个 SKILL.md 路径前缀 `skills/` → `workflows/`**：plan.md 和 tasks.md 中 T004-T008 及文件清单引用了不存在的 `skills/build-spec/SKILL.md`、`skills/build-plan/SKILL.md`、`skills/build-code/SKILL.md`、`skills/verify-code/SKILL.md`、`skills/make-decision/SKILL.md`，实际路径均在 `workflows/` 下，已全部修正。

3. **`core/stage-result-writer.mjs` 存在性结论**：该文件不存在，plan.md Scope Boundary 原写"不重写"（隐含存在），已修正为"不存在，audit_summary 追加规则内联写在各 stage SKILL.md 中"。同时补充到 plan.md 文件清单"不存在（已确认）"分组。

4. **`skills/3rd-review/SKILL.md` 路径修正**：该路径在本仓库不存在；3rd-review 为外部工具，实际路径 `/Users/Hugh/Hugh/Project/3rd-review/`（build-plan SKILL.md Step 8 引用的外部路径）。plan.md 和 tasks.md 中所有引用已修正为外部路径说明。

5. **F10 section 扩展**：原 F10 节仅含 3 行简表，不符合 SKILL.md Step 7 要求的"逐机制四问"。已替换为 5 个机制的完整四问分析，所有机制通过四问，无建议移除项。

---

## facts.analysis_ref

```json
{
  "facts": {
    "analysis_ref": "specs/step-gated-audit/cross-artifact-analysis.md",
    "ambiguity_items": [
      {
        "description": "spec.md review 10字段名称在压缩后不可见，data-contracts.md后5字段名基于推断",
        "escalation_path": "human_confirm"
      },
      {
        "description": "AC-005 audit_summary归属：exit_receipt子字段 vs stage-result.json顶级字段存在措辞歧义",
        "escalation_path": "human_confirm"
      },
      {
        "description": "writer_namespace / executor_namespace值格式未定义（字符串格式约定缺失）",
        "escalation_path": "next_iteration"
      }
    ]
  }
}
```
