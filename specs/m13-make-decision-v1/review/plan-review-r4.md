# M13 build-plan 第四轮复审

verdict: revise_required
blocking_count: 0

## 复审范围

- R3 报告：`specs/m13-make-decision-v1/review/plan-review-r3.md`
- spec：`specs/m13-make-decision-v1/spec.md`
- decision-log：`tasks/m13-make-decision-v1/decision-log.md`
- plan：`specs/m13-make-decision-v1/plan.md`
- tasks：`specs/m13-make-decision-v1/tasks.md`
- analyze：`specs/m13-make-decision-v1/cross-artifact-analysis.md`
- 剧本：`workflows/build-plan/SKILL.md`
- 宪法清单：`constitution-checklist.md`

## R3 四项复核

| R3 finding | 复核结论 |
|---|---|
| 1 FR-REVIEW-03 三行留痕格式 | partial：plan/tasks/T016 已修；decision-log 仍保留旧格式，见 Finding 1 |
| 2 spec 附：未决问题与 OPEN-2 一致 | fixed |
| 3 S3 外部调研删除 fallback_used/source_family 错扩契约 | fixed |
| 4 cross-analyze 删除 F001 假绿/判定树残留 | fixed；但 analyze 新增统计矛盾，见 Finding 3 |

## Findings

### 1. severity: major

位置：
- `tasks/m13-make-decision-v1/decision-log.md:120`
- `specs/m13-make-decision-v1/spec.md:167-171`
- `specs/m13-make-decision-v1/cross-artifact-analysis.md:38`

问题：

FR-REVIEW-03 的 plan/tasks/T016 已统一为 spec 字面格式：

```text
反对 X：
决定 Y：
理由 Z：
```

但上游 decision-log D6 仍写：

```text
反对X/决定Y/理由Z
```

该行不是普通说明，而是写成“必须留痕格式”。这与 spec 的“格式固定”仍不一致。cross-artifact-analysis 又把 B5 标成“已解决”，因此 B5 仍存在局部假绿。

影响：

实现者如果回读 decision-log，会看到另一套“必须格式”。R3 要求的“全链路统一为 spec 字面”没有完全成立。

修正：

把 decision-log D6 中的防漏阀格式改为 `反对 X：/决定 Y：/理由 Z：`。cross-artifact-analysis B5 的已解决说明也应明确该统一覆盖 decision-log，避免只验证 plan/tasks。

### 2. severity: major

位置：
- `specs/m13-make-decision-v1/spec.md:286-290`
- `specs/m13-make-decision-v1/plan.md:187-191`
- `specs/m13-make-decision-v1/tasks.md:166-175`
- `specs/m13-make-decision-v1/cross-artifact-analysis.md:61-62`

问题：

spec 的 FR-LEDGER-03 明确要求：超出当前 task 范围的新想法要“记录到新 task 候选列表”，验收标准是“新想法候选列表存在（可为空列表）”。

plan Step 2.10 和 tasks T014 只写“新想法有回退路径”，没有要求产出或维护“新 task 候选列表”。cross-artifact-analysis 仍把 FR-LEDGER-03 标为覆盖。

影响：

实现者按 tasks 执行时，可以只写一句“有回退路径”而不产出候选列表，导致 spec 的可验收 artifact 缺失。analyze 对该 FR 的覆盖判断也是假绿。

修正：

在 plan Step 2.10 和 tasks T014 完成条件中补：渲染点②必须包含“新 task 候选列表”（允许为空列表），且不得自动扩大当前 task 范围。cross-artifact-analysis 同步改覆盖说明。

### 3. severity: minor

位置：
- `specs/m13-make-decision-v1/cross-artifact-analysis.md:22-24`
- `specs/m13-make-decision-v1/cross-artifact-analysis.md:69-75`

问题：

cross-artifact-analysis 的 Findings 段写“无残留一致性发现，所有 blocking/major/minor 问题已解决”，但统计表又写：

```text
minor | 1
```

这两个结论不能同时成立。

影响：

报告自身不可信：读者不知道是否还有一个 residual minor 未列出。它不是 blocking，也不改变核心实现契约，但违反“不假绿不占位”的报告要求。

修正：

若确实无残留 finding，把统计改为 `minor | 0`。若有 residual minor，必须在 Findings 段列出具体问题。

## 其他核验结论

- spec “附：未决问题”已改为仅 OPEN-2 留存，和 decision-log §6 一致。
- plan Step 2.5 / tasks T009 的 S3 外部调研已删除 `fallback_used/source_family` 错扩契约；该字段只保留在 S5 盲审相关 Step 2.7 / T011。
- cross-artifact-analysis 中未再发现 F001 或“S4/S5 回退判定树”残留。
- S9 仍是唯一 hard gate；S4 为记录态非阻断；未发现新增 blocking gate。

## 结论

blocking_count 仍为 0，但当前不能 pass。原因是：

1. FR-REVIEW-03 全链路统一仍漏了 decision-log。
2. FR-LEDGER-03 的“新 task 候选列表”未落到 plan/tasks，analyze 标覆盖属于假绿。
3. analyze 统计表与 Findings 段自相矛盾。
