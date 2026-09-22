# direction 审查 findings 逐条处置（三轮合并）

> **来源**：官方 `review --action=record`（`review_track=direction`），配置 provider = `kimi/coding` / `antigravity/flash` / `codex/luna`。
> **处置纪律**：每条 finding 必须落一档 —— `fixed`（已改材料并给出改了什么）/ `rejected_with_reason`（附理由与依据）/ `accepted_risk`（接受并登记风险与 owner）/ `deferred`（附 owner 与触发条件）。**不允许空处置**。
> **本文件是过程层证据**，材料内只放汇总与指针（D-004）。

## 三轮的真实执行事实（不掩盖）

| 轮次 | 时间序 | result | red | blue | partial | 备注 |
|---|---|---|---|---|---|---|
| 1 | 首次 | 30 findings | `available` | `available` | false | **送审包有我的 bug**：`convergence_outline` 17 条字段全 null；raw 里 U-002/U-003 重复。相关内容作废 |
| 2 | 修 outline 后 | 13 findings | **`unavailable`**（`kimi/coding`+`antigravity/flash` = `PROVIDER_RESULT_INVALID`；`codex/luna` = `REVIEW_WAIT_EXCEEDED`，20 分钟超时，**broker 未取消**） | `available` | **true** | red 侧无结果，如实记录 |
| 3 | 修全部材料后 | **32 findings** | **`available`** `coverage=satisfied` | **`available`** `coverage=satisfied` | **false** | **本轮为唯一干净轮** |

`retry` 三次均按 `basis=material_changed` 被 admit（第二轮为 outline 填充，第三轮为方向陈述 + OI 修订）。

## 处置分组（32 条 → 18 组）

| 组 | 内容 | 处置 | 改了什么 / 理由 |
|---|---|---|---|
| **G1** | **方向里没有发散生成机制**（本卡核心交付物缺失） | `fixed`（方向层）+ `deferred`（机制层） | 拟议方向 v2 新增「范围 in-4 发散生成与 G-4」并**显式登记 v1 的缺口**；具体机制挂 **OI-007**，在逐模块讨论中定 |
| **G2** | **痛点澄清被排在调研之后**（倒置，违背 U-002 核心） | `fixed` | v2 映射表把痛点澄清放回 **step 3（先于 research）** |
| **G2b** | 「大纲先行」只问 HOW 未问 WHETHER | `fixed` | **D-009**（大纲=可证伪假设）+ **OI-005** 明确承载 WHETHER |
| **G3** | 映射表**固化 talk-r1/r2/r3 固定轮次**，与 FR-36 冲突、过不了 AC-36 | `fixed` | v2 加「14 步只作里程碑对齐框架，不是交互节奏」纪律；轮次由未决 OI 动态触发 |
| **G3b** | talk-r2 同时承载「定方向」与「逐模块讨论」 | `fixed` | v2 把逐模块讨论移出 talk-r2，改为「大纲定稿后由 OI 动态触发」 |
| **G4** | **台账宿主未声明**（撞「不新增第五份材料」） | `fixed`（方向层） | v2 范围 in-11 明确：不新增材料，宿主落现有四份材料内或 `research/` + 材料内指针 |
| **G5** | 交互主会话回显全量原子矩阵会**污染上下文** | `fixed` | v2 范围 in-11：主会话**只回显高层模块状态与本轮决策项** |
| **G6** | **79 条不在分母内**却宣称「完整分母」= 历史假绿同型 | `fixed`（方向层）+ `deferred`（执行） | v2 范围 in-8 要求**唯一来源分母 + 稳定 ID + 唯一处置 + 汇总由逐条记录机器推导**；79 条的逐条处置待补（owner=本卡，触发=build-plan 前） |
| **G7** | **OI 计数 17 vs 18 不自洽**、OI 顺序非单调 | `fixed` | OI 记录已按编号重排为单调；**现为 19 条**；材料内计数同步为 19 |
| **G7b** | 18 条 OI 中**无任何条目承载** Talk 零问题轮次 vs `round_count=3/4` 的合同冲突 | `fixed` | 新增 **OI-019** 承载该冲突（裁决方 / 以哪侧为准 / round_count 替代 / 零问题轮次处置） |
| **G8** | **v2 之前材料自相矛盾**：范围条 9 说「正式审查仍在官方位置」，映射表却把它前移 | `fixed` | v2 统一表述：正式 step 6 **前移**（D-002），并**如实登记为与 manifest 顺序的偏差**；同时明确「候选生成」与「正式挑战」是两件不同的事 |
| **G9** | 原子级台账 + 独立上下文核对**缺最小范围论证**，与已删「需求账本」同型 | `accepted_risk` + 挂 OI-011 | v2 机制 2 显式标注该未决论证：需说明哪些痛点必须原子级、与既有 3 套校验器及 OI-011 裁决的关系。**owner=本卡，触发=逐模块讨论 M8** |
| **G10** | 校验器「只查 ID 存在性」**不足以满足 FR-35 的原话变更检测** | `fixed` | v2 机制 2 改为「绑定逐字内容，使原话被改动时机器可检出并触发待复核」 |
| **G11** | 映射表**无法表达 G-4 回边** | `fixed` | v2 映射表新增 **G-4 条件回边**行（复用既有 step、不新增 step） |
| **G12** | 方向只写了**外部**调研，缺**内部**调研（U-002 明确要求两者） | `fixed` | v2 范围 in-3 明确「外部 + 内部，分别取证、分别落盘」；映射 step 4 同步 |
| **G13** | **OI-016 / OI-012 是不可延期前置**却被当 open 挂起 | `fixed` | **D-010**（只定结构差异）+ OI-016 改归 `data_state` 并写明「母 PRD 定为实现依赖，故不是可延期项」；OI-018 单独承载真正该延期的「生效时点」 |
| **G14** | OI-011 **自指**（本卡 vs CARD-07）且**预设答案** | `fixed` | 改写为「要不要做 / 什么形态（四选项）/ 三套校验器各自 owner 与生效点」 |
| **G15** | OI-001 的「13 个缺口」与送审事实（9 条代码锚点）**对不上** | `fixed` | OI-001 去掉未核实数字，改为指向枚举来源 |
| **G16** | 送审**缺方向陈述**（blocking） | `fixed` | 新增 `## 拟议方向` 整节（v1 → v2） |
| **G17** | raw 材料里 **U-002/U-003 重复** | `fixed` | 修正抽取脚本（原 `sec()` 会吞掉后续同级小节）；重跑校验重复计数 = 1 |
| **G18** | **三个不可延期实现前提未冻结**：decision-log 归属、与 CARD-04/03/05 的共享写面、card-02 新拓扑与结构生效时点 | `accepted_risk` | D-010 给出归属形态；**冻结本身是 build-plan/build-code 前动作**。风险与 owner 登记：本卡 + 相邻卡；**触发 = build-plan 前（不晚于 build-code）**，否则实现方无法确定唯一契约 |

## 逐条对照（32 条 → 组）

| finding | 严重性 | provider | 组 | 处置 |
|---|---|---|---|---|
| R01 | minor | antigravity/flash | G3 | fixed |
| R02 | major | antigravity/flash | G2 | fixed |
| R03 | major | kimi/coding | G1 | fixed+deferred |
| R04 | major | antigravity/flash | G5 | fixed |
| R05 | major | codex/luna | G12 | fixed |
| R06 | **blocking** | codex/luna | G1 | fixed+deferred |
| R07 | major | codex/luna | G7 | fixed |
| R08 | minor | kimi/coding | G3 | fixed |
| R09 | major | antigravity/flash | G10 | fixed |
| R10 | major | antigravity/flash | G13 | fixed |
| R11 | major | kimi/coding | G7 | fixed |
| R12 | **blocking** | codex/luna | G18 | accepted_risk |
| R13 | **blocking** | antigravity/flash | G8 | fixed |
| R14 | major | kimi/coding | G7b | fixed |
| R15 | major | kimi/coding | G8 | fixed |
| B01 | major | kimi/coding | G9 | accepted_risk |
| B02 | major | codex/luna | G2 | fixed |
| B03 | major | codex/luna | G6 | fixed+deferred |
| B04 | major | kimi/coding | G8 | fixed |
| B05 | major | antigravity/flash | G1 | fixed+deferred |
| B06 | minor | kimi/coding | G7 | fixed |
| B07 | major | kimi/coding | G6 | fixed+deferred |
| B08 | **blocking** | codex/luna | G18 | accepted_risk |
| B09 | major | antigravity/flash | G3b | fixed |
| B10 | **blocking** | antigravity/flash | G3 | fixed |
| B11 | minor | antigravity/flash | G8 | fixed |
| B12 | minor | kimi/coding | G4 | fixed |
| B13 | minor | kimi/coding | G11 | fixed |
| B14 | major | codex/luna | G8 | fixed |
| B15 | major | kimi/coding | G2b | fixed |
| B16 | major | codex/luna | G3 | fixed |
| B17 | major | antigravity/flash | G9 | accepted_risk |

**计数自检**：`32 = 15(R) + 17(B)`；处置分布 `fixed 25 / fixed+deferred 4 / accepted_risk 3 = 32` ✓

## 未闭合项（如实，不掩盖）

> **本清单不是定稿口径。** 未闭合项的**唯一定稿口径** = `decision-log.md` 的「未闭合项（如实披露，不掩盖）」（**真正未闭合 9 条**）。本文件是过程层证据，条目随修补推进而**就地刷新**，故可能与定稿口径不同步 —— **以下为刷新后的状态**。

| # | 项 | 状态 | owner | 触发 |
|---|---|---|---|---|
| 1 | **OI-007 的发散机制与 G-4**（原 G1） | ✅ **机制骨架已闭**（D-011：先定角度再按角度填 · origin 差集 · G-4=角度表有空缺即补）；**可执行细则未闭**（角度 schema / 候选身份与去重 / 最低数量 / 终止与失败态） | 本卡 | build-plan |
| 2 | **79 条来源的逐条处置**（G6） | **未闭**（形态已由 D-023 定） | 本卡 | build-plan 前 |
| 3 | **原子台账的最小范围论证**（原 G9） | ✅ **已闭**（**D-021**）；成本实测仍未承接 | 本卡 | build-plan 前 |
| 4 | **三个前置冻结**（G18） | **未闭** —— 三者「决定」须在 build-plan 前（不晚于 build-code）完成 | 本卡 + 相邻卡 | build-plan 前 |
| 5 | **第一轮 30 条**中除去「材料 bug 类」后与第二、三轮重复的部分未单独列出；其独有内容已并入本表 | 说明项 | — | — |
| 6 | **第二轮 red 侧无结果**（`REVIEW_WAIT_EXCEEDED`），**不构成通过**；`codex/luna` broker 未取消，事后若返回结果应作为该轮的补充事实读取 | 事实登记 | — | 若返回 |
| 7 | **计数口径**：本表条数按**口径 A**（`findings` 数组长度跨 red/blue 相加 = 108 / 20 blocking）；**口径 B**（`adjudication.clusters` = 114 / 21 blocking）亦真实存在，引用须写明口径 | 说明项 | — | — |

> **勘误**：本节此前把「OI-007 机制未设计」「原子台账最小范围论证未做」列为未闭合、并把 G9/G18 编号与 detail 轮的编号混用 —— 已按 D-011 / D-021 与 `decision-log.md` 的定稿口径刷新。
