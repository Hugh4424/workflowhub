# stage-end spec-analyze 复查（对 22 条 gap 的复核）

> 执行契约：独立只读复查。**除本文件外未修改任何被检查文件**（`decision-log.md`、`research/module-ledger.md`、`research/coverage-matrix.md`、两张处置清单、`quality/reviews/**` 均只读）。
> 复核对象：`research/stage-end-spec-analyze.md`（下称"原报告"）§9 的 22 条 gap（H1–H11 / M1–M8 / L1–L3）。
> 复核基准：`decision-log.md`（1394 行）、`research/module-ledger.md`（93 行）、仓外审查原件 `.../quality/reviews/results/*.json`（7 份）。
> 严重性口径沿用 SKILL.md：HIGH=冲突或歧义 / MEDIUM=术语漂移或覆盖缺失 / LOW=改进建议。

## 0. 总体结论

**`inconsistent`** —— 22 条 gap 中 **17 条已闭合、4 条部分闭合、1 条未闭合**；修补**确实引入了一条真矛盾**：为修 H2，材料把 U-002-17/18 从 `covered` 改成 `accepted_omission`（="交其他卡"），并声称"覆盖矩阵把该 2 条列为交其他卡"，但支撑文件 `research/coverage-matrix.md` 的逐单元处置与 §5.1 算术都写死 `U-002 = 本卡承接 24 + 交其他卡 0`（`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0）`）——修补把一个"疑似互斥"换成了一个"确定的、与权威支撑文件互斥"的新矛盾，且与同卡 `三档结论` 的 `V-010` 档位 `接受` 也互斥。另有一处**关于审查原件的失实断言**（称原件里没有 adjudicated cluster 字段、"第三轮 37"无原件依据），而 7 份 result.json **全部**含 `adjudication.clusters`，第三轮 cluster 数正是 red 19 + blue 18 = 37。findings 计数本身（108 / 20 blocking 与逐 role 分布）**逐格复算准确**；决策计数 28、三档结论 22 行、`## 现行结论` 覆盖 D-001~D-028、结构破损修复均**成立**。

### 0b. 计数复算与契约复验结论（先说结论）

- **findings 计数：材料数字准确。** 按"`findings` 数组长度、跨 red/blue 直接相加"口径逐份复算：`14+16+13+15+17+19+14 = 108`；`blocking: 4+5+1+3+2+1+4 = 20`；轮次表每一格的 per-role severity 分布**与原件 `findings` 数组逐格吻合**（见 §3）。
- **契约复验：与材料自检表一致。** `readTaskTypeFromDecisionLog = 普通任务`；`analyzeDecisionOutline` 的 4 个 component = passed、`interaction_proof = missing`、非 proof 类错误 0（总 `errors.length = 17`，全部为 `core interaction proof is unavailable`）；`analyzeDecisionConvergence ok = true, errors = 0`（原文见 §4）。

## 1. 22 条 gap 逐条复核

判定口径：`已闭合` = 原问题语义已解决；`部分闭合` = 主问题解决但残留具体可指认的缺口；`未闭合` = 原问题仍在或被改写成另一个矛盾。

| gap | 判定 | 当前位置证据 | 若未闭合/部分闭合，差什么 |
|---|---|---|---|
| **H1** V-010 无决策落点 | **部分闭合** | 新增 `decision-log.md:决策/D-028`：「`- **requirement_ids**：**V-010（= U-002-17/18）**、U-002-16、母 PRD CARD-03 边界`」；`decision-log.md:三档结论` 新增「主会话只做规划、派发、交互类技能…（V-010 = U-002-17/18）｜V-010…｜**接受**」；`decision-log.md:承接与不承接清单/给其他卡的输入注入义务` 新增 CARD-03 行「本卡遵守的执行模型：**主会话只做规划／派发／交互类技能…**」。核心落点与注入义务均已落盘 | 残**1 处可追溯性缺口**：D-028 声明 `module = M2、M12`，但 `decision-log.md:需求大纲 v1` 的 M2 行仍写 `关联原始需求｜U-002-07~14, U-002-16`、M12 行写 `母 PRD 依赖节, card-02 承接清单`，两处均不含 U-002-17/18。原 H1 点名的"M2 关联需求不含 17/18"这一症状未改 |
| **H2** U-002-17/18 两处处置互斥 | **未闭合（并新增反向矛盾）** | `decision-log.md:原始需求覆盖矩阵`：「`\| U-002 最小需求单元 \| 24 \| **22 covered + 2 accepted_omission** \| M1–M12；**U-002-17/18 由 D-028 本卡遵守、机制归 CARD-03**…`」＋「**U-002 行口径（H2 修正，两处数字可互推）**：`24 = 22 covered + 2 accepted_omission` ——…与 `research/coverage-matrix.md` 把该 2 条列为「交其他卡」互斥，已按矩阵口径修正」 | 支撑文件**并不支持**该修法：`research/coverage-matrix.md` 逐单元行「`\| U-002-17 \| … \| M2/AX04 \| 本卡承接 \| 主会话执行模型，落 M2；「派发方法」分量归 CARD-03（C-010） \|`」「`\| U-002-18 \| … \| 本卡承接 \|`」，且 §5.1 算术「`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0）`」。同时 `decision-log.md:三档结论` 同一单元档位为 **`接受`**（非 `未承接`）。即：材料声明"两处数字可互推、以支撑文件为准"，而两处实际互斥（详见 §2 N1） |
| **H3** 决策计数 23/26/27 互斥 | **已闭合** | `decision-log.md:现行结论` 尾注「**现行决策 28 条**（D-001 ~ D-028，**含收口元决策 D-028**…）」；`decision-log.md:Talk 记录/T-011`「**28 条决策全部获得用户最终确认**（D-001 ~ D-028…）」；`decision-log.md:承接与不承接清单/给其他卡的输入注入义务`「本卡的 **28 条决策**（D-001 ~ D-028，含收口元决策）」；`research/module-ledger.md:总览`「已定决策｜**28**（D-001 ~ D-028…）」。四处已统一 | — |
| **H4** 现行结论未收录 D-024~D-026 | **已闭合** | `decision-log.md:现行结论` 结论表实测 **28 行，D-001~D-028 无缺无重**（复核脚本：`现行结论 rows: 28 … missing: [] extra: []`），含「`\| D-024 \| 「重建 → 揭示 → 挑战」写成硬约束…`」「`\| D-025 \| 变化角度由 agent 先生成并记录…`」「`\| D-026 \| 「未收敛选项空间」写进 objective_facts…`」；尾注列明取代/修正关系 | — |
| **H5** 完成判据互斥（19 条全闭 vs deferred 允许） | **已闭合** | `decision-log.md:唯一 OI 大纲/OI-003` acceptance「本卡 OI 大纲 **OI 无 open（deferred 允许；deferred 项的 owner/trigger 见 OI 记录）**…（**已被修正**：原文写「19 条全部闭合」…）」；`decision-log.md:决策/D-016` 风险缓解「以「**OI 无 open（deferred 允许…）** + 覆盖矩阵完整分母」为可核对代理」；`decision-log.md:收敛检查` 验收「且 OI 无 open（deferred 允许）」；`OI 状态汇总`「`\| open \| **0** \|`」；`module-ledger.md:总览`「OI 收盘｜✅ **已完成**（17 confirmed + 2 deferred；**OI 无 open**…）」 | — |
| **H6** OI-016 自述不可延期却 deferred + trigger 两处不同 | **已闭合** | `decision-log.md:唯一 OI 大纲/OI-016` question 改写为「…母 PRD 将其定为实现依赖；本卡保留 `deferred` 是因为解析器的状态词表没有「必须先于下一阶段完成」这一值，**实际约束以 trigger 为准**」，`trigger: build-plan 前（不晚于 build-code）`；`decision-log.md:审查事实与处置/未闭合项` #5「**触发统一为 build-plan 前（不晚于 build-code），以本条为准**」；`三档结论` 同口径 | 残留（不改变判定）：该 question 系**原地改写**且未加「已被 X 修正」标注（见 §2 N6）；`direction-review-findings-disposition.md:G18` 仍写「触发=build-code 前必须冻结」，材料只就 detail 文件作了"无数字冲突"说明 |
| **H7** D-011 与 D-025 角度提供者互斥 | **已闭合** | `decision-log.md:决策/D-011` 第 1 条下「**（已被 D-025 修正，原文保留）** 变化角度改由 **agent 先生成并记录**…**不再要求在发散前与用户确认角度**」；`OI-007.selected_disposition`「**角度提供者已按 D-025 修正**…」；`现行结论` 尾注「**D-011 第 1 条已由 D-025 修正**」 | — |
| **H8** V-013 列在「逐字原文」列却为改写 | **已闭合** | `decision-log.md:逐字声明层` V-013 行说出者列改为「**【重述，非逐字】**」，正文「指针：真实逐字见 **V-001**（U-001 全文）。此行是 agent 的重述，**不参与逐字保真核对**」；`三档结论` FR-35 行「**阶段内已修 H8**…故 AC-35 的失败场景不再成立」 | — |
| **H9** 自定"只追加不修改"却发生原地改写 | **部分闭合** | `decision-log.md:逐字声明层` 新增例外「**例外（D-020 口径，写清以免再次互斥）**：**视图/状态列的实时刷新**（模块台账状态列、OI 状态汇总计数）**不属于本层的「正文条目」**，可直接更新；**决策正文与逐字条目的改动**一律按 D-020 在原地加「已被 X 修正/取代」标注」——覆盖了模块台账状态列（G2） | 例外只覆盖「视图/状态列」，但 G7 的两处原地改写在**逐字条目本身**：V-011/V-012 行被就地改标「**【索引，非逐字】**」，**没有任何「已被 X 修正/取代」标注**——恰好落在新规则要求加标注的那一类里。即规则与 V-011/V-012 现状仍不自洽 |
| **H10** 23 条待裁决未进入未闭合披露且状态过期 | **部分闭合** | 新增 `decision-log.md:审查事实与处置/覆盖矩阵的 23 条「待裁决」单元（单列披露）`：明确「该集合此前**从未进入任何未闭合披露**…现逐类归位」，表内「`\| **MOD-M9** \| ✅ **已闭合** \|`」「`\| **ML-06** \| ✅ **已闭合** \|`」「`\| **ML-07** \| ✅ **已闭合** \|`」「`\| 其余 **20** 条（23 − 3） \| **仍未裁决** \| **owner = 本卡，触发 = build-plan 前** \|`」，并点名 U-22、A-046 | 残**1 处两处互斥未消**：`decision-log.md:原始需求覆盖矩阵/逐单元处置汇总` 仍报「`\| 待裁决 \| **23** \|`」，且该表**无指针**通向上面那节披露；读者只看汇总表会得到与"3 已闭 + 20 待裁决"不同的数字（详见 §2 N5） |
| **H11** 第三轮 32 vs blocking 3 vs 原件 37 | **已闭合** | `decision-log.md:审查事实与处置/轮次与 findings（真实数字）` 轮次表第三轮「`15（3 blocking / 10 major / 2 minor）`｜`17（2 blocking / 11 major / 4 minor）`｜**32**｜**5**」；新增「**计数口径（写死，解决「条数不可由原件复算」）**」1–4；「**计数勘误（只写真实发生过的错误）**：第三轮 blocking 曾写成 3 条…实际为 **5** 条…**已改**」；合计行「`\| **合计** \| — \| — \| — \| — \| **48** \| **60** \| **108** \| **20** \|`」。计数本身经独立复算**逐格准确** | 残留（不改变"H11 已闭合"判定）：口径说明第 3 条含**失实断言**——「本卡 4 轮原件里**没有该字段**」与「§9 提到的「第三轮 37」**无原件依据**」，与原件实际情况相反（见 §2 N2） |
| **M1** 四份未闭合披露互不一致 | **部分闭合** | `decision-log.md:审查事实与处置/未闭合项` 已补入原缺项：#1 G15 细则、#2 G14 79 条、#6 G12、#7 G13、#8 G11、#9 G17、#10 G20，并在 #4 明写「**G9 / G10 / G18 已由 D-024 / D-025 / D-026 收口**…**本节不再把它们列为未闭合**」；`module-ledger.md:官方步骤进度` 已改为 step 10「✅ **已完成**」、step 11「✅ **已完成**」（原为"已派发/⏳"） | 四份披露**条数仍不一致**：decision-log `未闭合项` 12 条编号（其中真 open 9）、`module-ledger.md:未闭合项` 13 行（自称"10 项仍在"）、detail 清单 9 行、direction 清单 6 条。`module-ledger.md` 却断言「**口径与 `decision-log.md` …一致**」；且 module-ledger #5（含 `OI-018`）与 #10（`新形态生效时点（OI-018）`）**重复计同一项**，故"10 项"实为 9 项（详见 §2 N3） |
| **M2** D-026 声称三处统一但三处均未写 | **已闭合** | `decision-log.md:拟议方向/范围（in）` in-10 加「**送审承载（M2 补）**：未收敛选项空间以 `objective_facts` **自由文本**承载；`convergence_outline` 仍按 **questions-only** 提交（见 **D-026**）」；`决策/D-002` 风险下「**（M2 补）送审承载**：…」；`OI-013.acceptance` 尾部「**未收敛选项空间以 objective_facts 自由文本承载、convergence_outline 仍按 questions-only 提交（见 D-026）**」 | — |
| **M3** 三档结论 2 对逐字重复行 | **已闭合** | `decision-log.md:三档结论` 表头注「**表头注（M3）**：本表**已合并重复行**…**合并前 23 行 → 合并后 21 行**；再追加主会话执行模型（D-028）一行后为 **22 行**」；表体实测 **22 数据行**；`module-ledger.md:官方步骤进度` step 9「三档结论 **22 条**（原 23 条，已按 M3 合并 2 对重复行、并追加 D-028 行）」 | — |
| **M4** 原子台账两处状态相反 | **已闭合** | `decision-log.md:三档结论`「原子台账成本实测…｜未承接｜**最小范围论证已由 D-021 闭合**；**成本实测仍为未承接**」；`审查事实与处置/未闭合项` #3「~~原子台账的最小范围论证未做~~ —— **已被取代**：**D-021** 已闭合…；**成本实测仍为未承接**（owner = 本卡，触发 = build-plan 前）…三档结论、`research/module-ledger.md` 与本节同此口径」；`module-ledger.md:未闭合项` #2「✅ **已闭**（**D-021**）；**成本实测仍未承接**，见 #9」、#9 同口径 | — |
| **M5** OI-005 只答一项 | **已闭合** | `decision-log.md:唯一 OI 大纲/OI-005` disposition 补「**另外三项的落点（D-014 第 1/2/3 条）**：①台账宿主＝decision-log 的模块台账小节；②被推翻的假设必须在同一次呈现里单独列出；③每轮只回显模块级」；evidence 追加「D-014 第 1/2/3 条（另外三项的落点）」 | — |
| **M6** D-016 交叉引用张冠李戴 | **已闭合** | `decision-log.md:决策/D-016` 第 1 条下「**（已被修正，原文保留）** 上句的交叉引用张冠李戴：**D-014 的真实三条**是「①台账宿主 = `decision-log.md` 的模块台账小节；②被推翻的假设必须在同一次呈现里列出；③每轮只回显模块级」；而「需求有着落 / 无待复核 / 用户看过放弃清单」…出处是 **D-023** 与 **D-020**」；`现行结论` 尾注同口径 | — |
| **M7** 未提交引用披露未落盘 | **已闭合** | `decision-log.md:审查事实与处置/未提交引用不得作为验收事实（单列披露）`「…`research/` 下的支撑文件（`coverage-matrix.md`、…、`stage-end-spec-analyze.md`、解析器输出等）**未随审查提交**，故**其内容不构成审查已验证事实**…**不得作为验收依据**」；`收敛检查` 表下注「**数据来源列的 `research/…` 为未送审支撑文件**…**不构成审查已验证事实**」 | — |
| **M8** 现行结论结构破损 / T-010/T-011 插入 | **已闭合** | `decision-log.md:现行结论` 节首引句完整：「…其修正/取代标注写在**决策小节**（本文件后面的「决策」节，即 `## 决策` 之下的各条目）里，被取代的在那里标注；…」；全文 **H2 标题实测 19 个、无畸形标题**（原「## 决策\`，被取代的在那里标注。」已消失）；`T-010`/`T-011` 现位于 `## Talk 记录`（H3 级 `### T-010`/`### T-011`），`## 现行结论` 与 28 行结论表连续无插入 | — |
| **L1** 收敛检查列不可执行验收 | **已闭合** | `decision-log.md:收敛检查` 验收行末「**本阶段仅定义；执行归 build-code（D-018）。**」 | — |
| **L2** FR-34 取消 500 字上限未进决策正文 | **已闭合** | `decision-log.md:决策/D-015` 第 1 条「…全文落盘、按需展开（FR-34 三件套保留）。**并取消 500 字回传上限（技能文本层）** —— L2 补：该要求此前只写在 M3 模块描述里，**未进任何决策正文**，现落进本条」 | — |
| **L3** D-002 引用未验证 provider 失败史 | **已闭合** | `decision-log.md:决策/D-002` 风险下「**（已被修正 / 补充，原文保留）** 上述 provider 失败史**在本卡 4 轮原件中未复现**；该历史断言**无本卡锚点**，**仅作提示**，不作为本卡的审查事实」 | — |

**计数：已闭合 17 / 部分闭合 4（H1、H9、H10、M1）/ 未闭合 1（H2）。**

## 2. 反向核查：新增矛盾清单

### N1（HIGH，修补引入）U-002-17/18 的处置被"改反"，与权威支撑文件互斥

- A 处（材料）：`decision-log.md:原始需求覆盖矩阵`「`\| U-002 最小需求单元 \| 24 \| **22 covered + 2 accepted_omission** \|`」；「**U-002 行口径（H2 修正，两处数字可互推）**…（原表把 24 条一律写作 `covered`，与 `research/coverage-matrix.md` 把该 2 条列为「交其他卡」互斥，已按矩阵口径修正）…两处的对应关系以该支撑文件为准」；`决策/D-028` 后果节重复「改为 **22 covered + 2 accepted_omission**…两处数字可互推」。
- B 处（被引为权威的支撑文件，**未被修改，mtime 08:01 早于修补**）：`research/coverage-matrix.md:§1 逐单元处置`「`\| U-002-17 \| … \| M2/AX04 \| 本卡承接 \| 主会话执行模型，落 M2；「派发方法」分量归 CARD-03（C-010） \|`」「`\| U-002-18 \| … \| 本卡承接 \| 落 M2；其材料层兑现物=D-004 分层 \|`」；`§5.1` 算术「`G06 U-002  24 = 已分配 24（本卡承接 24 + 0 + 0） + 待裁决 0 + 未处置 0`」；`§4.3` 的 CARD-03 汇总行里 U-002-17/18 只出现在"**需注入的输入**"列，**不在"行 ID"列**（该行 12 个行 ID 为 `E-025, E-027, I1-M09, I1-C09, I1-O-18, U-14, U-37, U-38, U-40, U-52, U-56, G24-15`）。
- 性质：把"注入内容"误读成"处置=交其他卡"。原报告 §3 C10 的措辞本就含这层歧义（"把…列为向 CARD-03 注入项（即交其他卡）"），修补者**照抄了这个歧义并写进材料**，从而：①材料与它自己声明"以之为准"的支撑文件互斥；②材料内部 `三档结论` 同一单元档位=`接受`、而 `覆盖矩阵` 记为 `accepted_omission`（交其他卡），两表互斥；③`383 / 96` 的"未重算"声明无法自洽（矩阵把该 2 条计入 `本卡承接 383`，材料却把 2 条记入 `交其他卡 96`）。
- 这正是项目历史上"同一材料内两表互斥、机器零报警"的同型事件——且**位于材料自称已修 H2 的位置**。契约解析器对此**零报警**（§4 全绿/仅 proof 错误），可作为"机器挡不住这类错误"的又一实证。

### N2（MEDIUM，修补引入）关于审查原件的失实断言

- `decision-log.md:审查事实与处置/计数口径` 第 3 条：「**不使用任何「adjudicated cluster」类数字**：本卡 4 轮原件里**没有该字段**；`research/stage-end-spec-analyze.md` §9 提到的「第三轮 37」**无原件依据，禁止采用**。」
- 原件实测（§3）：7 份 `results/*.json` **全部**含 `adjudication`，其下有 `clusters` 数组；第三轮 `bd7a6a63` 的 cluster 数 = red **19** + blue **18** = **37**。即"37"**有**原件依据，字段**存在**。
- 影响：材料自选的 `findings.length` 口径本身合法且数字全部准确（§3），但"用一条关于原件的失实陈述去否定另一种口径"违反 `D-007`「本卡采用机器逐行核实的计数」的自定纪律，属**证据层面的失实断言**，须改为"本卡选用 `findings` 数组长度口径（另一种可用口径是 `adjudication.clusters`，两者数值不同，本卡不采用后者）"。

### N3（MEDIUM，残留+新计数错）四份未闭合披露仍不同数；module-ledger "10 项"重复计 OI-018

- `research/module-ledger.md:未闭合项` 计数行：「**计数**：13 行中 **3 行已闭**…**10 项仍在**（#4~#10 共 7 项 deferred/未承接 + #11~#13 共 3 项 accepted_risk）。口径与 `decision-log.md` 的 `## 审查事实与处置 / 未闭合项` 一致」。
- 但同表 #5 =「**三个前置冻结**（CARD-04 写面 / card-02 结构生效时点 / 决策归属）（G16、**OI-018**）」，#10 =「**新形态生效时点**（**OI-018**）」——`OI-018` 被计两次，故"10 项"实为 **9 项**；而 `decision-log.md:未闭合项` 的真 open 恰为 9 项（G15 细则、G14、成本实测、G16、G12、G13、G11、G17、G20，其中 OI-018 含在 #5 关联项内）。
- 四份披露行数实测：decision-log 12 条编号 / module-ledger 13 行 / `detail-review-findings-disposition.md:未闭合项` **9 行**（含 #1/#2/#3 仍标 `step 11` 未闭，而材料已判定 G9/G10/G18 收口）/ `direction-review-findings-disposition.md:未闭合项` **6 条**（含「G9 未做」「G18 三个前置冻结…build-code 前必须完成」，均已过期）。"口径一致"属**断言而非事实**；且材料只就 detail 的 G16 一处写了"支撑文件未落改"的冲突说明，未说明 detail #1–#3、direction 全文的过期状态。

### N4（LOW–MEDIUM，修补引入/同源）module-ledger 称"两个官方解析器全绿"与材料正文冲突

- `research/module-ledger.md:官方步骤进度` step 9：「✅ **完成**：…·**两个官方解析器全绿**」。
- `decision-log.md:审查事实与处置/材料契约自检`：「`analyzeDecisionOutline`｜`structure` / `direction_snapshot` / `no_open_items` / `terminal_fields` = **passed**；**非 proof 类错误 0**」，并明确「`interaction_proof = missing` 与 17 条 `core interaction proof is unavailable` 属**预期项**」。
- 独立实跑（§4）：`analyzeDecisionOutline ok=false, errors.length=17`。故"全绿"是**视图对权威的过度美化**（若"全绿"指非 proof 类，应写明口径）。与项目"不得把 unknown/unavailable 伪造成通过"的纪律相抵。

### N5（LOW–MEDIUM，残留）H10 的"23"未在汇总表就地刷新或加指针

- `decision-log.md:原始需求覆盖矩阵/逐单元处置汇总` 仍「`\| 待裁决 \| **23** \|`」「**验算**：…`492 + 23 + 0 = 515` ✓」；刷新结论（3 已闭 + 20 待裁决）在**另一节** `### 覆盖矩阵的 23 条「待裁决」单元（单列披露）`，两处相隔约 350 行，汇总表**无指针**。同一集合在同文件内给出 23 与（3+20）两种数字，读者需自行拼接。建议在汇总行加「（其中 3 条已闭合，见下节单列披露）」。

### N6（LOW，修补引入）append-only 标注对该加标注的两类改动未覆盖

- 新增规则（`decision-log.md:逐字声明层` 例外条）：「**决策正文与逐字条目的改动**一律按 D-020 在原地加「已被 X 修正/取代」标注」。
- 但：①`OI-016.question` 被就地改写（删去「故不是可延期项」原文）而**无任何"已被修正"标注**；②`V-011`/`V-012` 两**逐字条目**被就地改标「**【索引，非逐字】**」而**无「已被 X 修正/取代」标注**（见 H9）。两处都落在新规则明文要求加标注的范围内。D-011/D-002/D-016/D-027 四处标注自洽，但这两处不覆盖。

### N7（LOW，**非**修补引入，先前即存在）`拟议方向` 的确认状态已过期

- `decision-log.md:拟议方向` 标题仍写「…**待用户确认**」，节内仍写「**用户尚未确认**；方向讨论（talk-r2）之后，现行版本以「收敛检查」节的 `target/scope/solution` 行为准」。
- 而 `Talk 记录/T-011`「用户答复（逐字）：「**都不改，收口**」…本阶段方向成立」、`现行结论` 28 条全 `生效`。该节虽自声明"以收敛检查为准"，但"用户尚未确认"与 T-011 直接互斥。**属修补前既存、原报告未列**，此处一并披露（不计入 22 条判定）。

### 反向核查的"未发现"项（明确写"未发现"，不凑数）

- **决策计数**：未发现残留的 23/26/27 与 28 并存（26 的两次出现都带"已被 D-028 修正"标注）。
- **findings/blocking 计数**：decision-log 与 module-ledger 两处均为 108 / 20，**未发现**互斥；逐 role 分布逐格准确。
- **三档结论行数**：decision-log 实测 22 行、module-ledger 写 22 行，**未发现**不一致。
- **OI 状态计数**：`open 0 / confirmed 17 / deferred 2` 在 OI-003、D-016、收敛检查、OI 状态汇总、module-ledger 五处**未发现**互斥。
- **模块状态**：需求大纲 v1 12 行皆「已定」、module-ledger「12/12 全部有结论」，**未发现**互斥。
- **现行结论覆盖**：D-001~D-028 齐、无多无缺，**未发现**漏收录（脚本复核）。
- **移动残骸**：`## 现行结论` 与 `## Talk 记录` 之间**未发现**孤立片段/畸形标题/被切断引句；T-010/T-011 位置正确。
- **新引用目标存在性**：D-028→`## 承接与不承接清单` CARD-03 注入义务（存在）、D-028→`research/stage-end-spec-analyze.md §9 H1/H2`（存在）、D-024/025/026→detail `G9/G10/G18`（存在）、module-ledger #11→decision-log 单列披露（存在）、未闭合项 #1→detail `R18/B03`（存在）。**未发现**悬空引用。
- **append-only 四处标注**（D-002/D-011/D-016/D-027）：**未发现**正文与新标注互相否定到无法判断现行口径的情形（D-011 主句与 D-025 并存时，子条与尾注均可判现行）。

## 3. findings 计数独立复算

**方法**：直接解析仓外 `.../quality/reviews/results/*.json`（7 份），对每份读 `findings` 数组长度与其 `severity` 分布，并同时读 `adjudication.clusters` 长度与分布作为对照；按 `pair_id` / `role` 归轮（第 2 轮 red 无 result，仅 `attempts/83ad29b3…`）。

| 轮次（pair） | 轨道 | role | 文件（前 8 位） | `findings` 长度 | `findings` severity | `adjudication.clusters` 长度 | `clusters` severity |
|---|---|---|---|---|---|---|---|
| 1 direction（`7c6c6231`） | direction | red | `93950203` | **14** | 4 blocking / 8 major / 2 minor | 15 | 4 blocking / 9 major / 2 minor |
| 1 direction（`7c6c6231`） | direction | blue | `b5925436` | **16** | 5 blocking / 11 major | 16 | 5 blocking / 11 major |
| 2 direction（`bbe6a827`） | direction | red | （无 result） | **0** | — | — | — |
| 2 direction（`bbe6a827`） | direction | blue | `2b680e7f` | **13** | 1 blocking / 10 major / 2 minor | 13 | 1 blocking / 10 major / 2 minor |
| 3 direction（`bd7a6a63`） | direction | red | `eebc4bca` | **15** | 3 blocking / 10 major / 2 minor | 19 | 4 blocking / 13 major / 2 minor |
| 3 direction（`bd7a6a63`） | direction | blue | `922967cc` | **17** | 2 blocking / 11 major / 4 minor | 18 | 2 blocking / 12 major / 4 minor |
| 4 detail（`8605366f`） | detail | red | `99e85c3f` | **19** | 1 blocking / 16 major / 2 minor | 19 | 1 blocking / 16 major / 2 minor |
| 4 detail（`8605366f`） | detail | blue | `367359be` | **14** | 4 blocking / 8 major / 2 minor | 14 | 4 blocking / 8 major / 2 minor |
| **合计** | — | — | — | **108** | **20 blocking**（48 red + 60 blue） | **114** | **21 blocking** |

**与材料轮次表逐格对照**：

| 材料声明（`decision-log.md:轮次与 findings`） | 复算结果 | 一致？ |
|---|---|---|
| 第 1 轮 red 14（4/8/2）、blue 16（5/11）、合计 **30**、blocking **9** | 14 + 16 = 30；blocking 4+5 = 9；per-role 分布逐格吻合 | **一致** |
| 第 2 轮 red「—（red 无结果）」、blue 13（1/10/2）、合计 **13**、blocking **1** | 13；blocking 1；red 确无 result 文件 | **一致** |
| 第 3 轮 red 15（3/10/2）、blue 17（2/11/4）、合计 **32**、blocking **5** | 15 + 17 = 32；blocking 3+2 = 5；per-role 分布逐格吻合 | **一致** |
| 第 4 轮 red 19（1/16/2）、blue 14（4/8/2）、合计 **33**、blocking **5** | 19 + 14 = 33；blocking 1+4 = 5；per-role 分布逐格吻合 | **一致** |
| 合计 **108**、blocking 合计 **20**；`30+13+32+33 = 108`、`9+1+5+5 = 20` | 108 / 20，逐格自验成立 | **一致** |
| 口径第 3 条「原件里**没有**该字段」「第三轮 37 **无原件依据**」 | 7/7 份含 `adjudication.clusters`；第三轮 19+18 = **37** | **不一致（失实，N2）** |

**结论**：材料采用的 `findings` 数组长度口径下，**轮次表所有数字（含 108 / 20 与每一格的 severity 分布）逐格准确**，可复算、可自验；**唯一不准的是"原件没有该字段 / 37 无依据"这一句关于原件的事实断言**。另注：若改用 `adjudication.clusters` 口径，四轮为 114 / 21 blocking——两个口径都真实存在，材料须披露而非否认后者。

## 4. 契约复验输出原文

命令（在 `/Users/Hugh/Hugh/Project/workflowhub` 下只读实跑，目标为 worktree 的 `decision-log.md`）：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub && node -e "
import('./runtime/stage/stage-content-contracts.mjs').then(m=>{
  const fs=require('fs');
  const p='/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919/specs/workflowhub-thin-core-card-07-20260919/decision-log.md';
  const md=fs.readFileSync(p,'utf8');
  console.log('taskType =', m.readTaskTypeFromDecisionLog(md));
  const o=m.analyzeDecisionOutline(md,{taskId:'workflowhub-thin-core-card-07-20260919'});
  console.log('outline components =', JSON.stringify(o.components));
  console.log('outline non-proof errors =', o.errors.filter(e=>!/core interaction proof is unavailable/.test(e)).length);
  o.errors.filter(e=>!/core interaction proof is unavailable/.test(e)).forEach(e=>console.log('  -',e));
  const c=m.analyzeDecisionConvergence(md,{taskId:'workflowhub-thin-core-card-07-20260919'});
  console.log('convergence ok =', c.ok, '| errors =', c.errors.length);
  c.errors.forEach(e=>console.log('  -',e));
});"
```

输出原文：

```
taskType = 普通任务
outline components = {"structure":"passed","direction_snapshot":"passed","no_open_items":"passed","terminal_fields":"passed","interaction_proof":"missing"}
outline non-proof errors = 0
convergence ok = true | errors = 0
```

补充实跑（同文件，补齐总错误数）：`outline ok = false | errors.length = 17`；`conv ok = true | errors.length = 0`。

**对照**：材料自检表 `decision-log.md:审查事实与处置/材料契约自检` 声称「`readTaskTypeFromDecisionLog`｜`普通任务`」「`analyzeDecisionOutline`｜`structure`/`direction_snapshot`/`no_open_items`/`terminal_fields` = **passed**；非 proof 类错误 **0**」「`analyzeDecisionConvergence`｜**ok = true，errors = 0**」，并把 17 条 proof 缺失披露为预期项——**与实跑逐格一致**（`ok=false` 未被写成通过）。契约层**未发现**材料美化；但如 §2 N4，`module-ledger.md` 的"两个官方解析器全绿"是对该结果的过度概括。

## 5. 新 gap 清单

> 标注 `[修补引入]` / `[先存，原报告未列]`。G12/G13/G15/G16 与卡面「可后置技术项」按授权**不计为 gap**，本节不含它们。

| # | 严重性 | 位置 | 问题 | 建议修法 |
|---|---|---|---|---|
| **N1** | **HIGH** | `decision-log.md:原始需求覆盖矩阵`（U-002 行 + 行口径注）／`决策/D-028` 后果节 vs `research/coverage-matrix.md:§1 U-002-17/18 行`、`§5.1 G06` | `[修补引入]` 为修 H2 把 U-002-17/18 改为 `accepted_omission`（交其他卡），并称支撑文件如此；支撑文件实为 `本卡承接 24 / 交其他卡 0`。材料↔支撑文件、材料内覆盖矩阵↔三档结论（档位 `接受`）、`383/96`"未重算"声明三处因此互斥（§2 N1） | 改回「`24 covered`（本卡承接）」，把"CARD-03 的派发方法分量"作为**注入义务**单列（与 `承接与不承接清单` 一致）；若坚持拆 2 条，则必须同步修正 `coverage-matrix.md` 的 §1 与 §5.1（该文件授权范围需先确认），否则不得声称"以支撑文件为准" |
| **N2** | MEDIUM | `decision-log.md:审查事实与处置/计数口径` 第 3 条 | `[修补引入]` 失实断言：称原件"没有 adjudicated cluster 字段"、第三轮 37"无原件依据"；实测 7/7 份含 `adjudication.clusters`，第三轮 19+18=37（§3） | 改为如实并列两种口径（`findings.length` → 108/20；`adjudication.clusters` → 114/21），声明本卡采用前者及理由；删去"没有该字段/无原件依据" |
| **N3** | MEDIUM | `research/module-ledger.md:未闭合项` 计数行 + #5/#10；与四份披露 | `[修补引入+残留]` "10 项仍在"把 `OI-018` 在 #5 与 #10 各计一次（实为 9 项）；仍断言"口径与 decision-log 一致"，而四份披露行数为 12/13/9/6，detail #1–#3 与 direction 全文已过期（§2 N3） | 合并 #5/#10 或把 #10 改为 #5 的子项；把"一致"改为"以 decision-log 为准，detail/direction 支撑文件未授权修改、其过期条目见下"；对 detail `未闭合项` #1–#3、direction `未闭合项` 全文补一条统一过期说明 |
| **N4** | LOW–MEDIUM | `research/module-ledger.md:官方步骤进度` step 9 | `[修补引入/同源]` "两个官方解析器全绿"与 `decision-log.md` 的"非 proof 类错误 0 / `interaction_proof = missing`"及实跑 `ok=false, errors=17` 冲突（§4） | 改为"`convergence` 解析器通过；`outline` 结构/direction/no_open/terminal 四项通过，17 条 proof 缺失为预期（D-019）" |
| **N5** | LOW–MEDIUM | `decision-log.md:原始需求覆盖矩阵/逐单元处置汇总` | `[残留]` 仍报 `待裁决 23`，与同文件"3 已闭 + 20 待裁决"并存且无指针（§2 N5） | 汇总行加「（其中 MOD-M9/ML-06/ML-07 已闭合，见下节单列披露；其余 20 仍待裁决）」或直接改为 `20`（并同步 `coverage-matrix.md` 口径说明） |
| **N6** | LOW | `decision-log.md:唯一 OI 大纲/OI-016.question`；`逐字声明层` V-011/V-012 行 | `[修补引入]` 新例外条要求"决策正文与逐字条目的改动"加「已被 X 修正/取代」标注，但 OI-016 question 被原地改写、V-011/V-012 被原地改标，**均无该标注**（§2 N6、H9 残留） | 给 OI-016 question 加「（原文写「不是可延期项」，已按 H6 修正，原文保留）」；给 V-011/V-012 加「（原被误列为逐字，已按 G7 修正）」或把例外条扩写为"索引/状态类非正文条目的就地纠正除外" |
| **N7** | LOW | `decision-log.md:拟议方向` 标题与节首 | `[先存，原报告未列]` "**待用户确认**"／"**用户尚未确认**"与 `T-011`「都不改，收口」及 `现行结论` 全"生效"互斥（§2 N7） | 标题去"待用户确认"，节首改为"本版为 v2 快照，方向已由 T-011 确认，现行口径见 `## 收敛检查`" |

## 6. 方法局限

1. **无修补前快照，M3 的"合并未丢信息"不能独立 diff 验证**。该 worktree 的 `specs/**` 未纳入 git（`git status` 显示 `?? specs/workflowhub-thin-core-card-07-20260919/`），全盘搜索也**未找到**本任务修补前的 `decision-log.md` 副本。M3 的"内容未丢失"仅有**原报告 §4 的旁证**（该报告把两对行描述为"内容/档位/为什么/落点决策几乎逐字相同"，且说"几乎"而非"逐字"）；严格地说，被删两行若存在细微差异，**无法排除**丢失。保留行保留了非空"改了什么/为什么"并加了并入说明，风险低但未获证。
2. **N1 的"权威"判定依赖材料自定口径**。我按 `decision-log.md` 自己的声明（"383/13/96/23/515 仍为 `research/coverage-matrix.md` 的逐行机器核实值""两处的对应关系以该支撑文件为准"）把 coverage-matrix 视为权威；若作者改口称 coverage-matrix 的是旧口径、材料新口径才是意图，则 N1 的性质从"材料错"变为"未同步支撑文件"——但无论哪种，**当前两处互斥**这一事实不变，且 `coverage-matrix.md` 不在本卡允许修改清单内（材料自陈），所以仍需在材料侧处置。
3. **findings 计数只复算了 `results/*.json`**，未逐条读 `reports/*.md` 的正文；`adjudication.clusters` 的口径含义（去重规则）我按字段存在与数值复算，未去核对其合并算法。第 2 轮 red 确无 result 文件（仅 `attempts/83ad29b3…`），与材料"red 无结果"一致。
4. **未跑任何测试、未重放 review**；契约复验只在原型解析器函数上实跑（read-only），未走完整 stage publication。
5. **`research/coverage-matrix.md`（965 行）未逐行复核**，只核了 §1 的 U-002-17/18 行、§4.3 汇总行的行 ID 列表、§5.1 的 G06 算术与全文 `交其他卡`/`U-002-17` 命中位置。
6. **未读取 card-02 兄弟 worktree 材料**，故"79 条""三个 revision"等仍按材料自陈处理。
7. **未修改任何被检查文件**；本报告是本次唯一新增文件。行号仅用于本报告内部定位（材料纪律要求不使用行号锚点）。
