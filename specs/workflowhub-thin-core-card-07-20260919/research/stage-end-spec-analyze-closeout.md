# 收口前最后一次独立核查

> **执行契约**：独立只读核查。**除本文件外未修改任何被检查文件**（`decision-log.md`、`research/module-ledger.md`、`research/coverage-matrix.md`、两张 findings 处置清单、三份既有复查报告均只读）。
> **核查对象**：11:33~11:38 那一轮「F1–F6 修补」（**此前未经独立验证**）是否真闭合，以及该轮修补是否引入新矛盾。
> **核查基准（实测 mtime）**：`decision-log.md` 11:33:59（1400 行）· `research/module-ledger.md` 11:38:40（93 行）· `research/direction-review-findings-disposition.md` 11:37:53 · `research/detail-review-findings-disposition.md` 11:37:53 · `research/coverage-matrix.md` **08:01:24（本轮未改，仍为权威支撑文件）**。
> **严重性口径**：HIGH=冲突或歧义（同一事实两处互斥且无主从） / MEDIUM=清单口径或过期声明不一致 / LOW=措辞与格式改进项。
> **判定口径**：`已闭合`=原问题语义已解决；`部分闭合`=主问题已解决但残留可指认的具体缺口；`未闭合`=原问题仍在。

## 0. 总体结论

**`partial`** —— **唯一 HIGH（F1）已真闭合**，F2 已闭合；但 **F3 / F4 / F5 / F6 均为部分闭合**（各残留一处可指认的具体不一致），且本轮修补**引入/留下 4 条 MEDIUM 级「同一事实两处不同表述」**（未闭合项 9 的集合分歧、OI-018 触发时点、`拟议方向` 节内自相矛盾、`decision-log` 对 detail 支撑文件的过期声明）。

一句话理由：**F1/F2 的核心矛盾确实修掉了（U-002 已全材料统一为 `24 covered`，与权威支撑文件逐格一致；两种口径已双披露），但「9 条未闭合项」的唯一定稿口径与三份视图列出的并非同一集合、OI-018 的触发时点在 `三档结论` 仍是单值时点、`拟议方向` 节首两行互相否定、`decision-log` 仍声称 detail 支撑文件「未同步改写」而该文件实际已在 11:37 刷新 —— 四处都属于项目自己定义的「同一事实两处不同表述」。**

**是否建议收口**：**不建议零修补收口**。但需说明：剩余项**全部是表述/口径不同步，不动任何决策内容**，且 F1 这一唯一 HIGH 已闭合；因此建议**只做 4 处定点最小修补（§2 N1–N4）后立即收口**，不再开新一轮全面文字打磨——历轮经验已证明全面打磨会反复引入新矛盾。

## 1. F1–F6 逐条判定 + 引文证据

### F1（HIGH，U-002 处置五处口径）→ **已闭合**

判据：把 `decision-log.md` 中**所有**出现 U-002 处置的位置逐处找出（grep `U-002` 命中 80 行 + `accepted_omission` 命中 6 行，逐行读毕），与权威支撑文件 `research/coverage-matrix.md` 的 §1 逐单元处置列、§5.1 算术对照。**逐处结论如下（无一处不一致）**：

| # | 位置（`文件:节名`） | 现行引文 | 与支撑文件一致？ |
|---|---|---|---|
| 1 | `decision-log.md:原始需求覆盖矩阵 / 来源组处置表`（L727） | 「`\| U-002 最小需求单元 \| 24 \| covered \| M1–M12（含 U-002-17/18 = **D-028 本卡承接并遵守**） \|`」 | ✅ `covered`=本卡承接；`coverage-matrix.md:§5.1`「`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0） + 待裁决 0 + 未处置 0`」 |
| 2 | 同节 `U-002 行口径` 注（L755） | 「**U-002 行口径（H2 最终修正，与支撑文件一致）**：U-002 全部 **24 条均为 `covered`（本卡承接）** —— 其中 U-002-17/18（主会话执行模型）由 **D-028** 本卡承接并遵守，**其机制归属作为注入义务指向 CARD-03**」 | ✅ 与 §1 逐单元列 `本卡承接` 一致 |
| 3 | 同节 `勘误` 条（L756） | 「本节与 D-028 后果 2 曾一度写作 `22 covered + 2 accepted_omission`，与权威支撑文件 `research/coverage-matrix.md` 矛盾（…§5.1 算术为 `G06 U-002 24 = 本卡承接 24 + 0 + 0`，**全文无 U-002 的交其他卡行**）。该写法已撤销。」 | ✅ **残留的 `22 covered + 2 accepted_omission` 字样只出现在「已撤销」的勘误里，不再是任何一处的现行处置陈述** |
| 4 | `decision-log.md:决策 / D-028 / 后果 2`（L1397） | 「`## 原始需求覆盖矩阵` 的 U-002 行 = **24 `covered`（本卡承接）**；U-002-17/18 由本条**本卡承接并遵守**…（**勘误：本条曾写作 `22 covered + 2 accepted_omission`，与权威支撑文件矛盾，已撤销**）」 | ✅ |
| 5 | `decision-log.md:决策 / D-028 / 后果 1、3`（L1396、L1398） | 「本卡决策总数由 27 增至 **28**…四处计数统一为 **28**」；「`## 三档结论` 增一行，档位 `接受`，落到本条」 | ✅ 与 L166（档位 `接受`）一致；`接受` ≠ `交其他卡` |
| 6 | `decision-log.md:三档结论`（L166） | 「主会话只做规划、派发、交互类技能，不做大量阅读与执行（V-010 = U-002-17/18）｜…｜**接受**｜…｜**D-028**」 | ✅ `接受` 档，非「未承接/交其他卡」 |
| 7 | `decision-log.md:承接与不承接清单 / 给其他卡的输入注入义务` CARD-03 行（L839） | 「（**U-002-17/18 在本卡覆盖矩阵中的处置为 `covered`（本卡承接）**，故此处是「承接 + 机制注入」关系，**不是 `accepted_omission`**）」 | ✅ **旧「本卡覆盖矩阵的 `accepted_omission`」悬空引用已删除**，且新句与支撑文件一致 |
| 8 | `decision-log.md:承接与不承接清单 / 本卡明确不承接` CARD-03 行（L827） | 「**注入本卡遵守的主会话执行模型及其可核对面（D-028 / V-010 = U-002-17/18）**」 | ✅ 只声明注入义务，不对 U-002 作处置断言 |
| 9 | `decision-log.md:需求大纲 v1（模块台账）` M2 / M12 行（L187、L197） | 「`U-002-07~14, U-002-16, **U-002-17/18**`」／「母 PRD 依赖节, card-02 承接清单, **U-002-17/18**」+ 状态 **已定**（D-014 D-028 / D-019 D-023 D-028） | ✅ 关联需求含 17/18，与本卡承接一致 |
| 10 | `decision-log.md:原始需求覆盖矩阵 / 逐单元处置汇总 + 验算`（L742–751） | 「本卡承接 **383** / 明确排除 **13** / 交其他卡 **96** / 待裁决 **23** / 未处置 **0** / 总 **515**」＋「`383 + 13 + 96 = 492`；`492 + 23 + 0 = 515` ✓」 | ✅ **我独立按 `coverage-matrix.md:§5.1` 的 24 行逐组数实算：本卡承接 383 / 明确排除 13 / 交其他卡 96 / 合计 492，逐格吻合；其中 G06 U-002 对「交其他卡 96」的贡献 = 0**，故 96 不含任何 U-002 单元，材料「未重算」不影响自洽 |

**权威支撑文件侧（未修改，mtime 08:01:24）**：`research/coverage-matrix.md:§1` 的 `U-002-01`~`U-002-24` **24 行处置列全部为 `本卡承接`**（L327–L350 逐行读毕）；`U-002-17` 行「落 M2；「派发方法」分量归 CARD-03（C-010）」、`U-002-18` 行「落 M2…→ M9」；`§5.1`（L867）`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0）`；`§5.2`（L943）「`decision-log.md` 的 `U-002-01`..`U-002-24` 连续无缺号」。

**判定：已闭合。** 旧 F1 的四项症状（同文件 `covered` vs `22+2` 并存、与支撑文件互斥、悬空引用、算术互斥）**逐项消失**；`decision-log` 内**不存在**任何一处仍把 U-002-17/18 处置写为 `accepted_omission` 的现行陈述（`accepted_omission` 仅剩 3 处合法用法：L718 取值定义、L730/L734 对 I1/I1b 两个来源组，该两组在 §5.1 确有交其他卡单元）。

### F2（MEDIUM，findings 两种口径方向相反）→ **已闭合**

| 位置 | 现行引文 | 判定 |
|---|---|---|
| `research/module-ledger.md:总览 / findings 计数口径`（L16） | 「**两种口径都真实存在，引用任一数字必须写明口径**：**口径 A（本卡采用，逐条处置用）= `findings` 数组长度跨 red/blue 相加、不去重 → 108 条 / 20 blocking**；**口径 B = `adjudication.clusters` 长度 → 114 条 / 21 blocking**（第 3 轮 37 = red 19 + blue 18）。**以 `decision-log.md` 的「计数口径」为准** | ✅ |
| `decision-log.md:审查事实与处置 / 计数口径` 第 3 条（L334–337） | 「**两种口径都真实存在，本卡披露两者**…**口径 A（本节采用）**…**108 条 / 20 blocking**…**口径 B**…**114 条 / 21 blocking**…**引用任一数字必须写明口径。**」 | ✅ |

**旧症状「`不使用任何 adjudicated cluster 类数字`」已消失**（对 module-ledger 全文 grep `adjudicated|cluster` 仅命中 L16 一处，且为披露口径 B）。两文件方向一致（均为「双披露 + 引用写明口径 + 以 decision-log 为准」）；`research/direction-review-findings-disposition.md:未闭合项 #7`（L94）同样双披露，三处口径一致。

### F3（MEDIUM，OI-018 触发时点 vs #5「触发统一」）→ **部分闭合**

**主问题已解决**：
- `decision-log.md:审查事实与处置 / 未闭合项 #5`（L370）：「**三者的「决定」必须在 build-plan 前（不晚于 build-code）完成**；其中「card-02 新形态的生效时点」这一项的**生效本身**可以更晚（card-02 合并后 / build-code 完成后）—— **「何时决定」与「何时生效」是两个不同时点，OI-018 的 trigger 已分别写明**；此处不构成矛盾。」（**旧的「触发统一为 build-plan 前…以本条为准」表述已删除**）
- `decision-log.md:唯一 OI 大纲 / OI 记录 / OI-018.trigger`（L685）：「`trigger: 决定时点 = build-plan 前（不晚于 build-code）；生效时点 = card-02 合并后或 build-code 完成后`」
- `research/module-ledger.md:未闭合项 #5`（L27）、`research/detail-review-findings-disposition.md:未闭合项 #9`（L87）同口径（后者亦写「决定时点 = build-plan 前…；生效时点 = card-02 合并后 / build-code 完成后」）。

**残留缺口（可指认）**：`decision-log.md:三档结论`（L175）「card-02 新结构与新拓扑的生效时点 … **OI-018；owner＝本卡；触发＝card-02 合并后／build-code 完成后**」——该行只给出**生效**时点作为「触发」，**缺「决定时点 = build-plan 前」**；而同一节 OI-016 行（L174）的「触发＝build-plan 前（不晚于 build-code），以本条为准」按同节体例把「触发」当**决定**时点用。同一文件内同一事实（OI-018 何时必须被决定）因此仍是**两个不同表述**（见 §2 N2）。

### F4（MEDIUM，`拟议方向` 标题 vs 节首正文）→ **部分闭合**

**已修**：`decision-log.md:拟议方向` 节首第 2 行（L216）已由「**用户尚未确认**」改为「**已获用户最终确认**（T-011「都不改，收口」）；现行版本以「收敛检查」节的 `target/scope/solution` 行与 `## 现行结论` 为准。」——全文 grep `尚未确认|待用户确认` **在 `decision-log.md` 中已无命中**（仅命中三份复查报告自身）。

**未修（残留，直接互斥）**：同一节节首**第 1 行**（L215）仍写「> **性质**：这是 **agent 当前提案**，**不是已定方向**。官方 direction 审查需要一个**可挑战的方向对象**（第二轮 blocking B11）。」——与紧邻的 L216「已获用户最终确认」、与节标题（L213「**已获用户最终确认**」）、与 `## 已选方向` 节（L29）、与 `Talk 记录 / T-011`「都不改，收口」**四重互斥**。本轮修补把矛盾从「标题 vs 正文」搬成了「正文第 2 行 vs 正文第 1 行」（见 §2 N3）。

### F5（LOW–MEDIUM，两张处置清单未收口）→ **部分闭合**

**已修部分**：
- `research/detail-review-findings-disposition.md`：`处置分组` G9/G10/G18 已改标「✅ **`fixed`（D-024 / D-025 / D-026）**」（L20、L21、L29）；`逐条对照` R01/B02/R04/R19 同步改标（L37、L57、L40、L55）；`未闭合项` #1/#2/#3 已划删并标「✅ **已闭（D-024 / D-025 / D-026）**」（L79–L81）；并新增「**计数**：**未闭 6 条**（#4~#9）…#1~#3 已由 D-024 / D-025 / D-026 收口。**与 `decision-log.md` 的定稿口径（9 条）关系**：该 9 条另含…三条 `accepted_risk`」（L89）。**detail 侧旧症状（#1–#3 仍标 `step 11`）已消失。**
- `research/direction-review-findings-disposition.md`：`未闭合项` 已刷新为 7 行表格并声明「**本清单不是定稿口径。** 未闭合项的**唯一定稿口径** = `decision-log.md` 的「未闭合项…」（**真正未闭合 9 条**）…以下为刷新后的状态」（L84–L94），第 4 条「三个前置冻结」触发已改为「**build-plan 前**」（L91，旧「触发=build-code 前必须冻结」不再出现在该表）。

**残留缺口（两处，均可指认）**：
1. `research/direction-review-findings-disposition.md:处置分组` G18 行（L41）**仍写**「**触发=build-code 前必须冻结**」，与该文件**同文件** `未闭合项 #4`（L91「**三者「决定」须在 build-plan 前（不晚于 build-code）完成**」）**互斥**，且未标为历史快照（见 §2 N5）。
2. `decision-log.md:审查事实与处置 / 未闭合项 #5 / 冲突说明`（L371）**仍声称**：「`research/detail-review-findings-disposition.md` 的 G16 / 未闭合项 #8 是本条的来源；该文件**不在本卡允许修改清单内，故未同步改写**…但**「支撑文件未落改」这一事实登记在此**」——但按实测 mtime，detail 文件已在 **11:37:53 被改写**（晚于 `decision-log.md` 的 **11:33:59**），其 `未闭合项` 首部、#1–#3 与 G9/G10/G18 均已刷新。该声明**当前为过期/失实**（见 §2 N4）。

### F6（LOW，V-011/V-012「原文未删」不可核）→ **部分闭合**

**已修**：`decision-log.md:逐字声明层` V-011/V-012 说出者列（L137、L138）已删去「**原文未删**」子句，改为「**【索引，非逐字】**（**该标注系 G7 修复时追加，按 D-020 登记为「已被修正」**：本次修复**只在原行上追加括注**，未改动该行的 ID、场景与指针内容）」。全文 grep `原文未删` 在 `decision-log.md` **已无命中**（仅命中复查报告）。「未改动该行的 ID、场景与指针内容」是**可核对**的（V-011/V-012 的 ID、场景「U-002 最小需求单元表（24 条）」/「U-003…」、指针句均在位）。

**残留缺口（LOW）**：「**只在原行上追加括注**」这一**历史断言**与材料自身记录不符——`research/detail-review-findings-disposition.md:处置分组` G7 行（L18）明写「**逐字层含非逐字条目**：V-011 / V-012 是「见 …」这类指针，**却标成用户原话** ｜ `fixed` ｜ 两行**显式标** `【索引，非逐字】`」——即修复把「说出者」列的「用户」**改成**了「**【索引，非逐字】**（…）」，属**改写**而非「只追加括注」；且该标注按 D-020 格式应写「已被 **X** 修正」，此处只写「已被修正」未给 X（见 §2 N6）。该残留不影响读者判断当前口径（当前口径明确），故记 LOW。

### F1–F6 判定汇总

| gap | 上一轮 | 本轮判定 |
|---|---|---|
| **F1** U-002 五处口径（HIGH） | 未闭合 | **已闭合** |
| **F2** findings 两口径（MEDIUM） | 未闭合 | **已闭合** |
| **F3** OI-018 触发时点（MEDIUM） | 未闭合 | **部分闭合**（残留 `三档结论` L175 单值时点） |
| **F4** `拟议方向` 节内互斥（MEDIUM） | 未闭合 | **部分闭合**（残留 L215「不是已定方向」） |
| **F5** 两张处置清单（LOW–MEDIUM） | 未闭合 | **部分闭合**（残留 direction G18 行 L41；`decision-log` L371 过期声明） |
| **F6** V-011/V-012 标注（LOW） | 未闭合 | **部分闭合**（「只在原行上追加括注」不精确 + 缺 X） |

**计数：已闭合 2（F1、F2）／部分闭合 4（F3–F6）／未闭合 0。**

## 2. 新矛盾清单

> 说明：以下均按「任务书点名的 7 类同一事实/悬空/过期/append-only 检查」逐项查过；**未命中的项目在 §2.9 明确列出「未发现」**。

### N1（MEDIUM，[本轮修补引入的清单口径分歧]）「真正未闭合 9 条」的**唯一定稿口径**与三份视图列出的**不是同一集合**

- `decision-log.md:审查事实与处置 / 未闭合项` 节首（L362）：「**计数**：12 条编号中 **#1 / #3 / #4 已被取代或收口** → **真正未闭合 9 条**（#2、#5~#12）」。按其编号实际成员 = {#2 79 条、#5 三个前置冻结、#6 G12、#7 G13、#8 G11、#9 G17、#10 G20、**#11 第二轮 red 无结果**、**#12 未产出 `pass` 语义**} = 9。
- `research/module-ledger.md:未闭合项`（L36）：「**9 项仍在**（#4~#9 共 6 项 deferred/未承接 + #10~#12 共 3 项 accepted_risk）。**与 `decision-log.md` 的「未闭合项」唯一定稿口径一致（9 条）**」。其实际成员 = {79 条、三冻结、G12、G13、**G15 可执行细则**、**成本实测**、G11、G17、G20} = 9。
- `decision-log.md:收敛检查` 方案行（L850）：「未决项：OI-016 与 OI-018 为 deferred；79 条…（G14）；G12 / G13 / **G15** 留 build-plan；G11 / G17 / G20 为 accepted_risk；G9 / G10 / G18 已…收口；…**成本实测仍未承接**」= 与 module-ledger **同集合**（9）。
- `decision-log.md:承接与不承接清单 / 给其他卡的输入注入义务` CARD-10 行（L842）：「本卡未闭合项（79 条逐条处置（G14）/ 三个前置冻结（G16…）/ G11 / G12 / G13 / G15 / G17 / G20…）」= **只有 8 项，缺「成本实测」**。
- **性质**：`decision-log` 自己的节首把「9」算成「#2 + #5~#12」，于是把两条**无 owner/trigger 的说明项**（#11「第二轮 red 侧无结果」、#12「未产出 `pass` 语义」）计入未闭合，而把两条**有 owner/trigger 的实质未决项**（G15 可执行细则、成本实测——分别藏在被划删的 #1/#3 的尾部，见 L366、L368）排除在计数外；这与同节自己的口径规则（L364「`deferred` / `未承接` 项的 owner 与 trigger 必须写全」——#11/#12 两词都不是）相抵。**数字「9」四处一致，但成员集合 7 项相同、2 项各说各话**，读者无法从「唯一定稿口径」推出 module-ledger/收敛检查的那 9 项。
- **严重性理由**：MEDIUM——不是数字互斥，而是「唯一定稿口径」这一声明**未能定稿集合**；且 `承接与不承接清单` 的注入枚举缺 1 项（会漏注入「成本实测」给 CARD-10）。

### N2（MEDIUM，[本轮修补未同步]）OI-018 的「触发」在 `三档结论` 仍是单值时点

- `decision-log.md:唯一 OI 大纲 / OI 记录 / OI-018.trigger`（L685）：「`决定时点 = build-plan 前（不晚于 build-code）；生效时点 = card-02 合并后或 build-code 完成后`」
- `decision-log.md:审查事实与处置 / 未闭合项 #5`（L370）：「**三者的「决定」必须在 build-plan 前（不晚于 build-code）完成**…」
- `decision-log.md:三档结论`（L175）：「card-02 新结构与新拓扑的生效时点 … **OI-018；owner＝本卡；触发＝card-02 合并后／build-code 完成后**」← **只给生效时点**，未写决定时点；同节 OI-016 行（L174）却把「触发」用作决定时点。
- **性质**：同一文件内同一事实（OI-018 何时必须被决定）两处不同表述，且 F3 的修补恰恰声称「OI-018 的 trigger 已分别写明」——**该声明在 OI 记录与 #5 成立，在三档结论不成立**。

### N3（MEDIUM，[本轮修补触发]）`拟议方向` 节首两行直接互相否定

- 同行证据见 §1 F4：L215「这是 **agent 当前提案**，**不是已定方向**」 vs L216「**已获用户最终确认**（T-011「都不改，收口」）」。
- **性质**：「同一事实两处不同表述」且相邻。修补前该节内外一致地「未确认」（与 T-011 冲突）；修补后 L216 翻正，L215 未动 → 矛盾内化到节内。

### N4（MEDIUM，[本轮修补引入的过期声明]）`decision-log` 声称 detail 支撑文件「未同步改写/未落改」，而该文件已在之后被改写

- `decision-log.md:审查事实与处置 / 未闭合项 #5 / 冲突说明`（L371）：「…该文件**不在本卡允许修改清单内，故未同步改写**…但**「支撑文件未落改」这一事实登记在此**。」
- 事实：`research/detail-review-findings-disposition.md` **mtime = 11:37:53**，晚于 `decision-log.md`（**11:33:59**）；其内容已含本轮刷新：`未闭合项` 首部声明「唯一定稿口径 = `decision-log.md`…（真正未闭合 9 条）」（L75）、#1–#3 划删标已闭（L79–L81）、G9/G10/G18 标 `fixed（D-024 / D-025 / D-026）`（L20/21/29）。
- `research/module-ledger.md:未闭合项 #5`（L27）同样转述「该支撑文件不在允许修改清单内的冲突已在彼处登记」——同一过期声明被视图复制。
- **性质**：属「过期状态」。读者按该说明会把 detail 文件当**未刷新的过期快照**，而它其实已经刷新；`「支撑文件未落改」`这一**以事实登记自称**的句子当前为假。

### N5（LOW–MEDIUM，[本轮修补未同步]）direction 处置清单内 G18 触发时点自相矛盾

- `research/direction-review-findings-disposition.md:处置分组` G18（L41）：「**触发=build-code 前必须冻结**」
- 同文件 `未闭合项 #4`（L91）：「**未闭** —— 三者「决定」须在 build-plan 前（不晚于 build-code）完成」
- `decision-log.md:未闭合项 #5`（L370）：「必须在 build-plan 前（不晚于 build-code）完成」
- **性质**：同文件内两处触发时点不同；`未闭合项` 已声明以 decision-log 为准，但 `处置分组` 表未加历史/过期标注，读者无法判定哪条现行。

### N6（LOW，[本轮修补引入]）V-011/V-012 标注的两点不精确

- 「**只在原行上追加括注**」（L137/L138）与 G7 的实际改动（说出者「用户」→「**【索引，非逐字】**（…）」；见 `detail-review-findings-disposition.md:处置分组` G7，L18）不符——是**改写**而非仅追加。
- 6 处「已被修正/取代」标注**未按 D-020 的「已被 **X** 修正/取代」格式给出 X**：`decision-log.md` L970（D-002）、L1205（D-016）、L475（OI-003）、L650（OI-016）、L137/L138（V-011/V-012）；合规给出 X 的只有 L1104（D-011→D-025）与 L1377（D-027→D-028）。
- **append-only 自洽结论**：读者**能**判断哪条现行（每处标注都同时写出了现行口径），故不构成 HIGH；但格式未统一，且 D-002/D-016 的标注未命名修正来源。

### N7（LOW，[残留]）detail 处置清单内一个历史决策计数未标口径

- `research/detail-review-findings-disposition.md:处置分组` G2（L13）：「与 T-003~T-009 和 **23 条 confirmed 决策**矛盾」——「23」是 detail 审查当时的计数，现行为 **28**。该数字位于**被引用 finding 的原文描述**中（历史语境），故不判为过期状态声明，仅提示读者可能误读；同行 `处置` 列已说明「12 行全部更新为真实状态并标注主责决策编号」。

### N8（MEDIUM，[残留·非本轮引入]）`research/outline-r0.md` 被 7 处引为落点，但该文件不存在；D-009 第 2 条的「3–5 个可证伪问题」在材料内无对应清单

- 引用位置（全部在 `decision-log.md`）：L171（三档结论）、L229（范围 in-1）、L262（step 映射）、L503（OI-005.acceptance「大纲 r0 落 research/outline-r0.md 并附 3 到 5 个可证伪问题」）、L796（D-025）、L1070（D-009 第 1 条）、L1352（D-025 正文）。
- 事实：`research/` 目录**已完整枚举**（18 个文件），**无 `outline-r0.md`**；全 worktree `find . -name "*outline-r0*"` **无命中**（无 `_draft/` 版本）。
- 相关：grep `可证伪问题` 在 `decision-log.md` 只命中**要求**本身（D-009 第 2 条、OI-005、映射表、描述），**没有任何「3–5 个可证伪问题」的实际清单**；D-009 第 1 条又声称「大纲 r0 **不写入材料正文**」，而正文里存在 `## 需求大纲 v1（模块台账）`——两者关系（`需求大纲 v1` 是否等于 r0？r0 草案去哪了？）材料未交代。
- D-009 自写的**失效条件**（L1076）「若从未触发过废弃重画…必须登记为失效并在**阶段末披露**」及 OI-005.counterexample（L504）、D-025 后果的「角度确认形同虚设」阶段末披露（L1354）：全文 grep `形同虚设` **仅命中这些要求句本身，无任何阶段末披露**。
- **严重性**：MEDIUM。**声明不是「已被授权后置项」**：卡面授权后置的是 G12/G13/G15/G16/成本实测（两条处置清单明列），不含本项。**声明也不是被前三轮覆盖过**：grep `outline-r0`、`r0` 在三份既有复查报告中**均无命中**。故这是**前三轮从未触及**的残留缺口（非本轮修补引入）。

### N9（信息项）三份仍未核实的支撑事实登记

- `research/module-ledger.md:官方步骤进度` step 13（L92）称「handoff 已写 `quality/evidence/handoff/make-decision.md`」、step 14（L93）称「reflection status=**degraded**」。worktree 根**无 `quality/` 目录**、`find . -maxdepth 4 -iname "*handoff*"` 在该 worktree 内**只命中 runtime/tests/skills 的代码文件**，无本任务 handoff 产物。
- 但按本卡自陈，`quality/**` 属**仓外任务追踪目录**；我在读取范围内**未能定位**该目录（见 §6 局限）。故**不对其存在性下断言**，仅登记为「材料声明不可由我在本 worktree 内核验」。

### 2.9 明确「未发现」的项（不凑数，均经全位置检索）

- **决策计数（应 28）**：脚本实测 `## 现行结论` **28 行**、`## 决策` 小节 **28 小节**、`D-001`~`D-028` **无缺号无重复**；grep `28 条决策|决策 28` 命中 L801 / L838 / L937 / L1396 **四处口径一致**；残留的「26 条」仅出现在 D-027 正文（带「**已被 D-028 修正计数，原文保留**」，L1377）与 T-011 的「计数已统一」说明（L937），**均为标注历史口径**。**未发现**残留 23/26/27 作为现行值。
- **findings 两种口径**：`108 / 20`（口径 A）与 `114 / 21`（口径 B）在 `decision-log.md:计数口径`（L334–337）、`module-ledger.md:总览`（L16）、`direction-review-findings-disposition.md:未闭合项 #7`（L94）**三处双披露且方向一致**；逐轮分项（30+13+32+33=108；9+1+5+5=20；detail 33 = 19+14）在 `decision-log.md:轮次与 findings`（L324–328）与两张清单的「计数自检」行（direction L80、detail L71）**逐格一致**。**未发现**互斥。
- **三档结论行数（应 22）**：脚本实测**数据行 22 行**；表头注（L151）自述「合并前 23 → 21，再追加 D-028 后为 **22 行**」；`module-ledger.md:官方步骤进度` step 9（L88）「三档结论 **22 条**」。**未发现**不一致。
- **OI 计数（应 19 = 17 confirmed + 2 deferred）**：脚本实测 OI 记录 **19 条**（`status: confirmed` 17 / `deferred` 2）；`### OI 状态汇总`（L709–711）`open 0 / confirmed 17（OI-001~OI-015、OI-017、OI-019）/ deferred 2（OI-016、OI-018）`；`module-ledger.md:总览`（L14）「17 confirmed + 2 deferred；**OI 无 open**」；`decision-log.md:拟议方向 / 明确未决`（L290）「**19 条 OI**」。**未发现**不一致。
- **模块（12 已定）**：`## 需求大纲 v1` **12 行**（M1–M12）状态列**全部「已定」**；`module-ledger.md:总览`「模块总数 **12**」「模块状态 **全部有结论**（12/12）」+ `模块结论一览` **12 行**。**未发现**互斥。
- **待裁决 23**：汇总行（L745）与 `### 覆盖矩阵的 23 条「待裁决」单元（单列披露）`（L380–396）**指针逐字可落地**，MOD-M9 / ML-06 / ML-07 已闭 + 其余 20 条 owner/触发齐备。**未发现**悬空。
- **引用目标存在性**：脚本抽出 `decision-log.md` 全部反引号小节引用并逐一比对标题——4 处「表面未解析」经人工核对**全部为跨文件引用或复合路径且真实存在**：`### CARD-07 make-decision 头脑风暴平台改造`/`### 用户原话要点`/`### CARD-07` 指向**母 PRD**（L39 给出绝对路径）、`## 决策 / D-011` = `## 决策` + `### D-011`、`## 承接与不承接清单 / 给其他卡的输入注入义务` = 对应节 + 子节。`direction-review-findings-disposition.md` 的 `` `## 拟议方向` `` 为跨文件指向 `decision-log.md` 的节（该文件 L39 语境内）。`research/` 下被引用的 15 个 `.md` **仅 `outline-r0.md` 不存在**（见 N8）。**除 N8 外未发现悬空引用**。（「收敛检查」节的 `target/scope/solution 行`经查是**契约规范键名**：`runtime/stage/stage-content-contracts.mjs` L3280/L3308 用 `goal/scope/solution/acceptance`，L3243 把 `目标|goal|target` 归一到 `goal` —— 故该表述成立，不计 gap。）
- **过期状态（T-011 冲突类）**：grep `尚未确认|待用户确认|待确认` 于 `decision-log.md` 仅命中 L1142（D-013 第 3 条的**机制**「agent 派生项 + 待用户确认」，非阶段状态）；grep `待定` 仅命中「已定/待定/本轮」回显机制（L182/223/994/1164）与 detail 的 G2 历史描述；模块台账 12 行**无「待定」**。**唯一命中 T-011 冲突的是 N3（L215）**。
- **append-only**：`已被修正/取代/作废` 标注共 8 处（D-002、D-011、D-016、D-027、OI-003、OI-016、V-011、V-012）+「拟议方向范围 out」的作废条（L251）+ 未闭合项 #1/#3 的划删标（L366/L368）。**逐一读过，读者均能判现行口径**；仅格式与措辞问题见 N6。
- **已授权后置项不计 gap**：G12 / G13 / G15 / G16 / 原子台账成本实测 / 79 条逐条处置 / G11、G17、G20 三条 `accepted_risk` / 17 条 `core interaction proof is unavailable`（D-019 删除面，属预期项）——均带 owner+触发或已登记缓解，**不计为 gap**。

## 3. `research/module-ledger.md` vs `decision-log.md` 逐格对照

| 字段 | `decision-log.md` | `research/module-ledger.md` | 一致？ |
|---|---|---|---|
| 模块总数 / 状态 | `需求大纲 v1` 12 行全「已定」 | 「模块总数 12」「12/12 全部有结论」 | ✅ |
| 已定决策 | `现行结论` 28 行 + 尾注「现行决策 28 条」 | 「已定决策 **28**（D-001~D-028，含收口元决策 D-028，全部获用户最终确认）」 | ✅ |
| OI 收盘 | `OI 状态汇总` open 0 / confirmed 17 / deferred 2 | 「17 confirmed + 2 deferred；OI 无 open」 | ✅ |
| findings / blocking | 轮次表合计 **108** / **20** | 「四轮 findings 合计 108、blocking 合计 20」 | ✅ |
| **findings 计数口径** | 「两种口径都真实存在，本卡披露两者…引用任一数字必须写明口径」 | 同口径（口径 A 108/20；口径 B 114/21；以 decision-log 为准） | ✅（**F2 已闭合**） |
| 三档结论条数 | 22 数据行（实测）；表头注自述 22 | step 9「三档结论 **22 条**」 | ✅ |
| 未闭合项**条数** | 「真正未闭合 **9 条**」 | 「**9 项仍在**」 | ✅（数一致） |
| **未闭合项集合** | 编号成员 = {79 条、三冻结、G12、G13、G11、G17、G20、**第二轮 red 无结果**、**未产出 pass 语义**} | = {79 条、三冻结、G12、G13、**G15 细则**、**成本实测**、G11、G17、G20} | ❌ **N1**（交集 7，各多 2） |
| 未闭合项 owner/触发（逐项） | #2 build-plan 前；#5 build-plan 前（不晚于 build-code）；#6/#7 build-plan；#8/#9/#10 accepted_risk | #4 build-plan 前；#5 同；#6/#7/#8 build-plan；#9 build-plan 前；#10/#11/#12 accepted_risk | ✅（#6/#7/#8 与 #6/#7 对应，#9 成本实测对应 #3 尾） |
| 待裁决 23 | 汇总行 23（快照值 + 单列披露指针） | 未单列 | ✅（不冲突） |
| 契约自检 | L353–357：`普通任务`；outline 四项 passed、非 proof 错误 0；convergence ok=true/errors=0；17 条 proof 缺失＝预期 | step 9（L88）同口径，且**显式写出 `ok=false`**、`interaction_proof=missing` 是 17 条预期项 | ✅（与 §4 实跑逐格一致） |
| 官方步骤进度 | — | step 9/10/11/12/13/14 均 ✅；step 12「22 条 gap（H1–H11 / M1–M8 / L1–L3）」 | ✅（22 = 11+8+3 实测吻合） |
| 用户已裁决方向性事项 | `三档结论` + `## 决策` | 15 行，含 D-028 行「主机制归属与注入义务归 CARD-03」 | ✅ |
| **唯一不一致的格子** | — | — | **未闭合项集合（1 格）** |

**汇总：逐格对照 13 个字段，12 ✅ / 1 ❌。** 另注：module-ledger `未闭合项` #2 行（L24）「✅ **已闭**（D-021）；**成本实测仍未承接**，见 #9」与 #3 行（L25）「✅ **已闭**（D-024/025/026，step 11 三步走已完成）」同 decision-log 的合并行写法，**不算不一致**。

## 4. 契约复验输出原文

命令（在 `/Users/Hugh/Hugh/Project/workflowhub` 下只读实跑，目标为 worktree 的 `decision-log.md`，**在 F1–F6 修补落地后运行**；mtime 11:33:59）：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub && node -e "
import('./runtime/stage/stage-content-contracts.mjs').then(m=>{
  const fs=require('fs');
  const md=fs.readFileSync('/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919/specs/workflowhub-thin-core-card-07-20260919/decision-log.md','utf8');
  console.log('taskType =', m.readTaskTypeFromDecisionLog(md));
  const o=m.analyzeDecisionOutline(md,{taskId:'workflowhub-thin-core-card-07-20260919'});
  console.log('outline components =', JSON.stringify(o.components));
  console.log('outline non-proof errors =', o.errors.filter(e=>!/core interaction proof is unavailable/.test(e)).length);
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

补充实跑（同文件，补齐总错误数与逐条枚举）：

```
outline ok= false total errors= 17
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

**与材料自检表逐格对照**（`decision-log.md:审查事实与处置 / 材料契约自检` L349–357）：`readTaskTypeFromDecisionLog`=`普通任务` ✅；`analyzeDecisionOutline` 的 `structure`/`direction_snapshot`/`no_open_items`/`terminal_fields` = `passed`、非 proof 类错误 **0** ✅；`analyzeDecisionConvergence` = `ok=true, errors=0` ✅；17 条 proof 缺失被披露为**预期项**（D-019 删除面）✅，`ok=false` **未被写成通过** ✅。**契约层未发现材料美化。**

**关键提醒（与上轮同结论）**：机器对 §2 的 4 条 MEDIUM 冲突**零报警**（N1 的集合分歧、N2 的触发时点、N3 的节内互斥、N4 的过期声明全部被解析器放过）——**契约解析器挡不住这类错误**，本报告的 §1/§2 是人工核对结果，不能由 §4 的绿字替代。

## 5. 剩余 gap

| # | 严重性 | 位置 | 问题 | 建议最小修法 |
|---|---|---|---|---|
| **N1** | MEDIUM | `decision-log.md:未闭合项` 节首（L362）vs 同文件 `收敛检查`（L850）、`承接与不承接清单`（L842）、`module-ledger.md:未闭合项`（L36） | 「9」数字一致但集合不同（交集 7，各多 2）；节首把 #11/#12 两个**无 owner/trigger 说明项**计入，把 G15 细则/成本实测排除在计数外；注入枚举只有 8 项 | 节首计数改为「**9 项**（按归并口径：79 条 / 三个前置冻结 / G12 / G13 / G15 细则 / 成本实测 / G11 / G17 / G20）；#11 / #12 为事实登记、不计入未闭合」；`承接与不承接清单` 的 CARD-10 行补「成本实测」 |
| **N2** | MEDIUM | `decision-log.md:三档结论`（L175）vs `唯一 OI 大纲 / OI-018.trigger`（L685）、`未闭合项 #5`（L370） | OI-018 的「触发」在三档结论仍是单值（只写生效时点），与 OI 记录/#5 的「决定时点 vs 生效时点」两处表述不同 | L175 触发列改为「决定时点 = build-plan 前（不晚于 build-code）；生效时点 = card-02 合并后／build-code 完成后」 |
| **N3** | MEDIUM | `decision-log.md:拟议方向`（L215 vs L216） | 「不是已定方向 / agent 当前提案」与「已获用户最终确认（T-011）」相邻互斥 | L215 改为「**性质**：本版为 v2 快照（agent 提案，用于承载官方 direction 审查的可挑战对象）；**方向已由 T-011「都不改，收口」确认**」（保留可挑战对象的历史说明，但不留现行状态） |
| **N4** | MEDIUM | `decision-log.md:未闭合项 #5 / 冲突说明`（L371）+ `module-ledger.md:未闭合项 #5`（L27） | 声称 detail 支撑文件「未同步改写 / 支撑文件未落改」，而该文件已在 11:37:53 被刷新（晚于 decision-log 11:33:59） | 把该条改为事实陈述：「detail 清单的 `未闭合项` 已同步刷新；本条与该文件 `#8` 现已同口径（build-plan 前，不晚于 build-code）」；module-ledger L27 同步删去「该支撑文件不在允许修改清单内的冲突已在彼处登记」 |
| **N5** | LOW–MEDIUM | `direction-review-findings-disposition.md:处置分组` G18（L41）vs 同文件 `未闭合项 #4`（L91） | 同文件两处触发时点不同（build-code 前 vs build-plan 前） | G18 行改为「触发=build-plan 前（不晚于 build-code）」或标注「（历史处置记录；现行触发见本文件 `未闭合项 #4` 与 `decision-log.md` 未闭合项 #5）」 |
| **N6** | LOW | `decision-log.md:逐字声明层` V-011/V-012（L137/L138）；D-002 L970 / D-016 L1205 / OI-003 L475 / OI-016 L650 | 「只在原行上追加括注」与 G7 实际改写不符；6 处 `已被修正` 未按 D-020 给 X | V-011/V-012 改为「说出者列已由『用户』改标为『【索引，非逐字】』，按 D-020 登记为已被 G7 修复修正」；其余各处补 X（D-002→D-007/D-008、D-016→D-023/D-020、OI-003→D-016、OI-016→D-010） |
| **N7** | LOW | `detail-review-findings-disposition.md:处置分组` G2（L13） | 历史计数「23 条 confirmed 决策」未标口径（现行 28） | 于 finding 引用后补「（审查当时口径；现行 28）」 |
| **N8** | MEDIUM | `decision-log.md` L171/L229/L262/L503/L796/L1070/L1352 → `research/outline-r0.md`；D-009 第 2 条 / OI-005.acceptance / D-009·D-025 失效条件 | 被 7 处引为落点的 r0 草案**不存在**；「3–5 个可证伪问题」无实际清单；两处阶段末披露未做；D-009 第 1 条「不写入材料正文」与正文里的 `## 需求大纲 v1` 关系未交代 | 三选一并写明：①补 `research/outline-r0.md`（含 3–5 个可证伪问题与逐条判定结果）；②把 7 处落点改为「本阶段以 `## 需求大纲 v1` 为大纲承载，r0 草案未单独落盘」并同步 OI-005.acceptance；③把该缺口登记进 `未闭合项` 并给 owner+触发 |
| **N9** | 信息项（不可核） | `module-ledger.md:官方步骤进度` step 13/14（L92/L93） | 「handoff 已写 `quality/evidence/handoff/make-decision.md`」「reflection status=degraded」在 worktree 内无对应产物，仓外追踪目录未能在读取范围定位 | 由持有仓外目录权限的一方核对；本报告**不断言其缺失** |
| **N10** | LOW | `module-ledger.md:官方步骤进度` step 12（L91） | 「产出 22 条 gap…**已按清单逐条修补**」未区分「已修补」与「已闭合」；同 worktree 的两份复查报告（11:21、11:33）记录该轮后有 1 条未闭合（H2）+4 条部分闭合，本报告另有 4 条部分闭合 | 改为「22 条均有处置记录；闭合状态以逐轮独立复查报告与本材料 `未闭合项` 为准」 |

**不计为 gap 的已授权后置项**：G12、G13、G15、G16、原子台账成本实测、79 条逐条处置、G11/G17/G20 三条 `accepted_risk`、17 条 `core interaction proof is unavailable`（D-019 删除面，预期项）。

## 6. 方法局限

1. **无修补前快照**：该 worktree 的 `specs/**` 未纳入 git（无 baseline 副本），故 V-011/V-012 的「只在原行上追加括注」、module-ledger 的「13 行→12 行 / 10→9」勘误，**不能**由我 diff 证实或证伪；对 V-011/V-012 我只依据**材料自身**（detail 清单 G7 行写「却标成用户原话」「两行显式标 `【索引，非逐字】`」）指出措辞张力，**不**断言原文是否被删。
2. **「未同步改写」的判定用 mtime 排序 + 现行内容**：我以 `decision-log.md`（11:33:59）早于两张清单（11:37:53）与 module-ledger（11:38:40）为据，且 detail 文件内容已含「唯一定稿口径=decision-log、真正未闭合 9 条」等与 11:33 决策口径同期的刷新文字，故判该声明过期；**未能**拿到 11:33 时的 detail 文件 bytes 做逐字 diff。
3. **外置任务追踪目录未定位**：`quality/reviews/results/*.json`、`quality/evidence/handoff/make-decision.md` 不在 worktree 内；我在 `/Users/Hugh/Hugh/Project`（深度 3）与 `/Users/Hugh/Knowledge/Projects/workflowhub`（深度 3）做**有界**搜索未命中本任务的 `quality/`，一次更大范围 `find` **超时被终止**。故：**findings 两种口径的逐轮实算沿用上一轮（final 报告）的独立实算结论，本轮未重读 review 原件**，也未对本任务 handoff/reflection 产物下存在性断言。
4. **`coverage-matrix.md` 非逐行全量复核**：我核了 §1 的 `U-002-01`~`U-002-24` 全 24 行处置列、§5.1 全部 24 行逐组算术（脚本复算得 383/13/96/492，与文件自述逐格吻合）、§5.2 的 U-002 行；**未**逐行复核其余 491 条单元。因 F1 的问题域只在 U-002/G06，该范围足够。
5. **未跑任何测试、未重放 review**；契约复验只在原型解析器函数上只读实跑，未走完整 stage publication。
6. **未读取 card-02 兄弟 worktree 材料**（除目录列举）；「79 条」「三个 revision」「card-02 合并后」按材料自陈处理。
7. **未修改任何被检查文件**；本报告是本次唯一新增文件。行号仅用于本报告内部定位（材料纪律要求不使用行号锚点）。核查时点为 2026-09-21 11:38 之后（契约复验、脚本计数与全位置 grep 均在此之后运行）。
