# P10/T021：先找真实效果、再决定材料形态的只读提案

本提案只供 post build-plan `spec-clarify` 和独立审查；这次增量只修改本提案，不修改正式材料、生产代码、测试或 Task facts，也不声称 P10 通过。输入是外置 Task 的 `quality/evidence/stage-quality/build-code/P10/T021-acceptance-producer-gap-audit-20260928.md`、工作树的 `quality/evidence/stage-quality/build-code/P10/T021-three-seed-real-scenarios-20260928.md` 和 `P10/T021-ac-receipt-proposal-independent-review-20260928.md`；并行生产改动结束后仍须按最终字节重核。

## 已证缺口

1. 当前 `phases/*.md` 没有 `acceptance_role`/`acceptance_data`。`runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData` 要**唯一**验收 Task 和非空真实场景；没有这两项时，`acceptanceExecutionFacts` 不会产 AC-26/27 运行叶。调用者给 `acceptance_coverage` 在当前 vNext 被拒，不能借自报补洞。
2. 该解析器把验收 Task `Source / FR / AC` 的**全部 AC**复制到每个场景，场景 JSON 又不接受独立 AC 列表。P8 三 seed 是 `CARD04-DECISION-LOG-CENSUS → AC-26`、`CARD04-ACCEPTANCE-MACHINE-CLASSES → AC-27`、`CARD04-DEFERRED-ACCEPTANCE-REGRESSION → AC-27`。如果真的需要三个**各自只负责一个 AC**的场景，现协议会串号；但若找到一个真实场景能分别产出所有 AC 的独立叶，现协议已有表达力，不应为目录三行提前扩通用解析器。
3. `runtime/stage/stage-handlers.mjs#acceptanceCoverageForExecution` 只从正式场景原件导出逐 AC 覆盖；`runtime/stage/stage-runner.mjs#publishVNextStage` 逐 AC 发布只写这些原件，不把实际 `input.receipts.tests` 的固定 P10 receipt 按 case→AC 加进去。`case-reconciliation.mjs#readCurrentEffect` 却要求该逐 AC 原件的 `subject_fact.evidence_refs` 含固定 receipt ref/hash。因此仅做此前计划的 `run` 消费来源原件，仍会得到 `current_effect_receipt_mismatch` 或缺事实。
4. `runtime/stage/stage-runner.mjs#verifyOfficialEvidence` 的 receipt/facts 比对目前对 `behavior_fingerprint` 等结构化字段用 `!==`；两次独立 JSON 解析即使值完全相同也不共用对象身份，会在正式发布前报 `test receipt and facts.behavior_fingerprint are not bound`。现有 `canonicalJson` 可供精确结构值比较；原始 receipt/hash/快照认证仍须保留。
5. 三个 seed 只有规则来源和定向测试身份，`effect_observation` 全为 `not_yet_observed`。只读调查未找到能直接写成正式 `acceptance_data`、可由官方 `run` 实跑且有独立效果 oracle 的现成 command/service。AC-26 的 census 只覆盖普查，尚缺诊断/机器状态/阶段报告链；AC-27 两例分别是 helper 可表达性和旧 deferred，不能当成四类正式生产者输出；T021 原有 AC-33 的跨例修复职责不能被 AC-26/27 的三个 seed 挤掉。`deriveAcceptanceExecutionAssertions` 只比较适配器自己输出的 expected/actual，不能作为同一适配器的独立业务 oracle。
6. `case-reconciliation.mjs#readCurrentEffect` 把同一个 AC-27 聚合 fact 同时当机器类别与旧延期 seed 的结论：机器类别分支无独立效果 reader，旧延期分支却要求聚合 fact 为 `missing/deferred`。两个验收场景若都通过，聚合 AC-27 应为 `passed/pass`；被测的“缺项→deferred”应留在旧延期**场景输入/原始叶**，两者不能混同。
7. `publishVNextStage` 单一非浏览器成功叶会给 `publishAcceptanceQualityFact` 传 `executionEvidence`；后者用 `executionEvidence ?? {...evidenceRefs}`，使简单追加的固定 receipt ref 被整段忽略。未来补源须明确处理单叶快捷路径及多叶聚合，保留原始叶并让 reader 核引用，不靠 receipt 改状态。
8. `readCurrentEffect` 当前枚举全 Task 同树/材料 fact 并要求恰一条；同树两次合法 `run` 可有两条。必须以本次消费原件/locator 的精确 fact refs 读本次，0 条、重复、别次 locator 与当前行不符时保持 unknown。此前只读样本有 208 条未映射变化，当前数须重算；未映射仍在时，P10 会在业务效果读取前返回 `unmapped_changed_path`，三个 seed 绿也洗不掉。

## 顺序一：先核现有入口、变化范围和独立效果

1. P6/P7 owners 先按当前材料核 AC-26 的诊断、机器状态与报告链，以及 AC-27 的 helper 可表达、非法值、旧 deferred 和可认证旧字节；123 条只有汇总而无逐文件冻结基线，兼容结论继续 unknown。P8/P9 重新算当前真实变化与测试库存映射；旧样本 208 条未映射只是时点数，剩余未映射不能被三 seed 绿色掩盖。
2. 优先用现有官方 `verify` 固定回执、`run` 原件、真实 Node 导出和受控 `service`/`command` 路径找正、反、恢复观察；只有实际缺一个可运行入口时才提最小 adapter。另一条只读路径须从当前材料与 Task 原始字节重算预期、核 stdout/stderr/hash、身份和限制；适配器输出自带的 expected/actual 不能自签业务通过。
3. `verifyOfficialEvidence` 的独立 JSON 结构值比较是已登记的**单独可立即修复项**：同值的两次独立解析须通过，错 run_id/目录 hash/旧树仍拒。它只移除正式回执误拒，不预先决定验收 Task、逐场景解析或业务通过。

## 顺序二：逐项确定真实场景与独立 oracle

- **AC-26**：P6 owner 须把当前 `decision-log.md` 的 U/V/R 独立计数、缺节反例与恢复，连同官方阶段诊断、机器状态词和报告消费者读回一起定义为完整效果。仅 `deriveDecisionLogOriginalSourceCensus` 或六条 Vitest 叶不够；受控 command/service adapter 必须产生可核原始 before/after、失败/恢复和本次 Task/材料/树引用，独立 TaskHandle reader 另读原文与正式事实，不能由被测 parser 自判。
- **AC-27**：P7 owner 分别定义机器类别 helper/validator 的四类可表达、非法值拒绝、旧验收字节不变，以及当前缺项 `missing→deferred` 的旧回归与恢复。FR-27 不要求正式 writer 真产四类；不能因测试绿写成四类生产已完成。旧 123 条汇总缺逐文件冻结基线，兼容比较保持 unknown。两个 seed 各自的**场景输入与结果**都须可观察；旧延期场景可把 `missing/deferred` 当被测输入并因正确保留旧语义而使该场景通过。两场景均通过后，唯一聚合 AC-27 可为 `passed/pass`，不能再要求聚合 fact 同时是 `missing/deferred`。受控入口调真实导出/当前 Task 原件，独立 reader 重核每个场景叶、输入 wrapper 的 deferred、输出、旧/新字节及限制。
- **AC-33**：T021 原有跨 case 对账、一次失败保留旧原件、同任务修复后新源码快照重选并跑邻近回归仍须独立可失败 oracle。若 T021 作唯一验收 Task，其 `Source / FR / AC` 必须明示 AC-26/27 新验收职责与 AC-33 原职责的不同来源；不论最后是一支真实场景分别产每个 AC 的叶，还是多支场景，AC-33 的旧失败→新快照证据都必须独立可读。`source` 写权威规则材料与版本、`sample` 写稳定 case ID 或可核跨 case 身份、`scenario` 写具体正反/恢复判据，只有真实固定 command/service 入口存在才填写 `tier`/`execution`。现在不能写占位命令、假的服务地址、普通 `npx vitest` 或声称三 seed 已完整覆盖 AC-26/27/33。

若现有原件仍不能覆盖某判据，最小 adapter 才通过官方受控执行边界读取认证 worktree/TaskHandle、调用真实产品入口、保存带身份/hash 的正常、失败与恢复原始结果；`deriveAcceptanceExecutionAssertions` 只比较其输出的 expected/actual，不是独立 oracle。P10 的另一只读路径需从当前材料、Task 原始事实和业务规则核预期、实际、负例与限制。只有入口和失败判据被 P6/P7/P10 owners 实测、异源审查后，build-plan owner 才选唯一验收 Task，写真实 `acceptance_role=acceptance`/`acceptance_data` 并同步 spec/index。若一支真实场景可分别给 AC-26/27/33 各自独立叶，现解析器可能已够用；若最终确为三个 seed 各有不同场景并另有 AC-33 场景，才登记逐场景 `acceptance_criterion_ids` 子集合同：三个 seed 分别 `["AC-26"]`、`["AC-27"]`、`["AC-27"]`，AC-33 独立映射。场景 `sample` 到 P8 case 的一致性由 P10 目录/reader 核，不无条件加为全 post 解析规则。此前正式验收与 P8 三项效果均保持 `unknown/not_yet_observed`。

## 顺序三：真实场景定形后再授权解析写面

- 如果经实测仅一支场景且能对 Task 明示的每个 AC **分别产独立叶**，沿现有 `projectPostPhaseAcceptanceExecutionData`；负控为声称 AC-26/27 的场景只产 AC-26 叶，必须拒绝，不能因为一个叶绿而覆盖两项。若确需多支不同场景，各自只属 AC 子集，再由 build-plan owner 登记 `runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData` 与 `tests/contract/post-phase-contract.test.mjs` 的可选逐场景 `acceptance_criterion_ids`、非空/去重/Task AC 子集校验和目标 RED；未经过这个选择不提前扩通用协议。
- P7 owner 的 `runtime/stage/stage-handlers.mjs#acceptanceCoverageForExecution` 继续要求该 AC 的**全部必需场景**分别有同源有效叶；P11 browser 场景与真实页面/服务/隔离/清理仍归 P11。P8 目录的 `sample`/case→AC 绑定由 P10 独立 reader 按当前版本核，P7 的旧 deferred 输入仍可为 deferred，但其验收场景成功与 AC-27 聚合通过是不同层。

## 顺序四：场景与独立效果成立后补固定回执来源

- P10 owner 才从官方实际输入的固定 receipt→output→manifest→逐 case raw reporter、当前 P8 catalog/registry/树/材料派生受信 `selected_case_id→ac_id`，把 receipt ref/hash 作为现有逐 AC stage-quality 的**补充来源**；状态仍由正式场景与独立效果决定，缺场景/效果、未映射变化或 receipt exit 0 不能自行变 `passed`。`publishVNextStage` 单一非浏览器 `covered/passed` 叶走 `executionEvidence` 快捷路径，`publishAcceptanceQualityFact` 会忽略另外传的 `evidenceRefs`；必须在不改原始叶的前提下设计同源聚合 stage-quality 原件并让 reader 核其叶引用，或先证受信叶结构的等价最小改法。单叶和多叶都要可失败测试，禁止简单追加 `evidenceRefs` 后假称已绑定。
- `case-reconciliation.mjs#readCurrentEffect/#reconcileCurrentTaskCases` 和 `freshness.mjs` 从本次消费原件/locator 所列的**精确** `quality_fact_refs` 读取，不再全 Task 同树扫描后要求恰一条；0 条、重复、旧运行 locator、同树 A/B 错绑均 unknown。AC-27 reader 从唯一聚合 AC fact 下的**两个场景叶**分别核：机器类别真实 helper/validator 输出，旧延期场景的输入 wrapper `missing→deferred` 与其场景成功；两叶齐且独立观察成立时聚合 fact 才可按 `passed/pass` 判断。不能继续要求聚合 AC-27 同时 `missing/deferred`，也不能凭聚合 pass 跳过任一原始叶。AC-26 还要诊断/报告链，AC-33 还要旧失败与新快照；三 seed 不是全量 AC oracle。
- 生产写面须由 build-plan owner 在真实场景/现有读者消费查明后另次精确登记：`runtime/stage/stage-runner.mjs#runOfficialStage/#publishVNextStage/#publishAcceptanceQualityFact` 的现有逐 AC 补源与单叶快捷路径，`workflows/build-code/case-reconciliation.mjs#readCurrentEffect/#reconcileCurrentTaskCases`、`runtime/evidence/freshness.mjs` 及受影响定向测试；不改 caller `acceptance_coverage`，不新造验收权威或历史账本。若现有正式场景原件已能等价承载固定 receipt→case→AC 关系，应直接复用，省掉专属补源分支。

## 可失败的完成证据与边界

- **现在可先验证**：`verifyOfficialEvidence` 的分离 JSON 同值正控可通过、错嵌套值与旧树仍拒；这项窄修复已有正式材料写面，目标 RED/GREEN 与独立审查都不能被当成业务完成。真实场景未定前，逐场景解析和补源只保留设计/目标，不跑为绿而造的占位业务 fixture。
- **真实入口后才验证**：若单场景给 AC-26/27 却只产一项叶，必须失败；若多场景需要子集合同，错 AC/重复/缺场景必须失败。三测试都绿但 AC-26 缺诊断/报告、AC-27 仅一个场景或把场景输入 deferred 误作聚合状态、AC-33 缺失败→修复→新快照回归、独立正反观察缺失、旧 123 条无逐文件基线、当前仍有未映射变化，都不能 pass。
- 同树固定 receipt A/B，`run` 输入 B 而逐 AC 原件或消费 locator 指 A 必须拒；B 的完整 raw、场景叶、单叶或多叶聚合原件、逐 AC fact 和本次最终行对上才有来源链。坏 output/manifest/raw hash、错目录/库存/材料/树、并发替换、半写与同树多 fact 误选仍未知/失败。补源不能改变原场景叶字节或把 `missing` 升成 `passed`。
- P7 逐场景严格覆盖与 deferred 语义不降级；P11 browser 的真实页面/服务/隔离/清理仍由 P11 owner 管，P10 不把 backend/fixture 写成 browser pass 或 N/A。后续只跑受影响 `post-phase-contract`、`build-code-case-reconciliation`、`vnext-official-stage-run` 与必要 `acceptance-execution-tier` 命名用例，不无范围回归。

## 归属、替代与删除

现在正式材料只授权 `verifyOfficialEvidence` 独立 JSON 值比较，owner 为 build-code 官方 stage producer，唯一消费者是官方 receipt/facts 核对；同等可失败的统一结构值认证接管时删该特例。P6/P7/P10 owners 先用现有原件或最小 adapter 找真实入口和独立 oracle，build-plan owner **随后**选择单场景或多场景材料形态、唯一验收 Task 与必要的解析写面；在此之前不写占位 `acceptance_role/data`，P8 三 seed 仍 `not_yet_observed`。P7 保留逐场景覆盖，P11 保留 browser 生产/读路。若确需 P10 专属 receipt 补源，其 owner 是 build-code stage producer，唯一消费者为本次逐 AC fact、P10 对账与 verify-code 只读抽查；补源替代当前逐 AC 原件缺固定 P10 回执的事实，不能替代业务 oracle。现有正式场景原件若已能通过同等负控直接承载 receipt→case→AC，就不用专属分支；否则经审查的等价机制接管时删除该分支，旧原件只读保留。不新增第二验收权威、状态账本或公共命令。
