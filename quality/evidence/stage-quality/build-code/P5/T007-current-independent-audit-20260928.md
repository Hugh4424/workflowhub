# P5/T007 转换器独立只读核查（2026-09-28）

范围：只核现行 `phases/P5.md` 的 T007、`runtime/stage/stage-end-report.mjs`、就近测试、规则文档和已有正式定向测试原件。未改代码、材料、Task facts，未运行测试；本记录不是正式 Phase review，也不证明 T008 或 P5 完成。

## 已核事实

- 当前模块与测试 SHA-256 分别为 `7828fe354db7cc4507ddd5a503ad9cd97279d81ac1e2d51291b48dab11ba6b43`、`3882d202565978f5e4d3d6a4985bcabccac907263e4e3f53782c79928c353428`，与 `T007-current-official-38c18b52-20260927/before.json` 中两次预检字节一致。该次官方精确命令 `npx vitest run runtime/stage/stage-end-report.test.mjs` 的 canonical receipt/output 显示 20/20、exit 0，测试输出和收据哈希见同目录 `readback.json`。当时材料版本为 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`；当前 P5 材料 SHA 仍与当时相同，但其它 Phase 材料已变化，不能把旧收据称为当前全材料版本的正式验收。
- 三个导出实际存在。转换器会把未完成阶段状态、缺材料、`completion.missing[]`、逐 AC 无有效证据引用、失败命令和非通过 `spec-analyze` 判决逐项写入 `not_done`，每项附原因和来源。普通缺项与谓词 `conflict` 分别写 `missing` 与 `inconsistent`。`source_binding=unavailable` 明示调用者输入未认证；合法 ref/hash 仅为结构候选，不等于来源已核。
- 渲染器把“没做到”放首栏，随后列路线、执行、覆盖限制、人工声明和来源；当前源码对控制字符、HTML 和 Markdown 链接作字面化处理。收集器对缺失阶段结果文件返回缺失事实，对不在证据目录内的命令输出追加缺失事实。现有定向测试及前期专项探针提供局部行为证据，不证明真实 P5 中途报告已生产。

## 未满足与可行动点

1. **人工例外字段不完整。** `docs/architecture/test-asset-governance-rules.md` 报告规则要求每条真实人工例外写声明者、理由、影响范围、到期阶段和 owner；`spec.md` DER-05 也至少要求理由和到期阶段。当前 `humanExceptionDeclaration()` 只要求 `reason` 与 `source_path`，返回结果也只有理由/来源/可选状态。因此缺到期阶段、影响范围、owner 或声明者的对象仍被接受；就近测试只检查缺理由/来源，未检查这些字段。这是 T007 对现行规则的实际缺口。待用户回答“确无例外”的中途报告规则后，由材料 owner 先明确字段合同，再在 T007 写面补可失败测试与实现；不得编造例外凑非空数组。
2. **缺当前全材料版本的正式独立审查和阶段事实。** 官方 20/20 收据绑定的是旧整体材料版本；这份独立只读审查仅指出源码问题，不能替代规定的当前 P5 正式审查。修复后须对确切源码/材料版本重跑 T007 定向门并提交独立审查，且 P5 仍要另核真实同次来源与报告读回。
3. **T008 未完成。** 本审查未把转换器绿色扩大为 P5 报告完成。当前 T008 writer/reader 独立核查记录 `T008-independent-targeted-20260928-02/independent-review.md` 显示真实报告正例仍不可运行、固定三文件未出现；这是另一任务边界。

结论：T007 有真实转换器和同字节 20/20 历史定向证据，但**现行人工例外合同尚未实现，且当前版本正式独立审查/阶段事实缺失**；应记局部实现、尚未完成。不能据此宣称 P5 或全卡完成。
