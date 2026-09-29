# P10/T021 官方同次绑定：现有写面核查（只读）

## 结论

在“不新增持久对象、不扩阶段行字段、不追写旧行”的三项限制同时成立时，**当前代码无法证明**某份 P10 定向测试回执和逐 AC 质量事实属于 `facts.jsonl` 里这一**次** build-code 官方运行。当前结果必须保留 `current_execution_unverified`、业务效果 `unknown`。这不是 P10 测试失败的断言，而是来源链缺一条不可替代的关系。

`writeStageRow` 可以在本次官方运行末写入新的当前行，但 `STAGE_ROW_KEYS` 严格限定 16 字段；build-code 只额外允许 `phase_progress`。`evidence.value[]` 严格只有 `command/exit_code/failure_signature`，并被定义为实际执行命令，不是回执容器。`spec_analyze` 是反思原件指针，`handoff` 是交接项；借字段存回执会把字段语义改掉。当前 `withStageRow` 在反思/交接环节先写同次临时交接状态，再以相同 `created_at` 更新交接结果；这属于现行单行发布事务，不能事后拿它追写旧阶段行。写行函数未收到测试/逐 AC 的 ref/hash；正常当次发布的 `quality_fact_refs` 只存在于 `runStage` 返回值。

## 当前原件能证明什么

1. `verifyOfficialEvidence` 认证 handler 的 `facts.tests` 回执 ref/hash、回执内 Task/阶段/树/命令/输出等信息。`publishVNextStage` 产生测试质量事实和逐 AC 质量事实；`freshness.mjs` 可独立认证各原件字节。
2. `case-reconciliation.mjs#readCurrentEffect` 已核逐 AC fact → acceptance wrapper → stage-quality 原件 → 指定测试 receipt ref/hash。这证明逐 AC 原件**引用**该回执；不证明官方阶段行来自同一调用。
3. 当前实际 build-code 行（读取时间：2026-09-28）`created_at=2026-09-27T17:30:01.431Z`、树 `4381e90d43a7072ba12d1a4359ba757c3ddd5786`、游标 `P3/T005`，`spec_analyze.value=null`，行里没有测试或逐 AC ref/hash。该行也已晚于历史 P10 固定命令回执，不能拿来认证它们。
4. `quality-fact.v1` 的内容身份不含 `recorded_at`。同 Task/树/材料、同逻辑证据重跑时，`publishQualityFact` 会重用旧 fact 原始字节。因此“fact 时间落在本次行之前”甚至“fact 与本次树相同”都不证明本次产生；测试回执本身的 `started_at/completed_at` 也没有写入阶段行的本次调用标识。`phase_progress.recorded_at` 只是游标记录时间，不是官方运行开始时间。
5. P5 的 source/certificate 限 `P5/T008`、P5/T007 指定命令和该次 P5 行。P10 另一轮回执不可借用。当前行的反思原件为空；交接文件标明 `authority: non_authoritative`、`retention: current_only`，也不提供强同次输入关联。

## 若要真正补齐，最小写面

**保持无新持久对象的方案**：由官方 stage producer 在**本次** `runStage` 发布质量事实后、`runStageEndReflection#withStageRow` 首次写入新的 build-code 行时，把一个语义明确的 P10 source binding 字段交给 `writeStageRow`，并让独立 reader 校验。当前 `runStage` 虽已有 `published.quality_fact_refs`，传给反思/写行的 `handlerResultForReflection` 目前没有带上它们；须先用私有调用参数传递，不能在写行后补写。绑定至少需包含：`phase_id=P10`、`phase_task_id=T021`、Task ID、attempt ID（若有）、新行 `created_at`、当前树、全局材料 revision 与阶段 scope digest、测试 receipt ref/hash、测试 quality fact ref/hash、每个相关 AC quality fact ref/hash，以及本次 `published.quality_fact_refs` 的精确集合或其可认证子集。reader 应重新读取所有原件和当前行，核同 Task/树/材料/阶段、receipt 的输出 hash/固定命令/行为 fingerprint、逐 AC wrapper 与原始 source 对 receipt 的引用。绑定只证明官方来源；业务效果仍须独立 oracle 读取。**但此方案必须修改冻结的阶段行 schema 与 writer/reader，当前材料明确禁止，故现在不能实施。** 不得把这些值塞进 `command`、`failure_signature`、`spec_analyze` 或 `handoff`。

**保持冻结阶段行的方案**：按当前 P10 材料的许可边界，在同一 `runOfficialStage` 调用结束后，以内容寻址方式新增一份 P10 当次来源证据，保存上述身份、ref/hash 和新阶段行 `created_at`。独立 reader 用当前行时间/树/材料、原件 ref/hash、质量事实/逐 AC 链交叉验证。若发布只写了一半或重试拿到旧行/旧回执，则不生成通过结论。它不新增公开命令、进度对象或历史替换链；但确实新增**一份持久证据原件**，不满足题设的“零新对象”。应按 P10 材料规定先有 owner 审定和独立审查。注意当前 writer 返回的质量 fact 可为同版复用旧字节，故来源证据必须记录当次 `stageResult` 选择的 refs，不能声称这些 fact 字节本身是在本次新建的。

## 必须保持失败的负控

- 同 Task/同树/同材料另一次测试回执替换本次回执；即使两份都通过，仍拒绝。
- 换旧阶段行 `created_at`、错 phase/attempt/Task/树/材料、错固定命令或行为 fingerprint，均拒绝。
- 仅测试 fact 对上、逐 AC fact 缺失；或 AC wrapper/原始 stage-quality 引用了另一回执，均拒绝。
- 任一原件 ref/hash 错、输出字节缺失、阶段行写成功而来源原件未写完、来源原件写完而阶段行被下一运行替换，均为 `unknown`。
- P5 证书、非权威交接文件、单纯时间先后或同树事实并列，均不能替代 P10 同次绑定。

## 读时快照与范围

只读检查；未改产品代码、材料、Task facts，未运行测试。读取时 SHA-256：`stage-runner.mjs=154bbdf82efc0b534fe8fada576205a50151239d8d36193bd08fc1ff8d4688f0`；`freshness.mjs=ab279fdd9c4e5578dc41f14db2221e237efc7a76865406418de5658be8aa6ae8`；`case-reconciliation.mjs=151a77ae6842fd27b7b87ceee5f43c08e57dcb89c92879b44a08ce48cd413784`；`P10.md=3dc2f00ed5e1f4ffca8d104482ec7004f6c53f1ddcac783d41739ddec5010244`。结束复核时，前两份源码已由并行 P11 修改为 `c82f4adc2593a1869be22d576eb14a2accd8c7e19face8bf547577e74fdc2b48`、`bda2e7abf3cf6a30b866a178d70c8fcea1888901504feb8403149350260534e3`；本结论针对读取快照，不覆盖并行新增分支。
