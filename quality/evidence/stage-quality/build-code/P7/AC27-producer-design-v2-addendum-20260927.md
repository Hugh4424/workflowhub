# AC-27 写入设计补充：三处初审阻断（2026-09-27）

本文件补充 `AC27-producer-design-20260927.md`，旧文件保留原字节。仍是**未实施的设计**：未改正式材料/源码，未跑测试。若下文与旧设计冲突，以本补充的收紧条件为准；不能据此宣称四类已由当前 Task 产生。

## 1. 一条明确的判定顺序

每个 AC 只从本次受信 stage writer 认证的同 Task、attempt、材料版本、snapshot、scenario/AC 的原始字节判一次。**第一步是必需场景清点与完整性核验**：从当前材料取得该 AC 的每个必需场景，建立 `scenario identity → 唯一当前 leaf/ref/hash` 对照；未运行、无 ref、重复、异身份、旧快照和坏 hash 均不得成为 covered。坏绑定直接拒绝当前事实或标审查不可用，绝不包装成 `inconsistent`。清点结果须保留所有已认证的**非 covered**叶子 refs，供后续判 `fail/incomplete/unavailable` 和独立读回；不能像当前 `acceptanceCoverageForExecution` 那样只在 `covered/deferred/unavailable` 保留 refs。**只有每个必需场景恰有一份当前、可认证且通过的叶子，才有资格考虑 pass**；一个场景 pass、另一个场景无 ref 或 unavailable，当前 `statuses.every(passed)` 会误报 covered，必须先修这条路径。分类顺序随后固定为：

1. 对**同一观察身份**存在两份各自合法、均由受信执行器写出的相互矛盾原件时，`inconsistent`。例如同 Task/attempt/scenario/AC/断言 ID 的两份当前原始执行记录给出相反实际值；两次不同场景一 pass 一 fail **不是**这个情况。若现有执行器会在发布前拒绝此类重复，需先找到真实可到达的受信矛盾源；找不到就保持 `inconsistent` 的生产验证未完成，不能造测试假原件求绿。
2. 同一 AC 的任一**有效断言失败**，且无上述同身份来源冲突时，旧 `fail`；另一场景通过也不抵消失败。`coverage.status=covered` 是调用方声明，不足以把失败抬成 `inconsistent` 或通过。
3. 有受信运行期故障原件，且没有已经可判 `fail` 的有效断言时，`unavailable`；具体原件下节定义。
4. 有本次有效执行字节，但必需场景/断言、语义锚点或独立所需信息不齐时，`incomplete`。原始 stdout 可读但缺一个声明 AC 属此类；一个场景通过、另一必需场景未产生 leaf，也属此类；完全无当前执行来源属下一类。
5. 本次 AC 没有可认证执行来源、也没有受信故障原件时，`missing`。
6. 只有每个必需条件、场景和独立判定均有当前正面证据时才 `pass`。旧 `deferred` 不在机器判定链里；是否允许新写入，另按第 3 节审查。

外层 `quality-fact.v1.status` 的**逐 AC**映射应为：`pass→passed`、`fail→failed`、`missing/inconsistent/incomplete→missing`、有受信故障原件的 `unavailable→unavailable`。旧设计“**四类外层均 missing**”不适用于有真实故障的 `unavailable`。现有 `freshness.mjs#expectedPassed` 只接受 `missing` 绑定非终态，故实施时必须同步、定向允许 `quality-fact.status=unavailable` 仅绑定 `acceptance.result=unavailable`；反向错配一律拒绝。不得为了省改 reader，把有证明的 unavailable 压成 missing，也不得给没有证明的 missing 贴 unavailable。

## 2. `unavailable` 必须有受信故障原件

当前 `privateAcceptanceScenario` 的多个分支只返回 `{status:"unavailable", reason, evidence_refs:[]}`。**这个返回对象本身不是可供事后核验的故障原件**，`acceptanceExecutionFacts.items.status` 也不能单独作为证明。最低要求是在现有 stage-quality/acceptance 写入链中保存并绑定一份不可变观察，含 Task、stage、attempt、当前材料版本与树、scenario/AC、受信执行器身份、故障类型/发生点、实际错误码或运行时观测、记录时间；如进程已启动，还需实际 exit/signal/timeout/cancel/cleanup 与原始 stdout/stderr ref/hash。浏览器适配器未注入时记录受信 runner 当次检查 `typeof runControlledUiQa` 的结果与绑定身份；服务连接失败时保存实际连接/启动异常，不采信调用者的“不可用”文字。未启动的故障可以没有 stdout，但须说明未启动和可复核的检查点。

此观察可以放进现有 `stage-quality-evidence.v1` 的 `subject_fact`，由唯一 `publishAcceptanceQualityFact` 路径内容寻址发布；不能只追加新的进度文件或只引用内存状态。reader 重读原件、核身份/ref/hash/故障种类，接受的是受信 writer 的可核运行记录，不是假设离线 reader 能重新试一次服务。若当前代码无法留下上述原件，结果只能是 `missing` 或 `incomplete` 加具体诊断，**不得**写 `unavailable`。若故障原件本身损坏，按完整性失败关闭，不降为普通 `missing` 后让其他旧绿原件顶替。

## 3. 新旧 `deferred` 的边界

既有 `acceptance-evidence.v1.result=deferred` 原件保持字节、读回兼容及历史含义；它只证明那次写入发生过，**不证明真人批准，也不证明当前 AC 的机器 `missing`**。当前 command/service 子进程在 stdout 写 `outcome=deferred`，即使进程 exit 0，也只是子进程自报；不得直接成为当前阶段的人工延期或不适用授权。新写入只有在当前材料/规范明示该 AC 可延期或不适用、范围和理由已由既有可信来源认证，且若规则要求真人决定则能绑定对应的当前真人确认原件时，才可沿旧 `deferred` 语义发布；否则将原 stdout 原样保存，并按上节机器证据判 `incomplete`/`missing`，披露来源与缺少的授权。不得把“未配置、没跑、超时”称为 `deferred`。

`tests/deferred-acceptance-semantics.test.mjs` 里旧 `missing→deferred` 映射测试只锁**既有通用接口/历史兼容**，不是批准当前逐 AC writer 继续误写。P10 的 `CARD04-DEFERRED-ACCEPTANCE-REGRESSION` 特例只可验证旧原件读回和“不被当 pass”；不得作为新 `deferred` 的许可，也不能代替 AC-27 四类业务效果。P5 报告的机器未完成项只取已认证机器分类，人的延期/例外必须另有真实声明来源，不能互相顶替。

## 4. 针对性 RED/负控增补

- **冲突 vs 失败**：同 AC 两个**不同**必需场景，一个通过一个断言失败，必须 `fail/quality-fact.failed`；同一观察身份两份相反且均认证的原件才可 `inconsistent/quality-fact.missing`。同身份来源在当前执行器不可合法产生时，保留 `inconsistent` 未验证，不能用手写 fact/wrapper 冒充真实生产。`covered` 文字与失败叶子冲突，仍以失败叶子为准。
- **缺场景假绿**：同 AC 有两个当前材料声明的必需场景，场景 A 有真实 passed leaf，场景 B 无 ref 或受信 unavailable；`acceptanceCoverageForExecution` 和最终逐 AC writer 都不得输出 `covered/pass/passed`。A 的 ref/hash 在 noncovered 行仍须可读，B 的缺失/故障原件须可读；互换 A/B 顺序也不得假绿。场景 B 补齐并通过后才可重算为 pass，旧失败原件不覆盖。
- **故障 vs 缺失**：无 adapter 但没有持久故障观察，只能 `missing/incomplete`；受信 runner 写下当次无 adapter 的身份/检查点后才可 `unavailable/quality-fact.unavailable`。篡改故障类型、attempt、树、error、stdout hash 或仅传 `item.status=unavailable`，reader 必须拒绝 `unavailable`。真实超时/取消须保留实际 process/cleanup 记录。
- **旧延期 vs 新机器缺失**：旧 `deferred` 原件逐字读回且不 pass；新任务零证据输出 `missing`；子进程单独自报 `outcome=deferred`、无当前可信延期/不适用来源时不能得到 `deferred`；有合法来源仍不可改称 `missing`。故意把 P10 旧 regression 通过当成当前 AC-27 四类通过，必须被 current Task/material/tree/唯一候选核对拒绝。
- **状态配对**：`missing/inconsistent/incomplete` 只配逐 AC `quality-fact.missing`，受信 `unavailable` 只配 `quality-fact.unavailable`，`fail` 只配 `quality-fact.failed`；错配、`missing` 搭 `deferred` 的新写入、任何非通过搭 `passed` 均不认证。

仍只跑受影响定向合同与真实 stage writer→reader 检查，保留相同目标的 RED/GREEN 原始输出和 source/material/tree 身份；不跑无范围全量测试。P7 当前正式材料仍禁改 `runtime/stage/**`，实施前需由材料 owner 明示当前跨卡写面；本补充不代替该修订或独立审查。
