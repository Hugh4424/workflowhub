# 跨产物一致性分析报告

**task-id**: m13c-build-plan-deepening
**生成时间**: 2026-07-01
**扫描产物**: spec.md + plan.md + tasks.md
**执行者**: spec-analyze sub-skill（build-plan v1 流程调用）

---

## 覆盖摘要（Coverage Summary）

| 产物 | FR 覆盖状态 |
|------|-------------|
| spec.md | 17 FR，19 AC |
| plan.md | 17 FR 全部引用（Verification Mapping 章节） |
| tasks.md | T001-T011，11 个任务，FR 标注完整 |

---

## 发现表

| # | 类型 | 来源产物 | 目标产物 | FR/Task ID | 位置/锚点 | 严重级 | 说明 |
|---|------|----------|----------|------------|-----------|--------|------|
| F-001 | ambiguity | spec.md | plan.md | FR-TASKDIR-001/002 | spec.md §影响范围 + plan.md Step 1.2 | LOW | task_dir 解析器建议路径为 `core/task-dir-parser.mjs`，spec.md 未限定具体目录，plan.md 补充了"建议路径，build-code 确定"，但两处措辞不完全一致（spec 说"待 build-plan 落实"，plan 说"建议路径"）。build-code 阶段需最终确认路径。升级路径：next_iteration |
| F-002 | ambiguity | spec.md | tasks.md | FR-PLANREVIEW-001/002/003 | spec.md §附录 A RISK + tasks.md T004 | LOW | plan-reviewer 跨仓路径（/Users/Hugh/Hugh/Project/3rd-review/）在 spec.md 附录 A 标注为 RISK，tasks.md T004 要求"调用前验证路径可访问"，但未明确写明"不可访问时的具体操作步骤"；plan.md Step 3.3 已补充。三产物间描述详细程度不一致。升级路径：acceptable_ambiguity（plan.md 已有权威描述，其余为粗粒度引用） |
| F-003 | ambiguity | spec.md | plan.md | AC-18 | spec.md §7 AC-18 + plan.md Verification Mapping | LOW | AC-18 要求"独立异源审查产物路径存在"，plan.md Verification Mapping 标注"由 codex/3rd-review 产物路径验证"，但未指定具体产物路径格式。该歧义在 build-code/verify-code 前无法消除，属可接受范围。升级路径：acceptable_ambiguity |
| F-004 | underdefined | spec.md | tasks.md | FR-REGISTRY-001 | spec.md §FR-REGISTRY-001 + tasks.md T007 | LOW | spec.md FR-REGISTRY-001 要求新增 upstream_delta 列，但未定义 upstream_delta 列的具体格式（字符串/枚举/路径）；tasks.md T007 描述"upstream_delta 值填入来源参考"，仍不够具体。build-code 阶段须补充格式定义。升级路径：next_iteration |

---

## Severity 分类

| 级别 | 数量 | 发现项 |
|------|------|--------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 0 | — |
| LOW | 4 | F-001, F-002, F-003, F-004 |

---

## Metrics

- 总发现数：4
- CRITICAL/HIGH：0（无阻断项）
- 一致性整体评估：良好。spec/plan/tasks 三产物在 FR 覆盖、任务 FR 标注、阶段分组上一致；4 条 LOW 级发现均为细节歧义或欠定义，不影响 build-code 阶段启动。

---

## ambiguity_items[]

以下为结构化 ambiguity_items（供 stage-result.facts 消费）：

```json
[
  {
    "id": "F-001",
    "description": "task_dir 解析器路径 spec/plan/tasks 三处措辞不完全一致：spec 为'待 build-plan 落实'，plan 为'建议路径 core/task-dir-parser.mjs'，tasks 为'建议路径'",
    "escalation_path": "next_iteration"
  },
  {
    "id": "F-002",
    "description": "plan-reviewer 不可访问时的具体操作步骤在 tasks.md T004 未完整写明，plan.md Step 3.3 已补充权威描述",
    "escalation_path": "acceptable_ambiguity"
  },
  {
    "id": "F-003",
    "description": "AC-18 独立异源审查产物路径格式未在三产物中明确指定",
    "escalation_path": "acceptable_ambiguity"
  },
  {
    "id": "F-004",
    "description": "reuse-registry.md upstream_delta 列的具体格式未在 spec 或 tasks 中定义",
    "escalation_path": "next_iteration"
  }
]
```

---

## Next Actions

- F-001：build-code 阶段确认 task_dir 解析器最终路径后，在 build-plan SKILL.md 和 reuse-registry 中同步更新路径描述（next_iteration）
- F-004：build-code 阶段补充 upstream_delta 列格式定义（字符串类型，建议值为 skill 名称或路径）（next_iteration）
- F-002/F-003：可接受歧义，build-code/verify-code 阶段自然消解，无需专项处理

---

## 报告说明

- 本报告为只读分析，不修改三产物。
- 不一致发现已记录，不阻断 build-plan v1 后续步骤（F3/Q1）。
- 扫描范围：FR 引用一致性、任务 FR 标注完整性、阶段分组合理性、AC 覆盖映射、plan/tasks/spec 间措辞歧义。
