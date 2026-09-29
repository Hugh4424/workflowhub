# P10/T021：真实验收结果怎样产生、怎样对上本次运行（只读方案）

结论：**现在没有可据以宣称 AC-26、AC-27、AC-33 通过的生产链**。已有三个 P8 案例说明要测什么，且有定向测试身份；它们的实际效果仍标为 `not_yet_observed`。固定测试回执只能证明那些测试运行过。正式验收还缺当前材料声明的可执行场景、独立效果核对、逐项事实与本次 `run` 的准确绑定；AC-33 还缺真实失败、同任务修复和新快照复测的两套原件。本文只提出最小可实现路径，不修改代码、材料或 Task facts，不运行测试。

读取时的主要字节：`stage-content-contracts.mjs` Git blob `3e5c79496b945bddedd0a95d8ffc5a0c7427919c`，`stage-handlers.mjs` `5020a39ffda31c816f38b678f9cda30a0dde707b`，`stage-runner.mjs` `3c58a7e8ea6dc3f344c04a550a868bfdf17d9fd6`，`case-reconciliation.mjs` `486cffebd3c15d11c554935af550bedbeb233d0c`，P10 材料 `b0590116474f0a8ff1e1ef999cf1f7baa67d4ddd`。并行修改后须按最终字节重核。

## 最小真实来源

1. **先完成业务生产者，分别观察三项要求。** AC-26 使用当前 `decision-log.md`、`deriveDecisionLogOriginalSourceCensus`、真实官方 `run` 的阶段分析事实和 P5 报告；独立读取者直接数 U/V/R、核缺节和逐条错误、再读本次机器状态和报告「没做到」。只数三节不够。AC-27 使用真实 `validateAcceptanceEvidence`、`validateVerifyLeaves` 和现有质量读取，分别验证四种机器类可表达且不误作 passed、非法值拒绝、旧 `missing→deferred` 输入及恢复；旧记录逐字兼容须有认证的逐文件旧基线，历史“123 条”汇总不够。AC-33 使用两次不同源码快照的真实固定测试执行：第一次失败原件与 case/AC/结构/风险发现，修复后重选、邻近旧回归和第二次原件；两次均留不可变引用，独立读取者核源码差异、实际 reporter、发现处置，不能拿一个绿色快照代替修复旅程。P6、P7、P10 各自 owner 先定正例、反例、恢复及可以从 Task/工作树原件读到的判据。
2. **优先复用现有受控执行器。** 当前 `executeAcceptanceCommandOrService` 已能在认证工作树运行 `command` 或工作树相对 `service`，保存原始 stdout/stderr、退出码、清理结果、模块哈希和 Task/attempt/树/材料身份；`command` 参数可用 `${TASK_DIR}` 指向本次 Task。若现有导出与正式 Task 原件确能给出一项业务观察，就以其为执行入口。只有缺统一可运行入口时，才登记一支最小的工作树内 command/service 适配器（owner 为相应 P6/P7/P10 功能生产者，唯一 consumer 为官方验收执行器，等价直接入口经同样负控接管时删除）。适配器输出每项 AC 的原始观测和 `entries`，并保留可独立重读的输入/输出引用；不能由它同时自填 `expected=true`、`actual=true` 来证明业务正确。`deriveAcceptanceExecutionAssertions` 当前只检验子进程自报两值相等，独立 TaskHandle reader 必须另从规则材料、工作树、阶段事实和原始输出重算结果。
3. **材料只声明已能实跑的场景。** post 当前解析器要求唯一 `acceptance_role=acceptance` Task 与非空 `acceptance_data`；现在 Phase 中没有。最贴近对账的是 P10/T021，但它当前只列 AC-33，不能静默改成三个 seed 的 AC-26/27。由 build-plan owner 在真实入口和独立判据定形后决定唯一验收 Task、更新 `P10.md` 和 `phases/index.md`，并保持 `spec.md` 中每项 AC 的原意。若一支实际场景能为所列 AC 各产一条独立叶，现有解析器够用；若多个场景各负不同 AC，才授权 `projectPostPhaseAcceptanceExecutionData` 增可选、非空、去重且属于 Task AC 集合的逐场景 `acceptance_criterion_ids`，配 `post-phase-contract` 定向负控。三个 seed 只可分别映射 AC-26、AC-27、AC-27；AC-33 必须另有真实修复旅程场景。现有 `acceptanceCoverageForExecution` 已要求每项 AC 的所有必需场景各有有效叶；不可把两个 AC-27 场景压成一个测试绿。
4. **正式结果与固定测试回执分别成链，再交叉绑定。** 现有 `acceptanceExecutionFacts` → `acceptanceCoverageForExecution` → `publishVNextStage` 能产逐场景叶与逐 AC 事实，但还没有把官方 `run` 实际输入的固定 P10 `receipts.tests` 关联到逐 AC 事实。P10 owner 应按当前目录 case→AC、测试库存、树/材料重读回执→output→manifest→逐 case 原始 reporter，作为逐 AC 来源的*补充*，不改变场景计算出的状态。`publishAcceptanceQualityFact` 的单一成功叶捷径会忽略外加的 `evidenceRefs`，所以须在现有聚合原件中保留原叶、补本次回执 ref/hash，并让 reader 同时核两者；一叶、多叶都需测试。P10 现拟定的本次消费原件仅记录实际输入回执、当次事实 refs/hashes 与最终阶段行的本次写入 hash；公开的可选 `p10_consumption_evidence` 只传精确 locator。`freshness.mjs` 和 `case-reconciliation.mjs` 必须按此 locator 中的精确 fact refs 读取，拒绝同树另一 `run` 的 fact，不能全 Task 搜一条或扫描 latest。来源链成立只证明“确实执行并由本次运行消费”；业务效果仍由前述独立读取者判断。

## 当前必须保持未知的部分

- AC-26：P5 的真实报告产物与完整诊断/机器状态链尚未有同次正反读取；普查 seed 不能单独使整项通过。
- AC-27：四类的正式生产者不是 FR-27 的必要条件，helper 可表达性可单独验证；但旧 123 条缺认证逐文件基线，不能声称兼容已验证。两个 seed 是不同场景；旧延期的**被测输入**为 `missing/deferred`，若行为正确，聚合 AC-27 才可能 `passed/pass`。当前 `readCurrentEffect` 却要求聚合 fact 自身为 `missing/deferred`，必须改读场景原叶，不能靠改状态掩盖矛盾。
- AC-33：当前没有完整旧失败→同任务修复→新快照重选复测原件，也没有覆盖全部真实变化的映射。最近只读样本是 218 个变化路径仅 9 个已映射、209 个未映射；应在新快照重算，未映射仍存在就保持 `unavailable`。三个 P8 seed 不覆盖诊断/报告、全部四类契约或跨 case 修复旅程，也不覆盖 spec 中其它 AC。
- 页面/服务是否真实存在仍未证实。不能把本地 command/service 当浏览器验收，也不能在未清查真实消费者时写 UI `N/A`。

## 可失败的定向验收

- 场景只回 AC-26、漏 AC-27，或 AC-27 两个必需场景只回一个：正式覆盖不得通过；假 `expected=actual` 而独立材料/Task 原件不符亦不得通过。
- 同树固定回执 A/B：官方 `run` 输入 B，逐 AC 事实或消费 locator 指 A，必须拒绝；缺 output、manifest、原始 reporter、错目录/库存/树/材料、单叶补源被捷径吞掉、旧运行 fact 混入同样拒绝。
- AC-26 缺报告、AC-27 旧基线缺失、AC-33 只留新绿或修复后不重新选择、当前仍有未映射路径，都不得由测试 exit 0 升为业务通过。

目标测试只限受影响的 `post-phase-contract.test.mjs`、`acceptance-execution-tier.test.mjs`、`vnext-official-stage-run.test.mjs`、`build-code-case-reconciliation.test.mjs`，再加 P6/P7 各自真实入口的定向正反用例。先冻结失败与原始身份，再核修后结果并做独立审查。新生产文件先在 `docs/architecture/move-map.json` 登记 owner、唯一消费者、替代和删除条件；旧 receipt/fact 只读保留。

依据：外置 Task `P10/T021-acceptance-producer-gap-audit-20260928.md`，本树 `P10/T021-ac-receipt-spec-clarify-proposal-20260928.md` 及独立审查、`P10/T021-three-seed-real-scenarios-20260928.md`；现行 `runtime/stage/stage-content-contracts.mjs:8154-8225`、`runtime/stage/stage-handlers.mjs:1584-1665,1730-1840`、`runtime/stage/stage-runner.mjs:2796-2943,3320-3395`、`runtime/evidence/canonical-evidence-validators.mjs:107-180`、`workflows/build-code/case-reconciliation.mjs:305-375,380-570`，以及 P6/P7/P10 当前 Phase 和 `spec.md` AC-26/27/33。
