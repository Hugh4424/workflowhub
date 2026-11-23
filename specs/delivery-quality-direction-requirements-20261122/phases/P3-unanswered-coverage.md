# Phase P3 — 未答与双向覆盖

本文件给实施者、独立测试者和首判读者。
首判是本阶段第一次独立验收；双向覆盖是需求和验收彼此都能找到落点。
精确命令、路径、机器标题及标签是写作行宽与标题规则的例外。

## 哪些节必须写，哪些可以省？

保留开工、写入、验收和接手所需各节；末验只在最后一阶段写。

| 节 | 状态 | 理由或实际内容 |
| --- | --- | --- |
| 选节、交付、验收、依据 | `written` | 受限项、双向覆盖和有条件退出 |
| 读什么、文件、验证、消费者 | `written` | 绑定前置、写序、负例与恢复 |
| 任务卡、机器字段 | `written` | 一张可实施的卡及文件约定 |
| 独立验收的写作脚手架、模板示例和补充材料 | `not-applicable` | 不是交付正文 |
| 末验检查 | `not-applicable` | 阶段七引用本段首判 |

## 这一 Phase 交出什么？

读者能找出受未答限制的验收，同时看到无关验收仍可继续。

- **本阶段结果**：需求与验收双向可追；新增有合法出处，重复核对有退出条件。
- **改动前**：现役只对日志与规格验收编号；覆盖件旧标题不被扫描认作覆盖矩阵。
- **改动后**：现有链检查显名漏配、非法新增和无规格；终末按当前标题和签名区分单扫与双扫。
- **非目标**：保现役对账，原案第二差集登记不建；保人工失效标记。
- **相邻边界**：在阶段二共享文件版本上增覆盖；不接首卡或整链最终存在性判定。
- **风险**：误判会错挡或漏挡；撤本段增量，恢复人工对账并暂停退役。
- **下一步**：两条验收同段首判，再交唯一覆盖件、缺口和实际扫描原件。
- **动手前必读**：先读附录 A 和阶段二交回版本；真实包验收另读包三卡与绑定。
- **未决事实**：阶段二交件未取得；包三绑定未通过。已有规格，真实对账未执行。

### 开工就绪表

阶段二版本就绪即可通用验证。
真实绑定只用于包级首判与退役，不挡通用实施或交回共享件。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `test -r specs/delivery-quality-direction-requirements-20261122/spec.md` | 0 | quality/tests/p03-readiness-spec.output | 机器 | 规格作者 |
| 核阶段二交回的模板、检查器、冻结测试与当前日志 | 同一已验收版本可读；碰共享路径前必备 | 阶段二首判与实际交回引用 | 人 | 阶段二写主 |
| 核本段验证节的 `--bind` 原件及真实逐包答复 | 真实首判须 exit 0、`ok=true` 且同包同版，不作通用开工门 | quality/tests/2026-11-23-036-pre-review-p03-binding.json 与恢复后的原件 | 人 | 质量负责人 |

## 这一 Phase 怎么验收？

按[规格附录 A](../spec.md#appendix-a--验收判据唯一权威)的验收 3 和验收 4 首判。

**验收 3。** 未答只限制所绑验收，读者能往返需求和验收。
先跑阶段二交回版本上的通用合约；真实材料复核前另核包绑定。
主会话在本任务内组织独立绑定核对；阶段二交共享版本，材料写主交唯一覆盖件。
测试执行者先用独立预期判目标失败，再以同命令和同断言判实现。
同一未答须验绑定项受限、无关项不受影响；无绑定保问题、负责人和恢复。
错绑对照保持原问题和两个有效验收编号，只换指针到无关项。
独立读者依原承诺点名错绑；真正受阻的验收仍受限，无关项应继续。
无依据新增、删确认件或删需求落点必须显名；无规格不得算空差集。
独立读者拒绝用「只显示状态」弱化原行为，也能指出同源重复。
真实链与两条定向合约真跑；独立语义不由退出码替代。
独立读者在本段回修后写首判，计划落 `quality/tests/p03-coverage.readback.md`。
绑定问题回质量负责人，机器错误回原开发；不改原判据求绿。

**验收 4。** 证明没有另建差集命令，重复人工对账只在替代可核后退出。
用现役调用者、实际差异、不建登记和验收 3 原件，逐处核谁消费什么。
本段写主给当前路径，材料主会话给原决定；历史归档保持只读。
以同一坏例验证替代；屏蔽替代证据时仍必须保留重复人工对账。
故意引入第二个差集命令或提前撤人工核对时，判失败并指向改动。
只真跑验收 3 定向合约一次；本条真查 `git diff --name-only` 及相关差异，期望退出 0。
未参与本段的读者在同一记录写独立退役段，不能由前一条自动判通过。
日志「退役与不建清单」未点名实际可退出的重复人工动作。
保留[现役覆盖核对](../../../skills/decision-log/SKILL.md#L94)：逐查原需求、真实答复、落点和缺口。
它在唯一覆盖件逐项读写；不能将它凭空认成可退出的重复动作。
材料主会话给实际核对人、时点、输入和恢复位置，再用同一坏例对照。
误撤由原写主恢复原位置并保失败；无替代证据不宣称已退出。

| 账目 | 规格附录 A 的来源或读数 |
| --- | --- |
| 验收 3 成本七字段 | `executor=独立测试执行者与读者; estimate_min=20; hard_cap_min=40; resources=P2交回版本、绑定输出、临时认证任务根、覆盖矩阵; observation=未答两面、非法新增、无spec与终末扫描结果; retry_cap=0; evidence_tier=命令与语义原件级` |
| 验收 4 成本七字段 | `executor=独立读者; estimate_min=8; hard_cap_min=16; resources=现役caller、真实diff、不建登记、替代负例; observation=保留/不建理由与消费者可核行为; retry_cap=0; evidence_tier=语义原件级` |
| 资源 | 阶段二原版本、两个现有合约夹具、当前唯一覆盖件及本包真实回复；只做编号对账会漏弱化与重复 |
| 范围 | 验收 3 证覆盖和未答；验收 4 证不建和受控退出；人工失效标记及任务五存在性不在本段 |

任务形状：两条验收，链检查、日志与现役终末扫描，本机定向运行。
合约用临时认证任务根内的合成数据；真实复核用当前任务材料子集。
两个只读合约面可独立执行；语义和退役消费已捕获结果，不重跑。
`acceptance_cost_total=28 active_min`：验收 3 的 20 加退役人读 8。
20 分钟含两个并行合约面的最长活动、共同准备和真实材料复读。
共享准备不二计；不预埋原样重跑，可控执行与纯等待分账。
`phase_budget` 的软上限、硬上限及差异阈值未确认，回计划负责人核对。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
执行窗口和等待以分钟计，命令与预留以次计；未取得执行策略，不补默认。
真实绑定、独立审查、环境的纯等待分列，不计上述活动分钟。
无界面验收：不改、不读、不驱动页面、路由、组件或样式。

## 为什么现在做，依据是什么？

原日志与规格对得上编号，仍可能掩盖真实需求断线。
[决策日志](../decision-log.md#包3未答覆盖与差集退役)记录复用现役检查和唯一覆盖件的方案。
用户只确认七包整体方向；包三的逐包原话未取得，不作包级确认。
整体答复不能替代真实包级首判的卡、包级答复和版本绑定。
退役不是未完成，见[非目标与退役](../../../GLOSSARY.md#方向与选择)。
本段只读阶段一形成的未答去向，不为编号顺序新造开工依赖。

## 开始前读什么？

先读卡的验收格与包级答复，再检查交回的生产接缝。

| 材料或锚点 | 本段用法 | 时机 |
| --- | --- | --- |
| [规格](../spec.md#实现设计全局权威) 与附录 A 验收 3、4 | 核同一判据、实际写序与现有真实规格 | 开工前 |
| [日志](../decision-log.md#包3具体改什么怎么改怎么验)；任务根 `quality/evidence/decision-maker/p03/card.md:5–15,22–27` | 核包内正反例；卡末目前只指骨架，不能冒绑定 | 开工前 |
| 任务根 `quality/evidence/decision-log-refs/coverage-matrix-5d.md:1–8` | 旧标题原字「需求与答复覆盖核对」，不含「覆盖表／覆盖矩阵」，终末会跳过 | 写覆盖前 |
| `tools/cli/check-decision-log-chain.mjs:550–590,1004–1035`；`runtime/task/final-chain-runner.mjs:407–467` | 定位现役对账、签名及双扫描 | 写测试前 |
| `tests/contract/decision-evidence-consumption.test.mjs:38`；`tests/contract/final-chain-runner.test.mjs:19,96,1562` | 找现有认证任务夹具、现有扫读入口和清理 | 写测试前 |
| 任务根 `quality/evidence/build-plan/testing-blueprint.md:159–197` | 核命令、五个目标测试和证据边界 | 写测试前 |

阶段二交回原件尚未取得；实施前读该段「下一消费者拿什么继续？」并核实字节。

## 每个文件由谁改，先做什么？

先接阶段二版本并冻结通用测试；质量负责人另核真实包绑定。

| 精确路径 | 动作、唯一写主 | 消费者及输入 |
| --- | --- | --- |
| `tests/contract/decision-evidence-consumption.test.mjs` | 预写测试作者在阶段二交回后只增覆盖目标组，冻结后开发只读 | 独立测试执行者；合法/非法新增、未答与无规格夹具 |
| `tests/contract/final-chain-runner.test.mjs` | 预写测试作者补同一终末入口的双扫描回归；冻结后开发只读 | 另一只读测试执行者；当前签名、旧标题和旧指纹负例 |
| `skills/decision-log/templates/decision-log-template-v2.md` | 在「7. 验收」增既定来源及未答写法；阶段三开发 | 材料作者；阶段二模板 |
| `tools/cli/check-decision-log-chain.mjs` | 窄扩现役 `reconcileAcs` 和公开来源查读；阶段三开发 | 现有链入口；阶段二版本、当前规格、已声明来源和覆盖 |
| `specs/delivery-quality-direction-requirements-20261122/decision-log.md` | 测试之外由材料主会话独写来源指针、不建及退役条件 | 链入口、阶段四/六/七；阶段二日志和实读覆盖 |
| 任务根 `quality/evidence/decision-log-refs/coverage-matrix-5d.md` | 在现有件修改标题为「需求与答复覆盖矩阵」并保原路径；材料主会话独占 | 现有链、终末双扫描、阶段六与阶段七；实际落点或具名缺口 |

本段不新增静态路径；外置路径中的 `quality/` 基准为当前任务根。
测试作者先交冻结测试及真实目标失败，实施者不写这两份冻结测试。
声明是写入限制；独立审核须核实物理权限和前后字节，不得自称已隔离。
日志和覆盖原件同一材料主会话串行维护，链接变更与当前字节一起交回。

| 禁止改动或只读路径 | 实读与保护理由（2026-11-23，read/grep/shasum） |
| --- | --- |
| 任务根 `quality/evidence/decision-log-refs/requirement-index.md` | SHA-256 `18d9115eb5e60d59fd567ca2feea12dcf3fc40fa2df8d5b3c169d3630e2d3f5b`；下游读取，不改字节求绿 |
| 任务根 `quality/evidence/decision-maker/p03/card.md` | `source_id：U-004`，`调用=concrete-outline-confirmation`；这份历史卡不擅改，质量负责人核真实本包绑定 |
| `runtime/task/final-chain-runner.mjs` | 只读 `decisionOriginal`（407–467）；调用在 984 行，结果供 `rings[2]`（1001–1004） |
| `workflows/make-decision/SKILL.md` | `step-module-convergence`；流程写序是阶段一、四、五、七，本段不接旧卡泛称的流程说明 |
| `specs/delivery-quality-direction-requirements-20261122/spec.md` | 实读标题 `Appendix A — 验收判据（唯一权威）`。实施只用当次最终计划真实确认所指的规格字节；从确认所关联的展示原件取该规格来源及 SHA-256，在认证工作区运行 `shasum -a 256 specs/delivery-quality-direction-requirements-20261122/spec.md` 实算比对。确认、可核字节或已绑定指纹未取得，或现场值不符，退规格原作者核对；不使用未确认字节，不改编号或判据求对齐。 |

**定序写主。** 阶段二先交模板、检查器、已有合约和日志，阶段三后写。
原因是覆盖需要阶段二实际来源和承诺，不只是碰同文件。
通用合约成立即可交阶段四共享模板、检查器、冻结测试及日志当前版本。
缺真实包绑定与退役证据一并交回，不写真实批准或包级通过。
阶段五接实际合约版本，保前段冻结断言。
无可回读版本时记未知与影响，回前写主处理；不另建协调账。
阶段三开发合并本段改动，独立审查按 `git diff --name-only` 核范围。
共享函数是 `checkDecisionLogChain`；不新增 API、存储或数据格式。
游标只读任务事实的 `phase_progress`；这里不保存进度。

## 怎么验证？

通用实施依阶段二版本和受控夹具，不先等真实卡。
真实包级首判及退役前，由质量负责人跑下列首条，须 exit 0 且 `ok=true`。
方向卡末尾指向总体骨架，不能凭修措辞或整体答复跳过绑定。
独立只读绑定退出 1：设计调用标识、冷读和对抗卡版本、答复包号不一致。
原件见任务根 `quality/tests/2026-11-23-036-pre-review-p03-binding.json`
及其指向的原输出；这不是目标红测，不改旧卡或答复求通过。
设计原件 `quality/evidence/decision-maker/p03/design.md:1–3` 的调用时间是 `2026-11-23T01:12:00+08:00`，旧卡所填并不同。
材料主会话只在本任务当前卡的引用上据实纠正设计调用和指针；保原设计、旧卡及失败回执。
同一主会话派独立角色对当前卡冷读、对抗并留同版原件，不把旧审查改挂当前卡。
若本包确有真取舍，由主会话沿现有问答取得真实逐包原话；无真答保缺口，不能用本轮分工回复。
下列固定历史卡命令只用于复读既有失败；当前包验收用实际当前卡及其同包目录调用同一入口。

```sh
node skills/decision-maker/scripts/validate-card.mjs /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p03/card.md --bind --package /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p03
npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "^P03 coverage " --no-cache --reporter=verbose
npx --no-install vitest run tests/contract/final-chain-runner.test.mjs -t "^P03 final chain " --no-cache --reporter=verbose
node tools/cli/check-decision-log-chain.mjs --file specs/delivery-quality-direction-requirements-20261122/decision-log.md --source-root /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122
```

覆盖组同一目标断言改前非零、改后退出 0。
终末组先用既有入口核当前与过期；本来通过只记回归，不造目标 RED。
独立测试执行者核实际目标均执行；零匹配、配置或环境失败不算目标失败。
真实链命令合法时期望退出 0；保留真实失败和报告级缺口，不改退出语义。
从日志声明解析当前任务的外置覆盖路径，不能按运行目录猜路径。
当前规格已存在；无规格是单独夹具反例，不能把真实编号对账写成已做。

现有链入口能抓显名漏项、合法新增及未答限界，不能判替换行为是否减弱。
现役终末只识别实际捕获的 Node 检查入口及纯 `--file <路径>`。
它按「需求索引」及「覆盖表／覆盖矩阵」标题分组。
它核 `[check-decision-log-chain] scanned` 内的 `input_path`、
`input_sha256`、`checker_sha256`，以第 2 环采纳与 `basis` 验证。
现有覆盖件标题「需求与答复覆盖核对」会被跳过；材料主会话在原件改标题。
改名后用当前字节重采签名；不改旧回执，保留旧标题和过期签名反例。
实际结果须拒绝过期并留缺口；真有现役缺陷才交原负责人核范围，不在本卡先改。
对真实终末供件，由各自 `--file` 扫描需求索引与覆盖件，捕获同版签名。
日志带 `--source-root` 的复核不代替这两份真实扫描。
终末倒序读捕获；双件凑齐前遇到较新的合格日志 `--file` 会直接取单扫。
需要真实双扫时，依旧执行所需日志扫描，再捕获当前索引和覆盖件。
读第 2 环实际采纳及依据；若新日志单扫胜出，保该事实与缺口，不冒双扫。
两条扫描对合法当前单件均预期退出 0；以扫描签名和终末实际采用判供件。

```sh
node tools/cli/check-decision-log-chain.mjs --file /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-log-refs/requirement-index.md
node tools/cli/check-decision-log-chain.mjs --file /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-log-refs/coverage-matrix-5d.md
```

读者以真实承诺核弱化与同源重复；静态未命中不能证明没有动态消费者。

测试以现有认证临时任务夹具构造正反例，预期由人工原需求固定。
同一测试进程创建、消费，并在退出清理可再生路径，原始捕获在外。
不另建清理器；普通正反例不能宣称覆盖进程强杀或未知路径行为。
如果需要新增临时探测，沿既有跟踪 owner 及 `finally`，不碰未知目录。

绑定失败由本任务主会话组织质量角色与当前卡写主修引用、复核同版原件。
缺独立冷读、对抗或真实包答只留真实包级首判与退役缺口；通用验证和交回继续。
误挡、漏挡或误将旧回执当当前时，原写主撤本段受影响修改块。
恢复到阶段二交回的版本，保人工核对与原失败，再复验原好坏例。
需要改原判据或另建工具时，停对应路径回原决定人。

## 下一消费者拿什么继续？

交阶段三的真实首判、覆盖实际路径、当前共享文件状态与未答缺口。
阶段四拿受限验收及来源定位失效；阶段六把它读入真实首卡。
阶段七拿两条首判和当前签名，不补签，也不拿旧回执替当前扫描。
本段不证明所有历史形状兼容，也不接管任务五的最终存在性判定。

## 每张任务卡怎么写？

一张卡把原问题、唯一覆盖件和终末输出走通，不按模块拆交付。

### 任务 3：只限制对应验收，让覆盖能双向找到依据

为什么做：验收 3、4 要显露漏配和默增，又不能靠第二套人工记录。
交付什么：未答只限目标，新增可追依据；替代可证后才退重复核对。
不做什么：不建第二差集或未知清单，不删现役对账，不改历史。
前置：通用实施等阶段二交回；真实包验收和退役另等包级绑定。
怎么做：先在现有链合约写目标负例，再以模板和现役检查逐例贯通。
怎么验收：两条定向命令以同判据复验；真实链与独立读回补语义。
证据：捕获真实红绿、绑定与当前扫描；不以旧回执、样例或编号求绿。
下游（含何时停）：先交通用共享件；真实包缺口回质量负责人恢复。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T003
- **来源 / FR / AC**: R-004/R-009；decision-log.md:361–376 决定 3；U-014 仅确认整体方向，不批准本包或 AC；U-009 缺真实原话，不作有效确认；FR-COVER-001、FR-RETIRE-001；AC-P3-001、AC-P3-002。未答只限关联验收，双向覆盖与合法新增可追；重复人工核对等替代可核才退。
- **输入**: 阶段二交模板、检查器、合约和当前决定；材料主会话交唯一覆盖件及当前规格引用；质量负责人在真实包级首判与退役前交真实包三卡、真实逐包答复及受检指纹。同一行动、相同来源及重复判法由独立读者复核。卡末 U-004 是骨架答复；U-014 是整体方向，二者均不能代替实际绑定。
- **文件 / 符号**: `tools/cli/check-decision-log-chain.mjs` 的符号 `reconcileAcs`、`checkDecisionLogChain`；只读终末符号 decisionOriginal；`skills/decision-log/templates/decision-log-template-v2.md` 验收槽；当前 `specs/delivery-quality-direction-requirements-20261122/decision-log.md` 和任务根 `quality/evidence/decision-log-refs/coverage-matrix-5d.md`；两份合约路径见本段精确写集。
- **动作**: 在「7. 验收」写判定来源、未答绑定、负责人、恢复条件；沿现有声明读取同源索引与唯一覆盖件。逐条核需求去向及验收来源/替换；不是替换时须有真实承诺、批准者、影响、不可替代理由。解绑只移出无关活动限制，保原问题；不删真实阻塞。原材料写主在唯一覆盖件改标题并重采签名。沿原终末验证同版双扫和过期拒绝；较新日志单扫优先时据实记单扫，不改终末行为。
- **输出 / 失败**: 绑定项具名受限、无关项不受影响；缺来源/落点、新增依据不足或缺确认件显名；无规格时 `unavailable` 而不是空差集通过。覆盖语义只在原矩阵，日志不复制；第二差集只登记不建，现役对账保留至替代坏例可核。
- **边界 / 禁止改动**: 保护需求索引、历史包卡、当前规格、共享流程说明、原失败；不建第二工具、矩阵、未知清单或新公共入口。`DO NOT TOUCH`：冻结后实施不得写 `tests/contract/decision-evidence-consumption.test.mjs` 和 `tests/contract/final-chain-runner.test.mjs` 的冻结判据及本卡附录 A 判据。
- **依赖**: T002
- **测试层级 / 技能**: `feature`；主 `skills/backend-testing/SKILL.md` 的公开入口与独立预期。两个合约文件由预写测试作者在阶段二交回后先冻，独立只读分别跑；真实材料走原链入口，语义与退役另外人读。无 UI、在线服务、迁移或新增权限面。
- **场景 / 夹具或服务**: 使用现有认证任务根夹具；同进程创建消费并清理；捕获原件不入夹具。具名 `P03 coverage accepts sourced additions and limits only bound acceptance`、`P03 coverage rejects missing source and incomplete addition basis`、`P03 coverage keeps AC reconciliation unavailable without spec`、`P03 final chain counts declared requirement and coverage scans`、`P03 final chain rejects legacy coverage title and stale checker binding`。独立读者用错绑负例核原问题和两个有效验收，点名错绑并保真实阻塞。人读另验弱化替换、同源重复和替代不可读时提前退人工。
- **RED/GREEN 门禁命令**: `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "^P03 coverage " --no-cache --reporter=verbose`；`npx --no-install vitest run tests/contract/final-chain-runner.test.mjs -t "^P03 final chain " --no-cache --reporter=verbose`
- **预期退出码**: RED nonzero; GREEN 0；仅已收集的具名目标断言能归因；绑定、收集、导入、环境或过滤失败不算红测，旧用例本来通过不造失败；合法绑定和真实链复核期望 0。
- **RED 目标失败**: ORACLE-BIDIRECTIONAL-COVERAGE；对应 ORACLE-FINAL-COVERAGE-SCAN。缺来源的新增未点名、未答误限或无规格空过时，覆盖组目标断言先失败。终末先回归现役行为，拒收当前或误收旧件才记具名差异，不造目标 RED；退役另人读。
- **GREEN 判定器**: ORACLE-BIDIRECTIONAL-COVERAGE；ORACLE-FINAL-COVERAGE-SCAN 复用现役入口核当前采纳与过期拒绝；独立读者核错绑并保真阻塞；ORACLE-P3-CONTROLLED-RETIREMENT 另由独立读者据真实改动与现役使用者判第二工具不建、重复人工步骤仅在替代可核后退出。
- **证据**: RED/GREEN unavailable — 本轮只规划。计划 `quality/tests/p03-coverage.red.output`、`quality/tests/p03-coverage.green.output`、`quality/tests/p03-final-chain.output` 和 `quality/tests/p03-coverage.readback.md`，引用覆盖合约真实红绿、终末同入口回归、绑定、真实链回执及替代负例。测试变更请求：none；改冻结断言写旧新、理由、影响、旧 RED 与独立审查；改 AC 或冻结测试还须用户真实答复 ref 和原文，同一判定器编号不改。
- **覆盖上限**: 验收 3 和验收 4；不证历史其它列形、人工失效标记、真实首卡或任务五最终存在性。
- **停止 / 恢复**: 绑定未闭环只停真实包首判及退役，不挡通用验证和交回，回质量负责人和包写主核本包实际卡、逐包答复和当前指纹。误判回原写主只撤本段修改块，恢复包二版本和人工对账；保原失败，定向复验原坏例与合法例。需改验收回决定人。
- **完成**: 前置（不作完成条件）：P2 通用交件、具名命令的原输出可读；真实包另核绑定原件。完成条件（只写效果）：独立按验收 3 双向复读与坏例，并按验收 4 实读调用者、真实差异和替代；两条分别记录首判，不以同档推定；缺绑定或未执行保持 incomplete。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `tests/contract/decision-evidence-consumption.test.mjs`；`tests/contract/final-chain-runner.test.mjs`；`skills/decision-log/templates/decision-log-template-v2.md`；`tools/cli/check-decision-log-chain.mjs`；`specs/delivery-quality-direction-requirements-20261122/decision-log.md`；`quality/evidence/decision-log-refs/coverage-matrix-5d.md`
- **依赖**: P2
- **消费者**: P4、P6、P7
- **gate_cmd**: `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "^P03 coverage " --no-cache --reporter=verbose`
- **oracle**: ORACLE-BIDIRECTIONAL-COVERAGE；ORACLE-FINAL-COVERAGE-SCAN；ORACLE-P3-CONTROLLED-RETIREMENT
- **evidence_path**: planned: `quality/tests/p03-coverage.readback.md`
- **STOP**: 绑定不到只停真实包级首判及退役，通用实施、验证与交回继续，回质量负责人核真实包三卡与逐包答复；误判原写主撤本段修改块，保人工对账和原失败并定向复验；改原判据回决定人，其它路径继续。
- **覆盖 AC**: AC-P3-001、AC-P3-002
- **Done**: 前置（不作完成条件）：两组合约可读；真实包另核绑定与真实链。完成条件（只写效果）：AC-P3-001 双向、正确关联、错绑和扫描负控须独立可读；AC-P3-002 同一首判时单独核不建、现役保留和替代负例；真实绑定或退役依据未取得仍 incomplete，通用交件不作包级通过，计划 `quality/tests/p03-coverage.readback.md`。
