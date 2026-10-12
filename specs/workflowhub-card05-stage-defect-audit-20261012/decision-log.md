# 决策日志（decision-log）

读者：build-plan 与 build-code 的材料作者。
读完要能：取到本任务的结论、写集、验收接口与指针，不必读过程原件。
本文件是精炼主文；过程原件与逐条明细在 `## 外置事实索引` 指明的位置。精炼口径＝U-014①／U-014③。

## 任务身份

本节回答当前任务是什么类型、在哪个工作区做。

- 任务类型：普通任务——先诊断 card-05 的真实过程缺陷，再按诊断结论修改 workflowhub 的 workflows 与 skills。
- 任务 id：`workflowhub-card05-stage-defect-audit-20261012`。
- 认证工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-card05-stage-defect-audit-20261012`。
- 分支与 baseline：`task/workflowhub/workflowhub-card05-stage-defect-audit-20261012`，baseline `2dcffd16`。
- 任务库根：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012`。

完成判据：本节恰一次声明当前任务类型，且与用户真实声明一致。


## 大纲地图

本节回答下游从哪里找到所需内容。

- 任务身份
- 原始需求
- 需求变更记录
- 工作包与决定
- 模块清单
- 要改哪些文件
- 范围与非目标
- 验收面
- 未决项
- 风险与延期交接
- 退役登记
- 外置事实索引

完成判据：目录每行对应一个正文顶层节，按正文顺序排列；大纲地图自身省略。

## 原始需求

本节回答用户要什么、每条需求落在哪。**结论**：18 条需求（R-001…R-018）全部登记，范围采取"先诊断、范围后定"。
每条格式：`R 编号｜需求摘要｜落点`。

- **R-001**｜两个前置任务做完后 workflowhub 仍有不少问题｜工作包①，诊断已完成
- **R-002**｜card-05 的 make-decision 与 build-plan 都有问题、产物质量不行｜工作包①；F-15 到 F-31
- **R-003**｜派子代理检查 card-05 的 make-decision 与 build-plan 两个会话｜9 路取证已完成；原件在 `raw/`
- **R-004**｜判断两个过程是否符合前两个任务的预期｜F-30、F-31、F-32
- **R-005**｜查清 stage-reflection 做过没有、沉淀在哪里，两边都该沉淀｜N7；U-008② 改为按归属分流
- **R-006**｜查根因、查其他 stage 是否同病、如何解决｜工作包①②③；第 15 路审计后重写模块清单
- **R-007**｜按标准流程执行：先建 worktree、从 make-decision 开始、不跳阶段｜已执行；F-02
- **R-008**｜与用户梳理需求大纲与细节、扩散想法、方案与验收标准；Talk 与 grill 用大白话｜`## 需求变更记录`；`## 工作包与决定`
- **R-009**｜主会话少做重读；方向审查与细节审查各只做一次｜方向审查已做一次，不得记为通过
- **R-010**｜现场指认：提问没走 talk 的提问工具｜证据不支持（F-13 更正）
- **R-011**｜现场指认：向用户提问大量带黑话与内部编号；要求用简明语言标准标准化沟通过程｜N6；缺口登记为 OI-008
- **R-012**｜范围决策方式＝先诊断、范围等诊断结果出来再定｜U-001；修订后大纲
- **R-013**｜提交节奏：一个 phase 全做完再提交一次；实例 card-08 一个 PR 74 个提交｜N11；AC-C05AUD-13
- **R-014**｜PR 生命周期偏离原设计（原设计 make-decision 末建 PR、verify-code 末关 PR）｜N12；AC-C05AUD-14；缺口见该行
- **R-015**｜每 Phase 完整测试、末 Phase 整任务端到端验收、verify-code 审计测试结果｜N8、N9、N10；AC-C05AUD-10 到 12
- **R-016**｜phase 文件名要带任务名或工作包名，例 `P1-门禁核验与开闸.md`｜N17；AC-C05AUD-19
- **R-017**｜phase 数量按工作包或独立可交付、可验收的 task 划分；实例 card-05 有 27 个 phase｜N17；AC-C05AUD-19
- **R-018**｜decision-log 要高度精炼、方便 build-plan 使用，把对 build-plan 无影响的内容外置、正文只留指针；该需求提过不下 10 次仍未实现｜N16；AC-C05AUD-20；根因见 `facts-index.md`

已知事实 68 条（F-01…F-68）、3 条假设与推翻依据、以及全部更正与过程记录外置到 `facts-index.md`。

**会改变 build-plan 写法的 5 条关键事实**：

1. 决定块标题写作 `#### N1 — …`，不匹配 `check-decision-log-chain.mjs` 认的 `ADR-NNN` 形状；该检查器对本材料 `recognized_blocks = 0` 且恒定 exit 0（F-67）。
2. 阶段卡里声明的 `gate_cmd` 全仓没有执行者；`ac_coverage` 与 `command_oracle_checks` 已算出但生产侧从不读（F-49）。
3. `facts.jsonl` 的 `evidence` 槽生产侧零 writer（唯一写方写 `null`），形状已由 `runtime/task/task-store.mjs:87` 定义为 `[{command, exit_code, failure_signature}]`（F-61）。
4. "末 Phase ＝ 整任务端到端验收"不是 workflowhub 的义务：消费者（verify-code）假设它存在，生产者（build-plan）零义务（F-46）。
5. 授权绑 HEAD 使每次提交作废旧授权；实测 card-08 有 58 条 authorize-commit 与 58 条 consumed-commit、57 个不同 `head`（F-41）。

完成判据：每条真实需求有 source_id、来源与落点；缺来源逐项写明；逐字原文与索引明细引用外置原件。本节收窄了模板要求的"原义"栏：原义逐字保留在 `facts-index.md` 与 `raw-requirements/` 原件里。

## 需求变更记录

本节回答需求变过什么。**结论**：14 条（U-001…U-014），一条一行，全部已确认，无待裁变更。
每条格式：`U 编号｜结论｜原文指针`。

- **U-001**｜追加两类现场指认缺陷，要求用简明语言标准标准化沟通过程；范围采取"先诊断再定"｜`raw-requirements/user-message-20261012-b.txt`
- **U-002**｜验收口径＝修好后由用户另跑真实任务判定；红线＝不加新机制、关卡、账本｜提问工具真实答复
- **U-003**｜修复范围＝修根因；复盘沉淀＝给它落点｜提问工具真实答复
- **U-004**｜追加三项新需求（提交节奏、PR 生命周期、每 Phase 完整测试与端到端验收），先调研再加｜`raw-requirements/user-message-20261012-c.txt`
- **U-005**｜结论：①提交粒度＝每 phase 1 次、verify-code 结束再来一次完整的全部提交合并；｜②PR 让其在合并前可见；｜③末 phase 端到端验收成为义务且 verify-code 逐 phase 核对；
④测试命令真执行但只记录不阻断｜原文指针：提问工具真实答复与用户现场更正
- **U-006**｜纠正缩小的口径：完整测试＝代码、接口、UI，包括浏览器端到端测试；标准在 make-decision 与 build-plan 定、在 build-code 执行｜`raw-requirements/user-message-20261012-d.txt`
- **U-007**｜模块清单通过，开工方式＝一次全做完｜提问工具真实答复
- **U-008**｜①越界处置按类别分；②问题回流按归属分流；③悬空要求删掉悬空名、对账落到现有小节｜提问工具真实答复
- **U-009**｜①测试层级不写死，由每个项目每个任务每个 phase 自己定；②执行者＝build-code 中的测试子代理，不是运行时；③N13 取消｜提问工具真实答复
- **U-010**｜结论：①N8 只要求自己声明测哪些面、每面理由、每个要测的面配一条可执行命令，工具仓库不给清单也不检查清单内容；｜②N9 的"没跑"必须写清哪一面、卡在哪、什么条件下能跑；
③N15 只写进写作规范、不动代码｜原文指针：提问工具真实答复
- **U-011**｜结论：①N12 收尾拆两步但不阻塞、PR 链接推给用户；｜②N14 工具仓库不定义类别，只要求动手前显式读取并引用项目自己声明的类别；
③N5 在现有覆盖矩阵加取值"已投递未执行"，并要求"登记了却没处置的项必须以缺口出现一次"｜原文指针：提问工具真实答复
- **U-012**｜grill 六条已裁：回执由运行时汇总写；同阶段内授权可重用；新绑定只 build-code 生效；未声明类别只记事实不停等；测试面自查前移到 build-plan 审查；PR 不阻塞但先推链接｜提问工具真实答复
- **U-013**｜追加 R-016、R-017、R-018 三条新需求，并要求先查根本原因再加进任务｜`raw-requirements/user-message-20261012-e.txt`
- **U-014**｜Talk 第 10 批（R-018 根因摆出后，经同一提问工具取得，三条独立轴）：①N16 的形态＝扩外置＋加阈值＋记事实——外置覆盖面扩到那五类（事实表、更正、未确认项汇总、写集逐条对账、覆盖矩阵逐项结论）；给穷举判据加"外置优先＋超阈值必须写具名理由"；让已有检查点把篇幅与结构占比作为事实记录（只显示数字、不判定通过与否，不新增门、不新增评分器）；
  ②N17 的判据＝按独立可交付、可验收划——每个 phase 必须能独立交付并被独立验收；一个工作包只含一个可交付物就对应一个 phase，工作包多于可交付物时允许拆，但必须在 spec 里写明为什么拆；
  ③当场精炼本材料＝要——按新口径重写主文，把过程、更正、逐条对账外置，主文只留结论与指针。
  来源：宿主询问工具真实答复。
  受影响决定：N16 形态定形（不新增门与评分器，与 ADR-0037 不冲突）；N17 判据定形；本材料自身须当场精炼一次。
- **U-015**｜**用户否决"以指标精炼"，这是对 U-014① 的更正**：用户原话「请不要限制行数、文件大小、每行字节！我需要的自然精炼，而不是通过指标强行精炼！」
→ U-014① 中"加阈值"部分作废；任何以行数、文件大小、每行字节为限制或驱动的手段一律不用；精炼改为内容判断：**下游 build-plan 直接消费的内容留在主文，过程、更正、逐条对账、逐项结论这类"证明与过程"外置成原件、主文只留指针**。
U-014① 中"记事实"部分降级为纯观察记录：可以照实测记下前后数字，但不得设目标值、不得作达标判据、不得据此判断精炼成败。
影响：N16 形态改写（删去阈值与体量目标，判据改为"内容是否被 build-plan 直接消费"）；精炼成败的唯一判据改为"不能丢清单逐项可定位且无二次失真"；本材料精炼的质量判据同步改写。
来源：宿主会话用户原话（现场更正）。
结论：①外置覆盖面扩到五类（事实表、更正、未确认项汇总、写集逐条对账、覆盖矩阵逐项结论），
精炼判据改为**内容判断**（build-plan 直接消费的留主文，过程与对账外置留指针）；**不设任何篇幅阈值或体量目标**（U-015），已有检查点**最多**把篇幅与结构占比作为**纯观察事实**记录
（不判定通过与否、不新增门与评分器）；②N17 按独立可交付、可验收划；③当场精炼本材料。
②N17 按独立可交付、可验收划；｜③当场精炼本材料｜原文指针：提问工具真实答复

完成判据：每次真实变更独立记录 U 编号、原文指针、处置和受影响决定；没有变更时写无。

## 工作包与决定

本节回答要交付什么、为什么这样做、失败后由谁处理。**结论**：四个工作包；主因判定＝"要求已读到却不交、且没有东西接住没交"。

- 工作包① 诊断（已完成，只读）：交付取证原件与合并诊断，消费者是工作包②③ 与用户判定。失败后：原件不可读或行号漂移时回会话日志重取；两路矛盾时另派独立裁决，不以其中一方为准。
- 工作包② 修复根因：交付 17 块具名修复（N1 到 N12、N14 到 N18；N13 取消、编号保留占位、不实施），消费者是下一个真实任务。硬约束＝不加新机制、新关卡、新账本。
  失败后：某模块若被证明会引入事实上的门或新账本，回退该模块并如实登记，不整体停摆。
- 工作包③ 复核跨阶段清单（即 N2）：用裁决后的正确判据重判第 6 路清单；仓库内写集为空，只产结论表；先复核、再开修。失败后：无法定论时只登记"未确认"，不改文本。
- 工作包④ 交付与验收：交付修好的仓库、材料与交接，消费者是用户，本任务内不自判修好。失败后：用户实跑仍复现同类问题时按新取证重开诊断，不辩解既有结论。

修订后大纲：诊断（只读）→ 复核与其他 stage（先复核判据）→ 修复根因（并入沉淀）→ 交付与验收。**推翻了什么**：初版把根因排成"投递缺口优先"；
九路取证与裁决后改为主因是"要求已读到却不交、且没有东西接住没交"，投递缺口降为并列项。


方向审查与对抗性方向检查只留结论：异源方向审查真实执行事实是 `status=available-with-failures`、
  `pair_status=partial`、两角色 incomplete、角色 `antigravity/flash` 两次均失败、
  运行时自报"无任何语义结果"却同时返回 11 条 findings，**不得记为审查通过**；
11 条发现处置为 accept 10、accept-with-modification 1、reject 0。
  对抗性检查出 17 条风险加 5 条 Kill 判据加 7 条 Recycle 判据；其中两条直接推翻本方向自己的前提（R6、R4），K4 部分触发属改修法而非停任务。逐条处置外置到 `direction-review-dispositions.md`。

完成判据：每个工作包有结果、消费者、来源、五字段决定与具名失败恢复路径；实际确认可从指针回读。
  N1 到 N15 中 14 块（不含已取消的 N13）的五字段全文只在 `module-decision-blocks.md` 出现一次，其它位置只出现编号；
  N16、N17、N18 源文件没有五字段块，只在 `## 模块清单` 与 U-014 出现。

### 模块决定全文（每块五字段；全文只在此出现一次，其它位置只出现编号）

#### N1 — 让已算出的校验结果被消费 ＋ 让阶段里声明的命令真的执行（只记录事实、不阻断）＋ 处理审查工具"自报与载荷矛盾"
**决定**：把已算出却被丢弃的校验结果接到边界**作为事实可读**（`tools/cli/stage-runtime.mjs:538-540` 之间插入只读事实块，并入 `:576-579` 的 `source`；`parsed.errors` 只作被审对象的事实，不参与任何分支判断）；把 Phase 卡里声明的 `RED/GREEN gate_cmd`／Phase 级 `gate_cmd` 用**已存在**的公共执行面 `stage-runtime --stage=build-code --action=verify`（内部 `capture-tests`）按字面逐条执行，回执落已有的 `quality/tests/`，汇总写进**已有**的 `evidence` 槽（形状由 `runtime/task/task-store.mjs:87` 强制），未执行写 `{value:null, reason:"<真实原因>"}`；并消除审查工具"自报与载荷矛盾"（`skills/wh-review/scripts/simple-review-runner.mjs:1882` 只改 `message`，按同载荷 findings 数量分叉，`code`／返回结构／`status` 判定不变）。**执行者＝build-code 中的测试子代理，不是运行时**（U-009②：平台不执行，运行时只提供已有的事实槽）。**只记录事实、不阻断**（U-005④：命令真执行，但非零退出／超时／取消／命令不存在一律如实登记，不算本步未完成）。同时对 5 个检查器逐项登记**"不接线＋理由"**（`runtime/evidence/acceptance-evidence-validator.mjs` 零 producer；`tools/cli/check-decision-log-chain.mjs` 恒 exit 0 是源码自述的刻意设计；`tools/cli/check-stage-quality.mjs` 扫 `metrics/`＋`scripts/` 是它的正确语义；`tools/cli/verify-structure.mjs:16` 旧阶段名与 `GLOSSARY.md:154` 的历史标签配对、实跑 exit 0 PASS；`tools/cli/run-checks.mjs` advisory 语义刻意）。｜
**为什么**：`stage-content-contracts.mjs:642-652` **已经算出** `ac_coverage`／`command_oracle_checks`／`fr_coverage`／`dependency_validation`，生产侧唯一消费者只取 `phase_rows[].write_set`（`stage-runtime.mjs:539`），其余只在测试里被读；`gate_cmd` 全仓只有 `stage-content-contracts.mjs` 的 8 处**文本判定**，从没有任何执行者；而执行面**早就存在**（`verify:execute` = `capture-tests`，`stage-runtime.mjs:1090-1106`，`:1102` 接受 `shell`／`command` 字面量）——缺的只是"一条让执行者去用的方法文本"。`facts.jsonl` 的 `evidence` 槽**生产侧零 writer**（唯一写方 `stage-runtime.mjs:866` 写 null），而 `task-store.mjs:87` **已定义它的形状** `[{command, exit_code, failure_signature}]`——落点早就存在，只是没人填。`workflows/verify-code/SKILL.md:18` 已明文"回执内的 `conclusion` 与 `coverage` 由 provider 状态与 findings 推导"，自报必须与载荷一致是**既有条款**，改动 3 只是把它在代码里兑现。｜
**否掉了什么**：① 新增检查器或新增命令（执行面已存在，新增属重复控制面，且会自然演变成一个"命令不过就红"的门）；② 把 `parsed.errors` 接进 `run-checks.mjs` 让校验失败进 failures（那会把 advisory 变成门，且触发面只有 build-code 单 Phase 审查，等于对别的阶段装作在检查）；③ 改 `REVIEW_NO_SEMANTIC_RESULT` 的 `code` 或新增 code（改公共失败码词表的代价远大于改一句 `message`）；④ 给 `material_coverage` 补非 antigravity provider 的 `read` 判定（门槛是刻意的 schema 约束——只有 antigravity 有 `packet_coverage`，补判定＝新观测机制）；⑤ "N1 全不接线、纯文档"（用户 U-005④ 已点名"真的执行"，且全不接则下一个任务的"没跑"依旧合法且不可见，F-47 的 74/74 Phase 都填了命令、大量填 `unavailable`）。｜
**后果与风险**：① `errors` 浮到审查材料后可能被当门用——唯一真门是 `:540` 的 `MATERIAL_INCOMPLETE`，该行为**不动**；只读块内首行写明"本块是事实，不是门"，并把"不改 `:540` 抛错条件、不改 `:539` 过滤行为"写成不可协商的实现约束。② `evidence` 槽被当"通过"读——句子必须含"不得用退出码 0 冒充已通过"，verify-code 侧继续按三类证据分开读，不新增消费口径。③ 外发材料变大触发 `MATERIAL_TOO_LARGE`（`simple-review-runner.mjs:1132` 已有映射）——对策是**截断**（`errors.slice(0, N)` ＋ `contract_error_count` 全量计数，块内注明截断）；`N` 取多少**未实测，列为未确认**，不写死。④ `failure_signature` 对退出码 0 语义不明（生产侧从未写过非空 `evidence`，无先例）——约定写 `"exit 0; no failing assertion"`，**不为此改 `task-store.mjs:87` 形状**。⑤ 越权／注入面——**没有新增执行面**（走已有 `capture-tests`，权限模型与现状相同；输入白名单 `argv/shell/command/slug/timeoutMs/timeout_ms/receipt_ref/output_ref`）；明文禁止"从 Phase 文本自动抓命令去跑"的自动解析。⑥ 改 `workflows/build-code/SKILL.md` 是否撞措辞锁——已核实测试锁的是两个**小节标题**与 verify-code 的既有短语，`:29` 追加句不碰锚点，且这些测试不在 `npm run check` 链上。⑦ `npm run check` 本身 exit 1（markdownlint 先失败），`test:contract`（`parsed.ok` 唯一读者所在测试）不在 check 链、仓库无 `.github/workflows`——改 `stage-runtime.mjs` 后**没有自动回归**，须在 spec 里写"改后显式跑 `npm run test:contract`"。｜
**影响面**：`workflows/build-code/SKILL.md`（`:29` 追加两句）、`tools/cli/stage-runtime.mjs`（`:538-540` 之间只插入只读事实块；**并在同一文件加入 `evidence` 槽的最小落盘逻辑**——把 `quality/tests/` 的真实执行回执映射到该阶段 stage 行，使 `:866` 写出的 `evidence.value` 不再是 `null`，形状沿用 `runtime/task/task-store.mjs:87` 已定义的 `[{command, exit_code, failure_signature}]`，写入者＝**build-code 中的测试子代理**执行命令后的回执，运行时只负责落盘）、`skills/wh-review/scripts/simple-review-runner.mjs`（`:1882` 只改 `message`）；**明确不动**（逐项带理由）：`runtime/evidence/acceptance-evidence-validator.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tools/cli/check-stage-quality.mjs`（`:179-182` 扫描面实测）、`tools/cli/verify-structure.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/task/task-store.mjs`、`workflows/build-code/steps.json`、`runtime/stage/stage-content-contracts.mjs`；`tools/cli/run-checks.mjs` **不在本节影响面**（父代理裁定：只留在写集表「明确不动＋理由」清单，不列进 N1 影响面）。

#### N2 — 用正确判据复核跨阶段清单
**决定**：复核对象＝`raw/06-cross-stage-defect-audit.md` 的七类命中 C1–C7 与其 §7 的"通病／特有"判定；正确判据＝`raw/09-criteria-adjudication.md` 的 U 口径（U1 判据不可执行／U2 已投递但窗口已过／U3 已投递但未执行／U4 同义形态存在）。**只产结论表，不改任何 stage 文本**——产出物写进 build-plan 的 `spec.md` 与对应 `phases/P<n>.md`。逐类给出「判据原文 `文件:行号` → U 口径复核 → 结论 ∈ {U1,U2,U3,U4,未确认} → 挂钩哪个 N 模块」，并产出两张表（成立的通病清单＋被误判清单）。已可先行落定：**C4 的判据被 `09` 明确推翻（U4）**——三个结构名是同义表达（`写集表`→模板 `## 要改哪些文件:71`、`模块清单`→`## 工作包与决定:55`、`未落项`→`:101`），且 `check-decision-log-chain.mjs:43` 的 `^#{3,4}` H3/H4 都收；**C1／C2／C3／C5／C6／C7 一律为"未确认"，不是"已推翻"也不是"已成立"**。**材料内部另有冲突待裁**：C 组报"引擎／DSL／数据库必须人工确认的原文与行号取不到"，而主会话 F-60 实测它在宿主项目 `PaperBuilder/AGENTS.md:10/:13`——**该冲突已裁，结论见 `## 冲突待裁` 第 2 条**（原文在宿主项目、与本任务写集无关，材料不引用其行号）。｜
**为什么**：第 6 路在五组里错四组——它以"结构名是否逐字出现"判定"验收对象不存在"，把同义表达当成不存在；而 `06` 的 C1–C7 与 `09` 裁决的五组**只部分重叠**（`09` 覆盖 C1 组 2 与 C4 的一部分），"推翻五组中四组"**不等于**"推翻 C1–C7 中四类"。照 `06` 开修会修错地方（C4），照它不修会漏掉真问题（其余六类未确认）。`decision-log.md:262` 已明文"先复核，再开修；不复核就不动其他 stage"。｜
**否掉了什么**：① 直接采纳"错四组"结论把 C4 划掉、其余带过（会把 C2／C3／C5／C6／C7 一起带过，而这六类恰好没有任何裁决处理过）；② 只复核 C4、其余保留 `06` 原判（`06` 七类共用一套无会话投递证据的取证方法，只修一类＝留下一个"已被证明有偏差的方法"继续给其余六类背书）；③ 把复核做成新的检查器／脚本自动扫 53 步（红线；且自动名称匹配只会**再犯 `06` 的错**）；④ 等 OI-001／OI-002 全定了再复核（OI-002 就是本模块要解的题，等它等于不做事）。｜
**后果与风险**：① 复核后通病若成立，修复面显著扩大——产出物**只给结论、不自动开修**，成立项按 `:262` 回头与用户再确认范围。② 复核本身可能被写成"通病不核完不许往下"的新门——产出物须写明"本表是事实，不是推进前置"；无法定论时按 `:264` **只登记"未确认"、不改文本**。③ 复核被读成站队（`09` 明确 A 与 B 各有对错）——每条结论必须**同时写"06 对的部分"与"06 错的部分"**（例：C4 的 grep 事实成立、归因不成立；C2 的引用事实成立、行号需更正、结论仍需投递证据）。④ 把 U3 当"执行者不努力"去改人——U3 的处置是"接住没交"（N5 的范围），N2 只负责**归因**。⑤ 行号漂移使结论不可核（本批已发现 `stage-handoff` 36→38、`stage-runtime` 529–541→533–545）——每条依据给**本次实测行号**并注明"以本次实测为准"，改文件前重新核一次。｜
**影响面**：**仓库内写集为空**（`—`）；只读复核 `workflows/{make-decision,build-plan,build-code,verify-code,build-prd}/SKILL.md`、`workflows/*/steps.json`（5 份）、`skills/stage-handoff/SKILL.md`（`:38` 只作证据引用）；产出物＝build-plan 的 `spec.md`／`phases/P<n>.md`。

#### N3 — 处理"幽灵义务"（无定义处却被当义务追着要）
**决定**：**删掉悬空名，对账落到现有小节**（U-008③ 三选一中的这一条：不在模板里正式定义它、也不什么都不改）。三处最小改动：① `workflows/make-decision/SKILL.md:41` **同一物理行内**把"模块清单／写集表／未落项"解析为模板真实节名（`## 工作包与决定`／`## 要改哪些文件`／覆盖矩阵「落点或缺口」栏或 `## 未决项`／`## 风险与延期交接`），该行其余文字一字不改；② `skills/decision-log/templates/decision-log-template.md:107` 完成判据句后追加穷尽义务（**保留原句逐字**）：本文其它节已登记的每个编号（R／U／发现编号／风险／OI）都必须在本矩阵出现一次并给出落点或缺口，未出现即为空白格；③ `skills/decision-log/SKILL.md:64` 追加**指向不定义**的一句（"没有落点"不另建节，按覆盖矩阵「落点或缺口」栏与 `## 未决项`「状态与处置」栏写）。`skills/decision-log/SKILL.md:34`「模板十二节」经核对为真（模板实测 12 个 `## `），**不改**。**不新增节、不新增列、不新增账本。**｜
**为什么**：`workflows/make-decision/SKILL.md:41` 判据点名的三个结构名全仓**只在该行自身命中**，第 9 路判其"判据不可执行"（该节只存在于上一轮任务自己的成品材料里，而上一轮落地决定明文"**不新增节**"，两处口径互相打架）；`docs/adr/0037:32` 逐字"当前十二节由 FR-QUAL-007 唯一决定"，且上一轮已把「未落项及理由」**并进** `## 验收面` 覆盖矩阵（`specs/archive/workflowhub-skill-quality-regression-20261010/decision-log.md:279`）——两条同向：该义务的既定形态是**覆盖矩阵的一个格子**，不是一个节。而"只删不承接"被 R14 否掉且事实成立（`raw/03:200-203` 的 7 条风险只处置 1 条、`raw/07` 的 19 条缺口、`raw/04:131-134` 的悬空 `V-013` 正是该义务要接的现象）。穷尽义务**不是新门**：它是完成判据的文本（模板 `:107` 本来就是完成判据行），仓库里没有任何校验器读 decision-log（实测 `runtime/stage/stage-content-contracts.mjs` 全文无 `验收面`／`覆盖矩阵` 命中）。｜
**否掉了什么**：① **在模板新增 `## 未落项与处置` 一节**（需翻转 `docs/adr/0037:32` 的 accepted 决定与 `de5fec9a` 的删除结论，并改 `skills/decision-log/SKILL.md:34/:35` 的"十二节／十二个具名接收件"计数，与"不加新机制、越简单越好"直接冲突）；② 只删不承接（名字删了现象仍在且再无对账位，与已 accept 的 R14 冲突）；③ 保留"未落项"一词再在别处加一行别名（会造出名字的第二个定义处，且 `workflows/make-decision/SKILL.md:32` 已明文"本入口不复述"——同一规则两个 writer，正是 N4 要修的形态）；④ 什么都不改、把"未落项"读成已由覆盖矩阵承接（判据的验收对象仍不可定位，下一位执行者仍会去"造"那一节）。｜
**后果与风险**：① 变成"多填一栏"的形式主义——缓解：不新增栏位，只在**已有**的「落点或缺口」栏上要求穷尽；填不满时**允许写"缺口"**，所以"填不出来"本身仍是合法输出，不逼人编。② 会不会引入新账本——**不会**：全部落点是 `decision-log.md` 现有节，无新建文件、无新 schema；`skills/decision-log/SKILL.md:64` 已明文"不建机器账本或推进门"，本改动不碰这句。③ 穷尽义务被读成门——只写进"完成判据"行，并保持既有的"写作指引，不是质量门"语境（`decision-log-template.md:6`、`skills/decision-log/SKILL.md:79` 均已声明）；不新增加任何 check。④ 矩阵膨胀——未处置项只需一行，事实栏可写"登记于 `## 未决项` OI-xxx"。⑤ 与 N4／N5 在同一段文本上叠字（同一物理行）——由本模块作**唯一 writer**，N4／N5 只交句稿、顺序为 N4 句 → N5 句（见写集表）。⑥ **落地顺序**：3-1／3-3（消歧与指针）可立刻做；3-2（穷尽义务）承载"对账位"的取舍，**建议等 OI-004 被用户确认后再落**；若用户选"定义一节"，3-2 作废并改走 ADR 翻转流程。｜
**影响面**：`workflows/make-decision/SKILL.md`（只在 `:41` 同一行）、`skills/decision-log/templates/decision-log-template.md`（只在 `:107`；`:101` 由 N4／N5 句稿并入，`:34` 计数不动、`:39-43`／`:103-105` 表头列不动）、`skills/decision-log/SKILL.md`（只在 `:64`；`:62` 由 N4 句稿并入）。

#### N4 — 编号／计数／引用的单一事实源 ＋ 需求遗漏签名
**决定**：**不新建编号权威**，只"确认权威已经存在、禁止再写第二处"，并把"漏一条需求"变成覆盖矩阵里的一个**空白格**。① `skills/decision-log/SKILL.md:62` 同一物理行追加计数/引用单一写者纪律：同一材料内**任何计数（模块数、条目数、行数、编号范围）与任何编号引用只写一次**，其它位置用编号或小节名引用；确需重述时必须写下出处；同一事实出现两个值即为缺陷。② `skills/spec-specify/SKILL.md:72` 行尾追加半句：**下游材料引用这些编号时不再复述位数规则**；出现 `FR-1` 与 `FR-001` 混用即为缺陷（**不复述**三位规则本身）。③ `skills/decision-log/templates/decision-log-template.md:101` 追加**需求遗漏签名**定义句：一条需求或一个发现编号若在本文任何位置出现、却在本矩阵没有对应行（或该行"落点或缺口"为空），即视为遗漏签名，**按缺口如实登记**——不是把它补成"已落"。④ `runtime/stage/stage-content-contracts.mjs:455,481,597,619` 的正则**不改**，登记"不处理＋理由"。**全程零新增字段、零新增文件、零新增校验器、零新增账本。**｜
**为什么**：现状**已经基本合规**——`ADR-NNN`／`D-NNN` 的权威在 `skills/decision-log/SKILL.md:76`＋机检 `check-decision-log-chain.mjs:17/:43`；`FR/AC` 恰好三位的权威在 `skills/spec-specify/SKILL.md:72`（同向复述 `spec-template.md:140`）；模板顶层节名与节数在 `skills/decision-log/SKILL.md:34`＋模板自身＋`docs/adr/0037:32`——缺的不是结构，是**穷尽义务**与"引用侧不得复述"。而"需求遗漏签名"用的就是**已有**的「落点」列（模板 `:39-43`）与覆盖矩阵「落点或缺口」栏（`:101-107`）；`raw/15:243`（D-08）要的签名＝"一条需求没有落点要能被发现"，这一格**已经存在**。第 1 版材料自身也犯了同一病（自称十模块却只给四个编号、两行串入被审计项目的 M13/M15），所以纪律必须落到现有材料。｜
**否掉了什么**：① 只写一句计数纪律、不做签名（`raw/03:91-94` 的"引用不存在的编号"与 `raw/03:88-89`、`raw/15:243` 的"需求没有落点"**不是计数问题**，一句纪律接不住；而签名本来就用现有格，成本≈0）；② 新增一个检查器扫"编号→落点"完整性（红线；且 `raw/15:322` 与 `F-38` 已证真正缺的是**接线**不是判据，新增只是第三个控制面）；③ 把编号形状定义搬进模板（`workflows/make-decision/SKILL.md:32` 已明文"本入口不复述"，模板再造一处＝第二权威，正是本模块要修的病）；④ 改 `stage-content-contracts.mjs` 的正则去掉 `\d{1,3}`（会改变 legacy 读入口径并构成新的失败面，属"引入会阻断推进的质量门"；`F-38` 已把它的真实影响定为"诊断降级"而非"绕过检查"）。｜
**后果与风险**：① 会不会变成新账本——**不会**（三处全是现有文件内的一句话）。② 计数纪律变成"每次都要标出处"的负担——措辞是"**只写一次**"（默认路径＝不复述），只有确需重述才写出处，**默认更省**。③ 签名被误当门——明写"按缺口**如实登记**"，而"缺口"是模板既有的合法取值（`:101`、`:107`），手上有出口就不会逼人编。④ 与 N3 在 `workflows/make-decision/SKILL.md:41` 双写——该行由 **N3 单一持有**，4-4 明确"不改此行"。⑤ `\d{1,3}` 遗留口径继续产出混用——已如实登记为"不处理＋理由"，**不假装修掉**。⑥ 编辑安全——若在用户实跑中被判"制造噪音"，回退 4-5 保留 4-1／4-2；若被读成"必须给每个数字标出处"导致材料变厚，把该误读作为下一轮候选反馈，**不在本任务内加解释性新节来救**。｜
**影响面**：`skills/spec-specify/SKILL.md`（只在 `:72`）、`skills/decision-log/SKILL.md`（`:62` 句稿，由 N3 并入）、`skills/decision-log/templates/decision-log-template.md`（`:101` 句稿，由 N3 并入，序在 N5 句之前）；**明确不动**：`runtime/stage/stage-content-contracts.mjs`（登记项）、`skills/spec-specify/templates/spec-template.md:140`（同向但不改）、`workflows/make-decision/SKILL.md:41`（N3 持有）。

#### N5 — 接住"没交" ＋ "登记了却没处置"的对账
**决定**：**在现有覆盖矩阵里加一个取值「已投递未执行」**（U-011③：用现有表加取值，**不加新字段、不新建表**），并在同处要求"**登记了却没处置的项必须以缺口出现一次**"。唯一文本落点是 `skills/decision-log/templates/decision-log-template.md:101`（覆盖矩阵引导句，位于 N4 的遗漏签名句**之前**）：矩阵每一行在写"已落某节"之前先确认该项**实际落地**；主张已执行但本文无对应条目的，写**"已投递未执行"**并给出它应落的小节；"登记为风险"不等于已处置——**登记了却没处置的项必须在本矩阵以"缺口"出现一次**。`workflows/make-decision/SKILL.md:41` 与 `skills/decision-log/SKILL.md:64` **不改**（各由 N3 的 3-1／3-3 覆盖同一义务的另一半；N5 只要求 3-1 的措辞保留"**发现编号**"这个对象，它已在该行原文里）。`tools/cli/check-decision-log-chain.mjs` **本任务不改**（改它＝动一个现有检查器的触发面与扫描对象，属改机制；且 `F-38` 已确认须连 `run-checks.mjs:143-147` 一起改才有效，那是 N1 的接线面），只**登记为未决项**。｜
**为什么**：第 9 路裁决五组中**四组是"要求已投递、也读懂，就是不交"**（U3）——这是**第一主因**，而第 1 版模块清单里**没有模块**承接它。这类缺陷**不能靠再加一条"要记得做"的句子修**：`决策:178`（对抗检查 R7）已实测"大白话"写进压缩摘要硬规则之后仍输出 50 条含 ≥3 个内部编号的面向用户文本；`raw/09:19` 更证明 grill 八键在 reasoning 里**写全了却不落盘**——"再说一遍要说"零增量。真实读者只有 `tools/cli/check-decision-log-chain.mjs`，而它只扫 repo 内 `specs/<task>/decision-log.md`（`:131-144`）、**扫不到任务库的日志**，且是 advisory only、恒 `exit_code: 0`（`:165`、`run-checks.mjs:143-147` 明文"not added to failures"）——所以本模块的可观察承诺只能是"矩阵里的一个取值 + 一个由用户当场数出的计数"。｜
**否掉了什么**：① 只加一句"没做要说"（R11 已证 `skills/stage-reflection/SKILL.md:45`、`workflows/make-decision/SKILL.md:22`、`steps.json` 第 15 步都已覆盖"不做要说"；card-05 的失败**不是"没说"**）；② 新增一个"未处置项"台账文件（直接违反"不加新账本"，且 `skills/decision-log/SKILL.md:64` 已明文"不建机器账本或推进门"）；③ 本任务就扩 `check-decision-log-chain.mjs` 去扫任务库并输出未处置计数（改机制，须先有真实需求与用户授权；先只登记）；④ 让覆盖矩阵成为门（矩阵为空即判完成不成立——违反"不引入会阻断推进的质量门"，模板 `:6` 与 `skills/decision-log/SKILL.md:79` 均已有"这是写作指引，不是质量门"）。｜
**后果与风险**：① **最大风险＝变成"多填一栏"的形式主义**——只要求矩阵里多一个取值（`已投递未执行`／`缺口`），不要求新表新字段；本模块**明确承认这个风险无法靠文本本身消除**，按 `:287` 保留为已知风险，由验收面在**下一次真实任务**里测量；若测出"填了但没减少漏处置"，该结论本身就是回退依据。② 会不会引入新账本——**不会**（零文件新增，`skills/decision-log/SKILL.md:64` 的"不建机器账本"句原样保留）。③ 与 N3／N4 在 `decision-log-template.md:101` 同一物理行叠字——三个模块的追加句必须**合并为一次编辑**，单一 writer ＝ N3。④ `已投递未执行` 被读成对上游审查的指控——取值只描述**本材料内的落地状态**，措辞已限定"主张已执行但本文无对应条目"。⑤ 不拦不卡是"纸老虎"——**承认**，这是 U-002 红线的必然结果；把可测的**计数**作为唯一信号，而不是"有没有写"。⑥ 若文本上互相吃掉（同一行替换事故，card-05 重复 4–6 次）——按 `skills/stage-handoff/SKILL.md:27` 失败隔离处置，回读小节标题是否仍在，**不**新建"编辑安全网"来兜（那是 N15）。⑦ **依赖修正**：材料主张**弱化 N5 对 N1 的依赖**（只有改走"扩 advisory 检查器扫描面"时 N1 才成为前置），此修正须由第 9 步确认。｜
**影响面**：`skills/decision-log/templates/decision-log-template.md`（`:101` 句稿，并入 N3 的 `:107` 同批编辑）；**明确不动**：`tools/cli/check-decision-log-chain.mjs`（登记项）、`skills/decision-log/SKILL.md:64`、`workflows/make-decision/SKILL.md:41`。

#### N6 — 修"条件读取不触发 ＋ 已读入正文活不过上下文压缩"
**决定**：让关键要求在**用到它的那一刻仍在眼前**。① `workflows/make-decision/SKILL.md:32` **去条件化**：把"发生需求变更并写 `## 需求变更记录` 时，读取并执行 `skills/decision-log/SKILL.md` 的「来源与未决问题写法」"改为"写 `## 需求变更记录` 或 `## 未决项` **之前**读取并执行…"；② 在调用点**原地保留三行最小指针**（U 一行＝编号＋变更与处置＋原文锚点＋受影响决定；OI 一行＝问题与来源＋状态与真实处置＋解决者下一步；coverage audit＝逐项有落点或有用户真实选择的排除理由），**权威仍在原 owner**；③ `:32` 末句之后新增一句，把 `skills/talk-with-zhipeng/SKILL.md` 的「### 2.1 大白话单轴决策卡」（`:69-84`）与「### 问答工具 IO 契约」（`:28-35`）从"只在 `skill-deps.yaml` 里声明"提到入口正文（**声明式通路才有执行者**）；④ `workflows/make-decision/steps.json` step 1 的 `observable_result` 末尾加一句可核对的披露口径（实际读取了哪两份、未读或读后未执行按未完成披露并给出真实路径）——**这是"披露"，不是门**（沿用现有 `observable_result` 写法，不新增字段、不新增 schema）。`workflows/make-decision/SKILL.md:42`（grill 是**无条件**"读取并执行全文"）**不改**，但 N6 的首选形态就是让 `:32` 与 `:42` **同形**。**本条只解决"投递到执行点"，不承诺"会做"**——执行者更正：真正跑测试的是 **build-code 中的测试子代理**（U-009②），本模块不涉及执行者变更。｜
**为什么**：唯一引入"条件读取"的提交是 card-05 会话**前一天**的重构（`e5f77e0e`，2026-10-10 17:01:44 `refactor: consolidate duplicate workflow methods`），且**同文件 `:42` 对 grill-with-docs 用的是无条件"读取全文"**——条件与无条件在同一文件里并列；实测条件**确实成立**（产物有 `## 需求变更记录`，全流该词 103 次）而 `skills/decision-log/SKILL.md` **零读取**、`skills/talk-with-zhipeng/SKILL.md` 路径全流 **0 次**。对照组：`workflows/build-plan` 的方法正文里有"结构化问答工具每题固定 question_id/axis/options"与"沟通默认简体中文、大白话、结论先行"，**且被读到** → 该会话面向用户消息中含 ≥3 个内部编号者 **0 条**。**真修的一半**＝去掉条件（消除"不触发"）；**只能缓解的一半**＝压缩淘汰无法根治——`cat workflows/make-decision/SKILL.md`（seq 68，7,690 B）落在 compaction #1 的 `shadowedRange {10..782}` 被淘汰，连**无条件被读**的 `grill-with-docs`（seq 1268）也被 compaction #2 淘汰，两份摘要对 `SKILL.md`／`skills/`／`来源与未决问题` 命中**均为 0**——所以形态从"读进脑子里的长文本"改成"**用到它的那一刻原地重取 ＋ 证据路径可回读**"。｜
**否掉了什么**：① **整份无条件读入两份正文**（`skills/decision-log/SKILL.md` 81 行＋`skills/talk-with-zhipeng/SKILL.md` 259 行，每次多 340 行常驻正文，**按实测仍会在下一次压缩中淘汰**——付出上下文成本却不改变结局）；② 只在 `:32` 内联三行形状、**不做任何读取**（会把 `decision-log/SKILL.md` 的权威**肢解成第二份规范**，违"同一事实只有一个值"，且与 `:32` 现文"本入口不复述"直接冲突；**采用其思想**：内联的三行只作指针锚并写明权威仍在原 owner）；③ 把两份正文**整段复制**进 `make-decision/SKILL.md`（复制即第二份来源；`talk-with-zhipeng` 设计为可搬运、可独立调用，复制会把它焊死在入口）；④ 修 `.codex/hooks.json` 让它注入方法正文（被删源码逐字自述 `Hook output is intentionally empty: no prompt injection`，它**从来不是方法正文投递通路**，且由 ADR-0024（accepted，2026-09-05）**主动删除**；修它＝恢复一个已废弃的宿主会话自动绑定）。｜
**后果与风险**：① 会不会变成事实上的门——**不会**（新增措辞只落在 `SKILL.md` 的读取指令与 `steps.json` 的 `observable_result` 两处非门位置；未新增校验器、未新增 exit code、未改 `run-checks`）。② 上下文成本——只把 `talk-with-zhipeng` 的两节与 `decision-log` 的「来源与未决问题写法」一节作调用点，不整份常驻。③ **"看得见≠会做"（R7 反证）**——`talk-with-zhipeng` 的"大白话"要求在 card-05 会话里命中 61 行（26 行是 assistant 消息），用户写进压缩摘要后仍输出 50 条含 ≥3 内部编号的文本；**本模块因此不宣称修好**，该反证由 N5 承接。④ **"进入上下文"口径未定（OI-001）**——本模块形态对"进入过上下文"与"执行该步时仍在窗口内"两种读法**都成立**，**不阻塞开工**；OI-001 保留 open。⑤ 旁证边界——第 11 路记"54 次 subagent 调用内部的读取未扫描"，故"零读取"的严格口径是"该会话本体（含其工具调用与结果）内"；即使某子代理读过，**入口正文仍没有指向它**，"条件读取不触发"的结论不变（该子代理范围本身列为**未确认**）。⑥ 读取后仍被压缩淘汰——若下一轮实测仍出现"指针被读到、条件满足、目标零读取"，**回退本模块并如实登记**，把证据退回工作包③复核，不带着假设加码。⑦ 只保留第①半与三行锚、撤回 `talk-with-zhipeng` 的"入口无条件读取"措辞（降为"第一次提问前读取该技能两节"）。⑧ 与 N5 的边界——N6 只写"读取事实可回读"，**不写任何产出义务**（产出义务归 N5）。｜
**影响面**：`workflows/make-decision/SKILL.md`（`:32` 去条件化＋原地三行锚＋新增 talk-with-zhipeng 读取句）、`workflows/make-decision/steps.json`（step 1 `observable_result`）；**明确不动**：`workflows/make-decision/SKILL.md:42`、五个 `workflows/*/skill-deps.yaml`、`.codex/hooks.json`。

#### N7 — 复盘沉淀落点（阶段末未做必须留一句；问题按归属分流回流）
**决定**：① `skills/stage-handoff/SKILL.md` 的 `## 结束条件与边界`（`:44`）之后、`## 写作规范`（`:50`）之前**新增一句**（不是新节、不是新字段、不是新表）：阶段收口时，本任务真实 stage 末的 stage-reflection **若未执行，交接必须写明"本轮未执行"＋一句真实原因**（例如 stage 仍未结束／缺会话来源）；未写明即交接的披露不完整，按 `## 回读结果`（`:36-42`）的 incomplete 处理，**不新增字段或机器校验**。② `skills/stage-reflection/SKILL.md:15`（`## 方法` 第 3 条末）加一句：未执行时**同样要说明未执行**，本任务的实际交接件是这条说明的落点。③ `skills/stage-reflection/SKILL.md:24`（`## 用户选择后的归口` 的「判断待办」段末）加**回流动作**：**按归属分流**——**别的项目的问题记录在别的项目里，workflowhub 的问题记录在 workflowhub 的根目录**（U-008② 用户自定义口径）；若过程问题的承载物是工具仓库本身（例如在宿主项目里用 workflowhub 的方法/工具时发现缺陷），或目标项目根没有 `Improvements.md`，则把**同一批**未解待办写进工具仓库根的 `Improvements.md`，每项写问题、来源路径（含宿主任务 id 与阶段）与真实选择/未解状态；**该文件不新增第二份清单、不新增字段**。`Improvements.md:5` 的"未写入任何问题条目"**不改**（状态自述，由下一真实任务就地追加）。五个 `workflows/*/steps.json` 的 stage-handoff 尾句**不改**（避免五文件大面积触碰）。**OI-003 的裁决（本模块给出）**：回流承载位置＝**沿用 `Improvements.md`（工具仓库根）＋ `skills/stage-reflection/SKILL.md` 的「用户选择后的归口」**——不新建位置、不新建文件；这是**既有落点的具名化**，不是新增承载物。｜
**为什么**：五个 workflow 的 `steps.json` 的 stage-handoff 步骤 `observable_result` **逐字相同**（`make-decision/steps.json:178`、`build-plan:141`、`build-code:149`、`verify-code:97`、`build-prd:67`），共同尾句只覆盖"**做了之后**"（"可按 stage-reflection 提有源候选…不新增规范/知识库/机器进度或每 Phase 固定复盘"），**没有"没做"这一支**；而"未执行"这句话在最新两版 build-plan 交接（006／`2026-10-12-001`）与 make-decision 的 `handoff.md` 里**消失了**（0 命中）。第二个候选被否是因为该文件 31 行、通篇 **0 次**出现 `reflection`／`复盘`／`沉淀`／`Improvements`；第三个候选（独立明确动作）触碰红线，且用户上一轮已明确定过"不做每 Phase 固定复盘"。`Improvements.md:3` 逐字指向 `skills/stage-reflection/SKILL.md`，而五个 workflow 的调用点**已经逐字引用该节**——零新文件、零新字段、零新引用。｜
**否掉了什么**：① 只在五个 `workflows/*/SKILL.md` 的阶段末段各加一句"没做要留一句"（五处重复＝五个维护点，且其中两处已是"可跳过并说明原因"的措辞，再叠加只会互相解释；**改一处 `stage-handoff` 技能＝五个阶段同时生效**）；② 只做回流、不做"没做要留一句"（"没做"仍会被静默吞掉，正是 R-005 的现象）；③ 撤回回流、维持"目标项目根"单一口径（U-003② 明确选了"给它落点，并补一条明确动作让问题能回流 workflowhub"；实测 workflowhub 侧 `Improvements.md` **自述 0 条**、非归档区 0 处提到 card-05）；④ 在 `run-checks` 或 `stage-content-contracts.mjs` 里校验交接件含 reflection 字样（违反"记录事实而非阻断"与"不加新关卡"；改用既有 incomplete 口径承接）；⑤ 放**总纲** `docs/standard-workflow.md`（该文件通篇 0 次谈这件事，加它＝新开一块"沉淀规范"）。｜
**后果与风险**：① 会不会变成事实上的门——**不会，但最接近门**。这句实际效果是"要么做、要么说明"，是**披露义务**（与 `stage-reflection/SKILL.md:9`「不是…门」、`:45`「可跳过并如实说明」同族），且**没有任何机器读取它**；边界必须写死：**只能被回读结果判为 `incomplete`，不得写成 failed、不得阻止同任务继续修复、不得进入任何 `run-checks` 断言**——这一点须在 N1 的接线范围复核（OI-005）时一并确认"不接"。② **退化为形式主义的一句话（本模块最大风险）**——要求写"一句真实原因"，落点选在已有四类信息表的同一份文件里（`stage-handoff/SKILL.md:29-34`），使它与"未完成"类信息同处一表；若下一轮连续 ≥3 个阶段的理由逐字重复，**收窄为"仅在 stage 真的结束时需要说明"**并登记该现象，**不加码**。③ 回流变负担——必须在文本里**限定触发条件**（"承载物是工具仓库本身"或"目标项目根没有 Improvements.md"），**不得**写成"每任务必须写"；card-09 曾做出真实复盘而其自述"No skill, project rule, check, or Improvements.md was changed／No user choice was made"，即**做了复盘也不必然产生待办**，不能被改写成"必须产出条目"。④ "载具越界"——条目**只写问题、来源路径、真实选择/未解状态**，不复制宿主材料正文；该文件自述"不是规范或知识库"。⑤ 已写成门（有人把它接进 `run-checks`）——回退该条并如实登记，不整体停摆。⑥ 回流条目引发口径冲突——保留宿主项目根清单原状，冲突项写"与宿主解读不一致"并给双方来源路径，**不擅自合并**。⑦ **落地顺序：先做第一半（"没做要留一句"）**（有 5 处现成声明可对照，是可对照的回归），第二半（回流）在第一半稳定后落。｜
**影响面**：`skills/stage-handoff/SKILL.md`（`:44-49` 段内新增一句；`## 回读结果` 的既有判定语义不动）、`skills/stage-reflection/SKILL.md`（`:15` 未执行披露、`:24` 回流动作）；**明确不动**：五个 `workflows/*/steps.json`、`Improvements.md:5`、`docs/standard-workflow.md`。

#### N8 — 让"测试标准"在 make-decision 与 build-plan 成为真义务
**决定**：**测试层级不写死**（U-009① 原话：不同项目不同任务的层级完全不同，workflowhub 就完全不涉及代码、接口、UI、浏览器，所以**不应该写死，应该每个项目每个任务每个 phase 自己定**）；**只要求每个任务、每张 Phase 卡自己声明"这次测哪些面 ＋ 每面测或不测的理由"，并为每个要测的面配一条可执行命令**；**工具仓库不给任何清单、也不检查清单内容**（U-010①）。**测试面是否合适的自查前移到 build-plan 审查**（U-012⑤，用户裁定）：**build-plan 审查每张 Phase 卡时必须先自查"本次声明的测试面是否合适"**（对照该任务自己声明的面与该 Phase 声明写集），自查结论写进 build-plan 产出物；**verify-code 只作二级核对、不复述该自查**。落点：① `skills/spec-plan/templates/phase-template.md:203`（字段说明表行）与 `:249`（Task 卡填空行）**两处必须同时改**——把「测试层级 / 技能」的取值域由路由档位 `simple|feature|fullstack` 改为**声明式的面**（示例锚 `unit | api | contract | component | ui | browser-e2e`，**只是示例、不是工具仓库下发的清单**），允许多选，保留"恰好一条 `RED/GREEN gate_cmd`"的既有约束；② `:132`「测试策略」填空说明改为**可核对的形态**：逐面写"适用／不适用＋理由"；改动面涉及浏览器可见行为时未列浏览器面**必须给具名理由**（复用现有 `N/A — 理由` 形状，**不加新字段、不加新枚举**）；③ `:208-212` 在已有字段上加**一行注记**（不新增字段）：判定器编号必须与同一张卡的 `gate_cmd` 成对；一条 AC 只有产品级判据而没有任何可执行命令时该 AC 的 `Done` 不得记达成；④ `skills/spec-plan/SKILL.md:49-57` 的 `tier` 语义随枚举改写，并在 `:53` 后新增职责句「**层级在 build-plan 定，命令在 Phase 定，执行事实在 build-code 产生**；三层对应关系由本节枚举唯一给出，不在 `spec.md` 复制第二份层级表」；⑤ `skills/spec-plan/SKILL.md:65-71` 的 index 完成判据加一句"最后一行必须指向末 Phase，且该 Phase 的契约头列出全部 AC，不满足时如实写缺口，不生成 fallback 行"；⑥ `skills/spec-specify/SKILL.md:18-20` 把 `test standard` 面的内容义务写清（必须写明**面与 oracle**；每条 AC 的验证面必须指向一个在该 Phase 可执行的命令，**命令本体在 Phase，不在 AC 复制**）；⑦ `skills/spec-specify/templates/spec-template.md:218-223`「## 测试标准」加一句：按面写哪些面适用、用什么 oracle、证据类型、覆盖边界，不适用面写 `N/A — 理由`，且与 `phase-template.md:249` 的声明**同一份**、不另立第二份表；⑧ `skills/test-routing-advisor/SKILL.md:16-18` **接消费者**：让它的输出语义对齐到"该改动面应当覆盖哪些面"（**文本层对齐，不新增机器消费者**，不是必填字段、不是门、不阻断推进）；⑨ `workflows/make-decision/SKILL.md:29` 把"测试记录与实测记录"从十类排除项中拆出，改写为"过去的测试记录与实测记录（引擎、口径与**要求哪些面**可问，属方向问题）"——**make-decision 可以问"这个任务要覆盖哪些面"**；⑩ `workflows/build-plan/SKILL.md:21` 加"声明来源指向 `phase-template.md:249`"一句。`runtime/stage/stage-content-contracts.mjs:470-479` **不改**（该函数已算出结果，接线归 N1）。｜
**为什么**：第 16 路实测"完整测试在设计上从未成为义务"——全仓唯一的"测试层级"槽（`phase-template.md:203`＋`spec-plan/SKILL.md:55`）取值域是**路由档位**而非测试面；`stage-content-contracts.mjs:470-478` 只校验该字段**非空非占位**，不校验取值、不对账技能名；`grep routing_tier` 在 `runtime/ tools/ workflows/ config/` **零命中**（机制产出但**无消费者**）；`workflows/make-decision/SKILL.md:29` 明文把"测试记录与实测记录"排除在规划提问域外；spec 的「测试标准」节只要求 oracle／证据类型／覆盖边界，**不要层级**；`全局验证策略` 是唯一被机器要求写命令的全局节但**不要求分层**。所以层级不是"要求了没执行"，而是**从未被要求**。U-006 已把口径定死：完整测试＝**代码、接口、UI、浏览器端到端**，标准在 make-decision 与 build-plan 定、在 build-code 执行；U-009① 又把它限定为"**面由项目自己声明**"。｜
**否掉了什么**：① 不改枚举、只在 `:132` 加一句"要写上测试层级"并新增"UI 适用时必须含浏览器层"（`:203` 的取值域仍写着路由档位，模板会**自己打架**；且取值不被校验也不被消费，**不加枚举，层级永远只是自由文本**）；② 让 `routing_tier` 新增机器消费者（写进 Task 卡字段值＝把一个纯判类技能的输出变成**必填字段**，会被 `stage-content-contracts.mjs:470-479` 判定 → **事实上加了一个新的必填槽**，触碰红线）；③ 把「测试层级 / 技能」字段**拆成两个字段**（改 17 必填字段清单＝改机器契约，会连带 `tests/contract/**` 与 N4 的字段计数，收益仅是命名整洁）；④ 把面与命令写进 AC（`skills/spec-specify/SKILL.md:49-50` 逐字"`证据：` 只声明证据类型……verify-code supplies execution facts"，`:94`"Phase files own exact gate commands"——把命令写进 AC＝与 Phase 形成第二处命令来源，违"同一事实只有一个值"；**采用"AC 指向命令"而非"AC 携带命令"**）；⑤ 由工具仓库下发层级清单并在流程里检查清单内容（U-010① 明确**不给清单、也不检查清单内容**）。｜
**后果与风险**：① **会不会变成事实上的门——本模块第一位风险，必须写死边界**。`stage-content-contracts.mjs:470-479` 是**已有**校验，本模块**不改它**；它的结果今天在 `stage-runtime.mjs:538-539` 被丢弃，N1 负责接到边界**作为事实可读**——**N1 的接线范围（OI-005）必须包含一条明示："层级/命令字段的校验结果只作事实浮现，不作 Phase 推进前置"**；若不写这条，新枚举会经由 N1 的接线变成事实上的门。这是 N8 对 N1 的唯一硬要求。② 牵连所有下游材料——枚举改变会让已有历史 Phase 材料在"新枚举"下读起来"不合法"；**处置：文本层只写"新写材料按新声明"；不追改历史材料**（范围与非目标明文"不改 `specs/archive/**` 与历史任务材料"）；**校验器不改**，故历史材料不会突然报错——这是"不改校验器"的第二个理由。③ "面不适用"仍是口子——`N/A — 理由` 形态保留（改成"具名理由"是唯一加的约束）；**不假装堵死**：真正的堵法在 N9（逐面具名＋必须有真实 origin）与 N10（逐 phase 核对）。④ 覆盖面扩大＝执行压力前移——只要求**面与理由**，不要求 build-plan 去跑任何测试。⑤ `simple|feature|fullstack` 的既有读者零命中，故把该方案从"必填字段取值域"降为"技能输出语义"**不打断任何机器通路**。⑥ 回退路径：若真实任务里没人按面写（仍是自由文本），**回退到"加一条逐面填空模板"**（把"要写什么"变成填空），**不回退声明本身**；若历史材料/契约测试因变化报错，立刻检查是否有人偷偷改了校验器，**发现即回退该改动并如实登记**；若 N1 坚持把 `command_oracle_checks.valid` 作推进依据，**N8 撤回"命令成对"那一句，保留声明要求**。⑦ 两处已知事实更正：`## 测试标准` 在 `skills/spec-specify/templates/spec-template.md:218`（**不是** `spec-plan/SKILL.md:55`）；`测试层级 / 技能` 有 `:203` 与 `:249` **两处**，改一处不够（漏改会产生"模板自相矛盾"，正是 card-05 build-plan 的自相矛盾类缺陷）。｜
**影响面**：`skills/spec-plan/templates/phase-template.md`（`:203`＋`:249`＋`:132`＋`:208-212`；本文件建议 **N8 持笔**）、`skills/spec-plan/SKILL.md`（`:49-57`＋`:65-71`）、`skills/spec-specify/SKILL.md`（`:18-20`；与 N15 的 `:140-158` **按节切分**）、`skills/spec-specify/templates/spec-template.md`（`:218-223`）、`skills/test-routing-advisor/SKILL.md`（`:16-18`／`:22-41`）、`workflows/make-decision/SKILL.md`（`:29`；同文件 N6 持 `:32`）、`workflows/build-plan/SKILL.md`（`:21`；owner 待裁）；**明确不动**：`runtime/stage/stage-content-contracts.mjs`、`tools/cli/run-checks.mjs`。

#### N9 — 让 build-code 按标准执行
**决定**：**由 build-code 中的测试子代理按已声明的面真跑**（U-009②：执行者是 build-code 的测试子代理，**不是运行时**），逐面留执行事实、堵两个逃逸口，并去掉通用指令里的本仓历史脚本路径。落点：① `workflows/build-code/skill-deps.yaml` 的 `skills:` 段新增 `isolated-browser-qa`（`path: skills/isolated-browser-qa/SKILL.md`，`trigger: actual_ui_or_browser_e2e_tier`）；② `workflows/verify-code/skill-deps.yaml` 同步新增同一条（`trigger: ui_acceptance_browser_fact_check`）；③ `skills/catalog.yaml:807` 的 `used_by_stages: []` 改为 `[build-code, verify-code]`（依据：`check-skill-consistency.mjs:109-116` 的反向核对只把 `used_by_stages` 与"实际被声明的阶段"比对，**结果进 `reports` 不进 `failures`**——修正后该报告行消失，`npm run check` 仍 PASS）；④ `workflows/build-code/SKILL.md:29` 加"**声明的面逐面真跑**"：每一面要么留下一条真实执行原件（原命令／cwd／argv／exit／原始输出，用 `runtime/interface/run-command.mjs`），要么在下一句的"逐面具名"里给出该面为何没跑；**只跑受影响面**，不用无范围全量回归代替（沿用 `:29` 既有纪律）；⑤ `:30-31` **堵逃逸口①**：词表不变，但**写 `unavailable` / `incomplete` 时必须写清三件——哪一面、卡在哪（缺浏览器可执行文件／缺服务／缺凭据／缺入口）、什么条件下可跑**；只写"没跑"不算记录（U-010②：**没跑要写清哪一面／卡在哪／什么条件下能跑**）；⑥ `:32` **堵逃逸口②**：当本 Phase 改动面涉及浏览器可见行为时，本步必须实际执行 `skills/isolated-browser-qa/SKILL.md` 并把执行原件（engine、route/场景、截图路径或真实 `not_observed` 理由、命令/输出/exit）留在原 ref；`N/A — 理由` 只在**该 Phase 的声明写集不含任何浏览器可见面**时可用，且理由必须点明判断依据（**判据＝声明写集，不是执行者的感觉**）；⑦ `:36-37` **去硬编码**：`:37` 写死的 `node tests/acceptance/card-09-session-ledger.mjs`（workflowhub 本仓历史 card-09 脚本，任何宿主项目都不存在该路径，与 `AGENTS.md`「技能应可独立调用、可搬运，不绑死单一宿主环境」直接冲突）改为通用说法"跑本项目根实际存在的验收脚本或本 Phase 声明的聚合命令，本项目根没有可跑的对应脚本时如实记 `unavailable` 与其原因，**不得写死任何具体仓的历史脚本路径**"；⑧ `workflows/build-code/steps.json` step 5／6 把上述落到 `observable_result`（不新增字段）；⑨ `workflows/verify-code/SKILL.md:22` 的同一句硬编码按通用化改写（**N9 主动让出该文件**，`:22` 的改写并入 N10 的编辑，两者相邻、同一步；N9 只提供逐字替换串）。`skills/isolated-browser-qa/SKILL.md` **不改**（`:246`「Do not claim browser verification without running it.」、`:227` 不得把缺失写成 pass、`:221-229` Output Contract 已具备正确语义）。**"进依赖清单"与"明确退役"二选一 → 选进依赖清单**（该技能是本仓唯一真 E2E 层；执行能力已被证明存在：card-02 真跑 Playwright 16 个 `.last-run.json`（4 passed／12 failed）、card-05 五次带浏览器启动的 pytest＋`card05-ui-preview`（103 次 CLI／14 图／exit 0）、card-06 37 条 receipt 命名 7 个 `*.agent-browser.mjs`——**跑得起来、只是没有义务**）。同时把孤儿旧副本 `workflows/verify-code/isolated-browser-qa.md`（264 行，其机器通路 `browser-qa-evidence.v1`／`l3-e2e-report.json` **已从 runtime 整体移除**）**纳入退役登记建议**（登记动作，不是删除动作；真实删除需用户授权）。｜
**为什么**："浏览器端到端必须执行"全仓**零命中**——最接近的 `build-code:32` 反面后果只是"不宣称 UI 完成"，而 `unavailable` 是 8 值词表的**合法值**（card-02 26/38、card-03 36/40 都填 `unavailable`）；`:32` **逐字引用**了 `skills/isolated-browser-qa/SKILL.md`，而该技能**不在** build-code／verify-code 的 `skill-deps.yaml`，`skills/catalog.yaml:807` 的 `used_by_stages: []`，且 `check-skill-consistency.mjs` 是**单向核对、发现不了**"正文引用了但没声明"。声明是把"引用了"变成"被声明了"的最小动作。｜
**否掉了什么**：① 只在 `:32` 加"必须执行"、不碰 `skill-deps.yaml`（加形容词只让"引用了未声明技能"这一不一致继续存在）；② 只把 `card-09-session-ledger.mjs` 删掉、不补通用说法（删后"对账"这一步就没有载体，既有义务会出现空洞）；③ 把 `isolated-browser-qa` 从 `skills/` 退役、浏览器 E2E 定义为"不做"（与用户原始需求"**包括浏览器端到端测试**"直接冲突，且实测能力可用、历史已真跑，退役＝缩小需求）；④ 给 build-code 加 `runtime_capabilities` 的 `browser-cli`（该探测只回答"有没有可执行的 agent-browser"，**不加载方法正文、不产生测试义务**；verify-code 已有且 `absence_semantics` 是 `diagnostic`，在 build-code 再加一份属**重复控制面**）；⑤ 把声明清单复制进 `build-code/SKILL.md` 的 step 4（会与 `phase-template.md:249` 形成第二份表；**折中：step 4 只写"按该处声明逐面核对"，指路不复述**）。｜
**后果与风险**：① 会不会变成事实上的门——**不会**（只改声明与措辞，没有一处被机器读作推进前置）；**但一条必须写死**："跑浏览器 E2E"若被某宿主做成 `required_when` 必需能力就会变成门，**本模块明文不加 `runtime_capabilities` 条目**，把风险关在源头。② 执行面扩大——逐面真跑会显著增加 build-code 时长（card-05 的 `card05-ui-preview` 一次 103 次 CLI／14 张 PNG／exit 0）；缓解＝同时写"**只跑受影响面**"。③ **如何区分"该面不适用"与"没跑"——唯一技术难点，判据＝该 Phase 的声明写集**（模板 `:35`，精确路径）：写集含前端入口/路由/组件/页面 → 浏览器面适用；不含 → 不适用；与 `build-code/SKILL.md:21` 的"允许写集"同源，这一条同时是 N10 逐 phase 核对的判据。④ `N/A — 理由` 与 `unavailable` **都只是部分堵住**（堵的是"无理由的 N/A"和"只写没跑的 unavailable"，**不是**"有理由的 N/A"和合法 `unavailable`）；本模块**不承诺**那两组比例下降——N10 的逐 phase 核对才是让它"可见"的手段。⑤ 进依赖清单后 `npm run check` 变红的风险——`check-skill-consistency.mjs:44-61` 会校验 `name/path/catalog` 与 `skill-bundle.json`；若 `skills/isolated-browser-qa/skill-bundle.json` 有未登记静态依赖会 FAIL（**该 bundle 内容未读，列为未确认**）；恢复＝先修 bundle 登记，修不动就**回退声明**、只保留 `catalog.yaml:807` 修正，并把"技能未声明"如实登记为已知缺口。⑥ 浏览器面真跑不了——按 `:31` 记 `unavailable` 并逐面具名，**不改文本去迁就环境**，不把缺失写成 pass。⑦ 逐面真跑把阶段拖爆——收窄为"每个 Phase 至少一面真跑＋其余面具名"，与 N8 的声明要求不冲突。⑧ 孤儿副本退役若未获授权——保留原状，只在退役登记记一行"建议退役、未获授权"（照完成判据"没有真实授权不声称已批准删除"）。⑨ 本模块自拟的 `trigger` 名称**无既有命名惯例可对照**，列为未确认。｜
**影响面**：`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`skills/catalog.yaml`（`:807`）、`workflows/build-code/SKILL.md`（`:29`／`:30-31`／`:32`／`:36-37`）、`workflows/build-code/steps.json`（step 5／6）、`workflows/verify-code/SKILL.md`（`:22`，**让出**，并入 N10）；**建议退役登记（不删除）**：`workflows/verify-code/isolated-browser-qa.md`；**明确不动**：`skills/isolated-browser-qa/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`tools/cli/check-skill-consistency.mjs`。

#### N10 — 末 Phase ＝ 整任务端到端验收成为义务 ＋ verify-code 逐 phase 核对测试执行
**决定**：**两个半一起做**。**C12 裁决（U-012⑤）**：**"该测的面漏了没"不由 verify-code 才发现**——**build-plan 审查时就要自查每个 phase 的测试面是否合适**；verify-code 的逐 phase 核对表降为**二级**、不复述自查。**适用范围限制（U-009①，必读）**：该义务**仅当任务含可执行产物时必选**；纯文档／工作流规范类任务**允许在 Phase 契约里声明豁免并给出具名理由**——不得写死层级。**① 生产侧——末 Phase 的端到端验收成为义务**：`skills/spec-plan/SKILL.md:49-57`（`:53` 之后）新增义务句「本任务必须有一个末 Phase 作为**整任务端到端验收 Phase**：它排在最后、契约头 `覆盖 AC` 列出**全部** AC、`Done` 逐条给 AC 编号＋档位＋一条具名证据路径，`phase-template.md:222-238` 的固定小节按原样填写；**它不是新 stage、不是新 gate、不新增校验器**」；`skills/spec-plan/SKILL.md:65-71` 的 index 完成判据加"最后一行必须指向该末 Phase，不满足时如实写缺口、不生成 fallback 行"；`skills/spec-plan/templates/phase-template.md:222-238` 的 `:224` 加一句"本小节**必须被使用一次**：全任务恰有一个末 Phase 是验收 Phase"，**`:224` 的"不加校验器"自述保留**（这是它不变成门的保证）；`workflows/build-plan/SKILL.md:21` 加一句"本任务末 Phase 必须是覆盖全部 AC 的整任务端到端验收 Phase"；`runtime/stage/stage-content-contracts.mjs:611-613` **不加校验**。**② 审计侧——verify-code 从抽样改为逐 phase 核对测试执行**：`workflows/verify-code/SKILL.md:18` 保留"按风险**独立选样**"用于业务/代码复核（`business_effect`、`code_review` 两栏不动），**新增穷尽义务**「**测试执行逐 phase 核对（穷尽，不抽样）**：对每个 Phase，读它声明的面与 `RED/GREEN gate_cmd`，在 `quality/tests/` 里**找它是否真跑过**，逐 phase 写一行：`Phase | 声明的面 | 找到的执行原件(路径+exit) | 未跑/未取证的面与理由`；**只读现有原件、不重跑**（`:20`"不重做全量上游测试"逐字保留）；核对结果一致时一行带过、不逐 phase 复制原件正文；`semantic_test_adequacy` 的判定**从这一张核对表来**」；`workflows/verify-code/steps.json` step 4 的 `observable_result` 加"逐 phase 测试执行核对表可读、未跑面与理由逐项列出"（不新增字段）；`workflows/verify-code/SKILL.md:20` 保留"不重做全量上游测试"并**加一句消歧义**（逐 phase 核对是**读**既有原件，不构成重跑）；`:22` 去硬编码（N9 供串）＋加"给人读结论时逐 phase 核对表是测试充分性结论的具名依据，`unavailable` 逐面列出并给理由与承接人，**不写成 pass**"。`runtime/stage/stage-content-contracts.mjs:650`／`:652` 的 `ac_coverage`／`command_oracle_checks` **不改**（消费者接线归 N1，属加分项）。｜
**为什么**：第 14 路实测——「末 Phase ＝ 整任务端到端验收」**在 workflowhub 里根本不是一条义务**：`workflows/build-plan/SKILL.md` 全文零次出现"验收 Phase"、校验器零校验，只有 `skills/spec-plan/templates/phase-template.md:222-238` 一份"**如果存在**验收 Phase 该怎么写"的格式规范（且 `:224` 自我声明"不新增 stage／gate／审查点／schema／校验器"），而 `workflows/verify-code/SKILL.md:18` **假设它存在** → **消费者假设、生产者无义务**。又：verify-code 被设计成**抽样审计**（`:18`"独立选样；逐项列已抽查与未抽查"、`:20`"不重做全量上游测试"），且校验结果在机制层被丢弃 → **缺口从未被任何门禁看到，是结构性的，不是某次疏忽**。卡-05 的"末 Phase"P27 是 G2 汇聚结算、真正的整卡端到端在 P25/P26，**这正是本模块要修的**。74 个 Phase 中**零条**以"本 Phase 的 gate_cmd 是否执行"为对象。｜
**否掉了什么**：① 只把 `semantic_test_adequacy` 改成**逐 phase**给值（它是**任务级三值**，改成分 phase 给它＝**新增一个分 phase 的判定槽**，比"逐 phase 一行核对表"更像新对象；**采用"核对表 ＋ 任务级判定由表推导"**）；② 在 `stage-content-contracts.mjs` 加"必须存在验收 Phase 且覆盖全部 AC"的机器校验（`phase-template.md:224` 自述"不新增…校验器"；加校验＝`parsed.errors` 增长 → N1 接线 → **事实上的门**）；③ 让 verify-code **重跑**每个 phase 的 gate_cmd（与 `:20` 直接冲突，且工作量与时长失控）；④ 只让末 Phase 核对全部 AC、不做逐 phase 核对（会把"每个 phase 的面跑没跑"整体漏掉——正是 R-015 抱怨的缺口；**末 Phase 义务与逐 phase 核对都要，两者互不替代**）；⑤ 用 `phases/index-template.md` 承载末 Phase 义务（index 是**可再生导航**、`spec-plan/SKILL.md:69` 逐字"不承载完成权威"；**采用"义务写在 `spec-plan/SKILL.md` 的 Test design 节，index 只承接一致性判据"**）。｜
**后果与风险**：① **"会不会变成事实上的门"——本模块是五个里张力最大的一个**。末 Phase 义务只写在 `skills/spec-plan/SKILL.md` 与 `phase-template.md:222-238`，**不进 `stage-content-contracts.mjs`**，因此"没有验收 Phase"**不会**让任何命令变红，只会让 verify-code 的核对表末行**没有对象**（可见、可披露）——这是刻意的：把义务做成事实而不是闸门。逐 phase 核对只写在 `verify-code/SKILL.md:18` 与 `steps.json`；`verify-code:22` 已逐字写"incomplete 只限制质量声明，**不限制同一 task 继续修复**"，核对表给出 `inadequate` 时**任务不会被冻结**——这一句必须在改动后**逐字仍在**（写进 AC）。② **verify-code 工作量会显著上升，但可控且可用数字说清**：核对表 ＝ **每 Phase 一行**（不是每 Task、不是每层一行），历史规模参照 card-05 27 个 Phase、card-08 8 个、card-03 6 个（即 6–27 行表）；成本主要是**读** `quality/tests/`（card-05 558 个文件／card-03 1989 个／card-08 2768 个）——**这是真实成本，必须承认**；三重约束写进文本：**只读不重跑**、**一致时一行带过**（"每类事实只留一份原始件"）、按 Phase 的 `base_head` 与文件时间窗**粗筛**；**上限口径**："核对到能判真假即可；找不到对应原件时写'未取证'并给出搜索范围（命令＋目录），**不穷举目录**"。③ 历史 74 个 Phase 的存量**不追改**，历史缺口只在下一任务的核对表里以"未取证"出现，**不被追溯判负**。④ 与 `verify-code/SKILL.md:24`（新疑点才重跑浏览器检查）**保留**、两者不冲突，文案相邻放置以免被读成矛盾。⑤ 末 Phase 与"结算 Phase"可能冲突——文本写明"验收 Phase **就是**末 Phase，结算内容并入它的「六项结论」与「回写五项」（`phase-template.md:235-236`），**不再另设一个只做结算的 Phase**"（用既有小节承接，不新增 Phase 类型）；若仍出现两个末位 Phase，**收窄为"末位 Phase 必须覆盖全部 AC"**。⑥ 核对让 verify-code 超时——降级为"先核末 Phase 与所有声明了浏览器面的 Phase，其余按 `phase_progress` 游标与时间窗粗筛，粗筛不到的写'未取证'并给搜索命令"，**降级必须写进交接**（不静默降低门槛）。⑦ 核对表被当成新的质量对象——写在 verify-code 的既有验收记录里（`:18` 已逐字要求"功能验收记录独立成件"），**不新建 schema、不新建独立报告文件类型**；若有人给它建了 schema，**回退该部分并如实登记**。⑧ 与 N1 的边界冲突——若 N1 把 `command_oracle_checks.valid` 接成推进前置，**N10 撤回对它的依赖**（核对表本身不依赖 N1）。⑨ 成本结论建立在"按 Phase 时间窗粗筛可达"的**推断**上，该筛法未实测，列为**未确认**。｜
**影响面**：`workflows/verify-code/SKILL.md`（`:18` 逐 phase 穷尽核对／`:20` 消歧义／`:22` 去硬编码＋结论依据；建议本模块持笔）、`workflows/verify-code/steps.json`（step 4）、`skills/spec-plan/SKILL.md`（N8 持笔，N10 供串）、`skills/spec-plan/templates/phase-template.md`（N8 持笔，N10 供串）、`workflows/build-plan/SKILL.md`（`:21`）；**明确不动**：`runtime/stage/stage-content-contracts.mjs`、`tools/cli/run-checks.mjs`、`skills/spec-plan/templates/index-template.md`（本组不认领）、`workflows/build-plan/steps.json`（N10 让出给 N8）。

#### N11 — 提交粒度与授权粒度
**决定**：补回**正面条款**并改授权粒度。**提交粒度＝每个 phase 1 次，verify-code 结束再来一次完整的全部提交合并**（U-005①，用户原话；U-004 同口径）。**授权可重用与生效范围（U-012②③）**：改成「绑分支＋阶段」后，**同一阶段内一份授权可重用**，并把**"用了几次／每次 HEAD"写进确认件**；**该绑定只在 build-code 生效**，其他阶段不传该参数时仍走旧的「HEAD 严格相等」。① `workflows/build-code/SKILL.md:74` 在同一句后**追加**正面条款：一个 Phase 的实施、测试、独立审查与 finding 修复**全部完成后**在本 Phase 收尾提交一次，材料改动随该提交一并落盘（`tools/cli/stage-runtime.mjs:827`「材料需有真实提交」／`:843`「需有真实 Phase 起始提交」两处提交前置要求**纳入本模块写集**：改为「以当前工作树 diff 为审查与提交基线、每 phase 一次提交」语义下可满足，不再要求为材料单独提交；若不纳入，须写明具名理由）；**Phase 内不因单步完成而提交**；**审查在提交前进行**（送审对象是当前工作树 diff，不以提交为送审前提）；阶段末的完整提交与合并由既有 close owner 在 verify-code 结束时执行一次。② `docs/standard-workflow.md:11` 在同句后追加："同一 Phase 内的提交消费该 Phase 的授权记录；**HEAD 前进不使本 Phase 已记授权失效**；审查在提交前完成；每 Phase 收尾提交一次，最终完整提交与合并由默认安全收口执行一次。"③ `workflows/verify-code/SKILL.md:42` 追加"本阶段结束时由既有 close owner 执行一次完整的全部提交与合并；不在阶段中途另起提交序列"（只描述既有 close 行为，不新增动作）。④ **授权粒度：绑分支＋阶段**（改代码）——`runtime/interface/git-authorize.mjs:539-551`（`record`）新增**可选**字段 `phase`（`head` 保留不动，授权发出时的真实 HEAD 仍留档；不传则不写、旧行为不变）；`:606-608`（`consume` 绑定校验）改为：若 `grant.value.phase` 是字符串，则要求 `consume` 传入的 `phase` 与之相等，并**只**校验分支一致（`:607` 已有分支校验），**不再**比较 HEAD 相等；若 `phase` 缺失（旧记录），**保持 `:608` 逐字不变**；`:553` `consume` 签名新增可选 `phase`，未传而授权带 `phase` 时报 `AUTH_SCOPE`（**不允许静默按分支放行**）；`tools/cli/stage-runtime.mjs:1121-1128`／`:1047` 透传 `--phase`，阶段值取**现有** build-code stage row 的 `phase_progress.phase_id`（照 `:553-555` 既有读法，**不新增字段、不新增阶段值来源**）；`:1238-1243` 的别名表若接受 `--phase` 则加入允许表（别名集合不变）。`core/task-close.mjs:648-678` 的 `consume()` **不改**（收尾事务内自校验，与 phase 粒度无关）。**明确不做**：不新增"提交门"、不新增提交账本、不新增 `kind: commit` 完成证据；`stage-runtime.mjs:827`／`:843` 的**校验语义收紧为「以当前工作树 diff 为基线」**（见本段首句：两处提交前置要求**已纳入本模块写集**）；本句此前写作「保持不变」与首句矛盾，已按 U-009②/父代理裁定改为**以首句为准**。｜
**为什么**：现行文本**没有任何提交时点条款**（`workflows/build-code/SKILL.md` 6 处提提交全是取材/降级/风险披露；`steps.json` 对"提交|commit|落盘|push|merge" **零命中**；全仓非归档区**零命中**"一个 phase 一次提交／只提交一次"）——**不是文本要求频繁提交，是工具逼出来的**：`SKILL.md:74`「每次实际 Git 操作前调用 git-authorize…绑定当前分支和 HEAD…**HEAD 变化时重新核对并记录，不能消费旧 HEAD 记录**」＋`git-authorize.mjs:608`（`AUTHORIZATION_HEAD_MISMATCH`）与 `:606`（取最近一条未消费授权）→ **提交后 HEAD 必变，旧授权全作废，等于一次提交一份授权**；实测 card-08 有 **58 条 authorize-commit ＋ 58 条 consumed-commit、`head` 取值 57 个**。另 `stage-runtime.mjs:827`／`:843`／`:846-850`／`:568-570` 使材料一改就得提交。**同类改进以前做过、且被丢掉了**：`docs/archive/2026-07-13-unstaged-review-snapshots.md:5` 逐字"Review every stage … without creating stage commits; create one implementation commit only after the final approved review still matches the worktree"、`:15`「**Never create a commit before review.**」、`:223` Task 4「**Remove the per-stage commit gate**」→ **今天正文无任何对应条款**，所以这是"**补一条正面条款**"，不是"删一条挡路条款"。**挡路的只有一处**：`:608`＋`:606` 的 HEAD 死绑——把授权粒度从"绑 HEAD"改成"**绑分支＋阶段**"即可（量化：card-08 按"一 phase 一次提交"则 74→8 次提交、58→8 条授权；其余**不挡**：`captureSource` 采的是工作树，未提交内容本来就进 diff，所以"审查在提交前"当前技术已支持）。**口径三处打架已由用户裁决**：archive 的设计是"**整个 stage** 最终审查通过后只提交一次"、用户 R-013 说"**每个 phase** 全过完提交一次"、`card-03 proposal.md:28` 支持后者——**U-005① 定为 phase 粒度＋收尾一次**，旧口径进退役登记。｜
**否掉了什么**：① **只改文本、零代码**（实测挡路的唯一实现级条款是 `:608` 的 HEAD 死绑，只改文本会得到"文本写一次、工具仍逼着记录多次"的中间态）；② 授权粒度**只绑分支**（会让一条 `commit` 授权在任意后续时点被消费，丢掉"授权覆盖哪一段工作"这层含义；用户口径是"绑分支＋阶段"）；③ 给 `commit` 之外的动作也做 phase 绑定（push/merge/pr 的语义是收尾事务，扩大改动面与"越简单越好"冲突）。｜
**后果与风险**：① **动公共运行时（是）**——`git-authorize.mjs` 与 `stage-runtime.mjs` 是所有任务共享面：任何新任务的 commit 授权都会带 `phase`；旧任务（记录无 `phase`）走原严格路径，行为不变。② **误判风险（本模块最大风险）**——改动落在 `consume` 的绑定校验上，等于局部放宽了一处保护；缓解：只有 `record` 显式写了 `phase` 才走宽松路径，`consume` 未收到 `phase` 而授权带 `phase` 时报 `AUTH_SCOPE`，旧记录路径逐字不变。③ 与"不新增审批门"的张力——正面条款写的是"**什么时候提交**"，不是"提交前要不要问人"；它落在 `:72` 已明文免掉"本地提交授权"的同一段里，**不构成新门**；但若被读成"提交前必须等审查完"而审查又被读成必须停等，就有退化为软门的风险——条款里明写"审查在提交前进行"是**顺序说明，不是等待条件**。④ **未提交窗口变长的代价**——phase 中途上下文丢失时未提交内容可能只存在于工作树；已核实与既有机制不冲突（`SKILL.md:34` 的"修复回原实施会话"与 `:76` 的"缺失不禁止同任务安全修复"都不要求先提交）。⑤ 材料提交时点——phase 收尾的那一次提交把材料与代码同批落盘；若某 phase 只改材料不改代码，仍会有 1 次提交，与口径一致。⑥ 回退单位是**改动行**（文本三处／代码 `:606-608`／`:539-551`／`:553` 与 `stage-runtime.mjs` 两处＋两个契约测试同批）；**已按新粒度产生的授权记录不删除、不重写**（既成事实，`head` 仍是真实值）。⑦ 若误判已导致一次错误消费——不加补偿机制、不回写记录；在当次任务处置记录里写清事实，并把绑定改回严格（要求 `phase` 与 `head` 同时匹配）。｜
**影响面**：`workflows/build-code/SKILL.md`（`:74`）、`docs/standard-workflow.md`（`:11`）、`workflows/verify-code/SKILL.md`（`:42`）、`runtime/interface/git-authorize.mjs`（`:539-551`／`:606-608`／`:553`）、`tools/cli/stage-runtime.mjs`（`:1047`／`:1121-1128`；`:1238-1243` 需核）、`tests/contract/narrow-tool-git-authorize.test.mjs`（`:89-97`）、`tests/contract/close-authorization-diagnostics.test.mjs`（`:19`）；**明确不动**：`core/task-close.mjs:648-678`（收尾七步循环内的事务边界；N12 的 `until` 是**新增可选入参**，不改这段）。**退役登记建议**：`docs/archive/2026-07-13-unstaged-review-snapshots.md:5` 的"整个 stage 一次"口径（决定人＝用户 U-005①）；`:15`／`:223` 的**方向不退役**、退役的是它"未被今天正文承接"的状态；`:608` 的"授权与 HEAD 严格相等作为 phase 内唯一绑定口径"改为绑分支＋阶段（**收窄适用范围，旧记录路径逐字保留**）。

#### N12 — PR 在合并前可见
**决定**：**收尾拆成两步**（先建 PR、再合并），**PR 链接推送给用户，但不阻塞、不等用户回话**；收尾两段式的定义＝**同一次执行流内先建 PR、推送链接、再合并**——不等用户回话、不需要新确认（把「未确认前不进入第二段」整句删去，它属已撤回的 C 组口径）（U-011①：**不真停，只把链接推给你**——收尾两段式保留，但**不阻塞等你回话**；不选"真停住等用户回话"、不选"等固定时间自动继续"；**不采纳**材料 C 的"未确认前不进入第二段"）。已核实现状：建 PR 与合并在**同一次** close 内连续完成（`core/task-close.mjs:722-743` 的 `pr` 分支紧接 `:744-756` 的 `merge`），代码**已经支持**分两次执行同一份 plan（`:615-645` 重放已完成的步骤、`:690` 跳过 `status === "completed"`），**已经支持** PR 已存在则复用（`matchingPr` 定义 `:449-466`，使用点 `:727`／`:741`），命令行**已经分开**（`tools/cli/task-close.mjs:36-44`）。**缺的只有一处**：`core/task-close.mjs:688` 的 `for (const operation of plan.steps)` 没有"到此为止"的能力。落点：① `core/task-close.mjs:603`（`executeClosePlan` 签名）新增**一个可选入参** `until`；② `:688-812` 每个步骤记录完成后，若 `until` 已给定且该步骤 === `until`，跳出循环并返回 `{ status: "partial", stopped_at: until, records, physical }`（与 `:813` 现有返回形状同构，只是 `status` 不同；**不新增持久状态**；可选的 `until` 分段口若被使用，靠既有 `actionFacts` 重放继续）；③ `:605` `until` 若不在 `plan.steps` 里报 `AUTH_SCOPE`；④ `tools/cli/task-close.mjs:19` 允许参数表加入 `until`、`:44` 透传、`:18` 用法串补 `[--until=<action>]`（**不改子命令集合**）；⑤ `workflows/verify-code/SKILL.md:44` 改为两段式：取得一次最终范围确认后，**先执行到建 PR 为止**，把 PR 的实际地址与标题**推送给用户**，随后执行合并、归档与清理；两段使用**同一份 close plan 与同一条确认记录**——**不新增第二次确认**；⑥ `docs/standard-workflow.md:11` 加入同一句两段式说明（该文件是 verify-code 明文指向的收口定义处，只改一处会造成方法与规范打架）。｜
**为什么**：用户原始需求说"原设计是 make-decision 结束时创建 PR、verify-code 结束时关闭 PR"，而实测——① **有出处的一半**：`workflowhub-skill-modernization-20261008` 原始需求 V-001.1 第 1 条逐字"在 make-decision 阶段…使用 engineering/pr 帮助我创建当前任务的 pr 和 pr 描述"；② **无出处的一半**："verify-code 结束关 PR"**全仓 0 命中、无任何原件**；③ **落地设计把方向反过来了**：该任务 ADR-007「PR 改为按环境自适应」、`spec.md:169` 逐字"**收尾不提前开 PR**"。**三重成因**：文本被改写／执行者无动作可做（除 close 外无任何 PR 指令）／**工具限制决定性**——全仓唯一推任务分支的代码在 `core/task-close.mjs:720`，`task-bootstrap.mjs:103` 只建**本地** worktree，又因 close 确认被绑死在 `--stage=verify-code`（`tools/cli/stage-runtime.mjs:1112`），**PR 必然表现为"verify-code 结束时建"**。真实历史：PaperBuilder 全仓**只有 2 个 PR，都在 close 内创建并秒级合并**（card-09 PR#1 建 07:04:42Z／合 07:04:52Z；card-08 PR#2 建 12:10:44Z／合 12:11:45Z，74 提交），card-05 无 PR。**"make-decision 末建 PR"当前完全不可行**（远端无 head 分支、材料还可能未提交），本模块不碰它。｜
**否掉了什么**：① **只改文本、零代码**（`executeClosePlan` 一次调用跑完 `plan.steps`，`pr` 之后没有等待点，文本写了也停不下来）；② 不授权 `merge` 让第一段在 merge 处报错停下（`:808-811` 会把该次执行写成 `status:"failed"` ＋ 一条 `close-action` 失败记录——**用假失败换取停顿会污染事实**，且退出码非 0，与"记录事实"红线冲突）；③ 把 close plan 拆成两份 plan（`:283-285` 的 `validatePlan` 要求 `plan.steps` 等于固定集合之一，拆 plan 需改该校验与全部冻结测试，改动远大于一个 `until`）；④ "make-decision 末建 PR"（可行方案未做，需另开模块与另一次重构 ≥3 个新授权步骤＋新步序＋新读回）。｜
**后果与风险**：① **动公共运行时（是，但极小）**——`core/task-close.mjs` 是收尾核心、所有任务共享；新增一个**可选**参数，默认行为不变。② **与"仅最终 close 确认一次"的张力**：两段共用同一次用户确认（`:401` 的确认正文已覆盖展示出的动作集合），**不是**新增审批门；但"用户看到 PR 后要不要继续"在体验上就是一次停顿——须在方法里写成"**看到之后不确认就不合并**"，而**不是**"再确认一次"。**该句已按父代理裁定删除**：不设停等、不等确认，只把链接推给用户（与 N14 的张力随之消解）。 ~~**⚠ 材料内部冲突待裁**~~（**已裁，见 `## 冲突待裁` 第 3 条**）：C 组正文写"两段使用同一份 close plan 与同一条确认记录；**未确认前不进入第二段**"、并另写"必须写明'未确认前不进入第二段'，否则执行者可能自发续跑，等于没拆"，而 U-011① 明确"**不真停，只把链接推给你**"——"不阻塞"与"未确认前不进入第二段"在字面上互相抵触，**已裁（父代理）**：不采纳 C 组「未确认前不进入第二段」，按 U-011① 同一次执行流内先建 PR、推送链接、再合并（见 `## 冲突待裁` 第 3 条）。③ **停住不动的风险**：**按 U-011① 不再存在**——收尾不设停等点，同一次执行流内连续跑完；`docs/standard-workflow.md:31`"时间流逝不等于同意"仍适用于需要真实确认的不可逆动作（最终 close 那一次），与本条不冲突。④ `matchingPr` 的重入语义——默认形态不再分段；`--until=pr` 作为**可选**分段口时靠既有重放继续，首次执行若在 PR 建好后中断，第二次执行会复用同名 PR，不重复建。⑤ `gh` 环境依赖——无 `gh` 或未登录时 `pr.status` 为 `unavailable`、plan 走五步，本模块不改变该退路。⑥ 回退：`core/task-close.mjs` 去掉 `until` 分支与 `:605` 校验、`tools/cli/task-close.mjs` 去掉 `until` 允许项与传参（单文件两处、命令侧两处）；停在 `partial` 的任务**不需要回滚**（既成事实＋既有重放跳过）；用户要求撤销已建 PR 时按既有 `gh pr close` 由用户决定，**不新增撤回机制**。⑦ 退役登记——本模块**替代**"建 PR 与合并必须在同一次 close 内连续完成"这一现状，但**未确认该现状是否有一条成文需求**（`13:§7.1` 记"verify-code 结束关 PR"全仓 0 命中），故**暂不写退役行**。｜
**影响面**：`core/task-close.mjs`（`:603`／`:688-812`／`:605`）、`tools/cli/task-close.mjs`（`:19`／`:44`／`:18`）、`workflows/verify-code/SKILL.md`（`:44`；与 N11 的 `:42` 同文件）、`docs/standard-workflow.md`（`:11`；与 N11 同段）、`tests/close/close-contract.test.mjs`（`:91` 保留七步不变量，新增 `--until=pr` 两段执行一例）。

#### N14 — 边界确认与材料诚实
**决定**：**工具仓库不定义类别，只要求在动手前显式读取并引用项目自己声明的类别**（U-011②；**项目未声明受保护类别时的默认动作（U-012④）**：**只查一次、把"未声明受保护类别"记成事实、不停等**——不得因此新增审批门）：真正的失效点是"**声明了但流程里没有任何一步去读它**"）。① `workflows/build-code/SKILL.md:27`（紧接"不自行改材料"）追加：改动**受保护面**（**按项目自己声明的类别**，示例性：引擎、DSL、数据库／迁移、既有通过测试、外部契约）之前，先**显式读取并引用该项目自己声明的类别**，再按现有 task 授权记录核对两件事实并各存一份原件：①**授权范围是否包含该改动**（按授权原文与 `runtime/interface/git-authorize.mjs` 已记的 `operation/scope` **原样引用，不重新解释**）；②该改动**是否超出当前声明写集**。写集内且授权范围内的改动继续；**超出声明写集或授权原文未含的，不由实施方自行认定覆盖**：把"哪一处越过、依据哪条原文、缺什么确认"写成事实，停下该处，**继续其它安全部分**，交对应 owner（产品侧既有测试与引擎语义交用户裁定，材料归属交 build-plan／make-decision）。② `workflows/build-plan/SKILL.md` 的 spec-plan 段追加**规划版同一条**：规划中涉及受保护面的改动，**在材料里保持 pending 并写明待哪一条确认**，不得以"已有裁决覆盖"自行结案；未确认的语义**不得写成已确认**。③ 材料诚实性**不新增条款**（`skills/decision-log/SKILL.md:25` 与 `:64` 已覆盖），只补一个可核对动作并并入上一条同一句：材料里写"已确认／逐字／已产生"的每一处，其指向的原件**必须真实存在且路径可打开**。`skills/spec-plan/templates/phase-template.md` **不动**。｜
**为什么**：实测 build-plan 把产品仓库一个**原本通过**的既有测试改写成相反语义（零长时段窗口应被拒绝），其变更申请件自记"**待**非作者独立窄审查及明确受保护测试修改授权"，主会话以"已有裁决覆盖、不增审批门"**自证放行**，事后被用户裁决推翻；另有 DDL／引擎语义被写成"已确认"（用户在该会话内 DDL 相关裁决 **0 次**）、"未确认"被写成"已确认"、8 份"外置原件"只在索引里具名而**从未产生**、悬空 `V-013`。**关键情形判断（决定本模块能多小）**：越界发生于 **build-plan 阶段**，而"不自行改材料"这条**已经写在 build-code**（`:27`）——**规则在、越界仍发生**，所以不能靠"再加一句总原则"，而要把门落到**两个可观察动作**（授权原文＋声明写集）上；失效点是"声明了但流程里没有任何一步去读它"。｜
**否掉了什么**：① **零成本版：只在 build-code 加一句"越界改动不得由执行方自证"**（这正是 `:27` 已有的规则，加了也没解决——问题不在缺原则，在**缺可核对的两份原件**）；② 机械化：给授权记录加 `scope` 字段并用校验器强制比对（新字段＋新校验器＋新读回＝新机制；且 `git-authorize.mjs:548` 的记录里已有 `branch/head/confirmation_ref`，确认件的 scope 文本在 `quality/evidence/git-authorizations/*.json` 与 `human-confirmations/` 里本来就存在，**够用**）；③ 把"受保护面"做成**清单文件**（新账本，且清单本身会需要维护者；**workflowhub 侧只应写"按项目声明的类别＋真实授权原文与写集核对"，不复制一份会漂移的面清单**）；④ 走"新确认件"路线（`runtime/interface/human-confirm.mjs` 本组判定不改）。｜
**后果与风险**：① **与"不新增审批门"张力最大（本模块是五个里最大的）**——本条实质是"越界即停、等人裁定"，**推进会被暂停**，与宪法"记录事实而非阻断"正面冲突的可能是真实存在的。**边界**：(a) 它**不是新门**——只是把 `:27` 已有的"不自行改材料"从原则变成"两份可核对原件"；(b) 它**只对"超出声明写集或授权原文未含"的改动生效**，写集内且授权范围内的改动不受影响；(c) 它**不阻止继续其它安全部分**（与 `:27`「先继续不受缺口影响的安全部分」一致）。② **备用写法**：若用户认为这条仍是门，把"停下"降级为"**继续实施但在材料最显著处登记'本改动未获确认'**"（符合 R14 的取舍方向：保留对账、不加门），代价是越界改动会先进仓库再被发现——**建议把这两个写法作为模块裁决的一个显式二选一摆给用户**。③ "受保护面"的定义漂移——写"引擎／DSL／数据库／既有通过测试／外部契约"是**示例性**的，界限靠**项目自己声明的类别**＋真实授权原文与声明写集判断，而不是靠这份词表（避免它变成新的口径来源）。④ 材料诚实性那半条风险低（只是"路径要能打开"，与 `AGENTS.md` 的"证据只留原始件"同源，不增加门）。⑤ 回退：纯文本（按锚点恢复对应小节）；若被证明造成了事实上的停等门（用户实跑反馈"任务卡在越界确认上"），**按 U-002 红线优先**，先降级为"继续实施＋登记未确认"，保留事实、不保留停等；**已产生的越界事实记录不删除**（既成事实），只改后续行为。⑥ **C 组第三项写"已知判据缺口：没有拿到项目铁律的原文与行号"**，而主会话 F-60 实测该铁律在宿主项目 `PaperBuilder/AGENTS.md:10/:13`——**该冲突已裁：原文出处＝宿主项目 `PaperBuilder/AGENTS.md:10`／`:13`（与本任务写集无关，不引用其行号）；工具仓库不定义类别清单**，且不据此声称已引用该铁律的行号。｜
**影响面**：`workflows/build-code/SKILL.md`（`:27`）、`workflows/build-plan/SKILL.md`（规划段；**行号未定位**，须由该文件 owner 定位后回填）；**明确不动**：`skills/spec-plan/templates/phase-template.md`、`runtime/interface/human-confirm.mjs`、`runtime/interface/git-authorize.mjs` 的 `scope` 字段（不做新字段）。

#### N15 — 编辑安全网
**决定**：**只写进写作规范，不动代码**（U-010③：**只写进规范**，不新增运行时函数；**不改 `runtime/interface/safe-write.mjs`**；**本条的事故计数以 F-63 为准（本会话 6 次）**）。在 `skills/spec-specify/SKILL.md:140-158`（「技能写作规范（WR001）」节）**增一条**：改写 agent 方法文件时——① 锚点只用**该文件唯一**的原文串，不用行号、不用"看起来像"的模糊匹配；② 替换**不得**跨过小节标题行（`^#{1,6} `）——需要删除某一节时显式写出该节标题；③ 改写完成后**逐条核对被改文件原有小节标题是否仍逐字存在**，有丢失先按**改写前原文串**恢复**被损坏的那一处**再重新编辑（**只恢复丢失的小节标题与它的正文，不对整份文件做 `git checkout`**——同一文件同一批的其它改动〔如 N8 的 `:18-20`〕必须留在原位），**不用手工补标题**，并把"本轮涉及文件＋标题清单"作为事实写进当次编辑说明。**这是记录，不是质量门。** 原方案的"新增纯函数 `missingSectionHeadings(before, after)`（返回丢失清单、不抛错）"**按 U-010③ 作废**。｜
**为什么**：同类替换吃掉小节标题的事故，被审计项目**重复 4–6 次**（card-05 Agent 自认"第四次同类失误，我的习惯问题"），**本任务主会话已犯 3 次**。成因很具体：**用旧锚点做字符串替换时，把"标题行"连同旧正文一起吃掉**。这条已被第 15 路列为必须补项。｜
**否掉了什么**：① **新增 `runtime/interface/safe-write.mjs` 的纯函数导出**（U-010③ 用户已明确"只写进规范、不动代码（不新增运行时函数）"——这是**用户拍板**，不是本文件的取舍）；② 做成新 CLI 工具（如 `check-edit-anchors.mjs`）并挂进 `npm run check`（新命令＋新控制面，且挂进检查链会被读成关卡，哪怕它只报警）；③ 挂进编辑工具（Edit/Write 的 pre-hook）自动拦截（需要改宿主工具链，且**拦截即门**）；④ "只写规范、全靠自觉"曾作为原方案的降级备选被保留——**U-010③ 之后它就是唯一形态**。｜
**后果与风险**：① **收益完全依赖执行者自觉**——若执行者根本不调用/不核对，收益为零；这是 U-010③ 取舍的直接代价，**如实承认**。② 不把它包装成必做步骤，避免变成形式主义的打卡项。③ 只**新增一条**，**不改既有 Q01–Q12**、不退役任何 Q。④ 回退：**只恢复被损坏的那一处 N15 改动**（输出文件内 `git checkout` 只作为"整份检出会吃掉 N8"的反面表述出现）（用改写前的原文串按锚点回退 `skills/spec-specify/SKILL.md:140-158` 的 WR001 节），**不对整份文件做 `git checkout`**——文件同一批还有 N8 的 `:18-20`（`## Post-cohort specification contract` 节）改动，整份检出会把它一起吃掉；**两处改动按节分 hunk、由同一实施者分次落笔，互不覆盖**（`N8 :18-20` 与本处 `:140-158` 分属两个小节）。已发生的标题丢失属既成事实——先恢复该节原文再重新编辑，批量替换已扩散时优先恢复，不逐处修补（手工补会引入新的不一致）。⑤ 若本任务执行中确认"人读核对本身没抓住"（新证据），**再单独立项**评估是否需要机械手段——**不在本模块内夹带**。⑥ 与 N5 的边界——N5 管"要求读到了却不交"，本模块管"编辑时把已有结构吃掉了"，**不重叠**。⑦ 材料声明"本任务主会话已犯 3 次"在仓库原件中**无行号可核**（按用户陈述采信），列为未确认。｜
**影响面**：`skills/spec-specify/SKILL.md`（`:140-158` WR001 节，只新增一条；与 N8 的 `:18-20` **按节切分**）；**明确不动**：`runtime/interface/safe-write.mjs`（U-010③ 明文不改）。

#### N16 — 让"精炼／外置"从散文变成可判定
源文件中本模块**无五字段块**（无 `**决定**：`／`**为什么**：`／`**否掉了什么**：`／`**后果与风险**：`／`**影响面**：`）。本模块在源文件中出现于 `## 模块清单` 的五行表行 `:347`，另见 `## 需求变更记录` 的 U-014 行 `:170`。

#### N17 — phase 文件名带工作包名 ＋ phase 数量与工作包对齐
源文件中本模块**无五字段块**（无 `**决定**：`／`**为什么**：`／`**否掉了什么**：`／`**后果与风险**：`／`**影响面**：`）。本模块在源文件中出现于 `## 模块清单` 的五行表行 `:348`。

#### N18 — 修"外置件内外路径不通"
源文件中本模块**无五字段块**（无 `**决定**：`／`**为什么**：`／`**否掉了什么**：`／`**后果与风险**：`／`**影响面**：`）。本模块在源文件中出现于 `## 模块清单` 的五行表行 `:349`。

## 模块清单

本节回答改哪些模块、每块的决定要点与适用限制。**编号唯一来源**：N1 到 N12、N14 到 N18 共 **17 块**；N13 经 U-009③ 取消、编号保留占位、不实施；本表之外的模块编号一律无效。
硬约束＝不加新机制、新关卡、新账本。
每条格式：`模块｜决定要点｜依赖｜优先级`；决定要点含落地形态、用户口径与适用限制。

- **N1**｜把已算出却被丢弃的契约校验结果接到边界作为事实可读：`tools/cli/stage-runtime.mjs` 的 `:533-545` 之间插入只读事实块并并入 `source`；`parsed.errors` 只作被审对象的事实，不参与任何分支判断。
  按字面执行 Phase 卡声明的 `RED/GREEN gate_cmd` 与 Phase 级 `gate_cmd`，回执落已有 `quality/tests/`，汇总写进已有 `evidence` 槽（形状由 `runtime/task/task-store.mjs:87` 强制），未执行写真实原因；并消除审查工具"自报与载荷矛盾"。
  口径：执行者＝build-code 中的测试子代理，不是运行时；只记录事实、不阻断，非零退出、超时、取消、命令不存在一律如实登记。
  限制：对 5 个检查器逐项登记"不接线＋理由"；不新增检查器或命令。
  依赖 无｜优先级 高
- **N2**｜用正确判据复核 `raw/06-cross-stage-defect-audit.md` 的七类跨阶段命中 C1 到 C7 与"通病／特有"判定。
  口径：先复核、再开修；只产结论表，仓库内写集为空，产出物写进 build-plan 的 `spec.md` 与 `phases/P<n>.md`。
  限制：不自动开修；无法定论时只登记"未确认"，不改文本。
  依赖 无｜优先级 高（最先）
- **N3**｜删掉悬空名，对账落到模板现有小节（U-008③）：把 `workflows/make-decision/SKILL.md:41` 点名的"模块清单／写集表／未落项"解析为模板真实节名，并在模板 `:107` 追加穷尽义务。
  限制：不新增节、不新增列、不新增账本；穷尽义务收窄为 R 与 U 两级。
  依赖 无｜优先级 中
- **N4**｜认定编号、计数、引用已有唯一权威并禁止再写第二处；把"漏一条需求"变成覆盖矩阵里的一个空白格（遗漏签名）。
  限制：不新建编号权威、零新增字段与文件；`stage-content-contracts.mjs` 的编号正则不改，登记"不处理＋理由"。
  依赖 无｜优先级 中
- **N5**｜在现有覆盖矩阵加取值"已投递未执行"，并要求"登记了却没处置的项必须以缺口出现一次"（U-011③）。
  限制：不加新字段、不新建表、不设门；矩阵为空不判完成不成立。
  依赖 N1、N4｜优先级 高
- **N6**｜关键要求在用到它的那一刻仍在眼前：把 `workflows/make-decision/SKILL.md:32` 的"条件读取"去条件化；在调用点原地保留三行最小指针（U 一行、OI 一行、coverage audit 一行），权威仍在原 owner；把大白话单轴决策卡与问答工具 IO 契约从 `skill-deps.yaml` 提到入口正文。
  限制：不整份无条件读入、不复制正文；已读入正文活不过上下文压缩，这一半只能缓解、不能根治。
  依赖 无｜优先级 高
- **N7**｜阶段末复盘未执行必须在交接里写明"本轮未执行"＋一句真实原因，落点是 `skills/stage-handoff/SKILL.md` 的结束条件段与 `skills/stage-reflection/SKILL.md` 的方法段。
  问题回流按归属分流（U-008②）：别的项目的问题记在别的项目里，workflowhub 的问题记在工具仓库根 `Improvements.md`，不新建位置。
  依赖 无｜优先级 中
- **N8**｜测试层级不写死，由每个项目每个任务每个 phase 自己定；只要求每个任务、每张 Phase 卡自己声明"这次测哪些面＋每面测或不测的理由"，并为每个要测的面配一条可执行命令。
  测试面是否合适的自查前移到 build-plan 的 Phase 审查（U-012⑤），verify-code 只作二级核对、不复述该自查。
  落点含 `skills/spec-plan/templates/phase-template.md` 的 `:203` 与 `:249` 两处同改、`:132` 测试策略改可核对形态、`:208-212` 加一行注记（判定器编号必须与同卡 `gate_cmd` 成对；一条 AC 只有产品级判据而无可执行命令时 `Done` 不得记达成）。
  限制：工具仓库不给清单、也不检查清单内容（U-010①）；改动面涉及浏览器可见行为时未列浏览器面必须给具名理由。
  依赖 无｜优先级 高
- **N9**｜由 build-code 中的测试子代理按已声明的面真跑，逐面留执行事实（原命令、cwd、argv、exit、原始输出）。
  堵两个逃逸口：写 `unavailable` 或 `incomplete` 时必须写清哪一面、卡在哪、什么条件下能跑；涉及浏览器可见行为时必须实际执行 `isolated-browser-qa` 并把原件留在原 ref。
  同时把 `isolated-browser-qa` 加进 build-code 与 verify-code 的依赖清单、`skills/catalog.yaml:807` 的 `used_by_stages` 改成 `[build-code, verify-code]`，并去掉通用指令里写死的本仓历史脚本路径。
  限制：只跑受影响面，不用无范围全量回归代替；`N/A — 理由` 只在声明写集不含任何浏览器可见面时可用，判据是声明写集不是执行者的感觉。
  依赖 N8｜优先级 高
- **N10**｜末 Phase ＝ 整任务端到端验收成为文本义务，其契约头列出全部 AC；verify-code 加逐 phase 穷尽核对表（只读 `quality/tests/` 既有原件、不重跑）。
  C12 裁决（U-012⑤）："该测的面漏了没"不由 verify-code 才发现，build-plan 审查时就要自查，verify-code 的核对表降为二级。
  限制：仅当任务含可执行产物时必选，纯文档与工作流规范类可声明豁免并给具名理由。
  依赖 N1、N8｜优先级 中
- **N11**｜补回正面条款：审查前不提交、每个 phase 完成开发测试审查后提交一次；把授权粒度从"绑 HEAD"改为"绑分支＋阶段"，同一阶段内一份授权可重用，并把"用了几次、每次 HEAD"写进确认件；verify-code 结束时再做一次完整的全部提交合并（U-005①）。
  限制：该绑定只在 build-code 生效，其他阶段不传该参数时仍走旧的 HEAD 严格相等；无阶段字段的旧记录逐字兼容。
  后果：动的是公共运行时，须在 spec 写明"旧记录零影响"的验证方式。
  依赖 无｜优先级 高
- **N12**｜收尾拆两步：同一次执行流内先建 PR、把链接推给用户、再合并；不等用户回话、不需新确认（U-011①）。
  限制：不真停、不引入第二次确认或新子命令；不采纳"未确认前不进入第二段"这一已撤回口径。
  依赖 N11｜优先级 中
- **N14**｜越界处置按类别分（U-008①）：引擎、DSL、数据库、产品代码停下来问，纯文档、注释、测试夹具继续做但登记。
  口径：工具仓库不定义类别，只要求动手前显式读取并引用项目自己声明的类别（U-011②）；不接受执行方自证。
  限制：项目未声明受保护类别时只查一次、记成事实、不停等（U-012④）；不得新增审批门。
  依赖 无｜优先级 中
- **N15**｜同类替换吃掉小节标题的编辑事故只写进写作规范、不动代码（U-010③）。
  限制：不改 `runtime/interface/safe-write.mjs`，不新增运行时函数或 pre-hook；本条还是靠执行者自觉。
  依赖 无｜优先级 中
- **N16**｜让"精炼／外置"从散文变成可判定。根因三条：检查侧全空（没有一处会因"啰嗦"而响）、方法侧把要求写成散文（且 ADR-0037 明文否掉评分器与字数门）、模板 10 条穷举判据没有长度上限且外置只覆盖 6 类。
  形态（U-014① 与 U-015 更正后）：①外置覆盖面扩到那五类（已知事实表、更正与过程记录、未确认项汇总、写集逐条对账、覆盖矩阵逐项结论）；
  ②精炼判据＝内容判断（build-plan 直接消费的留主文，过程与对账外置留指针），不以行数、文件大小、每行字节作任何限制或驱动；
  ③篇幅与结构占比**最多作为纯观察事实记录**，不得设目标值、不得作达标判据（U-015）。**精炼与否只按内容判断**：该节是否为 build-plan 直接消费。
  落点含 `skills/decision-log/SKILL.md` 的编号写作规则与 `skills/decision-log/templates/decision-log-template.md` 的穷尽义务句。
  限制：不新增门、不新增评分器，与 ADR-0037 不冲突。
  依赖 无｜优先级 高
  精炼按**内容判断**（build-plan 直接消费的留主文）；**不设篇幅阈值**；篇幅数字最多作纯观察事实，不作判据（U-015）。
  落点含 `skills/decision-log/SKILL.md` 的编号写作规则与 `skills/decision-log/templates/decision-log-template.md` 的穷尽义务句。
  限制：只显示数字、不判定通过与否；不新增门、不新增评分器，与 ADR-0037 明文否掉评分器与字数门的边界不冲突。
  依赖 无｜优先级 高
- **N17**｜phase 文件名带任务名或工作包短名，例 `P1-门禁核验与开闸.md`；phase 数量按独立可交付、可验收划：一个工作包只含一个可交付物就对应一个 phase，工作包多于可交付物时允许拆，但必须在 spec 里写明为什么拆（U-014②）。
  落点是 build-plan 的 phase 模板与 SKILL。
  限制：不得像被审计的 card-05 那样出现 27 个 phase 而工作包远没那么多。
  依赖 无｜优先级 高
- **N18**｜修"外置件内外路径不通"：`ArtifactDir.open` 只允许 `<worktree>/specs/<task>/`，而外置原件在任务库 `quality/evidence/…`；细节审查合同却要求"完整当前 decision-log"，导致外置件既不被审查、也读不到。
  这是"外置长期被抵制"的结构性原因，也是本次外置件能被 build-plan 读到的前提。
  限制：动的是审查材料解析路径，影响所有阶段的审查范围，须先定范围再改。
  依赖 N16｜优先级 中

编号映射（第 1 版与审计建议 → 本版）：M1→N1、M2→N3、M3→N6、M4→N7、M5→N11、M6→N12、M7 与 M8→N10、M9→N8／N9、M10→N2；审计建议 M11 到 M15→N5／N4／（取消）／N14／N15。
第 1 版编号仍出现在历史记录里，不追改；引用模块以本映射为准。
14 块（N1 到 N12、N14、N15）的五字段全文外置到 `module-decision-blocks.md`；N16、N17、N18 源文件没有五字段块，只在本节的模块行与 U-014 出现，该事实已登记在 `module-decision-blocks.md` 的"计数与缺口"节。

## 要改哪些文件

本节回答每个文件改什么、由谁唯一 owner。**结论**：甲组 20 行（父代理已裁定 owner）加乙组 28 行＝**48 行**；同一文件中其它模块的追加 hunk 标"并入某 owner"，意思是由该 owner 的实施者一次落笔。
行号为本批实测值，材料之间不一致处见 `write-set-reconciliation.md`。**U-010③ 之后 `runtime/interface/safe-write.mjs` 不再改，未列进表。**
每条格式：`文件｜改什么｜唯一 owner｜决定`。第 1 到 20 条是甲组，第 21 到 48 条是乙组。

- 1. `workflows/build-code/SKILL.md`｜声明面逐面真跑、两个逃逸口、去硬编码、提交与越界追加 hunk、编辑安全网句｜owner N1（N9、N11、N14 并入）｜决定 接
- 2. `workflows/verify-code/SKILL.md`｜逐 phase 核对表、去硬编码、N13 作废处回写｜owner N10（N9、N11、N12 并入）｜决定 接
- 3. `workflows/build-plan/SKILL.md`｜末 Phase 义务、测试面自查前移、N14 规划版条款（行号未定位，UN-C-2）｜owner N10（N14 并入 N1）｜决定 接
- 4. `workflows/make-decision/SKILL.md`｜三行最小指针、去条件化、测试面可问｜owner N6（N8 的 `:29` 并入）｜决定 接
- 5. `docs/standard-workflow.md`｜提交粒度与收尾两段式说明，`:11` 远端分支语义对齐｜owner N11（N12 并入）｜决定 接
- 6. `tools/cli/stage-runtime.mjs`｜`:533-545` 只读事实块并入 `source`；`evidence` 槽最小落盘；纳入 `:827` 与 `:843` 提交前置要求｜owner N1（N11、N12 并入）｜决定 接，行号以实测 `:533-545` 为准
- 7. `skills/wh-review/scripts/simple-review-runner.mjs`｜`:1882` 只改自报 `message`，按同载荷 findings 数量分叉｜owner N1｜决定 接
- 8. `skills/decision-log/templates/decision-log-template.md`｜`:101` 三模块追加句合并为一次编辑；`:107` 穷尽义务收窄为 R 与 U｜owner N3（N4、N5 交句稿）｜决定 接
- 9. `skills/decision-log/SKILL.md`｜`:62` 计数与引用单一写者纪律；`:64` 指向不定义；`:34` 十二节经核实为真、不改｜owner N3（N4 的 `:62` 并入）｜决定 接
- 10. `skills/spec-plan/templates/phase-template.md`｜`:203` 与 `:249` 两处同改（取值域由路由档位改为声明式的面，保留恰好一条 `RED/GREEN gate_cmd`）；`:132` 测试策略改可核对形态；`:208-212` 加一行注记｜owner N8｜决定 接
- 11. `skills/spec-plan/SKILL.md`｜`:49-57` tier 语义随枚举改写；`:53` 后加三层职责句；`:65-71` index 末行判据｜owner N8｜决定 接
- 12. `skills/spec-specify/SKILL.md`｜`:18-20` 测试标准面内容义务；`:72` 行尾追加引用侧不复述位数规则；WR001 节增一条编辑安全网写作规范｜owner N8（N15 并入）｜决定 接
- 13. `skills/spec-specify/templates/spec-template.md`｜`## 测试标准` 加一句：按面写适用与不适用、oracle、证据类型、覆盖边界｜owner N8｜决定 接
- 14. `skills/stage-handoff/SKILL.md`｜`:44` 之后、`:50` 之前新增一句：复盘未执行必须写明并给真实原因｜owner N7｜决定 接
- 15. `skills/stage-reflection/SKILL.md`｜`:15` 未执行也要说明；`:24` 加回流动作（按归属分流）｜owner N7｜决定 接
- 16. `runtime/interface/git-authorize.mjs`｜授权粒度改"绑分支＋阶段"；旧记录无阶段字段时逐字保持 HEAD 严格相等｜owner N11｜决定 接
- 17. `core/task-close.mjs`｜收尾两段式：先建 PR、推送链接、再合并，不阻塞｜owner N12｜决定 接
- 18. `workflows/build-code/skill-deps.yaml`｜`skills:` 段新增 `isolated-browser-qa`｜owner N9｜决定 接
- 19. `workflows/verify-code/skill-deps.yaml`｜同步新增同一条｜owner N9｜决定 接
- 20. `skills/catalog.yaml`｜`:807` 的 `used_by_stages` 由 `[]` 改为 `[build-code, verify-code]`｜owner N9｜决定 接
- 21. `tools/cli/task-close.mjs`｜材料明确归属，与父代理一致｜owner N12｜决定 接
- 22. `tests/close/close-contract.test.mjs`｜收尾两段式契约测试｜owner N12｜决定 接
- 23. `tests/contract/narrow-tool-git-authorize.test.mjs`｜授权粒度与可重用断言｜owner N11｜决定 接
- 24. `tests/contract/close-authorization-diagnostics.test.mjs`｜诊断口径断言｜owner N11｜决定 接
- 25. `workflows/build-code/steps.json`｜落进 step 5 与 6 的 `observable_result`，不新增字段｜owner N9｜决定 接
- 26. `workflows/verify-code/steps.json`｜核对表落进 `observable_result`｜owner N10｜决定 接
- 27. `workflows/build-plan/steps.json`｜测试面声明来源指向 `phase-template.md:249`｜owner N8｜决定 待裁
- 28. `workflows/make-decision/steps.json`｜step 1 的 `observable_result` 加一句可核对披露口径｜owner N6｜决定 接
- 29. `skills/test-routing-advisor/SKILL.md`｜`:16-18` 输出语义对齐"该改动面应覆盖哪些面"，文本层对齐、不新增机器消费者｜owner N8｜决定 接
- 30. `Improvements.md`（工具仓库根）｜下一真实任务就地追加，不新增第二份清单与字段｜owner N7｜决定 接
- 31. `runtime/stage/stage-content-contracts.mjs`｜不改；N4、N8、N10 的"不处理＋理由"登记于此｜owner N1｜决定 不改
- 32. `tools/cli/run-checks.mjs`｜不改；`:143-148` advisory 语义刻意，接进 failures 即改门｜owner 不适用｜决定 不改
- 33. `tools/cli/check-decision-log-chain.mjs`｜不改、不接线并附理由；只扫 repo 内材料、扫不到任务库｜owner N1（N5 登记并入）｜决定 不改
- 34. `runtime/evidence/acceptance-evidence-validator.mjs`｜零 producer，登记"不接线＋理由"｜owner N1｜决定 不改
- 35. `tools/cli/check-stage-quality.mjs`｜扫 `metrics/` 与 `scripts/` 是它的正确语义｜owner N1｜决定 不改
- 36. `tools/cli/verify-structure.mjs`｜`:16` 旧阶段名与 `GLOSSARY.md:154` 历史标签配对，实跑 exit 0 PASS｜owner N1｜决定 不改
- 37. `runtime/stage/stage-skill-runtime.mjs`｜不改；登记在 N1 影响面｜owner N1｜决定 不改
- 38. `runtime/task/task-store.mjs`｜`:87` 的 `evidence` 形状已定义、不改；N1 按它落盘｜owner N1｜决定 不改
- 39. `skills/isolated-browser-qa/SKILL.md`｜不改；`:246`、`:227`、`:221-229` 语义已正确｜owner N9（登记）｜决定 不改
- 40. `tools/cli/check-skill-consistency.mjs`｜反向核对只进 `reports` 不进 `failures`，不改｜owner N9（登记）｜决定 不改
- 41. `skills/spec-plan/templates/index-template.md`｜本批不认领；若需改则撞 N4 的 index 判据｜owner N8（待定）｜决定 待定
- 42. `runtime/interface/human-confirm.mjs`｜不改；登记｜owner N14（登记）｜决定 不改
- 43. `skills/decision-log/templates/` 之外的模板与 skills｜无改动；登记｜owner 不适用｜决定 不改
- 44. `workflows/verify-code/isolated-browser-qa.md`｜建议退役登记、不删除；264 行孤儿旧副本，其机器证据通路已从 runtime 整体移除｜owner N9（登记）与用户（授权）｜决定 只登记
- 45. `.codex/hooks.json`｜不改；该通路与方法正文投递无关，由 ADR-0024 主动删除｜owner N6（登记）｜决定 不改
- 46. `docs/archive/2026-07-13-unstaged-review-snapshots.md`｜只读；只作 N11 的退役来源引用｜owner N11（登记）｜决定 不改
- 47. `specs/archive/**` 与历史任务材料｜只读；不追改历史材料、不给历史 Phase 追溯判负｜owner 全部模块（登记）｜决定 不改
- 48. build-plan 的 `spec.md` 与 `phases/P<n>.md`（产出物）｜N2 写复核结论表（七类逐行与两类清单）｜owner N2｜决定 输出＝结论，非仓库代码

本节 48 行是 build-plan 的直接输入，**不外置**；逐条对账明细（每行完整"改什么"原文、行号待核准项、owner 归一化依据）外置到 `write-set-reconciliation.md`。

## 范围与非目标

本节回答做到哪、明确不做什么。**结论**：目标 4 项、非目标 5 项，全部过"不加新机制、门、账本"这道筛。

- 目标：① card-05 暴露的问题有具名根因，且根因与"谁的问题"分开；② 17 块按本版编号完成（N13 取消）；③ 跨阶段清单经正确判据复核后有明确处置或明确不处置的理由；④ 全部改动通过红线筛。
- 范围：workflowhub 本仓的方法文本、模板、检查接线与落点定义；诊断部分覆盖 PaperBuilder card-05 的过程与材料，只读取证、不改其产物。
- 非目标：不修 card-05 的产物材料（那 8 条"不符合"），去向是 F-30 与 F-31、由用户决定是否另开任务；不做运行时阻断门，去向是 N1 写成"事实浮到边界"；不新增检查器、账本、阶段，去向是 N1 只做接线与登记；
  不改 `specs/archive/**` 与历史材料，去向是取证只引用不改写；不在本任务内判定"修好了"，去向是验收面写成用户可观察项。
- Supersedes：无。本任务更正了自己在 step 2 转述给用户的一条错误结论（"第 10 步判据的验收对象不存在"），更正在 F-33 到 F-35 与 U-003 有据；历史转述不删改，只在新条目里指明其不成立。

完成判据：目标可观察，范围具体，每个非目标一行理由与去向；被替代主张逐条可定位，历史事实保留。

## 验收面

本节回答"怎么算成功、什么算失败"，是 build-plan 的接口。**结论**：**20 条** AC（`AC-C05AUD-01` 到 `AC-C05AUD-20`）；前 16 条沿用原件，17 到 20 为本轮新增，因为 N16、N17、N18 需要新的 AC、编号顺延。
全部写成"用户另跑一个真实任务时可观察"，本任务内不自证通过。
每条格式：`AC 编号｜通过｜失败｜负责人｜来源`，紧跟一行 `用例`。

- **AC-C05AUD-01**｜通过：`quality/tests/` 有对应真实回执；｜该阶段 `evidence.value` 不再是 `null` 且可逐条核对；｜没跑的看得见原因，阶段照常收口｜失败：只有文本命令、无回执；｜或 `evidence` 仍是 `null`；
  或未执行把阶段卡死｜负责人：N1｜来源：U-001、U-002、U-004、U-005④、U-009②；｜F-47、F-49
  用例：下一个真实任务跑 build-code，看 Phase 卡声明的 `gate_cmd` 有没有被按字面跑过、`evidence` 槽有没有被填
- **AC-C05AUD-02**｜通过：审查输入能看到 `contract_ok`、`contract_error_count`、`ac_coverage`，且未改变"是否发起审查"｜失败：没有该块；或该块出现后改变了审查是否发起，即变成门｜负责人：N1｜来源：U-005④；F-21、F-38、F-49
  用例：发起 build-code 单 Phase 审查时，看送审材料里有没有契约校验只读事实块
- **AC-C05AUD-03**｜通过：有 findings 时 `message` 不再声称"无任何语义结果"并明说存在 N 条；`code`、`status`、`pair_status` 与改前一致｜失败：`REVIEW_NO_SEMANTIC_RESULT` 与 findings 并存，本任务已复现一次｜负责人：N1｜来源：U-002；F-15⑥
  用例：再出现"两个 role 都不完整"的方向审查时，看回执 `message` 与同回执 `findings` 是否自洽
- **AC-C05AUD-04**｜通过：七类各一行给出判据原文、U 口径结论与依据；｜C4 显式标"判据被推翻"；｜其余六类落在 U1 到 U4 或"未确认"；｜登记两处行号误差与三处类别编号漂移；｜stage 方法文本未被本模块改动
  失败：出现"结构名没逐字出现即义务不存在"的推理；｜或 C4 仍当通病；｜或六类被一刀切｜负责人：N2｜来源：U-002、U-003；｜F-33、F-34、F-35、F-62
  用例：读下一个真实任务 build-plan 产出物，看七类跨阶段命中是否逐类有结论
- **AC-C05AUD-05**｜通过：`grep -c '^## 未落项与处置'` 等于 0；｜矩阵能逐行找到每条 R 与每条 U，各给"已落某节"或"缺口"；｜未处置项在矩阵各有一行；｜`## 大纲地图` 行数等于顶层节数减一
  失败：出现 `## 未落项与处置`；｜或"别处登记了、矩阵没有"的编号不少于 1 个；｜或未处置项在矩阵无行｜负责人：N3｜来源：U-003、U-008③；｜F-20、F-34 第 3 组
  用例：读下一个真实任务 `decision-log.md`，看还有没有人去"造"那一节、矩阵是否穷尽
- **AC-C05AUD-06**｜通过：编号位数统一；｜同一编号跨材料取值一致；｜每个计数能指出出处；｜遗漏签名被记为"缺口"而非悄悄补成"已落"；｜diff 不新增 `tools/cli/*`、`runtime/**`、`schemas/**`
  失败：出现 `FR-1` 与 `FR-001` 混用；｜或引用不存在的编号；｜或同一事实两个值；｜或新增校验器承载这四项｜负责人：N4｜来源：U-002；｜F-15④、F-26、F-29④、F-56
  用例：读下一个真实任务四份材料，看编号位数、同号取值与计数出处
- **AC-C05AUD-07**｜通过："已投递却未落地"的项在矩阵有一行明写"已投递未执行"并指到应落小节；｜R 与 U 两级的空白格数为 0（由用户数）；｜不出现新文件承载对账｜失败：未处置项数不出来；
  或仍有空白格且未以缺口出现；｜或新增台账与新字段｜负责人：N5｜来源：U-011③；｜F-15③、F-34
  用例：收口时把所有登记项（对抗风险、审查发现、OI）逐一列出并与覆盖矩阵对账
- **AC-C05AUD-08**｜通过：写 `## 需求变更记录` 或 `## 未决项` 之前有对 `skills/decision-log/SKILL.md` 的读取；｜首次结构化提问之前有对 `skills/talk-with-zhipeng/SKILL.md` 的读取；
  同套 grep 两次计数，黑话消息数不超过基线 50 条的 40%（即不超过 20 条）；｜提问必须用宿主问答工具，无工具时发同内容文本卡并记录降级｜失败：条件已满足仍零读取；｜或黑话消息数超过 20 条；
  或未用问答工具且未记录降级｜负责人：N6｜来源：U-001、U-009②；｜F-12、F-37、F-39、F-40
  用例：看两份方法正文有没有在"用到它的那一刻"被读到
- **AC-C05AUD-09**｜通过：未执行时交接逐字含"未执行"与真实原因；｜工具仓库根 `Improvements.md` 新增至少一条含问题、来源路径与真实状态的条目；｜两个技能文件不新增节、不新增必填字段、不被校验器引用；
  宿主项目侧不凭空创建该文件｜失败："未执行"这句又消失；｜或两边沉淀仍为空；｜或新增节、字段、校验器；｜或凭空造文件｜负责人：N7｜来源：U-003②、U-008②；｜F-05、F-09、F-10
  用例：看交接件里"没做复盘"有没有被说明；在宿主项目里跑时看问题有没有按归属分流
- **AC-C05AUD-10**｜通过：字段是项目自己声明的面的子集，不再只出现路由档位或工具仓库下发的固定清单；｜每条 AC 的验证面指向该 Phase 可执行的命令；｜`## 测试标准` 逐面写适用与不适用以及 oracle；
  浏览器可见面未列时有具名理由；｜`routing_tier` 零机器命中；｜不改 `run-checks.mjs`｜失败：卡里仍是路由档位或自由文本；｜或 AC 没有可执行命令；｜或浏览器可见面缺具名理由；
  或新增必填字段与校验器｜负责人：N8｜来源：U-006、U-009①、U-010①；｜F-57、F-58、F-50
  用例：读每张行为 Task 卡，看"这次测哪些面"有没有被声明、每个要测的面有没有命令
- **AC-C05AUD-11**｜通过：每个声明的面在 `quality/tests/` 有真实执行原件；｜未跑的写清哪一面、卡在哪、什么条件下能跑；｜浏览器可见 Phase 有真实执行事实或具名判断；
  `grep -rn "card-09-session-ledger" workflows/` 零命中；｜两个 `skill-deps.yaml` 与 `catalog.yaml` 一致且 `npm run check` 仍 PASS｜失败：有声明却没跑且只写"没跑"；｜或浏览器可见面既没跑也没具名依据；
  或仍有写死的本仓历史脚本路径｜负责人：N9｜来源：U-005④、U-006、U-009②、U-010②；｜F-58、F-59、F-47
  用例：build-code 收尾时，逐面看有没有真跑、没跑的写了什么
- **AC-C05AUD-12**｜通过：`phases/` 恰有一个末 Phase 且契约头列出全部 AC、index 末行指向它（仅当任务含可执行产物时必选，纯文档类可声明豁免并给具名理由）；｜存在一张行数等于 Phase 数的核对表；
  表里任何"未跑"都带具名理由与承接人；｜verify-code 不重跑全量上游测试｜失败：末 Phase 仍是纯结算；｜或没有核对表；｜或表里有空行；｜或 verify-code 重跑全量；｜或新增机器校验｜负责人：N10
  来源：U-005③、U-006；｜F-46、F-48、F-49
  用例：读 `phases/` 看末 Phase 是不是整任务端到端验收，读 `quality/` 看 verify-code 有没有逐 phase 核对表
- **AC-C05AUD-13**｜通过：每个 phase 段内提交数等于 1；｜授权条数不超过 phase 数，抽样确认同一条授权前后 HEAD 不同；｜审查原件引用当时工作树 diff、提交发生在审查回执之后；
  verify-code 结束时目标分支已含任务分支；｜不新增提交门、账本、字段｜失败：一个 phase 段内提交数大于 1；｜或授权与提交同量级增长；｜或提交发生在审查之前｜负责人：N11
  来源：U-004、U-005①；｜F-41、F-42、F-43、F-44
  用例：在真实任务上跑完至少两个 build-code phase，数提交条数与授权条数
- **AC-C05AUD-14**｜通过：PR 在合并前真实存在且 `pr.url` 可读；｜面向用户输出含该地址；｜同一次执行流内完成合并与归档；｜`gh pr view` 的 `createdAt` 早于 `mergedAt`；｜不新增 close 子命令或第二次确认；
  全过程不等用户回话｜失败：PR 只在合并不成立；｜或链接没有推送给用户；｜或停在 `partial` 等用户回话；｜或新增第二次确认与新子命令｜负责人：N12｜来源：U-004、U-005②、U-011①；
  F-51、F-52、F-53、F-54
  用例：执行一次收尾，看 PR 是否在合并前真实存在、链接是否已推送给用户、且没有阻塞
- **AC-C05AUD-15**｜通过：该处改动被停下，并读到越界文件与符号、授权原文位置、缺哪一条确认；｜不出现实施方自证的"已有裁决覆盖"；｜材料里"已确认"指向的原件 0 个 404；｜人确认次数不增；
  动手前显式引用项目自己声明的类别；｜受保护类别停下，纯文档类越界继续做并登记｜失败：越界由实施方自己认定后放行；｜或"已确认"指向的原件打不开；｜或人确认次数增加；
  或工具仓库自定类别清单｜负责人：N14｜来源：U-008①、U-011②；｜F-23、F-24、F-25、F-60
  用例：人为把某 Phase 的声明写集与授权范围做成不一致（声明只含 A 却准备改 B），看流程怎么处置
- **AC-C05AUD-16**｜通过：每个被改文件的小节标题数前后一致、原标题逐字仍在；｜编辑说明能读到"涉及文件与标题清单"；｜`runtime/interface/safe-write.mjs` 逐字未改；｜标题丢失时先恢复原文件再重新编辑
  失败：标题被旧锚点替换吃掉；｜或靠手工补标题掩盖；｜或为兜住它新增函数、命令、检查链｜负责人：N15｜来源：U-010③；｜F-17、F-56
  用例：在真实任务里发生至少一次会触碰小节标题的批量改写
- **AC-C05AUD-17**｜通过：每一节都能被判为"build-plan 写 spec 与 phases 时要读"，节内一段一主题、结论在前、节首说明本节回答什么问题；
  写集表与 AC 表逐行保留在主文；只是证明与过程的内容以指针代替，指针能定位到原件。
  失败：出现把多个主题硬挤成一句而读不出结论；或把写集表与 AC 表整块搬进外置件，导致 build-plan 必须读外置件才能取到接口。
  负责人：N16｜来源：U-014①、U-014③、U-015；F-65、F-67、F-68。
  用例：读下一个真实任务的 `decision-log.md`，逐节问"build-plan 写 spec 与 phases 时要不要读它"，再核表与指针的去向。
- **AC-C05AUD-18**｜通过：五类外置面（已知事实表、更正与过程记录、未确认项汇总、写集逐条对账、覆盖矩阵逐项结论）各自有具名外置件与到达条件；｜主文只留结论与指针；
  外置划分**按内容判断**且依据可核（该节是否为 build-plan 直接消费）；**不使用篇幅阈值**（U-015）｜失败：五类中任一类仍在主文铺开；｜或以篇幅数字为由删内容具名理由；｜或外置件建了但主文 0 引用｜负责人：N16｜来源：U-014①；
  F-67、F-68
  用例：读下一个真实任务的 `## 外置事实索引`，逐条核外置面与**内容判断依据**（不核篇幅）
- **AC-C05AUD-19**｜通过：每个 phase 文件名形如 `P<n>-<任务或工作包短名>.md`；｜phase 数与"独立可交付、可验收"的划分一致；｜工作包多于可交付物而拆分时，spec 里写明为什么拆｜失败：文件名只有 `P1`、`P2`；
  或 phase 数明显多于工作包且 spec 没有说明｜负责人：N17｜来源：U-013、U-014②；｜R-016、R-017
  用例：读下一个真实任务的 `phases/`，看文件名与 phase 数量
- **AC-C05AUD-20**｜通过：外置件位于主文索引给出的基准目录且按绝对路径可打开；｜审查材料解析路径能读到外置原件（N18 定范围后核）；｜主文引用外置件的位置能被 `grep` 命中
  失败：外置件建了但不在被审查也读不到的路径上；｜或同一原件在 worktree 与任务库之间出现两个不一致的路径｜负责人：N18｜来源：U-014①；｜F-68、第 20 路第 7 节
  用例：读下一个真实任务的外置件与主文，看外置件是否真的可达、可读

覆盖矩阵的逐项结论外置到 `coverage-matrix-itemized.md`。口径收窄：逐条穷尽义务只覆盖 R 与 U 两级；发现编号、风险、OI 三类已有各自唯一落点，不再逐条抄进矩阵。
本任务内只允许的机械验证另记，只证明"事实能否浮到边界"，不给通过结论。

完成判据：每条承诺有可观察用例、成功与失败边界、证据或具体缺口、承接负责人及对应来源；覆盖矩阵逐项有事实、处置与落点或缺口。

## 未决项

本节回答还没定的事、谁定、下一步做什么。**结论**：8 条（OI-001 到 OI-008），其中 3 条已关闭、5 条 open。原 `## 冲突待裁` 的 9 条已全部裁定，并入本节下方的已裁列。

- **OI-001**｜问题与来源：投递时点问题——两份方法正文的投递发生在 card-05 首次上下文压缩之前；｜若把"进入上下文"狭义化为"执行该步时仍在窗口内"，N6 与穷尽判据那组的结论会翻转。｜来源：F-36
  状态与处置：open，缺压缩摘要原文，无法判定｜下一步：工作包③复核时补取压缩摘要；｜确证不了则如实保留"两种读法并存"
- **OI-002**｜问题与来源：跨阶段通病清单的真实成立范围——第 6 路判四类为五阶段通病，但其判据已被裁决推翻五组中的四组。｜来源：F-19、F-35｜状态与处置：open，不得照原清单开修
  下一步：工作包③用正确判据重判后再定
- **OI-003**｜问题与来源："问题回流"的承载位置
  状态与处置：closed（U-008② 与 N7 裁决）：按归属分流，别的项目的问题记在别的项目里，workflowhub 的问题记在工具仓库根 `Improvements.md`，不新建位置｜下一步：已收敛，N7 按此实施
- **OI-004**｜问题与来源：N3 的取舍——删掉"未落项"口径，还是在模板里定义它｜状态与处置：closed（U-008③ 与 N3 裁决）：删掉悬空名，对账落到模板现有小节，不新增节；
  穷尽义务收窄为 R 与 U 两级｜下一步：已收敛，N3 按此实施
- **OI-005**｜问题与来源 N1 的接线范围——哪些检查接、哪些如实登记"不接＋理由"。来源 F-21｜状态与处置 open，须逐项过"不新增门"这道筛｜下一步 模块收敛后进 spec
- **OI-006**｜问题与来源 card-05 那 8 条"不符合"要不要另开任务修。来源 F-30、F-31｜状态与处置 open，本任务已定为非目标｜下一步 用户决定；本任务只如实登记
- **OI-007**｜问题与来源：`.codex/hooks.json` 的 `SessionStart`、`UserPromptSubmit`、`SessionEnd` 三个钩子指向已被 ADR-0024 主动删除的脚本，属残留声明。｜来源对抗性方向检查 R4
  状态与处置：open（如实登记），本任务不修｜下一步：用户决定是否另开任务；｜本任务只登记
- **OI-008**｜问题与来源：R-011 的落地范围缺口——`docs/adr/0037:18` 把两个简明语言标准的落地范围限定为 workflowhub 自己的文档输出物、不含与用户的对话过程，而 R-011 要的正是沟通过程；
  正式扩范围属 ADR 级决定｜状态与处置：open（如实登记），本任务只登记不处置，已在 N6 落"读到方法正文"，并把判据改写成 AC-C05AUD-08 的可复现度量｜下一步：用户与 ADR 决定是否扩范围；
  本任务按 AC-C05AUD-08 观察

已裁列：9 条冲突全部已由父代理裁定、遗留 0 条。要点如下。

1. `workflows/build-code/SKILL.md` 的 owner 是 N1，其余组改动作为追加 hunk 并入 N1 一次落笔，N13 的 hunk 作废。
2. 项目铁律原文在被审计的宿主项目 `PaperBuilder/AGENTS.md:10` 与 `:13`，不在本任务写集内，材料不得声称工具仓库引用了它的行号。
3. N12 的"不阻塞"以用户口径 U-011① 为准，不采纳"未确认前不进入第二段"。
4. `runtime/interface/safe-write.mjs` 不改，`missingSectionHeadings` 及其测试作废。
5. 两个 decision-log 文件的 owner 是 N3，N4 与 N5 只交句稿。
6. `tools/cli/check-decision-log-chain.mjs` 处置＝不改、不接线并附理由，owner 是 N1。
7. `tools/cli/run-checks.mjs` 从 N1 影响面移除，只留在"明确不动＋理由"清单。
8. 行号对齐到单一取值：`stage-runtime.mjs` 用 `:533-545`；`stage-handoff` 兜底句由 36 改为 38 并显式登记；N13 的 `:20-21` hunk 作废。
9. `raw/06` 七类中只有 C4 的判据被 `raw/09` 推翻，C1、C2、C3、C5、C6、C7 一律"未确认"，归属是 N2。

逐条裁定依据与落点外置到 `unconfirmed-summary.md`。

完成判据：未决项在一张表中一条一行，逐项有问题、来源、真实状态、处置或下一步及解决者；零问题写无。

## 风险与延期交接

本节回答有什么风险、谁在哪个阶段处理。**结论**：9 项风险与延期，质量缺口逐项可见。
每条格式：`内容｜触发与后果｜处理阶段与 owner｜来源`。

- N11 动公共运行时｜授权粒度由"绑 HEAD"改为"绑分支＋阶段"，所有任务的提交授权行为随之变化，旧记录无阶段字段者保持原样｜处理 build-code，N11 实施者；spec 须写明"旧记录零影响"的验证方式｜来源：F-41、F-44
- N8、N9、N10 属"加义务"｜与 U-002"不加新关卡"有张力，若被读成门会阻断推进｜处理 build-plan 收口与 verify-code，已定为产出要求而非门｜来源：U-009、U-010
- N14 与"不新增审批门"张力最大｜要求动手前读取并引用项目自己声明的类别，可能被读成新审批；项目未声明类别时约束为空｜处理 build-code，N14 实施者，未声明时如实登记为"未声明"｜来源：U-011②
- N16 与 ADR-0037 的边界｜让篇幅与结构占比成为事实记录，若做成判定或评分器即违反 ADR-0037 的明文否定｜处理 全部材料作者，只显示数字、不判定通过与否｜来源：U-014①；`ADR-0037:20`
- N7 回流承载位置｜现行规则只允许写"目标项目根"，改为按归属分流后写工具仓库根 `Improvements.md`，不新建位置｜处理 阶段末交接，N7 实施者｜来源：U-008②；F-32
- N17 划 phase 的判据｜"独立可交付、可验收"需要具体判据，工作包与 phase 不一一对应时容易走回按工作包硬切｜处理 build-plan，N17 实施者，拆分必须在 spec 写明理由｜来源：U-014②；R-016、R-017
- 验收周期｜验收由用户另跑一个真实任务判定，本任务内不自证；交付后到判定之间材料须保持可回读｜处理 交付后由用户执行｜来源：U-002
- 17 块一次做完（U-007）｜涉及 48 行写集，其中 5 个在公共运行时或通用方法文本上，改动面大于前两轮｜处理 spec 与 build-code，主会话在 spec 里分 Phase｜来源：U-007
- 34 条未确认项｜四份收敛材料自报的未确认原样保留，不写成已定｜处理 spec 与 verify-code，各模块实施者｜来源：`unconfirmed-summary.md`；F-61

**质量边界**：材料、实施、测试、独立审查与物理交付分别报告；未执行保留具体缺口，用户确认引用外置原件。
**high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`，依据是 U-011① 与 U-009② 均由用户逐字声明。

完成判据：每项风险或延期列触发、后果、阶段、owner 与来源；质量缺口逐项可见，高风险分类与不可逆授权分别有真实依据。

## 退役登记

本节回答哪些旧口径被取代、谁决定。**结论**：4 行，全部为"建议，决定人＝用户；未获批准前不声称已退役"。

- 日期：待用户确认（无日期）｜对象：`docs/archive/2026-07-13-unstaged-review-snapshots.md:5` 的"整个 stage 只提交一次"口径｜为什么退役：由 N11 的"每 phase 一次加 verify-code 收尾一次完整提交合并"承接（U-005①）｜谁决定：建议，决定人＝用户，未获批准前不声称已退役｜原需求编号：R-013
- 日期：待用户确认（无日期）｜对象：`runtime/interface/git-authorize.mjs:608` 作为 phase 内唯一绑定口径｜为什么退役：收窄为"绑分支＋阶段"，无阶段字段的旧记录逐字保持 HEAD 严格相等｜谁决定：建议，决定人＝用户｜原需求编号：R-013
- 日期：待用户确认（无日期）｜对象：`workflows/verify-code/isolated-browser-qa.md`（264 行孤儿旧副本）｜为什么退役：其机器证据通路 `browser-qa-evidence.v1` 与 `l3-e2e-report.json` 已从 runtime 整体移除，N9 登记为"建议退役、未获授权"｜谁决定：建议，决定人＝用户｜原需求编号：R-015
- 日期：待用户确认（无日期）｜对象："建 PR 与合并必须同一次 close 内完成"这一实践口径｜为什么退役：N12 改为收尾两段式（先建 PR、推链接、再合并）；该口径全仓 0 命中，故此项仅在确认它曾有成文口径时才登记｜谁决定：建议，决定人＝用户｜原需求编号：R-014

完成判据：实际退役每行有日期、对象、理由、决定人与原需求编号去向；没有真实授权不声称已批准删除。

## 外置事实索引

本节回答每类过程内容外置到哪、什么条件下读、主文留什么。基准目录＝任务库根 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012`；
下列路径相对该目录解析，不能按 worktree cwd 解析。
被精炼的原件是本次任务的 `decision-log.md`（worktree 内 `specs/workflowhub-card05-stage-defect-audit-20261012/`），682 行、259,217 字节，sha256 `5f7ff9b39b052c1c0f20aa8a59881126b9cebf1dc80029da5ddf0a5813f44b7d`；本文件是它的精炼主文。
每条格式：`外置件｜到达条件｜主文留什么`。

- `quality/evidence/decision-log-refs/facts-index.md`｜需核对 68 条已知事实、3 条假设与推翻依据、以及全部更正与过程记录时读｜留 五条会改变 build-plan 写法的关键事实与指针
- `quality/evidence/decision-log-refs/unconfirmed-summary.md`｜需核对 34 条未确认项、9 条冲突的全部裁定与最小机械验证时读｜留 8 条未决项状态与 9 条已裁结论要点
- `quality/evidence/decision-log-refs/coverage-matrix-itemized.md`｜需核对覆盖矩阵逐项结论（每条 R 与 U 的事实、处置与落点）时读｜留 口径收窄结论与指针
- `quality/evidence/decision-log-refs/write-set-reconciliation.md`｜需核对写集逐条对账（每行完整"改什么"原文、行号待核准项、owner 归一化依据）时读｜留 48 行写集表本体
- `quality/evidence/decision-log-refs/module-decision-blocks.md`｜需回读每块模块的五字段全文（决定、为什么、否掉了什么、后果与风险、影响面）时读｜留 17 块的决定要点、用户口径与限制
- `quality/evidence/decision-log-refs/direction-review-dispositions.md`｜需核对对抗性检查 17 条风险、5 条 Kill、7 条 Recycle，以及方向审查 11 条发现的逐条处置时读｜留 处置计数与推翻项结论
- `quality/evidence/raw-requirements/user-message-20261012.txt`｜需核对用户第一条原话逐字时读｜留 逐字原文与 sha256
- `quality/evidence/raw-requirements/user-message-20261012-b.txt`｜需核对 U-001 两类现场指认缺陷与"先诊断再定"逐字原文时读｜留 逐字原文与 sha256
- `quality/evidence/raw-requirements/user-message-20261012-c.txt`｜需核对 U-004 三项新需求逐字原文时读｜留 逐字原文与 sha256
- `quality/evidence/raw-requirements/user-message-20261012-d.txt`｜需核对 U-006 完整测试逐字原文时读｜留 逐字原文与 sha256
- `quality/evidence/raw-requirements/user-message-20261012-e.txt`｜需核对 U-013、R-016、R-017、R-018 逐字原文与 sha256 时读｜留 逐字原文与 sha256
- `quality/evidence/raw/01-standard-procedure.md` 到 `raw/20-decision-log-verbosity-rootcause.md`（20 份）｜需回读任一路取证原件时读，路次与路径对应见 `facts-index.md` 的来源栏｜留 路次结论摘要
- `quality/evidence/decision-log-refs/convergence-A1-N1-N2.md`、`convergence-A2-N3-N5.md`、`convergence-B-N6-N10.md`、`convergence-C-N11-N15.md`｜需回读四组模块收敛件时读｜留 方案、替代、验收、风险摘要
- `quality/reviews/2026-10-12-005-make-decision-direction.json`｜需回读异源方向审查原件、真实执行事实与 11 条发现时读｜留 审查状态与处置计数
- `quality/reviews/2026-10-12-012-make-decision-detail.json`｜需回读细节审查发现与逐条处置时读｜留 发现编号与处置结论
- `quality/evidence/raw/19-stage-end-spec-analyze.md`｜需核对第 14 步只读一致性核对结论时读｜留 缺口结论

**主文与指针的划分判据**（U-014①）：逐步节问一句——build-plan 写 spec 与 phases 时要不要读它？要读就留在主文，可以精简表达但不删必要信息；只是证明与过程的，外置成原件、主文留指针。

按这条判据留在主文的内容：

1. `## 要改哪些文件` 的 48 条写集记录：build-plan 逐 Phase 分配写集与 owner 时要逐条读，不能只给指针。
2. `## 验收面` 的 20 条 AC：AC 编号、通过条件与失败条件是 build-plan 写 Appendix A 与 Phase 契约的直接输入。
3. `## 原始需求` 的 18 条 R 与 `## 需求变更记录` 的 14 条 U：逐条来源与落点是 spec 的来源绑定与 N3、N4、N5 的对账对象；原义逐字已外置。
4. `## 模块清单` 的 17 块决定要点：build-plan 据此划 Phase 与写全局设计；每块的决定、为什么、否掉了什么、后果与风险、影响面全文外置。
5. 本节索引的 16 条指针与 `## 未决项` 的已裁列：它是全部过程原件的唯一到达条件表，build-plan 需要据此在写材料时按条件回读原件。

按同一条判据外置的内容：68 条已知事实、更正与过程记录、34 条未确认项、9 条冲突的全部裁定、覆盖矩阵逐项结论、写集逐条对账明细、14 块五字段全文、对抗检查 29 条判据与方向审查 11 条处置——这些是证明与过程，build-plan 只在需要核对时才按指针回读。

完成判据：每条指针说明基准目录、唯一原件定位、到达条件与主文留什么；缺失逐项说明；每类事实只留一份原始件。
