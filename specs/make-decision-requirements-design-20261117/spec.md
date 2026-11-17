# make-decision 需求设计改进规格

## 这是什么，给谁用？

这份计划让后续任务的方向讨论、收敛、验收和页面真正兑现用户原话。
实施者用它找改动边界，独立测试者用它找正反样本和观察协议。
Phase 指可独立交付验收的一段工作；判定器指保持不变的真假判断方法。
当前是等待完整计划审查和最终确认的草稿，生产实施及产品验收尚未开始。

材料导航：先读需求与场景，再读全局设计，开工时读阶段索引和对应阶段全文。
原始目标以本目录 decision-log.md 的原始需求、决定和验收面为准。
本任务不是任务组规划，没有 prd.md；decision-log.md 是等价产品入口。
旧索引、覆盖表及日志首行仍有历史草案口径，不能据此删掉追加需求。
大纲真实答复见任务库 quality/evidence/2026-11-17-007-build-plan-outline-answer.md。
该答复允许写完整计划，不替代末尾尚未取得的完整计划确认。

## 一页看懂：谁要什么结果，怎么算通过？

使用 WorkflowHub 的人能看清每包选了什么、为什么选、怎么判断有效。
执行助手保留原话和语气，先设计，只有确有歧义才问，再发聊天十格卡。
检查器暴露真实缺证，任务页面显示当前事实，UI路线遵从用户实际答复。
验收含义逐条继承决策日志；同号落点和执行安排集中在附录A。
先把答复登记做成完整试点，再推广其它包；退出码另取单任务试点保护。

## 为什么做，给谁用？

历史任务把原话逐层抽象后，交付虽然存在，用户要的行为却没有发生。
本次改现有方法和必要窄工具，保留复杂路线与所有已确认工作包。

### 需求1：用户原话能被准确兑现吗？

执行助手输入真实用户消息，保留允许、要求、建议、拒绝四种语气。
需求索引保存原话、原件位置、时间、所属包，日志引用它。
收敛前审计旧答复是否仍可用、被推翻、部分变化或需重排。
用户直接使用、支撑、验证和全局兜底四类包各说明服务的活动。
主干是用户可感知活动，最小切片是能从输入走到实际结果的一段路径。
覆盖表逐需求给落点或具名缺口，不能用整体批准替代逐包答复。
研究只把会改变方向、范围、验收的结论留日志，原证据留报告。
候选保摘要、证据位置、推荐或拒绝、推翻条件；没有候选写真实原因。
被否候选不丢，方案负面后果与风险分别说明，审查能重建并比较选择。

### 需求2：每包怎样真正收敛？

每包依次完成调研、发散、收敛、就地讨论、定验收。
执行助手先读源、设计并形成判断；只有真歧义才用提问工具问用户。
十格卡先出现在聊天里，存文件不能代替展示。
讨论原件写工作包、讨论前展示、复述与用户原话、批次号。
独立冷读者只读卡回答五问，并绑定同一讨论批次。
未决里带括号的“无”仍是未决；写清提供者、条件和下一动作。
收敛清单保持一个当前版本，历史原件不覆盖。

### 需求3：验收和日志能交给下一位读者吗？

每条验收说清谁、何时、观察什么、在哪看、什么算过。
正例、反例和本条不检查什么共同限定判据。
本包完成只能由本包交付决定；前置结果是供件，不冒成本包交付。
日志用十一种顶层内容组织全局和每包决定，过程表外置。
删除前证明服务过谁、谁改读哪里、回放为什么没有损失。
主会话是日志唯一写主，同文件不同小节也按共享写入串行。

### 需求4：执行、效果与页面能被真实观察吗？

步骤用具名原件和身份判断命名、来源与状态，目录非空不能证明完成。
证据缺口影响检查器退出结果，退出失败仍允许同任务修复。
保留原有步骤身份，把第六步职责并入第五步，保留唯一写稿后链检查。
第十一步有原件位置；末两步分别负责确认/报告与交接，避免重复签字。
轻档先标未验证，使用已存在真实任务补样本，不直接下线。
方法没有真实下游使用原件只能保留未完成，不能凭文档通过冒有效。
原始需求在决定、日志、计划审前、计划定稿、实施后回读，逐原话判断。
任务页面每区块有唯一来源，缺源显示“未取得”，不猜阶段或测试状态。
页面按最新事实取阶段，按命令聚合测试且保红绿及通过读数。
环与报告同源，写集从阶段索引进入真实报告，页面不改报告求绿。
页面保材料指纹、生成时点、生成器版本，读取时提示过期。
出页三问任一命中即出页；都不命中写理由；生成和实际打开分别留事实。
UI任务首次真实提问先问有稿或无稿，并保留四路、答复人和原件。
有稿直接用稿，禁止原创原型；无稿先选择路线，未答不开工。

## 做成什么样？

正常路径从原话进入需求索引，经逐包设计、聊天卡、讨论、验收到真实下游。
异常路径保留错误与原件，指明哪条判据缺什么，停止依赖它的分支。

### 场景1：答复可回读后怎样继续？

主会话输入真实答复，下一包读索引而非二次摘要。
当“允许”变“必须”，独立读者能指出原句与改写句，回原作者修引用。
答复未到时保持未答，取消讨论保已答事实，不默认同意。

### 场景2：缺证据和并发冲突怎样处理？

程序发现缺具名证据、错身份或讨论未绑定，就显示具体缺项并非零退出。
同一写路径由前一阶段交回后，后一阶段唯一写主继续。
写入失败保旧件及错误，不覆盖未知并发字节，回当前writer修后重放。

### 场景3：页面和UI路线怎样被使用？

读者打开任务页，核任务、阶段、测试、环和写集与原材料一致。
缺字段显示未取得；材料改变后，在下一次真实读取或重新打开时核当前来源并提示过期。
有稿用户走复用，无稿用户先选原型或直接实现风险路线。
权限失败或浏览器不可用时留真实缺口，不将系统open退出当打开成功。

## 打算怎么做？

复用现有日志模板、步骤表、两个检查器、聚合器和页面生成链。
方法改变由独立执行者实际使用一次，以原话和真实输出判断效果。
不新增阶段、公共命令、进度对象或长期兼容层。
私有页面核对器是唯一必要新增生产文件，理由和退役条件见全局设计。

## 阶段大纲：几个阶段，各交什么？

用户已接受保留全部范围，按以下顺序写完整计划。

| 阶段 | 结果 | 所属包 | 原验收 |
| --- | --- | --- | --- |
| 阶段1 | 答复试点 | 1 | 验收1 |
| 阶段2 | 包结构 | 2 | 验收2 |
| 阶段3 | 调研候选 | 4 | 验收4 |
| 阶段4 | 方案替代 | 3 | 验收3 |
| 阶段5 | 逐包收敛 | 5 | 验收5 |
| 阶段6 | 观察式验收 | 6 | 验收6 |
| 阶段7 | 日志结构 | 8 | 验收8 |
| 阶段8 | 步骤机检 | 7 | 验收7 |
| 阶段9 | 真实效果 | 9 | 验收10 |
| 阶段10 | UI路线 | 11 | 验收12 |
| 阶段11 | 页面一致与末验收 | 10 | 验收11 |

## 谁先谁后？

各包有自己的完整可观察结果，不能把不同验收强并成一段交付。
原决定承诺独立交付；答复失真、缺候选、收敛失效和页面错误分别判定。
因此保留超过经验提示的阶段数，不按文件拆阶段。
业务依赖为答复→结构/调研→方案→收敛→验收→日志→机检→效果/路线→页面。
共享的流程正文、模板和回放测试要求唯一writer交回后再写，实际按索引串行。
独立只读研究、测试原件阅读可并行；本计划不授权同时改共享文件。
末阶段首次验本阶段页面，并逐条消费上游原件覆盖整任务验收。


本任务沿用overview-template.html现页，仅修内容、来源和状态，不作外来设计稿移植。
依据是design-source-readiness“方法1”的“原位等价实质源”，以及design-source-extraction“执行5”的“判断允许移植时”条件；
原决定11:599明确不改设计稿解析工具。
因此当前不调用仅支持real/sample的移植判断器，不新增existing_page工具能力；原外来稿移植施工前置保持。
build-code第1步既有“有稿任务”广措辞与专业源移植触发范围需结合本task实际动作判读，不能把所有现页内容修复冒外稿移植。
旧ROLE_CONFLICT/allowed_for_construction=false只描述当时误套工具的尝试，不改绿、不冒真实源不存在或页面已准施工。
本task/P11仍须最终真实源选择确认，绑定实际模板/渲染、当前范围、Read Map/提炼和QA；源或范围变化重新判断适用性，不新建共享例外或准入gate。
阶段一至九与阶段十不做页面施工；阶段十一收到原路线供件和当前真实确认后才改页面，不能用大纲答复替最终源选择。
这不是runtime自动过滤的已证事实；
若实际caller必然把当前动作判为移植并硬阻断，保精确caller/错误回原owner核触发，其余安全工作继续，不造来源或改工具求绿。


## 还有什么没定？

原决定11:599和本阶段“验收不超本任务范围”已经排除设计稿解析工具扩展，现已撤回误加候选。
063问题保未答但不再是继续前提；user_answer_ref无，不虚构用户选择或接受风险。
完整计划与当前实际设计源选择仍待最终真实确认。
旧整体确认原话未取得，只保留handoff转述，不补造旧确认。
完整计划最终确认仍待本次完整展示后取得。
观察者用未参与实现的独立执行单元，不要求用户到场做测试。
台账跟随任务原件保留，当前任务不设自动TTL；历史不重写。
具体身份字段、指纹输入和步骤分工在全局设计及所属阶段明确。

## 实现设计（全局权威）

### 代码锚点

本节采用本次有界研究的真实接缝，而非把历史绿灯当现状。
工具原件见任务库 quality/evidence/2026-11-17-004-build-plan-bounded-research.md。
`tools/cli/check-stage-steps.mjs:992-1003,1170-1175` 已把缺证读为不完整但退出仍可能成功。
`tools/cli/check-decision-log-chain.mjs:381-425` 将warning作成功。
`tools/cli/run-checks.mjs:186-191,357-396` 把链和步骤证据当advisory。
`runtime/task/final-chain-runner.mjs:336-344` 的writeSets只看Phase正文Write set。
`skills/answer-as-page/scripts/build-page-data.mjs:135-145,194-239,405-410` 是阶段、解析、测试投影。
`skills/answer-as-page/scripts/render-answer-page.mjs:157-224` 消费报告和数据后发布并尝试打开。
旧exit0断言在 `tests/contract/n10-check-core.test.mjs:24,72-78`。
聚合旧断言在 `tests/contract/run-checks-zero-attestation.test.mjs:10-14,29-43`。
模板为 `skills/answer-as-page/templates/overview-template.html`，静态HTML/SVG/JS，无React。
非UI阶段仅改方法/检查器，不驱动页面；UI路线阶段验方法输出，页面阶段才验DOM。

### 接口与失败语义

沿真实用户消息→索引/日志→步骤证据→检查器报告→页面投影→独立观察传递。
答复条目为编号、来源分级、逐字原话、permit/require/recommend/reject、原ref与行位、时间、所属包。
来源分级为自由手写、明确选项采纳、保存转录、作者推断；它回答“谁写了这句、如何取得”。
四档语气回答“允许、要求、建议还是拒绝”，与来源分级是两个概念。
选项采纳须连同题目、选项含义与真实所选保存；转录须回原件；推断不得冒用户答复。
旧答复审计用可用/被推翻/部分变化/需重排，保原话不自动摘要。
讨论原件四要素沿原决定，十格名固定为一句话结果、对应需求、现状缺口、方案与取舍、
边界、数据与状态、验收、风险与回退、未决、白话复述。
身份字段只复用task_id、project、stage、step_id或step_slug、包号、source与原ref。
不另建身份schema；同一producer的现有字段缺失如实说明，不用默认值补身份。
人工结论须reader、inputs、observation、criteria_ref、conclusion、limits可回读。
程序结论绑定真实argv/cwd/exit/signal/timeout/output及时间，不能人填exit0冒执行。
第五步承接第六步骨架前自查；原step_id保留并指明职责承接，不重复自查。
第十四步整理最终事实和当前确认；第十五步发布绝对交接及独立读回后停手。
旧形状只标差异，不重写历史；新形状缺证影响非零，不声称所有历史任务失败。
provider不可用保最小交付：可读当前材料、实际失败原件、未覆盖项和恢复条件。
这不替独立质量审查，不换执行者，不把空findings当通过。
页面指纹含已消费材料字节摘要、当前消费facts值、报告内容与生成器版本。
包含最新阶段事实，排除纯命令采集噪声；具体分量与反例在页面阶段冻结。
读取时将当前来源与页内材料指纹对照，变更提示stale，不写任务状态。
测试以真实命令argv/cwd和运行器结果聚合，保同命令红绿及通过/失败读数。
环六由final-chain-runner从纯索引真实写入集取值，renderer只抄报告。
核对器直接对原材料及DOM/侧车逐块比较，不复用builder解析器重算期望。
核对失败返回字段级差异，缺来源标未取得，不吞为一致。

私有核对器的唯一consumer是页面阶段测试与既有出页caller。
owner是answer-as-page维护者，登记在既有move-map与技能bundle。
它替代手工逐块比对的机械面，语义与浏览器仍独立观察。
既有生成链承接同等逐块核对且真实consumer迁移后删除，不保永久桥。
公共七类工具、task事实形状、run游标、权限与Git授权接口保持原合同。


### 本轮补齐的真实接线是什么？

P1在原checkDecisionLogChain增加私有可选 requirement_index_markdown/read_source；
不新增公共命令或schema。
索引沿现Markdown列“编号|来源分级|答复原文|语气|原件ref与行位|时点|所属包”；
日志原四字段之外引用source_id、modality和来源身份。
read_source真实读取具名UTF8原件；
来源不存在、语气改变、作者推断冒用户分别报ANSWER_SOURCE_UNVERIFIABLE、ANSWER_MODALITY_MISMATCH、ANSWER_INFERENCE_AS_USER。
CLI --file沿当前日志的唯一外置索引指针读取同一来源，读取限定认证task/worktree及当前输入已明确授权的具名原来源；
PaperBuilder回放原答属后者，不能误拒。
拒绝未声明路径、目录遍历、符号链接越界和不可读来源并保错误；不把回调或存储细节暴露公共接口。
旧形状没有声明新来源合同只标形状差异；不能因所有WARNING而误拒。P1机器臂本阶段首次验，P8只整合退出语义。

P5沿runStageStepsCheck的modules[].evidenceGaps/convergence.gaps绑定真实包/讨论批次、聊天展示原ref、冷读五问原答和设计在提问之前的时点。
缺项明确报“<包>：聊天呈现未取得”“<包>：冷读五问未绑定”“<包>：先设计后提问缺证”。
机器真读具名聊天原件或原生消息引用并对卡字节/问答/五问原答作身份与先后绑定；自称已发或presentation=chat不能通过。
保存转录与原生渠道来源分清；受控fixture仅证明解析/绑定，不证明当前用户看见或同意。
独立读者仍判断白话、理解和五问答案正确性，不能用目录存在代替；真实G2聊天演示是测试回放，不伪新用户答复。

P9的两条验收臂在同阶段汇合：人工逐原句核实际方法效果；机器消费P8已经交付的具名证据/身份/时点检查结果。
check-reader-record仅验证原答结构，不冒机器行为；原AC010的“两者都有”保留。没有实际下游消费原件不能完成。

页面读取接缝复用openInSystemBrowser(filePath,{readCurrentSources,...})，内部默认调用同一私有check-page-content核当前认证材料字节。
回调输入为{htmlPath,nodesPath,taskRoot}，输出为{state:'current'|'stale'|'unknown',changed_sources:[],reason,checked_at}；
结果随原opened/action/url返回freshness。
每次真实打开前重读sidecar所列当前源，不拿HTML与同版sidecar自比证明当前。facts游标和报告环沿既有有效值规范化摘要，普通材料按实际字节。
状态/短理由/核对时点通过现任务URL fragment展示参数给模板的只读提示区，现任务tab匹配忽略这些显示参数；不回写历史HTML。
模板在初始化和hashchange时刷新只读提示；同任务复用标签仅改变fragment也必须显示新核对结果，不新增后台监控。
提示明确“截至该时点的入口核对”，这些显示参数不是当前来源认证；
直接旧URL/浏览器刷新只保上次核对，不声称又读取了最新材料，无本次源上下文则当前新鲜度unknown。
sidecar坏JSON、错task或路径越界保具名输入错误，不吞成current。
离线旧页或缺认证taskRoot/当前源时显示unknown；已打开页没有后台watcher，下一次真实读取/重开才重核。
内容语义期望独立从原文取得，不调用同builder解析器自证。088的P11只证明回调传递/OS边界目标RED，默认读源、DOM与浏览器仍须实施后实测。

步骤JSON不新增schema：P11在现observable_result写命名page_trigger条款（三问原文/任一命中/均否理由），completion_evidence绑定同次具名出页判定原件。
P11沿P8后写原check-stage-steps，真实读取判定与均否理由；
缺项报具名page_trigger gap且该步不能completed，不只看总exit。
producer为末尾真实出页caller，consumer为现check-stage-steps和handoff读者；
opened、截图、绝对路径与材料指纹另从真实回执读取，不从page_trigger推打开。

P10合法机器基线为quality/tests/2026-11-17-134-build-plan-p10-json-evidence-oracles.mjs，sha256=f404e66fb76e7bb8d756ddae21dec0a8c5adc0643e836676efe5a3cd76e8d103；四对照实际exit0，是本来通过，不证明UI四路运行。
合法P10完整供件为任务库quality/evidence/2026-11-17-075-build-plan-p10-legal-validation.md，sha256=80d788bd4d6d7fcbc19c62ec5fc64cf6997be34d5962845f4e34d908c77c5a3a。
当前无UI四路程序执行器，P10不新建路由API/新checker。首问缺失和未答的硬目标由原runStageStepsCheck承接P8具名问答槽，P10在第1步现completion_evidence配置ui_source_reply并后写其条件检查。
实读原工具问题/答复，核角色/非空及同call/task/batch；缺问、仅问无答、错归属都输出具名未收敛，非UI沿原有源判定不触义务；四路语义/不原创/风险选择仍独立完整方法消费。134原件可读基线不单独证明新硬目标接通。
当前新增138已实跑七类目标失败：缺问、别题顶槽、非首问、仅问无答、错task/批/call；合法UI/非UI及真实007格式前置本来通过。原件quality/tests/2026-11-17-138-build-plan-p10-ui-slot-oracles.mjs，sha256=e35d6bacb348554a12fc4b472ae147c2927a3530c48a8f832ea1ed6164c3278c，同号-ui-slot-red.json/.output exit1。
只证受控原件绑定，不认证真人/四路语义；必要身份源不足不补造，tuple索引不是question_id。
完整原件quality/evidence/2026-11-17-085-build-plan-p10-ui-slot-validation.md，sha256=5027f10c15463f433507444ddd5702bca4fc98184776521c7563db28812f0a5a；late-question只证同请求内索引，不冒跨调用全聊天首次顺序；该顺序仍须独立方法回读。

### 全局文件边界

生产新增仅为 `skills/answer-as-page/scripts/check-page-content.mjs`。
测试新增为 `tests/contract/decision-evidence-consumption.test.mjs`，专门承接本次真实回放。
混合阶段的测试文件由同一阶段writer顺序扩充，测试作者先冻结判据，实施不得静默改断言。
P10只接首问与原四路选择，不改设计稿解析工具；原real/sample移植合同保持。
旧058为误加的越界候选，未获原范围授权，不作当前验收证据；原脚本/谓词/字节和失败全部保留。
修改清单如下；各阶段是本清单子集，不能用目录通配符扩大写集。
- `docs/architecture/move-map.json`
- `runtime/task/final-chain-runner.mjs`
- `skills/answer-as-page/SKILL.md`
- `skills/answer-as-page/scripts/build-page-data.mjs`
- `skills/answer-as-page/scripts/check-page-content.mjs`
- `skills/answer-as-page/scripts/render-answer-page.mjs`
- `skills/answer-as-page/scripts/open-page.mjs`
- `skills/answer-as-page/skill-bundle.json`
- `skills/answer-as-page/templates/overview-template.html`
- `skills/decision-log/templates/decision-log-template.md`
- `skills/deep-research/SKILL.md`
- `skills/frontend-prototype-render/SKILL.md`
- `skills/spec-analyze/SKILL.md`
- `skills/spec-specify/SKILL.md`
- `skills/stage-handoff/SKILL.md`
- `skills/wh-review/contracts/make-decision.md`
- `tests/contract/check-stage-steps.test.mjs`
- `tests/contract/cockpit-autogen.test.mjs`
- `tests/contract/cockpit-event.test.mjs`
- `tests/contract/final-chain-runner.test.mjs`
- `tests/contract/decision-evidence-consumption.test.mjs`
- `tests/contract/n10-check-core.test.mjs`
- `tests/contract/run-checks-zero-attestation.test.mjs`
- `tests/contract/ui-stage-make-decision.test.mjs`
- `tools/cli/check-decision-log-chain.mjs`
- `tools/cli/check-stage-steps.mjs`
- `tools/cli/run-checks.mjs`
- `workflows/build-code/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/flows/normal/SKILL.md`
- `workflows/make-decision/flows/planning/SKILL.md`
- `workflows/make-decision/flows/small/SKILL.md`
- `workflows/make-decision/steps.json`

本任务的decision-log、已有问答和研究、所有历史归档及旧页面只读保留。
原AC语义、原始需求、冻结测试和原始失败均不由实施writer改写。
受保护字节在每阶段开工由只读测试者读取并记精确hash；不冻整树。
作者2026-11-18已读的保护对象是本任务decision-log全部决定与验收面，
原hash为e1b224f91604dc7b0bfe1f2c7c36a35f99ff55f46f400980c6b49afff2d413de。
原steps.json实际顶层为schema_version、stage_slug、steps；
每步保step_id、step_slug、observable_result、completion_evidence、method_anchor、requires_user_reply。
细节以当前JSON原件为准，读到差异回原作者修材料，不改运行时求绿。

### 需求到任务追踪

下表是语义去向，不用编号出现次数判断覆盖。
| 来源 | FR与验收 | Phase/Task | 判定器 | 原决定与真实结果 |
| --- | --- | --- | --- | --- |
| R-003 | FR-MD-001至FR-MD-012 / AC-001至AC-012 | P1/T001至P11/T011（按原包映射） | 各同号ORACLE-MD | 初发第5行“应该如何优化？”；十一包各自交付优化，不只交问题报告 |
| R-002、R-006 | FR-MD-001 / AC-001 | P1/T001 | ORACLE-MD-001 | decision-log.md；决定1；答复保留原话与语气 |
| R-002、R-009 | FR-MD-002 / AC-002 | P2/T002 | ORACLE-MD-002 | decision-log.md；决定2；包清单能解释每条需求的落点 |
| R-002 | FR-MD-003 / AC-003 | P4/T004 | ORACLE-MD-003 | decision-log.md；决定3；方案能与真实替代比较 |
| R-002、R-004 | FR-MD-004 / AC-004 | P3/T003 | ORACLE-MD-004 | decision-log.md；决定4；研究能交代候选与证据限制 |
| R-002、R-009、U-004、U-005 | FR-MD-005 / AC-005 | P5/T005 | ORACLE-MD-005 | decision-log.md；决定5；每包形成真实可回读的收敛结果 |
| R-007 | FR-MD-006 / AC-006 | P6/T006 | ORACLE-MD-006 | decision-log.md；决定6；验收能判本包实际结果 |
| R-002、R-005 | FR-MD-007 / AC-007 | P8/T008 | ORACLE-MD-007 | decision-log.md；决定7；步骤证据缺口影响真实退出结果 |
| R-002、R-009 | FR-MD-008 / AC-008 | P7/T007 | ORACLE-MD-008 | decision-log.md；决定8；日志给下游完整结论且删除有承接 |
| R-001、R-003、R-005、R-006、R-008、R-009、R-010、U-001、U-002 | FR-MD-009 / AC-009 | P11/T011 | ORACLE-MD-009 | decision-log.md；决定过程要求；本任务过程可回读 |
| R-007、U-003、U-004 | FR-MD-010 / AC-010 | P9/T009 | ORACLE-MD-010 | decision-log.md；决定9；完成结论包含真实消费者效果 |
| U-006 | FR-MD-011 / AC-011 | P11/T011 | ORACLE-MD-011 | decision-log.md；决定10；页面内容与当前任务一致 |
| U-007 | FR-MD-012 / AC-012 | P10/T010 | ORACLE-MD-012 | decision-log.md；决定11；UI任务走用户真实选择的路线 |

当前决定生产者用中文“决定1”等，没有ADR编号；此处引用真实锚，不编造ADR。
本阶段用户目标原件006还要求：严格从头、完整todo、提问工具、最多三子代理、
尽量一次异源审查、全部阶段可验证、不扩后续任务、末尾回核并交接停手。
这些归主会话过程验收，不新增生产需求，原件及当前计划确认进验收9。

### 全局验证策略

每包先取正反原材料，独立读者判断，再由最小可重跑工具处理同一输入逐项对照。
第一手工单元选答复“允许→必须”，记录原句、引用句、语气和误改位置。
工具输出必须定位同一原句，匹配内容和原因，不用总数或hash冒语义。
方法面用同Phase独立消费者完整实际消费，单纯字符串断言只证明辅助接线。
P2等后续自然消费原件是终末供件，不成为P1首判的未来依赖，避免独立Phase互等。
行为面先固定目标断言，改前具名失败才算RED；改后同一断言GREEN。
缺node_modules、导入或浏览器环境失败单列，不能冒目标RED。
本阶段只设计，不实施生产；
P1/P5/P8/P11综合目标RED已真实运行（088脚本及088–091回执），与原057/008/009窄RED各保覆盖限制；
P10旧058已撤为误加越界候选，不作当前目标或验收证据；不改原件。
全部GREEN仍未运行。
机检使用现有定向vitest；页面比较源文本到DATA/DOM；环六测试真实producer。
具体程序入口示例：`node tools/cli/check-stage-steps.mjs --stage=make-decision --json`。
实际task-path、material-root和目标测试必须使用所属Phase卡的精确命令。
未取得的实际RED和浏览器回执逐项保未运行，不能把计划命令当证据。
末阶段消费一次上游原件，只补必要未闭环case，不重复全量回归。

## 怎么算通过？

附录A只作原验收同号引用和执行映射，产品成功/失败含义仍由决策日志验收面唯一裁定。
该明确决定覆盖通用模板“重新写一套AC唯一权威”的冲突。
这里补充环境、观察者、输入、成本和证据安排，不降低任何原成功或失败条件。

### 验收对象是什么？

本任务同时包含命令方法和可见页面，因此保留Web验收对象，不伪装纯CLI。
workspace来自已认证工作树；service是隔离本地静态HTTP服务；route为本次重放页。
这里的服务、状态与视口是P11改后产品验收对象，该产品验收尚未运行。当前既有模板源已真实隔离打开并采集两视口，详见下节；两者对象与时点不同。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-make-decision-requirements-design-20261117",
  "service": {
    "kind": "isolated-local-http",
    "owner": "独立浏览器测试者",
    "source": "skills/isolated-browser-qa/SKILL.md"
  },
  "route": "/overview.html",
  "state": [
    "当前完整",
    "来源缺失",
    "材料变化过期",
    "同命令红绿",
    "环六写集"
  ],
  "viewport": [
    {
      "width": 1440,
      "height": 900
    },
    {
      "width": 390,
      "height": 844
    }
  ],
  "owner": "用户"
}
```

三源引用：raw_requirement为decision-log的追加需求6/7与决定10/11；
project_inventory为当前overview-template.html及builder/renderer真实消费；
planned_or_changed_frontend_fact为决定10的生成器/模板和九页回放范围。
来源已读范围见004；当前源打开、019/020截图及021提炼已实际发生。P11改后产品的截图、浏览器验收和独立设计审查仍未运行。

### 当前UI来源准备怎样落地？

本次三源均支持页面范围，只有页面阶段驱动/观察DOM；方法阶段不冒页面验收。
当前路线是沿用现有页面，模板是合法可读既有资产，不冒传统真实设计稿角色。
用户已确认该路线范围；完整当前设计展示答复仍待最终计划确认。
传统移植judgment工具拒existing_page的旧尝试写在judgment.md，不改绿。
当前现页内容修复不触发外稿移植判断器；真实当前源选择确认和UI六项仍保留。

<a id="screen-read-map"></a>

### 页面阅读地图是什么？

先看模板header/side/main，再看阶段、对象、测试、环及来源区。
模板读取时点为2026-11-18，版本以sha256 d4778c23838b8d408ffe543b2f30918085a8283bbb644bc9363f29dbd41c3458定位。
下表是本任务当前适用源，不新增统一设计规范或binding对象。
| 规范职责 | 实际来源/节及状态 | owner、consumer与本次选择 |
| --- | --- | --- |
| 领域语义 | GLOSSARY.md的Phase/可独立单元/原件；bindable | 领域owner；页面文案沿原词，不把游标叫完成 |
| 视觉 | overview-template.html的:root与基础CSS；bindable | answer-as-page owner；保现颜色/字体/层级，不凭源码冒视觉通过 |
| 组件 | 同模板header/side-nav/main/报告环函数；bindable | 模板owner；复用区域，不抽新共享组件 |
| 布局 | 同模板.app/.hdr/.side/.main；bindable | 模板owner；两视口由独立浏览器实测后判断 |
| 交互 | 同模板data-go/data-toggle/data-seen和键盘处理；bindable | 模板owner；保导航/焦点与只读来源，不写任务状态 |
| 前端工程 | builder/renderer及answer-as-page依赖边界；bindable | 原生成链owner；DATA事实和HTML/侧车同源发布 |
| 内容工艺 | answer-as-page的组件词汇/来源/缺口合同；bindable | 内容owner；缺值明确未取得，不从示例凑实例 |
| 质量 | frontend-testing/references/page-audit.md:51–52,119–120及通用六项；bindable但阈值措辞冲突 | 原质量owner；保真实200%/键盘与导航原读数，AT补充非必过，不新增INP阈值 |

specs/design和specs/frontend本树不存在；以上等价指定源可读，不为缺固定文件造空表。
源未带统一设计版本，只用本次文件hash/真实节与作用域，不编design_revision。
本read-map锚为本节显式screen-read-map，原源缺独立稳定锚时保原CSS/DOM定位。
可引用不等于视觉正确；声明值、浏览器rendered值及待议规范由单份提炼原件区分。

| 区域与组件 | action与状态owner | 真实consumer/状态与适配 |
| --- | --- | --- |
| 标题/阶段/包对象 | modify；owner=builder中的DATA | 当前任务读者；完整/缺源/旧阶段/标题变体；修映射与最新事实 |
| 测试与报告环 | modify；owner=原命令/报告producer | 终末读者；红绿/未取得；测试聚合，环六不在renderer自判 |
| 来源/过期提示 | extend-state-or-variant；owner=source fingerprint | 跨任务回看者；current/stale/missing；明确来源和重生成条件 |

四类资产中，前端组件/布局与设计组件/布局均沿当前模板可读关系复用。
不把导入当已正确呈现；生成后的DOM和真实区域由独立浏览器再核。
类型模型是现有静态DATA对象，CSS/token唯一owner仍模板，不引React或第二主题。
当前指定源状态已有021 rendered与019/020截图；其它产品状态未观察仍unknown，不能外推全部状态。
设计源提炼正式原件现已取得，只引用任务库quality/evidence/2026-11-17-021-design-source-extraction.json。
其hash为55f31e82e14960ba139dcffdc9f3fb04fc016ed7b5c5f5578e263ff73e66a286。
冻结plan018沿原十二项、两规定视口和同一overview状态执行，未缩分母。
049官方gateway、050probe、053正式采集均实际exit0，054/055保两视口原观察。
十九/二十号截图分别为1440×900、390×844；本作者实际查看两图。
这些证明既有结构可引用和指定源状态已显示，不证明原故障已修或P11产品通过。
当前页仍显示“当前位置未取得”和工作包缺映射，它们是保留的真实故障，不是批准设计。

021 JSON本体freshness为unknown，因为immutable产物不覆写。
060独立validate实际返回valid=true、freshness=current，针对同一冻结HTML、模板与结构。
source.version明确绑定HTML 180d2eef7ba365b885fbf3ffcd6c074fa11f442b331ce23c3c0e96eb26bb6ef8，
及模板 d4778c23838b8d408ffe543b2f30918085a8283bbb644bc9363f29dbd41c3458。
当前规划继续写spec不会自行重生成该HTML；current不证明它已反映最新任务材料。
重新生成HTML、模板或源结构变化后，原提炼须判受影响范围stale并沿原collector重提炼。

12项都有实际rendered字号和box；declared均保unknown，norm_state均为pending_review。
不把15px/12px/14px渲染读数自动晋升设计意图或新规范。
源码声明与渲染事实、待议规范仍沿021单份JSON分列，不复制成另一提炼对象。
未提供Figma源只限制figma-semantic-extraction，不冒本任务有Figma授权或远端语义。
low_fidelity未触发的approved明确“不适用、未收到人类批准”，不替当前完整展示答复。

旧023官方宿主缺ID、028只读guard拒click、031/032状态不符原件全部保留。
本次使用原collector的合法context.read(entry,scope)接缝和宿主原生page.click读取既有导航，
不修改生产collector、guard、源页、测试判据或冻结state_check。
049 gateway最终cleanup finished，owned页关闭且retained=0；061自有server经身份核对已关闭。
059 HTML/侧车pair检查exit0只证四键及digest结构，不证内容正确。

当前judgment已真实保存，024读回原件exit0；
025检查exit1/ROLE_CONFLICT，allowed_for_construction=false。
这些原件在任务库quality/tests，不冒页面施工批准。

### 最终页面来源怎样避免循环刷新？

最终单份提炼预声明create-only输出为任务库quality/evidence/design-source-extraction-final.json。
本次材料写入时尚未生成，不复制/改名旧021，不把计划路径冒真实产物。
材料最终停写后主会话刷新完整overview.html/.nodes.json，独立测试者沿原十二项/两视口/state_check真重采，由原collectDesignSource返回doc，再task.createRecord写该路径。
原CLI没有--output，不虚构参数；同字节幂等，不同字节RECORD_CONFLICT，不覆写或静默换源。
后续材料不为写入新产物路径再改一次；终末reader须在该真实产物存在并current校验后，才裁当前来源供件。旧021/所有失败保留。

### 资源恢复后实际能执行什么？

quality/evidence/2026-11-17-068-build-plan-perf-resource-report.md，sha256=19bc07e4d2c35b8322acf57d7463e3e7122509fea895d598a7c9226dfc518179，是062的独立性能恢复补件，不覆写旧失败。
123/124/125沿原runPageAudit和合法局部PATH实际取得三次导航样本；原报告067 overall=incomplete、state_observation=unknown，八维默认未测，不能冒P11产品验收。
ttfb/DCL/load中位数分别0.5/9/9.100000381毫秒；交互measure和长任务仍unknown。065只证progress的focus→Tab→Shift+Tab及焦点返回资源，066真实截图为reload后task-1，不冒progress。
126逐原报告引用核hash与自有server/scratch清理exit0；p1/space正常finish retained0，未主动登录复用但profile可共享。
旧Ego键路径和可选CUA未证200的事实保留；当前092独立native Chrome已取得真200资源，未改共享gateway或设计稿解析器，不作为同一run的自动回退。
资源代表页不冒未来十二组合产品通过，旧未知复制profile清理仍unknown，不扫删/不称全部清完。

真200资源新原件quality/evidence/2026-11-17-092-build-plan-native-zoom-resource-report.md，sha256=d230a1b1e37cdee2eaac11fb054520a7afac20b4cfdafc12478649ed8e016ee1；实际原生控件100→200→100、同窗inner1800→900/DPR2→4及恢复与目标重排交叉一致，143–145已核当前owned资源清理。
只证代表页资源，当前自然窗1800不是规定1440/390；未来P11需真核所有指定状态视口。旧136复制目录清理unknown仍保，不宣全部历史清理。详细隔离/命令/限制见P11本分项，未新增共享入口/判据。

## 测试计划是什么？

项目按本次结果自声明测试面，测试路线不能替代这张范围表。
| 测试面 | 为什么测或不测 | 判定与Phase |
| --- | --- | --- |
| 原话与方法实际消费 | 防止文件在但行为未发生 | 阶段1–7、9、10独立作者使用真实原件，具名观察协议 |
| 检查器CLI/退出 | 真实缺证exit0已复现 | 阶段8同尺正反输入，目标断言而非进程健康 |
| 数据投影/HTML/侧车 | parser可能同时错 | 阶段11独立从原文取期望，不调同parser自证 |
| 最终报告环六 | 页面不得自改报告 | 阶段11真实final-chain-runner定向断言 |
| 浏览器/视觉/响应式/无障碍/性能 | 页面面真实可见 | 阶段11两视口及真实打开，独立八维审查 |
| 外部服务/交易/生产数据 | 本任务没有这些产品行为 | 不测；不借前置验收扩后续任务 |

准入资源是仓库Node、已存在归档和任务原件；没有真实外部账号或凭证动作。
依赖安装和浏览器隔离由各owner准备，环境失败与业务失败分开。
临时夹具同进程创建、消费、finally回收；原始证据与交付包在scratch外保留。
现有temp-dir.mjs为唯一临时寿命owner，活PID/权限未知/符号链接不清理。
命令、判断、失败与覆盖限制沿task.captureCommand保存原件。

### 当前完整供件还有什么限制？

当前有效窄RED只证各自具名反例，不证明聊天、无稿全分支、九页或新页面UI全部通过。
完整测试设计已保存；未来GREEN及改后产品验收未执行。独立审查原件为quality/reviews/2026-11-17-018-build-plan-document.json，状态available-with-failures；pi身份/结果无效、材料覆盖undetermined、PNG未直接送达及004/010未内联等真实限制见041处置输入，不能冒完整质量通过。
正式旧源截图已显示其故障，当前最终计划/沿用来源及偏差仍需用户真实选择。
source提炼current只针对冻结页；059已指出该页业务材料比当前spec陈旧，不能冒最新任务页。
本次同包审查提交了现模板、源JSON及两截图引用；实际读取与undetermined覆盖沿018原件，不称外审已看截图像素。终末reader真实看图另记，不倒写为外审事实，也不由实现者自判。

### 冻结判据怎样隔离？

当前外置008/009/057/058/088脚本是保留的独立测试原件，实现writer只读，不授权改字节。
执行前独立测试者实际核开发环境读写权限；只有合同DO NOT TOUCH不算物理隔离。
现在未取得后续开发sandbox权限原件，隔离形态明确“未建立”，不是已证只读。
038真实OS试验已证明sandbox-exec能保护显式启动CLI进程及其后代：受保护输入读成功、写open得到EPERM、允许区写open成功。
它不能罩住树外MCP、同UID父进程或独立工具；capture只spawn，不自动建立隔离。
开发启动时由主会话在实际编辑入口建立只读oracle约束，并由独立测试者实探该入口及子进程。
仅将shell测试包进进程树、留下可在树外修改原oracle的编辑工具不算成立；
无法约束实际writer入口时保隔离未建立并回环境owner，不能用hash或DO NOT TOUCH代替。
做不到时保incomplete及owner，不伪造隔离通过；其它安全规划与修复继续。
本任务不为隔离新增控制平台、持久许可或全树冻结。

### 成本和等待怎样展示？

本轮成本采用原036基线与审后057逐活动替换，均provisional，未实测校准，不是已发生的活动账。
旧445=基数408+准备12+复验25已被本轮补齐替换；历史510/573也不作当前数。
已确定的阶段活动基数为P1 33、P2 20、P3 20、P4 24、P5 50、P6 24、P7 25、P8 65、P9 40、P10 62、P11 249，合612分钟；
P10按原scope重新推导，不沿旧35。
共享准备20=原12（Node/依赖3+样本映射4+工具读法3+身份原件2）+新增接缝读法5+scratch/来源身份核3，只计P1一次。
受影响重验32=checker12+页面14+证据清理6，只计P11一次。
故本轮活动估算664分钟，其中P10由085独立测试作者按合法route及新增槽活动估62，待独立reader重算。
原不含P10的602与沿旧35条件637不再作当前总额；664是按现已验证资源路线的provisional活动估算，不冒真实工时或用户已确认预算。
P1加准备为53分钟，P11加复验为281分钟；其余只计自身，不按阶段重复共享项。
每条成本七字段在附录A，完整活动来源在036/057、062的200%条件观察及085的合法P10槽重估；硬上限为一次完整重做情景，不是质量停止时限或全任务承诺。
真正并行面目前只读观察可并行，公共材料/代码写入串行，不虚减并行成本。
用户答复等待、provider审查纯等待、环境恢复纯等待分别留实际事件窗口，不混活动分钟；没有校准不编时限。
真200资源已由092独立native Chrome验证，原生100→200→100、同窗inner与DPR二倍变化/真实重排/还原互证；
062提出的校准/十二组合观察/恢复32沿该可用路线计入，不再作为待恢复条件；
不把物理AT/INP设备采购塞入本次必须活动。
独立reader将重算逐条成本与阶段总账，作者不自称已独立核算。

审后增量供件为任务库quality/evidence/2026-11-17-057-build-plan-testing-review-supplement.md，sha256=20e4f6fd7d60523609504839e1d1f49045137206ae21fee828675bffbbd520c3。
原036保历史基线，057补本轮真实目标RED/边界与逐活动成本；062补当前200%/性能资源真失败与条件成本32。
062原件quality/evidence/2026-11-17-062-build-plan-zoom-resource-report.md，sha256=78ed06cb10dd556ad60df8aafa7f0b3a796e363ab5309c7cc92f0e99db08ea52。
P8/AC008标签错位实际应原AC007，原件不改。
通用模板与精确专业源冲突的本次适用性见P11“质量观察为何这样适用”：保200%/键盘/响应式，性能只报相关导航/渲染原值，AT补充非必过，INP本次不另测。
057原补充中的通用未测资源措辞不覆盖此基于真实源的范围判断，不改原件或扩原AC。

## 有什么风险和未决？

退出码变严可能误拒旧形状；先单任务试点，对合法对照逐条核误报。
发生合法材料误拒即停该判据推广，保失败，回原writer修当前hunk或回退本阶段增量。
只有根因要求改变原AC/方向或承担超授权严重风险时回用户决定，其余授权内修复继续。
回退仅撤当前Phase相关hunk，保前序交付与未知新字节，不能整树checkout。
页面解析变体和过期比较可能漏读；用三任务和九页真实输入逐字段验证。
专业源page-audit:119要求真实200%/键盘焦点/返回，原生资源已由092取得；P11仍须真跑产品矩阵，失败保原错和owner，不用CSS/CDP仿真或假N/A。
该源120明确读屏AT补充非必过，51–52性能只报导航/渲染原值不设通过线；
通用phase-template:234的读屏/指标阈值不能升成本任务新产品AC，原专业/模板均不改。
方法消费需要独立上下文执行者；无法取得时只保incomplete，不冒完整验收。
旧最终确认原文未取得影响历史证明，不阻当前明确授权的规划。

## Appendix A — 验收同号引用与执行安排

原验收唯一来源为decision-log.md的“验收面”，本节不另造新验收号。
判定方式只用机器可判、只能人读、两者都有；人读由独立执行单元完成。
成本七字段为独立测试作者逐活动provisional估算；硬上限仅展示重复成本，不是停止修复/审查门。
retry_cap是同输入复验预留，不限制有新事实的修复；variance_threshold尚未校准，不套模板1.5。
超预算先减少重复验证或继续同任务解决，改变承诺才回用户。
未来实际安装/故障恢复纯等待没有校准，不编金额或时长；真200资源已有092可执行路线，产品观察预算已纳。
物理读屏AT为补充、INP本次不另测，不把无关设备采购/配置塞进当前必须活动。

- [ ] **AC-001**：原条款见 decision-log.md#验收面；答复保留原话与语气。
关联FR-MD-001；source_status=current；来源R-002、R-006。
判定方式：两者都有；判定时点：P1实际实现就绪后首判，P11终末承接。
落点：P1/T001，精确命令与六件观察协议见 `phases/P1.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“把允许写成必须时，读者能回到原答复指出被改写的句子”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=33；
hard_cap_min=66；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=答复语气准确；
怎么判=原AC同号及所属Phase精确命令；
来源=t03归档decision-log:484-491、本任务真实原话和索引；
谁提供=原样本owner/本任务实现者；
时点=P1回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：审后provisional，原句8+四来源合法8+三负例6+CLI读源/退出4+独立消费7；
hard_cap为两次完整活动估算，不是停止修复/审查门，未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“把允许写成必须时，读者能回到原答复指出被改写的句子”。
失败：继承原AC失败条件；“答复失去原件、语气改变，或旧答复未审计就复用”不能被放行。
证据：计划 `quality/tests/p1-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-002**：原条款见 decision-log.md#验收面；包清单能解释每条需求的落点。
关联FR-MD-002；source_status=current；来源R-002、R-009。
判定方式：只能人读；判定时点：P2实际实现就绪后首判，P11终末承接。
落点：P2/T002，精确命令与六件观察协议见 `phases/P2.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“读者指出缺落点的需求和缺分层的包，并识别主干与最小切片”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=20；
hard_cap_min=40；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=需求与包结构可查漏；
怎么判=原AC同号及所属Phase精确命令；
来源=card-05归档:160-240、本任务覆盖表；
谁提供=原样本owner/本任务实现者；
时点=P2回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：provisional，原v1-v3对照8+落点核对6+消费6；
hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“读者指出缺落点的需求和缺分层的包，并识别主干与最小切片”。
失败：继承原AC失败条件；“缺行仍算完整，或支撑包被强行包装成用户活动”不能被放行。
证据：计划 `quality/tests/p2-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-003**：原条款见 decision-log.md#验收面；方案能与真实替代比较。
关联FR-MD-003；source_status=current；来源R-002。
判定方式：只能人读；判定时点：P4实际实现就绪后首判，P11终末承接。
落点：P4/T004，精确命令与六件观察协议见 `phases/P4.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“读者指出空拒绝表或缺备选，并给具体反例”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=24；
hard_cap_min=48；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=方案与备选可比较；
怎么判=原AC同号及所属Phase精确命令；
来源=card-00:1243-1260、card-02:1179-1185、card-08:528-600；
谁提供=原样本owner/本任务实现者；
时点=P4回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：provisional，反例读取8+重建对比10+消费6；hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“读者指出空拒绝表或缺备选，并给具体反例”。
失败：继承原AC失败条件；“空表被当作没有替代，或等价且有理由的差异误判finding”不能被放行。
证据：计划 `quality/tests/p4-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-004**：原条款见 decision-log.md#验收面；研究能交代候选与证据限制。
关联FR-MD-004；source_status=current；来源R-002、R-004。
判定方式：只能人读；判定时点：P3实际实现就绪后首判，P11终末承接。
落点：P3/T003，精确命令与六件观察协议见 `phases/P3.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“没有候选但有真实原因可以接纳；无原因则点名不完整”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=20；
hard_cap_min=40；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=候选与证据限制保真；
怎么判=原AC同号及所属Phase精确命令；
来源=c12任务research两份具名md、本任务external-best-practices；
谁提供=原样本owner/本任务实现者；
时点=P3回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：provisional，两报告各4+推翻条件6+消费6；hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“没有候选但有真实原因可以接纳；无原因则点名不完整”。
失败：继承原AC失败条件；“缺外部证据仍写成确定结论，或没有原因仍宣称研究完整”不能被放行。
证据：计划 `quality/tests/p3-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-005**：原条款见 decision-log.md#验收面；每包形成真实可回读的收敛结果。
关联FR-MD-005；source_status=current；来源R-002、R-009、U-004、U-005。
判定方式：两者都有；判定时点：P5实际实现就绪后首判，P11终末承接。
落点：P5/T005，精确命令与六件观察协议见 `phases/P5.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“聊天十格卡、讨论原话和冷读指向同一包；括号未决和跨包合批被指出”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=50；
hard_cap_min=100；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=逐包讨论和聊天呈现可回读；
怎么判=原AC同号及所属Phase精确命令；
来源=c11 v6及talk、design-port九包原件、本任务后续包交互；
谁提供=原样本owner/本任务实现者；
时点=P5回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：审后provisional，十格原需7+聊天/卡/批次/五答绑定10+三机器反例6+五问冷读12+括号/跨包7+真实消费8；
hard_cap为两次完整活动估算，不是停止修复/审查门，未实测校准。
hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“聊天十格卡、讨论原话和冷读指向同一包；括号未决和跨包合批被指出”。
失败：继承原AC失败条件；“只存文件不发聊天、问卷先于设计、讨论未绑定仍算收敛”不能被放行。
证据：计划 `quality/tests/p5-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-006**：原条款见 decision-log.md#验收面；验收能判本包实际结果。
关联FR-MD-006；source_status=current；来源R-007。
判定方式：只能人读；判定时点：P6实际实现就绪后首判，P11终末承接。
落点：P6/T006，精确命令与六件观察协议见 `phases/P6.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“独立读者按观察协议指出别包交付物冒充本包完成条件”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=24；
hard_cap_min=48；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=本包验收只判本包交付；
怎么判=原AC同号及所属Phase精确命令；
来源=t09:449及812-826、本任务观察式AC；
谁提供=原样本owner/本任务实现者；
时点=P6回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：provisional，原错修正8+本任务AC8+下游使用8；hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“独立读者按观察协议指出别包交付物冒充本包完成条件”。
失败：继承原AC失败条件；“只看命令退出、数数，或本包没有产物却依赖别包才判通过”不能被放行。
证据：计划 `quality/tests/p6-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-007**：原条款见 decision-log.md#验收面；步骤证据缺口影响真实退出结果。
关联FR-MD-007；source_status=current；来源R-002、R-005。
判定方式：两者都有；判定时点：P8实际实现就绪后首判，P11终末承接。
落点：P8/T008，精确命令与六件观察协议见 `phases/P8.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“检查器明确区分命名、身份、状态，缺证据非零，合法同形输入不误拒”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=65；
hard_cap_min=130；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=具名缺证不能冒成功；
怎么判=原AC同号及所属Phase精确命令；
来源=c11真实根和归档、冻结008、c12合法旧形状；
谁提供=原样本owner/本任务实现者；
时点=P8回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：审后provisional，真实c11/c12读6+三checker证据/exit10+聚合/异stage6+两旧mini形状6+三现route受控回放21+失败预想8+真实消费8；
hard_cap为两次完整活动估算，不是停止修复/审查门，未实测校准。
hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“检查器明确区分命名、身份、状态，缺证据非零，合法同形输入不误拒”。
失败：继承原AC失败条件；“目录有文件即通过，缺证据仍exit0，或把非零变继续修复许可证”不能被放行。
证据：计划 `quality/tests/p8-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-008**：原条款见 decision-log.md#验收面；日志给下游完整结论且删除有承接。
关联FR-MD-008；source_status=current；来源R-002、R-009。
判定方式：只能人读；判定时点：P7实际实现就绪后首判，P11终末承接。
落点：P7/T007，精确命令与六件观察协议见 `phases/P7.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“读者指出重复或过期内容，并回读删除对象的新消费者与无损证明”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=25；
hard_cap_min=50；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=日志删除有真实承接；
怎么判=原AC同号及所属Phase精确命令；
来源=c11:382-413/437-474、新模板与下游；
谁提供=原样本owner/本任务实现者；
时点=P7回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：provisional，结构对照10+承接8+消费7；hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“读者指出重复或过期内容，并回读删除对象的新消费者与无损证明”。
失败：继承原AC失败条件；“重要内容直接删除，或无人消费的重复保留且不解释”不能被放行。
证据：计划 `quality/tests/p7-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-009**：原条款见 decision-log.md#验收面；本任务过程可回读。
关联FR-MD-009；
source_status=current；
来源R-001、R-003、R-005、R-006、R-008、R-009、R-010、U-001、U-002。
判定方式：只能人读；判定时点：P11实际实现就绪后首判，P11终末承接。
落点：P11/T011，精确命令与六件观察协议见 `phases/P11.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“报告、派发、问答、待办、白话汇报和绝对交接路径均能回到真实原件”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=32；
hard_cap_min=64；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=过程要求可回读；
怎么判=原AC同号及所属Phase精确命令；
来源=本任务四报告/派发/批次/最终汇报及handoff/task facts；
谁提供=原样本owner/本任务实现者；
时点=P11回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：审后provisional，六组逐原件18+全文5+终末handoff4+汇报5；
hard_cap为两次完整活动估算，不是停止修复/审查门，未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“报告、派发、问答、待办、白话汇报和绝对交接路径均能回到真实原件”。
失败：继承原AC失败条件；“任一过程只靠口头声明，或把本次规划写作冒充生产验收”不能被放行。
证据：计划 `quality/tests/p11-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-010**：原条款见 decision-log.md#验收面；完成结论包含真实消费者效果。
关联FR-MD-010；source_status=current；来源R-007、U-003、U-004。
判定方式：两者都有；判定时点：P9实际实现就绪后首判，P11终末承接。
落点：P9/T009，精确命令与六件观察协议见 `phases/P9.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“回放指出无消费者、形式验收和用户看不见；原话逐条给满足、被改写或丢失结论”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=40；
hard_cap_min=80；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=完成包含消费者效果；
怎么判=原AC同号及所属Phase精确命令；
来源=design-port:495-508、distortion-chain、本任务后续回读；
谁提供=原样本owner/本任务实现者；
时点=P9回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：审后provisional，全文8+五caller逐个4共20+机检臂6+真实消费6；
hard_cap为两次完整活动估算，不是停止修复/审查门，未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“回放指出无消费者、形式验收和用户看不见；原话逐条给满足、被改写或丢失结论”。
失败：继承原AC失败条件；“只查格式，缺原话回读，或方法没有下游使用原件却称有效”不能被放行。
证据：计划 `quality/tests/p9-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-011**：原条款见 decision-log.md#验收面；页面内容与当前任务一致。
关联FR-MD-011；source_status=current；来源U-006。
判定方式：两者都有；判定时点：P11实际实现就绪后首判，P11终末承接。
落点：P11/T011，精确命令与六件观察协议见 `phases/P11.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“真实材料重放后任务、阶段、测试、环、写集逐字段一致；该出页会出且实际打开”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=217；
hard_cap_min=434；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=页面和材料一致且真打开；
怎么判=原AC同号及所属Phase精确命令；
来源=三任务design-port/c12/stage-integration、九页/侧车/材料；
谁提供=原样本owner/本任务实现者；
时点=P11回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：审后provisional，真实200%有资源条件下另加校准6+十二组合观察24+恢复核2=32；
原185活动为三任务映射18+逐块独立预期18+三渲染18+九页27+真读时12+环六6+阶段/聚合8+三问6+十二组合视口48+键盘基本可达12+证据清理12；
hard_cap为两次完整活动估算，不作停止门，未实测校准。
hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“真实材料重放后任务、阶段、测试、环、写集逐字段一致；该出页会出且实际打开”。
失败：继承原AC失败条件；“页面与材料不一致、只修打开、不判过期，或无理由不出页”不能被放行。
证据：计划 `quality/tests/p11-acceptance` 具名原件和原输入ref；未执行不作结果。

- [ ] **AC-012**：原条款见 decision-log.md#验收面；UI任务走用户真实选择的路线。
关联FR-MD-012；source_status=current；来源U-007。
判定方式：两者都有；判定时点：P10实际实现就绪后首判，P11终末承接。
落点：P10/T010，精确命令与六件观察协议见 `phases/P10.md`。
验证：独立执行单元读取原条款及本包正反真实材料，观察“有稿直接用稿、无稿先选择、未答不开工；非UI路径逐字保持”。
环境与数据：004所核可读归档和现有任务原件；测试作者供件，实施前只读冻结。
谁判：未参与实现的独立测试者；语义由独立读者、程序面由定向命令判。
承接：只承接本包效果；前置Phase是供件，全部原件由末Phase消费。
成本：executor=独立测试者；
estimate_min=62；
hard_cap_min=124；
resources=本任务原需求和004列明归档/本机Node；
observation=原文到产物的具名差异与独立结论；
retry_cap=1；
evidence_tier=命令原件与独立观察。
证据计划七项：判什么=按真实UI路线走；
怎么判=原AC同号及所属Phase精确命令；
来源=当前judgment existing_page/真实模板、batch-021、design-port/C11来源；
谁提供=原样本owner/本任务实现者；
时点=P10回修后及实际下游消费时；
成本类别=命令或独立读回；
拿不到=留原错、缺项、owner与恢复条件，不冒完成。
成本推导：085独立测试作者按合法scope的provisional，原来源/首问6+真实tuple/任务根/批次5+四路方法16+未答/禁原创/非UI方法9+134原JSON6+138原件判读9+共享reader绑定核4+本任务真实消费7；
hard_cap为两次完整活动估算，仅展示重复成本，不是停止修复/审查门，尚未实测校准。
资源来源：quality/evidence/2026-11-17-010-build-plan-validation-resources.md的同号真实路径/读取范围；
复用已有原件，不把合成夹具写成真实用户样本。
为什么不能再简：仅程序退出无法指认该原需求是否兑现，必须保独立反例与下游效果。
通过：继承原AC成功条件，不缺适用证据；具体观察应为“有稿直接用稿、无稿先选择、未答不开工；非UI路径逐字保持”。
失败：继承原AC失败条件；“默认无稿、有稿仍造原型，或答复原件缺失仍进入实现”不能被放行。
证据：计划 `quality/tests/p10-acceptance` 具名原件和原输入ref；未执行不作结果。

## Appendix B — 需求与编号对照

下表只对照编号，场景、事实、假设与风险各在本节保单一事实归属。
| 中文名 | 编号 | 关联 |
| --- | --- | --- |
| 需求1 / 验收1 | FR-MD-001 / AC-001 | P1/T001；R-002、R-006 |
| 需求2 / 验收2 | FR-MD-002 / AC-002 | P2/T002；R-002、R-009 |
| 需求3 / 验收3 | FR-MD-003 / AC-003 | P4/T004；R-002 |
| 需求4 / 验收4 | FR-MD-004 / AC-004 | P3/T003；R-002、R-004 |
| 需求5 / 验收5 | FR-MD-005 / AC-005 | P5/T005；R-002、R-009、U-004、U-005 |
| 需求6 / 验收6 | FR-MD-006 / AC-006 | P6/T006；R-007 |
| 需求7 / 验收7 | FR-MD-007 / AC-007 | P8/T008；R-002、R-005 |
| 需求8 / 验收8 | FR-MD-008 / AC-008 | P7/T007；R-002、R-009 |
| 需求9 / 验收9 | FR-MD-009 / AC-009 | P11/T011；R-001、R-003、R-005、R-006、R-008、R-009、R-010、U-001、U-002 |
| 需求10 / 验收10 | FR-MD-010 / AC-010 | P9/T009；R-007、U-003、U-004 |
| 需求11 / 验收11 | FR-MD-011 / AC-011 | P11/T011；U-006 |
| 需求12 / 验收12 | FR-MD-012 / AC-012 | P10/T010；U-007 |
| 场景1 | SCN-001 | 答复、结构、调研、方案、收敛、验收 |
| 场景2 | SCN-002 | 日志、机检、效果及过程 |
| 场景3 | SCN-003 | 页面与UI路线 |
| 事实1 | PFACT-001 | FR-MD-001至FR-MD-012 |
| 事实2 | PFACT-002 | FR-MD-007、FR-MD-011 |
| 事实3 | PFACT-003 | FR-MD-011 |
| 未决1 / 风险1 | OPEN-001 / RISK-001 | FR-MD-009；旧最终确认原文未取得 |
| 未决2 / 风险2 | OPEN-002 / RISK-002 | FR-MD-011；改后浏览器与适用200%待执行 |

- **PFACT-001**：status=verified；evidence=decision-log.md原始需求/决定/验收面与大纲答复007；影响全部FR/AC；证明已确认规划范围，不证明产品已实现。
- **PFACT-002**：status=verified；evidence=004中c11真实argv/exit/stdout及页面真实接缝；影响FR-MD-007/011、AC-007/011；只覆盖所查输入。
- **PFACT-003**：status=unknown；owner=独立浏览器测试者；影响FR-MD-011、AC-011；指定旧源两视口已有原件但未来产品状态、适用200%/键盘与相关导航观察及GREEN未执行，关联OPEN-002/RISK-002。
- **FR-MD-001**：答复保留原话与语气；关联PFACT-001、SCN-001、AC-001；source_status=current；来源R-002、R-006；决定见原日志对应包。
- **FR-MD-002**：包清单能解释每条需求的落点；关联PFACT-001、SCN-001、AC-002；source_status=current；来源R-002、R-009；决定见原日志对应包。
- **FR-MD-003**：方案能与真实替代比较；关联PFACT-001、SCN-001、AC-003；source_status=current；来源R-002；决定见原日志对应包。
- **FR-MD-004**：研究能交代候选与证据限制；关联PFACT-001、SCN-001、AC-004；source_status=current；来源R-002、R-004；决定见原日志对应包。
- **FR-MD-005**：每包形成真实可回读的收敛结果；关联PFACT-001、SCN-001、AC-005；source_status=current；来源R-002、R-009、U-004、U-005；决定见原日志对应包。
- **FR-MD-006**：验收能判本包实际结果；关联PFACT-001、SCN-001、AC-006；source_status=current；来源R-007；决定见原日志对应包。
- **FR-MD-007**：步骤证据缺口影响真实退出结果；关联PFACT-001、SCN-002、AC-007；source_status=current；来源R-002、R-005；决定见原日志对应包。
- **FR-MD-008**：日志给下游完整结论且删除有承接；关联PFACT-001、SCN-002、AC-008；source_status=current；来源R-002、R-009；决定见原日志对应包。
- **FR-MD-009**：本任务过程可回读；关联PFACT-001、SCN-002、AC-009；source_status=current；来源R-001、R-003、R-005、R-006、R-008、R-009、R-010、U-001、U-002；决定见原日志对应包。
- **FR-MD-010**：完成结论包含真实消费者效果；关联PFACT-001、SCN-002、AC-010；source_status=current；来源R-007、U-003、U-004；决定见原日志对应包。
- **FR-MD-011**：页面内容与当前任务一致；关联PFACT-001、SCN-003、AC-011；source_status=current；来源U-006；决定见原日志对应包。
- **FR-MD-012**：UI任务走用户真实选择的路线；关联PFACT-001、SCN-003、AC-012；source_status=current；来源U-007；决定见原日志对应包。

- **OPEN-001**：旧最终确认原文未取得，owner=原会话；影响旧确认证明，恢复条件为真实原话ref；当前新大纲授权不代补旧话。
- **RISK-001**：把旧摘要冒确认会伪造事实；保unknown和原handoff限定，交当前最终计划确认独立处理。
- **OPEN-002**：P11改后浏览器/真实200%及相关导航观察未执行，owner=独立浏览器测试者与原宿主提供者；按本任务质量适用性补原件；AT补充/INP不另测不作新产品门。
- **RISK-002**：环境缺失冒通过会掩盖页面问题；只停依赖工具的观察，其他安全验证继续，未覆盖不得称完整。

### 原始消息怎样回读，哪些只是摘要？

本节是当前spec的来源绑定，不回写历史requirement-index，不另建第二索引文件。
R表只作原消息的切片导航，不能冒初发消息全文；独立终末reader须打开下列原件全文及后续真实答复。
初发消息的当前可回读逐字保存件为quality/evidence/decision-log-refs/verbatim-declarations.md:5–7，sha256=a0d54de2660c8f2f13c203fc95e578bcf99f68a9f7811d4f269db85e6eb68e8e。
它自述“用户原话（逐字）”，是保存转录，不声称本作者重新取得宿主原消息数据库。已读其两段全文；历史索引只导航，不能覆盖该原件。
R001–R004同在第5行：指定分析文件与两项目归档、问题面、“应该如何优化？”、外部问题；
R005–R010同在第7行：严格流程、中文/提问工具、完全可验、主会话少读/及时汇报、逐包收敛、交接停手。
R003的“应该如何优化？”落实全部FR001–012的改造而非仅问题描述；P1–P11逐包首次验和P11整任务AC009过程回核同时承接，不能只列研究完成。
“最佳时间”仍保原话，理解为“最佳实践”仅为原件备注I001作者推断，不改用户字句。

- U001/U002：quality/evidence/decision-log-refs/talk/batch-001.md:9–15/19–24；
  sha256=f27d050d8f4382643e3c4c5e203795c8e4c0bf238eb907cad10ebb92894ceeb6。
  选择类原答：复杂路线（推荐）；
  内部加外部（推荐）。
  题目和选项含义必须一并读取。
  当前复杂11阶段及原调研四件为承接；
  FR009/AC009过程和各阶段范围保留，不新增产品AC。

- U003：quality/evidence/decision-log-refs/talk/batch-006.md:5–7；
  sha256=56eadf2f38018087d1eb3794570f82f15c63fe8115c02cefefbc5d7fdc1da730。
  原新增有效性诉求→FR010/AC010/P9；
  五问/真效果亦供P5。

- U004：quality/evidence/decision-log-refs/talk/batch-007.md:5–7；
  sha256=5c956fd2aba537a7ec7d6a40ccfb9b78818c218bf43af7c78aa45a8f59dbb91f。
  十格卡/白话/独立五问→FR005/010、AC005/010、P5/P9。

- 五节点：quality/evidence/decision-log-refs/talk/batch-015.md:4–6；
  sha256=553ff99753ef87fca24834b8152f53cf1c8c30d18ef3ec7c4c70a9f4314d1466。
  方向定稿、日志定稿、计划审前、计划定稿后、实施完成真实回读→P9/P11。

- U005/U006：quality/evidence/decision-log-refs/talk/batch-016.md:6–8；
  sha256=8c6981a7d4d6fc9f3ef2fa001ddec8aa8502e17c84145bc0ed8579dcd85af727。
  先设计后真歧义提问→P5/AC005；
  彻底修页面→P11/AC011。

- 出页补答：quality/evidence/decision-log-refs/talk/batch-017.md:4–7；
  sha256=879dbfff7ad1c4d23efaa472b7e9b8180e56b9d65a592b7e22eba2b59f92a64a。
  三问、真实浏览器、opened及路径指纹→P11/AC011与过程AC009。

- U007：quality/evidence/decision-log-refs/talk/batch-021.md:5–6；
  sha256=b1d9cfae6233f08de10c3a6b92ea713bdb64e0b2ce23b5a46637f48f64f6fa6b。
  UI第一次真实提问先有稿/无稿、有稿直接用、无稿选路线→P10/FR012/AC012；
  现页复用范围决定不能代替未来用户答复。

以上U说明是本作者摘要，权威是原件“用户原话/用户答复”正文；039投影仅导航，不能代替原答。U007确已追加，旧索引停U006是历史缺口，不据此删范围。
当前阶段006原件quality/evidence/2026-11-17-006-build-plan-user-goal-source.json，sha256=414c525b4bc5b08b357638d12cebc51a590240c95510b2b1bf27dee21df26527，真实内容位于/goal/objective（原JSON第7行）。
该原文严格从头执行build-plan、认证worktree与完整todo、提问工具和白话、主会话少调研、并行子代理≤3、尽量一次异源审查、各Phase全部可验证、不过后续范围、末尾回核原始需求/prd/decision-log、交接停手，逐项归AC009本阶段过程回读。
本task不存在prd.md；decision-log是等价产品入口，不编造缺失prd。大纲答复007只授权写完整计划，不冒完整计划批准。
004/010和006真实源未完整进入旧外审packet；
这是既有传输覆盖限制，修当前文档不能倒称外部已读。
终末独立reader要真读004接缝、010样本及本节原件，再报告实际覆盖。
