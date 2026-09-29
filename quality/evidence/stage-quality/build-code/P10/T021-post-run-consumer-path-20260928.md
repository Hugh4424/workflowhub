# P10/T021：正式 run 后的真实消费路径（2026-09-28）

只读核查。对照 P10/T021 writer/reader 设计及独立审查，沿现有 `verify`、`run`、验收事实与案例核对入口定位两条缺口。未改生产代码、Phase 材料、Task facts，未跑测试。本文件是候选接线图，不证明 P10 已完成。

## 现在的实际调用顺序

```text
verify --action=execute --stage=build-code
  → tools/cli/stage-runtime.mjs: capture-tests
  → workflows/build-code/capture.mjs#runCapture
  → #runFixedTargetedCapture：当前变更→目录/独立库存→选中 case→真实子进程
  → canonical test receipt→output→child manifest→每个 case 的原始 reporter
  → capture.mjs:329-330 #reconcileCurrentTaskCases（此时尚无正式 run）
  → 返回 receipt_ref 等；这个时间点绝不可能有“本次 run 的消费原件”

run --action=execute --stage=build-code --input=<receipts.tests=上述 ref>
  → tools/cli/stage-runtime.mjs:1909 #runOfficialStage
  → stage-handlers.mjs#testFacts：从实际 receipts.tests 认证回执和 output
  → #acceptanceExecutionFacts/#acceptanceCoverageForExecution：阶段场景和逐 AC 投影
  → stage-runner.mjs#runStage/#publishVNextStage：本次 quality_fact_refs
  → #runStageEndReflection/#withStageRow：最终 writeStageRow 返回身份
  → #runOfficialStage 返回 stage-runtime-result.vnext
  → tools/cli/stage-runtime.mjs:1917 目前直接 return；没有后置 P10 核对
```

`capture.mjs` 里的现有核对保留：它证明 `verify` 当次的测试来源，不能伪装为正式 `run` 的消费。新消费者必须接在第二条路径的 `await runOfficialStage(...)` **之后**。

## 最小生产者候选：复用同一验收事实出版链

1. **回执→选中案例**已有可信起点：固定测试回执绑定的 output 指向 child manifest；manifest 记录所选 case ID、当前业务目录/独立库存版本、每例原始 reporter。`case-reconciliation.mjs:452-600` 已把当前变更、目录、库存和这些原件交叉核过，并从当前目录每个选中 case 的 `ac_ids` 推出应有 AC。不要让调用者自报所选 AC，不从旧 `verify` 的 `dispatch_state` 推断这次 `run` 新跑过测试。
2. `runOfficialStage` 现在只有 `receipts.tests` ref，没有原 `verify` 的内存 `capture` 对象。最小私有适配是让 `workflows/build-code/case-reconciliation.mjs` 从**实际回执 ref**及 TaskHandle 读原字节/输出/manifest、重算当前选择并返回一个已认证的 `{receipt,output,selected_cases,selected_ac_ids,source_digest}`，让正式 writer 和后置消费者共用；不能再要求调用者传一份可伪造的 capture JSON。可提取现有 `reconcileCurrentTaskCases` 前半段为内部复用函数，保留原 `capture` 公共兼容入口，避免第二套解析器。`runtime/stage/stage-runner.mjs` 若需动态调用这个 workflow 私有适配，属于明确的跨层写面，须由 P10 案例核对 owner 与 stage producer owner 共同审查、在材料中登记；不能暗加新公共命令或第二份 receipt。
3. **案例→逐 AC 事实**应挂在现有 `acceptanceExecutionFacts` → `acceptanceCoverageForExecution` → `publishVNextStage`，不另造平行验收 fact writer。当前 post 投影 `stage-content-contracts.mjs:8154-8221` 只允许 `source/sample/scenario/tier/execution`，把验收 Task 的全部 AC 分给每个场景；三个 seed 的 AC-26/27 分属不同案例，用它无法准确归属。候选修订：build-plan owner 先在当前 Phase 材料允许每个场景声明经过当前 spec 核对的 `acceptance_criterion_ids`，投影器核它非空、无重复、全在该 Task 已声明 AC 集内；未声明则继续 `unknown`，不得把全 Task AC 自动填给场景。`acceptanceCoverageForExecution` 用场景的精确 AC 集核原叶；按**已认证选中 case→AC 映射**把固定回执 ref/hash补入对应 AC 的 `evidence_refs`，但不改场景本来计算出的 status。`publishAcceptanceQualityFact` 的单成功叶 `executionEvidence` 快捷路径会忽略外加 refs，需要让一叶和多叶都保留原叶及固定回执并分别测试。回执证明测试发生，原叶/独立 oracle 才证明效果；不能只因 ref 齐全就写 `passed`。
4. 必须另有实际业务观察来源才能完成 AC-26/27/33：AC-26 的诊断/报告链、AC-27 的机器类别与延期情形是不同场景、AC-33 的旧失败和新源码快照复验都不能由三份绿色测试或一份聚合 fact 代替。在它们未建前，writer 不应产生可被误解为完整逐 AC 来源的 locator；`run`、对账仍报 `unknown`。当前大量未映射改动使案例选择 `unmapped_changed_path`，即便三 seed 有原件也不等于全范围覆盖。

这一候选的必要扩写面：`runtime/stage/stage-content-contracts.mjs`（post 场景精确 AC 解析及验证，owner=post 材料/验收合同）、`runtime/stage/stage-handlers.mjs`（现有场景→逐 AC coverage 消费，owner=build-code handler）、`runtime/stage/stage-runner.mjs`（现有 AC fact 出版与回执补充，owner=stage producer）、`workflows/build-code/case-reconciliation.mjs`（固定回执私有读描述，owner=P10 案例核对），及各自定向测试；Phase P10/spec/index 必须先由 build-plan owner 写明跨层 consumer、唯一 owner、替代关系与删除条件并交异源审查。不得只在 stage-runner 里手写 `quality/facts/` 或从目录扫描挑一条看似匹配的事实。

## 最小真实消费者候选：现有公共 run 返回前

**推荐接点**：`tools/cli/stage-runtime.mjs` 的 `command === "run"` 分支，`const stageResult = await runOfficialStage(...)` 之后、现有 `return stageResult` 之前。条件只限 post build-code、当前阶段 P10/T021、有正式返回的 `p10_consumption_evidence`。用同次 `suppliedInput.receipts.tests` ref、当前 `context.task/context.workspace` 和 `stageResult.p10_consumption_evidence` 调上述从回执重建的私有 P10 对账入口；它会把 locator 显式交 `freshness.mjs` 唯一 reader，复核当前行、完整原件、选中 AC 和业务效果。`run` 返回前再核当前行未变；不能回头调用 `capture.mjs` 的 pre-run `reconcile` 当作后置结果。

两种输出边界：

- **不扩公开结果的最小接线**：后置调用用于核来源。其认证失败时按现有“已写行、无成功 locator”原则显式报错；来源认证通过但业务未观察或覆盖不全时继续返回原 `stageResult`，公开结果仅保留 P10 已批准的可选 `{ref,sha256}` locator。定向集成测试必须证明确实调用了后置 P10 对账、传的是刚返回的 locator 和实际回执；用户看到 locator 仍只能解读为来源位置，不能称业务通过。若需公开业务诊断，不能把它塞进旧 `quality_warnings` 等别义字段。
- **需材料先修的可观察输出**：在 `stage-runtime-result.vnext` 另加一个只读、可选的 P10 对账诊断字段（明确 `unknown/unavailable` 与原因），由上述调用的真实返回填入。当前 P10 材料只允许新增 `p10_consumption_evidence` 一个公开定位字段；若选择新增诊断字段，先请 stage-runtime 接口 owner、P10 owner 和 build-plan owner修改材料/登记消费者及兼容测试。不要用新字段表示阶段完成，也不新增公共行为。

也可把后置调用写在 `runOfficialStage` 返回前，省 CLI 新依赖；但 `runOfficialStage` 已负责 writer 内部读回，若再把业务对账放在 runtime，可能形成 runtime→workflow 反向依赖。CLI 当前本来就导入 `workflows/build-code/capture.mjs`，因此同一个 `run` 分支的私有 P10 后置调用更直接。若要在 runtime 内调用，须显式评审依赖方向和跨层 owner。

## 可检查的完成条件与风险

- 集成正控按现有 `verify→run` 两个公共动作走，正式 `run` 的返回值**自己**提供 locator，后置消费者只从这份返回和实际输入回执拿 ref；测试不得手写消费原件或假造阶段行。错 locator、错回执、同树另一 run、写后换行、少 AC fact、半写、目录/库存漂移均拒绝；无业务观察仍 `unknown`。
- 正式 writer 不能用 `case-reconciliation` 的 `business_effect_status` 当写入前门：该 reader 即使来源正确也因没有独立业务效果而返回 unavailable。应把“固定回执/选择/事实来源认证”和“业务效果判断”拆成两个清楚的私有结果，前者可认证，后者维持 unknown。
- 若后置消费者只做私有核查，公开 CLI 仍只显示 locator，诊断可读性有限；若新增公开诊断字段，接口材料与相邻消费者兼容性检查是必要工作。两路均不能声称 AC-26/27/33 或 P10 完成，直到真实效果 oracle、旧→新快照证据、完整案例映射和独立审查到位。
