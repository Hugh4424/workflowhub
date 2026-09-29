# T008 真实来源最小修订提案（待材料 owner 审查）

状态：**设计提案，不是执行记录、授权、收据或完成结论**。本文件没有改动生产代码、冻结测试、`spec.md` 或 Phase 卡。当前 T008 三个目标文件仍不得据此补造。

## 当前事实与不能采用的捷径

- `facts.jsonl` 的 `phase_progress` 仅有 `phase_id/task_id/material_revision/recorded_at`，CLI 要求它单独写入；游标行明确没有运行快照、测试或审查事实（`runtime/task/task-store.mjs:241-252`；`tools/cli/stage-runtime.mjs:1004-1059,1876-1880`）。`P5/T008` 游标不能证明 P5 工作已完成。
- `certifyCurrentTaskCompletion()` 即使 `formal_record_status=unavailable`、`quality_gaps` 非空，也会返回 `phase_completion.status="completed"`；它面向整项任务，不是 P5/T008 的完成证明（`runtime/stage/stage-handlers.mjs:1931-2018`）。同理，公开 `run` 结果中的 `status`/`quality_status` 不能单独证明 T008。
- 同一次 build-code 运行的 `acceptanceChain` 在 `currentPostBuildCodeSpecAnalyze()` 内构建，只传给分析器；公开 `stage-runtime-result.vnext` 带质量事实引用，但不带完整 `acceptanceChain`（`runtime/stage/stage-runner.mjs:4226-4337,3297-3339`）。`status --action=begin`、事后拼凑 CLI stdout、调用者自填 `chainRows` 都不能还原并认证同次来源。
- `buildStageEndReportFacts()` 是纯转换器，当前无条件写 `source_binding=unavailable`，因为调用者提供的文件路径没有绑定任务、快照和原始收据（`runtime/stage/stage-end-report.mjs:25-52`）。仅删掉该提醒或见到文件存在、命令 exit 0 就报通过，都会误报。
- 当前 P5 卡的 T008 明确禁止改 `runtime/stage/**`、接线及生成三文件，来源不可得就 STOP（`phases/P5.md:47-75`）。P6/T012 的冻结 E2E 只建 P1 夹具，却要求其 task store 出现 P5 报告；真实 P5 生产者在 P1-only 任务上必须不触发（`tests/e2e/card-04-real-entry-chain-e2e.test.mjs:41-44,446-482`；`phases/P6.md:86-104`）。

## 建议的唯一生产路径

由现有 build-code `run --action=execute` 私有实现负责，不增加公共命令、阶段、进度账本或准入门。只有在**真实 P5 范围**执行时才尝试生成中途报告：P5/T007 所需产物、对应当前源码快照的测试原件、P5 专属审查原件或真实不可用尝试均可回读，并核对其 Phase 身份。若某项缺失，报告可如实列出 `not_done`，但不得写 P5/T008 完成。单独移动游标、任意 build-code run、P1-only 夹具均不触发 P5 报告。

同一次调用按以下顺序处理：

1. 复用 CLI 已有的 task/worktree/CWD/runtime 写边界和 `runStage` preflight，锁定当前 `material_revision` 与执行快照。现有写边界见 `tools/cli/stage-runtime.mjs:1375-1452`、`runtime/stage/stage-runner.mjs:3349-3423`。
2. 从**本次 handler 返回值**取得 implementation/tests/phase review 收据和真实逐 AC 数据；保留**本次** `currentPostBuildCodeSpecAnalyze()` 构建的 `acceptanceChain` 作为私有临时值，不用第二次运行或历史结果拼接。既有构造位置见 `runtime/stage/stage-runner.mjs:4307-4337`。
3. 等 `publishVNextStage()` 成功、返回 `quality_fact_refs`，且 build-code 阶段行写入后才采集。现有发布先校验当前快照、按 AC 发布事实并返回引用（`runtime/stage/stage-runner.mjs:2964-2981,3213-3259,3297-3339`）；行失败会公开 `stage_row_error`（`:1190-1316`）。任一失败时不产出貌似成功的报告。
4. 在外置 Task store 的现有 `quality/evidence/` 下创建**内容哈希命名的原始来源**；固定 `P5/report-facts.json`、`report.md`、`T008-delivery.txt` 只作这份来源的本地检查点/索引与渲染，不充当新的 canonical 收据。原始来源必须可按 ref 和 SHA-256 回读；同一来源重试复用相同字节，不同来源显式冲突或另定版本，不能静默覆盖旧原件。若要保证“CLI 单次原始 stdout”字节相同，须在 CLI 输出边界同次保存并逐字节核对；私有内存结果的再次序列化不能冒称已经捕获了 stdout。
5. 用经过来源核验的输入调用 T007 纯转换器。转换器的 `source_binding=unavailable` 保留，不能靠普通调用者传 `verified=true` 或报告后删字段变绿；可信 stage-runner 另写内容寻址认证单，绑定本次来源 ref/hash 与转换器事实 hash，消费者读回原字节独立核验。真实缺口、未知和不可用逐项进入 `not_done`；不能凭空补出两条缺口或后续 Phase 通过。

来源最少绑定：`project`、业务 `task_id`、`stage=build-code`、`activation_cohort=post`、`phase_id=P5` 与 `phase_task_id=T008`、本次 `attempt_id`/调用身份、认证的 worktree realpath 与 branch、运行时已核验的 Git commit、执行快照 `head/tree/source_digest`、当前材料版本、同次最终结果的原始字节哈希、同次 `acceptanceChain`、implementation/tests/P5 review 的 canonical ref/hash，以及发布后返回的质量事实 ref/hash。字段可在现有对象中复用，不因这份提案另立进度权威。

读取者必须核对所有 ref 的原始字节哈希、任务/阶段/材料/快照一致性，并能从本次收据读回原始测试输出及真实未完成项。缺链、缺 P5 适用事实、错身份、错版本、错快照、错 hash、失败或部分发布都应停止认证或标为 `incomplete/unavailable`；不得改写为 `completed`。检查点不决定继续编码资格（`CONSTITUTION.md:26-29,68-73,98-108`）。

Owner：build-code 现有官方运行生产者。真实消费者：P5/T008 的来源检查点、P6/T012 的临时夹具动态核验、P13/T024 的最终汇总。替代对象：T008 的未认证手工/静态报告候选。删除条件：经审查的阶段报告机制整体替换这些消费者；不留永久兼容桥。

## 材料 owner 必须先修订的范围

`build-plan` 是 post 的 `spec.md` 与 Phase 卡 owner。需要在同一任务中增量修订并独立审查：

1. `phases/P5.md` T008（现 `:47-75`）和 `spec.md` 的 DER-06/报告边界：明确授权上述私有生产接线的**精确代码写面**、来源字段、写入时点、固定三文件与内容哈希原件的关系、P5 触发条件、失败关闭与目标测试；去掉当前“不得改 runtime 接线”的相反指令。T007 的纯转换器与 T008 的来源认证责任仍分开。
2. `phases/P6.md` T012（现 `:86-104`）：明确 P1-only 运行**不得**生成 P5 报告；新增真实 P5 范围的夹具正例，再在那一例核验动态报告。不能把工作树 P5 三文件复制进临时 taskPath，也不能无条件为每次 build-code run 发射 P5 报告。
3. `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 的 `:446-482` 为 build-plan 预置冻结断言；若按上述真实行为修订，须先写明旧断言为什么误把 P1 当 P5、保留旧 RED 原件、由材料 owner 指定测试写面并经独立审查。不能仅删除失败用例或用 fixture 造 P5 文件求绿。相邻 `runtime/stage/stage-end-report.test.mjs` 的八项 T007 纯转换器合同保持独立；如新来源绑定接口确实影响它，也要单独说明并审查，不能借 T008 悄改冻结断言。

材料改版后，旧评审/确认只作历史事实，正式写入仍按新版本实际复核；缺质量事实不阻止同任务修复，但不能报完成。

## 最小针对性验证（计划，不是本次实测）

- **P1 负控**：真实 CLI 在仅有 P1 的临时任务执行，阶段结果可保留真实缺口，但 Task store 的 `P5/report-facts.json` 必须不存在；即使游标人为指向 P5 也不能触发。原 E2E 的旧错误断言应留下 RED 对照。
- **P5 正例**：含 P5/T007 实施、当前快照测试原件及 P5 审查事实的真实临时任务执行**一次**官方 build-code run；同次内容哈希来源及三个检查点可回读，逐 AC 和 `not_done` 与原始收据、输出、质量事实一致；后续 Phase 未执行不得记通过。重复同源调用只复用原件。
- **坏例**：换 task/worktree、改材料或快照、删/改 acceptanceChain 或收据原始字节、错误 ref/hash、缺阶段行、部分发布、换来源重复固定路径，逐一应显式失败或保持缺口，且不能写出“完成”。
- 只跑 `runtime/stage/stage-end-report.test.mjs`、新增窄来源契约测试、修订后的 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 及实际受影响邻接测试；保存每条命令、runner 身份、原始输出、exit、RED/GREEN、独立 review 与旧缺口处置。禁止无范围全量 Vitest。
