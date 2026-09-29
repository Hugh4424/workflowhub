# P5/T007 判决来源窄修：独立代码审查（2026-09-28）

## 结论

**本次窄修无 blocker。** 结论只覆盖 `stage-end-report.mjs` 对非通过 `stage-end-spec-analyze` 的逐条来源呈现及对应测试，不代表质量事实原件已认证、T008 报告已发布或 P5 完成。

## 核对

- 当前生产代码和最终测试 SHA-256 分别为 `3bcf947bcf6f3de9c14469bfc3d1fc80bd192b1c92449d770bc03e305109038d`、`2111a0a0ffc9f2603415d01451d2ad45877bbcf7d8a4befbe07e3e62f1f96cee`，与 `T007-source-impl-20260928/sha256.txt` 和保存的最终字节一致。实现差分仅改 advisory 的来源选择及逐条限制披露；测试差分仅修冻结断言第④来源、冲突的不同位置正控、相应注释，并在同一来源断言增加有路径输入。
- 代码用 `quality_advisories` 的原数组下标生成 `stageResultPath#quality_advisories[n]`，无路径时使用 `input.stageResult#quality_advisories[n]`。非该主题的首项不会改变下标；多条非通过判决不再共用首个裸 ref；首个 ref 缺失也不会借相似文件名。每条均写入“原始质量事实来源未核”，`sources` 登记同一指针。
- 三种判决分别保留 `incomplete`、`inconsistent`、`unavailable`，原因仍带原机器词面、阶段和主题；`consistent`/`reported` 不加入 `not_done`。原测试的数目、状态、原因和通过负控未被放宽。
- `collectStageEndReportFacts` 把实际读入的 `stageResultPath` 交给同一转换器；`renderStageEndReport` 逐条输出 `not_done.source` 与 `coverage_limits`，没有另行猜测裸质量 ref。转换器始终保留 `source_binding: unavailable`，所以指针只说明本次输入中的判决位置，不认证阶段结果或底层质量事实。
- 同一最终测试字节对旧生产代码为 **6 failed / 54 passed，exit 1**；对新代码为 **60 passed，exit 0**。失败堆栈对应旧代码将首个 ref/相似文件名误作来源；输出见 `final-test-red.txt`、`final-test-green.txt`。相邻 P5 来源合同记录 **25 passed / 6 skipped，exit 0**；它在最后增加有路径断言之前运行，之后生产代码未变。保存的测试输出没有 WebSocket 警告；shell 调用出现的 `starship` dumb-terminal 提示不在 Vitest 输出内，也不影响本次裁决。

## 未覆盖

这里没有独立重跑测试，也没有验证正式 Task 的 advisory 质量原件、P5 人工声明或真实中途报告。上述相邻测试的 6 项仍是跳过项，不计作通过。
