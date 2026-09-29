# P5/T007 advisory 来源修复：独立审查

结论：**有 blocker，不能把本次 GREEN 当成逐条来源已可靠对应或 P5/T007 完成。** 此改动只修好一类“两个数组下标不一致”的错误；对错误、缺失和多条 spec-analyze 判决的来源仍不能可靠闭合。以下是对转换器的审查，不是正式 P5 报告或阶段事实。

## 核过的事实

- 当前生产者在 `runtime/stage/stage-runner.mjs` 先发布 `stageAnalyzeFact` 并把其 ref 放入 `qualityAdvisoryFactRefs[0]`，之后其他非门控事实才追加。因此，对**同一次真实生产、至多一个 spec-analyze 判决且生产者形状正确**的输入，取第 0 项比按 `quality_advisories` 的下标取更合适。通过主题也可能有 fact ref，却不进入 advisory 字符串数组。
- 新负控只覆盖 `other-check:reported` 位于 spec-analyze 提示之前、两个 ref 都存在且第 0 项正确这一种排列。保存的旧字节对该测试 RED（exit 1，1 failed/55 skipped），新字节本文件 GREEN（exit 0，56 passed）；原始 `red.txt`、`green.txt` 与 SHA-256 清单在 `T007-advisory-ref-20260928/`，哈希回读与 `result.md` 相符。相邻测试为 exit 0、15 passed/6 skipped；`node --check` exit 0。RED/GREEN 对这一个下标缺陷有效。
- 两份绿色输出开头均有 `WebSocket server error: Port is already in use`，但测试进程 exit 0，Vitest 完成并列出通过数。该提示不能当成服务运行正常的证明；这里的纯转换器定向测试未依赖 WebSocket 服务，故不推翻上述测试结果。相邻测试跳过的 6 项仍是未覆盖项。

## Blocker

1. `stage-end-report.mjs` 现在对每一个非通过 `stage-end-spec-analyze:*` 都无条件取 `quality_advisory_fact_refs[0]`。现有冻结夹具一次输入三条不同非通过判决，它们会全部指向同一 ref；生产者本来只生成至多一条，此夹具不能证明“每条有自己的事实”。对真实生产者以外的调用者输入，第一项也可能是别的主题，转换器仍把它写为 spec-analyze 来源，没有检测或降级。修复应限制到可验证的一条生产者判决，或提供按主题绑定且经原件回读的映射；不能靠数组位置声称逐条对应。
2. ref 缺失时，转换器可从 `evidenceIndex` 取任一文件名包含 `stage_end_spec_analyze-` 的路径当 `source`，同时才写覆盖限制；ref 错误但非空时，连覆盖限制也没有。`source_binding=unavailable` 的总披露和候选标记保留了“未认证”的大边界，但**单条错误 ref 并未 fail closed**，读者可看到一个不属于该判决的具体来源。应让无可验证对应关系的该条 `source` 指向 `stageResult#quality_advisories[index]` 并明确缺/错源，真实来源由 T008 认证后给出；若继续用候选路径，T008 必须重读原件并核主题、判决、ref/hash、同次身份，拒绝错配。
3. 当前新测试没有负控“首项是别的主题”“首项缺失但索引里有相似文件名”“多个非通过判决都指向同一 ref”。因此 56/56 不能排除上述错误。建议只补这几个有辨别力的定向测试，旧/新字节和输出照留；不跑全量测试。

定位：`runtime/stage/stage-end-report.mjs` 的 advisory 循环约 201–215 行；`runtime/stage/stage-end-report.test.mjs` 新负控约 412–424 行；`runtime/stage/stage-runner.mjs` 的生产顺序约 3084–3095、3315 行；`specs/workflowhub-thin-core-card-04-20260919/phases/P5.md` 当前 T007 要求约 17–23 行及 T008 来源要求约 89–102 行。
