# AC26：分析器判断变成通用 missing 的只读追踪与有界修法

**状态：提案，不是实现或通过事实。** 本追踪未改生产源码、测试、spec/Phase 或 Task store。依据 [P6 八文件原始回测](P6-L0-eight-file-readback-20260927.md)：当时的 E2E 测试 SHA-256 `f470c1ff4885196c9d775c9bb9a6d88e612ef78b5c58fe29af66c4049a0f125e`，`runtime/stage/stage-runner.mjs` SHA-256 `e02b613b5723c08ca1c4bb417aa804f32d5bf60e47fd3fb73d57f774f96128f9`。并行工作可能更新工作树；修复前必须重读当前哈希。该回测的第三个失败是 `analysis_result.status="material_incomplete"`，但 `summary.actual_outcome="missing"` 且 `subject_fact.evidence_state` 不存在；前两项 P5 报告失败另有归属。

## 来源到消费者的精确断点

1. **生产者**：`runtime/stage/stage-content-contracts.mjs` 的 `validateStageSpecAnalyzeProfile` 根据真实材料与证据计算 `material_incomplete`/`inconsistent`/`consistent` 等判决（约 `:6400`, `:6762`）；`runtime/stage/stage-runner.mjs` 的 `currentPostBuildCodeSpecAnalyze`（约 `:4226` 起）把结果及当前材料、快照身份放入 `result.spec_analyze.result`。当期 E2E 已读到真实 `analysis_result.status="material_incomplete"`，所以根因不是分析器没算出判断。
2. **转接处**：`runtime/stage/stage-runner.mjs` 的 `publishStageEndSpecAnalyzeFact`（约 `:2256-2282`）读到 `analyzerResult`，把不一致结果压成通用 `status="missing"`，仅把原值作为 `analysisResult` 传入共用 writer；**没有传 `evidenceState`，也没有单独的验收结果映射**。同函数仍会把原判断写入阶段结果 `quality_advisories[]`，所以阶段结果与两个持久事实不同步。
3. **写入处**：同文件 `publishAcceptanceQualityFact`（约 `:2171-2252`）在 `evidenceState===undefined` 时省略 `subject_fact.evidence_state`（`:2203`）；把 `evidenceState ?? status` 写入 `summary.actual_outcome`（`:2229`），因此落成 `missing`；将 `subjectStatus="missing"` 经 `acceptanceResultForSubjectStatus`（`:1792-1798`）写成 `acceptance.result="deferred"`（`:2226`）。质量事实自身仍为 `status="missing"`，其 ref/hash 绑到这两个持久文件。
4. **校验与消费者**：`runtime/evidence/acceptance-evidence-validator.mjs:6,32` 已允许 8 个验收结果，包括 `incomplete`、`inconsistent`、`unavailable`；`runtime/evidence/freshness.mjs:315-321,744` 接受 `quality-fact.status="missing"` 搭配这些非终态验收值，不把它判为通过；`runtime/evidence/quality-store.mjs:118-122,162` 把这些值归入不完整。`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 的“诚实性-1”从真实 CLI 临时任务回读 wrapper 与 stage-quality，断言原机器值可见，因此抓到了断点。`runtime/stage/stage-end-report.mjs` 目前从 `stageResult.quality_advisories[]` 提取机器判决并列入 `not_done`，但纯转换器及报告输出仍需 P5/T008 的认证生产者；不能拿其局部测试绿色代替真实报告。

## 建议的最小修法和写面

- **只为 `stage_end_spec_analyze` 这条生产路径**在 `publishStageEndSpecAnalyzeFact` 显式传原始 `analyzerResult.status` 作 `evidenceState`，令 `subject_fact.evidence_state` 与 `summary.actual_outcome` 保留原词面。例如 `material_incomplete` 必须仍写 `material_incomplete`，不能只改成映射后的 `incomplete`。
- 在共用 `publishAcceptanceQualityFact` 增一个经过明确白名单校验的可选验收结果参数，仅由分析器调用。建议非通过映射：`material_incomplete → incomplete`、`inconsistent → inconsistent`、`unavailable → unavailable`。`consistent` 与 post build-plan 的 `reported` 保持通过；`unknown`、缺分析结果及其他允许形态须显式定为非通过，不可默认通过或伪装已有分析。报告层现有 `skipped → unavailable` 仅是报告投影，若要写为验收结果，也需明确独立规则和来源。不要仅凭 `quality-fact.status="missing"` 再推导验收结果。
- **保留** `quality-fact.v1.status="missing"`、stage-quality 外层/`subject_fact.status="missing"` 的粗粒度非通过形状与 `stage_end_spec_analyze` 的 advisory 属性；不把 `incomplete` 塞进 `quality-fact`（该 schema 的 `incomplete` 仅适用 `kind="coverage"`），不新增推进门。新值只进入已支持的 `acceptance.result` 和分析器细节槽位。
- **不要全局改** `acceptanceResultForSubjectStatus("missing") → "deferred"`：`tests/deferred-acceptance-semantics.test.mjs` 当前明确锁定该泛用映射，其他主体还通过它发布。泛用 `missing` 的语义收敛是另一项生产侧工作，不能为了 AC26 改坏所有历史读者或把所有未知主体都解释成 `material_incomplete`。

拟由 **build-plan 材料 owner** 将 P6/T012 的受保护写面精确补入 `runtime/stage/stage-runner.mjs` 与一个增量的 `tests/contract/post-phase-official-handler.test.mjs` 断言，并与 P5/T008 对同一生产文件的并行改动串行合并。P6 当前旧写面只允许 `stage-content-contracts.mjs` 的 T013 修复，不能拿旧授权直接声称此处已获审查。`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 的既有“诚实性-1”是独立真实消费者断言；其 P1-only 报告期待另按 P6/T012 现行修订处理，不能删除其他失败来凑整体绿色。无需为此改 `runtime/evidence/acceptance-evidence-validator.mjs`、`runtime/evidence/freshness.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/stage/completion-predicates.mjs` 或公共 CLI。

## 需新增或重跑的正反验证

1. 同一真实 post build-code 阶段夹具产生 `material_incomplete`：从 quality fact → wrapper → stage-quality 按 ref/hash 回读，依次得 `quality-fact.status="missing"`、`acceptance.result="incomplete"`、`summary.actual_outcome="material_incomplete"`、`subject_fact.evidence_state="material_incomplete"`、`analysis_result.status="material_incomplete"`；阶段结果保留 `stage-end-spec-analyze:material_incomplete`，完成条件不因这项新增门。
2. `inconsistent`、`unavailable` 分别保留原词面，wrapper 用对应非通过结果；`consistent`/`reported` 正例仍按既有成功语义，不被写进报告 `not_done`。
3. 负控：缺分析器结果、未认证或伪造的 status、坏 ref/hash 均不可产出 `pass` 或当前已认证分析事实；其他普通主体的 `missing` 映射仍不被本次专用映射改动。验收 reader 回读须保持非通过，不因新 8 值产生 `passed`。
4. 真实 E2E“诚实性-1”需独立绿色，并核对第二个 `evidence_state` 断言实际执行；旧回测在首个 `actual_outcome` 断言失败，所以当时不能声称第二个断言也独立通过/失败。

有界验证命令（增量测试名称由实现者定，再以当前材料/源码哈希绑定）：

```sh
npx vitest run tests/contract/post-phase-official-handler.test.mjs -t 'post build-code'
npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs -t '诚实性-1'
npx vitest run tests/deferred-acceptance-semantics.test.mjs tests/contract/acceptance-result-machine-classes.test.mjs
```

P5 报告生产者和 E2E 合同也修好后，另跑 P6 原八文件精确综合门及 P6 各自要求的单独命令；这些后续命令的绿色只能按当时原始输出、版本和独立审查判断。
