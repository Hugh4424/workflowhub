# P10/T021 来源澄清独立审查（只读）

## 结论

方向可保留，实施前有两处阻断需要在材料中说准，并据此补失败负控。未审查为生产通过；本审查没有改产品、材料、Task facts，也没有运行测试。

## 对照成立的部分

- `spec.md:454`、`P10.md:121-128`、`index.md:18` 都把 `verify --action=execute` 新实跑与随后 `run --action=execute` 消费分成两个公开命令；没有误称测试在同一个 CLI 进程里执行。原始 `FR-32/33`（`spec.md:306-307`）要求固定入口真实执行、逐例对账和修复后重跑，没有要求同一个 CLI 进程。
- 现有 `capture.mjs:197-219,313-335` 当次内存返回 `dispatch_state=executed`，但归档 receipt 不存此值；`runOfficialStage` 的质量事实返回 `quality_fact_refs`（`stage-runner.mjs:3447`），阶段行本身无测试 ref（`task-store.mjs:220-226`）。因此受信 capture 执行观察和官方 run 消费来源两份内容寻址质量原件，各补一个现存证据断点，有唯一读者且不必新增公开命令或进度状态。来源链通过只证明执行与消费；业务效果另核，这一点材料也写明。
- `runStage` 完成阶段末 reflection 后才返回；reflection 的 `withStageRow` 实际写当前行（`stage-runner.mjs:1192-1332`），所以 `runOfficialStage` 末尾理论上可读取阶段行。CLI `stage-runtime.mjs:1053` 是另一个游标写点，不是正式阶段行。本审查曾误认该写点，现已排除。

## 实施前需解决

1. **“本轮新实跑”不能只靠已存原件和时间窗口证明。** `P10.md:127-128` 同时规定首次阶段行不存在时以 Task/attempt 起点为界，并要求旧同树回执拒绝。若同一 Task 起点之后发生两次 `verify`，这两份执行观察都可合法标 `executed`、同树同材料、早于本次 `run`，而当前 `run` 的输入由调用者指定；仅凭现有字段无法知道哪份是“本轮预定”结果。已有前行时，两次 `verify` 也可落在同一窗口。原件内容寻址证明字节未改，不证明哪次调用是预定调用。应将判词收窄为“本次官方 run 消费了这份经受信入口实际执行、且满足明确新鲜度边界的回执”；若要求拒绝窗口内另一份同样真实的新回执，必须设计可信交接的本轮 token/单次消费关系，不能从时间或调用者自报补出。负控须按选定判词写，避免把真实消费错判为假或旧消费错判为真。
2. **必须从实际阶段行写入取得“这次”的身份，而非写后盲读当前行。** `P10.md:125` 要求 `runOfficialStage` 在 `runStage` 返回后读取完整当前行 hash。实际 `withStageRow` 在 `stage-runner.mjs:1311` 调 `writeStageRow`，但丢弃返回值；`task-store.mjs:417-456` 的 `writeStageRow` 本可返回刚写行的 `sha256`/`value`，相同阶段行随后又可被替换。如果另一次 run 在两者之间写入，`runOfficialStage` 读到的是别人的当前行；相同树、材料、时间接近和前后 hash 不能证明它由本次调用写出。请在受信阶段末写入点把本次 `writeStageRow` 返回的行 hash/字节经私有结果交给本次消费来源写者，或给等价的可失败因果证明；`stage_row_error`、临时 pending 行、被下一次替换、半写与重试都不得产出来源通过。此举仍可不改冻结行字段，但当前材料写面只列 `runOfficialStage` 后置点，应补明 `withStageRow`/`runStage` 私有返回通路及其 owner、消费者、删除条件。

## 其余边界

- `P10.md:128` 已列主要坏 ref/hash、错 Task/材料/树/命令/输出、缺逐 AC、P5 证书冒用负控；实现时还要检验“两个真实新 verify 在同一窗口，run 只消费其中一个”和“两次 run 交错写阶段行”。这正是上述两处断点的最短反例。
- 两份原件放在既有 Task `quality/evidence/` 作为质量证据，符合当前不新增阶段/进度账的边界；请让消费原件只断言真实性与当次消费，不充当工作许可证。原始失败及旧 receipt 保留。

## 材料修订后的增量复核

复核 `P10.md:121-128`、`spec.md:454`、`phases/index.md:18` 的当前字节，并对照 `stage-runner.mjs:1192-1405,3680-3700` 与 `task-store.mjs:417-456`。前述两处阻断对**收窄后的来源结论**已解除：

1. 现行材料只让执行观察证明“指定回执确曾由受信入口执行”，让消费原件证明“本次 run 实际用了这份回执”。同树同时间的两份真实执行可以分别成立；实际输入哪份就评价哪份，不能再用时间臆断另一份为假。只换回执不换观察拒绝、两个都换则按新身份评价，和现有证据能力相符。源码或目录/库存变化时不沿用旧效果，保留了 FR-32/33 的当前快照要求。
2. 现行写面已点名 `runStageEndReflection#withStageRow`、`runStage`、`runOfficialStage` 的私有返回通路。`writeStageRow` 的真实返回有 `sha256/value`；build-code 属于会先写 pending、再写最终行的 handoff stage，因此只传第二次最终写入返回、并在 `stage_row_error` 或只有 pending 时不生成消费来源，是可实施的。独立 reader 再读 `facts.jsonl` **原行字节**（包括行尾换行）核完整 hash，若另一运行已替换该行则拒绝。现行材料已列这几个分支及两次 run 交错负控，无须改冻结行字段。

**剩余边界，不阻止收窄合同实施：**“本轮新跑”若只靠调用者在 `run` 输入中填写执行观察 ref/hash，仍不能独立证明它刚从本轮 `verify` 返回；旧观察 ref/hash 也可被照填。现行材料已把本轮新跑列为更强的**单独主张**，未以它为“确曾执行+本次消费”来源通过的必要条件。实现和报告必须维持这个区分；若以后要机器认证“本轮”时间身份，需受信跨命令交接或等价调用关联及负控，不能仅靠该 ref/hash 或时间。当前材料、测试和产品均未实施，本增量复核只裁定计划可继续进入目标 RED/实现。

## 改为一份消费原件后的增量复核

当前 `P10.md:121-128`、`spec.md:454`、`phases/index.md:18` 已删新建执行观察，改用现有固定入口的 canonical receipt→output→子进程 manifest→原始 reporter 链。对照 `capture.mjs#runFixedTargetedCapture`、`canonical-receipt-writer.mjs#captureTests`，在信任既有 canonical writer 和 Task 存储的边界内，这条链确能证明**指定回执曾真实执行**：固定命令真启动子进程，绑定前后源码快照；外层收到子进程指针，父端再核 manifest、逐例 reporter、叶身份及目录/库存。因此再写一份普通执行观察没有增加此窄结论的证明力。`dispatch_state=executed` 是当次内存事实，材料不再跨 CLI 冒称“本轮新跑”。同树有效回执允许重复用于官方 `run`；代码、材料、业务目录、独立库存变更后必须重选重跑，符合 FR-33/AC-33 的新快照修复语义。单份消费原件若只写实际输入/当次 facts/本次行，不是第二进度账。

**尚有一个实施阻断：单份自内容哈希原件如何被独立读者定位。** `reconcileCurrentTaskCases({task,workspace,capture})` 现无消费原件 ref 参数；`TaskHandle` 有按 ref 读取和质量 fact 枚举，却没有通用 `quality/evidence/` 列举。一个 receipt 可被多个 `run` 消费，自内容哈希文件名又不能只由 receipt 算出。材料只写 `freshness.mjs` 重读原件，没有指定原件 ref 从哪来。应在精确写面内二选一：由受信本次 `run` 把消费原件 ref/hash 经明确的私有读取参数交给 P10 独立读者并逐字节认证；或让当前**最终行 hash**唯一确定单份原件的安全路径并以原件自身 hash 校验内容，同时解释这种行地址与“内容寻址”的关系、同源重试和冲突。不要为定位另造可变 latest 索引、第二文件或扫描目录。这个 locator 补齐前，单份原件可写却不能由声明的消费者稳定读回，不能判 P10 来源链已可实施。

## 定位通道补齐后的增量复核

当前 `P10.md:127`、`spec.md:455`、`phases/index.md:18` 已明确：本次受信 `runOfficialStage` 仅在 P10/T021 成功写入并重读唯一消费原件后，给已有 `stage-runtime-result.vnext` 增可选 `p10_consumption_evidence:{ref,sha256}`；调用方显式传给私有 `reconcileCurrentTaskCases({...,consumptionEvidence})`，`freshness.mjs` 用 TaskHandle 重读并校验内容哈希路径、原件自身字节、当前最终行、receipt→reporter 与逐 AC facts。locator 本身没有判真权。旧调用方或其它 Phase 缺字段时维持 `current_execution_unverified`，坏/缺 locator、半写、阶段行被替换均拒绝。这样补上前述单份原件定位断点，**当前材料没有结构性阻断，可进入目标 RED 和最小实现**。

这是公开结果 JSON 的可选字段增量，不是纯私有变化；材料已如实标明，原 schema_version、七类命令与冻结阶段行不动。仓内现有消费者按字段读取为主，未查到对 `stage-runtime-result.vnext` 顶层全部键的通用精确匹配；仍需在受影响定向测试里证明老调用路径没有该字段且旧读者能忽略它。`P10.md:127` 写了 owner、唯一消费、替代删除条件；`index.md:18` 同步了写面。`P10.md:129` 的负控清单目前未逐字列出错 locator、另一运行的 locator、旧消费者兼容，但上一段已有相应失败语义和 index 已提兼容/错绑测试；实现者应把这几例写进定向目标，不以文档声明替代实测。
