# detail 审查 findings 逐条处置（step 10）

> **来源**：官方 `review --action=record`，`review_track=detail`，provider = 配置声明的 `kimi/coding` / `antigravity/flash` / `codex/luna`。
> **执行事实**：**一轮干净通过** —— red 与 blue 均 `available`、`coverage=satisfied`、`partial=false`。
> **findings 总数**：**33**（RED 19：1 blocking / 16 major / 2 minor；BLUE 14：**4 blocking** / 8 major / 2 minor）。
> **处置纪律**：每条落一档 —— `fixed`（已改材料并写明改了什么）/ `accepted_risk`（接受并登记 owner 与触发）/ `deferred`（附 owner 与触发）/ `rejected_with_reason`。**不允许空处置**。

## 处置分组（33 条 → 20 组）

| 组 | 内容 | 处置 | 改了什么 / 理由 |
|---|---|---|---|
| **G1** | **未闭合项清单过期**：仍写「OI-007 发散机制未设计」「原子台账最小范围论证未做」，而 D-011/D-021 已闭合；03 草稿原样复制了这份过期清单 | `fixed` | 按 append-only 追加取代标注：两项标「已被取代」并指向 D-011 / D-021；**同时如实保留** detail 审查的新判定（骨架已定但未到可验收粒度） |
| **G2** | **模块台账 12 个模块状态列全是「待定」**，与 T-003~T-009 和当时的 confirmed 决策（**该数字是修补当时的快照，现行为 28 条**）矛盾 —— 台账作为本卡防遗忘核心交付物却从未更新 | `fixed` | 12 行全部更新为真实状态并标注主责决策编号 |
| **G3** | **框架节点表漏 OI-019**（blocking） | `fixed` | OI-019 已挂入 `acceptance` 行 |
| **G4** | **固定类别表漏 OI-001 / OI-002 / OI-003**；且 `deferred` 类别只列 OI-018 而状态汇总说 2 条 | `fixed` | OI-001 → `data_state`；OI-002 / OI-003 → `complete_user_flow`。另加注说明：类别表按 `category` 轴、状态汇总按 `status` 轴，OI-016 的 category 是 `data_state`、status 是 `deferred`，两者不矛盾 |
| **G5** | 模块→步骤映射把 M10 写成「正式 + 本轮的早审」，与 D-002「不另造第二套早审」矛盾 | `fixed` | 改为「step 6 **前移**到 talk-r2 之前（同一轮官方审查，不另造通道、不跑第二次）」 |
| **G6** | 映射表 step 4 仍写「按大纲 r0 的可证伪问题定向」，与 D-015 及用户原话 V-018 直接冲突 | `fixed` | 改为「**当发散引擎用**：找外部方案/最佳实践/新想法，**范围不由可证伪问题界定**」 |
| **G7** | **逐字层含非逐字条目**：V-011 / V-012 是「见 …（不重复抄录）」这类指针，却标成用户原话 | `fixed` | 两行显式标 `【索引，非逐字】` 并注明「不参与逐字保真核对」 |
| **G8** | **完成判据不一致**：OI-003 的 acceptance 要求 19 条 OI 全部闭合，实际 17 confirmed + 2 deferred；无规则说明 deferred 是否允许 | `fixed` | 收敛检查的 acceptance 列改为「**OI 无 open（deferred 允许）**」；deferred 的 owner/trigger 已在 OI 记录内 |
| **G9** | **`reconstruct → reveal → challenge` 未规定「reveal 前隐藏 `current_selection`」**的 payload 约束与负向验收；而 D-011 选了「排序+推荐」、OI-013 又允许 `current_selection` 进审查（2 条 blocking） | ✅ **`fixed`（D-024）** | step 11 已定：重建阶段 payload **不得**含 `current_selection` / 推荐结果 / 排序；揭示后才暴露；**加负向验收**（重建阶段带选择 → 必须判失败） |
| **G10** | **角度提供者缺位**：D-011 要求「先与用户确定 2–3 个变化角度」，但按 D-002/流程，用户在发散前不参与 → 无合法提供者 | ✅ **`fixed`（D-025）** | step 11 已定：**角度由 agent 先生成并记录、随大纲呈现，用户可否决**；不为定角度单独插入交互 |
| **G11** | **验收依赖未提交材料**：`coverage-matrix.md`、findings 处置、解析器结果都不在送审 bundle 内，仅凭 bundle 无法核验（含 1 blocking） | `accepted_risk` | 送审包按 `stage-materials.json` 只含规定材料；支撑文件以 `context_map` / `evidence_map` 说明位置。**风险**：审查者只能看到提交的 bytes。**缓解**：在阶段末披露中单列「未提交引用不得作为验收事实」 |
| **G12** | **FR-34 / FR-38 的可执行验收缺失**：未验证「研究全文不被 500 字截断 / 路径存在 / 可按需展开」，也未验证「错误清单自检 / 每轮≥1 替代方案 / 大白话的选项-后果-风险表达」 | `deferred` | owner = 本卡 · 触发 = **build-plan**（卡面已授权「错误清单条目与候选生成方式留 build-plan」）；M3/M6 的机制已定，fixture 与失败断言在 build-plan 补齐 |
| **G13** | **append-only 只是写作约定**，没有不可变 ID/版本或「修改旧条目应失败」的机器断言 | `deferred` | owner = 本卡 · 触发 = build-plan（与 D-018 的校验器接线同批交付；含「原地修改旧条目应失败」的负向测试） |
| **G14** | **分母口径不一致**：D-023 要求 515 + 79，但覆盖矩阵只汇总 515，79 明写未核对 | `fixed`（口径）+ `deferred`（执行） | 覆盖矩阵已把 79 作为一行给出 `deferred` 处置；**逐条处置仍未执行**（owner = 本卡，触发 = build-plan 前） |
| **G15** | **OI-007 标 confirmed 但机制未到可验收粒度**：缺候选身份/去重/最低数量/终止规则（含 1 blocking） | `fixed`（标注）+ `deferred`（细则） | 已如实承认该判定并写明「骨架已定、可执行细则留 build-plan（卡面授权的可后置项）」；未把 OI-007 降回 open（D-011 确为用户裁决） |
| **G16** | **OI-016 把「写面冻结」defer 到 build-code 前**，与母 PRD 把接口冻结定为「实现依赖」冲突 | `deferred` | owner = 本卡 + CARD-04 · 触发 = **build-plan 前**（不晚于 build-code）。**保留 agent 判断**：本卡在 make-decision 阶段无法单方面完成与 CARD-04 的冻结，需先与 CARD-04 承接 task 对齐；该冲突已登记，不在本卡自行宣布冻结 |
| **G17** | **所有 OI 的 `requires_user_decision` 都是 true**，与 D-016「普通问题 agent 自定」及 T-008（M6/M7/M9/M10 未逐项问）矛盾，无法区分「必须问用户」与「agent 自定」 | `accepted_risk` | 解析器对 core impact（goal/scope/acceptance）的 OI **强制要求** `requires_user_decision: true`，故不能靠该字段区分。**处置**：以本文件 + T-003~T-009 的逐条记录作为「实际由谁定」的权威来源；**不改解析器契约**（属 D-018 的越界面，不在本卡自行扩大） |
| **G18** | **in-10 规定正式审查输入含「未收敛选项空间」，但契约只允许 3 个 key 且多送即 `MATERIAL_FORBIDDEN`** → 字段无处承载 | ✅ **`fixed`（D-026）** | **未收敛选项空间以 `objective_facts` 自由文本承载**；`convergence_outline` 仍按 questions-only 提交；三处表述已统一到 D-026 |
| **G19** | **材料缺『承接与不承接清单』小节**（D-003/D-004/D-018/D-019 都指向它） | `fixed` | 已新增该小节：本卡承接 3 项、明确不承接 8 项、给其他卡的输入注入义务 4 条 |
| **G20** | **执行顺序不明确**：核心方向说「大纲→调研→发散」，用户原话是「问清痛点→调研→发散」，映射表把痛点澄清放 step 3，而 D-013 说最小入口不阻塞 | `accepted_risk` | 本卡的顺序由**映射表 + D-013** 共同确定：**痛点澄清在 step 3（在调研之前）**，且它是**持续核对动作**而非开工门槛。**该口径已在映射表与收敛检查中一致化**；fixture oracle 在 build-plan 固化 |

## 逐条对照（33 条）

| finding | 严重性 | provider | 组 | 处置 |
|---|---|---|---|---|
| R01 | **blocking** | codex/luna | G9 | **fixed（D-024）** |
| R02 | major | codex/luna | G8 | fixed |
| R03 | major | antigravity/flash | G4 | fixed |
| R04 | major | codex/luna | G10 | **fixed（D-025）** |
| R05 | major | codex/luna | G11 | accepted_risk |
| R06 | minor | kimi/coding | G5 | fixed |
| R07 | major | codex/luna | G13 | deferred（build-plan） |
| R08 | major | codex/luna | G12 | deferred（build-plan） |
| R09 | major | antigravity/flash | G1 | fixed |
| R10 | minor | antigravity/flash | G2 | fixed |
| R11 | major | antigravity/flash | G16 | deferred（build-plan 前） |
| R12 | major | antigravity/flash | G3 | fixed |
| R13 | major | codex/luna | G6 | fixed |
| R14 | major | codex/luna | G17 | accepted_risk |
| R15 | major | codex/luna | G14 | fixed + deferred |
| R16 | major | antigravity/flash | G6 | fixed |
| R17 | major | kimi/coding | G1 | fixed |
| R18 | major | codex/luna | G15 | fixed + deferred |
| R19 | major | kimi/coding | G18 | **fixed（D-026）** |
| B01 | major | antigravity/flash | G1 | fixed |
| B02 | **blocking** | codex/luna | G9 | **fixed（D-024）** |
| B03 | **blocking** | codex/luna | G15 | fixed + deferred |
| B04 | major | codex/luna | G8 / G14 | fixed + deferred |
| B05 | major | antigravity/flash | G6 | fixed |
| B06 | major | codex/luna | G7 | fixed |
| B07 | minor | antigravity/flash | G4 | fixed |
| B08 | major | kimi/coding | G1 | fixed |
| B09 | major | kimi/coding | G2 | fixed |
| B10 | **blocking** | codex/luna | G11 | accepted_risk |
| B11 | major | antigravity/flash | G19 | fixed |
| B12 | major | codex/luna | G20 | accepted_risk |
| B13 | minor | antigravity/flash | G5 | fixed |
| B14 | **blocking** | antigravity/flash | G3 | fixed |

**计数自检**：`33 = 19(R) + 14(B)`；处置分布 `fixed 15 / fixed+deferred 3 / accepted_risk 4 / deferred 11 = 33` ✓

## 未闭合项（如实，不掩盖）

> **本清单不是定稿口径。** 未闭合项的**唯一定稿口径** = `decision-log.md` 的「未闭合项（如实披露，不掩盖）」（**真正未闭合 9 条**）。本文件为过程层证据，条目就地刷新，故可能与定稿口径不同步 —— 以下为**刷新后**状态。

| # | 项 | 状态 | owner | 触发 |
|---|---|---|---|---|
| 1 | ~~reveal 前隐藏 `current_selection` 的 payload 约束与负向验收~~（G9，2 blocking） | ✅ **已闭（D-024）** | — | — |
| 2 | ~~角度提供者缺位~~（G10） | ✅ **已闭（D-025）** | — | — |
| 3 | ~~审查输入如何承载「未收敛选项空间」~~（G18） | ✅ **已闭（D-026）** | — | — |
| 4 | FR-34 / FR-38 的 fixture 与失败断言（G12） | **未闭** | 本卡 | build-plan |
| 5 | append-only 的机器断言与负向测试（G13） | **未闭** | 本卡 | build-plan |
| 6 | OI-007 的可执行细则（G15） | **未闭**（骨架已定） | 本卡 | build-plan |
| 7 | 79 条来源逐条处置（G14） | **未闭**（形态已定） | 本卡 | build-plan 前 |
| 8 | 与 CARD-04 的写面冻结（G16，含 OI-016） | **未闭** | 本卡 + CARD-04 | **build-plan 前（不晚于 build-code）** |
| 9 | 新形态生效时点（OI-018） | **未闭** | 本卡 | 决定时点 = build-plan 前（不晚于 build-code）；生效时点 = card-02 合并后 / build-code 完成后 |

**计数**：**未闭 6 条**（#4~#9）；#1~#3 已由 D-024 / D-025 / D-026 收口。**与 `decision-log.md` 的定稿口径（9 条）关系**：该 9 条另含「送审包范围限制（G11）」「`requires_user_decision` 全 true（G17）」「执行顺序口径（G20）」三条 `accepted_risk`，本表未展开。

## 方法与边界（如实）

1. 本轮 **red 与 blue 均可用**、`coverage=satisfied`、`partial=false` —— 是三次 direction 审查 + 本次 detail 审查中**唯一一次双角色一次通过**。
2. findings 的 `evidence_anchor_valid` 均为 per-provider；**未逐条复核行号锚点**（材料行号在本轮后已变化）。
3. 本卡 **不把 detail 审查当成通过**：审查是 advice，不是门禁；上表 11 条 `deferred` + 4 条 `accepted_risk` 就是它的实际产出。
4. **送审包范围是审查自身的边界**（G11）：审查者只能评提交的 bytes；未提交引用（覆盖矩阵明细、findings 处置、解析器输出）**不得**被当作已验证事实。
