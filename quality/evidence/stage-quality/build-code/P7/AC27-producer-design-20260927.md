# AC-27 四类机器结果：写入修复设计（只读调查，2026-09-27）

## 结论与边界

CARD-05 已在当前分支，但 **AC-27 仍未生产四类当前原件**。现有 `stage-runner.mjs#acceptanceResultForSubjectStatus` 把 `missing` 写作 `deferred`；build-code 逐 AC writer 在 `:3320-3355` 把 coverage 的 unknown/missing 收成 `quality-fact.status=missing` 后，仍走该旧映射。`stage_end_spec_analyze` 的三值特例属于另一 subject。当前 AC-27 的 `deferred` 原件是历史实情，不能改字节，也不能拿它充作 `missing`。本设计只提出最小变更；没有改正式源码、材料或运行测试。

这里的四个结果是 `acceptance-evidence.v1.result` 的 `missing / inconsistent / incomplete / unavailable`。外层 `quality-fact.v1.status` 的既有语义不变：对逐 AC 事实，四者均为 `missing`，通过才 `passed`，真实断言失败才 `failed`。不新建事实类型、状态账本、公共命令或推进门。旧 `pass / fail / inconclusive / deferred` 的校验与历史读取维持原义。`deferred` 仅来自明确、已认证的延期/不适用处置，绝不能由“没有证据”自动推出。

## 真实输入到四类结果

判定放在现有 build-code 逐 AC 发布环节，输入只取 handler 已验证的当前 `acceptance_coverage`、`acceptance_execution.items`、本次私有执行器发布的原始 stdout/stderr 与逐 AC leaf、当前 Task/attempt/material revision/snapshot。调用者给的标签、测试总数、shell 退出码或 review 绿灯不能单独决定结果。判定优先级：哈希/身份损坏先拒绝发布；已认证叶子中的断言失败写旧 `fail`；其余冲突优先于部分完成，部分完成优先于单纯缺失，已证执行器/环境不可用优先于无证据。

| 结果 | 可失败的真实触发 | 需保留的原件与反例 |
| --- | --- | --- |
| `missing` | 当前 AC 无可认证的执行叶子，也无已证执行器故障；或声明的必需 AC 行完全缺席。 | 当前 coverage skeleton、材料/树/Task 身份与“未找到当前叶子”的观察写入现有 stage-quality 原件；故意移除本次叶子后必须仍 `missing`，不可变 `deferred`/`pass`。 |
| `inconsistent` | **各自合法且已认证**的来源互相矛盾：同 AC 两个执行叶子一个 `passed`、另一个 `failed`，或 coverage 声称 `covered` 而实际叶子为非通过。 | 保留两份原叶子及哈希和冲突说明；伪造 ref/hash、异 Task/旧树属于完整性拒绝，不得被宽松归为 `inconsistent` 后继续发布。 |
| `incomplete` | 有合法当前执行字节，但必需场景/AC 结果未齐、输出缺某个声明 AC，或有当前叶子而成功所需语义锚点/独立检查不全。 | 保留实际 stdout/stderr、逐 AC leaf、缺项及 owner；空测试、部分测试不能变 `pass`。若输出根本无法解析，记录原始字节与解析失败，不据子进程自报的 `outcome` 判完成。 |
| `unavailable` | 受信执行器/浏览器适配器/必需服务在运行期确实不可用，或进程超时/取消/启动失败；不能只是调用者字符串写了 unavailable。 | 保留受信执行尝试、错误/超时/取消与可得的 stdout/stderr；未启动时留当前 stage 原件中的具体 runtime 故障。若只是没有配置入口，区分材料缺失 `missing` 与确证环境故障 `unavailable`。 |

当前 `executeAcceptanceCommandOrService` 已保存原始 stdout/stderr，但把 `outcome=incomplete` 变成叶子 `missing`、`deferred` 原样保留，`acceptanceCoverageForExecution` 又会丢弃非 covered 的 refs。因此分类必须在这些原始资料仍在的地方完成，或把已验证的 refs 无损交给现有逐 AC writer；不能从丢信息后的 `item.status` 猜回四类。非通过且只有一份 leaf 时，不能用现有 `executionEvidence: actualLeaves[0]` 直接冒充外层原件，因为 leaf.status 可能与外层 quality fact 的 `missing` 不同；应沿现有 `stage-quality-evidence.v1` wrapper 保留 leaf ref/hash 和判定原因。

## 最小改动、owner 与消费者

1. **owner：CARD-04 当前 build-code 的 stage writer（CARD-05 合并后跨卡接线）**。`runtime/stage/stage-handlers.mjs#acceptanceExecutionFacts/#acceptanceCoverageForExecution` 只传递已认证的执行状态、逐 AC leaf ref/hash、必需场景身份与确证故障，不让调用者直接指定机器结果；`runtime/stage/stage-runner.mjs#executeAcceptanceCommandOrService/#publishVNextStage` 在现有逐 AC 发布循环判四类；`publishAcceptanceQualityFact` 增加仅供逐 AC 分支使用、严格白名单的结果参数。已有 `stage_end_spec_analyze` override 维持原样，泛用 `acceptanceResultForSubjectStatus` 和旧 `missing→deferred` 回归接口不为求绿而全局改写。
2. **独立 reader owner：CARD-04 runtime/evidence**。`runtime/evidence/freshness.mjs#authenticateNested` 在读取本次 AC wrapper 时重读原 stage-quality/执行叶子和 ref/hash，核 Task、subject、材料、树、状态及四类判据；不能只靠 `expectedPassed` 接受新词表。`runtime/evidence/canonical-evidence-validators.mjs#validateAcceptanceExecutionEvidence` 只在确需保存更细的原始叶子状态时扩展，保持旧叶子和旧 outcome 的字节/语义不变。`quality-store.mjs` 不进入 canonical 写路径；`core/task-close.mjs` 不加结果白名单。
3. **业务效果 consumer：CARD-04 P10**。`workflows/build-code/case-reconciliation.mjs#readCurrentEffect` 对 AC-27 从当前 Task 的唯一逐 AC quality fact → acceptance wrapper → stage-quality 原件 → 执行原始字节/本次定向收据逐层核实。先处理 206 条未映射改动与真实 case 关系，再把 catalog 的 `producer_status=not_implemented` 改为实际能力；不可只改 catalog 标记。P5 阶段末报告的 `not_done` 从已认证 wrapper 的四类结果入列，`deferred` 仍仅列在人写披露侧，不由转换器重命名。
4. **P11 边界**。浏览器 `execution_items.status=executed` 只证执行，UI 业务结果仍要由同一 browser 原始字节与 `ui_qa_projection` 核对；没有真实页面/服务时是 `unknown/unavailable`，不能把临时夹具变成 AC-27 的真实业务正例。

建议写面精确限：`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/freshness.mjs`，必要时 `runtime/evidence/canonical-evidence-validators.mjs`，以及对应的定向合同测试 `tests/deferred-acceptance-semantics.test.mjs`、`tests/contract/acceptance-result-machine-classes.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、新增或扩展一个逐 AC writer→reader 集成测试。P10 business reader/catalog 是独立的后续写面，不能和四类 writer 的局部 GREEN 混成一个结论。正式 P7 材料当前把 runtime/stage 列为禁写，实施前需由当前材料 owner 将此跨卡写面、测试和旧证据限制明示修订；修订会改变材料版本，所有需要“当前材料/树”的旧收据须重取。

## RED、GREEN 与兼容护栏（计划，未执行）

- **先取目标 RED**：同一受信 `runOfficialStage` 路径、四个隔离 Task fixture，每个 fixture 使用该次 Task/attempt/material/tree 的真实子进程或明确的执行器故障；读回 canonical quality fact、acceptance wrapper、stage-quality 原件和原始字节。`missing` 现会落 `deferred`；其余会被压成 `missing/deferred` 或无法独立读回，失败点必须来自四类判定，不算 import/collection 错误。
- **GREEN 正控**：四类每类一次，同一条 Task→材料→树→ref/hash 链闭合；`quality-fact.status=missing`，wrapper.result 等于对应机器类，reader 认证且最终验收不通过；旧显式 `deferred`、正常 `pass` 和真实 `fail` 维持原义。
- **拒绝负控**：改 stdout 一个字节、调换 Task/材料/树或 AC、把旧 leaf 冒充当前、删一个必需场景、伪造执行器错误、把 `deferred` 当 `missing`、把 `incomplete`/`unavailable` 当 `pass`、covered 与失败 leaf 冲突、同 AC 多份当前 quality fact 的歧义读取，均不得产生通过结论。伪造/损坏必须拒绝，不能当普通业务 `inconsistent` 放行。
- **定向命令**：以 `tests/contract/acceptance-result-machine-classes.test.mjs` 与 `tests/deferred-acceptance-semantics.test.mjs` 守八值/旧语义；以 `tests/contract/acceptance-execution-tier.test.mjs`、`tests/contract/acceptance-execution-medium.test.mjs` 守真实 writer/reader 与浏览器邻接；新增集成文件单独运行；P5/P10 修改时分别跑其受影响的 stage-end-report/case-reconciliation 定向测试。只跑受影响范围，不跑全量回归。每次保存源码/测试哈希、RED/GREEN 相同目标命令、原始 stdout/stderr、exit、Task/材料/树身份、每层 ref/hash 与独立审查。

**不能用当前外置 CARD-04 Task 连续造四份同 AC-27、同材料/树的当前 fact 来展示能力**：P10 reader 目前要求唯一候选，多份会变成 `conflicting_current_business_effect`。四类能力用隔离 Task 实际运行分别验证；正式 CARD-04 Task 只发布该次输入真的得到的一个 AC-27 状态。历史 123 条逐字兼容目前无认证 path→SHA-256 基线，维持 unknown/G2；可取得时先备份逐文件 hash，实施后同源核对，旧原件绝不重写。

## 本设计尚不能证明

四类正式生产、当前 AC-27 业务效果、P5 真实报告、P10 全量变化映射、P11 真实页面，以及历史 123 条兼容均未由此文完成。设计依据：`P10/T021-AC27-producer-audit-20260927.md`、`phases/P7.md#T015`、当前 `stage-runner`/`stage-handlers`/`freshness`/`canonical-evidence-validators` 与 `phases/P11.md#T022`；本文是实施路线，不是验收事实。
