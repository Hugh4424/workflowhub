# P10/T021 正式写入与读取接线独立审查（2026-09-28）

范围：只读审查当前接线设计、P10 合同、上一轮读侧审查，以及现有 `stage-runner`、`freshness`、`case-reconciliation`、TaskHandle/TaskKernel。未改生产代码、Phase 材料或 Task facts；未运行测试。

## 结论

设计的身份来源与失败边界基本正确，适合做**失败时不发布定位值**的局部实现；现在还不能据此宣布 T021 或 P10 完成。正式写入端尚未存在，现有逐条验收事实的生产来源和完整业务案例映射也不足以触发成功路径。旧读侧测试整文件仍是 54 通过、3 失败，不能算通过。

## 已核实的可用接线

- `runOfficialStage` 的 `input.receipts.tests` 是本次调用的克隆输入；`verifiedHandlerResult` 在 handler 闭包内已完成正式校验。须显式保留它的 tests facts 到同次闭包，不能等 `runStage` 返回后再从调用者 JSON 猜。见 `stage-runner.mjs:4779-4804,4958-4960`。
- `runStage` 返回本次发布的完整主 `quality_fact_refs` 和最终 `stage_reflection`；后者已有私有、不可枚举的 `stage_row_write`，来自最终 `writeStageRow` 的 `{ref,sha256,value}`。见 `stage-runner.mjs:1201-1214,3704-3711`。不能改成读“当前行”推断本次作者。
- TaskKernel 的 `publishCanonicalRecord` 已允许 `quality/evidence/...`，create-only 与同字节幂等由现有 API 支持；TaskHandle 的 `readRecord` 能受控重读原件。内容哈希路径可用，不必新建 TaskHandle 写接口。见 `task-kernel-implementation.mjs:837-845,874-895`、`task-handle.mjs:659-670`。
- 先记当前阶段行原字节/hash、读全部原件后再记一次，能拒绝两次读取之间行被替换；发布后到使用前若又变化，下游再读也会拒绝。相同字节的 ABA 和手写同形原件不能靠哈希证明作者；方案已正确限定这一点。不得对外声称独立并发作者证明。

## 阻塞与最小修订

1. **成功路径缺生产来源。** 方案要求按固定回执、当前业务目录和独立测试库存推导选中的每个验收项，并要求本次 `quality_fact_refs` 对每项有一条指向该回执的真实质量事实（设计第 15–21 行）。现有 `case-reconciliation` 的完整读取链需要 `capture` 与当前选择结果；正式 `runOfficialStage` 没有这个受信描述。当前 post 验收投影还把一个验收 Task 的全部 AC 分给每个场景，不能给各场景准确归属（`stage-content-contracts.mjs:8154-8221`）。仅在 `stage-runner/freshness/case-reconciliation` 搬读者，不能制造缺少的生产事实。先明确一个实际、受信的 P10 回执→选择→逐 AC 事实入口和真实效果观察来源；若需要扩大写面，先修 P10 材料。之前可实现缺来源即无定位值的分支，但其测试只能证明拒绝，不能作 T021 正控。
2. **真实消费者尚未接上新定位值。** 当前唯一生产调用 `capture.mjs:329-330` 在正式 `run` 之前执行 `reconcileCurrentTaskCases`，没有也不可能拥有 `p10_consumption_evidence`；其余调用是测试。设计只写“调用方显式传入”，未点名正式 `run` 返回后哪个现有消费者真正传值。最小修订：在当前授权写面和材料内标出这个实际调用点并做从正式 `runOfficialStage` 返回定位值到对账 reader 的集成正控；若本卡只要求可供调用的私有入口，就明确保留业务对账未被生产调用的限制，不能说整个消费链已接通。
3. **读侧作者证明必须保持有限。** 现有 `readRunConsumption` 会认证原件列出的 ref/hash、当前行和事实，却不能独立证明清单等于本次 `runStage` 的完整返回，也不能证明原件由 `runOfficialStage` 写入（`case-reconciliation.mjs:385-449`；上一轮独立审查第 3 点）。正式 writer 必须把完整原数组与本次私有行返回直接组装，再发布、重读、只返回这次产生的定位值；测试不得手写原件充当端到端正控。`freshness.mjs` 只留一份完整认证，`case-reconciliation` 只调用它；不要反向把 workflow 模块导入 runtime 来复制另一套认证。用户或其它磁盘写入者手造同形文件仍不属于现有哈希能排除的威胁范围。
4. **现有测试失败仍需逐项隔离。** 上一轮整文件为 54 pass / 3 fail；冻结旧读者仅证明一项复用 Task 污染。按设计第 40–42 行逐项对照旧版与新版、隔离夹具，再跑同一整文件并交独立审查。不能用一条合成正控或删断言宣布合同已绿。

## 失败与结果边界

- 缺固定回执、最终行、任一真实逐 AC 来源时：不发布原件及定位值，普通阶段结果保持原状，业务结果为 `unknown`。这符合当前 P10 的“缺来源不冒称通过”，但表示 T021 仍未完成。
- 满足全部前置条件后发生写盘、哈希或身份错误：显式报错，不返回成功定位值；已写的不可变质量事实和阶段行保留，不能回滚、覆盖或写假成功。`publishVNextEvidence` 的异字节 `EEXIST` 拒绝和同字节幂等可复用。
- 一份消费原件只能证明“指定测试回执曾真实执行且本次正式运行读取了它”；它不能证明每项业务效果通过，也不能把旧 `verify` 的 `dispatch_state=executed` 移植到新 `run`。当前 AC-26/27/33 效果与大量未映射改动仍为未知。

独立审查结论：**有条件认可局部接线设计；拒绝把局部 writer/reader 绿灯提升为 T021、P10 或整卡完成。**
