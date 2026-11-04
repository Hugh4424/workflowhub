# 功能规格：质量优先的规划方法改造与 PaperBuilder 规划 PRD 重写

本文件写给下一位实施者、独立验收者与维护者；读完能按 Phase 卡执行，并按 Appendix A 判真假。
  本文件是 build-plan 阶段的 `spec.md` 草稿，状态 `draft`：用户对当前材料的答复尚未取得。
  产品目标与已接受方向仍以 `decision-log.md` 为准，本文件不重写第二份产品目标。
  每个 Phase 的实现增量交给独立 Phase 文件，`phases/index.md` 只存指针、不承载正文。

> 写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」是唯一标准。
> 本文件不复述标准，只说明自己的例外：`## 实现设计（全局权威）` 与四个小节名逐字读取。
> 验收判据只在 Appendix A；正文只给指针，不写第二份判据。

| 来源 | 路径 | 读数 |
| --- | --- | --- |
| 决策日志 | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-quality-first-task-design-20261104/specs/workflowhub-quality-first-task-design-20261104/decision-log.md` | 206 行 |
| 盘点原件 | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-quality-first-task-design-20261104/quality/evidence/research/2026-11-04-paperbuilder-prd-inventory.md` | 239 行 |
| 旧 PRD | `/Users/Hugh/Hugh/Project/PaperBuilder/specs/paperbuilder-architecture-optimization-planning-20261021/prd.md` | 1,892 行 |

本文件的词先解释：PRD（规划用的产品需求文档）、AC（验收判据）、FR（功能需求）。
ORACLE（判定器编号）、HEAD（当前提交）、YAML（本仓配置用的文本格式）同样先给一句。
RED（先让目标断言失败）与 GREEN（再用同一断言判通过）是一对门禁状态。
`reviewReadScope`（审查读取范围声明）出现在实现设计里，指 host 传给校验器的读取边界。
写集（一个 Phase 允许改的精确文件路径清单）、收口（阶段末保存材料并跑检查的动作）。
外部交付物（不在本工作区、写它要另一次人工确认的产物）、Supersedes（新件声明它替代哪份旧件的字段）。
纯指针索引（只存行与指针、不承载正文的 `phases/index.md`）。

| 章节 | 讲什么 | 什么时候读 |
| --- | --- | --- |
| 为什么做，给谁用？ | 十一项原始需求分别要什么 | 开工前通读一次 |
| 已核实的事实与决定是什么？ | 已实读的仓库事实与已定决定 | 动手前，逐条核对自己的假设 |
| 做成什么样？ | 四段交付与各自落点 | 排期与验收前 |
| 实现设计（全局权威） | 逐文件锚点、写集、接口与追踪 | 写 Phase 卡前 |
| Appendix A | 唯一验收判据 | 判定时只看这里 |
| Appendix B | 中文编号与机器编号对照 | 引用编号时 |

## 这是什么，给谁用？

把「质量优先、砍仪式不砍质量」落成两层可执行方法，并把一份跨仓 PRD 按新方法重写。
  「阶段」（Phase）指一个任务里能独立验收的一部分，默认 2–7 个。
  「波次」（wave）指同批可并行、按先后排组的任务分组；W1–W4 是本次新引入的分组名。

- **功能名**：规划方法改造与规划 PRD 重写
- **来源**：决策日志的 R-001 至 R-011，与 A1–A4、B1–B3、C2–C5、D1 共十二项决定
- **状态**：草稿；未见用户对当前材料的答复
- **边界一句话**：改方法、模板与一份外部 PRD，不改 PaperBuilder 的代码与已开发内容。

## 一页看懂：谁要什么结果，怎么算通过？

实施者按四张 Phase 卡干活；用户按 Appendix A 的判据验收，不靠读散文。

- **需求 1**：写计划的方法要能把交付切小，验收要写成能判真假的一段。
- **需求 2**：写 PRD 的方法与模板要向写计划的方法对齐，去掉 16 字段散文。
- **需求 3**：PaperBuilder 的规划 PRD 要按新形状重写，保留任务号、重排波次。
- **需求 4**：已开发任务的遗漏要补、过度复杂要简化，让 PRD 好用。
- **最大影响面**：`workflows/build-plan`、`workflows/build-prd`、模板文件，以及外部一份 PRD。
- **验收信号**：判据见 Appendix A；每条 AC 都落到某个 Phase。
- **非目标**：不做试点；不碰 T05；不改 T01、T02、T03、T04、T10、T16 的材料。
- **非目标之二**：不设时间盒；不新增校验器、stage 或门；不重开已关闭任务。

## 为什么做，给谁用？

任务慢的根因是工作单元太大、验收太散、最后才集成；改方法比催模型有用。

### 需求 1：写计划的方法要能把交付切小、验收能判

现在先写完整规格再切阶段，验收只能给文档做摘要，阈值没有来源，审查整阶段。
  写计划的实施者需要：阶段按交付与验收拆、一条验收一小段、写完给没参与的人能照着做。
  来源是决策日志 R-001（第 29 行）与 A 组四项决定（第 86–122 行）。
  失败信号是验收段仍要读者猜第一步、猜什么算过、猜证据在哪。

### 需求 2：写 PRD 的方法与模板要向写计划的方法对齐

16 字段的卡把 PRD 变成第二份规格，任务地图不独立，写法啰嗦，没有完成状态区分。
  写 PRD 的作者需要：一个任务一张一页卡、四行任务级验收、四列任务地图、一次审查。
  来源是决策日志 R-002（第 30 行）与 B 组三项、C5（第 124–179 行）。
  失败信号是 PRD 里仍出现 16 字段散文、判定器、命令、文件行号或证据 schema。

### 需求 3：PaperBuilder 的规划 PRD 要按新方法重写

旧 PRD 有 23 张卡、219 个唯一验收编号、每卡一条判定器；长窗与全量分母被当成每次门。
  用户需要：保留任务号与已开发内容，只改波次、验收与补齐缺口。
  来源是决策日志 R-003（第 31 行）与 C2、C3 决定（第 153–170 行）。
  失败信号是已开发卡被改动、任务号被重排、或缺口被写成「已覆盖」。

### 需求 4：已开发的遗漏要补、过度复杂要简化

盘点出五处遗漏（T03 生产切换、T02 恢复链、T10 表登记与凭证、T16 性能、T01 前端基线）。
  T01 只量 Python 进程、明写不碰 frontend，按「没合并就补」判为未合并，补进 T23a。
  简化项是 30 天窗口、238 表与 145k 目录、87.96GB 与 40 次换库这类分母。
  来源是决策日志 R-004（第 32 行）与 C4（第 161–164 行）；落点是需求 3 的同一份 PRD。

### 需求 5：按 WorkflowHub 标准在认证 worktree 里从头做

本任务已在认证 worktree 中，材料写在 `specs/<task-id>/`，决策与工作流按仓内方法执行。
  用户需要：每一步能回读原件，不是只在对话里说过。
  来源是 R-005（第 33 行）；落点是本文件与 Phase 材料的存放位置，以及 P4 的终末读回。

### 需求 6：写给没背景的人看，审查异源且各一次

材料读者是实施者与维护者，不是决策参与者；术语首现要解释，内部编号只进附录。
  审查要由与实现不同上下文的执行者做，方向与细节各一次，provider 失败如实记录。
  来源是 R-006（第 34 行）；落点是每份材料的写法与 P4 的审查事实核对。

### 需求 7：质量优先，时间是副产物

不为了省时间砍掉判据、覆盖或独立审查；砍的是重复叙述、双写与仪式性门。
  用户需要：每条承诺仍有可判的验收，只是写得短。
  来源是 R-007（第 35 行）；落点是 Appendix A 的「为什么不能再简」与各 Phase 的成本项。

### 需求 8：不做试点，T05 不碰

用户自己去新任务试点；本任务不给试点安排、不写试用期、不改 T05 任何材料。
  T05 的 24 小时窗口与恢复闭环保持原样，只在本文件中被引用，不被改写。
  来源是 R-008（第 36 行）；落点见 P1、P2 的写集声明与 P4 的边界核对。

### 需求 9：先定大纲，再逐块调研与确认

大纲是阶段级交付清单，不是逐条任务清单；每块收敛后给用户看，确认后再进下一块。
  用户需要：先看到「四个 Phase 各交什么」，再看到细节。
  来源是 R-009（第 37 行）；落点是本文件的「阶段大纲」与 P1 的流程改动。

### 需求 10：能自己决定的自己决定，有歧义才问

模块收敛时作者按已确认方向自决，并把实际选择与理由写进材料；歧义才交用户。
  用户需要：不必回答本可自行判断的问题，但每个自决都能被回读与推翻。
  来源是 R-010（第 38 行）；落点是「已核实的事实与决定」里的决定项与未决清单。

### 需求 11：取消时间盒、统一写法、先 A 再 B 再 C

取消时间盒与事后限时；取消「必须用上一任务结果」的硬规则；写计划的流程不指定谁做。
  验收字段改成大白话；PRD 写法向计划写法统一；实施顺序是先 A 组、再 B 组、再 C 组。
  来源是 R-011（第 39 行）；落点是四个 Phase 的先后与验收段的形状。

### 背景是什么？

三处根因分别落在三组决定上：工作单元太大（A2、B2、C2）、验收太散（A1、B1、C3）、最后才集成（C2、C3、A2）。
  决策日志第 56–83 行给出完整分因表；本文件按该表组织，不另立根因体系。
  十二项决定各有唯一落点，见「需求到任务追踪」表；重复描述不算覆盖。

## 已核实的事实与决定是什么？

- **事实 1**：本工作区是认证 worktree，HEAD 为 `17e78a09`，与主仓库同一提交。
  实读命令 `git rev-parse --abbrev-ref HEAD`，分支名以 `task/workflowhub/` 开头。
- **事实 2**：旧 PRD 为 1,892 行、23 张卡、63 个 `ORACLE-` 编号。
  唯一验收编号 219 个：数字后缀 202 个，T19 的 A1–C8 后缀 17 个。
  卡内首行定义 166 条：112 条写成 `- **AC-Txx-n（覆盖 FR…）**：`，54 条写成 `- AC-Txx-n：`。
  定义编号去重后 156 个；其余 63 个编号只在引用或小结里出现。
  复算：`grep -oE 'AC-T[0-9]{2}-[A-Z0-9]+' prd.md | sort -u | wc -l` 得 219；
  只算数字后缀同法得 202；`grep -cE '^\s+- \*\*AC-T'` 得 112、`grep -cE '^\s+- AC-T'` 得 54。
  两个数（编号 219、定义行 166）都保留，不合并成一个。
  盘点件记「219 条验收」，那是唯一编号数，不是定义条数；差异原因是 T19 后缀与只被引用的编号。
  卡的行号只作定位，不作字节边界（取证方式见 AC-PB-002）。
- **事实 3**：字段数不是「16 字段」：T01–T04 是 16 个，T05–T23 是 17 个。
  多的一个是「本卡验收边界（2026-10-29）」，见 `prd.md:460` 等。
- **事实 4**：T23a、T16a、T19a、T19b 在旧 PRD 中不存在。
  实读 `grep -cE "T23a|T16a|T19a|T19b"` 返回 0。
- **事实 5**：旧 PRD 自述「16 个字段」共 5 处（`:23`、`:244`、`:253`、`:1861`、`:1868`）。
  `:253` 的「固定字段，不因卡片数量删改」是硬声明，改为 6 字段后该句失效。
- **事实 6**：旧 PRD 的 23 张卡各有 1 条「判定器」字段（全文出现 24 次，多的一处在 SD-03）。
  63 个 `ORACLE-` 编号；「文件:行号」引用 16 处，落在 9 个不同文件。
  其中 `.py:行号` 6 处：`contracts/live_outlet.py:465` 2 次。
  `scripts/serve_f6.py:3622` 4 次。
  其余 10 处是前端 `.tsx`／`.ts` 文件；这是 C5 与 C3 要删的三类内容。
- **事实 7**：`prd.md:1828` 起的「实测记录」表列了命令与输出。
  这是 C5 要删的命令类内容，不属于 PRD。
- **事实 8**：PRD 的 16 字段没有机器读取方：`runtime/`、`tools/` 对 `prd.md` 0 命中。
  消费者只有 `skills/catalog.yaml:416-424`、`workflows/build-prd/skill-deps.yaml` 与两处测试。
- **事实 9**：`skills/spec-prd/skill-bundle.json` 只列两个文件名，无 hash。
  `skills/catalog.yaml` 无 `local_bundle_hash`；`:418` 的 `local_version` 为 `1.0.0`。
- **事实 10**：当前树没有断言 PRD 字段数的测试。
  实读 `ls tests/contract | grep prd` 只有 build-prd 文档审查一条。
  历史任务曾用测试锁死 16 字段，原件在
  `specs/archive/workflowhub-build-prd-workflow-hardening-20260911/decision-log.md:409`、`:650`。
- **事实 11**：Phase 卡的 17 个机器字段由
  `runtime/stage/stage-content-contracts.mjs:869-909` 硬检查。
  同文件 `:208-221` 与 `:377`：没有 `reviewReadScope` 时，绝对路径判为不安全写集。
- **事实 12**：`workflows/build-plan/steps.json` 现为 12 步，build-prd 的为 6 步。
  `tests/contract/stage-closeout-step-contract.test.mjs:16-31` 冻结这两个数与末步 `closeout`。
- **事实 13**：Phase 模板 `:41` 写「不引入数字阈值」，`:67` 与 `:102` 写经验范围 3–7。
  本次把经验范围改为 2–7，仍只是提示，判据仍是拆并规则。
- **事实 14**：Phase 模板的 7 个验收槽在 `tests/` 中 0 命中。
  实读 `grep -rn "七个槽\|七槽" tests/` 无输出；删槽不破测。
  但模板内嵌示例被 4 个契约测试读取，改模板必须重跑它们。
- **事实 15**：`skills/spec-prd/SKILL.md:51`、`:53`、`:73` 与模板 `:24`、`:75`、`:79`、`:81` 写死 16 字段。
- **事实 16**：PaperBuilder 工作树有 1 个脏文件 `scripts/serve_f6.py`（+3/−1）。
  修改时间早于本任务；它不是本次改动，也不在本任务写集内。
- **事实 17**：细节审查原件已完成，原件在
  `任务根/quality/reviews/2026-11-04-013-make-decision-detail.json`。
  状态 `available`、`outcome=completed`、11 条 findings、3 个 provider。
  决策日志 `:194` 已记「细节审查（已完成，11 条，7 组修）」，但 `:200` 仍写「待发起」。
  两处自相矛盾；本文件按原件写，矛盾记入未决 2。
- **决定 1**：四个 Phase 严格串行：P1 → P2 → P3 → P4；不设并行批次。
- **决定 2**：P3 是跨仓交付，机器写集写 `none（跨仓交付）`，不自动提交，提交留用户决定。
- **决定 3**：T19 拆 T19a（读/展示面，W3）与 T19b（写/迭代面，W4），不新增卡号。
- **决定 4**：T23a 收 T01 前端基线；理由见需求 4，判据是 T01 未合并。
- **决定 5**：A2 的 8 个 plain 字段是人读层；17 个机器字段原样保留，不改校验器与冻结测试。
- **决定 6**：「默认 2–7 个阶段」是建议，不是阈值；模板「不引入数字阈值」的口径不变。
- **决定 7**：删旧要三件：删除证明、回退方式、停止条件；缺一件不算删完。
- **决定 8**：动 PaperBuilder 前要一次用户真实答复；被拒时只交本仓消费侧，跨仓记 unknown。
- **决定 9**：删旧不单开 Phase，收进 P1、P2 任务顺序的末尾；P4 只做只读的回退核对。
  理由：旧 16 字段只活在 `skills/spec-prd`，旧 7 槽只活在 Phase 模板，已由 P1、P2 原地改写覆盖。
  仓内其余命中是 `specs/archive/**` 的只读历史原件，与 `docs/contracts` 的「七项义务」（无关）。
  单开一个只做整理的 Phase 违反 Phase 模板的拆并规则，因此不设。

## 做成什么样？

四段交付各自可独立验收；判据都指向 Appendix A，正文只写场景与落点。

### 验收 1：写计划的方法与模板改完（P1）

场景 1：实施者打开 `workflows/build-plan/SKILL.md` 与两个模板，按新形状写一段验收。
  任务末尾另有删旧清尾与删除证明，单独一个提交。
  落点：P1/T001–T004 与 `phases/P1-写计划的方法.md`。
  判据见 AC-BP-001 至 AC-BP-008 与 AC-MIG-001。
  通过信号是读者能只读一段验收答出四问；失败信号是要读源码或猜判据。

### 验收 2：写 PRD 的方法与模板改完（P2）

场景 2：作者按六步写一张一页卡，四行验收能判真假；读者不翻别的文件就能开工。
  任务末尾另有 16 字段清尾与删除证明，单独一个提交。
  落点：P2/T005–T008 与 `phases/P2-写PRD的方法.md`。
  判据见 AC-PRD-001 至 AC-PRD-004 与 AC-MIG-002。

### 验收 3：PaperBuilder 规划 PRD 重写完（P3）

场景 3：用户在外部仓库打开新的 `prd-v2.md`，看到四列地图、26 张卡标题与四行验收。
  旧 `prd.md` 原样还在，新件头部有 `Supersedes` 行。
  落点：P3/T009–T013 与 `phases/P3-重写规划PRD.md`。
  判据见 AC-PB-001 至 AC-PB-006；写入位置见「接口与失败语义」的外部写面。

### 验收 4：终末验收与回退核对（P4）

场景 4：独立读者复读当前全部材料，核对每个 Phase 的提交只触及申报写集。
  用户按 Appendix A 验收一遍；只读，不改工作树。
  落点：P4/T014–T016 与 `phases/P4-终末验收.md`。
  判据见 AC-MIG-003 至 AC-MIG-005 与 AC-FINAL-001 至 AC-FINAL-005。

## 打算怎么做？

四步：先改写计划的方法，再改写 PRD 的方法，然后重写外部 PRD，最后终末验收。
删旧不占独立一步：它收进 P1、P2 的任务顺序，理由见方案 5。

### 方案 1：先改方法，再用新方法改 PRD

理由：P3 要用 P2 的新 PRD 形状；先改方法能避免 PRD 写完再返工。
  P1 与 P2 的写集虽不相交，仍按串行做：P2 的卡形状要用 P1 的验收口径，先 P1 少返工。
  不选「先改 PRD 再抽方法」：那会让方法与一次具体交付绑死，第二份 PRD 无法复用。

### 方案 2：把跨仓交付当「外部交付物」而不是本仓文件

P3 的目标在另一个仓库，交付方式是旧件不动、新版本另起（`prd-v2.md`）。
  理由：原地覆盖要靠哈希证明旧字节，回退只能靠复原；另起一个新件，旧字节天然可恢复。
  本仓校验器把绝对路径判为不安全写集（事实 11），所以路径只写正文，机器写集写 `none（跨仓交付）`。
  代价是索引里 P3 的写入集列只能写 `none（跨仓交付）`，读者要看正文才知道写到哪。
  不选「复制一份到本仓」：那会造出第二权威，正是 D1 要禁止的双写。

### 方案 3：文档类验收用「结构命令 + 独立读者」

能数、能 grep 的用真实命令判（节名、字段名、数量、关键字）；语义可用性交独立读者。
  理由：只给命令会把「文件存在」当质量；只给读者会失去可重放的底线。
  代价是每条语义验收要有读者记录；记录形态由 `check-reader-record.mjs` 只报读数、不判质量。

### 方案 4：不新增校验器、stage、门或第二份判据

所有新要求都落在既有文件与既有检查器上；需要新断言时只加一条定向测试。
  理由：项目规则要求新控制面先登记职责、consumer、owner 与删除条件；本次没有这类需求。
  代价是个别断言只能一次性跑、留证据在 `任务根/quality/tests/`，不成为永久门。

### 方案 5：删旧不单开 Phase，收进 P1、P2 的任务顺序

理由：删旧没有独立落点。旧 16 字段只活在 `skills/spec-prd`，旧 7 槽只活在 Phase 模板。
两处都已被 P1、P2 的原地改写覆盖；再单开一个只做整理的 Phase 违反 Phase 模板的拆并规则。
仓内其余命中是 `specs/archive/**` 的只读历史原件，与 `docs/contracts/card-01-stage-material-interface.md:14` 的「七项义务」（无关）。
`任务根/quality/evidence` 是历史证据，同样只读，不在写集。
代价：P4 的可回退判断只能靠提交与字节证据，不靠一次真实 revert 演练；这一点写进 AC-MIG-003。
D1 的三步因此改为 P1、P2 的任务顺序，回退核对落 P4。

## 谁先谁后？

P1 → P2 → P3 → P4，严格串行；每一步都吃上一步的交付，不开并行批次。

### 阶段大纲：四个 Phase 各交什么？

| Phase | 交付（用户能看到） | 依赖 | 顺序 | 一条验收（可判） |
| --- | --- | --- | --- | --- |
| P1 | 写计划的方法与两个模板改成新形状，末尾删旧清尾 | 无 | 串行第 1 步 | P1 六件齐、四问可复述、无角色指派 |
| P2 | 写 PRD 的方法、模板与版本登记改成新形状，末尾清尾 | P1 | 串行第 2 步 | P2 6 字段、4 列、七类禁用清零 |
| P3 | 外部一份新版本规划 PRD（`prd-v2.md`） | P2 | 串行第 3 步 | P3 26 卡、4 列、18 组、7 片旧字节相等 |
| P4 | 覆盖表、提交回退核对、独立读者与用户验收 | P1–P3 | 串行第 4 步 | P4 覆盖表无孤儿、十环逐项有结论 |

第 0 阶段（所有阶段共用同一套测试环境与数据时统一准备）本任务跳过。
  理由：四个 Phase 都用仓内既有命令，没有共享夹具、共享数据库或共享环境要搭。
  按 A3 的要求，跳过要写理由；本理由即上面两句，不另建第 0 阶段文件。

顺序纪律：本任务不并行。P2 的卡形状要用 P1 的验收口径，P3 要用 P2 的 PRD 形状。
  P4 依赖前三步的原件；每一步完成并留下证据后，下一步才开工。

## 还有什么没定？

六件事尚未定，前三件会挡住对应 Phase 开工，后三件只影响写法。

- **未决 1**：动 PaperBuilder 前，用户要答复一次「可以改另一个仓库」。
  历史先例 `specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:195`、`:201`、`:522` 记「动第二个仓库之前加一次人工确认点」。
  主会话转述的 D-008／D-030⑤ 原件未取得（本任务决策日志无 D- 编号），记为待补证。
  影响 P3 开工；被拒时只交本仓消费侧、跨仓部分记 `unknown`，其余工作继续。
- **未决 2**：决策日志第 200 行「细节审查：待发起」与原件不符（事实 17）。
  同一日志 `:194` 已写「已完成，11 条，7 组修」，只有 `:200` 没改。
  影响 P4 的审查事实核对与后续读者；谁补：make-decision 的材料作者。
  本任务只读该日志，不改它；本文件按实物引用 013 原件。
- **未决 3**：T19a／T19b 的切面由主会话定为「读/展示面」与「写/迭代面」（决定 3）。
  原 owner 与用户未复核该切面；影响 P3 的两张卡与波次；谁补：P3 作者开工前回读旧卡 A/B/C 三组后确认。
- **未决 4**：四行任务级验收按「卡」给，不逐条 FR 对齐（盘点 §6 第 5 条）。
  影响 P3 的判断粒度；谁补：P3 作者在卡内把四行与卡内 FR 逐条挂钩，不新增第二套验收。
- **未决 5**：前置卡（T01–T05、T10、T16、T23a）在四列地图的「波次」列怎么写。
  本文件采用「前置」，T23a 另标「T06 前」；影响 P3 的地图取值域；谁补：P3 作者与用户确认后固定。
- **未决 6**：需求表原把 R-004 同时挂在 AC-PB-002（只读边界），该 AC 实际不判遗漏与简化。
  现改指 AC-PB-005（简化）与 AC-PB-006（遗漏）；简化项是否全覆盖由 P3 作者在卡内复核。
  谁补：P3 作者；影响 R-004 的表述与 AC-PB-005 的卡内落点。

## 实现设计（全局权威）

前三个 Phase 改既有文件，P4 只读核对；唯一的外部交付在另一个仓库。

### 代码锚点

先读方法文件再读模板，最后读测试；顺序反过来会把测试当需求。

- **来源边界**：决策日志与旧 PRD 只作来源映射，不在实现设计里创建第二份需求账本。
- **现状与目标差异**：现状是「阶段先写规格再切」与「PRD 16 字段散文」；目标是一段验收与一页卡。
- **读取顺序**：`workflows/build-plan/SKILL.md`、`workflows/build-prd/SKILL.md`、
  `skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、
  `skills/spec-prd/SKILL.md`，
  再读各 `templates/`。
- **运行条件**：Node `v24.14.0`（`node --version` 实读）；本机无外部服务依赖；测试用仓库自带夹具。

**P1 的锚点（写计划的方法与模板）**

1. `workflows/build-plan/SKILL.md:73-119`：`## 设计每个 Phase 的验收` 是 A1 的唯一落点。
   把「动作＋命令＋期望」三件套改成「一段六件」：目标、怎么操作、什么条件、怎样算通过（含一处故意弄坏必须失败）、真跑还是替代、谁判与证据；
  再加失败回修与停止。
   同一文件的 `:48` 仍要求三件套，改成指向同一段，避免双权威。
   阈值来源、四问读者测试、长跑一次、顺带看建议都写进这一节；反例清单 `:110-116` 保留并补两条。
2. `workflows/build-plan/SKILL.md:13-24` 与 `:36-43`：在步骤 3 与 4 之间加「先出阶段大纲并取得答复」。
   大纲写 2–7 个阶段、每阶段交付、一条验收、依赖、并行、下游；确认后才写规格。
   同一节补「有知识图谱用图谱，没有就用现有代码」，不新增外部系统。
3. `workflows/build-plan/SKILL.md` 的 `## 设计每个 Phase 的验收` 下新增一个 H3「执行建议写什么？」。
   内容只有建议：第 0 阶段、测试人数、流程监控员、三角色与并行纪律；是否采用由 build-code 定。
   不写成门，不写「必须」，不新增字段。
4. `workflows/build-plan/steps.json`：只在既有 12 步内改 `observable_result` 文字。
   不增删 step、不改 `step_id`、不改 `step_slug`、不改末步 `closeout`（事实 12）。
5. `skills/spec-specify/templates/spec-template.md:88`：在 `## 谁先谁后？` 前新增
  `## 阶段大纲…` 一节。
   节内写 2–7 个阶段与可选第 0 阶段；其余节不动；第 0 阶段只在这里出现，不进 Phase 文件。
6. `skills/spec-plan/templates/phase-template.md:210-324`：
  `## 这一 Phase 怎么验收？` 整节重写。
   删除 `:275-298` 的 7 个槽，换成「一条验收一小段」：每段按 P1 的六件写，末尾给失败回修与停止。
   保留三笔账与预算小节（`:212-272`），保留「用户本人来判吗」「档位」「改前基线」三小节。
   整节重写，不在旧 7 槽上补句子；
  历史先例 `specs/archive/workflowhub-thin-core-card-03-20260919/design.md:2594`
  记过同处升级作废旧行。
7. `skills/spec-plan/templates/phase-template.md:481-532`：`## 怎么验证？` 只留
  RED/GREEN、命令、证据执行细节。
   删掉与验收标准重复的判据句；验收判据仍指向 spec 的 Appendix A。
8. `skills/spec-plan/templates/phase-template.md:533-540`：`## 下一消费者拿什么继续？`
  加一行「下游」。
   同一节末加一句执行建议，例如阶段内任务顺序或可并行提示；不新增节。
9. `skills/spec-plan/templates/phase-template.md:658-698`：每张任务卡怎么写。
   卡正文按 8 个 plain 问题排序作答：为什么做、交付什么、不做什么、前置、怎么做、怎么验收、证据、下游（含何时停）。
   17 个机器字段原样保留在 `:679` 的「校验器用，人可跳过」之后，字段名不改；正文先于机器块。
   对应关系写成一张小表，说明 8 问分别落到哪些既有字段，不新增字段。
  10. `skills/spec-plan/templates/phase-template.md:41`、`:67`、`:102`：经验范围
  3–7 改为 2–7。
    `:41` 的「不引入数字阈值」保留；2–7 只作提示，判据仍是拆并规则（决定 6）。
    同一文件 `:65-117` 的拆并判据不动，只改数字与一句说明。
11. `skills/spec-plan/templates/phase-template.md` 与 `skills/spec-specify/templates/spec-template.md`：删旧清尾，单独一个提交。
    删掉 7 槽段落与不再用的旧步骤措辞；删除证明三件写进 T004 的完成条件。
    证明是：`skill-bundle.json` 文件清单未增未减、仓内无代码引用被删节名。
    引用者清单在 `tests/` 与 `docs/architecture/move-map.json` 各核一次，并留原文。

**P2 的锚点（写 PRD 的方法与模板）**

1. `workflows/build-prd/SKILL.md:15-24`：六个步骤与 B3 对齐，保留地图与详情的两次内容调用。
   步骤名与调用次数不变；只改每步要交的东西，例如第 2 步交四列地图，第 4 步交一页卡。
2. `workflows/build-prd/steps.json`：6 步内改 `observable_result`，不增删 step（事实 12）。
3. `skills/spec-prd/SKILL.md:49-55`：`## 任务卡与子任务` 从 16 字段改为 6 字段一页。
   6 字段是：为什么做、交付什么、不做什么、前置／依赖、怎么验收、下游；不写证据。
   同一文件 `:69-77` 的编号写作规则同步改「保留全部 16 字段」为「保留全部 6 字段」。
4. `skills/spec-prd/SKILL.md:18-29`：两步内容方法补「一个作者写整个 PRD 文件」与「一次审查」。
   审查四件事写进同一节：拆卡、实现可行性、范围、验收；不审文件格式。
5. `skills/spec-prd/SKILL.md:20`：在写 PRD 前读 `skills/material-writing/SKILL.md`，
   不复述标准。
6. `skills/spec-prd/templates/prd-template.md:12-24`：P0 必留表按新章节重排，删「16 个既有字段」句。
7. `skills/spec-prd/templates/prd-template.md:26-37`：导航表保留，行数按新章节收。
8. `skills/spec-prd/templates/prd-template.md:39-58`：产品总览压到一页；共享定义收到 ≤8 条。
9. `skills/spec-prd/templates/prd-template.md:53-58`：任务地图改 4 列：任务、结果、依赖、波次。
  10. `skills/spec-prd/templates/prd-template.md:71-100`：每张卡 6 字段、一页；任务级验收四行一段。
  11. `skills/spec-prd/templates/prd-template.md:102-108`：删「实测记录」整节（命令类内容）。
  12. `skills/spec-prd/templates/prd-template.md:110-131`：风险与交付说明收短，只留未决与风险。
  13. `skills/spec-prd/templates/prd-template.md:133-139`：变更说明留 `Supersedes:` 指针，
  保留回退语义。
  14. `skills/catalog.yaml:416-424`：`local_version` 从 `1.0.0` 升到 `1.1.0`，
   `last_reviewed_at` 改为本次日期。
    `skills/spec-prd/skill-bundle.json` 只列文件名、无 hash（事实 9）；文件清单不变就不改它。
  15. `tests/contract/prd-card-shape.test.mjs`（新增）：断言 6 字段名各出现一次、无「16 个字段」、
  地图 4 列、头部引用 material-writing、无判定器字段、无「文件:行号」形式。
    历史义务是「改模板须同批重算字段数断言」，当前树 0 条（事实 10）；本条把义务落成一条定向断言。
    如果审查认为它是仪式，可退回纯 grep + 证据；退回时 AC-PRD-001 的判法改为一次性命令，不改通过条件。
16. `skills/spec-prd/SKILL.md` 与 `prd-template.md`：16 字段清尾，单独一个提交。
    实读现状：`16 字段` 在全仓只剩这两个文件命中（`grep -rln` 核过），删完即清零。
    删除证明同 P1，写进 T008 的完成条件；`skills/catalog.yaml:416-424` 版本同批更新。

**P3 的锚点（外部 PRD，逐节）**

外部写面：旧件 `.../paperbuilder-architecture-optimization-planning-20261021/prd.md`（只读，不改）。
  新件 `.../paperbuilder-architecture-optimization-planning-20261021/prd-v2.md`（唯一写入）。
  两条绝对路径只出现在本文件、Phase 正文与证据落点里，不写进机器写集或索引写入集列（事实 11）。

1. `:165-199`：任务地图。`：169` 的五列表收成 4 列；`:196` 的覆盖口径收成一句加指针。
   注意 `:1648`、`:1659` 的「数据覆盖矩阵」是 T22 的产品功能，不能一起删。
2. `:201-241`：排期与执行窗口三张表收成一段波次指针；W1–W4 取代「阶段＋泳道」双表。
3. `:87-107`：共享定义 SD-01 至 SD-16 收到 ≤8 条；卡里被引用的 SD-02／06／07／11／14–16 保留编号。
   `:91` 的证据字段清单只留「证据存在哪、给谁看」一句。
4. `:108-163`：目标架构与最少充分验收收短，不删清单。
5. 在 `prd-v2.md` 里重建全部卡：26 张 = 7 张只读卡 + 19 张经手卡。
   19 张经手 = 15 张改写（14 张六字段 + T14 记不做）+ T19 拆出的 T19a／T19b 2 张 + 新增 T23a／T16a 2 张。
   四行验收 18 组 = 19 减 T14。改写卡删「判定器」与证据子句；新卡不继承旧字段。
6. `:1046-1089`：T14 记「不做」，保留缺口说明与 T23 承接（`:1707` 已含退役清单）。
7. `:1140-1187`：T16 只读；新增 T16a（性能测量）排 W4、T18 前。
8. `:1283-1414`：T19 拆 T19a（A+B，W3）与 T19b（C，W4）；卡号用 T19a／T19b，不新增 T25。
9. `:1701-1827`：T23 保留，承接 T14 的扩展退役；新增 T23a 排 T06 前。
  10. `:1828-1840`：删「实测记录」表。
  11. `:1842-1874`：风险与交付说明只留未决缺口与风险；审查次数与历史流水移出。
  12. `:1875-1885`：变更说明收成一页，保留 `Supersedes:` 指针。
  13. 新文件头部写 `Supersedes: prd.md @ <旧 sha256 全文>`，并写旧件日期与 `status: draft`。
  实读旧件哈希：`823f101f7fce113f19b6e4a07478e276c2c0671e3b97b0470c32b305e1bff076`。
  写入前再读一次替换；读数不一致就停手报主会话。
  `status: draft` 保持到用户确认；旧件不动，回退只动新件。

**P4 的锚点（终末验收）**

1. T014：读 P1–P3 的 Done、证据与外部 PRD 的字节证据，跑覆盖表断言；只读，不改材料。
2. T015：对每个 Phase 的提交跑 `git show --name-only --format= <sha>`，与索引的写入集逐条对。
   再用 `git show <sha>^:<路径> | shasum` 核对旧字节可恢复；全程不改工作树。
3. T016：三条收口命令、一致性检查、十条定向测试、独立读者复读与用户确认。
   只读聚合，不修前三个 Phase 的缺陷。

### 全局文件边界

每个 Phase 的写集都必须是这份边界的子集；越界核对以本节为对照物。
P3 的写集为空，只对外部新件；P4 只读。

**MODIFY（12 条，均为既有文件）**

- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/steps.json`
- `skills/spec-specify/templates/spec-template.md`
- `skills/spec-plan/templates/phase-template.md`
- `tests/contract/acceptance-plan.test.mjs`
- `tests/contract/n11-acceptance-rules.test.mjs`
- `tests/contract/n11-plan-quality.test.mjs`
- `workflows/build-prd/SKILL.md`
- `workflows/build-prd/steps.json`
- `skills/spec-prd/SKILL.md`
- `skills/spec-prd/templates/prd-template.md`
- `skills/catalog.yaml`

**NEW（1 条）**

- `tests/contract/prd-card-shape.test.mjs`

**外部写面（不在本 worktree 写集）**

- `/Users/Hugh/Hugh/Project/PaperBuilder/specs/paperbuilder-architecture-optimization-planning-20261021/prd-v2.md`：唯一写入。
- 旧 `prd.md`：只读，一个字节不动；新件的 `Supersedes` 指向它。

**DO NOT TOUCH**

- PaperBuilder 旧 `prd.md` 与 `scripts/serve_f6.py`：前者是只读的旧版本，后者是既有脏文件。
- T01、T02、T03、T04、T05、T10、T16 的既有材料：七张只读卡，按原字节复制。
- `specs/archive/**`：历史任务材料，只读。
- `worktree 根/quality/evidence/**` 的历史原件：只读；本任务新增的 P3 证据不在这里。
- `任务根/quality/reviews` 与 `任务根/quality/evidence` 的既有原件：只读；本任务新增的 P3 证据除外。
- `decision-log.md`：只读，本任务不改。
- 除上面 MODIFY 与 NEW 列出的其它 `tests/`：不改。

### 接口与失败语义

模板的节名、字段名与步骤数就是接口；改它们等于改所有下游读者。

- **选择的架构方案**：原地改写既有模板与方法，不新建第二份材料、不新增中间层。
  理由：读者已在读这些文件；另起一份会造双权威，正是 D1 禁止的。
  放弃的方案：新建 `spec-plan-v2` 模板、另写一份 PRD；两案都会让旧文件继续被引用。
- **模块职责**：`workflows/build-plan` 与 `workflows/build-prd` 定流程；
  `skills/spec-*` 定材料形状；`tests/contract/` 定可重放的底线。
  三者互不代判；材料质量仍由独立读者判。
- **接口与数据流**：决策日志（来源）→ spec（需求与唯一判据）→ Phase 文件（增量与写集）→ 代码/材料（实施）→ 证据（
  `任务根/quality/tests/`）。
  每个箭头都有既有 owner；本任务不新增数据类型或持久对象。
- **失败语义**：写失败保原错与目标原件，回本作者修同一处再重放；检查器红则停在原地报主会话。
  跨仓被拒只把跨仓部分记 `unknown`，本仓部分照常交付；验收判不出真假回本文件的作者改判据。
- **新增控制面**：`N/A — 不新增校验器、stage、门、字段或第二份判据`。

**外部写面（P3 专用）**

- 交付物是另一个仓库的**新文件**：
  `.../paperbuilder-architecture-optimization-planning-20261021/prd-v2.md`。
  旧 `prd.md` 一个字节不动；本工作区同样不改，机器写集仍写 `none（跨仓交付）`。
- 新文件头部写 `Supersedes: prd.md @ <旧 sha256 全文>`、日期与 `status: draft`。
  实读旧件：sha256 `823f101f7fce…`（前 8 位 `823f101f`）、git blob `f20be184…`。
  最后提交日 2026-10-29，1,892 行。
  写入前再读一次，以当时读数为准；读数不一致就停手报主会话。
- 首次写入前，把旧 PRD 完整字节存到 `任务根/quality/evidence/P3-old-prd.md`（单份只读原文）。
  同目录另存 `P3-old-prd.sha256`，含全文哈希与 git blob 引用。
- 回退：旧件本就不动；新件标 `abandoned` 或删除，旧字节证据保留。
- 不自动提交该仓库；是否提交由用户决定。动它之前要一次用户答复（未决 1）。

**8 个 plain 问题与 17 个机器字段怎么对应**

| 人读问题 | 落到哪些机器字段 |
| --- | --- |
| 为什么做 | 来源 / FR / AC |
| 交付什么 | 输出 / 失败 |
| 不做什么 | 边界 / 禁止改动 |
| 前置 | 输入、依赖 |
| 怎么做 | 动作、文件 / 符号 |
| 怎么验收 | 测试层级 / 技能、场景、RED/GREEN、预期退出码、判定器 |
| 证据 | 证据、覆盖上限 |
| 下游（含何时停） | 停止 / 恢复、完成 |

表只做对照；字段名与顺序仍以 `runtime/stage/stage-content-contracts.mjs:869-909` 为准。

**任务地图的波次怎么排**

| 波次 | 成员 | 说明 |
| --- | --- | --- |
| 前置 | T01、T02、T03、T04、T05、T10、T16 | 只读卡，原样保留 |
| T06 前 | T23a | 新库切换，含 T10 表登记与 T01 前端基线 |
| W1 | T06 → T07 → T08 | 闭环三段 |
| W2 | T11、T09 → T12 → T13、T22 | 两条支线在 W2 并行 |
| W3 | T15、T21、T20、T19a | 展示与审计面 |
| W4 | T17、T23、T19b、T18；T16a 排 T18 前 | 收尾与总验收 |
| 不做 | T14 | 保留卡号与缺口说明，不排波次 |

波次只表示先后与可并行，不是时间承诺；同一波次里仍按依赖逐卡做。

**删旧要三件**

删旧不单开 Phase：它落 P1、P2 任务顺序的末尾，各一个提交；P4 只做只读的回退核对。
- 删除证明：目标文件不被 bundle 列出、无代码引用、引用者清单在 `tests/` 与 `move-map.json` 各核一次。
- 回退方式：每个删除提交可单独回退；P4 用只读命令核旧字节可恢复，不做真实 revert。
  外部 PRD 不走 revert：旧件本就不动，回退只把新件标 `abandoned` 或删除。
- 停止条件：删除后任一检查或定向测试变红，停手报主会话，不扩写集。

### 需求到任务追踪

决策日志的十二项决定各有唯一落点；同一项不写第二处。

| 决定项 | 主要 FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| A1 阶段验收（R-001） | FR-BP-001 | AC-BP-001、AC-BP-003 | P1/T001 | ORACLE-BP-ACCEPTANCE |
| A2 阶段拆分（R-001） | FR-BP-007 | AC-BP-004、AC-BP-005 | P1/T004 | ORACLE-BP-SPLIT |
| A3 执行建议（R-001） | FR-BP-012 | AC-BP-007 | P1/T002 | ORACLE-BP-ADVICE |
| A4 流程与模板小改（R-001、R-009） | FR-BP-016 | AC-BP-008 | P1/T002、T003、T004 | ORACLE-BP-FLOW |
| B1 任务级验收（R-002） | FR-PRD-001 | AC-PRD-003 | P2/T007 | ORACLE-PRD-CARD |
| B2 任务拆分（R-002） | FR-PRD-005 | AC-PRD-001 | P2/T007 | ORACLE-PRD-CARD |
| B3 写法与步骤（R-002） | FR-PRD-011 | AC-PRD-002 | P2/T005、T006 | ORACLE-PRD-FLOW |
| C2 任务地图（R-003） | FR-PB-001 | AC-PB-001 | P3/T010 | ORACLE-PB-MAP |
| C3 验收重写（R-003） | FR-PB-008 | AC-PB-004 | P3/T011 | ORACLE-PB-CARD |
| C4 遗漏与简化（R-004） | FR-PB-012 | AC-PB-006 | P3/T012 | ORACLE-PB-GAP |
| C5 PRD 模板与技能（R-002） | FR-PRD-015 | AC-PRD-001、AC-PRD-004 | P2/T007、T008 | ORACLE-PRD-SHAPE |
| D1 迁移与验证（R-005、R-011） | FR-MIG-001 | AC-MIG-001、AC-MIG-003 | P1/T004、P2/T008、P4/T015 | ORACLE-MIG-ROLLBACK |


每条验收的 Phase/Task 落点与判定器在这里逐行对照；T001–T016 全部出现。

| AC | 主要 FR | 来源 | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| AC-BP-001 | FR-BP-001、FR-BP-002、FR-BP-005 | R-001、R-007；A1 | P1/T001 | ORACLE-BP-ACCEPTANCE |
| AC-BP-002 | FR-BP-003、FR-BP-007 | R-001；A1 | P1/T001 | ORACLE-BP-LONGRUN |
| AC-BP-003 | FR-BP-004 | R-006；A1 | P1/T001 | ORACLE-BP-FOURQ |
| AC-BP-004 | FR-BP-008、FR-BP-009、FR-BP-010、FR-BP-006 | R-011；A2 | P1/T004 | ORACLE-BP-SPLIT |
| AC-BP-005 | FR-BP-009 | R-001；A2 | P1/T004 | ORACLE-BP-SPLIT-READ |
| AC-BP-006 | FR-BP-011 | R-001；A2、A4 | P1/T004 | ORACLE-BP-CARD-PROSE |
| AC-BP-007 | FR-BP-012、FR-BP-013 | R-001；A3 | P1/T002 | ORACLE-BP-ADVICE |
| AC-BP-008 | FR-BP-014、FR-BP-015、FR-BP-016、FR-BP-017、FR-BP-018 | R-009；A4 | P1/T002、T003、T004 | ORACLE-BP-FLOW |
| AC-PRD-001 | FR-PRD-003、FR-PRD-005、FR-PRD-007、FR-PRD-008、FR-PRD-012、FR-PRD-013、FR-PRD-015、FR-PRD-016 | R-002；B2、C5 | P2/T006、T007、T008 | ORACLE-PRD-SHAPE |
| AC-PRD-002 | FR-PRD-006、FR-PRD-009、FR-PRD-010、FR-PRD-011、FR-PRD-014 | R-002、R-011；B3 | P2/T005、T006 | ORACLE-PRD-FLOW |
| AC-PRD-003 | FR-PRD-001、FR-PRD-002、FR-PRD-004 | R-002；B1 | P2/T007 | ORACLE-PRD-CARD |
| AC-PRD-004 | FR-PRD-017 | R-002；C5 | P2/T008 | ORACLE-PRD-VERSION |
| AC-PB-001 | FR-PB-001、FR-PB-002、FR-PB-003、FR-PB-004、FR-PB-005、FR-PB-006、FR-PB-007 | R-003；C2 | P3/T010 | ORACLE-PB-MAP |
| AC-PB-002 | FR-PB-001、FR-MIG-004 | R-003、R-005、R-008；C2、D1 | P3/T009、T011 | ORACLE-PB-READONLY |
| AC-PB-003 | FR-PB-007、FR-PB-011 | R-003；C5 | P3/T011 | ORACLE-PB-CLEAN |
| AC-PB-004 | FR-PB-008、FR-PB-009 | R-003；C3 | P3/T011 | ORACLE-PB-CARD |
| AC-PB-005 | FR-PB-009、FR-PB-010、FR-PB-013 | R-003、R-004；C3、C4 | P3/T011、T013 | ORACLE-PB-READ |
| AC-PB-006 | FR-PB-002、FR-PB-012、FR-PB-014 | R-004；C4 | P3/T012、T013 | ORACLE-PB-GAP |
| AC-MIG-001 | FR-MIG-002、FR-MIG-005 | R-011；D1 | P1/T004 | ORACLE-MIG-DELETE-P1 |
| AC-MIG-002 | FR-MIG-002、FR-MIG-005 | R-002、R-011；D1 | P2/T008 | ORACLE-MIG-DELETE-P2 |
| AC-MIG-003 | FR-MIG-001、FR-MIG-004 | R-005、R-011；D1 | P4/T015 | ORACLE-MIG-ROLLBACK |
| AC-MIG-004 | FR-MIG-002 | R-005、R-011；D1 | P4/T015 | ORACLE-MIG-READ |
| AC-MIG-005 | FR-MIG-003 | R-005、R-011；D1 | P4/T016 | ORACLE-MIG-STATIC |
| AC-FINAL-001 | FR-FINAL-001 | R-005 | P4/T014 | ORACLE-FINAL-COVERAGE |
| AC-FINAL-002 | FR-FINAL-005 | R-007 | P4/T016 | ORACLE-FINAL-GREEN |
| AC-FINAL-003 | FR-FINAL-002 | R-005、R-006、R-010 | P4/T016 | ORACLE-FINAL-READ |
| AC-FINAL-004 | FR-FINAL-003 | R-008 | P4/T015 | ORACLE-FINAL-BOUNDARY |
| AC-FINAL-005 | FR-FINAL-004 | R-006、R-010 | P4/T016 | ORACLE-FINAL-CONFIRM |

每个任务一行的绑定在这里；来源列是该任务各 AC 行 R 编号的并集。

| 来源 | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-001、R-006、R-007 | FR-BP-001、FR-BP-002、FR-BP-003、FR-BP-004、FR-BP-005、FR-BP-007 | AC-BP-001、AC-BP-002、AC-BP-003 | P1/T001 | ORACLE-BP-ACCEPTANCE |
| R-001、R-009 | FR-BP-012、FR-BP-013、FR-BP-014、FR-BP-015、FR-BP-016 | AC-BP-007、AC-BP-008 | P1/T002 | ORACLE-BP-FLOW |
| R-001、R-007、R-009 | FR-BP-017、FR-BP-018 | AC-BP-008、AC-BP-001 | P1/T003 | ORACLE-BP-ACCEPTANCE |
| R-001、R-009、R-011 | FR-BP-006、FR-BP-008、FR-BP-009、FR-BP-010、FR-BP-011、FR-MIG-002、FR-MIG-005 | AC-BP-004、AC-BP-005、AC-BP-006、AC-BP-008、AC-MIG-001 | P1/T004 | ORACLE-BP-SPLIT |
| R-002 | FR-PRD-001、FR-PRD-002、FR-PRD-004、FR-PRD-007、FR-PRD-012、FR-PRD-015、FR-PRD-016 | AC-PRD-001、AC-PRD-003 | P2/T005 | ORACLE-PRD-SHAPE |
| R-002、R-011 | FR-PRD-003、FR-PRD-005、FR-PRD-006、FR-PRD-008、FR-PRD-011、FR-PRD-012、FR-PRD-013 | AC-PRD-001、AC-PRD-002 | P2/T006 | ORACLE-PRD-SHAPE |
| R-002、R-011 | FR-PRD-009、FR-PRD-010、FR-PRD-011、FR-PRD-014 | AC-PRD-002 | P2/T007 | ORACLE-PRD-FLOW |
| R-002、R-011 | FR-PRD-017、FR-MIG-002、FR-MIG-005 | AC-PRD-004、AC-MIG-002 | P2/T008 | ORACLE-PRD-VERSION |
| R-003、R-005、R-008 | FR-PB-001、FR-MIG-004 | AC-PB-002 | P3/T009 | ORACLE-PB-BASELINE |
| R-003 | FR-PB-003、FR-PB-004、FR-PB-005、FR-PB-006、FR-PB-007 | AC-PB-001 | P3/T010 | ORACLE-PB-MAP |
| R-003、R-005、R-008 | FR-PB-008、FR-PB-009、FR-PB-011、FR-MIG-004 | AC-PB-002、AC-PB-003、AC-PB-004 | P3/T011 | ORACLE-PB-CARD |
| R-003、R-004 | FR-PB-002、FR-PB-012、FR-PB-013、FR-PB-014 | AC-PB-006、AC-PB-004 | P3/T012 | ORACLE-PB-GAP |
| R-003、R-004 | FR-PB-009、FR-PB-010、FR-PB-013 | AC-PB-001、AC-PB-004、AC-PB-005、AC-PB-006 | P3/T013 | ORACLE-PB-READ |
| R-005 | FR-FINAL-001 | AC-FINAL-001 | P4/T014 | ORACLE-FINAL-COVERAGE |
| R-005、R-008、R-011 | FR-MIG-001、FR-MIG-004、FR-FINAL-003 | AC-MIG-003、AC-MIG-004、AC-FINAL-004 | P4/T015 | ORACLE-MIG-ROLLBACK |
| R-005、R-006、R-007、R-010、R-011 | FR-MIG-003、FR-FINAL-002、FR-FINAL-004、FR-FINAL-005 | AC-MIG-005、AC-FINAL-002、AC-FINAL-003、AC-FINAL-005 | P4/T016 | ORACLE-FINAL-GREEN |

Phase 机器字段的 oracle 是 Phase 级汇总名，每张卡的 oracle 必须落在本表。
`ORACLE-P1-PLAN-METHOD` 汇总 P1 的九条（AC-BP-001 至 AC-BP-008、AC-MIG-001）。
`ORACLE-PB-REWRITE` 汇总 P3 的六条（AC-PB-001 至 AC-PB-006）。

十一条原始需求各自判在哪：

| 原始需求 | 判定它的 AC | Phase |
| --- | --- | --- |
| 需求 1（R-001） | AC-BP-001、AC-BP-002、AC-BP-005、AC-BP-006、AC-BP-007 | P1 |
| 需求 2（R-002） | AC-PRD-001、AC-PRD-002、AC-PRD-003、AC-PRD-004、AC-MIG-002 | P2 |
| 需求 3（R-003） | AC-PB-001、AC-PB-002、AC-PB-003、AC-PB-004、AC-PB-005 | P3 |
| 需求 4（R-004） | AC-PB-005、AC-PB-006 | P3 |
| 需求 5（R-005） | AC-PB-002、AC-MIG-003、AC-MIG-004、AC-MIG-005、AC-FINAL-001、AC-FINAL-003 | P3、P4 |
| 需求 6（R-006） | AC-BP-003、AC-FINAL-003、AC-FINAL-005 | P1、P4 |
| 需求 7（R-007） | AC-BP-001、AC-FINAL-002 | P1、P4 |
| 需求 8（R-008） | AC-PB-002、AC-FINAL-004 | P3、P4 |
| 需求 9（R-009） | AC-BP-008 | P1 |
| 需求 10（R-010） | AC-FINAL-003、AC-FINAL-005 | P4 |
| 需求 11（R-011） | AC-BP-004、AC-PRD-002、AC-MIG-001、AC-MIG-002、AC-MIG-003、AC-MIG-004、AC-MIG-005 | P1、P2、P4 |

正文中文编号与机器编号的完整对照见 Appendix B。

### 全局验证策略

文档类交付也能重放：结构用命令，语义用独立读者，跨仓用字节证据。

- **验证策略**：四个 Phase 各自跑定向命令；不跑全量回归，不用「全绿」当质量结论。
- **三条收口命令**（build-plan 阶段实际会跑的）：
  `node tools/cli/check-stage-steps.mjs --stage=build-plan --task-path=<任务根>`，恒退出 0，只报事实。
  `node skills/spec-plan/scripts/check-authoring-budget.mjs <材料路径>`，可读退出 0，读不出退出 1；读数不设阈值。
  `node skills/spec-plan/scripts/check-reader-record.mjs <记录路径>`，形态 0、缺点名 2、不可读 1。
  `check-decision-log-chain` 与 `check-stage-quality` 不属于本阶段收口，不写成判据。
- **定向测试**：P1 gate 八条；P2 在八条之外再加两条。
  P1 八条：`phase-contract-prose`、`c05-phase-navigation`、
  `card05-author-material-consumer`、`authoring-shape`、`stage-closeout-step-contract`、
  `acceptance-plan`、`n11-acceptance-rules`、`n11-plan-quality`。
  P2 两条：`prd-card-shape`、`build-prd-review-contract`。
  每条命令由所属 Phase 卡给出，写成一条 `npx vitest run` 带齐该 Phase 的文件。
  技能与目录一致性用 `node tools/cli/check-skill-consistency.mjs --root <绝对包根>`，退出 0 为一致。
- **时间字段不是时间盒**：成本七字段与 `hard_cap_min` 只是活动成本估算，不作时限。
  到时不停；停止只由失败信号或用户答复触发。
- **RED 与 GREEN 设计**：P2 新增的 `prd-card-shape` 先写断言、在改模板前实跑 RED，再用同一命令判 GREEN。
  其余文档改动按 G-2 给客观替代：结构命令 + 独立读者，不制造仪式性 RED。
  未执行不宣称 RED 或 GREEN。
- **最终聚合**：P4 逐条消费 P1–P3 的证据核对全部 AC，并读回外部 PRD 的字节证据。
  本文件不宣称任何执行结果。
- **不能证明的内容**：不证明方法在新任务上真的更快；不证明 PaperBuilder 的工程质量；不证明用户已确认。

## 怎么算通过？

按 Appendix A 的同一套判据逐条核；命令留在所属 Phase，证据计划写七项。

### 验收判据在哪里？

判据只在 Appendix A：判定方式、时点、落点、验证、ORACLE、环境、谁判、承接、成本都在那里。
  正文只给指针，例如「判据见 Appendix A 的 AC-BP-001」；写两处必然漂移。
  本文件里的 Task 编号是计划编号，Phase 作者按全局顺序落成 `T001` 起；编号变化不改判据内容。

### 判定对象怎么与需求对齐？

判定对象就是需求说的那份材料：写计划的方法就判模板与流程，PRD 就判那份外部文件。
  不改判定对象，也不把「命令退出 0」当业务达成；跨仓交付的对象在另一个仓库，判它就是读那个文件。
  降级到副本或抽样时要写清等价边界；不等价就保留「未测」事实，不判通过。

### 验收对象是什么？

本任务的验收对象是方法与模板文件，不是页面也不是服务；因此页面五项按不适用记录并给理由。
  workspace 用认证 worktree 的真实绝对路径；service、route、viewport 与 state 无真实对象，保持 null。
  没有执行 `checkAcceptanceObject`：缺少三源适用性上下文，不冒充已执行；owner 为用户。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-quality-first-task-design-20261104",
  "service": null,
  "route": null,
  "state": null,
  "viewport": null,
  "owner": "用户"
}
```

### 证据计划怎么写？

判什么、怎么判、证据从哪来、谁提供、何时拿到、成本类别、拿不到怎么办，七项各归既有字段。
  判什么＝来源／FR／AC；怎么判＝判定方式与 ORACLE；证据从哪来＝各 Phase 的证据落点。
  谁提供＝Phase 的独立执行者；何时拿到＝开发与审查改完之后；成本类别＝命令级或读者级。
  拿不到怎么办＝按 Appendix A 的未执行档记 `incomplete` 或 `unavailable`，写清原因与恢复条件。
  缺任一项不得开工；不能用「文件存在」抵证据。

## 测试计划是什么？

本任务有四个测试面：文档形状、契约测试、跨仓文件、真实环境。

| 测试面 | 适用或具名不适用理由 | 判定器 | 证据类型 | 覆盖边界 |
| --- | --- | --- | --- | --- |
| 文档形状 | 适用：本任务交付的就是文档与模板 | 结构命令 + 独立读者 | 命令输出与读回记录 | 只证被列出的字段与节 |
| 契约测试 | 适用：模板被 5 条契约测试读取 | 定向 vitest | 退出码与原始输出 | 只证测试覆盖的断言 |
| 跨仓文件 | 适用但无测试：外部仓库按任务约定不加测试 | grep 与字节哈希 | 旧字节证据与读回 | 只证文件内容，不证运行 |
| 浏览器可见面 | 不适用：本任务无页面、无前端改动 | — | — | 没有浏览器证据 |

每个要测的面与覆盖验收都指向所属 Phase 的一条可执行命令；本节不复制命令。
  材料作者与独立验收者判定前读 `docs/architecture/test-asset-governance-rules.md` 的好坏例、
  同尺与独立判定要求。
  样本与判定者身份留本任务原件，不在本文件复制第二标准。

## 有什么风险和未决？

最可能让任务白做的是跨仓没授权；其次是删旧删出回不去的洞。

- **风险 1**：跨仓交付没有用户答复就动手；后果是改了别人的仓库且无法回滚。
  缓解是开工前只读盘点、写入等答复；被拒时只交本仓部分（未决 1）。
- **风险 2**：审查 provider 不可靠（历史上三次方向审查有两次空输出或取消）。
  缓解是如实记 `unavailable`、保留原失败、不换执行者也不冒通过；本任务不设审查轮次上限。
- **风险 3**：T14 记「不做」后被读者当成已覆盖；后果是「30 天读回零差异」的缺口消失。
  缓解是地图里保留 T14 行与缺口说明，P4 读回时逐条点它。
- **风险 4**：删旧删过头；后果是旧材料被改、回退找不到基线。
  缓解是 P1、P2 的删除证明加 P4 的提交核对；检查变红即停，不扩写集。
- **风险 5**：写集若写绝对路径会被校验器判不安全；后果是 P3 收口报错。
  缓解是机器写集写 `none（跨仓交付）`，绝对路径只在正文与证据里（事实 11）。
- **风险 6**：8 个人读问题与 17 个机器字段漂移；后果是读者按人读层写、机器读不到。
  缓解是对应表进模板，改机器字段名字必须同步改表（P1/T004）。
- **风险 7**：PaperBuilder 工作树已有脏文件 `scripts/serve_f6.py`。
  它不是本任务造成，也不在本任务写集内；谁都不碰它，P4 只核它未被本任务改动。
- **风险 8**：决策日志与实物不一致导致读者引错审查事实（未决 2）。
  缓解是本文件按 013 原件写，并在 P4 读回时对一次。
- **风险 9**：字段数断言从「历史有」变成「现在无」，回归没有防线。
  缓解是 P2 新增一条定向断言；审查若判为仪式，退回纯 grep，通过条件不变。

### 补充材料与术语在哪里？

推导、原始输出与被否方案只放具名原件，正文按路径与节锚点回读。

- 决策日志：`decision-log.md` 全文，R 与 A／B／C／D 组按节读。
- 盘点原件：`2026-11-04-paperbuilder-prd-inventory.md`，卡表、删改位置与承接行号都在那里。
- 审查原件：`任务根/quality/reviews/2026-11-04-013-make-decision-detail.json`。
- 术语：阶段、波次、判定器、写集、收口、外部交付物、等价替代、纯指针索引、Supersedes，首现已在正文解释。
  其余术语按 `GLOSSARY.md`；本文件不新造词。

## Appendix A — 验收判据（唯一权威）

每条承诺怎么验证、怎么通过、怎么失败、留什么证据，只写在这里。

判定方式只用三个固定词：`机器可判`、`只能人读`、`需真实环境，可用自动化采集判`。
  `机器可判` 指本任务内一条命令能重放真假；`只能人读` 指判据是语义可用性，命令输出不构成结论。
  第三种本次不适用：本任务没有真实外部运行环境要采集。
  判定者是实现上下文之外的独立执行单元，不需要用户本人到场；唯一例外是 AC-FINAL-005。
  成本七字段按模板写；`evidence_tier` 只用 `命令级` 与 `读者级` 两个词。

- [ ] **AC-BP-001**：一段验收能让没参与的人照着做，六件事齐且不指派角色。
  关联 FR-BP-001、FR-BP-002、FR-BP-005；来源 R-001、R-007 与 A1、A4。
  判定方式：只能人读；判定时点：P1 实现与独立审查改完之后。
  落点：P1/T001 与 `phases/P1-写计划的方法.md`；精确命令由该 Phase 卡给出。
验证：独立读者只读改写后的验收段与 3 段真实样本，回答四问。
  六件标签与阈值来源清单用 `grep` 先列一遍，只作前置，不算结论。
  再核两件事：验收在实现前冻结；实施中改验收要有用户真实答复原件（ref 与原文）。
  反例：擅自改验收且没有用户答复的样本，必须被判失败；判不出即判定器失效。
  ORACLE-BP-ACCEPTANCE 核六件齐、阈值有来源、无角色指派、四问可复述、冻结与改验收两件。
  环境与数据：认证 worktree 的方法文件与模板；样本取自本文件与模板示例。
  谁判：未参与写作的独立读者，开发与审查改完后判定，只读真实材料。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-acceptance-readback.md`。
  成本：executor=独立读者；estimate_min=22；hard_cap_min=45；
    resources=改写后的验收段、3 段样本与改验收反例；observation=四问原答、六个要素、冻结与答复；
    retry_cap=1；evidence_tier=读者级。
  资源来源：复用仓内既有模板与本次材料，不新造样张。
  为什么不能再简：再简只剩「六个标签在场」，判不出一段能不能照着做、验收有没有被偷偷改。
  未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
通过：四问齐答；六件齐；阈值有来源；无角色指派；验收实现前已冻结；改验收有用户答复原件。
失败：任一问缺答；阈值无来源；角色指派；擅自改验收且无用户答复；把命令退出 0 当结论。
证据：`任务根/quality/tests/P1-acceptance-readback.md`，执行者发布的单份原件。

- [ ] **AC-BP-002**：长跑只当末尾一次门，「顺带看上一任务」只是建议。
  关联 FR-BP-003、FR-BP-007；来源 A1 与 R-001。
  判定方式：只能人读；判定时点：P1 实现与独立审查改完之后。
  落点：P1/T001 与 `phases/P1-写计划的方法.md`。
验证：读者核 P1 的验收节，找长跑出现在哪、写没写跑多久、看什么、何时停。
  再核「顺带看上一任务」写成建议还是门：发现问题只记录、不阻塞当前任务。
  ORACLE-BP-LONGRUN 核长跑只在末尾一次、有停止条件、顺带看无阻塞义务。
  环境与数据：改写后的验收节与一处长跑示例；无需额外环境。
  谁判：未参与写作的独立读者，开发与审查改完后判定。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-longrun-readback.md`。
  成本：executor=独立读者；estimate_min=10；hard_cap_min=25；
    resources=验收节改写稿与长跑示例；observation=长跑位置、停止条件与建议措辞；
    retry_cap=1；evidence_tier=读者级。
  资源来源：仓内既有验收节改写稿，不新造样张。
  为什么不能再简：再简只剩「提到长跑」，判不出它是否成了每次门。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：长跑只在任务末尾一次；写清时长、观察面与停止条件；顺带看是建议且不阻塞。
失败：长跑被写成每次门；无停止条件；顺带看被写成必须满足的前置。
证据：`任务根/quality/tests/P1-longrun-readback.md`。

- [ ] **AC-BP-003**：四问读者测试真做过，记录可复读。
  关联 FR-BP-004；来源 R-006 与 A1。
  判定方式：只能人读；判定时点：P1 实现与审查改完之后。
  落点：P1/T001 与 `phases/P1-写计划的方法.md`。
验证：对 3 段验收各做一次四问读者测试：第一步做什么、什么算过、什么算不过、证据在哪与跑多久。
  记录含读者身份、读取范围、四问原答与缺口，用 `check-reader-record.mjs` 只验形态。
  ORACLE-BP-FOURQ 核四问原答在场、缺口具名、形态检查退出 0。
  环境与数据：读者与 3 段验收；
  记录形态命令 `node skills/spec-plan/scripts/check-reader-record.mjs <记录>`。
  谁判：未参与写作的独立审查者，核记录与四问原答，不看实现者自述。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-acceptance-readback.md`。
  成本：executor=独立审查者；estimate_min=15；hard_cap_min=30；
    resources=3 段验收与一份记录模板；observation=四问原答与形态检查退出码；
    retry_cap=1；evidence_tier=读者级。
  资源来源：仓内既有读者记录格式与本次材料，不新造工具。
  为什么不能再简：再简只剩「有人读过」，判不出四问答没答出。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：四问原答在场；答不出处有具名缺口与 owner；形态检查退出 0。
失败：只写「已读」结论；四问缺项；形态检查非 0 或 2 未处理。
证据：`任务根/quality/tests/P1-acceptance-readback.md` 与读者记录原件。

- [ ] **AC-BP-004**：三词、拆并、2–7、无时间盒四处读数与测试同时成立。
  关联 FR-BP-008、FR-BP-009、FR-BP-010、FR-BP-006；来源 A2 与 R-011。
  判定方式：机器可判；判定时点：P1 实现与独立审查改完之后。
  落点：P1/T004 与 `phases/P1-写计划的方法.md`；精确命令由该 Phase 卡给出。
验证：在认证 worktree 跑一组 `grep` 与一条定向测试：
  `grep -c "3–7" skills/spec-plan/templates/phase-template.md` 为 0；
  `grep -n "2–7"` 与 `grep -n "不引入数字阈值"` 各有输出；
  `grep -c "时间盒"` 在新写段为 0；验收节 `grep -c "谁开发\|谁测试\|谁审查"` 为 0；
  `npx vitest run tests/contract/authoring-shape.test.mjs` 退出 0。
  ORACLE-BP-SPLIT 核上述读数与退出码，读数不满足即失败。
  环境与数据：认证 worktree、Node v24.14.0、仓库自带测试；不需要网络与外部数据。
  谁判：未参与实现的独立执行单元，只读命令输出。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-split-shape.txt`。
  成本：executor=独立执行单元；estimate_min=15；hard_cap_min=30；
    resources=改写后的模板与方法；observation=每条 grep 读数与测试退出码；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有命令与测试，不新造夹具。
  为什么不能再简：再简只剩「文件在」，判不出 3–7 是否清掉、阈值句是否还在。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：每条读数符合、测试退出 0、三词定义各出现一次。
失败：「3–7」残留；「不引入数字阈值」被删；时间盒或角色指派出现；测试非 0。
证据：`任务根/quality/tests/P1-split-shape.txt`，含命令、cwd、退出码与原始输出。

- [ ] **AC-BP-005**：只用拆并规则，读者能判四个 Phase 的边界。
  关联 FR-BP-009；来源 A2 与 R-001。
  判定方式：只能人读；判定时点：P1 实现与审查改完之后。
  落点：P1/T004 与 `phases/P1-写计划的方法.md`。
验证：读者只读拆并规则与本文件的阶段大纲，逐 Phase 说出交付、一条验收与依赖。
  再对一处边界说明为什么不能合、另一处说明为什么不能拆。
  ORACLE-BP-SPLIT-READ 核读者能说出四份交付与判据，且理由能回到规则。
  环境与数据：拆并规则与阶段大纲；无需额外环境。
  谁判：未参与写作的独立读者，开发与审查改完后判定。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-split-readback.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=35；
    resources=拆并规则与阶段大纲；observation=四份交付、判据与两处理由；
    retry_cap=1；evidence_tier=读者级。
  资源来源：本次材料与仓内规则，不新造样张。
  为什么不能再简：再简只剩「分成五块」，判不出边界是否按交付而不是按文件。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：读者说出四份交付、每条验收与依赖；两处理由可回到拆并规则。
失败：只能复述标题；说不出验收；把文件当交付或按步骤拆。
证据：`任务根/quality/tests/P1-split-readback.md`。

- [ ] **AC-BP-006**：卡正文按 8 问作答，17 个机器字段原样还在。
  关联 FR-BP-011；来源 A2、A4 与 R-001、决定 5。
  判定方式：机器可判；判定时点：P1 实现与独立审查改完之后。
  落点：P1/T004 与 `phases/P1-写计划的方法.md`。
验证：读 `skills/spec-plan/templates/phase-template.md` 的「卡段」（单张示例任务卡 `### 任务 1` 的机器块：从
  `**校验器用，人可跳过**` 到下一个 `## ` 前）：
  8 个问题按序出现在机器块之前；在该卡段内 `grep -c "校验器用，人可跳过"` 为 1、
  17 个字段名各出现一次；整文件计数不作为判据；
  17 个字段名以示例卡（`### 任务 1`）的英文标签为准；空卡的中文标签是另一套，不混用；
  `grep -n "### 任务 N"` 的示例卡仍有正文。
  再跑 `npx vitest run tests/contract/phase-contract-prose.test.mjs tests/contract/card05-author-material-consumer.test.mjs`，
  退出 0。
  口径修正：原文按整文件计数，与模板真实结构冲突（整文件 11 处，基线也 11；含表格、说明、标题与示例）；改为卡段口径，实现未变。
  ORACLE-BP-CARD-PROSE 核 8 问顺序、机器块标记唯一、字段名齐、两测试退出 0。
  环境与数据：认证 worktree、Node v24.14.0、仓库自带契约测试。
  谁判：未参与实现的独立执行单元，只读模板字节与测试输出。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-card-shape.txt`。
  成本：executor=独立执行单元；estimate_min=15；hard_cap_min=30；
    resources=改写后的 Phase 模板与两条契约测试；observation=8 问顺序、标记计数与退出码；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有模板与测试，不新造夹具。
  为什么不能再简：再简只剩「有 8 个词」，判不出机器字段是否被顺手删了。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：8 问齐且有序；17 字段名齐；标记唯一；两条测试退出 0。
失败：8 问混进机器块；任一字段名被删改；测试非 0。
证据：`任务根/quality/tests/P1-card-shape.txt`。

- [ ] **AC-BP-007**：执行建议写回六条具体分工，且仍只是建议。
  关联 FR-BP-012、FR-BP-013；来源 A3 与 R-001。
  判定方式：只能人读；判定时点：P1 实现与审查改完之后。
  落点：P1/T002 与 `phases/P1-写计划的方法.md`。
验证：读者核「执行建议写什么？」一节，逐条找六项：
  ①第 0 阶段：所有阶段共用同一套测试环境与数据时统一准备，不需要就写理由跳过，不写进 Phase 文件；
  ②测试人数：一个验收面或一条命令 1 人；两个以上独立面 2–3 人各管一面，
  真实外部或小窗另加 1 个见证；
  ③每阶段 1 个开发（唯一写代码）；
  ④测试与审查独立上下文；
  ⑤修复回原开发同一会话；
  ⑥流程监控员只盯长或复杂阶段，看一次是建议不是定时器，不改代码不跑测试。
  以上六条都只是建议，采用与否由 build-code 定；出现「必须」「不得」当门或定时器即判不合格。
  ORACLE-BP-ADVICE 核六项内容、建议标记与无门。
  环境与数据：改写后的方法文件与 Phase 模板；无需额外环境。
  谁判：未参与写作的独立读者，开发与审查改完后判定。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-advice-readback.md`。
  成本：executor=独立读者；estimate_min=12；hard_cap_min=25；
    resources=执行建议节与模板；observation=六条内容、建议措辞与硬词清单；
    retry_cap=1；evidence_tier=读者级。
  资源来源：本次改写稿，不新造样张。
  为什么不能再简：再简只剩「写了建议」，判不出人数与角色是否真写清。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：六条具体内容都在；都标为建议；写明决定权；无新增字段或门。
失败：任一条缺失或只给类别名；写成硬规则；新增必填字段。
证据：`任务根/quality/tests/P1-advice-readback.md`。

- [ ] **AC-BP-008**：流程与模板四处结构变更都到位，且没增步、没增节。
  关联 FR-BP-014、FR-BP-015、FR-BP-016、FR-BP-017、FR-BP-018；来源 A4 与 R-009。
  判定方式：机器可判；判定时点：P1 实现与独立审查改完之后。
  落点：P1/T002、T003、T004 与 `phases/P1-写计划的方法.md`。
验证：`grep -n "阶段大纲" workflows/build-plan/SKILL.md` 与
  `skills/spec-specify/templates/spec-template.md` 各有输出；
  `grep -c "共七个槽" skills/spec-plan/templates/phase-template.md` 为 0，`grep -n "一条验收一小段"` 有输出；
  `grep -n "下游" skills/spec-plan/templates/phase-template.md` 的「下一消费者」节内有输出；
  `node -e` 读 `workflows/build-plan/steps.json` 断言步数仍为 12、末步仍 `closeout`；
  `node tools/cli/check-skill-consistency.mjs --root <绝对包根>` 退出 0。
  ORACLE-BP-FLOW 核五项读数、步数不变与一致性检查退出码。
  环境与数据：认证 worktree、Node v24.14.0；不需要网络。
  谁判：未参与实现的独立执行单元，只读字节与输出。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-flow-shape.txt`。
  成本：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
    resources=三个改动文件与 steps.json；observation=五条读数、步数、退出码；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有文件与检查器，不新造工具。
  为什么不能再简：再简只剩「有阶段大纲」，判不出 7 槽是否真删、步数是否被改。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：五项读数全中；步数 12；一致性检查退出 0。
失败：任一缺失；第 0 阶段进了 Phase 文件；步数或末步被改。
证据：`任务根/quality/tests/P1-flow-shape.txt`。

- [ ] **AC-PRD-001**：模板只剩 6 字段、4 列，三类样例与七类禁用形式都能判。
  关联 FR-PRD-003、FR-PRD-005、FR-PRD-007、FR-PRD-008、FR-PRD-012、FR-PRD-013、
  FR-PRD-015、FR-PRD-016。
  来源 B2、B3、C5 与 R-002。
  判定方式：机器可判；判定时点：P2 实现与独立审查改完之后。
  落点：P2/T006、T007、T008 与 `phases/P2-写PRD的方法.md`。
验证：`npx vitest run tests/contract/prd-card-shape.test.mjs` 退出 0。
  七类禁用形式逐类计数为 0：16 字段散文、状态表、命令与实测记录、判定器、证据字段、
  `.py`／`.ts`／`.tsx` 行号、重复覆盖矩阵。
  地图表头 4 列；6 个字段名各一次；头部引用 material-writing。
  三类样例各一处且标名不同：单卡、同卡多段、拆卡。
  负例：在临时副本里各放一处禁用形式，同一组检查必须命中；命中不了即判定器失效。
  ORACLE-PRD-SHAPE 核计数、三类样例、负例与退出码。
  环境与数据：认证 worktree、Node、仓库自带 vitest；负例副本用完删。
  谁判：未参与实现的独立执行单元，只读字节与测试输出。
  承接：结论写 P2 的 Done 与 `任务根/quality/tests/P2-prd-shape.txt`、
  `P2-prd-card-shape-green.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=模板、技能文件与新断言；observation=七类计数、三类样例、负例命中；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有文件；负例副本不提交。
  为什么不能再简：再简只剩「模板能打开」，判不出禁用形式是否清、样例是否摆设。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：测试退出 0；七类计数为 0；三类样例齐；负例全部命中；4 列与 6 字段就位。
失败：任一计数非 0；样例缺失或只有一种；负例不命中；列数或字段数不符。
证据：`任务根/quality/tests/P2-prd-shape.txt` 与 `P2-prd-card-shape-green.txt`。

- [ ] **AC-PRD-002**：六步、两次内容调用、一次审查与一次作者都没被改坏。
  关联 FR-PRD-006、FR-PRD-009、FR-PRD-010、FR-PRD-011、FR-PRD-014；来源 B3 与 R-002、R-011。
  判定方式：机器可判；判定时点：P2 实现与审查改完之后。
  落点：P2/T005、T006 与 `phases/P2-写PRD的方法.md`。
验证：`grep -n "一个作者"`、`grep -n "一次审查"`、`grep -n "两次"` 在
  `workflows/build-prd/SKILL.md` 与 `skills/spec-prd/SKILL.md` 有输出；
  `grep -n "拆卡\|实现可行性\|范围\|验收"` 命中审查四件事；
  `node -e` 读 `workflows/build-prd/steps.json` 断言步数仍为 6、末步仍 `closeout`；
  `npx vitest run tests/contract/build-prd-review-contract.test.mjs` 退出 0。
  ORACLE-PRD-FLOW 核四组读数、步数 6 与测试退出码。
  环境与数据：认证 worktree、Node；不需要网络。
  谁判：未参与实现的独立执行单元，只读字节与测试输出。
  承接：结论写 P2 的 Done 与 `任务根/quality/tests/P2-prd-flow.txt`。
  成本：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
    resources=两个技能文件与 build-prd 流程；observation=四组读数、步数与退出码；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有文件与测试，不新造工具。
  为什么不能再简：再简只剩「有六步字样」，判不出调用次数与审查范围是否被扩。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：四组读数齐；步数 6；测试退出 0。
失败：调用次数被写成年限之外；审查改为逐条格式审；步数改变。
证据：`任务根/quality/tests/P2-prd-flow.txt`。

- [ ] **AC-PRD-003**：一张卡一页读完，三类样例各自判对。
  关联 FR-PRD-001、FR-PRD-002、FR-PRD-004；来源 B1、B2 与 R-002。
  判定方式：只能人读；判定时点：P2 实现与审查改完之后。
  落点：P2/T007 与 `phases/P2-写PRD的方法.md`。
验证：读者只读模板的三类样例，逐类给结论：
  单卡样例说出目标、操作、条件、通过，判为一张卡；
  同卡多段样例说出每段对应哪个强关联结果，判为同卡多段而不是拆卡；
  拆卡样例说出为什么拆，判为两张卡而不是硬并。
  再核四行都有「故意弄坏一处必须失败」，且一页内读完。
  ORACLE-PRD-CARD 核三类结论、四行负控与页内边界。
  环境与数据：改写后的模板与三类样例；无需额外环境。
  谁判：未参与写作的独立读者，开发与审查改完后判定。
  承接：结论写 P2 的 Done 与 `任务根/quality/tests/P2-card-readback.md`。
  成本：executor=独立读者；estimate_min=25；hard_cap_min=50；
    resources=模板与三类样例；observation=三类结论、负控与页内边界；
    retry_cap=1；evidence_tier=读者级。
  资源来源：本次改写稿，不新造样张。
  为什么不能再简：再简只剩「有四行」，判不出强关联与不相关是否分得开。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：三类样例都判对；四行齐且各有一处负控；无命令与证据 schema；一页读完。
失败：把强关联拆成两张卡；把不相关硬并成一张；四行缺负控；仍写命令或 schema。
证据：`任务根/quality/tests/P2-card-readback.md`。

- [ ] **AC-PRD-004**：版本与消费面同步，改完还能被既有检查器读。
  关联 FR-PRD-017；来源 C5 与 R-002、事实 9、事实 10。
  判定方式：机器可判；判定时点：P2 实现与审查改完之后。
  落点：P2/T008 与 `phases/P2-写PRD的方法.md`。
验证：读 `skills/catalog.yaml:416-424`，
  断言 `local_version` 不是 `1.0.0`、`last_reviewed_at` 为本次日期；
  `node -e` 读 `skills/spec-prd/skill-bundle.json` 断言文件清单仍两项且两文件存在；
  `node tools/cli/check-skill-consistency.mjs --root <绝对包根>` 退出 0；
  `npx vitest run tests/n2-skill-catalog-portability.test.mjs` 退出 0。
  ORACLE-PRD-VERSION 核版本字段、清单、两个退出码。
  环境与数据：认证 worktree、Node、仓库自带测试；不需要网络。
  谁判：未参与实现的独立执行单元，只读字节与输出。
  承接：结论写 P2 的 Done 与 `任务根/quality/tests/P2-version.txt`。
  成本：executor=独立执行单元；estimate_min=15；hard_cap_min=30；
    resources=catalog、bundle 与两条检查；observation=版本字段、清单项与退出码；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有文件；不新增第三方依赖。
  为什么不能再简：再简只剩「能读 YAML」，判不出版本是否被忘掉、清单是否失效。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：版本已升；清单两项且文件在；两个退出码为 0。
失败：版本未升；清单指向不存在的文件；任一检查非 0。
证据：`任务根/quality/tests/P2-version.txt`。

- [ ] **AC-PB-001**：地图 4 列、26 张卡齐，每张卡的波次与先后都对得上。
  关联 FR-PB-001、FR-PB-002、FR-PB-003、FR-PB-004、FR-PB-005、FR-PB-006、FR-PB-007。
  来源 C2 与 R-003、决定 3、决定 4。
  判定方式：机器可判；判定时点：P3 写完之后、P3 审查改完之后。
  落点：P3/T010 与 `phases/P3-重写规划PRD.md`；精确命令由该 Phase 卡给出。
验证：在 `prd-v2.md` 上跑一段解析地图的脚本，逐卡断言：
  W1 恰为 T06→T07→T08；W2 恰为 T11、T09→T12→T13、T22；
  W3 恰为 T15、T21、T20、T19a；W4 恰为 T17、T23、T19b、T18，且 T16a 在 T18 前；
  T23a 标「T06 前」；T14 记「不做」且不排波次；卡标题 26 个；表头 4 列。
  负例：把两张卡的波次对调后再跑同一脚本，必须报错；不报错即判定器失效。
  ORACLE-PB-MAP 核逐卡波次、顺序、例外卡与负例。
  环境与数据：新件只读；负例在临时副本上做，不改新件；不需要网络。
  谁判：未参与实现的独立执行单元，只读脚本输出。
  承接：结论写 P3 的 Done 与 `任务根/quality/tests/P3-map.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=新件与解析脚本；observation=逐卡波次、顺序、例外与负例报错；
    retry_cap=1；evidence_tier=命令级。
  资源来源：新件只读；脚本写在证据里，不进仓库。
  为什么不能再简：再简只剩「有地图」，判不出 26 张卡各归哪一波、顺序对不对。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：26 张卡齐；四波成员与顺序全中；T23a、T14、T16a 三处例外对；负例报错。
失败：卡数不符；某卡波次或顺序不符；例外缺失；负例不报错。
证据：`任务根/quality/tests/P3-map.txt`。

- [ ] **AC-PB-002**：旧件字节不变，新件带 Supersedes，七张只读卡按原字节复制。
  关联 FR-PB-001、FR-MIG-004；来源 C2、D1 与 R-003、R-005、R-008。
  判定方式：机器可判；判定时点：P3 写完之后、P3 审查改完之后。
  落点：P3/T009、T011 与 `phases/P3-重写规划PRD.md`。
验证：`shasum -a 256 prd.md` 与 T009 记录的全文哈希相等；`git status --porcelain` 不含 prd.md。
  `git hash-object prd.md` 与 T009 记录的 blob 相等。
  旧字节原文存 `任务根/quality/evidence/P3-old-prd.md`。
  新件头部 `grep -c "^Supersedes: prd.md @"` 为 1，行内全文哈希与 T009 记录一致。
  七张只读卡按 `### Tnn —` 切片取 `shasum -a 256`，旧件与新件逐个相等，共 7 对。
  切片到下一张卡前一行，命令形如
  `awk '/^### T03 /{f=1} /^### T/&&!/^### T03 /{f=0} f' 文件 | shasum -a 256`。
  ORACLE-PB-READONLY 核全文哈希、Supersedes 行与 7 对切片哈希。
  环境与数据：旧件与新件只读；旧字节存档 `任务根/quality/evidence/P3-old-prd.md`；不需要网络。
  谁判：未参与实现的独立执行单元，只读哈希与状态。
  承接：结论写 P3 的 Done 与 `任务根/quality/tests/P3-readonly.txt`、
  `任务根/quality/evidence/P3-old-prd.sha256`。
  成本：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
    resources=旧件、新件与 T009 记录；observation=全文哈希、Supersedes 行与 7 对切片哈希；
    retry_cap=1；evidence_tier=命令级。
  资源来源：旧件只读，哈希现场计算。
  为什么不能再简：再简只剩「文件在」，判不出旧件有没有被覆盖、只读卡有没有漂移。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：全文哈希相等；状态不含旧件；Supersedes 恰一行且哈希对得上；7 对切片哈希全等。
失败：旧件被改；Supersedes 缺失或哈希不符；任一只读卡切片不等。
证据：`任务根/quality/tests/P3-readonly.txt` 与
  `任务根/quality/evidence/P3-old-prd.sha256`。

- [ ] **AC-PB-003**：公共章节与改写卡清干净，七张只读卡保留继承字段。
  关联 FR-PB-007、FR-PB-011；来源 C5、C3 与 R-003。
  判定方式：机器可判；判定时点：P3 写完之后、P3 审查改完之后。
  落点：P3/T011 与 `phases/P3-重写规划PRD.md`。
验证：范围是 19 张经手卡与公共章节；七张只读卡是唯一例外，不在此判。
  在 `prd-v2.md` 上以 `^### T` 切卡，判定器只允许出现在 T01–T05、T10、T16 七张卡内。
  19 张经手卡与公共章节里，七类禁用形式逐类计数为 0；七张只读卡交给 AC-PB-002 逐字节比对：
  16 字段散文、状态表、命令与实测记录、判定器、证据字段、`.py`／`.ts`／`.tsx` 行号、重复覆盖矩阵。
  `grep -c "^Supersedes:"` 为 1；`grep -c "^## 实测记录"` 为 0；围栏代码块计数为 0。
  负例：在临时副本的经手卡里各放一处七类形式，同一组检查必须命中。
  ORACLE-PB-CLEAN 核分段计数、Supersedes、实测记录、代码块与负例。
  环境与数据：新件只读；负例在临时副本上做；不需要网络。
  谁判：未参与实现的独立执行单元，只读计数与脚本输出。
  承接：结论写 P3 的 Done 与 `任务根/quality/tests/P3-clean.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=新件、分段脚本与负例副本；observation=分层计数与负例命中；
    retry_cap=1；evidence_tier=命令级。
  资源来源：新件只读；负例副本不提交。
  为什么不能再简：再简只剩「文件能读」，判不出判定器是否越界、公共章节是否清干净。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：判定器只在七张只读卡内；其余位置七类计数为 0；Supersedes 一行；负例全部命中。
失败：判定器越界；任一类残留；Supersedes 缺失；负例不命中。
证据：`任务根/quality/tests/P3-clean.txt`。

- [ ] **AC-PB-004**：18 张改写卡各有且只有一组四行验收。
  关联 FR-PB-008、FR-PB-009；来源 C3 与 R-003。
  判定方式：机器可判；判定时点：P3 写完之后、P3 审查改完之后。
  落点：P3/T011 与 `phases/P3-重写规划PRD.md`。
验证：在外部 PRD 上跑：
  `grep -c "怎样算通过（含"` 为 18；`grep -c "什么条件（含真跑或替代"` 为 18；
  以 `^### T` 切块，每块里「目标：」「怎么操作：」各一次；
  卡内 `grep -c "长窗"` 只允许出现在具名例外处，且每卡至多一处。
  ORACLE-PB-CARD 核 18 组、四行标签、每块次数与长窗例外数。
  环境与数据：新 PRD；不需要网络。
  谁判：未参与实现的独立执行单元，只读计数与切块结果。
  承接：结论写 P3 的 Done 与 `任务根/quality/tests/P3-cards.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=新 PRD 与切块脚本；observation=18 组、每块次数、长窗例外；
    retry_cap=1；evidence_tier=命令级。
  资源来源：外部 PRD 只读；切块脚本写在证据里，不进仓库。
  为什么不能再简：再简只剩「有验收」，判不出是不是四行一段、有没有多套。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：18 组；每组四行齐；每块各一次；长窗例外不超一处。
失败：组数不符；某卡有两组或零组；长窗被当每次门。
证据：`任务根/quality/tests/P3-cards.txt`。

- [ ] **AC-PB-005**：十八张改写卡逐卡能说清门与替代。
  关联 FR-PB-009、FR-PB-010、FR-PB-013；来源 C3、C4 与 R-003、R-004。
  判定方式：只能人读；判定时点：P3 写完之后、P3 审查改完之后。
  落点：P3/T011、T013 与 `phases/P3-重写规划PRD.md`。
验证：读者逐张核 18 张改写卡：T06–T09、T11–T13、T15、T17、T18、T19a、T19b、
  T20、T21、T22、T23、T23a、T16a，一张不跳。
  每卡判四件事：长窗、全量分母、真实原件是否都写成具名例外；一次真实小窗是否在任务末尾；
  大表是否抽样；测不出的地方是否有等价替代与「未测」事实、影响与恢复条件。
  可读性抽样只作补充，不能代替逐卡核。
  ORACLE-PB-READ 核 18 张逐卡结论、四处门与替代写法。
  环境与数据：新件与 18 张卡；无需额外环境。
  谁判：未参与写作的独立读者，写完与审查改完后判定。
  承接：结论写 P3 的 Done 与 `任务根/quality/tests/P3-card-readback.md`。
  成本：executor=独立读者；estimate_min=45；hard_cap_min=90；
    resources=新件与 18 张卡；observation=逐卡四项结论与替代说明；
    retry_cap=1；evidence_tier=读者级。
  资源来源：新件只读，不新造样张。
  为什么不能再简：再简只剩「翻过几张」，判不出 18 张里哪张还留着长窗当门。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：18 张逐卡有结论；长窗、全量分母、真实原件都降为具名例外；替代与未测分得开。
失败：漏卡；某卡仍把长窗或全量当每次门；把不等价替代写成已覆盖。
证据：`任务根/quality/tests/P3-card-readback.md`。

- [ ] **AC-PB-006**：五处遗漏各有承接卡，只读边界没被当落点。
  关联 FR-PB-002、FR-PB-012、FR-PB-014；来源 C4 与 R-004、决定 4。
  判定方式：只能人读；判定时点：P3 写完之后、P3 审查改完之后。
  落点：P3/T012、T013 与 `phases/P3-重写规划PRD.md`。
验证：读者核五处遗漏：T03 生产切换、T02 恢复链、T10 表登记与凭证、T16 性能、T01 前端基线。
  逐个指出承接卡与承接验收，并说明 T05、T10 为何不作为回补写入落点。
  再核 T01 前端基线写进 T23a 的理由（T01 只量 Python 进程、明写不碰 frontend）。
  ORACLE-PB-GAP 核五处各有落点、只读边界未被破、T23a 理由在卡内可读。
  环境与数据：新 PRD 与盘点原件；无需额外环境。
  谁判：未参与写作的独立读者，写完与审查改完后判定。
  承接：结论写 P3 的 Done 与 `任务根/quality/tests/P3-gap-readback.md`。
  成本：executor=独立读者；estimate_min=25；hard_cap_min=50；
    resources=新 PRD 与盘点原件；observation=五处落点、边界说明与 T23a 理由；
    retry_cap=1；evidence_tier=读者级。
  资源来源：外部 PRD 只读，盘点原件只读。
  为什么不能再简：再简只剩「补了几张卡」，判不出漏项是否真的被接住。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：五处都有承接卡与验收；T05、T10 未被写成回补落点；T23a 理由可读。
失败：任一处无落点；把 T05 或 T10 当写入落点；T23a 理由缺失。
证据：`任务根/quality/tests/P3-gap-readback.md`。

- [ ] **AC-MIG-001**：P1 侧的旧 7 槽清尾，删除证明三件齐。
  关联 FR-MIG-002、FR-MIG-005；来源 D1 与 R-011、决定 7、决定 9。
  判定方式：机器可判；判定时点：P1 实现与独立审查改完之后。
  落点：P1/T004 与 `phases/P1-写计划的方法.md`。
验证：`grep -rn "七个槽\|七槽" skills workflows tests docs` 无输出。
  `grep -rn "3–7" skills/spec-plan` 无输出；`node -e` 读 `skills/spec-plan/skill-bundle.json` 断言文件清单未增未减。
  `grep -rn` 被删节名的代码引用为空；引用者清单在 `tests/` 与 `docs/architecture/move-map.json` 各核一次。
  ORACLE-MIG-DELETE-P1 核四条读数与两份清单。
  环境与数据：认证 worktree；`specs/archive/**` 只读；不需要网络。
  谁判：未参与实现的独立执行单元，只读 grep、清单与状态。
  承接：结论写 P1 的 Done 与 `任务根/quality/tests/P1-delete-proof.txt`。
  成本：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
    resources=P1 写集文件与 bundle；observation=四条读数为空或零；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有文件；不新增依赖。
  为什么不能再简：再简只剩「没报错」，判不出旧 7 槽是否还藏在模板里。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：四条读数为空或零；bundle 清单不变；引用者清单为空。
失败：任一残留；bundle 清单变化；出现新引用。
证据：`任务根/quality/tests/P1-delete-proof.txt`。

- [ ] **AC-MIG-002**：P2 侧的 16 字段清尾，删除证明三件齐。
  关联 FR-MIG-002、FR-MIG-005；来源 D1、C5 与 R-002、R-011、决定 9。
  判定方式：机器可判；判定时点：P2 实现与独立审查改完之后。
  落点：P2/T008 与 `phases/P2-写PRD的方法.md`。
验证：`grep -rc "16 字段\|16 个字段" skills/spec-prd workflows` 全为 0。
  `node -e` 读 `skills/spec-prd/skill-bundle.json` 断言文件清单未增未减。
  `grep -rn` 被删字段名的代码引用为空；引用者清单在 `tests/` 与 `docs/architecture/move-map.json` 各核一次。
  ORACLE-MIG-DELETE-P2 核四条读数与两份清单。
  环境与数据：认证 worktree；`specs/archive/**` 只读；不需要网络。
  谁判：未参与实现的独立执行单元，只读 grep、清单与状态。
  承接：结论写 P2 的 Done 与 `任务根/quality/tests/P2-delete-proof.txt`。
  成本：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
    resources=spec-prd 文件与 bundle；observation=四条读数为空或零；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有文件；不新增依赖。
  为什么不能再简：再简只剩「改过模板」，判不出 16 字段是否还留在技能正文里。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：四条读数为空或零；bundle 清单不变；引用者清单为空。
失败：任一残留；bundle 清单变化；出现新引用。
证据：`任务根/quality/tests/P2-delete-proof.txt`。

- [ ] **AC-MIG-003**：每个 Phase 的提交只触及申报写集，旧字节可恢复。
  关联 FR-MIG-001、FR-MIG-004；来源 D1 与 R-005、R-011、决定 7。
  判定方式：机器可判；判定时点：P4 读完 P1–P3 原件之后。
  落点：P4/T015 与 `phases/P4-终末验收.md`。
验证：`git log --format='%H %s'` 列出各 Phase 的提交，按 Phase 分组。
  对每个提交跑 `git show --name-only --format= <sha>`，与 `phases/index.md` 的写入集逐条对。
  再用 `git show <sha>^:<路径> | shasum -a 256` 与 P1、P2 记录的删除前哈希相等。
  全程只读：`git status` 前后一致，工作树未改；不建分支、不 revert。
  ORACLE-MIG-ROLLBACK 核提交清单、路径比对、哈希相等与状态一致。
  环境与数据：认证 worktree 的本地 git；不推送远端；不写工作树。
  谁判：未参与实现的独立执行单元，只读 git 输出。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-commits.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=各 Phase 提交与索引；observation=提交清单、路径比对与哈希；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内 git，不新造脚本。
  为什么不能再简：再简只剩「有提交」，判不出某一步能不能单独回、有没有混入无关路径。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：每个提交只触申报写集；旧字节哈希相等；状态前后一致。
失败：任一提交混入无关路径；哈希不等；工作树被改。
证据：`任务根/quality/tests/P4-commits.txt`。

- [ ] **AC-MIG-004**：删除清单每条都能指到替代者。
  关联 FR-MIG-002；来源 D1 与 R-005、R-011。
  判定方式：只能人读；判定时点：P4 读完 P1–P3 原件之后。
  落点：P4/T015 与 `phases/P4-终末验收.md`。
验证：读者拿三行清单逐条找替代者：16 字段→6 字段卡、7 槽→一段验收、旧步骤→新步骤或别名。
  每条要指到文件与节，再指到守它的测试或命令。
  ORACLE-MIG-READ 核三条各有替代位置与回归手段。
  环境与数据：删除清单与改后文件；无需额外环境。
  谁判：未参与写作的独立读者，读完 P1、P2 原件之后判定。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-delete-readback.md`。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=30；
    resources=删除清单与改后文件；observation=三条替代位置与回归手段；
    retry_cap=1；evidence_tier=读者级。
  资源来源：本次材料，不新造样张。
  为什么不能再简：再简只剩「删了」，判不出删掉的东西有没有人接。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：三条都能指到替代者与回归手段。
失败：任一条无替代者；替代者已失效；回归手段不存在。
证据：`任务根/quality/tests/P4-delete-readback.md`。

- [ ] **AC-MIG-005**：三条收口命令、一致性检查与十条定向测试组成静态检查，全绿才算收口。
  关联 FR-MIG-003；来源 D1 与 R-005、R-011。
  判定方式：机器可判；判定时点：P4 读完 P1–P3 原件之后。
  落点：P4/T016 与 `phases/P4-终末验收.md`。
验证：`node tools/cli/check-stage-steps.mjs --stage=build-plan --task-path=<任务根>` 恒退出 0，只读输出。
  `node skills/spec-plan/scripts/check-authoring-budget.mjs <材料路径>` 逐份退出 0 或 1，1 时写原因。
  `node skills/spec-plan/scripts/check-reader-record.mjs <记录路径>` 形态 0、缺点名 2、不可读 1。
  `node tools/cli/check-skill-consistency.mjs --root <绝对包根>` 退出 0；再跑十条定向契约测试（P1 八条 + P2 两条）。
  ORACLE-MIG-STATIC 核退出码清单与测试清单。
  环境与数据：认证 worktree、Node v24.14.0；不需要网络。
  谁判：未参与实现的独立执行单元，只读输出。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-static.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=三条命令、一致性检查与十条测试；observation=退出码与原始输出；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有命令与测试，不新造工具。
  为什么不能再简：再简只剩「跑过」，判不出哪条绿、哪条红。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：三条命令与一致性检查按预期退出；十条测试逐条退出 0。
失败：任一命令或测试非 0 且无具名原因。
证据：`任务根/quality/tests/P4-static.txt`。

- [ ] **AC-FINAL-001**：覆盖表完整，没有没人认领的需求或 AC。
  关联 FR-FINAL-001；来源 R-005 与完整执行清单。
  判定方式：机器可判；判定时点：P4 读完 P1–P3 原件之后。
  落点：P4/T014 与 `phases/P4-终末验收.md`。
验证：用一条 `node -e` 脚本读 spec 的 Appendix B 表与各 Phase 的「覆盖 AC」，断言：
  11 条需求各有 ≥1 个 AC；28 条 AC 各有 Phase 落点；缺口清单为 0。
  脚本、输入与输出留证据，不改材料。
  ORACLE-FINAL-COVERAGE 核三类计数与缺口清单。
  环境与数据：spec、index 与四个 Phase；不需要网络。
  谁判：未参与实现的独立执行单元，只读材料与脚本输出。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-coverage.txt`。
  成本：executor=独立执行单元；estimate_min=25；hard_cap_min=50；
    resources=spec、index 与四个 Phase；observation=三类计数与缺口清单；
    retry_cap=1；evidence_tier=命令级。
  资源来源：本次材料，不新造数据。
  为什么不能再简：再简只剩「表存在」，判不出有没有孤儿 AC。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：三类计数齐；缺口 0。
失败：任一需求无 AC；任一 AC 无 Phase；缺口非空。
证据：`任务根/quality/tests/P4-coverage.txt`。

- [ ] **AC-FINAL-002**：终末检查全绿，跳过项都有具名理由。
  关联 FR-FINAL-005；来源 R-007。
  判定方式：机器可判；判定时点：P4 读完 P1–P3 原件之后。
  落点：P4/T016 与 `phases/P4-终末验收.md`。
验证：重跑 AC-MIG-005 的三条命令、一致性检查与十条定向测试；逐条记退出码。
  所有跳过项写出理由、影响面与恢复条件；任一非 0 必须写原因，不得记通过。
  ORACLE-FINAL-GREEN 核退出码清单、跳过项与原因。
  环境与数据：认证 worktree、Node；不需要网络。
  谁判：未参与实现的独立执行单元，只读输出。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-green.txt`。
  成本：executor=独立执行单元；estimate_min=30；hard_cap_min=60；
    resources=三条命令、一致性检查与十条测试；observation=退出码、跳过项与原因；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内既有命令与测试。
  为什么不能再简：再简只剩「都跑过」，判不出跳过项有没有被藏起来。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：全部按预期退出；跳过项有理由与影响面。
失败：任一非 0 未写原因；跳过项无理由；把跳过写成通过。
证据：`任务根/quality/tests/P4-green.txt`。

- [ ] **AC-FINAL-003**：独立读者按原始需求复读当前全部材料，四问能答。
  关联 FR-FINAL-002；来源 R-005、R-006、R-010。
  判定方式：只能人读；判定时点：P4 读完 P1–P3 原件之后、用户确认之前。
  落点：P4/T016 与 `phases/P4-终末验收.md`。
验证：读者读 spec、index、四个 Phase 与外部 PRD，回答目标、理由、下一步、失败恢复四问。
  记录含读者身份、读取范围、四问原答与缺口，用 `check-reader-record.mjs` 只验形态。
  ORACLE-FINAL-READ 核四问原答、材料范围与形态退出码。
  环境与数据：当前全部材料与读者；不需要网络。
  谁判：未参与写作的独立读者，P4 读完 P1–P3 原件之后判定。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-readback.md`。
  成本：executor=独立读者；estimate_min=40；hard_cap_min=90；
    resources=当前全部材料与外部 PRD；observation=四问原答与形态退出码；
    retry_cap=1；evidence_tier=读者级。
  资源来源：本次材料，不新造样张。
  为什么不能再简：再简只剩「有人读过」，判不出材料能不能被下一位用。
  未执行记 `incomplete` 并写约定时点；`unavailable` 须给原因与恢复条件。
通过：四问齐答；范围写明；缺口具名；形态退出 0。
失败：任一问答不出；范围不写；缺口被抹平。
证据：`任务根/quality/tests/P4-readback.md` 与读者记录原件。

- [ ] **AC-FINAL-004**：边界没被越过，脏文件没被碰。
  关联 FR-FINAL-003；来源 R-008 与事实 16。
  判定方式：机器可判；判定时点：P4 读完 P1–P3 原件之后。
  落点：P4/T015 与 `phases/P4-终末验收.md`。
验证：`grep -rn "试点" specs/<task-id>` 只允许出现在「不做试点」的否定句里。
  写集与 `git diff --name-only` 逐条比对，无 T05 材料、无七张只读卡字节变化。
  外部仓库 `git status --porcelain` 只显示 PRD 与既有 `scripts/serve_f6.py`。
  ORACLE-FINAL-BOUNDARY 核三者。
  环境与数据：认证 worktree 与外部仓库；本地 git；不需要网络。
  谁判：未参与实现的独立执行单元，只读 diff 与状态。
  承接：结论写 P4 的 Done 与 `任务根/quality/tests/P4-boundary.txt`。
  成本：executor=独立执行单元；estimate_min=20；hard_cap_min=40；
    resources=两次 git 状态与写集清单；observation=diff 路径、状态行与否定句；
    retry_cap=1；evidence_tier=命令级。
  资源来源：仓内 git，不新造脚本。
  为什么不能再简：再简只剩「没报错」，判不出有没有顺手改了只读内容。
  未执行记 `incomplete` 并写命令与原错；`unavailable` 须给原因与恢复条件。
通过：diff 与写集一致；只读卡字节未变；状态只剩 PRD 与既有脏文件。
失败：出现试点安排；只读卡被改；脏文件被本任务改动。
证据：`任务根/quality/tests/P4-boundary.txt`。

- [ ] **AC-FINAL-005**：用户对最终计划与验收给一次真实答复。
  关联 FR-FINAL-004；来源 R-006、R-010 与阶段收口要求。
  判定方式：只能人读；判定时点：P4 终末展示之后。
  落点：P4/T016 与 `phases/P4-终末验收.md`。
验证：向用户展示当前全部材料、覆盖表、缺口清单与成本，取得一次真实答复并保存原件。
  这是全任务唯一的「用户独占确认」，只拦最终收口，不拦 Phase 日常验收。
  ORACLE-FINAL-CONFIRM 核答复指向当前材料、可回读、有原件路径。
  环境与数据：用户与当前材料；答复存 `任务根/quality/evidence/human-confirmations/`。
  谁判：用户本人；不需要其它判定者。
  承接：结论写 P4 的 Done 与 human-confirmations 原件。
  成本：executor=用户；estimate_min=10；hard_cap_min=30；
    resources=当前全部材料与缺口清单；observation=答复原文与所指材料；
    retry_cap=1；evidence_tier=读者级。
  资源来源：用户时间；未答时不代答、不推进收口。
  为什么不能再简：再简只剩「agent 说可以」，判不出用户是否真的看过当前材料。
  未答记 `incomplete` 并停收口，写清下一次展示时点；`unavailable` 须给原因与恢复条件。
通过：答复可回读且指向当前材料；原件路径在 Done 里。
失败：以审查同意或 agent 推测代答；答复针对旧稿；无原件。
证据：`任务根/quality/evidence/human-confirmations/` 下的答复原件。

> 验收判据停留在产品层；全局判定器映射见「需求到任务追踪」，精确命令留给所属 Phase。

## Appendix B — 需求与编号对照

正文中文编号与机器编号在这里一一对应；表格列叙事编号，功能需求逐条在下方块里。

| 正文编号 | 机器编号 | 一句话说明 |
| --- | --- | --- |
| 需求 1 | R-001 | 优化写计划的方法：拆分与验收（A 组） |
| 需求 2 | R-002 | 优化写 PRD 的方法、验收与写法（B 组、C5） |
| 需求 3 | R-003 | 按新方法重写 PaperBuilder 规划 PRD（C 组） |
| 需求 4 | R-004 | 补已开发遗漏、简化过度复杂、让 PRD 好用 |
| 需求 5 | R-005 | 按 WorkflowHub 标准在认证 worktree 里从头做 |
| 需求 6 | R-006 | 写给没背景的人看；审查异源、方向与细节各一次 |
| 需求 7 | R-007 | 质量优先、时间是副产物；砍仪式不砍质量 |
| 需求 8 | R-008 | 不做试点、T05 不碰，用户自己去新任务验 |
| 需求 9 | R-009 | 先定大纲，再逐块调研与确认 |
| 需求 10 | R-010 | 能自己决定的自己决定，有歧义才问 |
| 需求 11 | R-011 | 取消时间盒、统一写法、先 A 再 B 再 C |
| 事实 1 | PFACT-001 | 认证 worktree 与同一 HEAD |
| 事实 2 | PFACT-002 | 旧 PRD 行数、卡数与验收编号/定义计数 |
| 事实 3 | PFACT-003 | 字段数 16 与 17 分裂 |
| 事实 4 | PFACT-004 | 四个新卡号在原文不存在 |
| 事实 5 | PFACT-005 | 「16 个字段」自述五处 |
| 事实 6 | PFACT-006 | 判定器、行号与实测记录三类内容 |
| 事实 7 | PFACT-007 | 实测记录表列命令与输出 |
| 事实 8 | PFACT-008 | 16 字段没有机器读取方 |
| 事实 9 | PFACT-009 | bundle 只列文件名、catalog 有版本字段 |
| 事实 10 | PFACT-010 | 当前树没有字段数断言测试 |
| 事实 11 | PFACT-011 | 17 机器字段硬检查；绝对路径判不安全 |
| 事实 12 | PFACT-012 | 两个 steps.json 的步数与冻结测试 |
| 事实 13 | PFACT-013 | 模板写「不引入数字阈值」与 3–7 |
| 事实 14 | PFACT-014 | 七槽在 tests 中零命中 |
| 事实 15 | PFACT-015 | spec-prd 写死 16 字段的四处 |
| 事实 16 | PFACT-016 | PaperBuilder 工作树的既有脏文件 |
| 事实 17 | PFACT-017 | 细节审查 013 已完成 11 条 |
| 决定 1 | DEC-001 | 四个 Phase 严格串行，P4 最后 |
| 决定 2 | DEC-002 | P3 跨仓交付，机器写集 none，不自动提交 |
| 决定 3 | DEC-003 | T19 拆 a 读面与 b 写面，不新增卡号 |
| 决定 4 | DEC-004 | T23a 收 T01 前端基线，判据是未合并 |
| 决定 5 | DEC-005 | 8 个 plain 字段是人读层，机器字段保留 |
| 决定 6 | DEC-006 | 2–7 是建议，不是阈值 |
| 决定 7 | DEC-007 | 删旧要删除证明、回退方式、停止条件 |
| 决定 8 | DEC-008 | 动 PaperBuilder 前要一次用户答复 |
| 决定 9 | DEC-009 | 删旧不单开 Phase，收进 P1、P2 末尾 |
| 方案 1 | SOL-001 | 先改方法，再用新方法改 PRD |
| 方案 2 | SOL-002 | 跨仓交付当外部交付物 |
| 方案 3 | SOL-003 | 结构命令加独立读者的双重判法 |
| 方案 4 | SOL-004 | 不新增校验器、stage、门或第二份判据 |
| 验收 1 | SCN-001 | 写计划的方法与模板改完 |
| 验收 2 | SCN-002 | 写 PRD 的方法与模板改完 |
| 验收 3 | SCN-003 | PaperBuilder 规划 PRD 重写完 |
| 验收 4 | SCN-004 | 终末验收与回退核对 |
| 风险 1 | RISK-01 | 跨仓交付没有用户答复就动手 |
| 风险 2 | RISK-02 | 审查 provider 不可靠 |
| 风险 3 | RISK-03 | T14 记不做被当成已覆盖 |
| 风险 4 | RISK-04 | 删旧删过头、回退无基线 |
| 风险 5 | RISK-05 | 绝对路径写进机器写集 |
| 风险 6 | RISK-06 | 人读层与机器字段漂移 |
| 风险 7 | RISK-07 | PaperBuilder 既有脏文件被误动 |
| 风险 8 | RISK-08 | 决策日志与实物不一致 |
| 风险 9 | RISK-09 | 删旧后没有回归防线 |
| 未决 1 | OPEN-01 | 用户对动 PaperBuilder 的答复 |
| 未决 2 | OPEN-02 | 决策日志第 200 行与实物不符 |
| 未决 3 | OPEN-03 | T19a 与 T19b 的切面待复核 |
| 未决 4 | OPEN-04 | 四行验收与逐条 FR 的对齐 |
| 未决 5 | OPEN-05 | 前置卡的波次列写法 |
| 未决 6 | OPEN-06 | R-004 的简化判据覆盖待 P3 复核 |
| 功能需求 1 | FR-BP-001 | 验收写成一段 |
| 功能需求 2 | FR-BP-002 | 阈值必须带来源或基线，没有来源的阈值不进验收 |
| 功能需求 3 | FR-BP-003 | 长跑只在任务末尾一次，写清跑多久、看什么、何时停 |
| 功能需求 4 | FR-BP-004 | 未参与者只读一段验收能答四问 |
| 功能需求 5 | FR-BP-005 | 验收与流程都不写谁开发、谁测试、谁审查 |
| 功能需求 6 | FR-BP-006 | 不设时间盒，分钟字段只是成本估算 |
| 功能需求 7 | FR-BP-007 | 「顺带看上一任务结果」只写成建议，发现问题只记录、不阻塞 |
| 功能需求 8 | FR-BP-008 | 三个词各给定义并一贯使用：PRD 任务、阶段、阶段内任务 |
| 功能需求 9 | FR-BP-009 | 阶段按交付与验收拆；共享验收或同一消费者就并 |
| 功能需求 10 | FR-BP-010 | 阶段数默认 2–7 且只是建议；超过 7 先拆任务 |
| 功能需求 11 | FR-BP-011 | 阶段内任务卡正文按 8 个 plain 问题作答 |
| 功能需求 12 | FR-BP-012 | 第 0 阶段统一准备共享环境与数据 |
| 功能需求 13 | FR-BP-013 | 执行建议写回人数、开发、测试审查与修复会话 |
| 功能需求 14 | FR-BP-014 | build-plan 流程先出阶段大纲并取得答复，再写规格 |
| 功能需求 15 | FR-BP-015 | 读代码现状优先用知识图谱，没有就用现有代码，不新增外部系统 |
| 功能需求 16 | FR-BP-016 | spec 模板新增阶段大纲一节（含可选第 0 阶段） |
| 功能需求 17 | FR-BP-017 | Phase 模板把 7 个验收槽改成一条验收一小段 |
| 功能需求 18 | FR-BP-018 | Phase 模板的下一消费者一节加「下游」与一句执行建议 |
| 功能需求 19 | FR-PRD-001 | 任务级验收四行一段 |
| 功能需求 20 | FR-PRD-002 | 一个任务有多个强关联结果时每个结果一段；结果不相关才拆卡 |
| 功能需求 21 | FR-PRD-003 | 任务级验收不写命令、不写证据、不写意图或等级 |
| 功能需求 22 | FR-PRD-004 | 一个任务等于一个用户能看到的结果，一张卡 |
| 功能需求 23 | FR-PRD-005 | 按交付与验收拆；共享结果或验收就并；不改卡号 |
| 功能需求 24 | FR-PRD-006 | 一个任务可拆 2–7 个阶段；超过 7 先拆任务 |
| 功能需求 25 | FR-PRD-007 | 任务地图固定 4 列：任务、结果、依赖、波次 |
| 功能需求 26 | FR-PRD-008 | 任务卡 6 个 plain 字段、一页 |
| 功能需求 27 | FR-PRD-009 | 流程六步：读、粗切地图、用户确认、一个作者写卡、一次审查… |
| 功能需求 28 | FR-PRD-010 | 审查只审四件事：拆卡、实现可行性、范围、验收 |
| 功能需求 29 | FR-PRD-011 | build-prd 六步与两次内容调用保留，只改每步交什么 |
| 功能需求 30 | FR-PRD-012 | PRD 章节保留但收短 |
| 功能需求 31 | FR-PRD-013 | 写 PRD 前读 material-writing 的唯… |
| 功能需求 32 | FR-PRD-014 | 一个作者写一个 PRD 文件，一次审查；用户先确认地图 |
| 功能需求 33 | FR-PRD-015 | 模板按新章节重排，并给三类样例 |
| 功能需求 34 | FR-PRD-016 | 模板头部引用 material-writing 并删重复… |
| 功能需求 35 | FR-PRD-017 | 版本与消费面同步 |
| 功能需求 36 | FR-PB-001 | 保 T 号只改波次 |
| 功能需求 37 | FR-PB-002 | 新增 T23a 排 T06 前 |
| 功能需求 38 | FR-PB-003 | 波次分配照 C2 |
| 功能需求 39 | FR-PB-004 | T14 记不做，保留 30 天缺口说明与 T23 承接 |
| 功能需求 40 | FR-PB-005 | T16a 性能测量排 W4、T18 之前 |
| 功能需求 41 | FR-PB-006 | T19 拆 T19a 与 T19b，不新增卡号 |
| 功能需求 42 | FR-PB-007 | 地图 4 列、卡 6 字段一页、一个作者写一个 PRD 文件 |
| 功能需求 43 | FR-PB-008 | 后续 18 张卡的任务级验收统一四行一段 |
| 功能需求 44 | FR-PB-009 | 不把长窗、全量分母、真实原件当每次门；一次真实小窗放任务末尾 |
| 功能需求 45 | FR-PB-010 | 测不出先设计等价替代检查；不等价保留未测事实、影响与恢复条件 |
| 功能需求 46 | FR-PB-011 | 验收不写命令、不写证据 schema、不写意图或等级 |
| 功能需求 47 | FR-PB-012 | 五处遗漏回补落点 |
| 功能需求 48 | FR-PB-013 | 简化项落点：T14 不做与 T13 一次小窗、T17 抽… |
| 功能需求 49 | FR-PB-014 | T11 与 T15 的现场基线保留 |
| 功能需求 50 | FR-MIG-001 | 三步迁移各自独立提交、可单独回退：模板与字段、步骤、删旧 |
| 功能需求 51 | FR-MIG-002 | 删旧只删被新形状替代的内容，旧材料只读 |
| 功能需求 52 | FR-MIG-003 | 验证只做静态检查：模板、流程、字段、交接内容一致 |
| 功能需求 53 | FR-MIG-004 | 回退：每步 git revert 可恢复；旧字节存证据 |
| 功能需求 54 | FR-MIG-005 | 不双写、不双权威；旧 step 别名保留 |
| 功能需求 55 | FR-FINAL-001 | 每条原始需求由具体 AC 判到；缺口清单为空才收口 |
| 功能需求 56 | FR-FINAL-002 | 全量读回只读原件、不改材料，只报事实与缺口 |
| 功能需求 57 | FR-FINAL-003 | 不做试点、T05 与七张只读卡不动、外部脏文件不碰 |
| 功能需求 58 | FR-FINAL-004 | 用户对最终计划与验收一次真实答复，未有答复不推进收口 |
| 功能需求 59 | FR-FINAL-005 | 终末检查不绿不判通过，跳过项要具名理由与影响面 |
| 验收判据 1 | AC-BP-001 | 一段验收能照着做，六件齐且不指派角色 |
| 验收判据 2 | AC-BP-002 | 长跑只当末尾一次门，顺带看只是建议 |
| 验收判据 3 | AC-BP-003 | 四问读者测试真做过，记录可复读 |
| 验收判据 4 | AC-BP-004 | 三词、拆并、2–7、无时间盒四处读数成立 |
| 验收判据 5 | AC-BP-005 | 只用拆并规则能判四个 Phase 的边界 |
| 验收判据 6 | AC-BP-006 | 卡正文按 8 问作答，17 个机器字段还在 |
| 验收判据 7 | AC-BP-007 | 执行建议写回具体分工，仍只是建议 |
| 验收判据 8 | AC-BP-008 | 流程与模板四处结构变更到位且没增步 |
| 验收判据 9 | AC-PRD-001 | 模板剩 6 字段 4 列，三类样例与七类禁用都判 |
| 验收判据 10 | AC-PRD-002 | 六步、两次调用、一次审查没被改坏 |
| 验收判据 11 | AC-PRD-003 | 一页读完，三类样例各自判对 |
| 验收判据 12 | AC-PRD-004 | 版本与消费面同步，检查器仍能读 |
| 验收判据 13 | AC-PB-001 | 地图 4 列、26 卡齐，波次与顺序逐卡对 |
| 验收判据 14 | AC-PB-002 | 旧件不变、新件带 Supersedes、只读卡复制 |
| 验收判据 15 | AC-PB-003 | 公共章节与改写卡清干净，只读卡留继承字段 |
| 验收判据 16 | AC-PB-004 | 18 张改写卡各一组四行验收 |
| 验收判据 17 | AC-PB-005 | 十八张改写卡逐卡能说清门与替代 |
| 验收判据 18 | AC-PB-006 | 五处遗漏各有承接卡，只读边界未被当落点 |
| 验收判据 19 | AC-MIG-001 | P1 侧 7 槽清尾与删除证明 |
| 验收判据 20 | AC-MIG-002 | P2 侧 16 字段清尾与删除证明 |
| 验收判据 21 | AC-MIG-003 | 提交只触申报写集，旧字节可恢复 |
| 验收判据 22 | AC-MIG-004 | 删除清单每条能指到替代者 |
| 验收判据 23 | AC-MIG-005 | 三条命令、一致性检查与定向测试全绿 |
| 验收判据 24 | AC-FINAL-001 | 覆盖表完整，无孤儿需求或 AC |
| 验收判据 25 | AC-FINAL-002 | 终末检查全绿，跳过项有理由 |
| 验收判据 26 | AC-FINAL-003 | 独立读者四问能答 |
| 验收判据 27 | AC-FINAL-004 | 边界没被越过，脏文件没被碰 |
| 验收判据 28 | AC-FINAL-005 | 用户对最终计划与验收一次真实答复 |

功能需求的序号见上表；验收判据的中文序号见 Appendix A 的标题顺序。


### 功能需求逐条

- **FR-BP-001**：验收写成一段，含目标、操作、条件、通过（含一处故意弄坏）、真跑或替代、谁判与证据、失败回修与停止。
  关联 PFACT-005、PFACT-017、SCN-001、AC-BP-001。
- **FR-BP-002**：阈值必须带来源或基线，没有来源的阈值不进验收。
  关联 PFACT-013、AC-BP-001。
- **FR-BP-003**：长跑只在任务末尾一次，写清跑多久、看什么、何时停。
  关联 AC-BP-002。
- **FR-BP-004**：未参与者只读一段验收能答四问：下一步、什么算过、什么算不过、证据在哪与多久。
  关联 AC-BP-003。
- **FR-BP-005**：验收与流程都不写谁开发、谁测试、谁审查。
  关联 AC-BP-001。
- **FR-BP-006**：不设时间盒；分钟字段只是活动成本估算，到时不停，停止只由失败信号或用户答复触发。
  关联 AC-BP-004。
- **FR-BP-007**：「顺带看上一任务结果」只写成建议，发现问题只记录、不阻塞。
  关联 AC-BP-002。
- **FR-BP-008**：三个词各给定义并一贯使用：PRD 任务、阶段、阶段内任务。
  关联 AC-BP-004、AC-BP-005。
- **FR-BP-009**：阶段按交付与验收拆；共享验收或同一消费者就并；不按文件、步骤、人、行数、时间拆。
  关联 PFACT-013、AC-BP-004、AC-BP-005。
- **FR-BP-010**：阶段数默认 2–7 且只是建议；超过 7 先拆任务。
  关联 AC-BP-004。
- **FR-BP-011**：阶段内任务卡正文按 8 个 plain 问题作答，17 个机器字段原样保留。
  关联 PFACT-011、AC-BP-006。
- **FR-BP-012**：第 0 阶段统一准备共享环境与数据；写进 spec 的阶段大纲；不需要则写理由跳过。
  关联 PFACT-014、AC-BP-008。
- **FR-BP-013**：执行建议写回具体内容：按面选 1 人或 2–3 人，每阶段 1 个开发。
  测试与审查独立，修复回原开发，另给监控员建议；全部只是建议。
  关联 AC-BP-007。
- **FR-BP-014**：build-plan 流程先出阶段大纲并取得答复，再写规格。
  关联 SCN-001、AC-BP-008。
- **FR-BP-015**：读代码现状优先用知识图谱，没有就用现有代码，不新增外部系统。
  关联 AC-BP-008。
- **FR-BP-016**：spec 模板新增阶段大纲一节（含可选第 0 阶段），其余结构不动。
  关联 AC-BP-008。
- **FR-BP-017**：Phase 模板把 7 个验收槽改成一条验收一小段；怎么验证只留 RED/GREEN、命令与证据。
  关联 AC-BP-008。
- **FR-BP-018**：Phase 模板的下一消费者一节加「下游」与一句执行建议，不新增节。
  关联 AC-BP-008。
- **FR-PRD-001**：任务级验收四行一段：目标、怎么操作、什么条件（含真跑或替代）、怎样算通过（含故意弄坏）。
  关联 PFACT-002、AC-PRD-003。
- **FR-PRD-002**：一个任务有多个强关联结果时每个结果一段；结果不相关才拆卡。
  关联 AC-PRD-003。
- **FR-PRD-003**：任务级验收不写命令、不写证据、不写意图或等级。
  关联 AC-PRD-001。
- **FR-PRD-004**：一个任务等于一个用户能看到的结果，一张卡。
  关联 AC-PRD-003。
- **FR-PRD-005**：按交付与验收拆；共享结果或验收就并；不改卡号。
  关联 AC-PRD-001。
- **FR-PRD-006**：一个任务可拆 2–7 个阶段；超过 7 先拆任务。
  关联 AC-PRD-002。
- **FR-PRD-007**：任务地图固定 4 列：任务、结果、依赖、波次。
  关联 AC-PRD-001。
- **FR-PRD-008**：任务卡 6 个 plain 字段、一页：为什么做、交付什么、不做什么、前置、怎么验收、下游。
  关联 PFACT-015、AC-PRD-001。
- **FR-PRD-009**：流程六步：读、粗切地图、用户确认、一个作者写卡、一次审查、交接。
  关联 AC-PRD-002。
- **FR-PRD-010**：审查只审四件事：拆卡、实现可行性、范围、验收。
  关联 AC-PRD-002。
- **FR-PRD-011**：build-prd 六步与两次内容调用保留，只改每步交什么。
  关联 PFACT-012、AC-PRD-002。
- **FR-PRD-012**：PRD 章节保留但收短；删 16 字段散文、状态表、证据字段、命令、判定器与文件行号。
  关联 PFACT-005、PFACT-006、AC-PRD-001。
- **FR-PRD-013**：写 PRD 前读 material-writing 的唯一标准，不复述标准。
  关联 PFACT-009、AC-PRD-001。
- **FR-PRD-014**：一个作者写一个 PRD 文件，一次审查；用户先确认地图，再确认终稿。
  关联 AC-PRD-002。
- **FR-PRD-015**：PRD 模板按新章节重排：导航、总览一页、共享定义至多 8 条、地图 4 列、
  卡 6 字段、风险、变更、补充；另给三类样例（单卡、多段、拆卡）。
  关联 AC-PRD-001。
- **FR-PRD-016**：模板头部引用 material-writing 并删重复覆盖矩阵与证据字段清单。
  关联 PFACT-009、AC-PRD-001。
- **FR-PRD-017**：版本与消费面同步：catalog 版本、bundle 文件清单、受影响的定向测试。
  关联 PFACT-009、PFACT-010、AC-PRD-004。
- **FR-PB-001**：保 T 号只改波次；T01 至 T05、T10、T16 七张只读卡不动。
  关联 PFACT-002、PFACT-003、AC-PB-001、AC-PB-002。
- **FR-PB-002**：新增 T23a 排 T06 前，含新库生产切换、T10 表登记与凭证、T01 前端基线。
  关联 PFACT-004、AC-PB-001、AC-PB-006。
- **FR-PB-003**：波次分配照 C2：W1 三卡、W2 五卡、W3 四卡、W4 四卡加 T16a。
  关联 AC-PB-001。
- **FR-PB-004**：T14 记不做，保留 30 天缺口说明与 T23 承接。
  关联 PFACT-004、AC-PB-001。
- **FR-PB-005**：T16a 性能测量排 W4、T18 之前。
  关联 PFACT-004、AC-PB-001。
- **FR-PB-006**：T19 拆 T19a 与 T19b，不新增卡号。
  关联 PFACT-004、AC-PB-001。
- **FR-PB-007**：地图 4 列、卡 6 字段一页、一个作者写一个 PRD 文件。
  关联 AC-PB-001、AC-PB-003。
- **FR-PB-008**：后续 18 张卡的任务级验收统一四行一段，不含 T10 与 T16。
  关联 PFACT-002、AC-PB-004。
- **FR-PB-009**：不把长窗、全量分母、真实原件当每次门；一次真实小窗放任务末尾；大表抽样；安全关键真跑。
  关联 AC-PB-004、AC-PB-005。
- **FR-PB-010**：测不出先设计等价替代检查；不等价保留未测事实、影响与恢复条件，不判通过。
  关联 AC-PB-005。
- **FR-PB-011**：验收不写命令、不写证据 schema、不写意图或等级。
  关联 AC-PB-003。
- **FR-PB-012**：五处遗漏回补落点：T03 到 T23a、T02 到 T17、T10 到 T23a、T16 到 T16a、
  T01 到 T23a。
  关联 PFACT-004、AC-PB-006。
- **FR-PB-013**：简化项落点：T14 不做与 T13 一次小窗、T17 抽 30 加聚合、T18 只做聚合、T05 不动、
  T01 至 T04 不复制、超标分母不进验收。
  关联 AC-PB-005。
- **FR-PB-014**：T11 与 T15 的现场基线保留，与 T23a 的全局基线不冲突。
  关联 PFACT-004、AC-PB-006。
- **FR-MIG-001**：三步迁移各自独立提交、可单独回退：模板与字段、步骤、删旧。
  关联 AC-MIG-001。
- **FR-MIG-002**：删旧只删被新形状替代的内容，旧材料只读。
  关联 PFACT-016、AC-MIG-002。
- **FR-MIG-003**：验证只做静态检查：模板、流程、字段、交接内容一致；不写卡、不试跑、不设时限。
  关联 AC-MIG-005。
- **FR-MIG-004**：回退：每步 git revert 可恢复；旧字节存证据；新件写 Supersedes。
  关联 AC-MIG-003。
- **FR-MIG-005**：不双写、不双权威；旧 step 别名保留。
  关联 PFACT-012、AC-MIG-002。
- **FR-FINAL-001**：每条原始需求由具体 AC 判到；缺口清单为空才收口。
  关联 AC-FINAL-001。
- **FR-FINAL-002**：全量读回只读原件、不改材料，只报事实与缺口。
  关联 AC-FINAL-003。
- **FR-FINAL-003**：不做试点、T05 与七张只读卡不动、外部脏文件不碰。
  关联 PFACT-016、PFACT-017、AC-FINAL-004。
- **FR-FINAL-004**：用户对最终计划与验收一次真实答复，未有答复不推进收口。
  关联 AC-FINAL-005。
- **FR-FINAL-005**：终末检查不绿不判通过，跳过项要具名理由与影响面。
  关联 AC-FINAL-002。
