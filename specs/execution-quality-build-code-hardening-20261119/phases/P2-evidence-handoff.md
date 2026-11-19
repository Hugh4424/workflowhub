# Phase P2 — 把确认和下游读回绑在同一份原件上

交付可独立验收的结果，供实施者、独立判定者和下游沿同一原件复跑。
机器标题和字段保留现行合同字面写法。

## 哪些节必须写，哪些可以省？

本段给出可独立交付、观察、回退的单个结果。
| 段落 | 状态 | 本段用法 |
| --- | --- | --- |
| 交付、依据、开工材料 | written | 定位可观察结果、来源及上游输入。 |
| 验收、写集、验证 | written | 找判据、实际写主和反例。 |
| 消费者、任务与机器字段 | written | 交已知输入及执行边界。 |
| 末验收 | not-applicable | 完整验收归第 10 段。 |

## 这一 Phase 交出什么？

下一位作者可从冻结引用读到同版交接原件，步骤检查器可核当前 v2 的工作包与既有收敛清单。
改动前：当前链检查能报告结构，旧转录缺独立调用标识，交接文件存在不能证明下游读过它。
改动后：独立读者可从真实入口对照正常与失败，原件留本段既有证据路径。
非目标：保留既有确认与交接职责；旧摘要、补录原件化、第二账本和历史证据改写均无消费者。
主要风险：将版本冻结推到实际归档后会产生循环依赖。先取得可读对象与现有确认来源，再让下游实读。
相邻阶段：给 P3 实际对象 ID、行位、同版确认、读回和开放问题。把规划入口本次版本交 P4 接续写数据段。
**配套与影响**：配套调整＝talk/U/refs/facts 与确认回执的读取、`skills/stage-handoff/SKILL.md` 方法第 4–7 步；配套迁移＝旧摘要交接转不可变引用、backfilled 逐条标身份；配套移除＝第二份证据账本与手写九字段摘要合同；影响范围＝build-plan/build-code 的读取入口、旧任务交接、链检查告警口径。
未决事实见验收和停止条件。未知信号由原负责人提供恢复条件。

## 这一 Phase 怎么验收？

完成本段需要约 39 活动分钟。两条验收各自保留，后段只消费实际原件。
本段涉及命令、材料或宿主读取；没有页面、路由和组件触碰。

| 判据 | 执行者 | 活动分钟 | 硬估算分钟 | 重验预留次数 | 证据档位 | 所需资源 | 可观察量 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-P2-001 | 独立执行者 | 10 | 16 | 1 | 独立读回级 | 冻结 Git 对象、补录原件、可回读确认 | 独立执行者逐条运行 git cat-file -e，再用 git show 读同一对象并按行位/sha 对确认。 |
| AC-P2-002 | 独立执行者 | 14 | 22 | 1 | 独立读回级 | 现交接及真实下游、受控缺读负例 | 独立执行者跟踪正常入口，核对象与前后 SHA；复核机检读到的清单、包和原证据。 |

活动总量为 10 + 14 + 8 共享准备 + 7 一次受影响重验 = 39 分钟。
共享准备涵盖冷启动读源与夹具准备。执行时记录实际分项，重验预留只计一次。
硬估算为各条硬估算与准备、重验相加，共 53 分钟。以上均 provisional。
估算逐项按当前正常与坏例复跑、独立读回、原件核对的操作量；不是实测活动账。
CLI 亚秒基线详见任务库测试蓝图。当前无可比活动账，实施预算仍待按已知窗口确认。
等待：真实冻结来源及下游启动时间由材料和规划负责人提供。双方等待单列，未发生。

### 怎么判验收 3？

来源指针与确认落在同一原件。
独立执行者逐条运行 git cat-file -e，再用 git show 读同一对象并按行位/sha 对确认。
条件：冻结 Git 对象、补录原件、可回读确认。
故意破坏：故意偏移一行或替换字节。诊断必须点出受影响引用。
证据：材料负责人在对象冻结后交 Git 读取原件和确认件。
实跑边界：incomplete；有历史转录但缺当时来源 ID。同段命令和独立观察的实际判定分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

### 怎么判验收 4？

规划入口确实消费同一个交接版本。
独立执行者跟踪正常入口，核对象与前后 SHA；复核机检读到的清单、包和原证据。
条件：现交接及真实下游、受控缺读负例。
故意破坏：静态放一份回执却没真实读取，或改上阶段日志，均失败。
故意破坏收敛清单的唯一引用、可读性、范围或包号，检查器须分别报具名缺口。
正向以当前 v2 受控输入和已存在的合规清单验证实际机检读到同包、同一原字节。
证据：同版交接原件、首次读取及辅助链输出；另保真正步骤命令的 JSON、所读清单与原证据。
收敛清单读取能力在 P2 独立验。P3 开工时沿同一入口实读真实交付。
实跑边界：incomplete；当前无拟实施的真实消费回执。同段命令和独立观察的实际判定分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

## 为什么现在做，依据是什么？

下一位作者可从冻结引用读到同版交接原件，步骤检查器可核当前 v2 的工作包与既有收敛清单。
当前包的设计、回退与配套沿决策日志，唯一验收在规格附录 A。
这段效果能独立用一个可回读的消费者、真实结果和具名坏例判断。

## 开始前读什么？

先读包内决定与附录 A，再核首改符号和当次执行输入。

| 原件 | 开工前核什么 |
| --- | --- |
| `decision-log.md:175–202,259–297` | 真正来源、转录身份、引用与读回 |
| `decision-log.md:827` | G-13 明定包 2 的收敛清单机检 |
| `tools/cli/check-stage-steps.mjs:954–983,1089–1121,1227–1231` | 当前包集合、唯一指针、界内读回和具名缺口 |
| `workflows/make-decision/SKILL.md:271–273,385` | 既有清单生产合同，复用其唯一权威 |
| `tests/contract/check-stage-steps.test.mjs:40–57,111–133,293–327` | 实际 CLI 隔离装置、错包和越界反例 |
| `spec.md#appendix-a--验收判据唯一权威` · AC-P2-001、AC-P2-002 | 验收 3、4 的观察对象 |
| `runtime/task/task-handle.mjs:81–115` | openTask、readRecordBytes、appendRecord、recordConfirmation 当前调用面 |
| `skills/stage-handoff/SKILL.md:14–22` | 单写交接与下游回读，旧原件只读 |
| `tools/cli/check-decision-log-chain.mjs:399,696–739` | 现链检查的读源边界 |

P1 给当次原件引用；材料负责人提供已冻结 Git 对象、同版本的确认与补录原件；规划作者现场提供新消费读取。

## 每个文件由谁改，先做什么？

产品文件由本段实施者独占。标出的测试路径由独立作者先冻结具名断言。
实施者消费测试，在提交的阶段范围内对账，未经裁决不改冻结测试。

| 路径 | 具体锚点 | 变更与消费者 |
| --- | --- | --- |
| `skills/stage-handoff/SKILL.md` | 方法第 4–7 步 | 把已绑定对象、开放问题与读回动作写入唯一交接方式。 |
| `workflows/build-plan/SKILL.md` | 第 1 步 read-current-materials | 在实际首次消费时记同一对象及原始读取证据。 |
| `tools/cli/check-stage-steps.mjs` | expected、moduleBody、convergenceRef、convergence.gaps | 接 P1 交回的检查器，让现 v2 包目录、包详情及合法清单进入原读取分支。 |
| `tests/contract/check-stage-steps.test.mjs` | 新增 ORACLE-P2-CURRENT-V2-CHECKLIST | 接 P1 交回的文件，仅加 v2 清单用例，保 P1 冻结断言。 |
| `tools/cli/check-decision-log-chain.mjs` | checkDecisionLogChain 与 createSourceReader | 已有有源诊断承接自引、漂移与非法来源。 |
| `tests/contract/decision-evidence-consumption.test.mjs` | 新增具名 ORACLE-P2-BOUND-HANDOFF 用例 | 隔离源对象、字节/行位错配和真实读取对照。 |

本段先回读 P1 实际交回的检查器、测试和具名写主回执。
确认交回版本、真实写集和当次测试原件后再改读取端。
本段先改规划入口的首次读回。P4 读回当前版本后接同文件的数据段。
P3 接手本段的证据测试文件，只追加独立用例。
隔离证据和真实旧材料按其既有写主发布或只读，均不扩为仓库写集。
回退只撤销本段实际产品改动，保失败与已有原件，复核同一消费入口。

## 怎么验证？

用现有真入口观察实际行为，再用独立样本把一处条件弄坏并复跑。
Git 对象和任务原件分别守版本与身份。下游首次实际读取才产生读回。
当前任务原件 `quality/tests/2026-11-19-014-build-plan-stage-steps-readback.output`
已报告“权威模块集合未取得或重复”和“收敛清单指针未取得”，保原始修前读数。

从现 `expected` 和 `moduleBody` 开始，识别当前 v2 的现有包目录及对应包节。
将同一包号接回现 `convergenceRef`、界内读回及具名缺口，保旧 WP 读取。
沿用当前日志实际声明的唯一清单引用和已有关联证据。缺指针保真实缺口。
当前任务缺指针与清单原件；不扫目录猜同名或旧版，不回写上游决策日志。

隔离正例用当前 v2 形状及已存在的合规 `convergence-checklist.md` 和同包原件。
材料只放一条实际引用。运行真实入口：
`node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=<隔离任务根> --material-root=<隔离材料根> --json`

从实际 `convergence.source`、`expected_modules`、模块引用、行位和诊断核对合规读取。
按报告指向读回清单及同包证据，比较独立冻结的包号、路径、行位和 SHA。
缺引用、不可读、越界、错包四种输入须各给具名缺口和 `complete=false`。
保现有审批缺证与退出语义；命令退出 0 或清单可读都不能单独判收敛。
本段独立复跑后供 P3 实际消费，不等待 P3 才测。沿同版读回准备和预算核查。
先按当前任务 worktree 的锁文件准备依赖。本轮目标目录没有 Vitest。

`node node_modules/vitest/vitest.mjs run tests/contract/decision-evidence-consumption.test.mjs -t ORACLE-P2-BOUND-HANDOFF && node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P2-CURRENT-V2-CHECKLIST`

命令选择受影响用例。旧交接目标及整组 Vitest 尚未实跑。隔离脚本已取得当前 v2 包绑定的目标 RED，见任务卡原件。
旧交接窄断言覆盖当前错误行位置或有文件无下游读。工作树未提交没有对象属输入缺口；若某坏例已被现检查拒绝，如实保存原有结果。
写入实施前由独立作者持有和实跑。若没到目标断言，记录环境或装置失败。
临时输入与受控任务经既有清理职责回收。保原件及真实退出码、命令、cwd、来源。

## 下一消费者拿什么继续？

给 P3 实际对象 ID、行位、同版确认、读回和开放问题。把规划入口本次版本交 P4 接续写数据段。
下一位消费者核可读与当前版本后使用。若读回失败，回原负责人处理同一源。

## 每张任务卡怎么写？

唯一任务是切穿当前入口、实际结果和独立验收，不独立拆出准备或单纯测试。

### 任务 1：把确认和下游读回绑在同一份原件上

为什么做：当前链检查能报告结构，旧转录缺独立调用标识，交接文件存在不能证明下游读过它。
交付什么：下一位作者可从冻结引用读到同版交接原件，步骤检查器可核当前 v2 的工作包与既有收敛清单。
不做什么：保留既有确认与交接职责；旧摘要、补录原件化、第二账本和历史证据改写均无消费者。
前置：P1 给当次原件引用；材料负责人提供已冻结 Git 对象、同版本的确认与补录原件；规划作者现场提供新消费读取。
怎么做：先读 stage-handoff 方法第 4–7 步及现行 openTask 接口，再接同一规划入口的初读动作。
怎么验收：先到目标断言，再用同一命令重放；实际现象和证据不靠退出码推定。
证据：已保当前 v2 子判据失败原件。其余目标修前补证，修后保同命令和独立判定。
下游（含何时停）：给 P3 实际对象 ID、行位、同版确认、读回和开放问题。把规划入口本次版本交 P4 接续写数据段。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T002
- **Source / FR / AC**：R-001、R-004、R-012、R-016；decision-log.md:175–202,259–297,827（G-13）；FR-WH-002；AC-P2-001、AC-P2-002。下一位作者可从冻结引用读到同版交接原件，步骤检查器可核当前 v2 的工作包与既有收敛清单。
- **Inputs**：P1 给当次原件引用；材料负责人提供已冻结 Git 对象、同版本的确认与补录原件；规划作者现场提供新消费读取。
- **Files / symbols**：`tools/cli/check-stage-steps.mjs`；symbol: expected、moduleBody、convergenceRef、convergence.gaps；
  `tests/contract/check-stage-steps.test.mjs`；symbol: ORACLE-P2-CURRENT-V2-CHECKLIST；
  `skills/stage-handoff/SKILL.md`；symbol: 方法第 4–7 步；`workflows/build-plan/SKILL.md`；symbol: 第 1 步 read-current-materials；`tools/cli/check-decision-log-chain.mjs`；symbol: checkDecisionLogChain 与 createSourceReader；`tests/contract/decision-evidence-consumption.test.mjs`；symbol: 新增具名 ORACLE-P2-BOUND-HANDOFF 用例
- **Action**：在真实读取前记录已具备的 commit:path、对象 ID、相对源行、字节哈希和开放问题。
  回读 P1 写主回执及锁定的既有检查器和测试字节。
  原 v2 工作包集合接现清单读取，独立实跑同包同字节与缺引用、不可读、越界、错包。
  保已有效读取的原生产者及格式，验证证据供 P3 真实消费。
  下游入口对同一版本读取原字节，再经现有安全记录和 stage evidence 指针保实际读回。
  检查器沿现 source reader 报自引/行位错配。引用缺失给具体路径和负责人，证据状态沿原合同。
  留补录原身。隔离对照确认材料受保护；无法冻结当前原件时，交材料 owner 核实，不冒用未来归档结果。
- **Outputs / failure**：下一位作者可从冻结引用读到同版交接原件，步骤检查器可核当前 v2 的工作包与既有收敛清单。 受控仓保合法对象后偏移一个来源行，伪造可读回执但省略下游实际 read，另外把后补转录标成当时原件。
- **Boundary / DO NOT TOUCH**：decision-log.md、原请求和历史答复只读；不改 runtime/task/task-handle.mjs、Git 授权、发布权限和旧契约。冻结测试判据归测试作者。
- **Dependency**：P1/T001
- **Test tier / skill**：feature / backend-testing；本段核命令、集成和真实消费者。UI、真实产品库和生产网络在本段范围外。每条判据另按正文档位实际取证。
- **Scenario / fixture or service**：受控仓保合法对象后偏移一个来源行，伪造可读回执但省略下游实际 read，另外把后补转录标成当时原件。 另用隔离 v2 和唯一真实引用验证现清单，删除指针、移走清单、越界和错包各核对应缺口。
  临时任务在同进程内创建和清理；原始输入不覆盖。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-evidence-consumption.test.mjs -t ORACLE-P2-BOUND-HANDOFF && node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P2-CURRENT-V2-CHECKLIST`
- **expected_exit**：RED nonzero; GREEN 0。修前分别运行两个命令段，逐项确认抵达 ORACLE-P2-BOUND-HANDOFF 或 ORACLE-P2-CURRENT-V2-CHECKLIST 的具名目标断言。环境、依赖、输入或装置失败不算目标 RED。
- **RED target failure**：ORACLE-P2-BOUND-HANDOFF 的目标断言失败表现为当前错误行位置或有文件无实际下游读。ORACLE-P2-CURRENT-V2-CHECKLIST 的目标断言失败表现为合法当前 v2 经既有入口未能把实际读回的清单绑定到同包，或缺引用、不可读、错包、越界、旧版输入仍错报完成。工作树未提交没有对象属输入缺口。若某坏例已被现检查拒绝，如实保存原有结果。已实跑的隔离子判据读到同字节清单第 3 行，但 `expected_modules=[]`，报未知模块、未完成同包绑定。真实 CLI 退出 0，外层具名目标断言退出 1。旧交接目标及整组 Vitest 尚未实跑。
- **GREEN oracle**：ORACLE-P2-BOUND-HANDOFF 对象/行位/确认可由独立读者重放；反例产生具名缺口，真正读回与仅有静态回执可区分；前后原日志字节相同。
  同命令另跑 ORACLE-P2-CURRENT-V2-CHECKLIST。实际 CLI 须读合法清单与同包证据；
  缺引用、不可读、越界或错包均保具名缺口。实际可读和收敛结论分开。
- **Evidence**：隔离子判据目标 RED 已保脚本 `quality/tests/2026-11-19-020-build-plan-p2-v2-checklist-target-red.mjs` 与输出 `quality/tests/2026-11-19-021-build-plan-p2-v2-checklist-target-red.output`。旧交接和整组 Vitest 的修前读数拟记 `quality/tests/p2-bound-handoff-red.output`，同命令绿色与具名坏例拟记 `quality/tests/p2-bound-handoff-green.output`。当前机检修前证据 `quality/tests/2026-11-19-014-build-plan-stage-steps-readback.output` 保留。
  实际证据身份、退出码和读回由既有 task facts 发布。
- **Coverage limit**：受控 Git 对象证明读取路径和版本失配。缺消息 ID 与历史逐包原件维持缺口，不能靠补写或链检查推定真实互动。
- **STOP / recovery**：原件未冻结、绑定的对象或来源不符时，停该证据轴，交材料 owner 补具名版本。原确认、原错误及转录说明照存；可安全阅读的材料继续。
- **Done**：前置（不作完成条件）：隔离子判据已有修前读数。实施前分别跑现有 gate 的两个命令段并保 cwd、退出与原始输出；旧交接目标及整组 Vitest 尚未实跑。完成条件（只写效果）：AC-P2-001：incomplete，来源指针与确认落在同一原件；实跑/原始观察待实施，证据拟归 `quality/tests/p2-bound-handoff-green.output`；AC-P2-002：incomplete，规划入口确实消费同一个交接版本。真实步骤检查入口读回当前 v2 同包清单及原件并核到同一字节，对缺引用、不可读、越界、错包或旧版报告具名缺口。P3 沿现消费入口接收同一清单引用及正反读回证据；实跑/原始观察待实施，证据拟归 `quality/tests/p2-bound-handoff-green.output`。独立执行者按验收原判据观察。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`skills/stage-handoff/SKILL.md`；`workflows/build-plan/SKILL.md`；`tools/cli/check-decision-log-chain.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`
- **Dependency**：P1
- **消费者**：P3 的逐包决策与后续规划作者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-evidence-consumption.test.mjs -t ORACLE-P2-BOUND-HANDOFF && node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P2-CURRENT-V2-CHECKLIST`
- **oracle**：ORACLE-P2-BOUND-HANDOFF
- **evidence_path**： planned: `quality/tests/p2-bound-handoff-green.output`
- **STOP**：原件未冻结、绑定的对象或来源不符时，停该证据轴，交材料 owner 补具名版本。原确认、原错误及转录说明照存；可安全阅读的材料继续。
- **覆盖 AC**：AC-P2-001、AC-P2-002
- **Done**：前置（不作完成条件）：隔离子判据已有修前读数。实施前冻结并实跑现有 gate 的目标断言；旧交接目标及整组 Vitest 尚未实跑。完成条件（只写效果）：AC-P2-001：incomplete，来源指针与确认落在同一原件；实跑/原始观察待实施，证据拟归 `quality/tests/p2-bound-handoff-green.output`；AC-P2-002：incomplete，规划入口确实消费同一个交接版本。真实步骤检查入口读回当前 v2 同包清单及原件并核到同一字节，对缺引用、不可读、越界、错包或旧版报告具名缺口。P3 沿现消费入口接收同一清单引用及正反读回证据；实跑/原始观察待实施，证据拟归 `quality/tests/p2-bound-handoff-green.output`。交接引用使用实际字节与未验边界。

