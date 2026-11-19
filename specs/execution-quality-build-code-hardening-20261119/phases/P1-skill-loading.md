# Phase P1 — 让宿主能发现技能，步骤只接受当次证据

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

安装操作者能在另一项目的新宿主会话找到技能；步骤检查能区分缺证和真实检查失败。
改动前：现步骤卡会读字节，却缺逐项 SHA-256 和当次事件生产者。现认证捕获只保存原命令与原输出。
改动后：独立读者可从真实入口对照正常与失败，原件留本段既有证据路径。
非目标：宿主注入、未加载时拒绝整个宿主、旧运行器属于已退出做法；保留现有安装与检查职责。
主要风险：误把检查器自己回读的字节当作当前会话读取。只接受主持人实际读取命令的同次原件。
相邻阶段：把已核实的当次来源指针、字节、指纹、检查结果及缺口，交下一段的原件交接。
**配套与影响**：配套调整＝`reading_baseline` 读取、`check-stage-steps` 判定与 facts 加载事件；配套迁移＝旧任务没有加载事件记 unknown，新会话重新安装并记录实际根；配套移除＝「文件存在即完成」判断与旧跳过逻辑；影响范围＝P2/P3/P4 的步骤入口、现有任务完成门、新会话可见性。
未决事实见验收和停止条件。未知信号由原负责人提供恢复条件。

## 这一 Phase 怎么验收？

完成本段需要约 42 活动分钟。两条验收各自保留，后段只消费实际原件。
本段涉及命令、材料或宿主读取；没有页面、路由和组件触碰。

| 判据 | 执行者 | 活动分钟 | 硬估算分钟 | 重验预留次数 | 证据档位 | 所需资源 | 可观察量 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-P1-001 | 独立执行者 | 10 | 18 | 1 | 命令级 | 现步骤 CLI与已冷启动的隔离任务 | 独立执行者比较同一任务当前与旧回执，读取状态、退出码和实际字节。 |
| AC-P1-002 | 独立执行者 | 16 | 25 | 1 | 真实环境级 | 运行时负责人提供的真实隔离宿主根与新项目 | 独立执行者在仓外启动新会话，比对安装实际根和 reading_baseline 的字节、哈希。 |

活动总量为 10 + 16 + 8 共享准备 + 8 一次受影响重验 = 42 分钟。
共享准备涵盖冷启动读源与夹具准备。执行时记录实际分项，重验预留只计一次。
硬估算为各条硬估算与准备、重验相加，共 59 分钟。以上均 provisional。
估算逐项按当前正常与坏例复跑、独立读回、原件核对的操作量；不是实测活动账。
CLI 亚秒基线详见任务库测试蓝图。当前无可比活动账，实施预算仍待按已知窗口确认。
等待：真实新宿主准备时点由运行时负责人确认。纯等待未计；不以受控路径补宿主结果。

### 怎么判验收 1？

只有当次加载、材料和检查支持完成。
独立执行者比较同一任务当前与旧回执，读取状态、退出码和实际字节。
条件：现步骤 CLI与已冷启动的隔离任务。
故意破坏：在两个会话保持同一任务、步骤、HEAD 和技能字节。
第二会话实跑首读并取得自己的回执；保它的当前调用绑定，只把读取原件引用换成第一会话的。
旧引用即使自身全部字段和哈希都合法，也须给 unknown，不能支持本次完成。
证据：运行时负责人在候选就绪后交步骤 CLI 原输出、加载回执、原检查结果。
实跑边界：incomplete；已实跑缺当次读取回执的隔离子判据，两份真实回执的互换和完整验收待实施。同段命令和独立观察的实际判定分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

### 怎么判验收 2？

从另一项目的新宿主会话发现同版技能。
独立执行者在仓外启动新会话，比对安装实际根和 reading_baseline 的字节、哈希。
条件：运行时负责人提供的真实隔离宿主根与新项目。
故意破坏：只指向仓库根的安装从新项目不能冒成已发现。
证据：安装后交新项目路径、发现原件与实际基线读数。
实跑边界：incomplete；无法提供受权隔离宿主时记 unavailable。同段命令和独立观察的实际判定分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

## 为什么现在做，依据是什么？

安装操作者能在另一项目的新宿主会话找到技能；步骤检查能区分缺证和真实检查失败。
当前包的设计、回退与配套沿决策日志，唯一验收在规格附录 A。
这段效果能独立用一个可回读的消费者、真实结果和具名坏例判断。

## 开始前读什么？

先读包内决定与附录 A，再核首改符号和当次执行输入。

| 原件 | 开工前核什么 |
| --- | --- |
| `decision-log.md:219–258` | 当次三输入、旧记录为未知和宿主安装边界 |
| `spec.md#appendix-a--验收判据唯一权威` · AC-P1-001、AC-P1-002 | 验收 1、2 的实际判定 |
| `tools/cli/check-stage-steps.mjs:723–754,1290–1318,1397–1437` | 执行身份、原件消费、读数和退出契约 |
| `tools/cli/onboard-release.mjs:205,353,438,531–535` | 已有安装根与链接操作；本阶段复用它 |
| `tools/cli/stage-runtime.mjs:1798–1817`、`runtime/task/task-handle.mjs:104–113` | 认证命令捕获实际读入；原命令、时点和输出来源 |
| `workflows/{make-decision,build-plan,build-code}/SKILL.md` 的「当前步怎么执行？」 | 主持人实际在这三处取卡并消费正文；现没有加载 producer |
| `tests/contract/check-stage-steps.test.mjs:40–91,149–184` | 真实 CLI 受控入口与既有隔离样本 |

当前任务、步骤定义、实际主持会话读取回执和现检查结果。运行时负责人提供已隔离宿主根和新项目；现场确认当前身份。

## 每个文件由谁改，先做什么？

产品文件由本段实施者独占。标出的测试路径由独立作者先冻结具名断言。
实施者消费测试，在提交的阶段范围内对账，未经裁决不改冻结测试。

| 路径 | 具体锚点 | 变更与消费者 |
| --- | --- | --- |
| `tools/cli/check-stage-steps.mjs` | 新增私有 readStepSkill、runStageStepsCheck、reading_baseline、CLI 参数分流 | 加独立只读动作，由主持人经现捕获调用；检查模式只消费原件。 |
| `workflows/make-decision/SKILL.md` | 当前步怎么执行 | 让定方向主持人在实际取读时用认证命令捕获。 |
| `workflows/build-plan/SKILL.md` | 当前步怎么执行 | 让计划主持人消费同一读入原件。P2 接第 1 步。 |
| `workflows/build-code/SKILL.md` | 当前步怎么执行 | 让实施主持人消费同一读入原件。P5、P6 后接各自边界。 |
| `tests/contract/check-stage-steps.test.mjs` | 新增具名 ORACLE-P1-CURRENT-SKILL-LOAD 用例 | 冻结断言，由现有受控临时任务驱动原 CLI。 |

本段先交步骤读取和检查的真实接缝，并移交三个 workflow 当前字节。
计划入口交 P2，定方向入口交 P3，实施入口交 P5 与 P6 后续接线。
隔离证据和真实旧材料按其既有写主发布或只读，均不扩为仓库写集。
回退只撤销本段实际产品改动，保失败与已有原件，复核同一消费入口。

## 怎么验证？

用现有真入口观察实际行为，再用独立样本把一处条件弄坏并复跑。
安装入口负责发现路径。主持人在当前步首次实际读取技能时负责产出原件。
本段新增文件内私有动作 `readStepSkill`，复用现检查脚本。
三个 workflow 的「当前步怎么执行？」都将固定 argv 交现 `verify --action=execute`。

`node tools/cli/check-stage-steps.mjs --read-step-skill=<当前卡声明的技能位置> --stage=<当前阶段> --step=<步骤编号> --task-path=<认证任务根> --material-root=<当前材料根> --commit=<当前真实HEAD>`

读入动作核当前任务和步骤，解析当前卡声明的实际路径，拒绝声明外文件。
打开、读完文件后，从同一原字节生成 JSON 事件和可逆编码的正文。
事件固定为 `{stage, step, skill_path, sha256, bytes, at}`；时点取读取成功的 UTC 时间。
现 `task.captureCommand` 只保存 argv、实际工作目录、时点和原始输出。
主持人首次实际读取时保同一次 verify 返回的原 `receipt_ref` 并读正文。
本次调用返回的绝对引用或同任务内引用，经真实路径规范化后，作为当次读取的唯一身份。
三个 workflow 从当前真实回传取得此值，随当前步骤传给现检查器。
检查模式新增私有参数 `--current-read-receipt=<本次返回的原引用>`。
检查器只比对这次调用绑定与候选读取原件的实际引用，不扫描历史猜最新。
缺当前调用的原回传、候选路径错配、跨任务、旧回执或缺必需技能均记 unknown。
检查模式还核认证任务路径、固定 argv、当前步骤及工作树、真实退出和完整输出。
它从捕获的原正文重算字节与哈希，核实际路径并核读入发生在该捕获区间。
相同头版本、步骤和内容也不能让另一会话的旧引用替代当前真实回执。
读取回执只判读取。步骤业务检查的原命令、判定与证据单独核。
复用认证捕获原件，不增加运行编号或持久账本。
单独检查不调用只读动作；预置 JSON 或独立 checker 回读不产生完成证据。
本轮目标工作树缺 Vitest。运行时负责人在完整 Vitest 目标 RED 前于认证工作树按锁文件准备。
按当前锁文件运行 `npm ci --include=dev`，可消费已有离线缓存。
再运行 `node node_modules/vitest/vitest.mjs --version` 核 runner。
缺缓存或 runner 属装置失败。由运行时负责人提供符合锁文件的依赖，后段复用同一准备。

`node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P1-CURRENT-SKILL-LOAD`

命令选择受影响用例。此 Vitest 用例尚未写入或实跑。隔离脚本已命中缺当次读取回执的目标断言，见任务卡原件。
冻结断言要求当前步骤不能以陈旧加载完成，否则目标断言失败。若基线已经拦截该输入，保本来通过；收集、宿主和错误身份均非目标 RED。
写入实施前由独立作者持有和实跑。若没到目标断言，记录环境或装置失败。
临时输入与受控任务经既有清理职责回收。保原件及真实退出码、命令、cwd、来源。

## 下一消费者拿什么继续？

把已核实的当次来源指针、字节、指纹、检查结果及缺口，交下一段的原件交接。
下一位消费者核可读与当前版本后使用。若读回失败，回原负责人处理同一源。

## 每张任务卡怎么写？

唯一任务是切穿当前入口、实际结果和独立验收，不独立拆出准备或单纯测试。

### 任务 1：让宿主能发现技能，步骤只接受当次证据

为什么做：现步骤卡会读字节，却缺逐项 SHA-256 和当次事件生产者。现认证捕获只保存原命令与原输出。
交付什么：安装操作者能在另一项目的新宿主会话找到技能；步骤检查能区分缺证和真实检查失败。
不做什么：宿主注入、未加载时拒绝整个宿主、旧运行器属于已退出做法；保留现有安装与检查职责。
前置：当前任务、步骤定义、实际主持会话读取回执和现检查结果。运行时负责人提供已隔离宿主根和新项目；现场确认当前身份。
怎么做：先在三处当前步入口接认证读取，再让 runStageStepsCheck 验捕获原件。
怎么验收：先到目标断言，再用同一命令重放；实际现象和证据不靠退出码推定。
证据：已保隔离子判据失败原件。完整目标修前补证，修后保同命令和独立判定。
下游（含何时停）：把已核实的当次来源指针、字节、指纹、检查结果及缺口，交下一段的原件交接。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T001
- **Source / FR / AC**：R-003、R-005；decision-log.md:219–258；FR-WH-001；AC-P1-001、AC-P1-002。安装操作者能在另一项目的新宿主会话找到技能；步骤检查能区分缺证和真实检查失败。
- **Inputs**：当前任务、步骤定义、实际主持会话读取回执和现检查结果。运行时负责人提供已隔离宿主根和新项目；现场确认当前身份。
- **Files / symbols**：`tools/cli/check-stage-steps.mjs`；symbol: 新增私有 readStepSkill、runStageStepsCheck、reading_baseline、CLI 参数分流；
  `workflows/make-decision/SKILL.md`；节锚当前步怎么执行；
  `workflows/build-plan/SKILL.md`；节锚当前步怎么执行；
  `workflows/build-code/SKILL.md`；节锚当前步怎么执行；`tests/contract/check-stage-steps.test.mjs`；symbol: 新增具名 ORACLE-P1-CURRENT-SKILL-LOAD 用例
- **Action**：在现检查脚本新增私有 readStepSkill 并与检查模式分流；三个 workflow 当前步入口用现有认证捕获实际调用。
  固定 argv 及输出格式见“怎么验证”。仅对当前卡声明且实际打开的文件生成六字段事件与原正文。
  首读回传的现 receipt_ref 是当次唯一身份；显式传入、对照候选引用，不从历史选最新。
  再核原 argv、cwd、捕获时间窗、退出、完整输出及重新计算的哈希。质量命令回执另判。
  主持人实读当前调用正文；未认证、旧调用或只取卡给 unknown。下游沿现证据与上下文指针传原件。
  沿现核对组合加载、步骤材料与原检查结果。安装复用现宿主配置根；不扩公共 runtime。
- **Outputs / failure**：安装操作者能在另一项目的新宿主会话找到技能；步骤检查能区分缺证和真实检查失败。 同一合法任务只有上一轮加载原件，或只有主技能及自写 complete；合法夹具中已执行检查另给失败结果。
- **Boundary / DO NOT TOUCH**：可读 onboard-release 与 stage-skill-runtime。该两文件及既有宿主配置在本段产品写集外。不得更改冻结测试断言、既有加载原件或把只读卡伪装为执行凭证。
- **Dependency**：none
- **Test tier / skill**：feature / backend-testing；本段核命令、集成和真实消费者。UI、真实产品库和生产网络在本段范围外。每条判据另按正文档位实际取证。
- **Scenario / fixture or service**：同任务、步骤、HEAD 和技能字节不变，两会话各有已保存的读取回执。
  保留第二会话的当前调用绑定，只换候选为第一会话的合法回执，预期 unknown。
  另核仅主技能、自写 complete 及已有真实检查失败。 临时任务在同进程内创建和清理；原始输入不覆盖。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P1-CURRENT-SKILL-LOAD`
- **expected_exit**：RED nonzero; GREEN 0。只以抵达 ORACLE-P1-CURRENT-SKILL-LOAD 的目标断言判 RED。
- **RED target failure**：ORACLE-P1-CURRENT-SKILL-LOAD 冻结断言要求当前步骤不能以陈旧加载完成，否则目标断言失败。若基线已经拦截该输入，保本来通过；收集、宿主和错误身份均非目标 RED。 已取得隔离子判据 RED：缺当次技能读取回执，现检查器仍据旧完成原件误报本次已完成。真实 CLI 退出 0，外层具名断言退出 1。两份真实回执的互换、跨项目新宿主和完整验收尚待实施。
- **GREEN oracle**：ORACLE-P1-CURRENT-SKILL-LOAD 当前真实原件足以支持完成；过期、伪造及子技能缺失给 unknown，失败检查给 failed 和真实非零。真实跨项目新会话另核安装发现与实际读取。
- **Evidence**：隔离子判据目标 RED 已保脚本 `quality/tests/2026-11-19-023-build-plan-p1-current-skill-load-target-red.mjs` 与输出 `quality/tests/2026-11-19-024-build-plan-p1-current-skill-load-target-red.output`。完整 Vitest 未实跑，修前读数拟记 `quality/tests/p1-current-skill-load-red.output`，同命令绿色与具名坏例拟记 `quality/tests/p1-current-skill-load-green.output`。实际证据身份、退出码和读回由既有 task facts 发布。
- **Coverage limit**：受控夹具证明代码路径。宿主发现依实际新会话；历史没有读取证据只记未知，安装可见性不能填补历史记录。
- **STOP / recovery**：目标输入和任务身份不可用时停该轴。运行时负责人提供同次真实回执、合法安装根或新会话；保老结果。从同一入口修复后重验受影响用例。
- **Done**：前置（不作完成条件）：隔离子判据已有修前读数。实施前实跑完整目标命令并保 cwd、退出与原始输出；完整 Vitest 尚未实跑。完成条件（只写效果）：AC-P1-001：incomplete，只有当次加载、材料和检查支持完成；实跑/原始观察待实施，证据拟归 `quality/tests/p1-current-skill-load-green.output`；AC-P1-002：incomplete，从另一项目的新宿主会话发现同版技能；实跑/原始观察待实施，证据拟归 `quality/tests/p1-current-skill-load-green.output`。独立执行者按验收原判据观察。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`tools/cli/check-stage-steps.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`tests/contract/check-stage-steps.test.mjs`
- **Dependency**：none
- **消费者**：P2 的交接读取者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P1-CURRENT-SKILL-LOAD`
- **oracle**：ORACLE-P1-CURRENT-SKILL-LOAD
- **evidence_path**： planned: `quality/tests/p1-current-skill-load-green.output`
- **STOP**：目标输入和任务身份不可用时停该轴。运行时负责人提供同次真实回执、合法安装根或新会话；保老结果。从同一入口修复后重验受影响用例。
- **覆盖 AC**：AC-P1-001、AC-P1-002
- **Done**：前置（不作完成条件）：隔离子判据已有修前读数。实施前冻结并实跑完整目标命令的判据；完整 Vitest 尚未实跑。完成条件（只写效果）：AC-P1-001：incomplete，只有当次加载、材料和检查支持完成；实跑/原始观察待实施，证据拟归 `quality/tests/p1-current-skill-load-green.output`；AC-P1-002：incomplete，从另一项目的新宿主会话发现同版技能；实跑/原始观察待实施，证据拟归 `quality/tests/p1-current-skill-load-green.output`。交接引用使用实际字节与未验边界。

