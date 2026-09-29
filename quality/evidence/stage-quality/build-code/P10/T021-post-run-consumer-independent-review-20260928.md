# P10/T021 正式 `run` 后消费方案：独立只读复核（2026-09-28）

范围：只核 `T021-post-run-consumer-path-20260928.md` 的候选接线、当前 P10/spec 与指定实现；未改代码、材料或 Task facts，未跑测试。本复核不证明 P10 完成。

## 结论

`tools/cli/stage-runtime.mjs` 在 `await runOfficialStage(...)` 返回之后有真实接点（现为直接 `return stageResult`，约 1909–1917 行）。CLI 已导入 build-code 的 `capture.mjs`，在这里接一个**仅供 post build-code P10/T021 使用**的私有后置消费者，方向成立；无需第八类公共命令。放到 `runtime/stage/stage-runner.mjs` 里直接导入 `workflows/build-code/case-reconciliation.mjs` 则使 runtime 反向依赖 workflow；保持 CLI 编排，或通过已有 `publication` 私有能力注入，避免该依赖。

**当前仍有阻塞，不能仅加一次调用就说消费已认证。**

1. **入口拿不到它所需的真实对象。** `reconcileCurrentTaskCases`（约 452 行）要 `capture.snapshot_tree/source_digest/targeted_capture/receipt_ref/hash/output_ref/hash`；官方 `run` 输入只有 `receipts.tests` ref。`capture.mjs` 约 329–330 行的旧核对发生在 `verify`，早于正式 `run`。须由实际输入 ref 经 TaskHandle 重读并复核 receipt→output→manifest→每例 reporter，重建受信描述；不能让 CLI 调用者传一份自称为 capture 的 JSON。复用现有解析/核对代码，勿复制第二套。来源认证与业务效果判断要分开：现有对账函数即使原件正确，也会因业务效果缺失返回 `unavailable`；部分选择因 `unmapped_changed_path` 提前返回且没有 `run_consumption_status`（约 608–620 行），不能把其整体 `status` 当来源校验结果。
2. **当前没有逐场景的正式验收来源。** 在当前 indexed Phase 材料中，`acceptance_role` 和 `acceptance_data` 均无声明；post 投影器要求各恰好一张 Task 卡，否则 `acceptanceExecutionFacts` 不执行场景。`projectPostPhaseAcceptanceExecutionData`（约 8154–8221 行）还只接受 `source/sample/scenario/tier/execution`，将该 Task 的全部 AC 复制到每个场景。这不能表达三个 seed 分属 AC-26/27，更不能表达 AC-33 的旧失败→新快照。最小材料与代码修订须先由 build-plan/material owner 指定真实 acceptance Task、每场景精确 AC、真实可执行服务或命令及独立业务判断；投影器验证每个场景的 AC 非空、无重、全属当前 spec 和该 Task，未声明保持 `unknown`。`acceptanceCoverageForExecution`（约 1730–1830 行）再按精确 AC 验原始叶。仅写 `acceptance_data` 或仅补固定测试 ref 不等于业务效果通过。
3. **逐 AC 原件尚不能保存补入的测试回执。** `publishVNextStage` 在单个成功 command/service 叶时传 `executionEvidence`（约 3390 行），`publishAcceptanceQualityFact`（约 2210 行）会直接采用这份叶，跳过新传入的 `evidenceRefs`。因此即使事先给 coverage 加固定回执，最终 `readCurrentEffect` 要求的 `nested.subject_fact.evidence_refs` 中也可能没有该 ref/hash。需在现有验收出版链中保留原叶与固定回执，并测单叶、多叶、缺叶、错回执；不因测试通过把叶状态升为 `passed`。同一 AC 若由多个不同业务情形共同组成，也不能用一份聚合状态为每个情形代言。
4. **消费原件目前不能独立证明“这次 `run` 产生了这些事实”。** `readRunConsumption`（约 385–450 行）核了 locator、当前阶段行 hash、所列质量事实的自身 hash，但没有核 `source.quality_facts` 与这次 `run` 返回的 `quality_fact_refs` 完全一致；它也没有受信的本次写行返回身份作外部输入。只凭一份内容寻址 JSON 写入当前行 hash 和若干同树旧事实，不能证明原件由这次 `run` 生成。P10 材料要求同次写入返回身份和当次事实绑定，且宣称伪造 locator 拒绝。最小修订是在**同次 CLI 返回链**里把实际输入回执、可信 `stageResult.quality_fact_refs`、私有最终行写入身份与刚返回的 locator 一起交给私有认证；核原件列表与本次结果逐项精确相等、当前行仍是写入返回的行，并明确晚些时候单拿 locator 的只读消费者如何取得可信同次来源。若后者无可信载体，应将其结论限为“原件内部关系自洽”，不可称本次 `run` 的独立来源认证。不要用目录扫描或新 `latest` 补洞。

## 最小可行修订顺序

1. build-plan/material owner 先修 P10/spec/index 的真实写集与责任：新增 CLI 接点、`stage-content-contracts.mjs`、`stage-handlers.mjs`、现有验收出版链，以及回执私有描述；当前 P10 约 130 行的写集**没有**这些新增面。明确唯一消费者、替代和删除条件，并独立审材料。没有真实业务观察器时保持 AC-26/27/33 `unknown`。
2. 在 `case-reconciliation.mjs` 提取“由真实 receipt ref 认证固定运行原件”的私有函数，给正式 writer 和 CLI 后置消费者共用；不要从 `verify` 内存返回值倒推第二次执行。来源结果与业务效果结果分开。
3. 修 post 场景精确 AC 投影和现有 `acceptanceExecutionFacts` → `acceptanceCoverageForExecution` → `publishVNextStage` 链，保留原始业务叶与固定回执；生产事实须来自真实场景/独立判断，三 seed 不是 AC-26/27/33 的完整验收。
4. 官方 `run` 成功写行后发布一份来源原件及可选定位字段；CLI 只在已认证的 post build-code P10/T021 且**本次结果**带 locator 时消费。无 locator 或非 P10 走原结果，但不得报告“消费已核”；错 locator、错输入回执、事实列表不等于本次返回、换行/半写要显式失败且不返回成功认证。校验通过但业务缺观察，仍返回业务 `unknown`。若要公开业务诊断字段，先修接口材料；不能借 `quality_warnings` 等别义字段。
5. 定向集成测试要走真实 `verify→run` 接口，负控至少包括旧/新回执、同树另一 `run`、错 locator、无 locator、非 P10、未知/重复场景 AC、单成功叶丢 ref、部分选例和旧失败→新快照。只测来源关系不能作为 AC-33 或 P10 完成结论。

当前方案可继续作为接线设计，**尚不是可直接实施并通过的闭环**。尤其第 2、4 点需要材料 owner 先定真实来源与可信同次绑定；没有它们，应维持 `current_execution_unverified` 与业务 `unknown`。
