# P5/T008 机械接线独立审查（2026-09-28）

范围：只读检查当前 `runtime/evidence/freshness.mjs`、`runtime/stage/stage-runner.mjs`、`tests/contract/p5-same-run-report-source.test.mjs`、P5 材料及 `T008-mechanical-20260928/` 原始测试输出。未改生产代码、测试、材料或 Task facts；另用两次只读 `node --input-type=module` 最小输入直接复现解析器行为。本审查不是 P5 完成证明。

## 发现

1. **中等，机械接线的单一声明要求未满足** — `runtime/evidence/freshness.mjs:1038-1044` 只数 `## 人工例外声明` 标题，以及从该标题找到的**第一块** JSON；没有限制 JSON 必须位于这个章节内，也没有拒绝同一章节中的第二块 JSON。实测：声明标题写“此处没有声明”，下一个 `## 其它内容` 章节才放 JSON，函数仍返回 `accepted:true`；同一声明章节放两块内容不同的 JSON，函数仍返回第一条 `reason:"First"`。这与 P5/T008 的“恰好一条、来自唯一声明块”设计冲突，也会使 `source_path` 指向错误章节。应先截取唯一声明章节，限定其中恰好一块 JSON，再解析和哈希；在 `tests/contract/p5-same-run-report-source.test.mjs:226-250` 加这两个负控。现有测试只拒绝**两个标题**或一个 JSON 数组内两条声明，未覆盖两个 JSON 代码块或跨章节取块。

## 已核对的边界

- **正式发布仍关闭。** `runtime/stage/stage-runner.mjs:4601-4610` 解析后固定返回 `null`，`:4677-4678` 因而不写报告；`runtime/evidence/freshness.mjs:1249-1252` 即使前面机械核验成功仍返回 `missing`。没有使用 `human-confirmation.v3`；隔离夹具、自称真人批准、旧材料都不会因此成为 CARD-04 的正式报告来源。
- **六字段和原话的机械传递已接上。** 写侧 `runtime/stage/stage-runner.mjs:4717-4721` 和读侧 `runtime/evidence/freshness.mjs:1231-1248` 都传 `declared_by/reason/scope/expires_at_phase/owner/source_path` 与 `verbatim`，读侧重读材料并逐字重算事实及 Markdown。`source_ref` 由 writer 的材料引用生成；reader 自己从 `ArtifactDir` 重新取引用和原文，而非直接信任 source 自报。当前 `phaseFilesFromIndex` 拒绝重复、错路径、非连续阶段；scope 显式写出的每个 AC ID 均要求在同次链中，P99/混入不存在 AC 的测试已覆盖。
- **测试边界明确。** `red.txt` 为 1 失败/18 跳过、exit 1；`green-target.txt` 为 13 通过/6 跳过、exit 0；`green-six-field.txt` 只有解析→T007 转换器一项通过。六个跳过是需要独立真人来源的正式发布/冲突/故障路径，当前没有正例证明正式 writer→reader 成功，也没有 CARD-04 本人例外声明。`README.md` 所称“parser checks one declaration”须在上面缺口修复后才能成立。

结论：当前 CARD-04 报告保持 `missing/not_done` 是正确的。机械解析尚有一处可复现缺口；补两个负控并修解析器后，可重新评估该局部接线。真人来源和“零例外”规则仍待单独确定，不能据此放开正式发布。
