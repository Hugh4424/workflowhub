# P5/T007 人工例外字段提案：独立只读审查

日期：2026-09-28。仅核对现有材料、源码和测试；未改产品代码、材料或 Task facts，未运行测试。审查对象：`T007-human-exception-contract-proposal-20260928.md`。

## 结论

字段补缺方向有现行规则依据，但提案尚不能直接作为真实 P5 报告的完整实现合同。先定清字段名称与到期值，再做 T007 定向 RED/GREEN；T008 真实来源映射另按其写面处理。零例外语义继续待用户对**中途报告**的答复，不用测试夹具代替真实声明。

## 可行动问题

1. **字段语义有来源，精确名称没有全部冻结。** `docs/architecture/test-asset-governance-rules.md:45` 要求人名、理由、影响范围、到期阶段、owner；`spec.md:320` 明确理由、到期阶段；`source_path` 来自报告每条结论有来源的规则及现有 T007 输入/输出。故六项语义可支持，但 `impact_scope`、`expires_at_stage` 是提案新命名。真实 P5 夹具/reader 当前使用 `scope`、`expires_at_phase`（`tests/contract/p5-same-run-report-source.test.mjs:165`、`runtime/evidence/freshness.mjs:1202-1211`），writer 只传 `reason/source_path`（`runtime/stage/stage-runner.mjs:4712-4713`）。由 build-plan owner 在材料中选定名称，写明 T008 原件到 T007 的显式映射；T007 两文件不能顺手改 T008 writer/reader。若保持新名，单测必须说明仅测试转换器，不能宣称真实生产接通。
2. **到期阶段不能只验非空文本。** 当前 reader 接受 `expires_at_phase` 形如 `P<n>` 且数字至少 5（`freshness.mjs:1202-1211`）；提案的 `expires_at_stage` 只要求非空字符串，`never` 也会通过。材料须明确类型、允许的阶段值/范围以及与现有 `expires_at_phase` 的关系；负控覆盖错误格式和越界值。不得由实现者凭猜测新增一套到期语义。
3. **反例和直入渲染口仍需补足。** 提案只明确新四字段缺失/空白及旧两字段空白；应对六字段逐个做缺失、空白负控，并保留机器状态负控。`renderStageEndReport` 可直接消费调用方构造的 facts，目前只检查 `reason/source/status`（`stage-end-report.mjs:250-255`），因此新增六字段后，渲染器也应逐项验证，防止绕过转换器把不完整声明渲染成完整报告。正例要同时断言 facts 保留字段、Markdown 逐项显示字段与来源，并用已有字面化函数处理特殊字符。
4. **来源与授权不能混同。** `source_path` 仅是调用方给的路径；T007 注释已写明输入未认证（`stage-end-report.mjs:38`），当前 P5 writer 固定返回无可确认人工声明（`stage-runner.mjs:4600-4605`），reader 最终也返回缺独立用户确认（`freshness.mjs:1230-1233`）。保留原声明字段、来源路径和后续原件字节；通过六字段单测不能宣称真人授权或 T008 报告完成。
5. **写面与零例外边界基本守住。** 提案的代码/测试改动限于 P5/T007 两文件，符合 `phases/P5.md:8,21`；其材料修订建议须由 post build-plan owner 执行。提案明确不改空数组/`not_done=missing`/渲染拒绝，这与 `phases/P5.md:23` 当前待决边界一致。用户对最终报告的答复不能自动作为 P5 中途报告的决定。

本审查只指出合同缺口；不判定 T007、T008 或 P5 完成。

## 修订稿复核（同日）

已重读修订提案及当前 `phases/index.md`。上述第 1 至第 3 项在**提案层面**已闭合：现在沿用真实来源的 `declared_by/reason/scope/expires_at_phase/owner`，另保留 `source_path`；T007 仅验 `P<n>`、安全整数且 `n>=5`，明确不把格式有效的 `P999` 说成当前任务有效，T008 后续按认证 index 核存在性；六字段各自缺失/空白、坏到期、机器状态和直入渲染负控均已列入。`verbatim` 作为可选透传但出现时不得空白，也有正反例。当前 index 确为 P1..P13。

零例外合同、T008 writer/reader 映射和真人授权仍是**另外的未完工作**。修订稿对此有清楚边界，未越 T007 两文件写面；不构成本轮代码、测试或 Phase 通过结论。文字小错：定向步骤序号出现两个“3”，后续整理即可，不影响技术合同。
