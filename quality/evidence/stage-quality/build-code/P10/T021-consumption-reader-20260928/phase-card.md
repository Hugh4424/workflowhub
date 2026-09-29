# P10/T021 本次 run 消费原件：读侧卡片

范围：只改 `workflows/build-code/case-reconciliation.mjs` 与 `tests/contract/build-code-case-reconciliation.test.mjs`。不改官方写入器、`freshness.mjs`、Task facts、Phase 材料或固定 capture。

原件格式 `workflowhub-p10-run-consumption.v1`：`task_id`、`stage=build-code`、`snapshot_tree`、`material_revision`、`source_digest`、`test_receipt:{ref,sha256}`、`test_output:{ref,sha256}`、`stage_row:{ref,sha256}`、`quality_facts:[{ref,sha256}]`。原件自身在 `quality/evidence/stage-quality/build-code/p10-consumption-<sha256>.json`，公开 locator 只有 `{ref,sha256}`。`stage_row` 取本次 `writeStageRow` 返回的 ref/hash；按 `facts.jsonl#N` 对应原行连同换行重读。`quality_facts` 恰是本次 `runStage` 返回的完整 refs/hash；读侧只据此选 test 与逐 AC 事实，绝不在显式 locator 路径扫描全 Task。output 必须匹配 receipt 内 ref/hash；固定 receipt→output→manifest→reporter 仍由原有读者认证。

owner：CARD-04 build-code 官方 `runOfficialStage` 写入器。唯一生产 consumer：P10/T021 对账读者；verify-code 可只读抽查。替代关系：补当前阶段行没有回执/fact 引用的缺口。删除条件：现有受信链或经同等错绑、换行、缺事实负控证明的等价机制接管后删除此专属分支，已发布原件只读保留。

验收：原件 ref/hash、当前最终阶段行原字节、Task/树/材料、实际输入的回执与输出、全部当次事实 refs/hash 和每个选中 AC 的精确来源均相符。错 locator、错回执、错事实、漏 AC、另一同树 run 的事实、换当前行、半写均保持 `current_execution_unverified` 与业务 `unknown`。来源成立只证明测试曾执行并被本次 run 消费；AC-26/27/33 的真实效果来源未建，不能从绿色测试推通过。

冻结旧字节：`before-case-reconciliation.mjs` 和 `before-build-code-case-reconciliation.test.mjs`。测试限本合同及确有必要的邻接项，保存同一目标 RED 与 GREEN 原始输出，交独立 reviewer 裁决。
