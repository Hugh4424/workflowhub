# P10/T021 七条真实验收场景：独立只读审查

**裁决：七行是诚实的缺口清单，不是目前可直接放进 Phase 并取得通过的验收合同。**它保留了 AC-26 的普查／诊断／报告、AC-27 的四类／旧记录、AC-33 的逐例效果／失败后修复两段，也明确三个 P8 种子、测试绿色及子进程自报 `expected=actual` 不能代表业务通过。以下问题必须先修；当前 AC-26/27/33、P10/T021 均不能报完成。本审查不改代码、材料或 Task facts，未运行测试。

## 阻塞问题与最小改法

1. **26-B/C 所称“同一次运行”按现有顺序无法成立。** `stage-handlers.mjs:4220` 在 handler 内执行验收场景；`stage-runner.mjs:5000-5011` 在 handler **返回后**才做本次 `currentPostBuildCodeSpecAnalyze`，`:3057-3090` 随后发布 `stage_end_spec_analyze` 质量事实；`:5037-5038` 更在 `runStage` 返回后才尝试写 P5 报告。故场景子进程不可能读取尚未产生的本次正式诊断事实和报告。P5 报告还只在当前阶段游标为 P5、T007 固定测试和 P5 review 认证且有独立人类例外来源时写；现行 `p5HumanExceptionFromDecisionLog` 明确返回 `null`（`:4600-4610`），所以当前根本没有可用的 P5 报告正例。**改法：**材料 owner 先决定 AC-26 报告核对是在阶段发布后的独立只读验收，还是读取已认证、同 Task／树／材料的前一次 P5 报告；写清哪次事实、报告、游标和原件 hash。若要让本次逐 AC fact 自带 26-B/C 结论，需精确授权发布顺序/可信二段核验的写面，且有失败负控；不能让子进程预报未来结果，也不能把旧报告冒称本次。

2. **唯一验收 Task 是全局入口，不是仅 P10 的三项局部入口。** 当前投影器 `stage-content-contracts.mjs:8154-8225` 扫描**所有** indexed Phase，要求全局恰好一张 `acceptance_role=acceptance` 卡，并将该卡所有 AC 复制给每个场景；`acceptanceCoverageForExecution` 则按 `spec.md` 的**全部有效 AC**生成覆盖行，未声明场景的 AC 为 `unknown`（`stage-handlers.mjs:1804-1840`），`acceptanceComplete` 要求全部覆盖（`:4269-4276`）。把 P10/T021 改为只列 AC-26/27/33，即使七行全过，其它 AC 仍不能通过。此卡放在 P10 也**不会等到 P10 才执行**：每次 build-code handler 都会读取所有 Phase 的场景；P10 之后还要做 P11 真实页面和 P12 独立验收，故“P10 汇总验收 Task”与阶段顺序容易被误解。**改法：**build-plan owner 明确全局唯一验收 Task 的位置和全部有效 AC 覆盖策略，保留 P6/P7/P10 各自实现与审查 owner；P10 的七行只能作为其中三项的场景，不可等同整卡验收。若选 P10 卡，明确它是全局声明、会在早期运行并保持未完成，且新增其余 AC 的真实场景及后续 Phase 依赖；不得为求绿缩小 `accepted_criterion_ids`。

3. **“第二读者”尚无生产接点，正式事实仍会先由子进程自签。** `executeAcceptanceCommandOrService` 只把子进程 stdout 交给 `deriveAcceptanceExecutionAssertions`，用同一进程填的 `expected/actual` 相等与退出码写逐 AC `passed` 叶（`stage-runner.mjs:2818-2916`）；`acceptanceCoverageForExecution` 只重读该叶身份和状态，不从原始业务输入重算预期（`stage-handlers.mjs:1730-1840`）。设计要求另一个读者是对的，但没有指定它在 `passed` 写入前／最终判定前怎样实际约束结果。**改法：**每行明确原件生产者、独立规则来源、只读读者、调用点和失败时的现有状态；正式 `achieved` 只能在该独立核对已通过后发布/采信。做 `expected=actual` 但原始事实相反、删一份原件、错 Task／树／材料及错误恢复的负控。只在文档承诺复核，不会改变当前假绿路径。

4. **AC-27 的旧字节判据目前缺基线。** 27-A 可检验四类可表达；27-B 正确区分“被测输入是 `missing/deferred`”与“聚合 AC-27 可为 `passed/pass`”。但旧 123 条仅有汇总，无已认证的逐文件旧字节／path/hash 清单；`P7.md` 当前也明写该比较为 `unknown`。**改法：**从可认证的历史来源取逐文件原字节和清单，记录来源身份、每个 path/hash，再逐字比较。取得前 27-B、聚合 AC-27 都保持 `unknown`，不能用当前重序列化文件或汇总数字当旧基线；如果历史原件确实不可得，应让规格 owner 明确不能满足的验收事实，而非静默删掉该判据。

5. **AC-33 真实失败链和覆盖范围仍缺。** 当前 `case-reconciliation.mjs:502` 的正式读路要求 `requirePassed:true`，不能认证旧失败；设计正确要求另读旧失败的原始 reporter、不可变 receipt 和旧树。现有三个 P8 种子不是所有应测业务，最近一次选例有 218 个变更路径中 209 个未映射；`case-selection.mjs:121,143-144` 和 `case-reconciliation.mjs:610` 在未映射时保持不可用。**改法：**先按当前快照重算并补业务目录、独立测试库存及真实消费者关系，再用实际失败的同 Task 旧原件建立发现 ID／owner／归因，修复后重新取树、重选、跑邻近回归并保留新旧原件；补仅能读失败来源的窄认证路径。没有自然失败时，可做明确标成“受控样本”的真缺陷复现，但它只证明机制，不能覆盖完整 AC-33。209 是旧快照读数，实施时不能当当前固定数字，也不能以仅九条映射冒充全覆盖。

6. **逐场景 AC 子集扩展有必要，但先要材料责任和完整覆盖。** 七行分别绑定不同 AC，现有 parser 拒绝 `acceptance_criterion_ids`，把整张卡的 AC 复制到每行（`stage-content-contracts.mjs:8189-8219`）。建议的字段仅在 build-plan owner 确认唯一 Task、场景和全局 AC 策略后加入；投影须拒未知／重复／空子集、Task 外或 spec 外 AC、漏掉必需场景，覆盖按同 AC 的**全部**必需场景计算。`publishAcceptanceQualityFact` 在单成功叶走 `executionEvidence ?? ...`（`stage-runner.mjs:2180-2225,3371-3394`），简单追加固定测试 ref 会被跳过；须保留原叶、补来源并由读者重核，一叶和多叶都测。来源完整只证明本次 `run` 消费了真实回执，不自动证明业务效果。

## 精确写面建议（需材料 owner 审定）

- **材料：** `specs/.../phases/P10.md`、唯一验收 Task 所在 Phase、`phases/index.md` 和必要的 `spec.md` 说明全局入口、P6/P7/P10 责任、AC-26 报告核对时点、AC-27 旧基线来源、AC-33 旧失败来源及所有有效 AC 的覆盖。不要把三个 seed 写成完整验收。
- **既有解析/发布：** `runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData`（场景 AC 子集）、`runtime/stage/stage-handlers.mjs#acceptanceCoverageForExecution`（全场景覆盖及独立判据接点）、`runtime/stage/stage-runner.mjs#executeAcceptanceCommandOrService/#publishVNextStage/#publishAcceptanceQualityFact`（原件与事实先后、一叶补源）；定向 `post-phase-contract`、`acceptance-execution-tier`、`vnext-official-stage-run` 测试，保留坏业务效果而脚本自报相等的反例。
- **P5/P6/P7/P10 各自生产者：** P5 真报告与独立人类声明来源先解决；P6 诊断与报告读回、P7 历史逐文件基线、P10 当前覆盖及旧失败认证分别由本 Phase owner 确认。若必须新增适配器或原件，先登记 move-map 的 owner、唯一 consumer、替代和删除条件；P10 `case-reconciliation.mjs` 及 `runtime/evidence/freshness.mjs` 只在本次 locator 和真实原件就绪后做完整读回，不造第二套进度账本。

**本次审查边界：**仅核设计和现有源码/材料，未跑测试；并行修改后的最终字节及真实 Task 原件仍须重新核对。最先需要改的是第 1、2、3 点的合同，否则即使七个子进程全部退出 0，也不能给出真实验收通过。
