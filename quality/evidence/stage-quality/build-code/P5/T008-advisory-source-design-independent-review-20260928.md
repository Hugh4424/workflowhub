# P5/T008 advisory 来源设计：独立只读审查

日期：2026-09-28。范围仅为 `T008-advisory-source-design-20260928.md`、当前 P5/spec、`stage-runner.mjs` 写侧、`freshness.mjs` 读侧，以及 CARD-04 Task store 现有 `stage_end_spec_analyze` 质量事实和它指向的两层原件。未改生产代码、材料或 Task facts；未运行测试；本文不是 P5 完成或正式报告认证。

## 结论

**方向成立，现稿有两处实施前必须补的检查。** 当前生产者确实把 `stage_end_spec_analyze` 质量 fact 放进 `quality_advisory_fact_refs`，非通过判决另放进 `quality_advisories`；两数组不能按下标配对。CARD-04 Task store 中一份 build-code 原件 `quality/facts/3f3f4cbc97f9c1709a4b454c1bcf51d116c50b7021912cda6bd8ddfdb929423e.json` 的 `status=missing`，其 wrapper `summary.actual_outcome=inconsistent`，阶段质量原件 `subject_fact.analysis_result.status=inconsistent`，证实必须读原始判决，不能用通用状态冒充。该记录属于旧代码树/旧材料，仅用于核字段形状，不能用作当前 P5 正例。

## 必须修订

1. **同时核通用状态与原始判决的对应关系。** 现稿只要求 `summary.actual_outcome`、`analysis_result.status` 和 `quality_advisories` 同词面；一个被改成 `kind=review` 或 `fact.status=passed`、但原始词面仍为 `inconsistent` 的质量事实，照现稿可过。生产者在 `publishStageEndSpecAnalyzeFact` 中固定写 `kind=acceptance_criterion`；`consistent` 对应 fact / 阶段质量状态 `passed`、wrapper `result=pass`；`material_incomplete` 对应 `missing` / `incomplete`；`inconsistent` 对应 `missing` / `inconsistent`；`unavailable` 对应 `missing` / `unavailable`。写侧和读侧都应核这个映射，并核阶段质量外层 `status` 与 `subject_fact.status`、wrapper `result`，不能让同一原件一边说“通过”、另一边说“不一致”。这里的 `missing` 只是一层通用状态，**不得**被拿来替代原始判决。为四种词面各做正例或针对性负例，尤其加“原词面一致但通用状态或 kind 错”的反例。

2. **验收包装的 freshness 也要与它的 ref 链完全一致。** 现稿仅核 `freshness.snapshot_tree/material_revision`，未核 `freshness.status=current`，也未核 `freshness.evidence_freshness` 恰好一条、其 `ref/sha256/status` 与 wrapper 唯一 `refs` 条目相同。这样一个自称 `stale` 或内部指向另一原件的包装仍可被当作当前来源。生产者在 `publishAcceptanceQualityFact` 中固定写一条 `current`，读侧按该精确结构检查；对 `fact.evidence` 和 wrapper `refs` 也明确要求 **数组长度恰为 1**，而非只在多个条目中找到一条同主题匹配项。加 `stale`、错 ref/hash、第二条条目负控。

## 其余边界

- 现稿正确要求 source、certificate、`stage_result` 三处 advisory 列表同序相等，质量 fact 原字节哈希、规范路径、`fact_id`、Task/stage/材料/tree 一致，并按主题选唯一原件。真实 `quality_advisory_fact_refs` 还可包含别的质量事实；逐一核身份、只沿唯一 `stage_end_spec_analyze` 走三层链，是合理做法。
- 对 `consistent`，生产者仍发质量 fact，但不发 `stage-end-spec-analyze:` 字符串；现稿正确把“零条字符串 + 一份 consistent 原件”列为局部正例。对非通过判决，必须恰有一条对应字符串；多条或未知词面拒绝。
- 写侧当前 `p5HumanExceptionFromDecisionLog()` 固定返回 `null`，读侧最后固定返回 `missing`。本设计的隔离夹具只可证明机械来源检查；**不得**据此打开当前正式五文件报告、把通用 `human-confirmation.v3` 当 P5 真人例外许可，或把旧同树/旧材料记录称作本次事实。中途报告若确无例外，仍待用户对该报告写法作决定。
- `publishP5SameRunSource` 现有预检包在 `catch { return; }` 内；若新 advisory 读盘检查放入其中，权限/设备读故障也会被静默当作缺材料。应只对确实缺失或陈旧的输入返回“未完成”，把 `EACCES/EPERM/EIO` 等读取能力故障保留为可见的失败/不可用原因；不要写报告完成标记。
- 现有先写四件、最后写 `report-facts.json` 的次序正确；读侧先找完成标记再认证全部原件。写中断可能留下前四件孤儿，不能把它们当认证报告。新增 advisory 认证应在写第一件之前完成，读侧应在事实层重算之前完成，保持这个失败关闭边界。

落实前两项和对应负控后，可实施这条局部机器来源链。当前 CARD-04 仍缺真实 P5 人工来源及正式报告，P5/T008 不完成。
