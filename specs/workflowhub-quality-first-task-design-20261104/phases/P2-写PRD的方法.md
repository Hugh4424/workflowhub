# Phase P2 — 写 PRD 的方法与模板改成新形状

本文件写给 build-code 的开发、测试、审查三个独立上下文，以及后续维护者。
读完要能找到这一 Phase 改哪几处、三个提交怎么切、怎么判真假、卡住时回谁。
开发改文件；测试只读重放命令；审查按原判据读真实字节；三者互不代判。

> 写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」是本文件唯一标准。
> 本文件不复述标准，只说明自己的例外。
> 例外一：文末「机器字段（校验器用，人可跳过）」的标题与标签逐字读取，不改名。
> 例外二：任务卡人读层用 8 个固定问题作答；卡末 17 个机器字段按模板原词保留。
> 例外三：验收判据只在 `spec.md` Appendix A；本文件引用编号与原词，不写第二份判据。
> 例外四：路径与整条命令逐字保留，允许超过 80 字；其余正文一句一行不超过 80 字。

本文件的词先解释。
「PRD」是规划用的产品需求文档；本 Phase 改的是写它的方法与模板，不改任何一份已有 PRD。
「任务卡」是 PRD 里一张用户能看到的结果，一张卡一页；本 Phase 要把它从 16 字段改成 6 字段。
「波次」是同批可并行、按先后排组的任务分组；它只排任务先后，不切作者。
「写集」是本 Phase 允许改的精确文件路径，逐条列，不写目录、模块名或通配。
「G-2」是纯文档、无新增运行行为的验证形状：给可重放的客观检查与独立读者，不造目标 RED。
「判定器」是 `ORACLE-…` 编号，指判真假的那一条断言或那一条读数。
「删除证明」是证明旧形状清到零的三项读数：包清单未变、无代码引用、引用者清单为空。
「Supersedes」是新件声明它替代哪份旧件的字段；本 Phase 只在模板里保留这个指针位。
「三步提交」指本 Phase 按 D1 切三刀：模板与字段、步骤、删旧清尾，各一个提交。

## 哪些节必须写，哪些可以省？

| 二级节 | 状态 | 本文件怎么写 |
| --- | --- | --- |
| 哪些节必须写，哪些可以省？ | 必填 | 本表，落盘保留 |
| 这一 Phase 交出什么？ | 必填 | 九项写实 |
| 这一 Phase 怎么验收？ | 必填 | 三笔账、预算总账、五条验收 |
| 为什么现在做，依据是什么？ | 必填 | 结果、非目标、区别、依据 |
| 开始前读什么？ | 必填 | 锚点表，逐条给读取时机 |
| 每个文件由谁改，先做什么？ | 必填 | 六条路径与三个提交逐条给 writer |
| 怎么验证？ | 必填 | 四要素、RED/GREEN、风险与回滚 |
| 下一消费者拿什么继续？ | 必填 | 交回清单与未完成项 |
| 每张任务卡怎么写？ | 必填 | 卡内约定与四张卡 |
| 机器字段（校验器用，人可跳过） | 必填 | 文件末，逐字保留 |
| 验收 Phase 才能做的检查 | 不写 | 本 Phase 不是末验收 Phase，整节删除 |
| 效果判据怎么写？ | 不写 | 模板写作脚手架，落盘删除 |
| 补充材料 | 可选 | 只放原件指针，不复制正文 |
| 哪些内容删掉也不影响验收？ | 不写 | 没有临时提示，整节删除 |

## 契约头（人读；机器值在文末）

| 项 | 值 |
| --- | --- |
| Phase 编号与标题 | P2 — 写 PRD 的方法与模板改成新形状 |
| 语义锚点 | `spec.md#实现设计（全局权威）` 的「P2 的锚点」第 1–16 条 |
| 写入集 | `workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`skills/spec-prd/SKILL.md`；`skills/spec-prd/templates/prd-template.md`；`skills/catalog.yaml`；`tests/contract/prd-card-shape.test.mjs` |
| 依赖 | P1；等 P1 交回后开始，写集仍互斥 |
| 消费者 | PRD 作者与 build-prd 协调者；P3 的重写者；P4 的提交与覆盖核对 |
| 互斥边界 | 本文件只列本 Phase 的六条路径；对方写集不在本文件出现，也不在本文件改 |

五条是既有文件，一条是新增测试；新增文件也在仓内，登记见任务 1。
六条路径切成三个提交：模板与字段、步骤、删旧清尾，逐条写在「每个文件由谁改」。
本 Phase 在 P1 交回后开始，四点串行：P1 → P2 → P3 → P4。

## 这一 Phase 交出什么？

写 PRD 的作者按改后的方法与模板，能一张卡一页地写，四行验收能判真假。
读者不翻别的文件就能开工；任务地图是四列表；命令类、判定器、证据字段与行号清干净。

- **本 Phase 结果**：PRD 方法仍是六步、两次内容调用、一个作者写整个 PRD 文件、
  一次审查；任务卡从 16 字段收到 6 个 plain 字段；地图固定四列；
  改动切成三个可单独回退的提交；版本与消费面同步。
- **非目标**：不改写计划的方法与模板（那属于 P1 的写集，本文件不列其路径）。
  不改 PaperBuilder 的规划 PRD（P3）。不碰外部仓库的只读卡。
  不改 `skills/spec-prd/skill-bundle.json` 的文件清单，不新增校验器或字段。
  不按波次切作者。
- **改动前**：实读基线如下（认证 worktree，HEAD 17e78a09；核对方式见「开始前读什么？」）。
  模板：「16 个既有字段」3 处（`:24`、`:79`、`:81`）、「下列16字段」1 处（`:75`）、
  「判定器」1 处（`:88`）、任务地图是 1 行散文（`:55`）、「实测记录」1 节（`:102`）；
  6 个 plain 字段名 0 处；`.py:123` 形式 0 处；头部已引 material-writing 1 处（`:5`）。
  技能正文：「16 字段」2 处（`:51`、`:73`）、「16字段」1 处（`:53`）、
  「16字段卡」1 处（`:85`）。
  版本：`skills/catalog.yaml:416-424` 的 `local_version` 是 `1.0.0`，
  `last_reviewed_at` 是 `2026-07-14`。
  测试：`ls tests/contract | grep prd` 只有 `build-prd-review-contract.test.mjs` 一条，
  没有断言 PRD 字段数的测试。
- **改动后**：任务卡 6 字段一页；地图四列；判定器、状态表、命令与实测记录、
  证据字段、三种行号与 16 字段声明清零；版本升到 1.1.0；新增一条定向断言守这些形状。
- **与相邻 Phase 的边界**：P1 交回后本 Phase 才开始，本 Phase 只交方法与模板的形状
  与三个提交；P3 等本 Phase 交回后用这个形状重写外部 PRD，P4 最后只读核对提交与覆盖。
- **主要风险**：6 字段又写成第二份规格，例如把判定器、命令或证据字段留在卡里；
  或三个提交切歪，混入无关路径。
  若因此返工，按 `spec.md` 方案 4 的做法退回纯 grep 加证据，
  `AC-PRD-001` 的通过条件不变。
- **下一步**：P1 交回后，build-code 按任务 1 到任务 4 的顺序实施，三刀各一个提交。
  任务 2 结束时打提交 1，任务 3 打提交 2，任务 4 打提交 3。
- **动手前必读**：见「开始前读什么？」表；先读流程，再读技能正文，最后读模板与版本。
- **未决事实**：
  一是 `phases/index.md` 由主会话写，不在本 Phase 写集内；影响是校验器要求索引
  写入集与本文件逐字一致；矛盾由主会话按本文件逐字对齐。
  二是 `AC-MIG-002` 的词表按本 Phase 加严补上「16 个既有字段」与「下列16字段」；
  加严的原因是模板真实写法与 AC 原词不同，不补会判漏；通过条件仍是清零，
  不改判法；规格同步归规格作者。
  三是 `execution_budget` 四项未在决策日志给出；owner 是 make-decision。
  四是新增测试是唯一的真实 RED；若审查判为仪式，按 spec 给的退回路径改成纯 grep，
  通过条件不变。
  五是本文件按执行顺序把四个任务重排为模板、字段、步骤、清尾；
  spec 追踪表仍按旧任务号指 AC-PRD-001 与 AC-PRD-002，追踪表同步归规格作者。

## 这一 Phase 怎么验收？

先算三笔账，再写验收；三笔账算不出来就不写。

- **成本账**：逐条引用 `spec.md` Appendix A 的成本七字段与资源来源，按下式汇总。
- **资源账**：五条验收要的读者、执行单元、模板、目录与两条检查都已存在，
  唯一的造件是新增测试文件，它在本 Phase 写集内。
- **范围账**：五条都证本 Phase 自己的交付；P3 用形状、P4 核对提交，都只消费原件。

### 验收活动预算怎么算？

串行和 95 活动分钟；读者级一条 20，命令级四条相加是 75。
并行最大取 40：命令级由两个执行单元分摊后是 40 与 35，读者级 20 可同时进行。
两组并行时取 40；再加共享准备 10 与重试预留 15。
合计 40 + 10 + 15 = 65 活动分钟；95 是不并行的上界。
共享准备指统一命令、cwd、包根与日期各一次；重试预留按每条 `retry_cap=1` 记一次。
`estimate_min` 与 `hard_cap_min` 只是活动成本估算，不是时间盒，也不以到时触发停止；
停止只由各条验收的失败信号触发。用户等待与审查等待单列，本 Phase 没有用户确认。

- `acceptance_cost_total=65 active_min`：估算，不是实测。
- `phase_budget={soft_min:120,hard_min:240,variance_threshold:1.5,source:provisional}`：
  120／240 分钟与 1.5 未取得 make-decision 的真实确认，按模板示例记 provisional，
  回原 owner 校准；阈值只帮复盘，不是机器退出门。
- `execution_budget=unknown`：四项取不到真实答复，owner 是 make-decision；
  影响只落在 build-code 执行期，本 Phase 验收不消费它。

### 验收 1：PRD 模板与技能只剩 6 字段、4 列，七类内容清干净（AC-PRD-001）

**目标**：任务卡 6 个 plain 字段、地图 4 列；判定器、命令与实测记录、状态表、
证据字段、16 字段声明与三种行号（`.py`、`.ts`、`.tsx`）清零。
本条按本次审查加严，判据仍归 `spec.md` Appendix A，规格同步由规格作者改。
**怎么操作**：在认证 worktree 跑：
`npx vitest run tests/contract/prd-card-shape.test.mjs` 退出 0；
`grep -rc "16 个字段" skills/spec-prd/` 全为 0；
模板内 `grep -c "判定器"`、`grep -c "状态表"`、`grep -c "## 实测记录"`、
`grep -c "证据字段\|证据（原件"` 都为 0；
`grep -cE "\.(py|ts|tsx):[0-9]+"` 为 0；
地图表头 `grep -n "^| 任务 | 结果 | 依赖 | 波次 |"` 有输出；
6 个字段名各出现一次；头部 `grep -n "material-writing"` 有输出。
**什么条件**：认证 worktree、Node 按现场版本、仓内 vitest；不需要网络。
**怎样算通过**：测试退出 0；各类计数为 0；4 列与 6 字段各就位；头部有引用。
故意弄坏一处：分别把 16 字段、判定器、状态表、实测记录、证据字段、
`.py`／`.ts`／`.tsx` 行号各注入一处残留，测试每次都必须变红；任一次仍绿即未覆盖。
**真跑还是替代**：真跑；测试是唯一先写后绿的断言，其余是命令读数。
**谁判与证据**：未参与实现的独立执行单元，只读文件字节与测试输出；
结论落 `planned: 任务根/quality/tests/P2-prd-shape.txt`，并与 RED、GREEN 原件互相指认。
**成本**：executor=独立执行单元；estimate_min=20；hard_cap_min=45；
resources=改写后的模板、技能文件与新断言；observation=每条 grep 读数与退出码；
retry_cap=1；evidence_tier=命令级。
**资源来源**：仓内既有文件；新断言文件在同一写集内。
**失败回修与停止**：任一计数非 0 或测试非 0 且指向模板时，回本卡作者改同一处；
原因不明报主会话，不删断言求绿。

### 验收 2：六步、两次内容调用、一次审查与一次作者都没被改坏（AC-PRD-002）

**目标**：流程仍六步、两次内容调用；一个作者写整个 PRD 文件，波次只排任务先后；
一次审查只审四件事。
**怎么操作**：
`grep -n "一个作者"`、`grep -n "整个 PRD 文件"`、`grep -n "一次审查"`、
`grep -n "两次"` 在两个技能文件有输出；
`grep -c "按波次分作者"` 为 0，出现即失败；
`grep -n "拆卡\|实现可行性\|范围\|验收"` 命中审查四件事；
`node -e` 读 `workflows/build-prd/steps.json`，断言 6 步、末步 closeout；
`npx vitest run tests/contract/build-prd-review-contract.test.mjs` 退出 0。
**什么条件**：认证 worktree 与仓内测试；不需要网络。
**怎样算通过**：五组读数齐；步数 6；测试退出 0。
故意弄坏一处：把「一个作者写整个 PRD 文件」改成「按波次分作者」后，
同组命令必须变红；仍绿说明断言没覆盖这条。
**真跑还是替代**：真跑；退出码只证结构与既有字串，不证方法有效。
**谁判与证据**：未参与实现的独立执行单元，只读字节与测试输出；
结论落 `planned: 任务根/quality/tests/P2-prd-flow.txt`。
**成本**：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
resources=两个技能文件与 build-prd 流程；observation=五组读数、步数与退出码；
retry_cap=1；evidence_tier=命令级。
**资源来源**：仓内既有文件与测试，不新造工具。
**失败回修与停止**：调用次数被改成三次、审查改成逐条格式审、步数改变、
出现按波次分作者，任一出现即停手回本卡作者；测试红且指向既有字串时先补字串。

### 验收 3：一张卡一页读完，四行验收能判真假（AC-PRD-003）

**目标**：读者只读模板里的一张样板卡，能复述目标、怎么操作、什么条件、怎样算过。
**怎么操作**：读者复述四行，再核四行里是否写了「故意弄坏一处必须失败」，
以及一页读完的边界；不写命令、不写证据。
**什么条件**：改写后的模板与一张样板卡；不需要额外环境。
**怎样算通过**：四行复述齐；有一处负控；无命令与证据字段；一页内读完。
故意弄坏一处：把四行改回一段散文，读者必须判不出四行。
**真跑还是替代**：真跑，读者读当前字节；不制造 RED。
**谁判与证据**：未参与写作的独立读者，开发与审查改完后判定；
结论落 `planned: 任务根/quality/tests/P2-card-readback.md`。
**成本**：executor=独立读者；estimate_min=20；hard_cap_min=40；
resources=模板与样板卡；observation=四行复述、负控与页内边界；
retry_cap=1；evidence_tier=读者级。
**资源来源**：本次改写稿，不新造样张。
**失败回修与停止**：复述缺项或没有负控时回本卡作者改样板卡；
写成命令或证据字段一律删掉，停手报主会话。

### 验收 4：版本与消费面同步，改完还能被既有检查器读（AC-PRD-004）

**目标**：`catalog` 的版本字段已升；包清单仍两项且两文件在；两条检查退出 0；
三个提交各只触自己的写集，父提交旧字节可读回。
本条按本次审查加严：从只核整个 Phase 写集，改成逐提交核专属写集与父提交旧字节。
**怎么操作**：读 `skills/catalog.yaml:416-424`，
断言 `local_version` 不是 `1.0.0`、`last_reviewed_at` 为本次日期；
`node -e` 读 `skills/spec-prd/skill-bundle.json`，断言清单仍两项且两文件存在；
`node tools/cli/check-skill-consistency.mjs --root <绝对包根>` 退出 0；
`npx vitest run tests/n2-skill-catalog-portability.test.mjs` 退出 0；
对三个提交各跑 `git show --name-only --format= <sha>`，与各自的专属写集逐条对；
再跑 `git show <sha>^:<路径> | shasum -a 256`，与清尾前记录的旧字节哈希相等。
**什么条件**：认证 worktree 的本地 git；不推送远端；不建分支、不 revert。
**怎样算通过**：版本已升；清单两项且文件在；两个退出码为 0；
三个提交各自的路径清单与专属写集相等；旧字节哈希相等。
故意弄坏一处：把版本改回 `1.0.0`，或在提交 2 里夹带模板改动，
同一组断言必须变红。
**真跑还是替代**：真跑；一致性检查只证目录与登记一致，不证 PRD 质量。
**谁判与证据**：未参与实现的独立执行单元，只读字节与输出；
结论落 `planned: 任务根/quality/tests/P2-version.txt`。
**成本**：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
resources=catalog、bundle、三个提交与两条检查；observation=版本字段、清单项、
路径清单、旧字节哈希与退出码；retry_cap=1；evidence_tier=命令级。
**资源来源**：仓内既有文件与本地 git；不新增第三方依赖。
**失败回修与停止**：版本未升、清单指向不存在的文件、任一检查非 0、
任一提交通道混入无关路径，都停手回本卡作者；不为变绿改检查器或删清单。

### 验收 5：P2 侧的 16 字段清尾，删除证明三件齐（AC-MIG-002）

**目标**：旧形状读到零，覆盖 16 字段、判定器、状态表、命令与实测记录、证据字段、
三种行号；包清单未增未减；仓内无代码引用被删字段名；清尾单独一个提交。
本条按本次审查加严：读数列从 16 字段扩到五类内容与三种行号。
**怎么操作**：
`grep -rc "16 字段\|16 个字段" skills/spec-prd workflows` 全为 0；
按本 Phase 加严加跑 `grep -rc "16 个既有字段\|下列16字段" skills/spec-prd`，也全为 0；
`grep -rc "判定器\|状态表\|证据字段\|证据（原件" skills/spec-prd` 全为 0；
`grep -rcE "\.(py|ts|tsx):[0-9]+" skills/spec-prd workflows` 全为 0；
`grep -rc "## 实测记录" skills/spec-prd` 全为 0；
`node -e` 读 `skills/spec-prd/skill-bundle.json`，断言清单未增未减；
被删字段名的代码引用为空；引用者清单在 `tests/` 与 `docs/architecture/move-map.json` 各核一次；
清尾提交只触及 `skills/catalog.yaml`、`skills/spec-prd/SKILL.md` 与
`skills/spec-prd/templates/prd-template.md`，并与父提交旧字节哈希对一次。
**什么条件**：认证 worktree 的本地 git；`specs/archive/**` 只读；不需要网络。
**怎样算通过**：各条读数为空或零；bundle 清单不变；引用者清单为空；
清尾提交的路径清单与旧字节哈希符合。
故意弄坏一处：在模板留一处 `.tsx:12` 行号，或把清尾提交夹带模板改写，
同组命令必须变红。
**真跑还是替代**：真跑；清尾单独一个提交，本判据只证清到零，不证删得对。
**谁判与证据**：未参与实现的独立执行单元，只读 grep、清单与 git；
结论落 `planned: 任务根/quality/tests/P2-delete-proof.txt`；三个提交号记入 Done。
**成本**：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
resources=spec-prd 文件、bundle 与三个提交；observation=各条读数为空或零、
路径清单与哈希；retry_cap=1；evidence_tier=命令级。
**资源来源**：仓内既有文件；不新增依赖。
**失败回修与停止**：任一残留即停手回本卡作者补删；清单变化或出现新引用、
清尾提交混入无关路径，停手报主会话，不扩写集、不改判据。

### Phase 的验收要用户本人来判吗？

不需要。Phase 的验收由实现上下文之外的独立执行单元完成。
本 Phase 无用户独占确认；全任务唯一那一次在 `spec.md` 的 Appendix A，归末验收 Phase。
未执行记 `incomplete` 并写约定时点，不写得像已通过。

### 档位使用规则

`incomplete` 只用于本可做但本轮没排上的验收，必须写下次什么时候做。
`unavailable` 只用于外部条件客观不存在，必须写谁提供、什么时候能给。
因标准设计不合理而长期挂着的，属标准缺陷：先改标准，不改判据绕开。

### 改前基线怎么取得？

基线取首次改动之前的字节与读数：认证 worktree 的 HEAD `17e78a09` 当前文件。
本文件已在该 worktree 实读：模板 16 个既有字段 3 处、判定器 1 处、地图 1 行散文、
实测记录 1 节；技能正文 16 字段 2 处；版本 1.0.0 与 2026-07-14；
无 PRD 字段数断言测试。
实施时由任务 1 第一步重读并保存 `planned: 任务根/quality/tests/P2-baseline.txt`；
读数与本节不符时记 `unknown` 与差异，不用新读数覆盖旧事实。

## 为什么现在做，依据是什么？

先改方法，再用新方法改 PRD；PRD 的 16 字段是第二份规格，改完计划侧就该轮到它。

- **结果**：写 PRD 的人一张卡一页、四行验收能判真假，读者不翻别的文件就能开工。
- **非目标**：不改写计划的方法与模板；不改外部仓库；不新增控制面。
- **与其它 Phase 的区别**：本 Phase 只动写 PRD 的方法、模板与版本登记；
  P3 用新形状重写外部 PRD；P4 只读核对。
- **依据**：决策日志 R-002（`:30`）与 B 组、C5（`:124-179`）；
  `spec.md` 的「需求到任务追踪」把 B1、B2、B3、C5 指到本 Phase 的四个任务。

## 开始前读什么？

本节只列本 Phase 实际用到的锚点；没列进来的不要凭印象引用。
先读流程，再读技能正文，最后读模板与版本。
本表读数根是认证 worktree
`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-quality-first-task-design-20261104`。
两处同提交的核对方式：`git -C <worktree> rev-parse HEAD` 与主仓相等，
再对每个文件跑 `cmp`；不同则先记 `unverified` 与差异，不拿主仓读数顶替。

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计（全局权威）` 的「P2 的锚点」 | 逐条落点与改哪一节 | 开工前 |
| `workflows/build-prd/SKILL.md:13-24` | 方法六步与两次内容调用现文 | 写任务 3 前 |
| `workflows/build-prd/steps.json` | 6 步与各步 `observable_result` | 写任务 3 前 |
| `skills/spec-prd/SKILL.md:18-29` | 两步内容方法与调用限制 | 写任务 2 前 |
| 同文件 `:49-55`、`:69-77` | 任务卡与编号写作规则 | 写任务 2 前 |
| 同文件 `:85` | 变更说明里的「16字段卡」措辞 | 写任务 4 前 |
| `skills/spec-prd/templates/prd-template.md:12-24` | P0 必留表与 16 字段声明 | 写任务 1 前 |
| 同文件 `:26-58`、`:71-108`、`:110-139` | 导航、总览、地图、卡、实测记录、风险与变更 | 写任务 1 前 |
| `skills/catalog.yaml:416-424` | 版本与复核日期 | 写任务 4 前 |
| `skills/spec-prd/skill-bundle.json` | 清单两项、无 hash | 写任务 4 前 |
| `tests/contract/build-prd-review-contract.test.mjs:16-45` | 必须保留的既有字串 | 写任务 3 前 |
| `tests/contract/stage-closeout-step-contract.test.mjs:16-31` | 6 步与末步冻结 | 写任务 3 前 |
| `tests/n2-skill-catalog-portability.test.mjs:25` | 模板文件存在性 | 写任务 4 前 |
| `docs/architecture/move-map.json` | 引用者清单核一次 | 写任务 4 前 |

## 每个文件由谁改，先做什么？

- **新增**：`tests/contract/prd-card-shape.test.mjs`，writer 是任务 1，
  消费者是 `AC-PRD-001` 与后续维护；它先写、先跑 RED，再改模板。
- **修改**：五条路径，逐条给唯一 writer、改动与消费者。
  一是 `skills/spec-prd/templates/prd-template.md`，writer 是任务 1，
  后写者是任务 4（只删残留）；消费者是 PRD 作者与 P3 的重写者。
  二是 `skills/spec-prd/SKILL.md`，writer 是任务 2，后写者是任务 4（只删残留）；
  消费者是 PRD 作者。
  三是 `workflows/build-prd/SKILL.md`，writer 是任务 3；消费者是协调者与 P3 作者。
  四是 `workflows/build-prd/steps.json`，writer 是任务 3；消费者是步骤投影。
  五是 `skills/catalog.yaml`，writer 是任务 4；消费者是目录与一致性检查。
- **三个提交**：按 D1 的三步切，各一个提交，可单独回退。
  提交 1「模板与字段」：`skills/spec-prd/templates/prd-template.md`、
  `skills/spec-prd/SKILL.md`、`tests/contract/prd-card-shape.test.mjs`；
  由任务 2 在改完技能正文后打，任务 1 的模板与测试一并进去。
  提交 2「步骤」：`workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json`；
  由任务 3 打。
  提交 3「删旧清尾」：`skills/catalog.yaml`、`skills/spec-prd/SKILL.md`、
  `skills/spec-prd/templates/prd-template.md`；由任务 4 打，后两条只许删除性 hunk。
- **禁止改动**：对方的写集（按 `phases/index.md` 的写入集列逐条，本文件不复述）；
  `skills/spec-prd/skill-bundle.json`（清单未增未减是判据）；
  `tests/**` 除新增那一个文件（其余只读重跑）；
  `docs/architecture/move-map.json`（只读核引用）；`specs/archive/**`（历史原件只读）。

共享路径只在提交 1 与提交 3 重叠，按「先写者交回、后写者接手」串行；
同文件不同字段也算共享，不因为字段不同而并行。
本 Phase 只有一个开发写主，审查与测试只读。

- **读集**：本节「开始前读什么？」表列的全部锚点，加六条写入集的当前字节。
- **定序写主**：任务 1 到任务 4 顺序执行；提交 1 在任务 2 结束时打，
  提交 2 在任务 3 结束时打，提交 3 在任务 4 结束时打。
- **接口符号清单**：`N/A — 无共享代码符号`；接口是六步、两次调用、6 字段与 4 列。
- **合并责任**：三个提交各管一段；冲突回原 writer，不建第二协调账本。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不存进度值。

## 怎么验证？

开工前四要素清单：逐条需求与承接验收写明验证层、命令或数据、预期结果、失败条件。
四项缺一即未开工，不得用占位句补齐。
验证层分两种：读者级是对样板卡的语义复读；命令级是 grep、`node -e`、
定向测试与 git 读回。命令或数据用仓内现有文件、测试与本地 git；
预期结果是本节各条的读数与退出码；失败条件是读数不符、退出非 0、读不出四行、
提交混入无关路径。
本 Phase 只有任务 1 有一条真实目标 RED（新增断言先写后绿）；
其余文档卡走 G-2，只跑结构前置，不宣称 RED。

下表是本 Phase 的门禁现状，不是执行记录；未跑写 `unavailable — 原因`。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 模板 6 字段、4 列、五类与三种行号清零 | T005 | RED | `npx vitest run tests/contract/prd-card-shape.test.mjs` 退出 1 | ORACLE-PRD-SHAPE 与 `planned: 任务根/quality/tests/P2-prd-card-shape-red.txt` |
| 同上 | T005 | GREEN | 同一命令退出 0 | ORACLE-PRD-SHAPE 与 `planned: 任务根/quality/tests/P2-prd-card-shape-green.txt` |
| 技能正文只剩 6 字段 | T006 | 结构前置（G-2，不执行 RED） | `node -e "const t=require('fs').readFileSync('skills/spec-prd/SKILL.md','utf8');for(const k of ['为什么做','交付什么','不做什么','前置','怎么验收','下游'])if(!t.includes(k))throw new Error('missing '+k);if(/16\s*个?\s*字段/.test(t))throw new Error('16-field text remains');console.log('ok')"` 退出 0 | ORACLE-PRD-SHAPE 与 `planned: 任务根/quality/tests/P2-prd-shape.txt` |
| 六步、一个作者写整个文件、按波次分作者为 0 | T007 | RED | `node -e "const f=require('fs');const m=f.readFileSync('workflows/build-prd/SKILL.md','utf8');const s=JSON.parse(f.readFileSync('workflows/build-prd/steps.json','utf8'));for(const k of ['一个作者','整个 PRD 文件','一次审查','两次','拆卡','实现可行性'])if(!m.includes(k))throw new Error('missing '+k);if(m.includes('按波次分作者'))throw new Error('wave-based authorship');if(s.steps.length!==6||s.steps.at(-1).step_slug!=='closeout')throw new Error('step contract broken');console.log('ok')"` 退出 1 | ORACLE-PRD-FLOW 与 `planned: 任务根/quality/tests/P2-prd-flow.txt` |
| 同上 | T007 | GREEN | 同一命令退出 0 | ORACLE-PRD-FLOW 与 `planned: 任务根/quality/tests/P2-prd-flow.txt` |
| 版本已升、三个提交各只触专属写集 | T008 | RED | `node -e "const y=require('js-yaml'),f=require('fs');const c=y.load(f.readFileSync('skills/catalog.yaml','utf8'));const e=c.skills.find(s=>s.name==='spec-prd');if(!e||e.local_version==='1.0.0')throw new Error('version not bumped');console.log(e.local_version,e.last_reviewed_at)"` 退出 1 | ORACLE-PRD-VERSION 与 `planned: 任务根/quality/tests/P2-version.txt` |
| 同上 | T008 | GREEN | 同一命令退出 0 | ORACLE-PRD-VERSION 与 `planned: 任务根/quality/tests/P2-version.txt` |

覆盖上限：本 Phase 的证据只能证文件字节、读数、提交边界与读者复述，
不证 PRD 规划质量。
显式不覆盖：不证 PaperBuilder 的工程质量，不证用户已确认，
不证命令退出 0 等于质量通过。

失败了怎么办：

- **风险**：6 字段被写成第二份规格，判定器、命令或证据字段留在卡里；
  或三个提交切歪，混入无关路径。
- **影响**：读者按 16 字段的旧习惯写；回退时找不到干净的一刀。
- **缓解**：任务 1 先写断言再改模板；任务 4 用补后词表清尾并留删除证明；
  三个提交各自只触专属写集。
- **回滚**：原 writer 只撤回本卡受影响 hunk，保留其它改动与失败原件；
  基准是 `planned: 任务根/quality/tests/P2-baseline.txt` 与父提交旧字节。
- **补救与交接**：无法回滚时由原 writer 修同一 hunk，测试上下文只读复验，
  下一消费者读证据路径与 Done；不静默回退。
- **触发条件**：任一 AC 的读数为反、定向测试非 0 且原因不明、
  提交混入专属写集之外的路径、写入越出六条路径。

完成判据：每条承接验收有实际原件与独立结果；缺什么写缺口与 owner。
`Done` 分两栏：前置只放命令与结构检查；完成条件只写效果。

## 下一消费者拿什么继续？

P3 的重写者、P4 的提交核对与后续维护者按本节接手。

- 交回六条写入集的当前字节与 sha256，七份验收证据与退出码，
  索引在本文件的 `evidence_path`；另交基线文件与三个提交的提交号与路径清单。
- 交回新形状本身：6 个 plain 字段名、4 列地图表头、四行验收的写法；
  一个作者写整个 PRD 文件，波次只排任务先后；P3 照这套写，不另造第五份判据。
- 交回三个提交的边界：提交 1 模板与字段、提交 2 步骤、提交 3 删旧清尾，
  每个提交的路径清单与父提交旧字节哈希可回读。
- 交回未完成项：读者级一条若未执行，记 `incomplete` 与约定时点，不写成通过。
- 交回索引前置：`phases/index.md` 的写入集、依赖与消费者须与本文件逐字一致。

## 每张任务卡怎么写？

每张卡先写 8 个问题的正文，再写机器字段；正文在卡内、在机器块之前。
8 个问题按序：为什么做、交付什么、不做什么、前置、怎么做、怎么验收、证据、
下游（含何时停）。它们落到既有字段，不新增字段：

| 人读问题 | 落到哪些既有字段 |
| --- | --- |
| 为什么做 | 来源 / FR / AC |
| 交付什么 | 输出 / 失败 |
| 不做什么 | 边界 / 禁止改动 |
| 前置 | 输入、依赖 |
| 怎么做 | 动作、文件 / 符号 |
| 怎么验收 | 测试层级 / 技能、场景 / 夹具或服务、RED/GREEN 门禁命令、预期退出码、判定器 |
| 证据 | 证据、覆盖上限 |
| 下游（含何时停） | 停止 / 恢复、完成 |

字段名与顺序以 `runtime/stage/stage-content-contracts.mjs:869-909` 的 17 个为准，
本文件不改名、不新增、不删项。
纯文档卡按模板 G-2 示例写，多出的「RED 证据」是校验器既有标签，
用于声明替代，不计入 17 个必填字段。
机器字段可折行，续行缩进两格，读取器会合并。
第二处例外只给「RED 证据」：读取器只读这一行，因此它保持单行，可以超过 80 字。
第三处例外给文末「覆盖 AC」的编号清单：它是机器逐字核对的列表，保持一行不折。
证据计划七项不另立字段，分别落在卡内既有字段：
判什么落来源 / FR / AC；怎么判落门禁命令、预期退出码、目标失败、判定器与场景；
证据从哪来落证据；谁提供落输入；何时能拿到落输入与依赖；
成本类别落测试层级、场景与门禁命令；拿不到怎么办落停止 / 恢复。
注意 PRD 的任务卡是 6 字段，本文件的卡仍是 8 问加 17 个机器字段，两者不要混。

### 任务 1：让模板一张卡一页，并先写断言再改

为什么做：模板的卡是 16 字段堆叠，地图只有一行散文，还留着判定器、状态表、
命令与实测记录、证据字段与行号，读者没有可照着写的形状。
交付什么：先写后绿的形状断言、四列地图、6 字段一页卡与四行验收、
清干净的判定器与命令类内容。
不做什么：不改技能正文（任务 2）；不把命令、证据字段、判定器或行号写进卡；
不改版本登记（任务 4）；不按波次切作者。
前置：P1 交回后开始；读 `:12-24`、`:26-58`、`:71-108`、`:110-139`；
先跑一遍现有断言，记下真实红绿。
怎么做：① 先写 `tests/contract/prd-card-shape.test.mjs`，断言九组：
卡内 6 字段各一次；无 16 字段串；地图 4 列；头部引 material-writing；
无判定器；无状态表；无命令与实测记录；无证据字段；无 `.py`／`.ts`／`.tsx` 行号。
每类各留一个残留负例，注入后测试必须失败：16 字段、判定器、状态表、
实测记录与命令、证据字段各一，行号三种各一；
② 实跑记 RED 与逐条归因；计划归因按当前字节写死：
6 字段缺失、16 串在场、地图 1 行散文、判定器 1 处属目标行为失败；
头部引用 material-writing 与行号计数本来就通过，留作回归断言，不算目标 RED；
③ 改模板：P0 表去 16 字段句、导航收行、总览一页、共享定义至多 8 条、
地图 4 列、卡 6 字段一页加四行验收、删实测记录与状态表、删判定器与证据字段、
清 `文件.py:123` 类行号、风险与交付说明收短、变更说明留 `Supersedes:` 指针；
④ 同一命令跑 GREEN；提交由任务 2 在它改完技能正文后打。
怎么验收：RED 与 GREEN 共用一条命令；读者按验收 1、3 复读。
证据：`planned: 任务根/quality/tests/P2-prd-card-shape-red.txt`、
`planned: 任务根/quality/tests/P2-prd-card-shape-green.txt`、
`planned: 任务根/quality/tests/P2-card-readback.md`。
下游：任务 2 用同一套字段名改技能正文后打提交 1；任务 4 清残留并升版本；
测试若被判为仪式，退回纯 grep。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T005
- **来源 / FR / AC**: 来源 R-002（决策日志 `:30`）、决定 B1、B2、C5（`:124-179`）；
  FR-PRD-001、FR-PRD-002、FR-PRD-004、FR-PRD-007、FR-PRD-012、FR-PRD-015、FR-PRD-016；
  AC-PRD-001、AC-PRD-003。保留原强度：6 字段一页、四行一段含故意弄坏、
  不写命令与证据、不写意图与等级、不按波次切作者。
- **输入**: `skills/spec-prd/templates/prd-template.md:12-24`、`:26-58`、`:71-108`、
  `:110-139` 当前字节与基线读数；6 个字段名沿用任务 2 的写法，先由本卡定形。
- **文件 / 符号**: `skills/spec-prd/templates/prd-template.md`；
  `tests/contract/prd-card-shape.test.mjs`（新增）；
  symbol: N/A — 模板与契约测试文件，断言见动作。
- **动作**: ① 写九组断言与九类残留负例；② 实跑 RED 并逐条归因；
  ③ 改模板九处（P0 表、导航、总览、共享定义、地图、卡与四行验收、
  实测记录与状态表、判定器与证据字段、行号与变更说明）；④ 跑 GREEN；
  提交由任务 2 打。
- **输出 / 失败**: 输出是 4 列地图、6 字段一页卡与九类内容清零；
  失败信号是测试仍红、卡里出现命令或证据字段、实测记录或状态表未删、地图仍散文。
- **边界 / 禁止改动**: 技能正文与版本由任务 2、4 写；对方的写集不碰；
  不删 `docs/architecture/test-asset-governance-rules.md` 的引用句；不按波次切作者。
- **依赖**: P1（本 Phase 等 P1 交回后开始）
- **测试层级 / 技能**: 模板契约 / spec-prd；新断言加
  `npx vitest run tests/contract/stage-closeout-step-contract.test.mjs` 只读重跑。
- **场景 / 夹具或服务**: 正例是改后 6 字段与 4 列在位；负例是九类残留各注入一处，
  测试必须变红；负例夹具只写在测试文件内，不搭外部夹具。
- **RED/GREEN 门禁命令**: `npx vitest run tests/contract/prd-card-shape.test.mjs`
- **预期退出码**: RED nonzero; GREEN 0；目标 RED 由 6 字段缺失与旧串在场断言产生，
  不是收集失败。
- **RED 目标失败**: ORACLE-PRD-SHAPE 断言：模板卡内 6 字段各一次、九类旧内容被拒绝；
  改动前 6 字段名缺失，断言失败。
- **GREEN 判定器**: ORACLE-PRD-SHAPE 同一命令退出 0，且地图 4 列、头部引用、
  九类残留负例都被拒；反向行为是改名一个字段或注入一处残留时测试变红。
- **证据**: `planned: 任务根/quality/tests/P2-prd-card-shape-red.txt`、
  `planned: 任务根/quality/tests/P2-prd-card-shape-green.txt`、
  `planned: 任务根/quality/tests/P2-card-readback.md`
- **覆盖上限**: 只证模板形状与断言覆盖的九类内容；不证读者能按卡实施，不证规划质量。
- **停止 / 恢复**: 测试非 0 且归因指向断言本身时回本卡作者修断言并重跑；
  归因指向模板时改模板，不改断言求绿；九类负例有一个没变红就停手补断言。
- **完成**: 前置（不作完成条件）：RED 与 GREEN 各一次真实执行，原始输出与归因在场。
  完成条件（只写效果）：AC-PRD-003 读者复述四行且判出负控；
  AC-PRD-001 的模板侧计数为 0、4 列与 6 字段在位、九类负例都被拒。

### 任务 2：让技能正文只剩 6 个 plain 字段，并打第一个提交

为什么做：技能正文要求每卡保留 16 字段，读者只能照抄一份第二规格；
字段与模板必须同批落地，否则两个文件各说一套。
交付什么：改成 6 字段的技能正文、两步方法里的一个作者与一次审查，
以及「模板与字段」这一个提交。
不做什么：不改模板（任务 1）；不改流程文件（任务 3）；不写判定器、命令或证据字段；
不新增字段；不按波次切作者。
前置：任务 1 定形的 6 个字段名；读 `:18-29`、`:49-55`、`:69-77`、`:85`。
怎么做：① `## 任务卡与子任务` 改成 6 字段并写明不写证据；
② `## 编号写作规则` 第 1 条与 `:73` 的「保留全部 16 字段」改成 6 字段；
③ 两步方法补「一个作者写整个 PRD 文件」与「一次审查」，
审查四件事（拆卡、实现可行性、范围、验收）写进同一节；
④ 写前读 material-writing 的句子保留；⑤ 其它节不动；
⑥ 在本卡结束前打提交 1，把任务 1 的模板与测试一并提交，
提交信息写清「模板与字段」这一步。
怎么验收：结构前置命令退出 0；读者按验收 1、2 复读。
证据：`planned: 任务根/quality/tests/P2-prd-shape.txt`、
`planned: 任务根/quality/tests/P2-baseline.txt`。
下游：任务 3 用同一套一个作者与六步措辞改流程；任务 4 只清残留。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T006
- **来源 / FR / AC**: 来源 R-002（决策日志 `:30`）、决定 B1、B2、B3（`:124-149`）；
  FR-PRD-003、FR-PRD-005、FR-PRD-006、FR-PRD-008、FR-PRD-011、FR-PRD-012、FR-PRD-013；
  AC-PRD-001、AC-PRD-002。保留原强度：6 个 plain 字段、一页、不写证据、
  不改卡号、一个作者写整个文件、不按波次切作者。
- **输入**: `skills/spec-prd/SKILL.md:18-29`、`:49-55`、`:69-77`、`:85` 当前字节；
  任务 1 定形的 6 个字段名与模板。
- **文件 / 符号**: `skills/spec-prd/SKILL.md`；symbol: N/A — 非代码文件（方法文档）
- **动作**: ① 改 `## 任务卡与子任务` 为 6 字段一页；② 改编号写作规则第 1 条与 `:73`；
  ③ 两步方法补一个作者写整个 PRD 文件与一次审查及四件事；④ 保留 material-writing 句；
  ⑤ 不动其它节；⑥ 打提交 1（含任务 1 的模板与测试）。
- **输出 / 失败**: 输出是只剩 6 字段的技能正文与提交 1；
  失败信号是仍写 16 字段、把证据写进卡、新增字段、提交混入流程文件。
- **边界 / 禁止改动**: 模板与版本由任务 1、4 写；流程文件由任务 3 写；
  对方写集不碰；`skills/spec-prd/skill-bundle.json` 只读。
- **依赖**: T005
- **测试层级 / 技能**: 纯文档 / spec-prd；结构命令加读者复读；
  `tests/contract/build-prd-review-contract.test.mjs` 只读重跑。
- **场景 / 夹具或服务**: G-2 纯文档无新增运行行为；正例是 6 字段各一次；
  负例是留一处 16 字段、把证据写进卡、或写成按波次分作者，断言必须变红；
  不搭夹具。
- **RED/GREEN 门禁命令**: `node -e "const t=require('fs').readFileSync('skills/spec-prd/SKILL.md','utf8');for(const k of ['为什么做','交付什么','不做什么','前置','怎么验收','下游'])if(!t.includes(k))throw new Error('missing '+k);if(/16\s*个?\s*字段/.test(t))throw new Error('16-field text remains');console.log('ok')"`
- **预期退出码**: 客观检查预期 0；不执行 RED，不宣称目标 RED；
  结构接纳不等于替代已执行或 GREEN。
- **RED 目标失败**: ORACLE-PRD-SHAPE 断言：技能正文含 6 个字段名且旧写法必须被拒绝；
  改动前 6 个字段名缺失，断言不成立。
- **RED 证据**: N/A — 理由：纯文档无新增运行行为；风险为读者误把 16 字段已删当成卡就合格；客观替代为既有契约测试重放与独立逐步文档审查，判定对象是技能正文的任务卡节。
- **GREEN 判定器**: ORACLE-PRD-SHAPE 同一结构命令退出 0，且读者能只凭本节说出 6 字段；
  反向行为是仍写 16 字段、写证据或写按波次分作者时判失败。
- **证据**: `planned: 任务根/quality/tests/P2-prd-shape.txt`、
  `planned: 任务根/quality/tests/P2-baseline.txt`
- **覆盖上限**: 只证技能正文形状；不证读者能按 6 字段写出好卡，不证模板一致。
- **停止 / 恢复**: 仍写 16 字段或新增字段时回本卡作者改同一节；
  契约测试红且指向字串时先补字串，不改测试。
- **完成**: 前置（不作完成条件）：结构命令与既有契约测试有真实输出；
  提交 1 的提交号与路径清单已记。完成条件（只写效果）：
  AC-PRD-001 的技能侧计数为 0；AC-PRD-002 的一个作者写整个文件与一次审查可重放；
  提交 1 只触及模板、技能正文与新增测试三条路径。

### 任务 3：让写 PRD 的流程六步都能判

为什么做：流程写着两次内容调用，但没有「一个作者写整个文件」与「一次审查只审四件事」，
读者容易把波次当成切作者的依据。
交付什么：对齐后的六步描述、第 1 步的写作标准指针，以及步骤表的文字更新；
这一个提交只含流程与步骤两条路径。
不做什么：不增删步骤（仍 6 步、末步 closeout）；不改 step_id 与 step_slug；
不加第三次内容调用；不改第 5 步的两次调用事实；不按波次切作者。
前置：读 `:13-24` 与步骤表；先读既有字串清单，避免改掉契约测试要的字面。
怎么做：① 六步写成读、粗切地图、用户确认、一个作者写整个 PRD 文件、
一次审查（拆卡、实现可行性、范围、验收）、交接；
② 写明波次只排任务先后、不切作者；③ 第 1 步补读 material-writing；
④ 保留 `report-facts-and-handoff` 等既有字串；⑤ 步骤表只改 `observable_result`；
⑥ 在本卡结束前打提交 2，只含这两个流程文件。
怎么验收：RED 与 GREEN 共用一条命令；读数见本文件验收 2。
证据：`planned: 任务根/quality/tests/P2-prd-flow.txt`、
`planned: 任务根/quality/tests/P2-baseline.txt`。
下游：任务 4 清残留并升版本；步数一变即停手报主会话。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T007
- **来源 / FR / AC**: 来源 R-002（决策日志 `:30`）、决定 B3（`:143-149`）；
  FR-PRD-009、FR-PRD-010、FR-PRD-011、FR-PRD-014；AC-PRD-002。
  保留原强度：仍六步、仍两次内容调用、一个作者写整个 PRD 文件、波次只排先后、
  一次审查只审四件事、不新增第三次调用。
- **输入**: `workflows/build-prd/SKILL.md:13-24` 与
  `workflows/build-prd/steps.json` 当前字节；任务 2 交回的一个作者措辞；
  `tests/contract/build-prd-review-contract.test.mjs:16-45` 的既有字串清单。
- **文件 / 符号**: `workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；
  symbol: N/A — 方法与配置文字，无代码符号。
- **动作**: ① 六步按 B3 写全，保留两次内容调用与调用限制；② 写明波次只排先后；
  ③ 第 1 步补 `skills/material-writing/SKILL.md` 指针；
  ④ 第 5 步把审查四件事写进同一节；⑤ 第 6 步保留现有交接字串；
  ⑥ steps.json 只改 `observable_result`；⑦ 打提交 2，只含这两个文件。
- **输出 / 失败**: 输出是六步可判的流程、步骤投影与提交 2；
  失败信号是出现第三次调用、按波次分作者、审查被写成逐条格式审、步数或末步变化、
  提交混入其它路径。
- **边界 / 禁止改动**: 6 步与末步身份由
  `tests/contract/stage-closeout-step-contract.test.mjs` 冻结；
  技能正文与模板由任务 2、1 写；对方的写集不碰。
- **依赖**: T006
- **测试层级 / 技能**: 流程与结构 / spec-prd；`node -e` 断言加两条契约测试只读重跑。
- **场景 / 夹具或服务**: 正例是改后六步齐且字串在；负例是插第三次内容调用、
  写按波次分作者或改末步 slug，断言与冻结测试必须变红；不搭夹具。
- **RED/GREEN 门禁命令**: `node -e "const f=require('fs');const m=f.readFileSync('workflows/build-prd/SKILL.md','utf8');const s=JSON.parse(f.readFileSync('workflows/build-prd/steps.json','utf8'));for(const k of ['一个作者','整个 PRD 文件','一次审查','两次','拆卡','实现可行性'])if(!m.includes(k))throw new Error('missing '+k);if(m.includes('按波次分作者'))throw new Error('wave-based authorship');if(s.steps.length!==6||s.steps.at(-1).step_slug!=='closeout')throw new Error('step contract broken');console.log('ok')"`
- **预期退出码**: RED nonzero; GREEN 0；目标 RED 由「一个作者」「整个 PRD 文件」
  与「一次审查」缺失断言产生，不是 setup 失败。
- **RED 目标失败**: ORACLE-PRD-FLOW 断言：流程文件含一个作者写整个 PRD 文件、
  一次审查、两次调用与审查四件事，且无按波次分作者；改动前三项缺失，断言失败。
- **GREEN 判定器**: ORACLE-PRD-FLOW 同一命令退出 0，且 6 步与末步 closeout 不变；
  反向行为是出现第三次调用、按波次分作者或步数变化时冻结测试变红。
- **证据**: `planned: 任务根/quality/tests/P2-prd-flow.txt`、
  `planned: 任务根/quality/tests/P2-baseline.txt`
- **覆盖上限**: 只证文字与步数在位；不证作者真按六步执行，不证审查质量。
- **停止 / 恢复**: 步数或末步被改时停手回本卡作者还原；既有字串被删时按清单补回，
  不改测试；提交混入其它路径时回滚该提交重打。
- **完成**: 前置（不作完成条件）：RED 与 GREEN 各跑一次并留退出码；
  两条契约测试有真实输出；提交 2 的提交号与路径清单已记。
  完成条件（只写效果）：AC-PRD-002 的五组读数齐、步数 6、测试退出 0；
  提交 2 只触及两个流程文件。

### 任务 4：让版本与消费面同步，并把旧形状清尾

为什么做：版本还是 1.0.0，消费面不知道模板换了形状；旧串还散在正文里，
而模板写的是「16 个既有字段」「下列16字段」，只按「16 字段」搜会漏。
交付什么：升到 1.1.0 的版本登记、按补后词表清零的旧形状、删除证明，
以及只含清尾与版本的第三个提交。
不做什么：不改 6 字段形状（任务 1、2）；不改流程（任务 3）；不改包清单；
不删历史材料；不把清尾拆成多个提交，也不夹带其它改动。
前置：任务 2、3 交回改后的三个文件；读 `:416-424` 与包清单；
先记三处待清文件的旧字节哈希。
怎么做：① 先跑一遍 grep，词表用「16 字段」「16 个字段」「16 个既有字段」
「下列16字段」四种，再加判定器、状态表、证据字段、证据（原件、实测记录，
以及 `\.py`、`\.ts`、`\.tsx` 三种行号，列出真实命中
（实测模板 `:24`、`:75`、`:79`、`:81`，技能 `:51`、`:53`、`:73`、`:85`），逐条删净；
后两种写法按本 Phase 加严补入；通过条件仍是清零；
② 改 `local_version` 为 `1.1.0`，`last_reviewed_at` 改本次日期；
③ 跑删除证明各条读数与两份清单；
④ 打提交 3，只含 `skills/catalog.yaml`、`skills/spec-prd/SKILL.md` 与
`skills/spec-prd/templates/prd-template.md`，后两条只许删除性 hunk；
⑤ 对三个提交各跑路径清单与父提交旧字节哈希核对；
⑥ 跑一致性检查与两条定向测试。
怎么验收：RED 与 GREEN 共用一条版本命令；删除证明与三步提交核对见验收 4、5。
证据：`planned: 任务根/quality/tests/P2-version.txt`、
`planned: 任务根/quality/tests/P2-delete-proof.txt`、
`planned: 任务根/quality/tests/P2-baseline.txt`。
下游：P4 用三个提交号核旧字节可恢复；清尾后仍有残留即停手，不扩写集。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T008
- **来源 / FR / AC**: 来源 R-002（决策日志 `:30`）、决定 C5 与 D1（`:172-186`）；
  FR-PRD-017、FR-MIG-002、FR-MIG-005；AC-PRD-004、AC-MIG-002。
  保留原强度：每步单独提交、可回退、不双写、旧材料只读、清单不变。
- **输入**: 任务 2、3 交回的三个文件；`skills/catalog.yaml:416-424`；
  `skills/spec-prd/skill-bundle.json`；`docs/architecture/move-map.json`；
  提交 1、2 的提交号。
- **文件 / 符号**: `skills/catalog.yaml`；`skills/spec-prd/SKILL.md`；
  `skills/spec-prd/templates/prd-template.md`；
  symbol: N/A — 版本登记与文档清理，无代码符号。
- **动作**: ① 用四种写法加五类内容与三种行号列真实命中并逐条删净；
  ② 升版本与复核日期；③ 跑删除证明：各条 grep 为 0、清单两项不变、无代码引用、
  两处清单各核一次；④ 打提交 3，只含三条路径，后两条只许删除性 hunk；
  ⑤ 对三个提交核路径清单与父提交旧字节哈希；⑥ 跑一致性检查与两条定向测试。
- **输出 / 失败**: 输出是 1.1.0 的登记、清零的旧形状与三个可核的提交；
  失败信号是仍有命中、清单变化、提交夹带其它改动、任一检查非 0、旧字节哈希不等。
- **边界 / 禁止改动**: 6 字段形状由任务 1、2 定；
  `skills/spec-prd/skill-bundle.json` 不动；`tests/**` 只读；`specs/archive/**` 只读。
- **依赖**: T007
- **测试层级 / 技能**: 版本与清尾 / spec-prd；`node -e` 断言加
  `tests/n2-skill-catalog-portability.test.mjs` 与
  `tests/contract/build-prd-review-contract.test.mjs` 只读重跑。
- **场景 / 夹具或服务**: 正例是版本非 1.0.0、各条 grep 为零、三个提交各只触专属写集；
  负例是留一处 `.tsx:12`、把版本改回 1.0.0、或在提交 3 里夹带模板改写，
  断言必须变红；不搭夹具。
- **RED/GREEN 门禁命令**: `node -e "const y=require('js-yaml'),f=require('fs');const c=y.load(f.readFileSync('skills/catalog.yaml','utf8'));const e=c.skills.find(s=>s.name==='spec-prd');if(!e||e.local_version==='1.0.0')throw new Error('version not bumped');console.log(e.local_version,e.last_reviewed_at)"`
- **预期退出码**: RED nonzero; GREEN 0；目标 RED 由版本仍是 1.0.0 的断言产生，
  不是依赖缺失。
- **RED 目标失败**: ORACLE-PRD-VERSION 断言：catalog 的 spec-prd 条目版本不是 1.0.0
  且清单两项可读；改动前版本仍是 1.0.0，断言失败。
- **GREEN 判定器**: ORACLE-PRD-VERSION 同一命令退出 0，且一致性检查与 n2 测试退出 0，
  三个提交各只触专属写集；反向行为是版本改回 1.0.0、清单指向缺失文件、
  或提交混入无关路径时失败。
- **证据**: `planned: 任务根/quality/tests/P2-version.txt`、
  `planned: 任务根/quality/tests/P2-delete-proof.txt`、
  `planned: 任务根/quality/tests/P2-baseline.txt`
- **覆盖上限**: 只证版本字段、清单、计数与提交边界；不证旧形状没有隐性读者，
  不证发布可用。
- **停止 / 恢复**: 任一残留或清单变化即停手回本卡作者；检查非 0 且原因不明报主会话；
  提交混入无关路径时回滚该提交重打，不改检查器、不扩写集。
- **完成**: 前置（不作完成条件）：版本命令 RED 与 GREEN 各一次，检查与测试有真实
  退出码，三个提交号、路径清单与父提交旧字节哈希已记，补后词表的 grep 输出已留。
  完成条件（只写效果）：AC-PRD-004 版本已升、清单两项在、两个退出码为 0、
  三个提交各自可核；AC-MIG-002 按原词表与补后词表都为零，删除证明三件齐。

### 本 Phase 自带判据小结

自己验了什么：

- 两条 gate：`P2-test-gate.txt`（20 passed，exit 0）。
- markdownlint 两文件：`P2-test-gate.txt`（0 error，exit 0）。
- 三条结构命令：`P2-test-gate.txt`（T006/T007/T008 各 exit 0）。
- 三类样例读者复读：`P2-reader-readback.md` 第 7 节逐类，结论见第 8 节。

没验什么：

- AC-PRD-004 的 n2：基线既有红 2 条（`17e78a09` 与 HEAD 同），见 `P2-version.txt`、`P2-test-ac.txt` §6。
- 样例卡内 6 字段无测试守护，仅手工核；`prd-card-shape` 只守空卡段（`P2-test-ac.txt` §7）。
- 拆卡样例的「四行验收：」是普通段落，不是标题；属模板表达取舍，未加机器断言。
- 模板里的 Supersedes 是示例占位，属模板应然；真实任务须填 64 位哈希。

未验项条件与 owner：

- n2 基线红修复后重跑；owner＝主会话/相关源维护者。
- 6 字段机器守护若被要求，需另加断言；owner＝P2 作者/测试上下文。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计（全局权威）`
- **写入集**: `workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`skills/spec-prd/SKILL.md`；`skills/spec-prd/templates/prd-template.md`；`skills/catalog.yaml`；`tests/contract/prd-card-shape.test.mjs`
- **依赖**: P1
- **消费者**: PRD 作者与 build-prd 协调者；P3 的重写者；P4 的提交与覆盖核对
- **gate_cmd**: `npx vitest run tests/contract/prd-card-shape.test.mjs tests/contract/build-prd-review-contract.test.mjs`
- **oracle**: ORACLE-P2-PRD-METHOD
- **evidence_path**: `planned: 任务根/quality/tests/P2-summary.txt`
- **STOP**: 读数变红、步数或末步被改、版本未升、提交混入专属写集之外的路径、
  写入越出六条路径、验收判不出真假时停手；材料问题回本 Phase 作者修同一处，
  判据问题回规格作者，不扩写集、不改判定器求绿。
- **覆盖 AC**: AC-PRD-001、AC-PRD-002、AC-PRD-003、AC-PRD-004、AC-MIG-002
- **Done**: 前置（不作完成条件）：两条 gate 真实输出（`P2-test-gate.txt`，20 passed）；
  markdownlint 两文件 0 error（`P2-test-gate.txt`）；三条结构命令 exit 0（`P2-test-gate.txt`）；
  四个提交号与各自路径：`629181f2`（模板/技能正文/新增测试）、`7fbbc692`（流程/步骤）、
  `d8130a4c`（版本/清尾）、`38b467dd`（审后修复）；父提交旧字节哈希见 `P2-version.txt` 第四节；
  清尾与测试改动清单见 `P2-delete-proof.txt`、`P2-test-change.txt`。
  完成条件（逐条承接，格式为「AC 编号｜8 值档位｜具名证据指针」）：
  - AC-PRD-001｜pass｜`quality/tests/P2-test-ac.txt` §7、`P2-reader-readback.md`
  - AC-PRD-002｜pass｜`P2-prd-flow.txt`、`P2-test-gate.txt`
  - AC-PRD-003｜pass｜`P2-reader-readback.md` 三类样例逐类节
  - AC-PRD-004｜pass（n2 基线过时断言已按独立诊断修复（提交 `a8594082`），2026-11-04 22:45 复跑 n2 29 passed + wiring 18 passed，exit 0；版本 1.1.0/2026-11-04、bundle 两项不变）｜`quality/tests/P4-green.txt` 第五节、`P4-static.txt` 第八节
  - AC-MIG-002｜pass｜`P2-delete-proof.txt`

## 补充材料

推导、原始输出与被否方案只放原件，正文按路径与节锚点回读。

| 原件 | 用途 |
| --- | --- |
| `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-quality-first-task-design-20261104/quality/evidence/drafts/2026-11-04-build-plan-spec-draft.md` | 唯一判据与全局设计（Appendix A、P2 的锚点） |
| `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-quality-first-task-design-20261104/specs/workflowhub-quality-first-task-design-20261104/decision-log.md` | 需求 R-002 与 B 组、C5、D1 原文 |
| `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-quality-first-task-design-20261104/quality/evidence/research/2026-11-04-workflowhub-method-anchors.md` | B 组落点与 16 字段的实际行号 |
| `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-quality-first-task-design-20261104/quality/evidence/research/2026-11-04-history-knowledge.md` | 16 字段被契约锁死的历史教训 |

本文件不宣称任何执行结果；RED、GREEN 与读者结论都由执行者按本文件判据自跑自留。
