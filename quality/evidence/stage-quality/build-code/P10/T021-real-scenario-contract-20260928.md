# P10/T021：AC-26、AC-27、AC-33 真实验收场景候选（只读设计）

**结论：当前不能把三项验收报为通过。**现有官方 build-code 执行器可以在认证工作树执行 `command` 或 `service`，保存进程原始 stdout/stderr、退出码、Task/attempt/源码树/材料身份，并据子进程 JSON 产生逐 AC 叶；它没有独立判断业务效果。当前 indexed Phase 没有 `acceptance_role`、`acceptance_data`；post 投影器要求恰好一个验收 Task，且把该 Task 的全部 AC 复制给每个场景。三个 P8 case 只是局部种子，效果均为 `not_yet_observed`。此文不改材料、代码、facts，不运行测试。

## 现有入口核实

| 用途 | 当前可直接调用的真实程序 / 定向目标 | 能证明的边界 |
| --- | --- | --- |
| AC-26 来源普查 | `deriveDecisionLogOriginalSourceCensus` 已导出；`npx vitest run tests/contract/decision-log-census.test.mjs` 使用本卡真实 `decision-log.md`。`currentPostBuildCodeSpecAnalyze` 与 `publishStageEndSpecAnalyzeFact` 是官方阶段内部调用；报告转换器 `buildStageEndReportFacts` 已导出。 | 普查测试只证分母、节和索引；不能证明同次诊断、机器判决、正式报告三段。报告转换器自述输入来源未认证，T008 同次读写链未完成。 |
| AC-27 机器结果 | `validateAcceptanceEvidence`、`validateVerifyLeaves`、`authenticateQualityFactRecord` 已导出；`npx vitest run tests/contract/acceptance-result-machine-classes.test.mjs tests/deferred-acceptance-semantics.test.mjs` 可定向调用。 | 可验证四类可表达、非法值拒绝、旧延期语义；`validateVerifyLeaves` 没有已核实的当前生产 caller。历史 123 份只有汇总，缺逐文件旧字节基线，不能证明逐字兼容。 |
| AC-33 定向测试 | `selectAffectedCases`、固定 capture、`reconcileCurrentTaskCases` 存在；`npx vitest run tests/contract/build-code-case-selection.test.mjs tests/contract/build-code-targeted-runner.test.mjs tests/contract/build-code-case-reconciliation.test.mjs` 是局部合同目标。 | 可查选择、runner 身份、回执读取的局部实现；没有可直接运行并覆盖完整失败→同任务修复→新快照复测的业务入口。当前选择曾见 218 个变更路径仅 9 个映射、209 个未映射，须按新快照重算。 |

官方 `executeAcceptanceCommandOrService` 要求场景输出 `{entries:[{acceptance_criterion_id, assertions:[{id,expected,actual}], outcome?...}]}`，恰好覆盖声明 AC。`deriveAcceptanceExecutionAssertions` 只根据**子进程自己给的** expected/actual 是否相等算通过；它忽略子进程自称的 verdict。两值若同由一个有错程序生成，仍可能假绿。因此下面每行都要求第二个独立读取者，从规则材料、真实输入、原始输出和 Task 原件重算实际值；执行成功与业务通过分别记录。失败/缺源/不可用要留原样，不能用假的 `expected=actual` 补齐。

## 候选唯一验收 Task 与逐场景合同

候选承载点是 **P10/T021 的一个汇总验收 Task**，其 `Source / FR / AC` 如经材料 owner 审定可明确列 AC-26、AC-27、AC-33；语义与修复 owner 仍分别属于 P6、P7、P10。此为候选，不是当前材料。现有投影器不支持下表逐场景 AC 子集；需要先由 build-plan owner 确定承载点和写面，再加经过校验的可选 `acceptance_criterion_ids`：非空、无重、属于该 Task 与当前 spec，每项必测 AC 至少有一个场景；同一 AC 的多个必需场景必须全部有效。保留唯一验收 Task 规则，不把三项要求改成三个互相独立的进度权威。

| 场景（每行一条 `acceptance_data`） | 精确 AC | 受控输入与失败样例 | 独立通过判据与必须保存的原件 |
| --- | --- | --- | --- |
| 26-A 当前来源普查 | AC-26 | 本卡当前 `decision-log.md`；再对内存副本删 U/V/R 必需节、造零条目和错索引。不得改正式文件来制造正例。 | 第二读者按真实解析规则重数 `entries/source_units > 0`、`errors=[]`、R 索引；负例须逐条点名缺节/错误。保留输入材料 hash、原始诊断、场景 stdout/stderr、退出码及逐 AC 叶。只完成 AC-26 的一部分。 |
| 26-B 官方诊断与机器判决 | AC-26 | 使用同任务真实阶段分析事实；对缺节、矛盾及无法取得分析来源做受控负例。 | 第二读者核校验器输出逐条含原始错误，`stage_end_spec_analyze` 的 `summary.actual_outcome` 与 `subject_fact.evidence_state` 保留 `material_incomplete`/`inconsistent`/`unavailable` 原词；质量缺失仍不新增阻止继续的门。保存官方结果、同次质量事实与验收 wrapper 的精确 ref/hash、原始诊断和来源身份。只见通用 `missing` 不通过。 |
| 26-C 报告可见性 | AC-26 | 同一次真实 26-B 负例与 P5/T008 认证报告；反例删去一个诊断或换入别次事实。 | 报告「没做到」逐条列出机器判决、原因和来源；第二读者核报告输入与当次 Task/树/材料/原始事实一致。保留报告原字节/hash及逐项来源。T008 未交付时此行 unavailable，不能用报告转换器夹具代替。 |
| 27-A 四类与非法值 | AC-27 | 分别造 `missing`、`inconsistent`、`incomplete`、`unavailable` 的验收事实并直调真实导出；造非法值（例如 `timed_out`）。 | 第二读者从真实导出结果核四类都被接受、非法值拒绝且错误列全部允许值、存储 helper 映射 `incomplete` 而非 `passed`、`quality-fact.v1.status` 仍三值；存输入、输出及实现模块 hash。此行证明可表达性，不声称正式 writer 产出四类。 |
| 27-B 旧延期与旧字节 | AC-27 | 已认证的旧 `acceptance-evidence.v1` 逐文件基线和合法 `missing/deferred` 输入；再给会误判 passed 的负例。 | 第二读者逐文件比较旧/新原始字节 hash，确认合法延期仍延期而未判 passed、非法变化被抓；保存基线来源、每文件 path/hash、旧新字节及输出。旧 123 条只有汇总，基线现不可得，此行保持 unknown；聚合 AC-27 的正确结果若两行都通过才可为 `passed/pass`，**不能**要求聚合 fact 自己同时是 `missing/deferred`。 |
| 33-A 当前每例效果 | AC-33 | 当前可信起点与源码差分、P8/P9 目录和独立库存，经安全选择进入真实固定 runner；错目标、重复、skip/todo、零例、仅名称通过、错业务效果作反例。 | 第二读者核每个应测 case 的规则版本、AC、适用层、真实 full test ID、命令、环境、原始 reporter/exit/hash/receipt、独立业务观察、结构和风险；未映射变化保持 unavailable。保留选择、目录/库存版本和各层原件。三个 P8 seed 只作有限局部输入，不覆盖 AC-33 全部。 |
| 33-B 失败→修复→新快照 | AC-33 | 在同一 Task 中留一项**真实**失败的代码/业务例，再修根因形成不同源码树，重算差分、选择集及邻近旧回归，重新执行。若无真实失败，不捏造一次；等待自然发现或用真实可逆缺陷做受控样本，但需明确样本范围。 | 旧失败原件、发现 ID、owner、归因及旧树身份不可变；新树的重选结果、完整 runner 身份、业务正反效果和邻近回归新原件可读；第二读者核源码变化确修该因、旧失败未被覆盖、当前事实只引用新树并引用旧→新处置。当前固定对账 reader `requirePassed:true`，不能拿它认证旧失败；旧失败需独立可读的失败 receipt/原始 reporter 链。只新绿、沿用旧选择或关单后伪造 reopen 均不通过。 |

## 精确缺失的生产者与写面

1. **材料生产者**：build-plan owner 尚须确认汇总验收 Task 和上述场景是否与当前 Phase 写集一致，更新 P10/spec/index 对应责任、输入、消费者、删除条件；当前任何 Phase 都未声明 `acceptance_role/data`。不要仅为填字段写一个自报 JSON 适配器。
2. **场景映射生产者**：`projectPostPhaseAcceptanceExecutionData` 目前只允许五个场景字段且把整张 Task 的 AC 复制到所有场景；需局部扩逐场景 AC，并负控未知/重复/漏 AC。`acceptanceCoverageForExecution` 再按每项必需场景及真实叶判断。现有 `publishAcceptanceQualityFact` 单成功叶捷径会丢外加固定测试 ref，需保留原叶与补入来源并让读者重核。
3. **业务观察生产者**：26-B/C 缺同次正式诊断→报告认证；27-B 缺历史逐文件基线；33-A/B 缺覆盖当前变化的真实业务入口与独立效果观察。现有三个 P8 种子、合同测试和子进程自报 expected/actual 均不能填这些空。若需要新 `service` 适配器，先在 move-map 登记 owner、唯一消费者、替代与删除条件；输出原始观察及来源，独立 oracle 不得从适配器自己的通过字段取结论。
4. **本次运行来源生产者**：官方 `run` 实际输入的固定回执须按 receipt→output→manifest→每例 reporter 重读，并与逐 AC 叶、本次返回的完整质量 fact 列表及最终阶段行写入返回身份精确绑定。CLI 后置接点可用，但 `reconcileCurrentTaskCases` 当前入口要求的 capture 对象不能由调用者自报补造；当前消费原件 reader 也未证质量 fact 列表等于本次返回。只带 locator 或同树旧 fact 不能证明这次消费。来源认证通过仍不等于业务效果通过。
5. **旧失败链与覆盖**：当前读者只认证 passed 的固定测试回执；33-B 需要旧失败的独立不可变来源和当前新回执，并由 reader 比较两个树、重选、邻近回归和处置。若当前仍有未映射路径，应保持不可用并补目录/库存与消费者关系，不能靠三个 seed 绿转为覆盖完整。

适用的定向失败检查：场景漏 AC 或 AC-27 少一行、非法 AC/重复场景、假 `expected=actual`、报告缺诊断、历史基线缺失、同树旧 fact 冒充本次、旧失败丢失、新树未重选、skip/todo/零例/错 runner、未映射路径，均不得升为通过。真实页面/服务是否适用尚未核实，不能先写 UI `N/A`。本设计只列候选；授权写面和真实原件齐全后，再分别跑受影响定向测试与独立审查。

依据：当前 `spec.md` AC-26/27/33；`phases/P6.md`、`P7.md`、`P10.md`；`runtime/stage/stage-content-contracts.mjs:8154-8225`、`stage-handlers.mjs:1584-1665,1730-1830`、`stage-runner.mjs:2274-2310,2818-2943,4369-4440`；`runtime/evidence/canonical-evidence-validators.mjs:107-145`；`workflows/build-code/case-reconciliation.mjs:380-630`；`P10/T021-real-ac-producer-path-20260928.md` 与 `P10/T021-post-run-consumer-independent-review-20260928.md`。材料和代码均在并行变动，实施前按当时字节复核。
