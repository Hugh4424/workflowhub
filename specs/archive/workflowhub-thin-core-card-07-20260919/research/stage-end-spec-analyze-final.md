# 发布前最终独立核查

> 执行契约：独立只读核查。**除本文件外未修改任何被检查文件**（`decision-log.md`、`research/module-ledger.md`、`research/coverage-matrix.md`、两张处置清单、`quality/reviews/**` 均只读）。
> 核查对象：`research/stage-end-spec-analyze-recheck.md`（下称「上轮复查」）的 5 项遗留（H1/H2/H9/H10/M1）、3 条新矛盾（N1/N2/N3）、以及 11:27 那一轮修补（**此前未经独立验证**）是否引入新问题。
> 核查基准：`decision-log.md`（1399 行，mtime 11:27:27）、`research/module-ledger.md`（93 行，mtime 11:27:27）、`research/coverage-matrix.md`（965 行，mtime 08:01，**本轮未改**）、两张处置清单、仓外原件 `.../quality/reviews/results/*.json`（7 份）。
> 严重性口径：HIGH=冲突或歧义 / MEDIUM=术语漂移或覆盖缺失 / LOW=改进建议。

## 0. 总体结论

**`inconsistent`** —— 11:27 那轮修补**确实闭合了 H1 与 H9**，并把「原件失实断言」（旧 N2）改成了如实并列两种口径（**108/20 与 114/21 经我独立实算，逐格准确**），未闭合披露也**在 decision-log 与 module-ledger 两处统一到 9**；但 **H2 只修了三处中的一处**：`decision-log.md` 同文件内 `## 原始需求覆盖矩阵` 的 **来源组处置表写 `covered`（24）**、而 **U-002 行口径注 + D-028 后果节仍写 `22 covered + 2 accepted_omission`**，两处互斥自相矛盾，且与未修改的权威支撑文件 `research/coverage-matrix.md`（`G06 U-002 24 = 本卡承接 24 + 0 + 0`，U-002-17/18 处置列=`本卡承接`）**仍然互斥**；同时 `## 承接与不承接清单` 里新写的「本卡覆盖矩阵的 `accepted_omission`」是一个**指向不存在之物的悬空引用**。此外本轮**又引入 2 条新矛盾**（module-ledger 与 decision-log 在 cluster 口径上相反；G16 声称「触发统一」与 OI-018 自身 trigger 互斥），并**残留 2 条**（未闭合披露仍有 direction 6 条的不一致；`拟议方向` 标题与节首正文互斥）。

一句话理由：**「24 / 22+2」这一处修补只落到 3 处中的 1 处，导致同一事实在同一文件内、以及材料与权威支撑文件之间仍然三处互斥，且另有 2 条本轮新引入的矛盾、2 条残留。**

## 1. 上一轮遗留 5 项（H1/H2/H9/H10/M1）逐条判定 + 引文证据

判定口径：`已闭合` = 原问题语义已解决；`部分闭合` = 主问题解决但残留具体可指认的缺口；`未闭合` = 原问题仍在或被改写成另一个矛盾。

| gap | 判定 | 当前位置证据 | 若未闭合/部分闭合，差什么 |
|---|---|---|---|
| **H1** V-010 无决策落点 | **已闭合** | ①`decision-log.md:决策/D-028` requirement_ids 含 **V-010（= U-002-17/18）**；②`decision-log.md:需求大纲 v1` **M2 行已含**「`U-002-07~14, U-002-16, **U-002-17/18**`」、**M12 行已含**「`母 PRD 依赖节, card-02 承接清单, **U-002-17/18**`」——上轮点名的「M2/M12 关联需求不含 17/18」症状**已消失**；③`decision-log.md:三档结论:` 有「主会话只做规划、派发、交互类技能…（V-010 = U-002-17/18）｜V-010…｜**接受**…｜**D-028**」；④`decision-log.md:承接与不承接清单/给其他卡的输入注入义务` 有 CARD-03 行「本卡遵守的执行模型…（V-010 = U-002-17/18）…**D-028 第 3 条**…机制归属是 CARD-03」 | 无（结论落点、注入义务、两处模块关联需求四处齐备） |
| **H2** U-002-17/18 两处处置互斥 | **部分闭合（上轮判"未闭合"，本轮已移动，但仍互斥）** | ①**已改对的一处**：`decision-log.md:原始需求覆盖矩阵/来源组处置表`「`\| U-002 最小需求单元 \| 24 \| covered \| M1–M12（含 U-002-17/18 = **D-028 本卡承接并遵守**） \|`」；②**未改的两处**：同行下方「**U-002 行口径（H2 修正，两处数字可互推）**：`24 = 22 covered + 2 accepted_omission` —— U-002-17/18…**机制归 CARD-03**…两处的对应关系以该支撑文件为准」，以及 `decision-log.md:决策/D-028/后果 2`「`## 原始需求覆盖矩阵` 的 U-002 行改为 **22 covered + 2 accepted_omission**…两处数字可互推」；③**权威支撑文件未改**：`research/coverage-matrix.md:§1`「`\| U-002-17 \| … \| M2/AX04 \| 本卡承接 \| 主会话执行模型，落 M2；「派发方法」分量归 CARD-03（C-010） \|`」「`\| U-002-18 \| … \| 本卡承接 \|`」，`§5.1`「`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0） + 待裁决 0 + 未处置 0`」，且全文**不存在**任何 U-002-xx 行处置=`交其他卡` | **同一文件内 `covered`(24) 与 `22 covered + 2 accepted_omission` 并存且无主从说明**；「以支撑文件为准」的声明与支撑文件内容相反；`383/96` 算术未重算（若真把 2 条计入交其他卡应为 `381+13+98`，材料自陈「未重算」→ 无法自洽） |
| **H9** 自定"只追加不修改"却发生原地改写 | **已闭合** | `decision-log.md:逐字声明层` 例外条已扩写并落到两类改动上：①`V-011` 行说出者列「**【索引，非逐字】**（**该标注系 G7 修复时追加，按 D-020 登记为「已被修正」**…）」；②`V-012` 行同格式标注；③`OI-016.question`（第 650 行）尾部「**本行为 G16 修复时就地追加，按 D-020 登记为「已被修正」，原 question 未删**」；④规则本身（第 123 行）「**决策正文与逐字条目的改动**一律按 D-020 在原地加「已被 X 修正/取代」标注，**不删原文**」。上轮点名的「规则要求加标注而 V-011/V-012、OI-016 无标注」缺口**已消失** | 无（V-011/V-012/OI-016 三处均已带标注；D-002/D-011/D-016/D-027 四处原有标注仍在）。**附注**：标注中「原文未删」这一子句的准确性另见 §3 N6 |
| **H10** 23 条待裁决未进入未闭合披露且状态过期 | **已闭合** | ①`decision-log.md:原始需求覆盖矩阵/逐单元处置汇总` 已就地加指针「`\| 待裁决 \| **23**（**快照值**：其中 MOD-M9 / ML-06 / ML-07 已闭合、其余 20 条 owner=本卡 / 触发=build-plan 前，**详见下文「覆盖矩阵的 23 条『待裁决』单元」单列披露**） \|`」；②目标小节确实存在：`### 覆盖矩阵的 23 条「待裁决」单元（单列披露）`（第 380 行），表内点名 `MOD-M9`/`ML-06`/`ML-07` 已闭合、其余 20 条仍未裁决，并点名 U-22、A-046；③指针名与节名**逐字一致**，可落地 | 无（上轮 N5「汇总表无指针」已消；"23 快照 vs 3+20 刷新"两数并存但已就地标注口径与指针，读者可判） |
| **M1** 四份未闭合披露互不一致 | **部分闭合** | ①`decision-log.md:未闭合项` 节首新增**唯一定稿口径**声明：「**本节是未闭合项的唯一定稿口径**；`research/module-ledger.md`、两张 findings 处置清单与 handoff 一律以本节为准」＋「**计数**：12 条编号中 **#1 / #3 / #4 已被取代或收口** → **真正未闭合 9 条**（#2、#5~#12）」；②`research/module-ledger.md:未闭合项` 已合并重复计数：「**计数勘误**：本表此前为 13 行并报「10 项仍在」，其中原 #10（新形态生效时点 OI-018）与原 #5（三个前置冻结）**重复计同一项** —— 已合并，行数 13 → 12、未闭合 10 → 9」；③module-ledger 行数实测确为 **12 行**、其 `未闭合项` 指标行写 **9 项仍在**，与 decision-log 的 9 **数上一致** | **仍有两份披露未收口**：①`research/direction-review-findings-disposition.md:未闭合项` 仍为 **6 条**（1 G1 机制层 / 2 G6 执行层 / 3 G9 / 4 G18 / 5 第一轮 30 条 / 6 第二轮 red 无结果），其中第 4 条仍写「**触发=build-code 前必须冻结**」；②`detail-review-findings-disposition.md:未闭合项` 仍为 9 行，其中 `#1`（G9）、`#2`（G10）、`#3`（G18）**仍标 `step 11` 未闭**，而 decision-log 已判「G9 / G10 / G18 已由 D-024 / D-025 / D-026 收口」。decision-log 只为 detail 文件的 G16 一处写了「支撑文件未落改」的冲突说明，**未对 detail #1–#3 与 direction 全文作同样登记**，而节首却声明"两张 findings 处置清单…一律以本节为准" |

**计数：已闭合 3（H1、H9、H10）/ 部分闭合 2（H2、M1）/ 未闭合 0。**
（上轮为 17 闭合 / 4 部分 / 1 未闭合；本轮遗留 5 项中，H1、H9、H10 已闭合，H2 由"未闭合"升为"部分闭合"但仍互斥，M1 仍为部分闭合。）

## 2. 上一轮 3 条新矛盾是否修掉（含实算的两种口径数字）

### 2.1 新矛盾 1：H2 被改反（材料与支撑文件互斥）→ **未修净（HIGH，见 §1 H2 与 §3 N1）**

`decision-log.md` 只把 `来源组处置表` 的 U-002 行改回 `covered`；**U-002 行口径注（第 755 行）与 D-028 后果 2（第 1396 行）仍写 `22 covered + 2 accepted_omission`**，且 `## 承接与不承接清单/给其他卡的输入注入义务` 的 CARD-03 行仍以「本卡覆盖矩阵的 `accepted_omission`」为前提。支撑文件 `coverage-matrix.md` 自 08:01 起**未被修改**（mtime 可证），其 U-002-17/18 处置列仍为 `本卡承接`。故「被改反」这一条**从"确定互斥"变为"残缺修补后仍互斥"**。

### 2.2 新矛盾 2：关于原件的失实断言 → **已修（文本层），并新增一处反向表述（MEDIUM）**

`decision-log.md:计数口径` 第 3 条现为：

> 「3. **两种口径都真实存在，本卡披露两者**（**计数勘误**：本节此前写「原件里没有 adjudicated cluster 字段、37 无原件依据」是**失实断言** —— 当时的检查只看顶层键名，而该字段嵌在 `adjudication.clusters` 下；独立复查实测 **7/7 份 `results/*.json` 均含该字段**。特此更正并保留原文痕迹）：
>    - **口径 A（本节采用）**：`findings` 数组长度跨 red/blue 相加、不去重 → **108 条 / 20 blocking**。
>    - **口径 B**：`adjudication.clusters` 长度 → 逐轮 red/blue 为 15/16（第 1 轮）、—/13（第 2 轮）、19/18（第 3 轮）、19/14（第 4 轮），**合计 114 条 / 21 blocking**；其中第 3 轮 **37** 即口径 B 下的数。
>    - 口径 A 用于「逐条处置」…；口径 B 用于「聚类后的问题数」。**引用任一数字必须写明口径。**」

**我自己的实算（直接解析 7 份 `results/*.json`，按 `pair_id` × `role` 归轮）：**

| 轮次（pair） | 轨道 | role | 文件前 8 位 | `findings` 长度 | findings severity | `adjudication.clusters` 长度 | clusters severity |
|---|---|---|---|---|---|---|---|
| 1（`7c6c6231`） | direction | red | `93950203` | 14 | 4 blocking / 8 major / 2 minor | 15 | 4 blocking / 9 major / 2 minor |
| 1（`7c6c6231`） | direction | blue | `b5925436` | 16 | 5 blocking / 11 major | 16 | 5 blocking / 11 major |
| 2（`bbe6a827`） | direction | red | 无 result | 0 | — | — | — |
| 2（`bbe6a827`） | direction | blue | `2b680e7f` | 13 | 1 blocking / 10 major / 2 minor | 13 | 1 blocking / 10 major / 2 minor |
| 3（`bd7a6a63`） | direction | red | `eebc4bca` | 15 | 3 blocking / 10 major / 2 minor | 19 | 4 blocking / 13 major / 2 minor |
| 3（`bd7a6a63`） | direction | blue | `922967cc` | 17 | 2 blocking / 11 major / 4 minor | 18 | 2 blocking / 12 major / 4 minor |
| 4（`8605366f`） | detail | red | `99e85c3f` | 19 | 1 blocking / 16 major / 2 minor | 19 | 1 blocking / 16 major / 2 minor |
| 4（`8605366f`） | detail | blue | `367359be` | 14 | 4 blocking / 8 major / 2 minor | 14 | 4 blocking / 8 major / 2 minor |
| **合计** | — | — | — | **108** | **20 blocking** | **114** | **21 blocking** |

**结论**：①材料写的 **108 / 20（口径 A）准确**，逐轮 per-role severity 分布逐格吻合；②材料写的 **114 / 21（口径 B）准确**，逐轮列出的 `15/16、—/13、19/18、19/14` 与实算逐格吻合，「第 3 轮 37 = 19+18」成立；③`adjudication.clusters` 字段 **7/7 份存在**，旧断言"没有该字段 / 37 无依据"确为失实，**现文本已如实并列两种口径、不再否定另一种**。文本层判定：**已修**。
**但**：`research/module-ledger.md:总览` 的同一口径行仍写「**不使用任何 adjudicated cluster 类数字**」，与 decision-log 现文（"两种口径都真实存在，本卡披露两者"）方向相反 → 属**本轮新引入/同源**的视图-权威互斥，见 §3 N2。

### 2.3 新矛盾 3：未闭合披露计数不一致 → **部分修（数已统一，集合与第三、四份文件未统一）**

- 已统一到 **9** 的两处：`decision-log.md:未闭合项`「真正未闭合 9 条（#2、#5~#12）」；`research/module-ledger.md:未闭合项`「**9 项仍在**（#4~#9 共 6 项 deferred/未承接 + #10~#12 共 3 项 accepted_risk）」＋「**与 `decision-log.md` 的「未闭合项」唯一定稿口径一致（9 条）**」。
- 我按 gap 归并核对**两处集合实质相同（各 9 项）**：G14 / G16(含 OI-016、OI-018) / 成本实测 / G15 / G12 / G13 / G11 / G17 / G20。**「9」这一数字成立**。
- **但仍不一致的**：`research/direction-review-findings-disposition.md:未闭合项` **6 条**（含「G18…**触发=build-code 前必须冻结**」，与 decision-log「触发统一为 build-plan 前（不晚于 build-code）」互斥）；`detail-review-findings-disposition.md:未闭合项` 9 行中 `#1/#2/#3` 仍标 `step 11`（已过期）。decision-log 只为 detail 的 G16 一处登记了"支撑文件未落改"，**direction 全文与 detail #1–#3 未登记**。故「四份披露统一到 9」**未完全成立**：数上 2/4 统一，第三、四份仍是 6 与 9（且第三份是不同集合）。

## 3. 本轮修补新引入的矛盾

### N1（HIGH，[本轮引入]）U-002-17/18：同文件内三处口径分裂 + 悬空引用 + 算术未重算

- `decision-log.md:原始需求覆盖矩阵/来源组处置表`（第 727 行）：「`\| U-002 最小需求单元 \| 24 \| covered \| M1–M12（含 U-002-17/18 = **D-028 本卡承接并遵守**） \|`」——**已改回 covered**。
- **同一节**（第 755 行）：「**U-002 行口径（H2 修正，两处数字可互推）**：`24 = 22 covered + 2 accepted_omission` —— U-002-17/18…**机制归 CARD-03**（原表把 24 条一律写作 `covered`，与 `research/coverage-matrix.md` 把该 2 条列为「交其他卡」互斥，**已按矩阵口径修正**）…两处的对应关系以该支撑文件为准」——**未改**。
- `decision-log.md:决策/D-028/后果 2`（第 1396 行）：「`## 原始需求覆盖矩阵` 的 U-002 行改为 **22 covered + 2 accepted_omission**…两处数字可互推」——**未改**。
- **权威支撑文件（未修改）**：`research/coverage-matrix.md:§1` U-002-17/18 处置列=`本卡承接`；`§5.1`「`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0）`」。**该文件中不存在任何 U-002-xx 的 `交其他卡` 行**（我已对 U-002-01~24 全部 24 行逐行核对：24/24 均为 `本卡承接`）。
- **悬空引用**：`decision-log.md:承接与不承接清单/给其他卡的输入注入义务`（第 838 行）CARD-03 行理由写「不注入则 U-002-17/18 落在卡外、**本卡覆盖矩阵的 `accepted_omission` 无处对接**」——该 `accepted_omission` 在覆盖矩阵中**不存在**。
- **算术不自洽**：`383 + 13 + 96 = 492`、`492 + 23 + 0 = 515` 只在「24 条全为 本卡承接」下成立；若 2 条真属 `交其他卡`，正确值为 `381 + 13 + 98`。材料自陈「`383 / 13 / 96 / 23 / 515` …**未重算**」，故本条口径注与本节算术互斥。另：`## 三档结论` 对同一单元的档位是 **`接受`**（非"未承接/交其他卡"），与 `accepted_omission` 亦互斥。
- 建议修法：把第 755 行与 D-028 后果 2 一并行文改为「`24 covered`（本卡承接；U-002-17/18 由 D-028 本卡遵守并执行，机制归属 CARD-03 作为**注入义务**单列，见 `## 承接与不承接清单`）」，并同步把第 838 行的「覆盖矩阵的 `accepted_omission`」改为「CARD-03 的注入义务」。**不要修改 `coverage-matrix.md`**（它不在本卡允许修改清单内）。

### N2（MEDIUM，[本轮引入/同源]）module-ledger 与 decision-log 对 cluster 口径方向相反

- `research/module-ledger.md:总览`（第 16 行）：「findings 计数口径｜条数 = `…findings` 数组的长度…（不去重、不合并）；**不使用任何 adjudicated cluster 类数字**」。
- `decision-log.md:计数口径` 第 3 条（第 334–337 行）：「**两种口径都真实存在，本卡披露两者**…**口径 B**：`adjudication.clusters` 长度 → …**合计 114 条 / 21 blocking**…**引用任一数字必须写明口径**」。
- 性质：module-ledger 自称「冲突时以 decision-log 为准并**立即**修本表」（第 4 行），但此处与 decision-log 的现行口径**方向相反**（一方"披露两者并允许引用"，另一方"不使用该类数字"）。这是本轮把失实断言改成"如实披露两口径"之后**未同步视图**造成的**新**不一致。
- 建议修法：module-ledger 改为「本表采用口径 A（`findings` 长度）→ **108 / 20**；另一种口径 B（`adjudication.clusters`）见 `decision-log.md` 的计数口径节（114 / 21），引用须写明口径」。

### N3（MEDIUM，[本轮引入或上轮未清]）G16 声称"触发统一"与 OI-018 自身 trigger 互斥

- `decision-log.md:未闭合项 #5`：「三个前置冻结未完成（G16）：decision-log 归属、与 CARD-04/03/05 的共享写面、**card-02 结构的生效时点**。**触发统一为 build-plan 前（不晚于 build-code），以本条为准**；关联 OI-016、OI-018」。
- `decision-log.md:唯一 OI 大纲/OI-018`（第 685 行）：`trigger: card-02 合并后或 build-code 完成后`；同一事实在 `decision-log.md:三档结论`（第 175 行）与 `OI 状态汇总`（第 711 行）也用「待定——生效时点未被显式记录 / OI-018（新形态生效时点）」的"deferred 未定"口径。
- 性质：**同一文件内**对同一 deferred 项（OI-018）给出两个不同触发时点（「build-plan 前（不晚于 build-code）」vs「card-02 合并后或 build-code 完成后」），而 #5 还声明"触发统一"。任务书要求的「触发时点（OI-016 应为 build-plan 前（不晚于 build-code））」在 OI-016 处正确，但该项同时点名 OI-018，使 #5 的"统一"声明与 OI-018 记录互斥。
- 建议修法：二择一并写明理由——①把 OI-018 的 trigger 改为 `build-plan 前（不晚于 build-code）` 并保留"生效时点在 card-02 合并后"的区分表述；或 ②把 #5 的"触发统一…"限定为 OI-016，另行为 OI-018 写明 `card-02 合并后或 build-code 完成后`。**不允许两处并存且都声称现行。**

### N4（LOW–MEDIUM，[残留]）未闭合披露仍有第三、四份未登记

见 §2.3。`direction-review-findings-disposition.md:未闭合项` 6 条（含 `build-code 前必须冻结` 的过期触发）；`detail-review-findings-disposition.md:未闭合项` `#1/#2/#3` 仍标 `step 11`。decision-log 的唯一定稿口径声明覆盖"两张 findings 处置清单"，却只登记了 detail 的 G16 一处。建议在 `未闭合项` 节首补一条统一过期说明（"detail `未闭合项` #1–#3 与 direction `未闭合项` 全文为未授权的支撑文件快照，其过期条目以本节为准"）。

### N5（MEDIUM，[残留，上轮 N7 未修净]）`拟议方向` 标题与节首正文直接互斥

- `decision-log.md:拟议方向` **标题**（第 213 行）：「`## 拟议方向（agent 提案 v2 —— **已获用户最终确认**，见 T-011「都不改，收口」；含 D-009/D-010 裁决）`」。
- 同一节**正文**（第 216 行）：「> **用户尚未确认**；方向讨论（talk-r2）之后，现行版本以「收敛检查」节的 `target/scope/solution` 行为准。」
- 性质：标题说"已获用户最终确认"，正文说"用户尚未确认"。修补只去了标题里的"待用户确认"，节内「用户尚未确认」**原样保留**，矛盾从"标题 vs T-011"变成"标题 vs 节首正文"。用户已在 T-011 说「都不改，收口」，故正文这句是**过期状态**。
- 建议修法：正文改为「> **性质**：本版为 v2 快照（agent 提案，用于承载官方 direction 审查的可挑战对象）；**方向已由 T-011「都不改，收口」确认**，现行口径以 `## 收敛检查` 的 `target/scope/solution` 行为准。」

### N6（LOW，[本轮引入]）V-011/V-012 新标注中「原文未删」的子句在材料内不可核

- `decision-log.md:逐字声明层` V-011/V-012 说出者列：「**【索引，非逐字】**（**该标注系 G7 修复时追加，按 D-020 登记为「已被修正」：原行为指针条目，原文未删**）」。
- 第 123 行的规则同时要求：「**决策正文与逐字条目的改动**一律按 D-020 在原地加「已被 X 修正/取代」标注，**不删原文**」。
- 事实：V-011/V-012 的**逐字原文列**现为指针句（「指针：见本文件 `## 需求变更记录` U-002 的单元表 U-002-01 ~ U-002-24。**此项不是用户原话，仅为索引**…」），材料内**看不到"被删的原文"**；`V-013` 的处理方式（把原内容留在括号里：「原内容为「…」，该重述内容保留于此」）才是"原文未删"的可核形态。
- 影响：读者无法从材料判断 V-011/V-012 的原文去哪了，"原文未删"是**不可核的自述**（与项目"不凭印象断言"的纪律相抵）。注意：我**不**断言原文已被删除——该 worktree 的 `specs/**` 未纳入 git（`git status` = `?? specs/workflowhub-thin-core-card-07-20260919/`），**无修补前快照**，故我只能指出"该自述在材料内不可核"，见 §7。
- 建议修法：按 V-013 的做法，把 V-011/V-012 的原行内容以「原内容为「…」」形式留在单元格内，或把标注改为「本行原为指针条目，其原内容已并入下方指针句，无正文被删」。

### 明确"未发现"的项（不凑数）

- **决策计数**：`28` 在 `现行结论` 尾注、`T-011`、`承接与不承接清单`、`D-028` 后果、`module-ledger:总览`、`module-ledger:用户已裁决` 多处一致；`现行结论` 实测 **28 行 D-001~D-028 无缺无重**（脚本复核）。**未发现**残留 23/26/27。
- **findings 计数**：decision-log `108 / 20`、module-ledger `108 / 20`、两张处置清单 `32` 与 `33`（`合计 108 / 20`）**未发现**互斥；逐 role 分布逐格准确。
- **三档结论行数**：脚本实测 **22 数据行**；`module-ledger:官方步骤进度` step 9 写 **22 条**。**未发现**不一致。
- **OI 计数**：`open 0 / confirmed 17 / deferred 2` 在 `OI 状态汇总`、`module-ledger:总览`、`收敛检查` 一致；19 = 17 + 2 成立。**未发现**互斥。
- **模块状态**：`需求大纲 v1` 12 行全部「**已定**」，`module-ledger:总览`「12/12 全部有结论」。**未发现**互斥。
- **契约自检表述**：`module-ledger` step 9 已按上轮 N4 改为「`analyzeDecisionConvergence` **ok=true/errors=0**；`analyzeDecisionOutline` 的 structure/direction_snapshot/no_open_items/terminal_fields 全部 **passed**、**非 proof 类错误 0**；其 **`ok=false`** 与 `interaction_proof=missing` 是 **17 条预期项**」——**未发现**"两个解析器全绿"字样（上轮 N4 已闭合）。
- **引用目标存在性**：`### 覆盖矩阵的 23 条「待裁决」单元（单列披露）`（第 380 行）、`### 未提交引用不得作为验收事实（单列披露）`（第 398 行）均存在，第 745 行与第 374 行的"详见/见下方"能落地；`## 承接与不承接清单`（第 808 行）存在。**唯一悬空引用**是 §3 N1 的 `accepted_omission`。
- **append-only 四处标注**（D-002 第 969 行 / D-011 第 1103 行 / D-016 第 1204 行 / D-027 第 1376 行）：**未发现**正文与新标注互相否定到无法判断现行口径的情形。
- **已授权后置项**：G12/G13/G15/G16、原子台账成本实测、79 条逐条处置均带 owner/触发（build-plan 或 build-plan 前），按卡面授权**不计为 gap**。

## 4. module-ledger 与 decision-log 的逐格对照

| 字段 | `decision-log.md` | `research/module-ledger.md` | 一致？ |
|---|---|---|---|
| 模块总数 / 模块状态 | `需求大纲 v1` 12 行全部「已定」 | 「模块总数 12」「模块状态 **全部有结论**（12/12）」 | ✅ |
| 已定决策 | `现行结论` 28 行 + 尾注「现行决策 28 条」 | 「已定决策 **28**（D-001 ~ D-028，含收口元决策 D-028）」 | ✅ |
| OI 收盘 | `OI 状态汇总`：open 0 / confirmed 17 / deferred 2 | 「17 confirmed + 2 deferred；**OI 无 open**」 | ✅ |
| findings / blocking | 轮次表合计 **108** / **20** | 「四轮 findings 合计 **108**、blocking 合计 **20**」 | ✅ |
| findings 计数口径 | 「**两种口径都真实存在，本卡披露两者**…引用任一数字必须写明口径」 | 「**不使用任何 adjudicated cluster 类数字**」 | ❌ **N2** |
| 三档结论条数 | 22 数据行（实测） | step 9「三档结论 **22 条**」 | ✅ |
| 未闭合项条数 | `未闭合项`「真正未闭合 **9 条**」 | 「**9 项仍在**（6 deferred/未承接 + 3 accepted_risk）」 | ✅（数一致） |
| 未闭合项集合 | G14 / G16(含 OI-016、OI-018) / 成本实测 / G15 / G12 / G13 / G11 / G17 / G20 | 同 9 项（#4-79 条、#5 三冻结、#6 G12、#7 G13、#8 G15、#9 成本实测、#10 G11、#11 G17、#12 G20） | ✅（集合实质相同） |
| 每项 owner / 触发 | #2 build-plan 前；#5 build-plan 前（不晚于 build-code）；#6/#7 build-plan；#8 accepted_risk；#9/#10 accepted_risk | #4 build-plan 前；#5 build-plan 前（不晚于 build-code）；#6/#7/#8 build-plan；#9 build-plan 前；#10/#11/#12 accepted_risk | ✅（逐项对齐） |
| 待裁决 23 | 汇总行 `23`（快照值 + 指针） | 未单列（不冲突） | ✅ |
| 契约自检 | 「非 proof 类错误 0」「`interaction_proof = missing` 属预期项」 | 同口径（含 `ok=false`） | ✅ |
| 官方步骤进度 | — | step 9/10/11/12/13/14 均 ✅；step 3/4/5/6/7/8 与 decision-log 的 step 归属无互斥 | ✅ |
| 已裁决方向性事项 | `三档结论` + `决策` | 「用户已裁决的全部方向性事项」15 行，含 D-028 行「主会话执行模型…机制归属与注入义务归 CARD-03」 | ✅ |
| **唯一不一致的格子** | — | — | **仅 findings 计数口径一行（N2）** |

**汇总：逐格对照共 13 个字段，12 ✅ / 1 ❌（指 findings 计数口径）。** 另注：module-ledger `未闭合项` 表第 2 行标「✅ **已闭**（**D-021**）；**成本实测仍未承接**，见 #9」——这是「论证已闭 + 成本实测未闭」的合并行写法，与 decision-log #3 的合并写法同口径，**不算不一致**，但读者需按行内两个子句分别计（材料已在第 36/37 行写清"3 行已闭 / 9 项仍在"）。

## 5. 契约复验输出原文

命令（在 `/Users/Hugh/Hugh/Project/workflowhub` 下只读实跑，目标为 worktree 的 `decision-log.md`，**在 11:27 修补落地后运行**）：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub && node -e "
import('./runtime/stage/stage-content-contracts.mjs').then(m=>{
  const fs=require('fs');
  const md=fs.readFileSync('/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919/specs/workflowhub-thin-core-card-07-20260919/decision-log.md','utf8');
  console.log('taskType =', m.readTaskTypeFromDecisionLog(md));
  const o=m.analyzeDecisionOutline(md,{taskId:'workflowhub-thin-core-card-07-20260919'});
  console.log('outline components =', JSON.stringify(o.components));
  console.log('outline non-proof errors =', o.errors.filter(e=>!/core interaction proof is unavailable/.test(e)).length);
  o.errors.filter(e=>!/core interaction proof is unavailable/.test(e)).forEach(e=>console.log('  -',e));
  const c=m.analyzeDecisionConvergence(md,{taskId:'workflowhub-thin-core-card-07-20260919'});
  console.log('convergence ok =', c.ok, '| errors =', c.errors.length);
});"
```

输出原文：

```
taskType = 普通任务
outline components = {"structure":"passed","direction_snapshot":"passed","no_open_items":"passed","terminal_fields":"passed","interaction_proof":"missing"}
outline non-proof errors = 0
convergence ok = true | errors = 0
```

补充实跑（同文件，补齐总错误数）与逐条错误枚举：

```
outline ok= false total= 17
{
 "OI OI-001 core interaction proof is unavailable": 1,
 "OI OI-002 core interaction proof is unavailable": 1,
 "OI OI-003 core interaction proof is unavailable": 1,
 "OI OI-005 core interaction proof is unavailable": 1,
 "OI OI-006 core interaction proof is unavailable": 1,
 "OI OI-007 core interaction proof is unavailable": 1,
 "OI OI-008 core interaction proof is unavailable": 1,
 "OI OI-009 core interaction proof is unavailable": 1,
 "OI OI-010 core interaction proof is unavailable": 1,
 "OI OI-011 core interaction proof is unavailable": 1,
 "OI OI-013 core interaction proof is unavailable": 1,
 "OI OI-014 core interaction proof is unavailable": 1,
 "OI OI-015 core interaction proof is unavailable": 1,
 "OI OI-016 core interaction proof is unavailable": 1,
 "OI OI-017 core interaction proof is unavailable": 1,
 "OI OI-018 core interaction proof is unavailable": 1,
 "OI OI-019 core interaction proof is unavailable": 1
}
conv ok= true errors= 0
```

**对照材料自检表**（`decision-log.md:审查事实与处置/材料契约自检`）：「`readTaskTypeFromDecisionLog`｜`普通任务`」「`analyzeDecisionOutline`｜`structure`/`direction_snapshot`/`no_open_items`/`terminal_fields` = **passed**；非 proof 类错误 **0**」「`analyzeDecisionConvergence`｜**ok = true，errors = 0**」，并把 17 条 proof 缺失披露为预期项（D-019 删除面）——**与实跑逐格一致**；`ok=false` **未被**写成通过。契约层**未发现**材料美化。**注意**：机器对这些冲突零报警（§3 N1 的三处互斥、N2 的视图-权威相反、N3 的触发时点互斥，解析器全部放过），再次实证"契约解析器挡不住这类错误"。

## 6. 剩余 gap（带严重性）

| # | 严重性 | 位置 | 问题 | 建议修法 |
|---|---|---|---|---|
| **F1** | **HIGH** | `decision-log.md:原始需求覆盖矩阵`（第 727 行 vs 第 755 行）／`决策/D-028` 后果 2（第 1396 行）／`承接与不承接清单` CARD-03 行（第 838 行） vs `research/coverage-matrix.md:§1 U-002-17/18 行`、`§5.1 G06` | 同文件内 `covered`(24) 与 `22 covered + 2 accepted_omission` 并存；与未修改的权威支撑文件（`本卡承接 24 + 0 + 0`）仍互斥；CARD-03 行引用不存在的 `accepted_omission`；`383/96` 未重算故算术互斥（§3 N1） | 第 755 行与 D-028 后果 2 改为「`24 covered`（D-028 本卡遵守并执行；机制归属 CARD-03 作为**注入义务**，见 `## 承接与不承接清单`）」；第 838 行删去「覆盖矩阵的 `accepted_omission`」。**不改** `coverage-matrix.md` |
| **F2** | MEDIUM | `research/module-ledger.md:总览` findings 计数口径行 | 「不使用任何 adjudicated cluster 类数字」与 decision-log「两种口径都真实存在…引用任一数字必须写明口径」方向相反（§3 N2） | 改为「本表采用口径 A → 108 / 20；口径 B（`adjudication.clusters`）= 114 / 21，见 decision-log 计数口径节，引用须写明口径」 |
| **F3** | MEDIUM | `decision-log.md:未闭合项 #5` vs `唯一 OI 大纲/OI-018.trigger` | #5 声明"三个前置冻结触发统一为 build-plan 前（不晚于 build-code）"，OI-018 自身 `trigger: card-02 合并后或 build-code 完成后`（§3 N3） | 二择一并写明现行；不允许"统一"声明与条目 trigger 并存互斥 |
| **F4** | MEDIUM | `decision-log.md:拟议方向` 标题（第 213 行）vs 节首正文（第 216 行） | 标题"已获用户最终确认" vs 正文"**用户尚未确认**"，违反 T-011「都不改，收口」；上轮 N7 只改了标题（§3 N5） | 正文改为"v2 快照；方向已由 T-011 确认；现行口径见 `## 收敛检查`" |
| **F5** | LOW–MEDIUM | `research/direction-review-findings-disposition.md:未闭合项`（6 条）与 `detail-review-findings-disposition.md:未闭合项` `#1/#2/#3` | 仍与唯一定稿口径（9 条）不同；direction 第 4 条仍写 `触发=build-code 前必须冻结`；detail #1–#3 仍标 `step 11`（已收口）；decision-log 只登记了 detail 的 G16 一处（§3 N4、§1 M1） | 在 decision-log `未闭合项` 节首补统一过期说明（detail `#1–#3`、direction 全文为未授权修改的支撑文件快照，以本节为准） |
| **F6** | LOW | `decision-log.md:逐字声明层` V-011/V-012 标注子句 | 「原文未删」在材料内不可核（逐字原文列已是指针句，无原内容留痕；对比 V-013 的写法）（§3 N6） | 按 V-013 做法留原文，或改写标注为不声称"原文保留" |

**不计为 gap 的已授权后置项**（卡面「可后置技术项」/ D-018 越界面 / owner+触发齐备）：G12、G13、G15、G16、原子台账成本实测、79 条逐条处置、G11/G17/G20 三项 accepted_risk、17 条 `core interaction proof is unavailable`（D-019 删除面，属预期项）。

## 7. 方法局限

1. **修补前无快照，两处"历史自述"不能独立 diff 验证**：该 worktree 的 `specs/**` **未纳入 git**（`git status --porcelain` 显示 `?? specs/workflowhub-thin-core-card-07-20260919/`，`git ls-files` 对该路径返回空），全盘也未见本任务修补前的 `decision-log.md`/`module-ledger.md` 副本。故 ①module-ledger「13 行 → 12 行、10 → 9」的勘误、②V-011/V-012「原文未删」的自述，均**不能**由我独立证实或证伪——我只报"当前材料内无法核验"，**不**断言原文已被删除（§3 N6）。
2. **H2 的"权威"判定沿用材料自定口径**：我按 `decision-log.md` 自己的声明（「两处的对应关系以该支撑文件为准」）把 `coverage-matrix.md` 视为权威。即使作者改口称"矩阵是旧口径"，**当前材料内三处并存互斥**这一事实不变；且 `coverage-matrix.md` 不在本卡允许修改清单内（材料自陈），故仍须在材料侧处置。
3. **两种口径的实算只覆盖 `results/*.json`**：我按 `findings` 数组长度与 `adjudication.clusters` 长度逐份计数（7/7 份含两字段），**未**去核对 `adjudication.clusters` 的合并算法与去重规则，也**未**逐条读 `reports/*.md` 正文。第 2 轮 red 确无 result 文件，与材料「red 无结果」一致。
4. **`research/coverage-matrix.md` 未逐行全量复核**（965 行）：我核了 §1 的 U-002-01~24 全部 24 行处置列、G06 小节、§5.1 的 G06 算术、§4.3 的 CARD-03 汇总行、以及全文 `交其他卡` / `U-002-17` 的命中位置；**未**逐行复核其余 491 条单元。
5. **未跑任何测试、未重放 review**；契约复验只在原型解析器函数上实跑（read-only），未走完整 stage publication。
6. **未读取 card-02 兄弟 worktree 材料**，"79 条""三个 revision""card-02 合并后"等按材料自陈处理。
7. **未修改任何被检查文件**；本报告是本次唯一新增文件。行号仅用于本报告内部定位（材料纪律要求不使用行号锚点）。核查时点为 2026-09-21 11:27 之后（`decision-log.md` 与 `module-ledger.md` mtime 均为 11:27:27，契约复验与实算均在该时点之后运行）。
