# M13 build-plan 第三轮复审

verdict: revise_required
blocking_count: 0

## 复审范围

- R2 报告：`specs/m13-make-decision-v1/review/plan-review-r2.md`
- spec：`specs/m13-make-decision-v1/spec.md`
- decision-log：`tasks/m13-make-decision-v1/decision-log.md`
- plan：`specs/m13-make-decision-v1/plan.md`
- tasks：`specs/m13-make-decision-v1/tasks.md`
- analyze：`specs/m13-make-decision-v1/cross-artifact-analysis.md`
- 剧本：`workflows/build-plan/SKILL.md`
- 宪法清单：`constitution-checklist.md`

## R2 逐条复核摘要

| R2 finding | 复核结论 |
|---|---|
| 1 宪法 21 条真实清单 | fixed |
| 2 S8 含 CONTEXT 同步 | fixed |
| 3 FR-REVIEW-03 三行留痕 | partial，见 Finding 1 |
| 4 盲审 fallback 失败语义 | partial，S5 已修；S3 新增错扩契约，见 Finding 3 |
| 5 双路均空即停 | fixed |
| 6 grill artifact + draft 引用 | fixed |
| 7 metrics 十 core fields | fixed |
| 8 cross-analyze 五字段无假绿 | partial，见 Finding 1、4 |
| 9 FR-SCOPE-01 | fixed |
| 10 decision-log D1 标签 | fixed |
| 11 baseline 注脚 | fixed |
| 12 decision-log 开放问题 | fixed；spec 仍有新矛盾，见 Finding 2 |

## Findings

### 1. severity: major

位置：
- `specs/m13-make-decision-v1/spec.md:167-175`
- `specs/m13-make-decision-v1/plan.md:161-168`
- `specs/m13-make-decision-v1/tasks.md:130-137`
- `specs/m13-make-decision-v1/tasks.md:192`
- `specs/m13-make-decision-v1/cross-artifact-analysis.md:49`

问题：

FR-REVIEW-03 的固定三行格式没有真正对齐。spec 明确写“格式固定”，并给出：

```text
反对 X：<反对的具体内容>
决定 Y：<用户最终决定>
理由 Z：<决定的理由>
```

但 plan/tasks 写成：

```text
反对X: <反对内容>
决定Y: <决定内容>
理由Z: <理由内容>
```

tasks 的 S10 落盘前检查也按 `反对X:/决定Y:/理由Z:` 扫描。这样实现者会按 plan/tasks 产出或检查另一套格式，导致 spec 要求的固定格式不可稳定验收。cross-artifact-analysis 还把 B5 标成已解决，属于假绿。

影响：

R2 的 FR-REVIEW-03 修复未完全成立。blocking 反对留痕可能在 spec 下不合格，或机器扫描按 tasks 误判。

修正：

把 plan/tasks/decision-log 中所有 FR-REVIEW-03 留痕格式统一为 spec 的字面格式：`反对 X：`、`决定 Y：`、`理由 Z：`。T016 的检查条件也必须扫描同一格式。cross-artifact-analysis 同步改掉 B5 已解决说明。

### 2. severity: major

位置：
- `specs/m13-make-decision-v1/spec.md:456-467`
- `specs/m13-make-decision-v1/spec.md:469-471`
- `tasks/m13-make-decision-v1/decision-log.md:151-153`

问题：

开放问题状态在 spec 内部自相矛盾。spec 的 OPEN CLARIFICATIONS 仍保留 OPEN-2：S7 orchestrator 是否显式 skip framing-challenge，且说明“待 SKILL.md 实现时确认”。但紧接着 `## 附：未决问题` 又写“无（所有 NEEDS CLARIFICATION 项已在 make-decision 阶段 S9 确认解决）”。

decision-log 已正确只保留 OPEN-2，但 spec 同时说“有 OPEN-2”和“无未决问题”。这是新的假绿，会让实现者误以为 S7 orchestrator 接线没有待确认项。

影响：

OPEN-2 可能被静默忽略，或由实现者自行发明接线细节，违背“不得由实现者自行发明”的开放问题约束。

修正：

删除 spec 的“未决问题：无”，或改成“仅 OPEN-2 留存，待 SKILL.md 实现时确认”。保持 spec 与 decision-log 一致。

### 3. severity: major

位置：
- `specs/m13-make-decision-v1/plan.md:147-149`
- `specs/m13-make-decision-v1/spec.md:128-132`
- `specs/m13-make-decision-v1/spec.md:145-151`
- `specs/m13-make-decision-v1/tasks.md:96-107`

问题：

plan 在 S3 双路外部调研里新增了无来源的 `fallback_used/source_family` 失败语义：

- 任一 `fallback_used: true` 或 source_family 冲突时，该路调研失败；
- 结果不进合并；
- 停下向用户报告。

但 spec 的 FR-RESEARCH-03 只定义“双路均空即停”，没有给 S3 外部调研定义 `fallback_used` 或 `source_family` 字段。`fallback_used/source_family` 是 FR-REVIEW-01 三角度盲审 checkpoint 的字段。tasks 的 T009 也没有这套 S3 字段和失败规则。

影响：

plan 把盲审契约错扩到外部调研，给 S3 引入 spec/tasks 都没有的额外字段和停下条件。这破坏薄核心、窄契约，也会让实现者在外部调研阶段加出未授权失败路径。

修正：

从 plan Step 2.5 删除 `fallback_used/source_family` 相关语义。盲审 fallback 失败语义只保留在 Step 2.7 / T011 / FR-REVIEW-01。

### 4. severity: minor

位置：
- `specs/m13-make-decision-v1/cross-artifact-analysis.md:26-35`
- `specs/m13-make-decision-v1/spec.md:286-290`

问题：

cross-artifact-analysis 的 F001 依据不存在。它声称 spec 的 FR-LEDGER-03 有“新想法→判断是否影响方向→影响则回退 S4/S5”的具体判定树，并据此报 plan “只写有回退路径，细节不足”。

但 spec 的 FR-LEDGER-03 实际只要求：新想法若超出当前 task 范围，记录到新 task 候选列表，不得自动扩大当前 task 范围。spec 没有“S4/S5 回退判定树”。

影响：

analyze 产物制造了一个无来源 residual finding。它不是阻断问题，但违反“不假绿不占位”的分析产物要求。

修正：

删除 F001，或改成有真实 spec 来源的 finding。若无真实一致性问题，应只保留摘要，不制造 residual。

## 结论

R2 的 blocking 已解除，当前 blocking_count 为 0。但仍有 3 条 major 需要修正后再过审：

1. FR-REVIEW-03 固定三行格式没有全链路一致。
2. spec 对 OPEN-2 同时写“留存”和“无未决”。
3. plan 把盲审 fallback/source_family 契约错扩到 S3 外部调研。

修完后需要同步更新 `cross-artifact-analysis.md`，不能继续把 FR-REVIEW-03 标为已解决，也不能保留无来源 F001。
