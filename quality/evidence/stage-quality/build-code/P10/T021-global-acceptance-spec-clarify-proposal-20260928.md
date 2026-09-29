# CARD-04 全部 19 条验收：规格澄清提案（只读设计）

状态：**提案，尚未写入正式材料、代码或 Task facts；没有任何验收通过结论。**依据当前 `spec.md` Appendix A（AC-16…AC-34）、P1…P13、`T021-all-ac-global-coverage-audit-20260928.md` 和 `T021-real-scenario-independent-review-20260928.md`。实施前须按当时源码和材料身份重核。

## 1. 唯一入口与时序

**指定 P13/T024 为唯一 `acceptance_role=acceptance` 的全局验收 Task。**它本来负责 P1…P12 最终事实聚合；把 19 个 AC 全部列入该卡 `Source / FR / AC`，并由同卡唯一 `acceptance_data` 声明场景。此字段是验收清单和消费入口，**不把 P1/P5/P6/P7/P8/P9/P10/P11/P12 原来的生产、测试、审查责任转移给 P13**。P10/T021 的七行候选只能成为全局清单中 AC-26/27/33 的部分场景。`phases/index.md` 仍是纯指针，不记进度。P13 的最终报告不是原件生产者，也不能给原件自签通过。

当前 `projectPostPhaseAcceptanceExecutionData` 扫描全部 indexed Phase，要求恰一张验收卡，却把卡上所有 AC 复制到每个场景。因此材料作者先确定下表的场景全集，代码只给**每个场景**加 `acceptance_criterion_ids` 子集，并在解析时拒绝空、重复、未知、卡外、spec 外 ID 和未声明任何场景的有效 AC。一个 AC 可有多个必需场景；所有必需场景均真通过才可记该 AC 通过。场景标识使用现有 `source/sample/scenario/tier` 四元组，不能用同 AC 的别的原件顶替。浏览器场景仍须单 AC、真实页面和隔离浏览器原件；页面适用性未查清时为 `unknown`，不能预写 N/A，也不能编造页面。

**早期运行会看到这张卡，不会等到 P13。**运行器只执行已就绪、能绑定同 Task／当前材料／当前源码树的场景；尚未产出的 Phase、诊断、报告、独立审查和授权答复必须逐场景留下 `unknown` 或 `unavailable` 及原因/owner，不得因缺来源把整次开发抛错，不得产生 `passed` 叶。可取得的命令或服务只采原始输出、退出、测试身份和哈希。现行 `executeAcceptanceCommandOrService` 允许子进程同时填写 `expected` 和 `actual` 后由它自己得到 `passed`；对本卡业务场景，该结果只算**执行原件**。在正式逐 AC `passed` 发布前，现有 handler/runner 的私有只读消费者必须从独立规则、当前业务输入、真实输出和 canonical 来源重新判定，失败则保留失败或未知。不能靠子进程自报相等、退出 0、reporter 绿或 P13 汇总文案代替判真。

**后置来源用下一次现有 `run` 或最终 `verify-code` 既有读路读回。**同一次 build-code handler 先执行场景，返回后 `runOfficialStage` 才产 `stage_end_spec_analyze`，再返回后 P5 hook 才可能产报告；同次子进程不可能读取未来的本次原件。前次正式 `run` 的诊断和 P5 报告只能在**来源稳定且显式带前次 attempt/ref/hash**的下一次 `run` 中认证，清楚标“前次同身份”，不能写“本次”。若源码树或材料变了，旧来源失效，重取新原件；不要无限用上一次分析去认证本次分析。最后的独立语义审查和授权答复发生于 verify-code：AC-34 在 build-code 阶段持续 `unknown`，最终从现有 verify-code review、最后确认及其真实答复读回，不倒填较早的 build-code 叶。`verify --action=execute` 当前是测试捕获入口，不是通用后置验收读取器；不应暗改其语义。确需在正式结果中表示后置判决时，由既有 `run --stage=verify-code` 及当前质量事实消费，且必须经材料 owner 确认其真实接口；否则明确保留未完成，不假称当前已有接线。

## 2. 19 条的实际场景与责任

下表是**必须补齐的场景类别和原 owner**，不是已存在的 `acceptance_data` JSON，也不声明来源已经可用。每行至少要有当前身份、真实正例、拒绝/损坏或缺失负例、原始来源 ref/hash、独立判据；多条件一行均是必需条件，不能挑一个绿例算整项绿。

| AC | 必需场景／独立判据 | 原生产与审查 owner |
|---|---|---|
| 16 | 本卡 19 条定义逐条含条件、动作、可量标准、失败例；删一个要被抓；定义完整不等于行为已执行 | P1/T001、T003 |
| 17 | 实际实施者启动后：只读模式改测试被拒；隐藏模式读测试被拒；记录受限环境和真拒绝 | P6/T025 |
| 18 | 同一个行为测试、同一字节，改前因目标断言失败、修后通过；来源/树/命令分别绑定 | P6/T026，P3/T005、P4/T006 辅助 |
| 19 | 完整纯文档 Task 有真可失败检查，或有明示理由/风险/披露；单行样例须连 Task 交付核 | P6/T027 |
| 20 | 代码路线真实命令/退出/输出/产物；不适用路线的消费者核查及理由；报告逐项读回 | P5/T007–T008、P13/T024 |
| 21 | 完成声明后可从真实入口回读测试、验收和报告；早于实际执行的声明应被拒 | P1/T002、P4/T006、P5/T007–T008、P13/T024 |
| 22 | 上游每个编号都有真实 spec 落点或明示未完成/owner；删行和自指落点要失败 | P6/T010 |
| 23 | 真实 CLI 子进程端到端读取指定链路，正例和破坏来源负例均可回读 | P6/T012 |
| 24 | oracle 镜像在实施者写集外、0444、无仓库副本；实测实施者不能改/看目标且披露同 OS 用户限制 | P6/T011、T025 |
| 25 | 正式历史读取器读真 d1 配对；故意损坏确实拒绝；私有探针不能冒正式公共回执 | P6/T014 |
| 26 | 来源普查非零无错；本次正式诊断逐条可见；P5 报告“没做到”与可认证诊断/任务事实对应。报告只能在发布后用显式旧 attempt/ref/hash 后读；缺报告保持未知 | P6/T009、T013；P5/T007–T008 |
| 27 | 四种结果能分别表达且缺失/延期不误判通过；旧记录逐文件原字节与可信旧基线相等。123 条汇总/当前重序列化不能代旧基线 | P7/T015 |
| 28 | 模板/技能含三节，真实决策日志解析非零无错，删节负控；不得把它做新许可门 | P7/T016 |
| 29 | 六项责任每项有真实消费者、失败原件、owner、未证项及保护写面，逐项核而非汇总绿 | P8/T017；P13/T024 汇总 |
| 30 | 唯一业务目录与独立测试库存双向对应，含正反和旧回归；当前变更全量重新映射，漏映射不通过 | P8/T017、P9/T019、P11/T022 |
| 31 | 每 Task/Phase 的适用测试层、跨任务旅程、目标、失败标准、环境及证据确实写全，并核实际执行差距 | P8/T017、P10/T020–T021、P11/T022 |
| 32 | 当前可信起点→完整差分→安全固定命令选择→真实执行/原始回执；真实服务/页面适用时实跑，未知保持未知 | P9/T018–T019、P10/T020、P11/T022 |
| 33 | 每 case 用独立业务规则和真实消费者重算效果，不能信子进程自报；保留**旧失败的原始 reporter/回执/旧树**，同 Task 修复后新树重选、实跑及邻近回归，前后链完整 | P10/T020–T021、P11/T022 |
| 34 | 逐 AC 机器事实＋独立风险选样，列已/未抽 case ID、外部依赖与残余风险；现有 verify-code 最后确认中记录授权者真实接受/拒绝/延期与回传证据 | P12/T023、verify-code 授权者；P13/T024 只汇总 |

当前三个 P8 种子不是 AC-26/27/33 的完整场景。最近一次 218 条变化有 209 条未映射只是旧快照观察，实施时要重新计算；任何未映射仍使 30/32/33 不能通过。AC-27 的旧记录逐文件独立旧基线尚缺：能找到可认证历史原字节及清单才可比较；找不到则这一子场景和整条 AC 保持 `unknown`，不得制造基线。AC-33 旧失败必须读真实失败原件，现有 `requirePassed:true` 读路不能冒充失败认证；受控样本只能证明机制，不覆盖完整业务。AC-34 的用户确认尚未发生；不得自行补答复。

## 3. 最小材料与代码写面

**材料由 build-plan owner 审定后修订：**`spec.md` 增一段“唯一全局验收及前后置时序”，只引用既有 19 条、不改 AC 原文；`phases/P13.md` 的 T024 增 `acceptance_role`、19 个 AC 的 `Source / FR / AC`、逐场景 `acceptance_data` 及来源/独立 oracle/owner/就绪与未知规则；`phases/P10.md` 将七行候选改为全局卡的 AC-26/27/33 供应计划，不另设验收卡；`phases/index.md` 仅更新 P13 指针行的真实 write set/consumer。P5/P6/P7/P11/P12 若其场景需新来源，分别由各自材料 owner 窄修订，保留本来写面。材料先过独立审查，再实施，不能把这份提案当正式授权或计划 RED。

**代码只扩现有消费者：**

1. `runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData`：逐场景 AC 子集，校验唯一全局卡、全 19 条声明、重/漏/越界 ID 和 browser 单 AC；当前材料缺失时给可读诊断。
2. `runtime/stage/stage-handlers.mjs#acceptanceExecutionFacts/#acceptanceCoverageForExecution`：场景就绪与未就绪分开；多场景取交集，缺原件/后置来源保留未知；**正式 `covered` 前调用只读独立来源判据**，不可只核叶 `status=passed`。浏览器现有同源绑定继续保留。
3. `runtime/stage/stage-runner.mjs#executeAcceptanceCommandOrService/#publishVNextStage`：命令结果只保存原件；只有独立判据用同 Task／材料／树／attempt、规则版本和原始业务输入/输出复算为真，才发布 `passed`；一叶快捷路径也必须保留独立来源 ref/hash，不能因 `executionEvidence` 覆盖掉补源。P5/诊断等后置事实沿现有发布顺序，下次 `run` 显式消费前次原件；不得调整成“提前发布”假报告。
4. `runtime/evidence/freshness.mjs`：按现有当前事实与显式 ref/hash 读后置来源、旧失败/新树及最终确认，不扫目录找“最新”，不从 `index.json` 或文案臆测不存在的 producer；缺失/旧树/错 Task/错 attempt 返回未证。AC-34 若需在 `verify-code` 结果接线，另以既有 handler/确认槽的**真实** consumer 追加，不建新 stage、公共命令或第二张进度表。
5. `runtime/stage/stage-handlers.mjs#e2eAcceptanceFacts` 所在 verify-code 现有读路与 `tools/cli/stage-runtime.mjs` 的现有 `run` 输入校验，仅在实际验到 AC-34 缺显式来源传递时作窄改：读既有独立 review／确认原件与真实答复并展示接受、拒绝或延期；不得把通用 confirmation `passed` 当业务接受，更不得让它替代不可逆操作的单独授权。没有明确来源绑定就保持 AC-34 `unknown`，不能从 build-code 的早期行倒填。

对于只有**发布后事实**的场景，现有 `command/service/browser` 三种执行形态不够表达。最小扩展是在同一张 `acceptance_data` 卡内加入私有 `readback` 场景形态：它不启动子进程，只消费**显式定位的**既有原件 ref/hash，由上面第 2/4 项的同一只读判据认证；其未就绪结果为 `unavailable`，不能生成 `passed`。若现有正式阶段行或返回值没有可安全传递的定位值，应在**现有** `run` 输入/返回值上做仅供该场景使用的可选 ref/hash 传递，运行时重读原件及当前阶段行；不能改借 `quality_fact_refs`、反推内容哈希路径、扫描目录或建立可变 latest。AC-34 的 `readback` 只在 verify-code 最后确认原件真的产生后读取；它在 build-code 的 19 行覆盖中仍是未就绪。这是对现有验收投影的私有取证方式，不增加公共命令或进度对象。具体输入字段形状和受保护写面必须在材料审定时与实际 `run` schema 对齐，当前**没有**这个可用接口。

| 最小变更 | owner | 唯一实际 consumer | 替代／删除条件 |
|---|---|---|---|
| P13/T024 的一张 `acceptance_data` 清单及逐场景 AC 子集 | CARD-04 build-plan | post Phase 验收投影器 | 经审查的同一全局清单取代时删除旧声明，不双写 |
| parser 与现有 handler/runner 的私有 `readback`、独立判真和逐 AC 发布接线 | CARD-04 stage producer | 官方 build-code `run` 的验收事实及 verify-code 当前事实读回 | 既有消费者能直接读同一来源并通过错绑／假绿负控时删特例 |
| P5 报告、P7 旧字节、P10 旧失败和业务效果的现有 Task 质量原件 | 各原 Phase producer | 同一验收只读判据；P13 只读汇总 | 被同等可认证的 canonical 原件替代时删读路，保留历史原件 |
| 必要时的可选显式 locator `ref/sha256`（不含判决） | 官方 `run` producer | 本次/后次只读来源认证器 | 当前阶段行已有同等安全显式指针并过负控时删除 locator |

以上是候选写面，不能一口气授权跨 P5/P6/P7/P11/P12 的受保护文件。新生产文件或 schema 若确有必要，先在 `docs/architecture/move-map.json` 登记 owner、**唯一** consumer、替代关系、删除条件；优先复用现有 canonical 质量原件和 `facts.jsonl` 阶段行。验收矩阵保留在 P13 材料，执行事实保留在既有 Task quality/facts，P13 报告只读它们。任何“当前来源 ref/hash”须来自正式生产者返回值或显式输入，不从路径名/汇总文案推断。

## 4. 必须先写的反例与执行顺序

1. **先定材料**：确认 P13 唯一卡、19 条到场景及 owner 的双向表、AC-26 前次来源语义、AC-27 旧字节来源、AC-33 旧失败来源、AC-34 verify-code 后置边界；独立审查。先保留现有 `unknown`，不得为先追求绿色缩小分母。
2. **再修解析与假绿**：定向测试“19 条中漏 1、重 1、场景混入外部 AC、一个 AC 两场景仅一通过、子进程 `expected=actual` 但独立原始效果相反、单叶补源丢失、浏览器错绑”先 RED 后 GREEN；只跑受影响测试。
3. **生产者逐段补齐**：P5 真报告与私有读回，P6 真 CLI/权限/历史原件，P7 可信旧基线，P8/P9 当前业务映射，P10 安全执行及旧失败→新树复测，P11 真实页面适用性，P12 独立审查与确认交接。每段保留原始失败和真实正反 oracle；未就绪不挡同 Task 修复。
4. **最后后读与总核**：一次正式 `run` 留当前可得执行原件；后置原件发布后再用既有 `run`/verify-code 消费**明确前次身份**，定向负控删 ref、改 hash、换 Task/attempt/树/材料、替换旧报告、旧失败误作通过、未授权却称 AC-34 通过。P13 汇总与独立叙述逐项核所有 19 条、每 Phase/Task 原件；真实用户答复只用实际确认原件。任何一项无强证据则全卡仍未完成。

**完成界线：**这个方案能让实现继续，但目前唯一 Task、逐场景子集、独立判真接点、后置读回、旧基线、完整业务覆盖及最终答复均缺；所以当前不能声明任一整条 AC 因本提案通过，也不能声明 build-code 已完成。
