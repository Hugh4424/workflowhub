# P5/T008 advisory 原件认证：独立复核

日期：2026-09-28。只读审查当前 P5/spec、设计及其独立审查、`stage-runner.mjs`、`freshness.mjs`、定向测试和原始输出；未改生产代码、材料或 Task facts，未另跑测试。本文件只裁决本次 advisory 原件认证的局部改动，不是 P5/T008 或整卡完成证明。

## 结论

**局部改动无阻断问题。** 写侧从本次 `stageResult.quality_advisory_fact_refs` 读取全部质量事实，逐份核规范 ref、原字节哈希、Task、stage、材料版本、代码树及唯一的 `stage_end_spec_analyze`；读侧从 source/certificate 的同序 `{ref,sha256}` 重读同一链，不靠数组位置挑选判决。选中的质量事实继续核唯一 acceptance wrapper、唯一 stage-quality 原件，各层 ref/hash、当前身份和 freshness。四种机器判决分别核质量事实通用状态、wrapper 结果值及 `summary.actual_outcome`、stage-quality 的状态和原判决，并对照 `stageResult.quality_advisories` 原词面；非通过判决不会因通用 `missing` 被误说成通过。

写侧的认证发生在生成 source/certificate/三份固定报告文件之前；`EACCES`、`EPERM`、`EIO` 读故障会使官方 run 显式失败，未写 `report-facts.json`。读侧已有报告时把这三类实际读取故障归为 `unavailable`，内容缺失/错绑归为带具体原因的 `missing`。没有最后的 `report-facts.json` 完成标记时，孤儿文件不被采信。

## 证据和范围

- 原测试和三份源码修改前哈希保存在 `T008-advisory-source-impl-20260928/test-before.mjs`、`before-sha256.txt`；首次有效目标 RED 为 `red.txt`，exit 1，新增目标失败 `authenticateP5AdvisorySources is not a function`。最早一次因本工作树缺 Vitest 的 exit 127 不算 RED。
- `green-target.txt`：目标 1 通过；包括四种判决、错状态/主题/哈希/重复/旧 freshness/错序等隔离负控。`green-error-path.txt`：读盘故障 3 通过；`green-focused.txt`：28 通过、6 跳过，exit 0。哈希见 `after-sha256.txt`。
- 邻接 `green-adjacent.txt`：T007 60 通过、P6 真实入口 18 通过；P13 最终合同 1 通过、2 失败，失败原因均为尚不存在 `P13/final-aggregate.json`。不能称 P13 通过。

## 尚未证明的事

当前 Task 没有可独立核实的真人例外确认，`p5HumanExceptionFromDecisionLog` 仍固定返回 `null`，读侧即使机械来源全合也固定返回 `missing`。所以本次没有发布 CARD-04 正式 P5 报告，T008/P5 仍未完成。隔离正例只证明 advisory 读写链；尚未有真实报告发布后对读侧 `EACCES`/`EPERM`/`EIO` 的故障注入正例，也未完成三文件的真实发布、冲突与重试验收。当前代码的读侧错误分类可静态确认，但其正式行为不能据本次测试宣称已验证。

材料要求坏/缺原件给具体原因：在已有报告的读侧会返回原因；在写侧预检失败时只跳过报告，随后读侧可见的原因是缺完成标记，不能直接定位某份 advisory 原件。此诊断精度仍需在 T008 最终验收中核对，但不把本次局部认证误判为已完成。
