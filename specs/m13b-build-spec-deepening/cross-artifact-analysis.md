# 跨产物一致性分析报告

**Task ID**: `m13b-build-spec-deepening`
**Date**: 2026-06-30
**Artifacts scanned**: spec.md, plan.md, tasks.md
**Scanner**: spec-analyze sub-skill (build-plan v1)

> 本报告只读（read-only）。记录不一致/重复/歧义/欠定义问题，不修改三产物，不阻断下游推进。

---

## Coverage Summary

| Artifact | FR Count | AC Count | Tasks Count |
|----------|----------|----------|-------------|
| spec.md  | 24 FRs   | 22 ACs   | —           |
| plan.md  | 24 FRs mapped in Verification Mapping | — | 9 steps |
| tasks.md | 14 tasks | — | Stage 1: T001–T004, Stage 2: T005–T011, Stage 3: T012–T014 |

---

## Findings

### Inconsistencies（不一致）

| # | Severity | Location | Description | Field: id, type, location, description, suggested_action |
|---|----------|----------|-------------|----------------------------------------------------------|
| I-01 | LOW | spec.md FR 列表 vs plan.md Verification Mapping | spec.md 附录 C（决策落点覆盖）提及 FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 为"新增 FR"（5 项），但 spec.md 正文 §4 功能需求小节标题顺序与 plan.md Verification Mapping 中的 Step 排序存在轻微不一致——spec §4 按域分组（FR-BUILD → FR-CONTRACT → FR-LADDER → … → FR-COMM），plan 按实施阶段分组（Phase 1 = 基础节先行）。两者都正确，仅顺序视角不同。 | id:I-01, type:inconsistency, location:spec.md §4 vs plan.md Implementation Steps, description:FR 分组视角不同（按域 vs 按实施依赖），suggested_action:无需修改，两种分组均合理且互补 |
| I-02 | LOW | tasks.md Task ID 引用 vs plan.md FR Coverage Matrix | plan.md §Step 9 FR 覆盖矩阵列出任务编号 T001–T015，但 tasks.md 实际只有 T001–T014（14 条任务）。plan.md 矩阵中 T015 对应 FR-BEHAV-001/002, FR-FRICTION-001, FR-ARTIFACT-001，这些在 tasks.md 中合并到 T013 覆盖。 | id:I-02, type:inconsistency, location:plan.md §Step9 FR Coverage Matrix row T015 vs tasks.md, description:plan.md 矩阵引用 T015 但 tasks.md 无此编号（已并入 T013）, suggested_action:plan.md FR Coverage Matrix 中 T015 改为 T013 |

### Duplicates（重复）

| # | Severity | Location | Description | Field: id, type, location, description, suggested_action |
|---|----------|----------|-------------|----------------------------------------------------------|
| D-01 | LOW | tasks.md T014 vs plan.md Step 3.3 | tasks.md T014「整体 AC 验收」和 plan.md「Step 3.3: AC 验证」描述相同的 grep 核查活动，存在内容重复。tasks.md 是执行级别，plan.md 是计划级别，重复在预期范围内（不同抽象层次）。 | id:D-01, type:duplicate, location:tasks.md T014 + plan.md Step 3.3, description:AC 验收活动在两个产物中均有描述，属计划↔任务正常重复, suggested_action:无需修改，属正常跨层次映射 |

### Ambiguities（歧义）

| # | Severity | Location | Description | Field: id, type, location, description, suggested_action |
|---|----------|----------|-------------|----------------------------------------------------------|
| A-01 | MEDIUM | tasks.md T009 依赖声明 | T009「异源 3rd-review」声明 `depends:T005`，但 FR-REVIEW-001 要求"spec 初稿完成后"调用，而初稿是 build-spec spec-specify 阶段产出（非 M13b tasks.md 的任务范畴）。T009 实际是"在 SKILL.md 中写入 3rd-review 步骤描述"，而非"执行 3rd-review"。依赖声明语义清晰，但描述措辞可更明确以区分"写入步骤描述"和"执行 3rd-review"。 | id:A-01, type:ambiguity, location:tasks.md T009 描述, description:任务描述措辞可能被误读为"现在执行一次 3rd-review"而非"在 SKILL.md 中写入 3rd-review 步骤说明", suggested_action:T009 描述首句加"在 SKILL.md 中新增…节（描述步骤，非本次执行）"以消歧义；低优先级 |
| A-02 | LOW | plan.md S6 宪法条款判据 | plan.md Constitution Check S6 判据末尾写"待 SKILL.md 写入时确认 version"，引入了一个"待确认"的条件，意味着 S6 结论是临时的。这与 Constitution Check 的一次性记录语义有轻微不一致（其他 20 条无此留白）。 | id:A-02, type:ambiguity, location:plan.md Constitution Check S6, description:S6 判据含"待确认"语，使其结论不完整, suggested_action:后续 SKILL.md 写入完成后将 S6 判据更新为确定性结论；目前不阻断 |

### Coverage Gaps（欠定义）

| # | Severity | Location | Description | Field: id, type, location, description, suggested_action |
|---|----------|----------|-------------|----------------------------------------------------------|
| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
| G-02 | LOW | baseline table: 5 metrics all unknown | plan.md M10 Baseline 表 5 项全为 unknown，原因充分（build-plan 阶段无上游 stage-result 采集值）。但 spec.md §附录 A 自检结果条目 5 提及"spec↔decision-log 覆盖率 pass"，说明部分指标在 spec 层面有结论，与 plan baseline 全 unknown 存在信息分层但不矛盾。 | id:G-02, type:coverage_gap, location:plan.md M10 Baseline table, description:5 项均 unknown 为预期（阶段限制），与 spec.md §附录 A 自检条目不矛盾，建议下游 build-code 完成后补录, suggested_action:无需修改当前产物；build-code/verify-code 完成后由 collector 补录实际值 |

---

## Metrics

| Metric | Count |
|--------|-------|
| inconsistencies | 2 |
| duplicates | 1 |
| ambiguities | 2 |
| coverage_gaps | 2 |
| **total findings** | **7** |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 (A-01) |
| LOW | 6 |

---

## Next Actions

1. **I-02 修正（低优先级）**：plan.md §Step9 FR 覆盖矩阵中 T015 改为 T013，消除任务编号不一致。
2. **A-01 可选优化**：tasks.md T009 描述首句加消歧措辞。
3. **A-02 后续跟进**：SKILL.md 写入完成后更新 plan.md S6 判据为确定性结论。
4. **G-01 可选补充**：plan.md Verification Mapping 显式列出 AC-20/AC-21 映射。
5. **G-02 延后**：build-code/verify-code 完成后补录 5 项 baseline 实际值。

所有 MEDIUM/LOW 发现均不阻断推进。无 CRITICAL/HIGH 发现。

---

> 报告由 spec-analyze 子技能在 build-plan v1 流程中产出。不修改 spec.md、plan.md、tasks.md 三产物。
