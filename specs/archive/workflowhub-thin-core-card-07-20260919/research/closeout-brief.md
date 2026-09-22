# make-decision 交接简报（详细版）

> **性质**：这是 `quality/evidence/handoff/make-decision.md` 的**配套详细简报**（该 handoff 按 `skills/stage-handoff` 的契约只保留指针与 13 个固定区块）。
> **权威**：**不是**权威材料。权威是 `specs/workflowhub-thin-core-card-07-20260919/decision-log.md`（1407 行，sha256 `0244f20e…acfd94`）与正式质量原件。
> 本文件放在 `research/` 下，是**支撑文件**，不新增控制面。

## 0. 一句话

CARD-07 = **make-decision 头脑风暴平台改造**。把 make-decision 从「弱化版的记录工具」改成**有顺序、有节奏（无固定轮次计数）的头脑风暴流程**；28 条决策全部获用户最终确认，14 步全部执行。

## 1. 身份与产物

| 项 | 值 |
|---|---|
| task | `workflowhub-thin-core-card-07-20260919` |
| project / 分支 / 基线 | `workflowhub` / `task/workflowhub/workflowhub-thin-core-card-07-20260919` / `b39f34ba` |
| 任务类型（受控值，纯 reader 读回） | **`普通任务`** |
| 唯一材料 | `specs/workflowhub-thin-core-card-07-20260919/decision-log.md`（**1407 行**）；`spec.md`/`plan.md`/`tasks.md` 由后续阶段产出 |
| 支撑文件 | `research/` **19 份** |
| 任务 store | handoff + stage-reflection + 4 轮审查原件（23 个文件） |

## 2. 用户明令的 5 条核心约束（最高优先级，违反即错）

1. **开头不严进**：用户只给模糊的原始需求与痛点，其余由 agent 分析（**D-013**）。
2. **调研是「高级发散引擎」**，不是给大纲做填空题（**D-015**）。
3. **只有「重要 / 方向 / 模糊」三类问题找用户**，普通问题 agent 自定（**D-016**）。
4. **Talk/Grill 用大白话**：每题 ≤3 选项 + 一个推荐 + 后果/风险，**不出现内部编号与术语**（**D-012**）。
5. **主会话只做规划、子代理派发、交互类技能**（**D-028**；机制归 CARD-03）。

## 3. 28 条决策要点

| 组 | 决策 |
|---|---|
| 范围边界 | D-001 现有拓扑跑本卡 · D-003 不回写母 PRD · D-010 只定「结构差异」 · D-019 **本卡承接旧机器物理删除** |
| 节奏交互 | D-002 方向审查前移 · D-012 Talk 格式 · D-014 台账进 decision-log（只模块级） · D-016 收敛判据 + 分级提问 · D-017 M6/M7/M9/M10 agent 自定 · D-028 主会话执行模型 |
| 需求调研 | D-013 最小入口 · D-015 调研=发散引擎 + 大白话表格 + 推荐标记 |
| 发散收敛 | D-009 大纲=**可证伪假设** · D-011 发散=先定角度再填 + origin 差集 + G-4 · D-020 放弃留档 + append-only 形态 |
| 保真覆盖 | D-018 复用现有校验器接线 · D-021 台账只覆盖「会变成需求与验收」的部分 · D-023 分母=已知全量 + 明标非穷尽 |
| 材料形态 | D-004 材料/过程分层 + 禁子代理产出整份大文件 · D-005 粒度+接线双主因 · D-022 本卡材料自用新结构 |
| 收口 | D-024 揭示协议硬约束 · D-025 角度由 agent 先生成 · D-026 选项空间写进 `objective_facts` · D-027 完成判据 |

## 4. 审查真实事实（4 轮，全部走项目配置 provider）

provider（来源 `/Users/Hugh/.config/workflowhub/config.json` → `wh_review.stages.make-decision`）：`kimi/coding` · `antigravity/flash` · `codex/luna`。

| 轮次 | 轨道 | red | blue | findings | blocking |
|---|---|---|---|---|---|
| 1 | direction | available（14） | available（16） | 30 | 9 |
| 2 | direction | **unavailable** | available（13） | 13 | 1 |
| 3 | direction | available（15） | available（17） | 32 | 5 |
| 4 | detail | available（19） | available（14） | 33 | 5 |
| **合计** | — | — | — | **108** | **20** |

**两种计数口径都真实存在**（引用必须写明口径）：
- **口径 A（材料采用）**：`findings` 数组长度跨 red/blue 相加 → **108 / 20 blocking**
- **口径 B**：`adjudication.clusters` 长度 → **114 / 21 blocking**（第 3 轮 37 = red 19 + blue 18）

**第 2 轮 red 侧失败事实原样保留**：`kimi/coding` + `antigravity/flash` = `PROVIDER_RESULT_INVALID`；`codex/luna` = `REVIEW_WAIT_EXCEEDED`（1200000 ms，**broker 未取消**）。**不构成通过。**

**四轮均未产出 `pass` 语义** —— 审查是 advice，不是门禁。逐条处置见 `research/direction-review-findings-disposition.md` 与 `research/detail-review-findings-disposition.md`。

## 5. 本阶段的结构性发现（**下游必须注意**）

**材料在增量修补中反复出现「同一材料内两处互斥、机器零报警」** —— 由独立检查逐轮抓出：

| 轮 | 报告 | 结果 |
|---|---|---|
| 1 | `stage-end-spec-analyze.md` | `inconsistent`：**22 条 gap** |
| 2 | `stage-end-spec-analyze-recheck.md` | `inconsistent`：17 闭 / 4 部分 / **1 未闭** + 3 条新矛盾 |
| 3 | `stage-end-spec-analyze-final.md` | `inconsistent`：**不建议收口**（F1 HIGH 位于自称已修处）+ 2 条新矛盾 |
| 4 | `stage-end-spec-analyze-closeout.md` | `partial`：只修 N1–N4 后收口 → **N1–N8 已修，末轮为自检** |

**硬结论**：
1. **解析器对上述全部冲突零报警** —— `analyzeDecisionOutline` 与 `analyzeDecisionConvergence` 在矛盾存在时**都是 passed / ok=true**。**只跑解析器不足以发现这类问题。**
2. 该形态与历史「**收敛假绿**」同型，**在本阶段内复现多次**。
3. **下游起草材料后，必须跑一次同类独立一致性检查。**

**agent 自己的两处判断错误（已登记）**：**把 U-002-17/18 改错（H2）**；**据不完整检查断言原件无 `adjudication.clusters` 字段（失实）** —— 后者由独立复查实测纠正。

### 一个必须让下游看见的机制失效：D-009「可证伪大纲」部分失效

- D-009 的交付物 `research/outline-r0.md`（可证伪大纲 + 3–5 个可证伪问题）**在阶段内从未落盘**，直到最后一次独立核查点名才补建。
- 补建后如实判定：5 个可证伪问题中 **4 条被证伪（80%，已过半）**。按 D-009 第 3 条**过半即应强制废弃重画**；**实际是逐条修正（D-013/D-015/D-021/D-025），没有重画**。
- **判定：D-009 在本卡内「部分失效」** —— 诊断价值成立，但**执行规则未被遵守**。已登记为未闭合项 #15。
- **给下游**：复用「可证伪大纲」前，必须先把「废弃重画」写成**可执行动作**（谁判 / 何时判 / 重画到什么程度 / 谁批准）。

## 6. 未闭合 9 条（owner / 触发）

| # | 项 | owner | 触发 |
|---|---|---|---|
| 1 | 79 条来源逐条处置（G14） | 本卡 | build-plan 前 |
| 2 | 三个前置冻结（G16，含 OI-016 与 OI-018） | 本卡 + 相邻卡 | **build-plan 前（不晚于 build-code）**（「决定」时点；OI-018 的「生效」时点更晚） |
| 3 | FR-34 / FR-38 的 fixture 与失败断言（G12） | 本卡 | build-plan |
| 4 | append-only 的机器断言与负向测试（G13） | 本卡 | build-plan |
| 5 | 未提交引用披露义务（G11，accepted_risk） | 本卡 | 已披露 |
| 6 | `requires_user_decision` 全 true（G17，accepted_risk） | 本卡 | 以 T 记录为权威 |
| 7 | 执行顺序口径固化（G20，accepted_risk） | 本卡 | build-plan |
| 8 | OI-007 可执行细则（G15） | 本卡 | build-plan |
| 9 | 原子台账成本实测 | 本卡 | build-plan 前 |

**已收口**：G9 / G10 / G18（D-024 / D-025 / D-026）；发散机制骨架（D-011）；最小范围论证（D-021）。
**另有 2 条事实登记**（不计入未闭合）：第 2 轮 red 无结果；四轮均无 `pass` 语义。

## 7. 承接与不承接（跨卡）

**本卡承接**：CARD-07 卡面全部 · **旧机器物理删除**（原属 CARD-06，D-019，build-code 阶段执行）· **runtime 覆盖校验器接线**（D-018，build-code 阶段执行）。

**明确不承接**：CARD-05 其余审查点与工具接入 / CARD-03 并行规则 / CARD-04 oracle 分离 / CARD-06 其余删除面 / CARD-08 / CARD-09 / CARD-10。

**输入注入义务**：给 CARD-07 承接 task 注入本卡 28 条决策 + 19 条 OI + 逐单元覆盖矩阵 + 本卡定义的「结构差异」（母 PRD 的 CARD-07 最小读取集**不含本卡材料**）；给 CARD-06 注入删除面清单避免重复删；给 CARD-04 注入写面冻结需求；给 CARD-10 注入未闭合 9 条。

## 8. 关键事实（易被误用）

1. 本卡的方向审查**前移**（D-002）与官方 manifest 顺序**有偏差**，已登记。
2. **D-013 / D-015 / D-009 / D-019 / D-021 等与卡面或母 PRD 的字面表述存在解释性调整**，全部登记在 `## 三档结论` 并标 `接受但有偏离`。
3. **母 PRD 未回写**（D-003）。
4. **非权威素材**：`research/notes-dsh-divergence-nonauthoritative.md` 的跨厂商输出**不是审查事实**（D-008）。
5. **送审包范围**：审查者只看到提交的材料；`research/` 支撑文件**未随审查提交**，其内容**不构成审查已验证事实**。
6. **本卡产出的是「结构差异」**，不是 decision-log 的完整新结构（D-010）；card-02 的标准尚未实现。
7. `interaction aggregate` 按 **D-019** 纳入删除面 → 本卡**不产出也不伪造**该绑定；`analyzeDecisionOutline` 的 `interaction_proof=missing` 与 17 条 `core interaction proof is unavailable` **是预期项**。

## 9. 下一步

**进入 `build-spec`**（现有阶段；新拓扑尚未实现，本卡不能用自己的交付物跑自己）。

`build-spec` 消费：`## 核心需求` / `## 核心目标` / `## 已选方向` / `## 拟议方向` / `## 唯一 OI 大纲` / `## 三档结论` / `## 原始需求覆盖矩阵` / `## 承接与不承接清单`。

**不得自行猜**：未闭合项的具体落点、79 条的逐条处置、写面冻结结果、新形态生效时点。
**起草后**：跑一次独立一致性检查（不能只跑解析器）。

## 10. 边界（必须问用户）

方向级变更 · 越过卡写面 · **不可逆 Git 动作**（提交/推送/删除） · 回写母 PRD · 承接归属变更 · 删除面范围变更 · **新拓扑生效时点**。
