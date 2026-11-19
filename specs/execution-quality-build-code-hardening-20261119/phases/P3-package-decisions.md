# Phase P3 — 让一个真实工作包走完独立调研、设计和审查

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

主持人拿到可独立阅读的真实逐包回传，能由现行 v2 模板写成规划可消费的决定。
改动前：工作树已有 v2 模板与工具。卡校验只判断关键词存在，不能证明角色独立、回答真实或卡片被消费。
改动后：独立读者可从真实入口对照正常与失败，原件留本段既有证据路径。
非目标：当前只交最小模板及直接调用，不另造日志或阶段。三类审查全量接线、对账自动化与终验归最后一段。
主要风险：只完成三个 Markdown brief 就声称三角色实际执行。用独立真实作者及受控试跑保每一项责任的原件。
相邻阶段：交给 P4、P5 的是真实单包试跑、可读决定、v2 前置模板和角色原件，现文件状态随后供最后一段审查接线。
**配套与影响**：配套调整＝`workflows/make-decision/SKILL.md`、决策日志技能与 `skills/catalog.yaml`；配套迁移＝旧卡与五角色引用改三角色、`repo-skills.manifest.json` 由本段重生成；配套移除＝五角色×12、主持人兼写兼审；影响范围＝全部包收敛、子代理成本、三类审查的输入。
未决事实见验收和停止条件。未知信号由原负责人提供恢复条件。

## 这一 Phase 怎么验收？

- 防再发（build-plan 审查后）：卡验收格必须含通过/失败/至少一个反例；同一段并存通过/失败判词判失败。

完成本段需要约 66 活动分钟。两条验收各自保留，后段只消费实际原件。
本段涉及命令、材料或宿主读取；没有页面、路由和组件触碰。

| 判据 | 执行者 | 活动分钟 | 硬估算分钟 | 重验预留次数 | 证据档位 | 所需资源 | 可观察量 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-P3-001 | 独立执行者 | 30 | 50 | 1 | 独立读回级 | 冻结 v2 模板与具源新包、独立角色回传 | 独立观察者按真顺序复读卡、冷读和对抗及角色来源。另跑冻结机械检查。 |
| AC-P3-002 | 独立执行者 | 14 | 24 | 1 | 独立读回级 | 主会话实际问答、对应版本、现行与旧包映射 | 独立判定者读用户原答、选项风险、调用来源和当前卡版本。 |

活动总量为 30 + 14 + 10 共享准备 + 12 一次受影响重验 = 66 分钟。
共享准备涵盖冷启动读源与夹具准备。执行时记录实际分项，重验预留只计一次。
硬估算为各条硬估算与准备、重验相加，共 96 分钟。以上均 provisional。
估算逐项按当前正常与坏例复跑、独立读回、原件核对的操作量；不是实测活动账。
CLI 亚秒基线详见任务库测试蓝图。当前无可比活动账，实施预算仍待按已知窗口确认。
等待：调研、设计、审查与逐包答复墙钟单列，未取得。先做可并行的只读机械验证。
现真实目标红回执耗时约 0.14 秒，仅为命令墙钟，不当作真实作者活动基线。

### 怎么判验收 5？

一个真实工作包走完三角色。
独立观察者按真顺序复读卡、冷读和对抗及角色来源。另跑冻结机械检查。
条件：冻结 v2 模板与具源新包、独立角色回传。
故意破坏：删除真实格或让审查者与卡作者同一身份。预填的审查结论不得当真。
证据：技能负责人在受控真实包结束后交派发及回传、卡与检查原件。
独立读者回读既有任务形状：验收、模块、数据量、最长检查、外部输入、数据层级。
从实际变更路径核受影响范围。每个新机制指明要防的真实失败和更轻方案的差别。
超过已确认预算先拆可独立交付或去重复验证，保验收覆盖。
仍超已确认上限或需要改范围，由原决定人处理；缺基线按待取得记录。
实跑边界：incomplete；模板通过仅基线，无真实试跑原件。同段命令和独立观察的实际判定分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

### 怎么判验收 6？

实际答复绑到当前卡片。
独立判定者读用户原答、选项风险、调用来源和当前卡版本。
条件：主会话实际问答、对应版本、现行与旧包映射。
故意破坏：置入旧九包整体答复或后写补录复跑正向路径，必须显示该包未取得。
证据：主持人在逐包收敛后交实际问答原件和证据索引。
历史十包按决策日志第 343 行逐包对照已有原件，未取得的逐包登记原终态。
保留 U-021 的十包范围确认及其来源；原件缺失保持可见，无需重问十包。
另用一包真实实跑验证当前机制与答复绑定。两份结论和原件分别回读。
独立读者回看真实 brief、实际派发回执和下游读回。
主会话只收对当前决策必要的短摘要及一手来源指针，由具体角色按职责回源。
出现整份父上下文继承，或主会话无具名缺口和理由重读全量材料，判本项失败。
从实际派发的上下文模式与内容以及主持人的读取原件取证，不凭口头说明。
独立读者取一次真实实质变化，例如边界变化或新出现的可复现阻塞。
以用户可见汇报原件和派发回执次序核对：先汇报，再发出依赖该变化的任务。
真实试跑未出现实质变化时保观察缺口；不设分钟阈值。
实跑边界：incomplete；历史包中仍有独立答复原件未取得。
U-021 只确认范围。新一包的通过仅证明机制；历史任一适用包缺真实答复，
整项继续记 incomplete，无需重问历史。保留每个历史包的原结果与恢复条件。
同段命令、独立试跑与历史审计的结果分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

## 为什么现在做，依据是什么？

主持人拿到可独立阅读的真实逐包回传，能由现行 v2 模板写成规划可消费的决定。
当前包的设计、回退与配套沿决策日志，唯一验收在规格附录 A。
这段效果能独立用一个可回读的消费者、真实结果和具名坏例判断。

## 开始前读什么？

先读包内决定与附录 A，再核首改符号和当次执行输入。

| 原件 | 开工前核什么 |
| --- | --- |
| `decision-log.md:298–348,604–638` | 三角色、十一格、模板唯一来源及配套四项 |
| `spec.md#appendix-a--验收判据唯一权威` · AC-P3-001、AC-P3-002 | 验收 5、6 的独立观察 |
| `skills/decision-maker/scripts/validate-card.mjs:20–43` | 现命令只搜索词，目标反例仍可能被吞 |
| `skills/decision-maker/scripts/dispatch.mjs:16–38` | 现 brief 工具，输出不等于真实派发 |
| `workflows/make-decision/SKILL.md#执行策略什么时候定`、`skills/spec-plan/templates/phase-template.md:238–288` | 现任务形状、预算与超限处置 |
| `docs/architecture/move-map.json`、`docs/architecture/real-entry-inventory.md` | 现范围与消费者；旧 inventory 提及的复杂度基线在任务树未取得 |
| `decision-log.md:89–94,316–330` | 实质变化及时告知与原已确认复杂度预算 |
| `skills/decision-log/templates/decision-log-template-v2.md#每包设计` | 独立作者的唯一日志模板；原始工作树已有字节 |
| `skills/decision-log/skill-bundle.json`、`runtime/distribution/skill-bundle-release.mjs:258,493,569` | 现有清单少 v2；发布闭包及验证由既有入口承接 |

P2 交同版原件、同一收敛清单引用及真实入口的正反读回证据。P3 沿既有消费入口使用引用，回读或核验 P2 已有原件。本次复用现有记录，避免重复写入或新增门禁。技能负责人交 v2 精确字节、当前真实单包需求与旧包映射。主持人提供本轮真实逐包答复来源。

## 每个文件由谁改，先做什么？

产品文件由本段实施者独占。标出的测试路径由独立作者先冻结具名断言。
实施者消费测试，在提交的阶段范围内对账，未经裁决不改冻结测试。

| 路径 | 具体锚点 | 变更与消费者 |
| --- | --- | --- |
| `workflows/make-decision/SKILL.md` | 既有逐包收敛步骤 | 调用已核技能，主持人唯一落日志，轻量路径沿既有方法。 |
| `skills/decision-log/SKILL.md` | 当前 v2 模板引用 | 确认已在场的最小引用字节；留末段接完整消费。 |
| `skills/decision-log/skill-bundle.json` | files | 本段把 v2 模板声明到现有发布清单，旧模板继续可携带。 |
| `skills/decision-log/templates/decision-log-template-v2.md` | 每包设计 | 作为前置供件交验；优先复用已有未提交字节。 |
| `skills/decision-maker/SKILL.md` | 三个角色、逐包工作流 | 实际运行及审查原件的正常入口。 |
| `skills/decision-maker/skill-bundle.json` | 技能内文件闭包 | 按现 bundle 列出受控工具和模板，以既有入口发现。 |
| `skills/decision-maker/templates/package-context.md` | 单包有界输入形状 | 交三角色必要原始引用。 |
| `skills/decision-maker/templates/card.md` | 十一格卡 | 把任务形状、机制取舍和超限处置归回已有格，保十一格。 |
| `skills/decision-maker/templates/cold-read.md` | 六问独立读回 | 独立读者实读当前卡。 |
| `skills/decision-maker/templates/adversarial.md` | 九问独立挑战 | 挑战真实失败及配套调整。 |
| `skills/decision-maker/scripts/dispatch.mjs` | main | 给现主持人可用 brief；隔离输出仅供试跑，实际派发由主持人执行。 |
| `skills/decision-maker/scripts/validate-card.mjs` | main | 仅机械判结构可见问题、引用和版本关系，语义交独立角色。 |
| `skills/decision-maker/scripts/status.mjs` | main | 缺可读当前审查或答复时显示明确的未收敛原因。 |
| `skills/catalog.yaml` | decision-maker 条目 | 把现工作树登记作为前置供件，核目录实际消费者。 |
| `repo-skills.manifest.json` | skills 投影与 `derived_from.catalog_sha256` | 改 `skills/catalog.yaml` 后由 P3 用现 `build-skill-manifests.mjs` 重生成；不手改投影。现清单与目录不一致，本段修。 |
| `tests/contract/decision-evidence-consumption.test.mjs` | 追加受控角色和问答来源对照 | 接手 P2 的原件测试，保其冻结断言不动。 |

本段承接 P2 已交的证据测试文件与断言。阶段 10 读取模板及本段调用版本，再接完整对账。
前后版本以当前写集与真实证据对账。
隔离证据和真实旧材料按其既有写主发布或只读，均不扩为仓库写集。
回退只撤销本段实际产品改动，保失败与已有原件，复核同一消费入口。

## 怎么验证？

用现有真入口观察实际行为，再用独立样本把一处条件弄坏并复跑。
现 dispatch 只是 brief 产出；真实角色和用户是输出消费者，既有逐包流程保存读回结果。人读语义与机器判形分别取证。
用现 `status --action=begin` 回读真实身份及工作树。
将已认证任务根导出为 `WH_TASK`，命令 cwd 保持认证工作树。
测试依赖沿 P1 的同一准备；缺任务根、工作树或 runner 是装置失败。

`sh -c 'test -n "$WH_TASK" && node --test "$WH_TASK/quality/tests/2026-11-19-009-build-plan-card-oracle-control-fixed.mjs" && node node_modules/vitest/vitest.mjs run tests/contract/decision-evidence-consumption.test.mjs -t "ORACLE-P3-ROLE-SOURCES|ORACLE-P3-PORTABLE-TEMPLATE" && node tools/cli/build-skill-manifests.mjs --check && node node_modules/vitest/vitest.mjs run tests/contract/skill-manifests.test.mjs'`

卡格目标断言已在 build-plan 预写、冻结并实跑。原 008 记录的是首个 Node 子命令的目标失败。
修后再跑同一冻结子命令。它通过后，同一门禁执行两个后续窄用例，各保实际证据。
独立执行者另跑一包，核对真实角色、审查后的卡版本及答复原件绑定。
改动已审卡片或替换同版答复为旧确认，试跑须给出对应缺口。
冻结断言已抵达有效对照。完整卡退出 0，删掉白话复述格、仅在正文提名时，CLI 仍退出 0。测试的目标断言要求退出 1，外层 node --test 真实退出 1。
写入实施前由独立作者持有和实跑。若没到目标断言，记录环境或装置失败。
供件坏例已经出现。日志技能引用了 v2 模板，但发布清单仍只声明旧模板，
正式 `run-checks` 的 `skill-static-deps` 退出 1。
原始失败见 `quality/tests/2026-11-19-009-build-plan-material-contract-before-review.output`。
同一批供件缺清单口径：改 `skills/catalog.yaml` 后 `repo-skills.manifest.json` 未重生成，
`build-skill-manifests --check` 三条 FAIL（repository manifest、derived_from.catalog_sha256、skills 投影），退出 1。
本段由 P3 用现生成入口重生成该清单，不要求现在动手；门禁与证据如下。
`node tools/cli/build-skill-manifests.mjs --check` 期望 GREEN 退出 0；RED 为上述三条 FAIL。
`node node_modules/vitest/vitest.mjs run tests/contract/skill-manifests.test.mjs` 期望 GREEN 退出 0；当前该用例已红，属本段要修的目标失败。
两处实际读数与退出码按现有 task facts 保存，清单重生成原件与测试输出各留一份。
实施时用现 `buildSkillBundleRelease` 和 `validateSkillBundleRelease` 核隔离发布根，
观察 v2 和旧模板均可从发布包读取，逐字节对当前来源。
复用 `tests/contract/release-tree.test.mjs` 的现有隔离发布装置。
在本阶段已声明的证据消费测试内加 `ORACLE-P3-PORTABLE-TEMPLATE`。
同文件的 `ORACLE-P3-ROLE-SOURCES` 核对同一卡绑定的实际读回、错来源与错字节。
受控绑定测试不代真实身份、真实答复或派发前已汇报的观察原件。
在隔离发布包中移除 v2，现发布验证须拒绝；不动真实工作树。
这项和现有模板供件一同验证，复用同一准备与估算。
临时输入与受控任务经既有清理职责回收。保原件及真实退出码、命令、cwd、来源。

## 下一消费者拿什么继续？

交给 P4、P5 的是真实单包试跑、可读决定、v2 前置模板和角色原件，现文件状态随后供最后一段审查接线。
下一位消费者核可读与当前版本后使用。若读回失败，回原负责人处理同一源。

## 每张任务卡怎么写？

唯一任务是切穿当前入口、实际结果和独立验收，不独立拆出准备或单纯测试。

### 任务 1：让一个真实工作包走完独立调研、设计和审查

为什么做：工作树已有 v2 模板与工具。卡校验只判断关键词存在，不能证明角色独立、回答真实或卡片被消费。
交付什么：主持人拿到可独立阅读的真实逐包回传，能由现行 v2 模板写成规划可消费的决定。
不做什么：当前只交最小模板及直接调用，不另造日志或阶段。三类审查全量接线、对账自动化与终验归最后一段。
前置：P2 交同版原件、同一收敛清单引用及真实入口的正反读回证据。P3 沿既有消费入口使用引用，回读或核验 P2 已有原件。本次复用现有记录，避免重复写入或新增门禁。技能负责人交 v2 精确字节、当前真实单包需求与旧包映射。主持人提供本轮真实逐包答复来源。
怎么做：先核实际 v2 模板、角色脚本和未提交调用者字节，接到 make-decision 已有逐包收敛步骤后才跑一包。
怎么验收：先到目标断言，再用同一命令重放；实际现象和证据不靠退出码推定。
证据：实施前保目标失败原件，实施后保同命令和独立判定。
下游（含何时停）：交给 P4、P5 的是真实单包试跑、可读决定、v2 前置模板和角色原件，现文件状态随后供最后一段审查接线。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T003
- **Source / FR / AC**：R-015、R-021、R-022、R-009、R-010、R-011、R-013、R-014、U-021；decision-log.md:298–348,604–638；FR-WH-003；AC-P3-001、AC-P3-002、AC-P3-003。主持人拿到可独立阅读的真实逐包回传，能由现行 v2 模板写成规划可消费的决定。
- **Inputs**：P2 交同版原件、同一收敛清单引用及真实入口的正反读回证据。P3 沿既有消费入口使用引用，回读或核验 P2 已有原件。本次复用现有记录，避免重复写入或新增门禁。技能负责人交 v2 精确字节、当前真实单包需求与旧包映射。主持人提供本轮真实逐包答复来源。
- **Files / symbols**：`workflows/make-decision/SKILL.md`；symbol: 既有逐包收敛步骤；`skills/decision-log/SKILL.md`；symbol: 当前 v2 模板引用；`skills/decision-log/skill-bundle.json`；symbol: files；`skills/decision-log/templates/decision-log-template-v2.md`；symbol: 每包设计；`skills/decision-maker/SKILL.md`；symbol: 三个角色、逐包工作流；`skills/decision-maker/skill-bundle.json`；symbol: 技能内文件闭包；`skills/decision-maker/templates/package-context.md`；symbol: 单包有界输入形状；`skills/decision-maker/templates/card.md`；symbol: 十一格卡；`skills/decision-maker/templates/cold-read.md`；symbol: 六问独立读回；`skills/decision-maker/templates/adversarial.md`；symbol: 九问独立挑战；`skills/decision-maker/scripts/dispatch.mjs`；symbol: main；`skills/decision-maker/scripts/validate-card.mjs`；symbol: main；`skills/decision-maker/scripts/status.mjs`；symbol: main；`skills/catalog.yaml`；symbol: decision-maker 条目；`repo-skills.manifest.json`；symbol: skills 投影与 derived_from.catalog_sha256；`tests/contract/decision-evidence-consumption.test.mjs`；symbol: 追加受控角色和问答来源对照
- **Action**：复用已在场的模板、调用指针和技能登记。在 decision-log 既有 bundle 的 files 加 v2 条目，保留旧条目。
  用现有发布生产者与验证者读回隔离产物中的两份模板；缺声明或缺文件则拒绝供件。
  一包的真实调研读源之后给设计者，再给既未设计也未编辑当前卡的独立审查者做冷读与对抗。
  校验点对准实际卡节、配套、验收和具名审查原件。缺证时 status 保留具名缺口。
  在现卡的方案与取舍、风险与回退格记录任务形状、预算引用及超限处置。
  validate-card 仅查这些既有栏的值、来源与处置可定位；独立读者复核是否够轻。
  不添预算栏、阈值或账本。实际状态或诊断有实质变化，主持人先留用户可见记录，再派发依赖工作。
  实际 brief 只传本角色所需摘要与原件指针。下游读回检查实际用到的来源，不整份继承父上下文。
  保真实 brief、派发上下文模式及主会话读取原件；发现无说明的全量重读即判失败。
  主持人用实际提问工具让一包答复成为当前卡的来源。保原选项、后果、风险和版本。
  请未参与实现的作者消费实际 v2 合同，写出可交规划的完整单包材料，并请独立读者复读。
- **Outputs / failure**：主持人拿到可独立阅读的真实逐包回传，能由现行 v2 模板写成规划可消费的决定。 十一格关键词都在正文却缺实际格子，卡片在审查后改了字节，或拿旧九包答复、当前 U-021 总体确认冒充单包当时问答。
- **Boundary / DO NOT TOUCH**：旧模板、历史决策/转录、冻结的 009 测试及 P2 测试原断言保持原字节。当前 task 的上游日志不为本段试跑重写；独立作者在授权的新受控包上运行。
- **Dependency**：P2/T002
- **Test tier / skill**：feature / backend-testing；本段核命令、集成和真实消费者。UI、真实产品库和生产网络在本段范围外。每条判据另按正文档位实际取证。
- **Scenario / fixture or service**：十一格关键词都在正文却缺实际格子，卡片在审查后改了字节，或拿旧九包答复、当前 U-021 总体确认冒充单包当时问答。 临时任务在同进程内创建和清理；原始输入不覆盖。发布供件另在隔离根对照“有引用、漏声明”，不得把缺 v2 的发行包交宿主。
- **RED/GREEN gate_cmd**：`sh -c 'test -n "$WH_TASK" && node --test "$WH_TASK/quality/tests/2026-11-19-009-build-plan-card-oracle-control-fixed.mjs" && node node_modules/vitest/vitest.mjs run tests/contract/decision-evidence-consumption.test.mjs -t "ORACLE-P3-ROLE-SOURCES|ORACLE-P3-PORTABLE-TEMPLATE" && node tools/cli/build-skill-manifests.mjs --check && node node_modules/vitest/vitest.mjs run tests/contract/skill-manifests.test.mjs'`
- **expected_exit**：RED nonzero; GREEN 0。原 008 只记卡格目标失败；清单重生成前后由 `build-skill-manifests --check` 与 `skill-manifests.test` 各记一次；后续角色、发布子用例结果分列。装置失败单列。
- **RED target failure**：ORACLE-P3-CARD-STRUCTURE 冻结断言已抵达有效对照；清单子判据另有具名失败：`build-skill-manifests --check` 三条 FAIL 与 `skill-manifests.test` 已红，均由本段重生成清单与改目录后转绿。完整卡退出 0，删掉白话复述格、仅在正文提名时，CLI 仍退出 0。测试的目标断言要求退出 1，外层 node --test 真实退出 1。 目标 RED 原件见本卡证据。
- **GREEN oracle**：ORACLE-P3-CARD-STRUCTURE 完整卡退出 0。删掉“白话复述”卡格并只在正文提名时，卡校验退出 1 并具名缺格。
  同一测试命令据此退出 0。实际角色以及卡、答复错绑，在一包端到端试跑里另取证。
- **Evidence**：冻结 oracle 是任务根的 `quality/tests/2026-11-19-009-build-plan-card-oracle-control-fixed.mjs`。
  原始目标失败见 `quality/tests/2026-11-19-008-build-plan-card-target-red.json` 和同名 `.output`，外层退出 1。
  初次对照失效见 `quality/tests/2026-11-19-006-build-plan-card-baseline-red.output`，不计目标失败。
  按现 task facts 分别回读同命令的卡格结果和端到端的角色、卡与问答原件。
  计划证据位 `quality/tests/p3-package-roles-green.output`。
  发布清单的原失败为 `quality/tests/2026-11-19-009-build-plan-material-contract-before-review.output`；
  修后保现发布检查的真实原件，沿现有任务事实读回。
  清单口径的原读数为 `build-skill-manifests --check` 三条 FAIL（退出 1）与 `tests/contract/skill-manifests.test.mjs` 已红；
  重生成后的清单字节、两条命令 stdout 与退出码拟归 `quality/tests/p3-skill-manifests-green.output`。
- **Coverage limit**：已核模板字节与现有卡检查只证形状，真实独立作者消费及真实问答不由样本替代；历史十包各保原终态。新一包只证明当前机制；独立答复仍缺时本条总体 incomplete。
- **STOP / recovery**：真实角色或答复来源未取得时，由主持人或原角色补可回读输入。保已完成的机械验证和历史整体确认，实际缺证保持未核。
- **Done**：前置（不作完成条件）：同一目标命令实际跑过，保 cwd、退出与原始输出。完成条件（只写效果）：AC-P3-001：incomplete，一个真实工作包走完三角色；实跑/原始观察待实施，证据拟归 `quality/tests/p3-package-roles-green.output`；AC-P3-002：incomplete，实际答复绑到当前卡片；实跑/原始观察待实施，证据拟归 `quality/tests/p3-package-roles-green.output`。独立执行者按验收原判据观察。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`workflows/make-decision/SKILL.md`；`skills/decision-log/SKILL.md`；`skills/decision-log/skill-bundle.json`；`skills/decision-log/templates/decision-log-template-v2.md`；`skills/decision-maker/SKILL.md`；`skills/decision-maker/skill-bundle.json`；`skills/decision-maker/templates/package-context.md`；`skills/decision-maker/templates/card.md`；`skills/decision-maker/templates/cold-read.md`；`skills/decision-maker/templates/adversarial.md`；`skills/decision-maker/scripts/dispatch.mjs`；`skills/decision-maker/scripts/validate-card.mjs`；`skills/decision-maker/scripts/status.mjs`；`skills/catalog.yaml`；`repo-skills.manifest.json`；`tests/contract/decision-evidence-consumption.test.mjs`
- **Dependency**：P2
- **消费者**：P4 的数据准备与 P5 的开工检查规划作者
- **gate_cmd**：`sh -c 'test -n "$WH_TASK" && node --test "$WH_TASK/quality/tests/2026-11-19-009-build-plan-card-oracle-control-fixed.mjs" && node node_modules/vitest/vitest.mjs run tests/contract/decision-evidence-consumption.test.mjs -t "ORACLE-P3-ROLE-SOURCES|ORACLE-P3-PORTABLE-TEMPLATE" && node tools/cli/build-skill-manifests.mjs --check && node node_modules/vitest/vitest.mjs run tests/contract/skill-manifests.test.mjs'`
- **oracle**：ORACLE-P3-CARD-STRUCTURE
- **evidence_path**： planned: `quality/tests/p3-package-roles-green.output`
- **STOP**：真实角色或答复来源未取得时，由主持人或原角色补可回读输入。保已完成的机械验证和历史整体确认，实际缺证保持未核。
- **覆盖 AC**：AC-P3-001、AC-P3-002、AC-P3-003
- **Done**：前置（不作完成条件）：已冻结目标断言并实跑。完成条件（只写效果）：AC-P3-001：incomplete，一个真实工作包走完三角色；实跑/原始观察待实施，证据拟归 `quality/tests/p3-package-roles-green.output`；AC-P3-002：incomplete，实际答复绑到当前卡片；实跑/原始观察待实施，证据拟归 `quality/tests/p3-package-roles-green.output`。交接引用使用实际字节与未验边界。

