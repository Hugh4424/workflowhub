# P10/T021 正式写入与唯一读取接线设计（2026-09-28）

范围：只读核查当前 `P10.md` 的“本次 run 消费”条款、`T021-consumption-reader-20260928/{phase-card,handoff}.md`、独立审查、`stage-runner.mjs`、`case-reconciliation.mjs`、`freshness.mjs` 和 TaskHandle/TaskKernel。本文是实施设计；没有修改生产代码、Phase 材料或 Task facts，也没有运行测试。

## 当前事实与实施边界

- `runOfficialStage` 把调用输入 `structuredClone` 后交给 handler；`stage-handlers#testFacts` 从 `input.receipts.tests` 读受信回执并生成 `result.facts.tests.{receipt_ref,receipt_hash,output_ref,output_hash}`。`verifyOfficialEvidence` 已核正式回执、结构字段、原输出和 facts 的绑定。指定回执曾真实执行的更深链（固定命令、manifest、逐例原始 reporter、当前目录和测试库存）仍由 `case-reconciliation.mjs` 现有读取链认证。消费原件不能代替此链。
- `publishVNextStage` 返 `stage-runtime-result.vnext.quality_fact_refs`，该数组是本次发布的**完整主质量事实 ref 列表**；不把只供提示的 `quality_advisory_fact_refs` 偷混进来。`runStage` 等发布和最终 reflection 完成后才返回。`withStageRow` 已把**最终** `writeStageRow` 返回对象放入 `stage_reflection.stage_row_write` 的不可枚举私有属性；正式调用可取得其 `{ref,sha256,value}`，JSON 公共结果不包含该属性。不能用 `currentStageRow()` 事后猜本次写入身份，也不能用先写的 pending 行。
- `case-reconciliation.mjs#readRunConsumption` 目前在错误层认证一份测试造出的原件；正式 writer 和公开 locator 均不存在。独立审查指出测试里的手工发布不能证明真实运行。`freshness.mjs` 现无这份原件的统一 reader。真实 AC-26/27/33 效果和部分逐 AC→回执来源仍没有生产适配器；因此接线后仍须 `unknown`，不得声称业务通过。

## 正式 writer：只从本次可信私有值组装

精确位置：`runtime/stage/stage-runner.mjs#runOfficialStage` 中 `await runStage(...)` 之后、返回公开结果之前；现有 P5 同次报告分支若执行，先让它完成，随后才处理 P10。仅当 post build-code、当前最终行的 `phase_progress` 精确为 `P10/T021` 且材料 revision 当前一致，才尝试本专属原件。别的 Phase、无固定测试输入、缺有效最终行、测试事实缺失或逐 AC 生产来源尚不齐时，不发布成功 locator，保留普通 stage 结果与原有 `unknown`。输入有假回执或原件哈希错则沿既有官方校验报错，不降成成功。

1. 取 `input.receipts.tests` **这个实际入参**的字符串 ref；读取原始回执字节计算 hash，核它等于 handler 已验证的 `facts.tests.receipt_ref/hash`（可由同次闭包保留 `verifiedHandlerResult.facts.tests`，不从调用者额外 JSON 取）。从该回执取 `output_ref/hash`，重读输出字节和 hash。通过固定 P10 认证链核真实命令、Task、当前树/材料、业务目录、库存、manifest、runner 与原始 reporter。`dispatch_state` 只可描述原 verify 当次，不能写成本次 run 新执行。
2. 取 `stageResult.quality_fact_refs` **完整原数组**，逐 ref 经 `ctx.task.readRecord` 重读原字节、hash；每条还须经 `authenticateQualityFactRecord`、Task/stage/树/材料认证，禁止重复 ref。要求恰一条本次 `risk_tests_fresh:passed` 的测试事实，其 evidence 精确指向上述固定回执。按固定 manifest 所选案例与当前目录所得 AC 集，要求每个选中 AC 恰一条本次逐 AC 质量事实，且其嵌套原件精确指向同一回执；现有生产者尚不满足时**不补造 AC fact**。清单里仍保留其它本次主质量事实，reader 不应只列两个样例事实冒充完整发布。
3. 从 `stageResult.stage_reflection.stage_row_write` 私有返回取 `{ref,sha256,value}`。要求无 `stage_row_error`，`value.source=stage-end:build-code`、进度 P10/T021、Task/树/材料正确。`facts.jsonl#N` 对应原行加 `\n` 的 hash 必须等于 `sha256`，且它仍是唯一当前 build-code 行。这里用 write 返回作为**本次**身份，读文件只复核当前性；不可反过来从文件推断本次身份。
4. 原件一份，沿读侧卡片格式 `workflowhub-p10-run-consumption.v1`：`task_id,stage,snapshot_tree,material_revision,source_digest,test_receipt:{ref,sha256},test_output:{ref,sha256},stage_row:{ref,sha256},quality_facts:[{ref,sha256}]`。确定性 JSON 原字节（末尾换行）取 SHA-256，路径严格为 `quality/evidence/stage-quality/build-code/p10-consumption-<sha256>.json`。用既有 `publishVNextEvidence`/`TaskKernel.publishCanonicalRecord` 的 create-only、同字节幂等路径；不写可变 latest、阶段行新字段或第二份进度记录。
5. 发布后调用**同一** `freshness.mjs` reader，拿 `{ref,sha256}`、实际入参回执/输出、当前身份、所选 AC 清单重读全部。再次核本次最终行仍当前，并核新源码树/材料没有变。只有完整读回成功才把可选 `p10_consumption_evidence:{ref,sha256}` 放到 `stage-runtime-result.vnext` 的公开返回；不改旧字段、`schema_version` 或七类公共命令。它仅供显式传给私有 P10 对账，不等于业务通过。

关键实现细节：`quality_fact_refs` 原本只列字符串，writer 必须在本次调用内把**整个**数组转成精确 `{ref,sha256}`；不得从 Task 全局枚举凑齐。选中 AC 集不能由原件自己声明给自己验，应从当前目录、独立库存和固定回执 manifest 的一致交集派生。若直接复用现有 P10 对账链来派生，需给它一个受信回执描述（由回执/输出重建），避免把 caller 传入的 `capture` 对象当成认证。若这条私有入口尚未接通，先保留无 locator，不能以原件手写 `acceptedAcIds` 绕过缺口。

## 唯一 reader 与交错运行

把 `case-reconciliation.mjs#readRunConsumption` 的完整认证搬到 `runtime/evidence/freshness.mjs` 单一导出；原模块只负责已有固定回执→output→manifest→reporter/目录/库存读取、把**当前选中 AC IDs**和 `consumptionEvidence` 显式交 reader，并消费其受信 `byAc` 映射。不要保留一份本地的旧认证副本，避免两套规则分叉。`freshness.mjs` 可用 TaskHandle 的 `readRecord` 和已有 `authenticateQualityFactRecord`，不需导入 case 模块形成循环。locator 必须严格是内容哈希命名路径，hash 同时匹配文件名和原字节；所有嵌套 ref/hash、Task/树/材料、回执和输出、测试事实及逐 AC 事实均重读。

在读取任何消费原件**之前**记录当前 `facts.jsonl#N` 目标行的原字节/hash（整份文件可读，但只认可唯一 build-code 行）；认证原件的 `stage_row` 要与前读一致。重读完所有原件和事实后，再读该行的原字节/hash并比较：前读＝原件＝后读，`phase_progress=P10/T021`，而且当前源码树/材料仍与原件一致。两个 `run` 交错使阶段行被替换，即使树与材料相同也拒绝。单次读取期间另一调用把行改走又改回属于现有“当前行”边界无法靠两次读独立证明的 ABA；不应声称这里提供独立于可信 writer 的并发作者证明。必要的更强保证需另行设计锁/执行身份，先修材料，不能暗增控制面。

返回值只说明 `run_consumption_status=verified` 的来源链成立；`readCurrentEffect` 继续独立核每个 AC 的业务效果。无真实效果或未覆盖的 AC 保持 `business_effect_status=unknown`。没有 locator、坏 locator、手写原件、半写、错行、另一回执或当前质量事实缺失，一律 `current_execution_unverified`；来源文档自身的内容哈希**不证明作者**，可信性依赖正式 writer 的本次私有值和只读 Task 边界。不得让测试直接手写原件的正控升级为生产证明。

## 失败、半写与回滚

- 阶段事实或最终行发布失败：`stage_row_error` 可见，绝不发布 locator。`runStage` 质量事实已 create-only 写成而最终行失败时，事实原样保留为可追溯孤儿，不改写/删除。
- 前置条件如没有固定测试、未到 P10/T021、没有逐 AC 真来源：不发布消费原件及 locator，原 stage 结果仍可如实返回，P10 对账为 unknown。这不是 P10 完成。
- 一旦满足前置条件，写消费原件或发布后读回发生 I/O、哈希或身份错误：`runOfficialStage` 显式报错，不返回成功 locator；已写阶段行与不可变原件保留供诊断，不能事务性回滚它们。重试只能新跑并绑定当次最终行；同字节 EEXIST 可按现有方法幂等处理，异字节必须拒。
- writer 读回后、调用方使用 locator 前阶段行又变化：下游 reader 的前后两次行检查拒绝旧 locator。公开 locator 是查找线索，绝非通过凭证。

## 定向验证与旧三项失败

在 `tests/integration/vnext-official-stage-run.test.mjs` 或当前 P10 合同测试中用**正式 `runOfficialStage` 返回的 locator**做正控；删除/保留原手工原件样例只作 reader 单测，绝不可当 end-to-end。负控须有：回执 A/B 同树互换、缺任一质量事实、少列本次事实、错/缺 AC、回执/output/manifest/reporter 错 hash、错目录/库存、pending 或 `stage_row_error`、原件半写、当前行被另一次 run 换掉、locator 路径伪造、公开 JSON 直接伪造。源/材料变化后的旧回执拒绝；无真实 AC 时期待 unknown，绝不期待业务 pass。测试限受影响文件，不跑全量。

现有整份 `build-code-case-reconciliation.test.mjs` 是 54 passed、3 failed；失败集中在旧 `ORACLE-P10-CURRENT-CASE` 复用 Task。冻结旧 reader 的 `baseline-pair.txt` 只证明其中**一项**原有顺序污染；其余两项尚未逐项证明。先把这三个旧用例的 Task fixture 分开，每项分别用冻结旧版与当前版同顺序/单独运行并保存输出，定位是否共因；只改夹具隔离，不改验收断言来掩盖错绑定。然后同一目标完整定向文件重跑，全部通过后再交异源审查。未取得这一结果前不可宣称整份合同测试通过。

## 精确写面与剩余阻点

实施只应触及 `runtime/stage/stage-runner.mjs` 的本次 writer/私有返回点、`runtime/evidence/freshness.mjs` 的唯一认证 reader、`workflows/build-code/case-reconciliation.mjs` 的显式 locator 消费，以及上述定向合同/集成测试；`capture.mjs`、阶段行 schema、TaskHandle API 和公共命令不需修改。新生产文件、持久对象或扩大写面必须先登记 owner/consumer/删除条件并修 P10 材料。

**现阶段真实阻点**：正式运行没有逐 AC→固定回执的完整生产来源；当前大量变更仍未映射到业务案例。即使上述 writer/reader 机械接线成功，也只可说指定回执曾执行且本次运行消费；AC-26/27/33 的真实业务效果、旧失败修复后新快照复测及整个 P10 仍未完成。
