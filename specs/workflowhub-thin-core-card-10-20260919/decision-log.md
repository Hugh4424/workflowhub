# 决策日志（decision-log）

> 本文件是 CARD-10（总体集成验收）任务在 make-decision 阶段的决策稿，按 `skills/decision-log/templates/decision-log-template.md`（327 行）的章节名与字段名书写。所有引用均为真实路径 + 行号。母 PRD 只读不改（ADR-007）；仓库内只落本卡 `specs/` 材料与 verify-code 结论，原始件全部落外置任务目录（ADR-005）。

## 任务身份

- **任务类型**：普通任务

判断依据：母 PRD CARD-10「五阶段开工说明」（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:549`）逐字要求「以本卡创建**收口实施 task**」，其第③条明确 build-code 无新实现、仅缺口修复交回原责任卡；任务地图行（`prd.md:118`）将 CARD-10 登记为「总体集成验收」实施卡；规划拓扑（U-008：make-decision→build-prd，`prd.md:19`、`prd.md:240`）不适用于本卡。

- **task_id**：`workflowhub-thin-core-card-10-20260919`
- **任务 worktree**：`<card-10-worktree>`
- **分支**：`task/workflowhub/workflowhub-thin-core-card-10-20260919`
- **基线 commit**：`be393a6ef10db7df919e01f194b47f8dd856d9b4`（外置 `task.json` 的 `baseline_commit` 逐字值）
- **外置任务目录**：`<task-dir>/`，现有 `task.json`、`facts.jsonl`、`quality/{reviews,tests}`；`task.json` 另载 `target_repo_root=<target-repo>`、`activation_cohort=post`、`execution_mode=per_invocation`、`record_model=vnext-single-write`
- **母材料（只读）**：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（698 行）与同目录 `decision-log.md`
- **ui_applicability**：`non_ui`（`prd.md:545`：`ui_applicability=non_ui,无设计稿`）
- **执行纪律**：合并依赖=中心化验证瓶颈、独占运行、不与任何卡并行（Group 3，`prd.md:543`、`prd.md:129`）；共享资源冲突=无共享写面、独占收口（`prd.md:544`）
- **起草时间**：2026-10-05（宿主本地时间 17:56 CST）

## 原始需求

本节保留原有的人读摘要；下方各节记录来源与可解析索引。本文件的 `R-` 编号是**本卡局部编号**，与母 PRD 的 `R-001..R-021` 不同域，映射逐条写在第三列。

母 PRD 把 CARD-10 定为任务地图显式指定的总体验收承接卡（`prd.md:524`）：执行命名可检查交付项「具体重构验收标准」（SD-13①，`prd.md:80`）——套件=E2E-1/2/3 真实执行 + 跨卡集成场景 + 关键失败路径核对；每条用例含可观察成功/失败用例 + 所需证据 + 承接负责人；各卡 AC 验收事实作为输入引用（存在性核对），不逐条复核内容；整体功能从真实入口联通实跑、达到约定成功条件且关键失败路径被核对后才声明完成；子任务状态相加≠整体完成（`prd.md:526`）。

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 套件主体三部分齐备（存在性核对+抽验权、E2E-1/2/3、跨卡集成场景与关键失败路径核对），每条用例含可观察用例+所需证据+承接负责人；CARD-10 **执行**套件而非临时发明 | FR-47 `prd.md:530`；AC-47 `prd.md:535`；套件定位 `prd.md:551`/`:553` | ADR-001、ADR-002；已处置 |
| R-002 | 套件内用例（E2E-1/2/3 与跨卡集成场景）逐条经真实入口执行、结果如实记录；**任一套件内用例失败即整体不完成** | FR-48 `prd.md:531`；AC-48 `prd.md:536`；执行纪律 `prd.md:607` | ADR-003、ADR-006；已处置 |
| R-003 | 各卡验收事实作为输入引用：核对事实存在且未漂白；**不重跑各卡内部测试、不逐条复核各卡 AC 内容**；用户保留抽验权，CARD-10 须提供定位与原文通路 | `prd.md:557`；AC-47 失败场景 `prd.md:535` | ADR-005；已处置 |
| R-004 | 关键失败路径有核对记录（SD-05 三条：真实测试失败被修复并复验、审查工具 unavailable 时独立替代或 unverified 披露、去阻断后历史失败事实未漂白） | FR-49 `prd.md:532`；`prd.md:605`；SD-05 `prd.md:47` | ADR-004；已处置 |
| R-005 | 完成宣称只在真实入口联通实跑、约定成功条件达成、关键失败路径被核对之后；展示含**未验证项与风险** | FR-50 `prd.md:533`；AC-50 `prd.md:538` | ADR-007；已处置 |
| R-006 | 存在失败的套件内用例时整体不被声明完成；失败如实记为 failed/unverified/unavailable，不被改写为通过 | AC-49 `prd.md:537`；E2E-3 `prd.md:580-582` | ADR-004；已处置 |
| R-007 | E2E-2 的审查节奏度量：三审查点真实执行记录存在；推进与审查派发不被机器校验（revision/快照/材料身份/哈希/回执）阻断 | E2E-2 `prd.md:572`；SD-17 `prd.md:96`；现行合同 `workflows/{make-decision,build-plan,build-code,verify-code}/SKILL.md` | ADR-002；已处置（旧表述退役） |
| R-008 | 跨卡集成场景核对冻结接口在跨卡边界真实成立：INTEG-1 接口蓝图跨卡消费、INTEG-2 make-decision 共享写面共存、INTEG-3 审查基建共享写面共存 | `prd.md:589-602`；分组依据 `prd.md:126-129`；上游变化注 `prd.md:603` | ADR-001；已处置 |
| R-009 | 母/兄弟材料只读，不触发母任务 close、不移动/删除其文件；build-code **无新实现**（仅缺口修复交回原责任卡） | `prd.md:549` 第③④条 | ADR-007；已处置 |
| R-010 | 套件主体以 PRD 为准，build-plan 不得增删用例或改写失败判据；用例参数细节（fixture、采样命令、环境假设）留本卡 build-plan 细化 | `prd.md:547`；`prd.md:528` | ADR-005；已处置（参数细节 deferred） |
| R-011 | CARD-10 通过后进入停止规则：只有真实用户问题或真实失败才触发新一轮修改，不做猜测式流程优化 | `prd.md:658`（2026-09-19 加固修订 R10） | ADR-007；已处置 |

## 需求变更记录

Talk 第 1 轮（2026-10-05 make-decision 起草轮）用户对 5 个执行口径选择项逐项选定 A（推荐项），并对 2 项承接决定予以认可。**该轮未留存用户逐字原文**：以下 `>` 行按模板规则保留缺口，不把改写摘要填进引文；已确认的答复语义记在「变更与处置」，不得被当作逐字引文回读。

Talk 第 2 轮（2026-10-05）用户对三个决策轴各选定 A（推荐项），三处均为**选项选择**（非自由文本口述）。所选选项标签已按界面原文逐字登记于 `## 逐字声明层（verbatim）` V-012..V-014，逐条登记为 U-005..U-007。选项标签是用户实际点选的界面原文，可逐字回读，但仍不等同于用户自己组织的句子。

Talk 第 3 轮（2026-10-05）用户对两个决策轴各选定 A（推荐项），两处同样均为**选项选择**（非自由文本口述）。所选选项标签已按界面原文逐字登记于 `## 逐字声明层（verbatim）` V-015..V-016，逐条登记为 U-008..U-009。选项标签是用户实际点选的界面原文，可逐字回读，但仍不等同于用户自己组织的句子。

Talk 第 4 轮（2026-10-05）用户对四个决策轴各选定一项（轴六选 **B**、轴七/轴八/轴九各选 A（推荐项）），四处均为**选项选择**（非自由文本口述）。所选选项标签已按界面原文逐字登记于 `## 逐字声明层（verbatim）` V-017..V-020，逐条登记为 U-010..U-013。选项标签是用户实际点选的界面原文，可逐字回读，但仍不等同于用户自己组织的句子。

Talk 第 5 轮（2026-10-05）由第 4 轮轴六/轴九的答案重排后**新增一条决策轴**（轴十：最终完成宣称口径），用户选定 A（推荐项），同为**选项选择**（非自由文本口述）。选项标签已按界面原文逐字登记于 V-021，登记为 U-014。同样不得当作用户自由文本口述回读。

Grill 第 1 批（2026-10-05）三条答复（选项选择）：用户对三条 frontier 问题（G-001..G-003）各选定 A（推荐项），三处均为**选项选择**（非自由文本口述），答复经**提问工具**（`ask_user_question`）取得。所选选项标签已按界面原文逐字登记于 `## 逐字声明层（verbatim）` V-022..V-024，逐条登记为 U-015..U-017。选项标签是用户实际点选的界面原文，可逐字回读，但仍不等同于用户自己组织的句子。

**编号消歧**：母 PRD 自身也使用 `U-008`（指规划拓扑 make-decision→build-prd，`prd.md:19`/`:240`，见 `## 任务身份` 与 `## 验收面` 用例 1）；本文件的 `U-008`（Talk 第 3 轮轴四）是**本卡局部编号**，与母 PRD 的 `U-008` 不同域，两处引用不得互串（同 `## 原始需求` 对 `R-` 编号的说明）。

### U-001 — 五项执行口径逐项选定 A（推荐项）

> （缺口：Talk 第 1 轮未留存逐字原文；不把改写摘要冒充引文。可回读来源=Talk 第 1 轮的 5 项选择项答复，逐项为「A（推荐项）」。）

- 来源：Talk 第 1 轮（2026-10-05）执行口径选择项 5 项，逐项选定 A（推荐项）。
- 变更与处置：**新增**本卡执行口径 5 条，落为 ADR-003（RED→GREEN 证据取法=真跑仓库现成验收 oracle + 引用 CARD-09 归档 RED→GREEN 原件，并写明「独立复跑既有 oracle」界限）、ADR-004（E2E-3 注入一次真实测试失败 → 如实记失败 → 修复 → 复验）、ADR-005（证据落点=原始件全落外置任务目录 `quality/`，仓库内不复制原始件）、ADR-007（母 PRD 只读不改）、ADR-006（执行载体=任务内最小驱动脚本，不进主仓 `tests/`，记录须标注「驱动只是发起真实入口，不构成自证」）。不改变母 PRD 任何字节。**注**：其中 RED→GREEN 一项的口径已由 Talk 第 2 轮 U-005 补齐 G-2 豁免披露（见修订后的 ADR-003）；本行保留 Talk 第 1 轮当时的表述，不回改。

### U-002 — 认可承接决定 A（INTEG-3 判据更新）

> （缺口：Talk 第 1 轮未留存逐字原文；可回读来源=Talk 第 1 轮对「承接决定 A」的认可答复。）

- 来源：Talk 第 1 轮（2026-10-05）承接决定 A 认可。
- 变更与处置：**修改** INTEG-3 的可观察结果与失败判据——保留用例编号与「跨卡共存」目的，把已失去前提的「并发限制/并发上限」改为「CARD-05 审查链与 CARD-09 资源/效率改动共存」；落为 ADR-001。不得删除用例、记 N/A 或恢复并发限制。

### U-003 — 认可承接决定 B（旧「全 phase 结束集成审查」按已退役处理）

> （缺口：Talk 第 1 轮未留存逐字原文；可回读来源=Talk 第 1 轮对「承接决定 B」的认可答复。）

- 来源：Talk 第 1 轮（2026-10-05）承接决定 B 认可。
- 变更与处置：**修改**本卡对审查节奏的验收读法——建立显式新旧对应表（见 `## 退役登记（retirement）`），按现行工作流合同的三审查点验收，不机械补回、不改写母 PRD；落为 ADR-002。

### U-004 — 任务类型确认（普通任务）

> （缺口：Talk 第 1 轮未留存逐字原文；可回读来源=Talk 第 1 轮对「任务类型=普通任务（实施/验收类），非规划任务」的确认。）

- 来源：Talk 第 1 轮（2026-10-05）任务类型确认；母 PRD `prd.md:549`。
- 变更与处置：**新增**任务身份声明（`## 任务身份`），CARD-10 按普通任务承接，不触发母任务 close、不移动/删除母或兄弟卡材料。

### U-005 — E2E-2 的 RED→GREEN 按 G-2 豁免如实披露（复跑现成 oracle + 引用 CARD-09 归档原件）

> A：如实走 G-2 豁免披露 + 复跑现成 oracle + 引用 CARD-09 归档原件（推荐）

- 来源：Talk 第 2 轮（2026-10-05），选项选择（轴一：E2E-2 的 RED→GREEN 取法）。逐字文本见 V-012；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 变更与处置：**修改** ADR-003 的 RED→GREEN 口径，补齐 G-2 豁免（SD-06 `prd.md:51`）的完整读法：本卡 build-code 无新实现、无行为变更（`prd.md:549` 第③条），故须写明「**本卡无行为变更，故无新 RED→GREEN**」；**补一条可失败的检查**，由 E2E-3 注入的真实测试失败充当（ADR-004）；同时复跑仓库现成 oracle 取得真实执行事实（执行广度见 ADR-009），并引用 CARD-09 归档的真实 RED→GREEN 原件作为历史事实；明确界限「这是独立复跑既有 oracle，**不是**新实现产生的 RED→GREEN」。R-002 与 AC-48 的失败判据不变。
- 关联：R-002；ADR-003（修订）、ADR-004、ADR-009。

### U-006 — 「审查工具不可用」路径的真证据来源＝先检索已有真实原件，本轮真出现才记录并披露，不人为制造

> A：先检索已有真实不可用原件；本轮若真出现就如实记录并披露（推荐）

- 来源：Talk 第 2 轮（2026-10-05），选项选择（轴二：关键失败路径第 2 条「审查工具不可用」的真证据来源）。逐字文本见 V-013；上方 `>` 行为所选选项标签原文，**不是**用户自由文本口述。
- 变更与处置：**新增** ADR-008——关键失败路径②（`prd.md:605`、SD-05 `prd.md:47`）的真证据取法：先检索 CARD-09 与规划任务已有真实不可用原件；本轮执行中若真实出现 provider 不可用/失败，如实记录并披露 unverified；**不人为制造假失败**（明确排除「把 provider 指向不存在目标」这类做法）；若本轮确实未出现，如实记「本轮未出现该情形」并说明替代核对面（CARD-09 归档原件），不冒称亲历。`prd.md:605` 的失败判据（缺任一路径核对记录即阻断）不变。
- 关联：R-004、R-006；ADR-008。

### U-007 — 验收执行广度＝只跑套件直接相关的三个 oracle，其余各卡仅做原件存在性核对

> A：只跑套件直接相关的三个（card-09-session-ledger + card-04 e2e + 五阶段 e2e）（推荐）

- 来源：Talk 第 2 轮（2026-10-05），选项选择（轴三：verify-code 实际跑哪些 oracle）。逐字文本见 V-014；上方 `>` 行为所选选项标签原文，**不是**用户自由文本口述。
- 变更与处置：**新增** ADR-009——验收执行广度只跑 `node tests/acceptance/card-09-session-ledger.mjs`、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` 三个；其余 CARD-01..09 只做原件存在性核对 + 归档引用（依据 AC-47 `prd.md:535`「**不逐条复核各卡 AC 的内容**」）；明确排除「全量跑 `tests/acceptance` 下所有 oracle」（越界且接近无范围全量回归，违反测试硬规则）。不增删套件用例、不改写失败判据（`prd.md:547`）。
- 关联：R-003、R-010；ADR-009（并见 ADR-003 的执行面、`## 验收面` 用例 0）。

### U-008 — 把已收敛的 ADR 结论写进 current_selection，重跑一次方向审查

> A：把已收敛的 ADR 结论写进 current_selection，重跑一次方向审查（推荐）

- 来源：Talk 第 3 轮（2026-10-05），选项选择（轴四：方向审查是否重跑）。逐字文本见 V-015；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 背景事实：第一轮方向审查 `2026-10-05-007-make-decision-direction.json` **真实执行成功**——`version=wh-review-result.v1`、`status=available`、`outcome=completed`、`pair_status=complete`、exit 0、6 个 provider 调用（3 provider × red/blue）全部 `completed`、`started_at=2026-10-05T10:12:00.114Z`/`completed_at=2026-10-05T10:16:28.651Z`、**20 条 findings 其中 1 条 blocking（F-6）**。但该轮消费的 `current_selection` 只装了 Talk 第 1 轮的 5 条执行口径，**未装已收敛的 ADR 结论**（ADR-001/002/003 修订/004/008/009），故约 15 条 findings 属材料滞后的「打空」——问题出在给审查的材料，不在已收敛的决定本身。
- 变更与处置：**修改**本卡 make-decision 方向审查的材料与执行方式——把 ADR-001、ADR-002、ADR-003（修订）、ADR-004、ADR-008、ADR-009 的结论与依据链**改写进 `current_selection`**，然后**重跑一轮方向审查**（仍属同一次方向审查，只是把材料给对；不是新增审查点、不是替代审查、不改三审查点口径）。第一轮记录（`2026-10-05-007-make-decision-direction.json` 及 6 份 provider `.output`）**保留为原件不删除**，并在 `## 审查处置` 中作为处置对象登记（`DIR-R1-T1`..`DIR-R1-T6`）。**重跑的结论尚未产生，本行不预写结果**；重跑轮 findings 的处置在结果产生后追加到 `## 审查处置`（已留「待补」行）。
- 关联：R-001（套件三部分齐备）、R-002（真实执行记录）；`## 审查处置`；ADR-001、ADR-002（修订）、ADR-003（修订）、ADR-004、ADR-008、ADR-009。

### U-009 — 旧「全 phase 结束集成审查」记录为未验证 + 用户显式确认按现行三道审查点验收

> A：记录为“未验证 + 用户显式确认按现行三道审查点验收”（推荐）

- 来源：Talk 第 3 轮（2026-10-05），选项选择（轴五：旧「全 phase 集成审查」的残余风险处置）。逐字文本见 V-016；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 变更与处置：**修改** ADR-002 的放行口径——旧「全 phase 结束集成审查」（SD-07 ③，`prd.md:56`/`:572`/`:600`）在本卡记 **`未验证（unverified）`**，**不**当作「已披露即可放行」；E2E-2 按**现行三道审查点**（①②④）验收；**放行依据是用户显式确认（U-009/V-016）**——即用户显式确认按现行三道审查点验收，不得仅凭披露放行。残余风险如实保留：母 PRD 原文仍保留该旧表述，只看 PRD 的读者可能误读为「本卡漏做了必留审查点」（RISK-008）。**PRD 原文不改**（ADR-007）；旧表述仍属退役登记对象（`## 退役登记（retirement）` 主表与新旧对应表第③行）。
- 关联：R-007；ADR-002（修订）、ADR-007；RISK-008；`## 退役登记（retirement）`；`## 成功/失败边界`。

### U-010 — E2E-2 的「全 phase 结束集成审查」处置：用户以母任务 owner 身份正式授权按现行三审查点验收

> B 由你正式授权按现行三审查点验收

- 来源：Talk 第 4 轮（2026-10-05），选项选择（轴六：E2E-2 的集成审查处置）。逐字文本见 V-017；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 背景事实：`prd.md:572`（E2E-2）与 `prd.md:56`（SD-07）仍写「全 phase 结束集成审查」这一审查点；四个现行 workflow skill 一致只保留三审查点——`workflows/make-decision/SKILL.md:38`、`workflows/build-plan/SKILL.md:36`、`workflows/build-code/SKILL.md:22`/`:40`、`workflows/verify-code/SKILL.md:34`；`prd.md:603` 的上游变化注**只授权 INTEG-3 改判据**，**未授权** E2E-2 的审查节奏项。
- 变更与处置：**修改** E2E-2 审查节奏项的处置口径——①这是**用户的授权**（用户以母任务 owner 身份正式授权），**不是** CARD-10 自行改写 PRD 判据；②授权范围**仅限 E2E-2 的审查节奏项**（即「全 phase 结束集成审查」这一点的验收读法），不扩及 INTEG-3、不改其他判据；③PRD 原文**只读不改**（ADR-007），旧表述作为历史事实保留（`## 退役登记（retirement）`、`## Supersedes（被替代记录）`）；④与 U-009 的关系＝U-009 此前只记「`未验证（unverified）` + 用户显式确认放行」，本条把该口径**升级**为**正式授权**（放行依据由「显式确认」升格为「以母任务 owner 身份正式授权」）；**U-009 保留不删**，其记载为当时口径。落为 ADR-002 第二次修订。
- 关联：R-007；ADR-002（第二次修订）、ADR-007；`## 退役登记（retirement）`；`## 成功/失败边界`。

### U-011 — E2E-2 证据主体＝CARD-09 归档真实实施旅程为主 + 本卡本次四阶段执行为补充

> A CARD-09 归档旅程为主 + 本卡这次执行为补充（推荐）

- 来源：Talk 第 4 轮（2026-10-05），选项选择（轴七：E2E-2 证据主体）。逐字文本见 V-018；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 背景事实：CARD-09 归档的真实实施旅程**四阶段走完**，四份审查原件齐备（`quality/reviews/` 下 `2026-10-04-051-build-plan-document.json`、`2026-10-05-005-build-code-phase-p1.json`、`2026-10-05-010-build-code-phase-p2.json`、`2026-10-05-017-verify-code-document.json`）；理由＝审查方（第二轮方向审查 6 份 provider 原件中的三个 provider）独立指出「以本卡自身执行为 E2E-2 主证据不可行」。
- 变更与处置：**修改** E2E-2 的证据主体口径——主证据＝**CARD-09 归档的真实实施旅程**（四阶段 + 四份审查原件）；补充活证据＝**本卡自身本次四阶段执行**。**如实标注**：本卡 build-code **无新实现、不拆 Phase**（`prd.md:549` 第③条），故**不产出 phase 级代码审查原件**——这是**事实，不是缺失**，不得据此判 E2E-2 失败或记 N/A。落为 ADR-010；`## 验收面` 用例 2 证据列同步。
- 关联：R-007；ADR-010、ADR-002（第二次修订）；`## 验收面` 用例 2。

### U-012 — E2E-1 与 INTEG-1/2/3 逐条给真实入口证据映射；oracle 只做单文件定向执行

> A 逐条给真实入口证据映射（推荐）

- 来源：Talk 第 4 轮（2026-10-05），选项选择（轴八：E2E-1 与跨卡用例取证口径）。逐字文本见 V-019；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 变更与处置：**修改** E2E-1 与 INTEG-1/2/3 的取证口径——**逐条**给出真实入口证据映射（命令、exit code、output 位置），取代「归档复用 + 存在性核对」的降级读法：①**E2E-1** 用母规划任务（`workflowhub-thin-core-rebuild-planning-20260919`）的**真实阶段事实 + 交互记录 + PRD 最终确认原件**（依据 `prd.md:567` 的 E2E-1 证据句）；②**INTEG-1/2/3** 用**可实跑的现成 oracle 现场跑**（**单文件定向执行，不做全量回归**，与 ADR-009 一致）+ 真实原件对照；③**跑不了的部分如实标 `unverified`**。依据：`prd.md:607`（第二三部分用例须有真实执行记录）与 AC-48（`prd.md:536`，无脚本自证冒充）。落为 ADR-011；`## 验收面` 用例 1 证据列同步。
- 关联：R-002、R-003、R-008、R-010；ADR-011、ADR-009、ADR-005。

### U-013 — INTEG-1 判 `unverified`（失败判据未触发、可观察结果未完全满足）

> A 判「未验证」（推荐）

- 来源：Talk 第 4 轮（2026-10-05），选项选择（轴九：INTEG-1 判什么）。逐字文本见 V-020；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 事实（逐条，均为只读核实）：
  1. **「无静默偏离」成立**——没有任何 Group 1 卡改动蓝图本体或其 owner 文件；CARD-07 `phases/P1.md:86` 在 Boundary / DO NOT TOUCH 中**显式列出**不改 `runtime/task/task-topology.mjs`、母 PRD、旧 task 字节或 CARD-01 owner。蓝图与 `runtime/task/task-topology.mjs` 的消失是 CARD-06 在迁移表 **MT-7-078**（`specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md:892`、`migration-table-part6-docs-pre-g3.md:148`；动作 **NARROW** / 批次 **B7/P8** / 附回滚命令 `git revert <B7 提交>` + `git checkout backup/card-06-b7 -- docs/contracts/card-01-stage-material-interface.md`）**登记过**的处置，**不是静默偏离**。
  2. **「被 Group 1 各卡实际消费」只 1/4 张卡有行为级证据**——CARD-07 提交 `18b8134a3e42b2707f1823f029e4d593a894daf0`（2026-09-22 19:21:25 +0800）在 `runtime/stage/stage-context.mjs` 新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`，且其 `spec.md:332` 写「CARD-01 `task-topology.mjs` 是唯一 topology owner」；**CARD-03/04/05 无消费证据**（CARD-04 的命中全是快照/哈希清单/结构清点，它把蓝图登记为受冻结跟踪源但未消费契约内容；其「在其上对齐」指它自己的 DER-08 三项接口面）。
  3. 失败判据 `prd.md:591`（任一 Group 1 卡偏离且无 G-1 记录）**未触发**；可观察结果 `prd.md:590`（被各卡实际消费）**未完全满足**。
  4. 蓝图 46 行**从未要求**后续卡显式引用或留对照记录——只有 L3「本蓝图供 CARD-02 到 CARD-10 读取。」，属可读性声明，不构成引用义务。
  5. CARD-02 才是文档级最强消费者（`plan.md:46` 有 hash 门 + STOP 守卫、`tasks.md:45` first action 读蓝图），但属 **Group 0**，不满足 INTEG-1 的「Group 1」措辞。
  6. **时间关系**：四卡关闭时间 CARD-03 `2026-10-01T11:27:31.082Z`、CARD-04 `2026-09-29T07:20:00.730Z`、CARD-05 `2026-09-26T05:05:37.721Z`、CARD-07 `2026-09-22T11:24:41.615Z`，**全部早于** `457299b3`（删 `task-topology.mjs`，2026-10-04 00:02:20 +0800）与 `7c4a2444`（重写蓝图，2026-10-04 00:39:25 +0800）→ **不存在**「工作时蓝图已不在」的免责。
  7. **蓝图原件事实**：`docs/contracts/card-01-stage-material-interface.md`，历史版本 46 行、标题 `# CARD-01 阶段与材料接口蓝图`，由 `d1097711d44ab6e0464c495e6741fe017a2338f3` 新增、经 `d0ca509121d0caf6f9ee4675cdf309f24b8a4920` 进 main，sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`；HEAD 处**已被重写**为 761 字节、5 行、首行 `# 当前材料接口`、sha256 `1ab0afe45c9001e93ca95091d8bff848980c11f6f19810bd03d779214554df72`；`runtime/task/task-topology.mjs` 在 HEAD **ABSENT**。
- 变更与处置：**修改** INTEG-1 的裁决——判 **`unverified`**（不是 `passed`，也不是 `failed`）。处置约束：**不得删用例、不得记 N/A、不得恢复并发限制**。缺口去向＝「PRD 用词与制品现实不匹配（蓝图未设引用义务，PRD 却要求各卡消费）」当时记「交回**母任务层面**」（**历史口径**，已由 U-016／ADR-014 细化为承接方＝无、只在本卡如实记录），不在本卡实现、不改 PRD。落为 ADR-001 修订；`## 验收面` 用例 4 同步。
> 去向口径已由 U-016／ADR-014 细化：承接方＝无，只在本卡如实记录。
- 关联：R-008、R-001；ADR-001（修订）；RISK-004；`## 成功/失败边界`。

### U-014 — 最终完成宣称口径＝声明完成，但把 INTEG-1 的未验证项与缺口去向写进完成宣称

> A 声明完成，但把未验证项写进完成宣称（推荐）

- 来源：Talk 第 5 轮（2026-10-05），选项选择（轴十：最终完成宣称口径；由 Talk 第 4 轮轴六/轴九的答案重排后新增的问题）。逐字文本见 V-021；上方 `>` 行为用户所选选项的界面标签原文，**不是**用户自由文本口述。
- 变更与处置：**修改** 完成宣称口径——**声明完成**，但把 **INTEG-1 的 `unverified` 作为显式披露项**，并把**缺口去向**（PRD 用词与制品现实不匹配，交回母任务层面）一并写进完成宣称。依据：AC-50（`prd.md:538`）要求完成宣称「展示含未验证项与风险」；`prd.md:607` 的阻断条件是「套件内用例**失败**」，而 INTEG-1 判的是 **`unverified`**（判据 `prd.md:591` 未触发、可观察结果 `prd.md:590` 未完全满足），**不等同于失败**。**风险如实写明**：该结论依赖「未验证 ≠ 失败」这一区分被读者接受。落为 ADR-012；`## 成功/失败边界`、`## 最终确认` 同步。
> 去向口径已由 U-016／ADR-014 细化：承接方＝无，只在本卡如实记录。
- 关联：R-005；ADR-012、ADR-001（修订）；AC-50 `prd.md:538`；`prd.md:607`。

### U-015 — 关键失败路径②取证形态＝历史真实原件 + 本轮受控演练两层并用（G-001）

> A 历史原件 + 本轮受控演练（推荐）

- 来源：Grill 第 1 批（2026-10-05），**选项选择**（轴：关键失败路径②「审查工具不可用」的取证形态；答复来源＝**提问工具**（`ask_user_question`）；对应问题 G-001）。逐字选项标签见 V-022；上方 `>` 行为用户所选选项的界面标签原文，**答复形式＝选项选择，非自由文本口述**，不得写成用户原话引述。
- 选中项的含义：**两层并用**——①引用归档中真实存在的「审查工具确实不可用、系统如实记 unavailable」原件作**历史事实**——CARD-05 共 26 份 `OCR_DELEGATION_UNAVAILABLE`（工具本体没跑起来；代表件 `workflowhub-thin-core-card-05-20260919/quality/reviews/attempts/789516a8-54ab-5fd7-a963-0991fc2c79ed/attempt.json`，`terminal_status:"unavailable"`、`dispatch_state:"blocked_before_dispatch"`、原文 `"host OCR delegation executor is unavailable; no legacy review fallback was used"`）、CARD-04 共 2 份 `OCR_ALL_PROVIDERS_FAILED`（`workflowhub-thin-core-card-04-20260919/quality/reviews/attempts/489a8486-1a56-573c-a4a9-c9ce9ec043dc/attempt.json` 与 `eb0c971f-7f5f-530a-a98d-aba82fd5d3d5/attempt.json`，`stage:"verify-code"`、原文 `"all configured OCR host providers failed"`），另有 card-01/02/07 真实超时与取消组；②**本轮**真跑现成真实入口用例 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs`，取得**本轮亲历**的不可用记录与原始字节（该用例断言原始字节保留于 `quality/reviews/<name>.output`，精确字节 `[0xff,0x00,0x41]`）。
- 必须同条写死的三条边界：(i) 该用例是**受控故障注入**（注入 `services.runReviewRound`，`error.code:"OWNED_UNAVAILABLE"`、`message:"controlled no-model review"`），**不是自然发生的工具故障**，记录里必须写明这一点；(ii) **「独立替代审查真的顶班」在整个归档中从未发生过**——不存在任何一份「`ocr` 命令不存在（ENOENT）或版本低于 1.12.9 → 真的执行了独立替代审查」的原件，该分支只以代码（`runtime/review/ocr-delegation-adapter.mjs:22` `not_installed: ENOENT`、`:33` below-1.12.9）、测试与一条评审意见存在；母 PRD `:60`（SD-08）自述旧 wh-review/broker 路径**仅为只读历史证据、不是可执行 fallback**，故第②条能真正核到的实质是「工具不可用时系统如实记 unavailable、不冒充已审」；(iii) 本轮 `ocr` 实测在位（`open-code-review v1.12.12`，`<ocr-bin>`，高于回退阈值 1.12.9），故本轮演练走的是受控注入路径而非真实缺失路径。
- 直接后果：关键失败路径②同时具备历史事实与本轮亲历执行记录，不再只靠引用归档。
- 用户已知的主要风险：受控注入的证据强度弱于自然故障，须靠如实标注补足。
- 变更与处置：**定稿** `## 验收面` 用例 7 路径②的取证形态（替换其「待定稿」占位）；落为 ADR-013；`## 成功/失败边界` 与 `## grill（质询）` 同步。
- 关联：R-004；ADR-013、ADR-008；F-012；`prd.md:605`、`:47`（SD-05）。

### U-016 — INTEG-1 缺口的去向形态＝只在本卡如实记录，不动母任务（G-002）

> A 只在本卡如实记录，不动母任务（推荐）

- 来源：Grill 第 1 批（2026-10-05），**选项选择**（轴：INTEG-1 缺口的去向形态；答复来源＝**提问工具**（`ask_user_question`）；对应问题 G-002）。逐字选项标签见 V-023；上方 `>` 行为用户所选选项的界面标签原文，**答复形式＝选项选择，非自由文本口述**，不得写成用户原话引述。
- 选中项的含义：INTEG-1 判 `unverified` 的缺口根因（母 PRD `:589-592` 要求 Group 1 各卡实际消费 Group 0 冻结的阶段/材料接口蓝图，而蓝图 `docs/contracts/card-01-stage-material-interface.md`（原始 46 行、sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`）**本身从未要求后续卡显式引用或留对照记录**，其 L3 只说「本蓝图供 CARD-02 到 CARD-10 读取」；Group 1 四卡材料对蓝图文件名/标题/首句/sha 的消费证据几乎全为零，仅 CARD-07 有行为级消费证据——提交 `18b8134a3e42b2707f1823f029e4d593a894daf0` 在 `runtime/stage/stage-context.mjs` import 区新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`，且 CARD-07 `specs/archive/workflowhub-thin-core-card-07-20260919/spec.md:332` 逐字为「CARD-01 `task-topology.mjs` 是唯一 topology owner.」）**只在本卡 decision-log 如实记录**，不写母任务层面的文件、不出具「母 PRD 用词修正建议」。
- 直接后果：本卡边界保持「母材料只读」；缺口有据可查但无承接方。
- 用户已知的主要风险：母 PRD 该要求会长期停在「要求与实际对不上」的状态，需后续有人主动跟进。
- 变更与处置：**定稿** INTEG-1 缺口的去向形态；落为 ADR-014；`## 未决项` 新增 OPEN-006（承接方＝无）同步。**口径细化**：本项把 INTEG-1 缺口的去向从早前各处写的「交回母任务层面」细化为**「承接方＝无，只在本卡如实记录」**——不写母任务层面文件、不出具母 PRD 用词修正建议；相关表述以本项为准。
- 关联：R-008；ADR-014、ADR-001（修订）；U-013、V-020；`prd.md:589-592`；OPEN-006。

### U-017 — 本阶段独立审查收口＝补跑一次细节审查，处置完再进确认（G-003）

> A 补跑一次细节审查，处置完再进确认（推荐）

- 来源：Grill 第 1 批（2026-10-05），**选项选择**（轴：本阶段独立审查的收口方式；答复来源＝**提问工具**（`ask_user_question`）；对应问题 G-003）。逐字选项标签见 V-024；上方 `>` 行为用户所选选项的界面标签原文，**答复形式＝选项选择，非自由文本口述**，不得写成用户原话引述。
- 选中项的含义：make-decision 第 4 步的方向建议已真实跑两轮（第一轮 268 秒、重跑轮 491 秒），第 9 步的**细节建议一次未跑**；现按方法补跑**一次** `review_track:"detail"` 审查，findings 逐条处置（fixed / rejected_invalid / accepted_risk / needs_human）完毕后才进入最终确认。
- 直接后果：方法第 9 步完整，最终确认前有独立细节建议与一致性准备。
- 用户已知的主要风险：用户曾交代「审查最好只进行一次获得异源审查建议即可」；本项使本阶段共三次审查调用。**我方对该约束的解读＝「不反复追空发现、不为同一 scope 复审」，已在本项如实登记并由用户以选项选择确认**——不得把该解读写成用户原话。
- 变更与处置：**定稿**本阶段独立审查的收口方式；落为 ADR-015；`## 审查处置` detail track 与 `## 最终确认` 的下一步同步（最终确认状态保持 `pending`；**历史表述，已完成**：该状态已于 2026-10-05 改为 `accepted`，见 `## 最终确认` 确认原件）。
- 关联：ADR-015；`## 审查处置` detail track（**已执行一轮 DIR-D1**，21 条 findings 已逐条处置，见 `#### 细节审查（detail track，DIR-D1）处置`）；make-decision 方法第 9 步；F-006、F-009。

### U-018 — INTEG-3 审查节奏项读法＝按现行三审查点核对，由用户以母任务 owner 身份显式裁定

> A 认可这个读法（推荐）

- 来源：CARD-10 make-decision 收口前（2026-10-05），**选项选择**（轴：INTEG-3 中「审查节奏点＝现行三审查点」这一表述是否为对 `prd.md:603` 的解释性读法；答复来源＝**提问工具**（`ask_user_question`）；question_id＝`inte3-reading`）。逐字选项标签见 V-025；上方 `>` 行为用户所选选项的界面标签原文，**答复形式＝选项选择，非自由文本口述**，不得写成用户原话引述；host-visible 绑定为**部分缺口**（无逐字自由文本，仅有选项标签与 question_id）。
- 选中项的含义：确认 INTEG-3 的审查节奏项按**现行三审查点**核对（build-plan 合并审查、build-code 每 Phase 代码审查、verify-code 终末代码审查），原「全 phase 结束集成审查」按已退役处理；`## 验收面` 用例 6 判据就此定稿，不再挂「解释性读法待裁」标记。
- 直接后果：INTEG-3 审查节奏项的授权来源由「对 `prd.md:603` 的解释性读法」补足为「用户以母任务 owner 身份作出的显式裁定」；该判据不再留有未决的待裁项。
- 用户已知的主要风险：若将来有人认为这条超出 `prd.md:603` 字面授权，INTEG-3 判据会被指为越权改写——故记录把「这是用户以母任务 owner 身份作出的裁定」与授权边界一并写死：`prd.md:603` 字面只授权 CARD-10 owner 裁定「本条是否改为『CARD-05 审查链与 CARD-09 资源/效率改动共存』」，并未字面授权把原可观察里的「SD-07 完整节奏点」换成现行三审查点；审查节奏项读法由用户以母任务 owner 身份显式裁定补足。
- 变更与处置：**定稿** INTEG-3 审查节奏项读法；落为 `### ADR-001` 末尾「授权边界注（2026-10-05，U-018/V-025 后）」；`## 验收面` 用例 6 与 `## 最终确认` 待展示项同步（该待裁状态已消解）；`## 动态 Talk 批次` 新增 T-006。
- 关联：ADR-001（授权边界注）；V-025；U-010、V-017（其授权范围仅限 E2E-2，不覆盖 INTEG-3）；`prd.md:603`（V-002）；`## 验收面` 用例 6。

## 原始需求索引

| R 编号 | U/V 原文锚点 | 决策 | 落点 |
| --- | --- | --- | --- |
| R-001 | U-002、U-003、U-008、U-013、V-001（缺口） | ADR-001、ADR-002 | 本文件 `## 验收面` 用例 4/5/6；`## 退役登记（retirement）` 新旧对应表；`## 审查处置`（方向审查材料补齐与重跑，U-008；INTEG-1 判 `unverified`，U-013） |
| R-002 | U-001、U-002、U-005、U-012 | ADR-003、ADR-006、ADR-009、ADR-011 | 本文件 `## 验收面` 用例 1–6 的执行记录要求；AC-48 对照；逐条真实入口证据映射（U-012、ADR-011） |
| R-003 | U-001、U-007、U-012 | ADR-005、ADR-009、ADR-011 | 本文件 `## 验收面` 用例 0 与执行广度、用户抽验权通路交付物；`## 非目标` 第 1/2 条 |
| R-004 | U-001、U-006、U-015、V-022 | ADR-004、ADR-008、ADR-013 | 本文件 `## 验收面` 用例 3、用例 7（含路径②证据取法，取证形态由 U-015/ADR-013 定稿为历史原件+本轮受控演练两层） |
| R-005 | U-002、U-003、U-014 | ADR-007、ADR-012 | 本文件 `## 验收面` AC-50 对照与用户抽验权通路交付物；`## 成功/失败边界`；`## 最终确认` |
| R-006 | U-001 | ADR-004 | 本文件 `## 验收面` 用例 3、AC-49 对照 |
| R-007 | U-003、U-009、U-010、U-011、U-018、V-016、V-025 | ADR-001、ADR-002、ADR-010 | 本文件 `## 退役登记（retirement）` 主表与新旧对应表（第③行「用户正式授权按现行三审查点验收」）；`## 验收面` 用例 2 证据主体（U-011、ADR-010）；`## 逐字声明层（verbatim）` 现行合同四条；`## 成功/失败边界`；`### ADR-001` 授权边界注（审查节奏项读法＝现行三审查点，U-018／V-025） |
| R-008 | U-002、U-012、U-013、U-016、U-018、V-023、V-025 | ADR-001、ADR-011、ADR-014 | 本文件 `## 验收面` 用例 4/5/6；INTEG-1 判 `unverified` 的成功/失败条件与证据（U-013）；INTEG-1 缺口去向形态（U-016/ADR-014，承接方＝无）；`## 未决项` OPEN-006；INTEG-3 审查节奏项读法（U-018／V-025，`### ADR-001` 授权边界注） |
| R-009 | U-004 | ADR-007 | 本文件 `## 非目标`；`## 范围` 约束行 |
| R-010 | U-001、U-007、U-012 | ADR-005、ADR-009、ADR-011 | 本文件 `## 未决项` OPEN-002；`## 决定` 模块 3、模块 5、模块 6 |
| R-011 | U-004 | ADR-007 | 本文件 `## 风险与延期交接`；`prd.md:658` |

## 逐字声明层（verbatim）

Talk 第 1 轮未留存用户逐字原文（见 `## 需求变更记录` 的缺口行），故 V 表对第 1 轮只登记可回读的**非用户**逐字文本（母 PRD 与现行合同原文，V-002..V-011），并显式保留用户侧缺口，不用改写摘要冒充引文。Talk 第 2 轮的三条答复为**选项选择**：用户所选选项标签是可逐字回读的界面原文，按原样登记为 V-012..V-014，并在上下文列标注「选项选择」——选项标签仍不是用户自己组织的句子，不得被当作自由文本口述回读。Talk 第 3 轮的另两条答复同为**选项选择**（轴四/轴五各选定 A（推荐项）），选项标签按原样登记为 V-015..V-016，上下文列同样标注「选项选择」。Talk 第 4 轮的四条答复（轴六选 B、轴七/轴八/轴九各选 A（推荐项））与 Talk 第 5 轮的一条（轴十选 A（推荐项））同样均为**选项选择**，选项标签按原样登记为 V-017..V-021，上下文列同样标注「选项选择」；五条都不是用户自由文本口述。Grill 第 1 批（2026-10-05）的三条答复同样是**选项选择**（G-001..G-003 各选定 A（推荐项）），经**提问工具**（`ask_user_question`）取得，选项标签按原样登记为 V-022..V-024，上下文列同样标注「选项选择」；三条都不是用户自由文本口述。CARD-10 make-decision 收口前（2026-10-05）另有一条**选项选择**（轴：INTEG-3 中「审查节奏点＝现行三审查点」这一表述是否为对 `prd.md:603` 的解释性读法；经**提问工具** `ask_user_question` 取得，question_id `inte3-reading`），选项标签按原样登记为 V-025，上下文列同样标注「选项选择」；同样不是用户自由文本口述。

| V 编号 | 说话人 | 上下文/来源 | 逐字文本 |
| --- | --- | --- | --- |
| V-001 | 用户 | Talk 第 1 轮（2026-10-05 make-decision 起草轮） | （缺口：第 1 轮无用户逐字原文留存；不得以改写摘要冒充引文。答复语义见 U-001..U-004 的「变更与处置」。第 2 轮的**选项选择**答复另见 V-012..V-014。） |
| V-002 | 母 PRD | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:603`（INTEG-3 上游变化注，2026-10-04，只注不改） | 上游变化注(2026-10-04,只注不改):CARD-09 已撤销「限制单次审查并发 provider 数」(CARD-09 decision-log D-001,FR-44/AC-44 撤销),本条中「并发限制/并发上限」的前提已不存在;本条是否改为「CARD-05 审查链与 CARD-09 资源/效率改动共存」由 CARD-10 owner 在其承接 task 中裁定。 |
| V-003 | 母 PRD | `prd.md:600-602`（INTEG-3 旧判据，作为被替代对象逐字保留） | 可观察结果:CARD-05 新审查链与 CARD-09 并发限制在同一审查基建上共存,SD-07 完整节奏点(build-plan 合并审查、每 phase、全 phase 集成、verify-code 终末代码审查)与并发上限同时成立。／失败判据:并发限制使应有审查节奏点缺失,或新审查链绕过并发限制,即失败。／证据:审查执行记录与并发采样记录的对照。owner=CARD-10。 |
| V-004 | 母 PRD | `prd.md:543`（合并依赖） | - **合并依赖**:中心化验证瓶颈,独占运行,不与任何卡并行(Group 3)。 |
| V-005 | 母 PRD | `prd.md:658`（停止规则，加固修订 R10） | CARD-10 通过后进入停止规则——只有真实用户问题或真实失败才触发新一轮修改,不做猜测式流程优化(2026-09-19 加固修订 R10) |
| V-006 | 现行工作流合同 | `workflows/make-decision/SKILL.md:38` | 三个必留审查点：build-plan 的 wh-review 合并审查、build-code 每 Phase 的 OCR 审查、verify-code 终末 OCR 审查。本阶段方向/细节及 build-prd 文档建议仍由 wh-review 执行，不另建全 Phase 集成审查。 |
| V-007 | 现行工作流合同 | `workflows/build-plan/SKILL.md:36` | 三审查点是本阶段 wh-review 合并、build-code 每 Phase OCR、verify-code 终末 OCR；make-decision/build-prd 的文档建议仍由 wh-review 按分工执行，不增加全 Phase 集成审查。 |
| V-008 | 现行工作流合同 | `workflows/build-code/SKILL.md:22`（第 8 条） | 每个 Phase 对当前 diff、完整 AC、实际执行原件和审查重点发起一次独立代码审查。正常使用 OCR；未安装条件和回退见下节。没有额外全 Phase 集成审查点，不为追空 findings 重派未变范围。 |
| V-009 | 现行工作流合同 | `workflows/build-code/SKILL.md:40` | 三审查点是 build-plan 的 wh-review 合并、每 Phase 的 OCR 代码审查、verify-code 终末 OCR 审查；文档建议仍按 wh-review 分工。review/test/history 是质量事实，缺失不能冒充完成，也不禁止同任务安全修复。实施者不自审自判质量。 |
| V-010 | 现行工作流合同 | `workflows/verify-code/SKILL.md:34` | 三必留审查点为 build-plan wh-review 合并、build-code 每 Phase OCR、本阶段终末 OCR；不恢复全 Phase 集成审查。 |
| V-011 | 母 PRD | `prd.md:557`（第一部分边界，要点摘录，非逐字全段） | CARD-10 汇集 CARD-01..09 的验收事实作为**输入引用**:对每卡核对其验收事实存在且结论未被漂白(存在性核对),不重跑各卡内部测试,也**不逐条复核各卡 AC 的内容**;用户抽验权:用户可按需抽验任何卡的任何 AC 事实,CARD-10 须提供定位与原文通路。 |
| V-012 | 用户 | Talk 第 2 轮 选项选择（2026-10-05）；轴一：E2E-2 的 RED→GREEN 取法 | A：如实走 G-2 豁免披露 + 复跑现成 oracle + 引用 CARD-09 归档原件（推荐） |
| V-013 | 用户 | Talk 第 2 轮 选项选择（2026-10-05）；轴二：关键失败路径第 2 条「审查工具不可用」的真证据来源 | A：先检索已有真实不可用原件；本轮若真出现就如实记录并披露（推荐） |
| V-014 | 用户 | Talk 第 2 轮 选项选择（2026-10-05）；轴三：verify-code 实际跑哪些 oracle | A：只跑套件直接相关的三个（card-09-session-ledger + card-04 e2e + 五阶段 e2e）（推荐） |
| V-015 | 用户 | Talk 第 3 轮 选项选择（2026-10-05）；轴四：方向审查是否重跑 | A：把已收敛的 ADR 结论写进 current_selection，重跑一次方向审查（推荐） |
| V-016 | 用户 | Talk 第 3 轮 选项选择（2026-10-05）；轴五：旧「全 phase 集成审查」的残余风险处置 | A：记录为“未验证 + 用户显式确认按现行三道审查点验收”（推荐） |
| V-017 | 用户 | Talk 第 4 轮 选项选择（2026-10-05）；轴六：E2E-2 的集成审查处置 | B 由你正式授权按现行三审查点验收 |
| V-018 | 用户 | Talk 第 4 轮 选项选择（2026-10-05）；轴七：E2E-2 证据主体 | A CARD-09 归档旅程为主 + 本卡这次执行为补充（推荐） |
| V-019 | 用户 | Talk 第 4 轮 选项选择（2026-10-05）；轴八：E2E-1 与跨卡用例取证口径 | A 逐条给真实入口证据映射（推荐） |
| V-020 | 用户 | Talk 第 4 轮 选项选择（2026-10-05）；轴九：INTEG-1 判什么 | A 判「未验证」（推荐） |
| V-021 | 用户 | Talk 第 5 轮 选项选择（2026-10-05）；轴十：最终完成宣称口径 | A 声明完成，但把未验证项写进完成宣称（推荐） |
| V-022 | 用户 | Grill 第 1 批 **选项选择**（2026-10-05，答复经**提问工具** `ask_user_question` 取得）；轴：关键失败路径②「审查工具不可用」的取证形态；对应 U-015（问题 G-001）。**答复形式＝选项选择，非自由文本口述** | A 历史原件 + 本轮受控演练（推荐） |
| V-023 | 用户 | Grill 第 1 批 **选项选择**（2026-10-05，答复经**提问工具** `ask_user_question` 取得）；轴：INTEG-1 缺口的去向形态；对应 U-016（问题 G-002）。**答复形式＝选项选择，非自由文本口述** | A 只在本卡如实记录，不动母任务（推荐） |
| V-024 | 用户 | Grill 第 1 批 **选项选择**（2026-10-05，答复经**提问工具** `ask_user_question` 取得）；轴：本阶段独立审查的收口方式；对应 U-017（问题 G-003）。**答复形式＝选项选择，非自由文本口述** | A 补跑一次细节审查，处置完再进确认（推荐） |
| V-025 | 用户 | CARD-10 make-decision 收口前 **选项选择**（2026-10-05，答复经**提问工具** `ask_user_question` 取得，question_id `inte3-reading`）；轴：INTEG-3 中「审查节奏点＝现行三审查点」这一表述是否为对 `prd.md:603` 的解释性读法；对应 U-018。**答复形式＝选项选择，非自由文本口述；无逐字自由文本（host-visible 绑定部分缺口）** | A 认可这个读法（推荐） |

## 原始声明层

原始用户声明、调研原文与已确认事实只在此处保留可回读引用，后续 ADR 只引用它们，不复制成第二份正文。

- Talk 第 1 轮用户声明：**缺口**——第 1 轮无逐字原文留存，可回读来源仅为该轮的 5 项选择项答复与 2 项承接决定认可（语义见 U-001..U-004）。该缺口仍在，已在 `## 未决项` 登记为 OPEN-005。
- Talk 第 2 轮用户声明：**选项选择**三条（轴一/轴二/轴三各选定 A（推荐项）），逐字选项标签见 V-012..V-014，语义与处置见 U-005..U-007。选项标签是可逐字回读的界面原文，但不是用户自由口述，不得当作口述回读。
- Talk 第 3 轮用户声明：**选项选择**两条（轴四：把已收敛 ADR 结论写进 `current_selection` 后重跑一次方向审查；轴五：旧「全 phase 结束集成审查」记 `未验证（unverified）` + 用户显式确认按现行三道审查点验收），逐字选项标签见 V-015..V-016，语义与处置见 U-008..U-009。同样不是用户自由口述，不得当作口述回读。
- Talk 第 4 轮用户声明：**选项选择**四条（轴六：E2E-2 的集成审查处置，选 **B**；轴七：E2E-2 证据主体，选 A（推荐项）；轴八：E2E-1 与跨卡用例取证口径，选 A（推荐项）；轴九：INTEG-1 判什么，选 A（推荐项）），逐字选项标签见 V-017..V-020，语义与处置见 U-010..U-013。同样不是用户自由口述，不得当作口述回读。
- Talk 第 5 轮用户声明：**选项选择**一条（轴十：最终完成宣称口径，选 A（推荐项）；该轴由 Talk 第 4 轮轴六/轴九的答案重排后新增），逐字选项标签见 V-021，语义与处置见 U-014。同样不是用户自由口述，不得当作口述回读。
- Grill 第 1 批用户声明：**选项选择**三条（2026-10-05，答复经**提问工具**（`ask_user_question`）取得，**非自由文本口述**；G-001：关键失败路径②「审查工具不可用」的取证形态，选 A（推荐项）；G-002：INTEG-1 缺口的去向形态，选 A（推荐项）；G-003：本阶段独立审查的收口方式，选 A（推荐项）），逐字选项标签见 V-022..V-024，语义与处置见 U-015..U-017。选项标签是可逐字回读的界面原文，但不是用户自由口述，不得当作口述回读。
- 第二轮方向审查事实（只读引用）：`<task-dir>/quality/reviews/2026-10-05-014-make-decision-direction.json`（`version=wh-review-result.v1`、`status=available`、`outcome=completed`、`pair_status=complete`、`review_track=direction`、`subject_kind=document`、**12 条 findings / 1 条 blocking**）及同目录 6 份 provider `.output`（`2026-10-05-008..013-make-decision-document-provider-1..6.output`）；主题归并处置见 `## 审查处置` `DIR-R2-T1`..`T7`。
- INTEG-1 事实面（只读核实，逐条见 U-013）：蓝图原件 `docs/contracts/card-01-stage-material-interface.md` 的历史版本（46 行、sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`）与 HEAD 版本（761 字节、5 行、首行 `# 当前材料接口`、sha256 `1ab0afe45c9001e93ca95091d8bff848980c11f6f19810bd03d779214554df72`）；`runtime/task/task-topology.mjs` 在 HEAD ABSENT；CARD-06 迁移表 MT-7-078 的 NARROW/B7-P8 登记；CARD-07 `18b8134a` 的消费证据；CARD-03/04/05 无消费证据；四卡关闭时间与两次 2026-10-04 提交的时间关系。
- 第一轮方向审查事实（只读引用）：`<task-dir>/quality/reviews/2026-10-05-007-make-decision-direction.json`（`status=available`、`outcome=completed`、`pair_status=complete`、20 条 findings / 1 条 blocking）及同目录 6 份 provider `.output`（`2026-10-05-001..006-make-decision-document-provider-*.output`）；该轮材料滞后事实与处置见 U-008、`## 审查处置`。
- 母 PRD 原文：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（698 行），逐条行号见 `## 原始需求` 表第三列与 V-002..V-005、V-011。
- 现行工作流合同原文：`workflows/make-decision/SKILL.md:38`、`workflows/build-plan/SKILL.md:36`、`workflows/build-code/SKILL.md:22`、`:40`、`workflows/verify-code/SKILL.md:34`（V-006..V-010）；OCR 回退口径 `workflows/build-code/SKILL.md:28-30`。
- CARD-09 侧撤销事实（只读引用）：`specs/archive/workflowhub-thin-core-card-09-20260919/decision-log.md:498`（D-001 撤销「限制单次审查并发 provider 数」、连带 FR-44/AC-44）、`:519`（D-022 拒绝限并发要求本身）、D-044（固定 600000 ms 墙钟截止改为不得设固定墙钟截止 + ownerloss guardian/显式取消收场）、D-046（审查请求文件内嵌整份材料=真冗余，改按路径引用）。
- 母 PRD 侧同步事实：`prd.md:697` A 条（FR-44、AC-44 以「已撤销」一行标记替代原文，编号保留不复用；AC-51 收窄为只挂 FR-46）；`prd.md:692`（CARD-10 沿既有存在性核对及用户抽验权消费新增事实，总体套件/E2E/INTEG 主体、失败判据和 SD-07 历史表述不变）。

## 三级追溯链

`原始用户故事/初始需求 → 原始需求或调研 → ADR 决定`。每个 ADR 都能沿此链回读：本卡 story = 母 PRD CARD-10 卡（`prd.md:524-549`）+ Talk 第 1 轮 U-001..U-004 + Talk 第 2 轮 U-005..U-007 + Talk 第 3 轮 U-008..U-009 + Talk 第 4 轮 U-010..U-013 + Talk 第 5 轮 U-014 + Grill 第 1 批 U-015..U-017；requirement = R-001..R-011；research = F-001..F-014；ADR = ADR-001..ADR-015（其中 ADR-001 经 Talk 第 4 轮 U-013/V-020 修订，ADR-002 经 Talk 第 3 轮 U-009/V-016 与 Talk 第 4 轮 U-010/V-017 两次修订；Talk 第 4/5 轮新增 ADR-010、ADR-011、ADR-012；Grill 第 1 批新增 ADR-013、ADR-014、ADR-015，依据 U-015/U-016/U-017 与 V-022/V-023/V-024）。

### 需求框架（先选一类，再逐步回填）

- **framework（框架）**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本卡是验收/裁决型实施卡——背景（前卡已交付但缺整体判定）、问题（INTEG-3 前提消失 + 审查节奏表述冲突）、目标（按套件主体执行而非发明）、方案（证据落点/执行载体/RED 取法）、验收（套件 8 项 + AC-47..50）、扩展（停止规则）构成完整功能链；本卡无独立研究论断需要 `research` 外层。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；本卡无 `research` 子树需求（调研结果挂到 F 表并由 ADR 引用）。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-background | 背景 / 问题 | open | pending | CARD-10 owner | 存在性核对记录落 `quality/` 后回填 |
| N-problem | 问题（INTEG-3 前提消失、审查节奏冲突） | confirmed | partial | CARD-10 owner | ADR-001/ADR-002 的 grill 完成时复核 |
| N-goal | 目标 | confirmed | pending | CARD-10 owner | build-plan 产 spec 后回填验收落点 |
| N-solution | 方案 / 证据 / 裁决 | confirmed | pending | CARD-10 owner | build-plan 细化参数细节（OPEN-002）后回填 |
| N-acceptance | 验收 / 扩展 | open | pending | CARD-10 owner | verify-code 真实执行套件后回填 |

### 唯一 OI 大纲（current authority）

大纲只存在于本份 `decision-log.md`；不另建需求账本、状态机或第五份材料。`task_id: workflowhub-thin-core-card-10-20260919`，`outline_version: r0`。

#### 框架节点

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001 | false | 前卡已交付但缺整体判定（`prd.md:526`） |
| N-problem | problem | OI-002、OI-003 | false | INTEG-3 前提消失；审查节奏表述冲突 |
| N-goal | goal | OI-004 | false | 执行套件而非发明（`prd.md:530`） |
| N-solution | solution | OI-005 | false | 证据落点/执行载体/RED 取法 |
| N-acceptance | acceptance | OI-006 | false | 完成判据与阻断（AC-50 `prd.md:538`） |
| N-extension | extension | OI-007 | false | 停止规则触发（`prd.md:658`） |

#### 固定类别

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-001、OI-004、OI-005、OI-008 | false | 套件执行路径：存在性核对 → E2E-1/2/3 → INTEG-1/2/3 → 关键失败路径核对 → 完成宣称 |
| page_scope | — | true | `ui_applicability=non_ui`（`prd.md:545`），无页面/视觉范围；OI-008（母 PRD，non_ui 非目标）已显式排除 |
| data_state | — | true | 本卡不新增、不改变任何持久数据面；CARD-01..09 验收事实与原件为只读输入（`prd.md:557`）；本阶段不写 `facts.jsonl`（F-003） |
| success_failure_boundary | OI-002、OI-003、OI-006、OI-007、OI-009 | false | 失败不漂白与如实降级语义（AC-49 `prd.md:537`） |
| non_goals | OI-010 | false | 不重跑各卡测试/不逐条复核 AC/不恢复并发限制/不补回退役审查点 |
| deferred | OI-011 | false | 套件用例参数细节留本卡 build-plan（`prd.md:547`） |

#### OI 记录与消费者

```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-001
category: complete_user_flow
source: R-001 / prd.md:526
question: 前卡全部交付后，凭什么事实才能判定「整体功能真的从真实入口联通跑通」？
status: confirmed
selected_disposition: 按母 PRD 套件主体三部分执行，不新增判定口径（ADR-001/ADR-005）
impact_dimensions: [goal, acceptance]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-002
category: success_failure_boundary
source: R-008 / prd.md:603
question: INTEG-3 的「并发限制/并发上限」前提已被 CARD-09 撤销，本条判据如何裁定？
status: confirmed
selected_disposition: 改为「CARD-05 审查链与 CARD-09 资源/效率改动在同一审查基建共存」，保留编号与跨卡共存目的（ADR-001）
impact_dimensions: [scope, acceptance]
requires_user_decision: true
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-003
category: success_failure_boundary
source: R-007 / prd.md:56、prd.md:572、prd.md:600
question: 母 PRD 仍写「全 phase 结束集成审查」，与现行四个 workflow skill 的三审查点冲突，本卡按哪个判 E2E-2？
status: confirmed
selected_disposition: 按现行合同三审查点判；旧表述登记为已退役，不改母 PRD（ADR-002）
impact_dimensions: [acceptance]
requires_user_decision: true
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-004
category: complete_user_flow
source: R-001 / prd.md:530、prd.md:551
question: 套件主体已由 PRD 定稿，本卡能改什么、不能改什么？
status: confirmed
selected_disposition: 只细化用例参数细节；不得增删用例或改写失败判据（ADR-005、OPEN-002）
impact_dimensions: [scope, acceptance]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-005
category: complete_user_flow
source: R-002、R-010 / AC-48 prd.md:536
question: RED→GREEN 与执行事实从哪里取、落到哪里、由谁发起才不算脚本自证？
status: confirmed
selected_disposition: 真跑仓库现成 oracle + 引用 CARD-09 归档原件；原始件落外置 quality/；驱动脚本不进主仓 tests/ 且标注不构成自证（ADR-003、ADR-005、ADR-006）；本卡无行为变更故无新 RED→GREEN，按 G-2 豁免如实披露并补一条可失败检查（ADR-003 修订、ADR-004）
impact_dimensions: [scope, ordinary_detail]
requires_user_decision: true
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-006
category: success_failure_boundary
source: R-005 / AC-50 prd.md:538、prd.md:605
question: 什么时刻才允许声明整体完成？需要哪几份记录齐备？
status: confirmed
selected_disposition: 存在性核对记录 + 套件执行记录 + 关键失败路径核对记录三者齐备，且展示含未验证项与风险（ADR-007）
impact_dimensions: [acceptance]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-007
category: success_failure_boundary
source: R-011 / prd.md:658
question: 本卡通过后，什么条件下才允许开启新一轮修改？
status: confirmed
selected_disposition: 只有真实用户问题或真实失败才触发；不做猜测式流程优化（ADR-007）
impact_dimensions: [scope]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-008
category: complete_user_flow
source: R-001、R-008 / prd.md:555-607
question: 套件在真实入口下的完整执行路径与顺序是什么？
status: confirmed
selected_disposition: 存在性核对 → E2E-1 → E2E-2 → E2E-3 → INTEG-1/2/3 → 关键失败路径核对 → 完成宣称判定（ADR-001/ADR-004）
impact_dimensions: [scope, acceptance]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-009
category: success_failure_boundary
source: R-006 / AC-49 prd.md:537
question: 失败事实被观察到时，允许怎样处置、禁止怎样处置？
status: confirmed
selected_disposition: 如实记 failed/unverified/unavailable 并阻断完成宣称；禁止漂白/删除/改写为通过（ADR-004）；审查工具不可用路径先检索已有真实原件、本轮真出现才记录，不人为制造假失败（ADR-008）
impact_dimensions: [acceptance]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-010
category: non_goals
source: R-003、R-008 / prd.md:557、prd.md:527
question: 哪些看起来像「更彻底」的做法被明确排除？
status: confirmed
selected_disposition: 不重跑各卡内部测试、不逐条复核各卡 AC、不恢复并发限制、不补回全 phase 集成审查、不改母 PRD、不做新实现（ADR-001/ADR-002/ADR-007）；不全量跑 tests/acceptance 下所有 oracle（只跑三个直接相关，ADR-009）、不人为制造假失败（ADR-008）
impact_dimensions: [scope]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```
```yaml
task_id: workflowhub-thin-core-card-10-20260919
outline_version: r0
oi_id: OI-011
category: deferred
source: R-010 / prd.md:547
question: 套件用例的 fixture、采样命令、环境假设、N/A+reason 口径由谁在哪一步定？（`N/A+reason` 须与 `prd.md:575` 的 FR-20 测试机器产物路线建立显式锚点，见 `## 验收面` 用例 2 证据列的 FR-20 段）
status: deferred
selected_disposition: 留本卡 build-plan 细化；套件主体不得增删用例或改写失败判据（ADR-005，OPEN-002）
impact_dimensions: [ordinary_detail]
requires_user_decision: false
visible_group_id: unknown
batch_id: T-001
```

## 发散候选与可证伪大纲

模糊点在「如何在无并发上限、且母 PRD 旧表述与现行合同冲突的前提下，真实执行总体验收套件」。

| 角度 ID | 角度 | 来源 | 强度 |
| --- | --- | --- | --- |
| A-001 | 证据来源：复跑既有 oracle vs 自建场景/脚本 | internal（AC-48 `prd.md:536`） | high |
| A-002 | 核对深度：存在性核对 vs 逐条复核各卡 AC | internal（`prd.md:557`） | high |
| A-003 | 审查节奏读法：现行三审查点 vs 母 PRD SD-07 旧四段 | internal（`prd.md:56`/`:572`/`:600` vs 四个 skill） | high |
| A-004 | 冲突处置：登记退役 vs 记 N/A/删用例 vs 恢复旧机制 | internal（`prd.md:603`） | medium |

| 候选 ID | 候选 | origin | angle/source |
| --- | --- | --- | --- |
| N-001 | 按母 PRD 套件主体执行，只细化参数细节；证据取现成 oracle + CARD-09 归档原件 | user | U-001 |
| N-002 | 自建端到端场景与脚本，作为本卡新产生的 RED→GREEN | internal | A-001 |
| N-003 | 重跑各卡内部测试、逐条复核各卡 AC，作为「更彻底」的核对 | internal | A-002 |
| N-004 | 按 SD-07 旧四段（含全 phase 结束集成审查）判 E2E-2 | internal | A-003 |
| N-005 | INTEG-3 记 N/A 或删除该用例 | internal | A-004 |
| N-006 | 恢复「限制单次审查并发 provider 数」并改名保留 | internal | A-004 |

| 假设 ID | 大纲版本 | 假设 | 状态 |
| --- | --- | --- | --- |
| H-001 | r0 | 独立复跑仓库现成 oracle + 引用 CARD-09 归档原件，足以提供本卡可核对的 RED→GREEN 事实（不声称本卡产生 RED→GREEN） | supported |
| H-002 | r0 | 自建脚本可以替代既有 oracle 提供「真实入口」证据 | falsified |
| H-003 | r0 | 在不改母 PRD 的前提下，可用显式新旧对应表按现行三审查点验收 E2E-2 | supported |
| H-004 | r0 | CARD-09 资源/效率改动对审查链的影响，可通过原件对照判定（而非只能事后推断） | unresolved |
| H-005 | r0 | Group 0 冻结的阶段/材料接口蓝图原件可在仓库或外置目录定位（INTEG-1 证据侧） | supported |
| H-006 | r0 | Talk 第 1/2 轮答复可在无**用户自由文本**逐字原文留存的情况下被接受为 approval_binding（第 2 轮三条**选项选择**的选项标签已逐字留存于 V-012..V-014） | unresolved |
> **H-005 推翻依据**：蓝图原件已定位——`git show d1097711:docs/contracts/card-01-stage-material-interface.md`，sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`（U-013）。

```json
{
  "schema_version": "workflowhub-decision-divergence.v1",
  "oi_outline_version": "r0",
  "intake": {
    "raw_requirement": {"text": "执行母 PRD 定稿的「具体重构验收标准」套件：E2E-1/2/3 真实执行 + 跨卡集成场景 + 关键失败路径核对；真实入口联通实跑后才声明整体完成", "attribution": "gap", "source_id": "V-001", "attribution_note": "本条为缺口：Talk 第 1 轮无用户逐字原文留存（V-001），不得当作 user_verbatim 回读"},
    "pain_point": {"text": "INTEG-3 的并发限制前提已被 CARD-09 撤销；母 PRD 旧 SD-07 表述与现行三审查点合同冲突；证据落点与执行载体若无口径易滑向脚本自证", "attribution": "upstream_document", "source_id": "V-002", "attribution_note": "来源＝母 PRD 原文（prd.md:603 上游变化注，V-002），非用户逐字"}
  },
  "angles": [
    {"angle_id": "A-001", "plain_language_angle": "RED→GREEN 事实该从既有 oracle 取还是本卡自建脚本产生", "source": "internal analysis", "strength": "high"},
    {"angle_id": "A-002", "plain_language_angle": "各卡验收事实该核到「存在且未漂白」还是逐条复核内容", "source": "internal analysis", "strength": "high"},
    {"angle_id": "A-003", "plain_language_angle": "E2E-2 的审查节奏该按现行三审查点还是母 PRD 旧四段判", "source": "internal analysis", "strength": "high"},
    {"angle_id": "A-004", "plain_language_angle": "与母 PRD 旧表述冲突时该登记退役、记 N/A 还是恢复旧机制", "source": "internal analysis", "strength": "medium"}
  ],
  "original_candidates": [
    {"candidate_id": "N-001", "text": "按母 PRD 套件主体执行，只细化参数细节；证据取现成 oracle + CARD-09 归档原件", "source_id": "U-001", "semantic_basis": {"problem_axis": "证据真实性", "mechanism": "复跑既有 oracle", "target": "总体验收套件", "outcome": "可核对且不脚本自证"}}
  ],
  "candidates": [
    {"candidate_id": "N-001", "text": "按母 PRD 套件主体执行，只细化参数细节；证据取现成 oracle + CARD-09 归档原件", "origin": "user", "source_ids": ["U-001"], "strength": "direct", "semantic_basis": {"problem_axis": "证据真实性", "mechanism": "复跑既有 oracle", "target": "总体验收套件", "outcome": "可核对且不脚本自证"}},
    {"candidate_id": "N-002", "text": "自建端到端场景与脚本作为本卡新产生的 RED→GREEN", "origin": "internal", "angle_id": "A-001", "source_ids": ["A-001"], "novelty_against": ["N-001"], "changed_dimensions": ["mechanism"], "strength": "medium", "semantic_basis": {"problem_axis": "证据真实性", "mechanism": "自建脚本", "target": "RED→GREEN 事实", "outcome": "脚本自证"}},
    {"candidate_id": "N-003", "text": "重跑各卡内部测试并逐条复核各卡 AC", "origin": "internal", "angle_id": "A-002", "source_ids": ["A-002"], "novelty_against": ["N-001"], "changed_dimensions": ["scope"], "strength": "medium", "semantic_basis": {"problem_axis": "核对深度", "mechanism": "逐条复核", "target": "各卡 AC", "outcome": "变成门禁机"}},
    {"candidate_id": "N-004", "text": "按 SD-07 旧四段（含全 phase 结束集成审查）判 E2E-2", "origin": "internal", "angle_id": "A-003", "source_ids": ["A-003"], "novelty_against": ["N-001"], "changed_dimensions": ["acceptance"], "strength": "medium", "semantic_basis": {"problem_axis": "审查节奏读法", "mechanism": "按历史表述判失败", "target": "E2E-2 度量", "outcome": "与现行合同冲突"}},
    {"candidate_id": "N-005", "text": "INTEG-3 记 N/A 或删除该用例", "origin": "internal", "angle_id": "A-004", "source_ids": ["A-004"], "novelty_against": ["N-001"], "changed_dimensions": ["scope"], "strength": "medium", "semantic_basis": {"problem_axis": "冲突处置", "mechanism": "删用例/记 N/A", "target": "INTEG-3", "outcome": "违反 AC-47"}},
    {"candidate_id": "N-006", "text": "恢复并发上限并改名保留", "origin": "internal", "angle_id": "A-004", "source_ids": ["A-004"], "novelty_against": ["N-001"], "changed_dimensions": ["mechanism"], "strength": "low", "semantic_basis": {"problem_axis": "冲突处置", "mechanism": "恢复已撤销机制", "target": "INTEG-3 判据", "outcome": "违反 CARD-09 D-001/D-022"}}
  ],
  "outlines": [
    {"outline_version": "r0", "status": "active", "hypotheses": [
      {"hypothesis_id": "H-001", "statement": "独立复跑现成 oracle + 引用 CARD-09 归档原件足以提供可核对 RED→GREEN 事实", "status": "supported", "falsifier": "记录显示 RED→GREEN 由本卡新写脚本产生而非独立复跑既有 oracle", "evidence_refs": ["F-005", "ADR-003"]},
      {"hypothesis_id": "H-002", "statement": "自建脚本可替代既有 oracle 提供真实入口证据", "status": "falsified", "falsifier": "AC-48 禁止脚本自证冒充（prd.md:536）", "evidence_refs": ["prd.md:536", "ADR-006"]},
      {"hypothesis_id": "H-003", "statement": "不改母 PRD 也可用显式新旧对应表按现行三审查点验收 E2E-2", "status": "supported", "falsifier": "四个现行 skill 若仍含全 phase 集成审查，则对应表不成立", "evidence_refs": ["V-006", "V-007", "V-008", "V-009", "V-010", "ADR-002"]},
      {"hypothesis_id": "H-004", "statement": "CARD-09 资源/效率改动对审查链的影响可由原件对照判定", "status": "unresolved", "falsifier": "原件不含取消/清理或 provider 归属事实，无法对照", "evidence_refs": ["RISK-005", "ADR-001"]},
      {"hypothesis_id": "H-005", "statement": "Group 0 冻结的阶段/材料接口蓝图原件可定位", "status": "supported", "falsifier": "（已推翻）仓库与外置目录均无该蓝图原件", "evidence_refs": ["OPEN-001", "prd.md:126"]},
      {"hypothesis_id": "H-006", "statement": "无用户自由文本逐字原文留存的 Talk 答复可作为 approval_binding（第 2 轮选项标签已逐字留存）", "status": "unresolved", "falsifier": "最终确认要求 host-visible 绑定，而第 1 轮无逐字留存、第 2 轮仅有选项标签", "evidence_refs": ["OPEN-005", "V-001", "V-012", "V-013", "V-014"]}
    ]}
  ]
}
```

## 目标

- 按母 PRD 定死的套件主体，**执行而非发明**「具体重构验收标准」：第一部分存在性核对（CARD-01..09 事实存在且未漂白）+ 用户抽验通路；第二部分 E2E-1/2/3 真实入口逐条执行；第三部分 INTEG-1/2/3 与关键失败路径核对（`prd.md:530`、`:551`、`:553`）。
- 任一套件内用例失败即整体不完成；存在性核对不合格同样阻断完成宣称（`prd.md:531`、`:607`）。
- 完成宣称只发生在真实入口联通实跑 + 约定成功条件达成 + 关键失败路径核对之后，并展示实际改动、验证结果、**未验证项与风险**（`prd.md:533`、`:538`）。
- 不改母 PRD 正文、不改 workflow 合同、不新增/删除套件用例、不改写失败判据、不做新实现（`prd.md:549` 第③条、`:547`）。

## 验收面（本卡验收标准：套件 8 项 + AC-47..50）

套件主体以母 PRD 为准（`prd.md:551`、`:553`）；下列 8 项为 CARD-10 的验收标准，逐项含「可观察用例 / 成功条件 / 失败条件 / 证据 / 承接负责人」。**不得增删用例或改写失败判据**（`prd.md:547`）。第 0 项是输入核对（非用例），第 1–7 项中第 1–6 项为套件内用例，任一失败即整体不完成（`prd.md:607`）。

**术语对齐（F-014）**：母 PRD `:553` 明确「第一部分是整体完成的**输入核对**（存在性核对，**不是用例**）」；本表沿用「0 号」**仅为编号便利**，其性质是**输入引用核对**，**不适用「套件内用例失败」的失败判据**，而适用 `prd.md:557` 的「输入不合格 → 整体不得声明完成」。本卡验收面因此读作：**输入核对（0 号）+ 套件内用例 1–7**。

> 证据形态（ADR-011）：每条证据须含命令、exit code 与 output 落点；跑不了的部分显式标 unverified，不得以静态归档路径冒充真实执行记录。

### 用例 0（输入核对，非用例）：前卡输入核对（第一部分；存在性核对）

- **可观察用例**：逐卡（CARD-01..09）定位其验收事实与验收结论原件，核对事实存在且结论未被漂白；**不重跑各卡内部测试、不逐条复核各卡 AC 内容**（`prd.md:557`）。
- **成功条件**：每卡验收事实存在、结论未被漂白，核对记录齐备；用户按需抽验任一 AC 时，CARD-10 能提供定位与原文通路。**「结论未被漂白」的可机械核验定义**（逐卡执行，命令与 exit code 与 output 落本卡外置 `quality/`）＝①该卡外置 `facts.jsonl` 末行为 `stage=close` 记录；②该卡外置 `quality/` 下审查点原件存在（按该卡实际审查点数）；③该卡 `quality/` 与 `facts.jsonl` 中不存在把 `failed`/`unavailable`/`missing`/`unverified` 记为 `passed`/`succeeded` 的记录（对终态字段做检索与计数，逐卡给出计数与命中清单）；④用户抽验时提供的定位通路能实际打开原文。四项逐卡给出可复现命令与 exit code。
- **失败条件**：任一卡验收事实缺失或存在漂白/伪造 → 输入不合格，整体不得声明完成（`prd.md:557`、`:607`）；把逐条复核各卡 AC 内容当作整体完成条件亦为失败（AC-47，`prd.md:535`）。
- **证据**：外置任务目录 CARD-01..09 的 `facts.jsonl` 与 `quality/`（`<task-dir>/workflowhub-thin-core-card-0X-20260919/`；CARD-01..08 已核实在位）+ 仓库归档 `specs/archive/workflowhub-thin-core-card-0X-20260919/`；核对记录落本卡外置 `quality/`。
- **执行广度**（Talk 第 2 轮轴三，U-007、ADR-009）：只跑三个与套件直接相关的 oracle（`tests/acceptance/card-09-session-ledger.mjs`、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`）；**其余 CARD-01..09 只做原件存在性核对 + 归档引用**，不逐条复核各卡 AC 内容（AC-47 `prd.md:535`、`prd.md:557`）。
- **承接负责人**：CARD-10。

### 用例 1：E2E-1 规划旅程端到端（`prd.md:561-567`）

- **前置**：本 PRD 最终确认版就位；宿主环境可用（`prd.md:563`）。
- **可观察用例**：经宿主真实任务发起入口人工选择「规划任务」，任务只经 make-decision→build-prd 两阶段完成，产出 PRD 与任务地图，无第三阶段。（F-013②：planning 的 `facts.jsonl` 恰好 1 行、`stage` 取值全集＝`{make-decision}`，`build-prd` 从未作为 stage 行出现，只以 `quality/evidence/portable-workflow-outcomes/build-prd/` 产出形式存在——与蓝图 L21 一致，支持本项而非缺陷。）
- **成功条件**：阶段序列＝规划拓扑（母 PRD 的 U-008，`prd.md:19`/`:240`；注意与本文件局部 U-008 不同域）；规划旅程阶段事实＝make-decision 为唯一 stage 行；build-prd 以 portable workflow 产出形式存在、不作为第六正式阶段（依据 CARD-01 阶段与材料接口蓝图 L21）；不得出现 build-plan / build-code / verify-code 任一阶段。PRD 经真实最终确认（非自称）。
- **失败条件**：出现 build-plan/build-code/verify-code 任一阶段，或 PRD 未经真实确认即标 final（`prd.md:566`）。
- **证据（真实入口证据映射，Talk 第 4 轮轴八 U-012、ADR-011）**：逐条给出真实入口证据，而非「归档复用 + 存在性核对」的降级读法（依据 `prd.md:567` E2E-1 证据句）；每条记录 exit code，output 一律落本卡外置 `quality/tests/`（仓库不复制，ADR-005）——①**真实阶段事实**：命令 `cat <task-dir>/workflowhub-thin-core-rebuild-planning-20260919/facts.jsonl`（记录 exit code 与 output 落点）——阶段序列与时间戳；②**交互与确认事实**：命令 `ls <task-dir>/workflowhub-thin-core-rebuild-planning-20260919/quality/confirmations/`（实存 **6 份**，文件名为 64 位 sha256 形字符串：`1cbf64fe….json`、`5472fd25….json`、`5d52bcff….json`、`5eaee570….json`、`785d0a56….json`、`8eceb273….json`）＋逐份读取 `subject_ref`（记录 exit code 与 output 落点）；母 PRD 最终确认节（`prd.md:208`、`:225`）——**这 6 份确认无一 `subject_ref` 指向 `prd.md`，故它们不是 PRD 的最终确认原件（PRD 确认原件见下一条）**；③**PRD 确认原件**：读 `<task-dir>/workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/portable-workflow-outcomes/build-prd/8da4882ea75778316284cdffb4c92139e51a230f7ec94ac9eafc412f8fd8c8b4.json` 的 `reply_text` / `human_approved` / `display_before_reply`（记录 exit code 与 output 落点）；④**PRD 决定版本核对**：命令 `sed -n '3p' specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` ＋ `shasum -a 256` 同文件（各记录 exit code 与 output 落点）；PRD 确认绑定的是 `Decision revision: revision-9ede5110c44f2b08ae6fe31b4709eabe9a3f22daeba5772293fe2d7ae96fb0fb`，**与当前 `prd.md:3` 逐字一致**；当前 PRD 字节 sha256 与确认记录中的 `f05577c3…` 不一致，原因已定位＝2026-10-04 追加的「只注不改」上游变化注（`prd.md:603`）发生在确认之后，属事后注记、不改变已确认决定。**这是真实历史执行记录，不是存在性核对**（审查方第二轮 findings #2 为 blocking，处置见 `## 审查处置` `DIR-R2-T1`）；跑不了的部分如实标 `unverified`。**两处必须如实披露的发现（F-013）**：**发现 A（字节指纹变化、原因已定位）**——PRD 当前 sha256＝`deb2da5620e5fd97b52028d810b2ee6bcc1c6c090360d8696a7c2ede15257905`（698 行 / 140544 字节），与确认时记录的 `f05577c3…`、`51d8764e…` **均不匹配**；原因是 2026-10-04 那次「只注不改」的上游变化注（`prd.md:603` 的 INTEG-3 前提失效注）**在确认之后追加**；而确认绑定的 `Decision revision: revision-9ede5110c44f2b08ae6fe31b4709eabe9a3f22daeba5772293fe2d7ae96fb0fb` 与当前 `prd.md:3` **逐字一致**（planning worktree 已删除，无法回算被绑定字节）。**发现 B（阶段序列）**——planning 的 `facts.jsonl` **恰好 1 行**、`stage` 取值全集 ＝ `{make-decision}`、`build-plan`/`build-code`/`verify-code` **从未出现**；**`build-prd` 也从未作为 stage 行出现**，只以 `quality/evidence/portable-workflow-outcomes/build-prd/` 产出形式存在——这与接口蓝图 L21「`build-prd` 是规划任务的 portable workflow…不成为第六正式阶段」一致，故**支持** E2E-1 而非缺陷。**两处均为如实披露，不据此判 E2E-1 失败、不改其失败判据**（完整事实见 F-013）。
- **承接负责人**：CARD-10。

### 用例 2：E2E-2 实施旅程端到端（`prd.md:569-575`）

- **前置（finding #20）**：真实入口启动前，至少一张实施卡材料须已在位并记录其身份——本轮取 CARD-09 归档材料（`specs/archive/workflowhub-thin-core-card-09-20260919/` 与 `<task-dir>/workflowhub-thin-core-card-09-20260919/` 的 decision-log / spec / phases 与 `quality/`），并在记录中写明启动前已在位。
- **可观察用例**：同一真实任务发起入口人工选择「实施/普通任务」，任务走完 make-decision→build-plan→build-code→verify-code 四阶段；含真实 RED→GREEN 或 G-2 豁免披露（SD-06 `prd.md:51`：纯文档/探索性改动才可豁免，且必须补一条可失败检查，或写明豁免理由与风险并在验收中披露）；三审查点各有真实执行记录；推进与审查派发不被机器校验（revision/快照/材料身份/哈希/回执）阻断（SD-17 `prd.md:96`）。
- **成功条件**：**判定对象＝两个具名真实实例，逐实例核四阶段事实**：**主实例＝CARD-09 归档实施旅程**（历史实例；四阶段原件 `2026-10-04-051-build-plan-document.json`、`2026-10-05-005-build-code-phase-p1.json`、`2026-10-05-010-build-code-phase-p2.json`、`2026-10-05-017-verify-code-document.json`）——用于满足「四阶段齐备且顺序正确 + 三审查点各有真实执行原件」；**补充实例＝CARD-10 本次实施旅程**（当前实例；本阶段不写 `facts.jsonl` 见 F-003，以交互与阶段事实记录为准；本卡 build-code 无新实现、不拆 Phase，故不产出 phase 级代码审查原件——事实而非缺失）——用于满足「同一真实入口本次可走通」。四阶段齐备且顺序正确；每阶段有真实执行事实（命令、exit、output 位置或交互记录）；**RED→GREEN 按 G-2 豁免如实披露**——写明「本卡无行为变更，故无新 RED→GREEN」、补一条可失败的检查（由 E2E-3 注入的真实测试失败充当，ADR-004）、复跑仓库现成 oracle 取得真实执行事实、并引用 CARD-09 归档的真实 RED→GREEN 原件作为历史事实；披露须含豁免理由与风险（SD-06 `prd.md:51`、ADR-003）；**证据主体与审查节奏按 Talk 第 4 轮轴七/轴六口径**（U-011、U-010；ADR-010、ADR-002 第二次修订）。 **独立功能验收记录（finding #9）**：verify-code 的功能验收记录必须与终末代码审查**分开**成件——前者含功能验收所用的真实入口/命令或交互、结果、output 或 oracle 落点；后者是终末独立代码审查原件。缺少独立功能验收记录、或以代码审查冒充功能验收，本用例失败。
- **失败条件**：缺任一阶段或真实执行事实；以代码审查冒充功能验收；整体完成宣称先于真实入口联通实跑（`prd.md:574`）；**G-2 豁免披露不完整（缺「无行为变更」声明、缺可失败检查、缺「独立复跑」界限）或直接跳过**（SD-06、AC-48 `prd.md:536`）。
- **证据（证据主体，Talk 第 4 轮轴七 U-011、ADR-010）**：**主证据＝CARD-09 归档的真实实施旅程**四阶段审查原件——`<task-dir>/workflowhub-thin-core-card-09-20260919/quality/reviews/` 下四项（已核实逐字存在）：`2026-10-04-051-build-plan-document.json`、`2026-10-05-005-build-code-phase-p1.json`、`2026-10-05-010-build-code-phase-p2.json`、`2026-10-05-017-verify-code-document.json`；**补充活证据＝CARD-10 自身本次四阶段执行**（外置 `facts.jsonl` + `quality/reviews/`，本阶段不写 `facts.jsonl` 见 F-003）。**如实标注：本卡 build-code 无新实现、不拆 Phase（`prd.md:549` 第③条），故不产出 phase 级代码审查原件——这是事实，不是缺失**，不得据此判 E2E-2 失败或记 N/A。**审查节奏按用户正式授权的现行三审查点验收**（Talk 第 4 轮轴六 U-010/V-017、ADR-002 第二次修订）。**三个 oracle 的执行记录口径**（Talk 第 2 轮轴三，U-007、ADR-009）：`node tests/acceptance/card-09-session-ledger.mjs`、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` 各自的命令、exit 与 output 位置落本卡外置 `quality/tests/`；G-2 豁免披露记录落本卡外置 `quality/evidence/`。**不跑 `tests/acceptance/` 下其余 oracle，也不跑 `tests/` 下其他测试。** **测试机器产物路线（`prd.md:575` FR-20）**：按路线适用——trace / JUnit / 跳过计数路线适用时为必需；不适用时记 `N/A` ＋ `reason`。本轮的适用判定、`N/A` 与 `reason` 须逐条落本卡外置 `quality/tests/`，并与 `prd.md:575` 建立显式锚点。
- **承接负责人**：CARD-10。

### 用例 3：E2E-3 失败不漂白路径（`prd.md:577-583`）

- **前置**：E2E-2 环境可用（`prd.md:579`）。
- **可观察用例**：在 E2E-2 同类环境中**注入或选取**一次真实失败（真实测试失败 / 审查工具不可用且无独立替代可用）（`prd.md:578` 同宽）；「审查工具不可用」分支的核对记录见 `## 验收面` 用例 7 路径②；本轮按 ADR-004 采用注入真实测试失败。
- **成功条件**：失败如实记为 failed/unverified/unavailable，不被改写为通过；存在失败用例时整体不被声明完成；失败事实原文保留可查；完成宣称被阻断或如实降级。 **本用例区分两个事实（finding #10）**：①**被保留的初始失败事件**（原始 failed 原件，不删除、不改写）；②**本用例的终态＝注入的失败被修复后复验通过**。不得因「曾出现失败」判本用例失败，也不得因复验通过而删除或漂白初始失败事实。
- **失败条件**：任一失败事实被漂白、删除或改写为通过（`prd.md:582`）。
- **证据**：失败记录与完成宣称记录的对照（同一事实两处表述一致，`prd.md:583`）；落本卡外置 `quality/tests/` 与 `quality/evidence/`。
- **承接负责人**：CARD-10。

### 用例 4：INTEG-1 接口蓝图跨卡消费（`prd.md:589-592`）

- **可观察用例**：Group 0 串行基座（CARD-01 → CARD-02，其阶段拓扑与材料契约即全部后续卡的接口蓝图，`prd.md:126`）的冻结接口被 Group 1（CARD-03、04、05、07，`prd.md:127`）与 Group 2（CARD-06 → CARD-08、CARD-09，`prd.md:128`）各卡实际消费，无静默偏离。
- **判据终态**：**`unverified`**（Talk 第 4 轮轴九 U-013/V-020、ADR-001 修订）——不是 `passed`，也不是 `failed`。
- **成功条件**（两条同时成立）：①**无静默偏离**——没有任何 Group 1 卡改动蓝图本体或其 owner 文件；②**各卡有消费证据**——Group 1 各卡对冻结接口的消费点有行为级或文档级对照记录。
- **失败条件**：任一 Group 1 卡偏离冻结接口且无 G-1 记录（`prd.md:591`）。
- **当前事实**：①成立（CARD-07 `phases/P1.md:86` 显式 DO NOT TOUCH；蓝图与 `runtime/task/task-topology.mjs` 的消失是 CARD-06 迁移表 **MT-7-078** 登记过的 NARROW/B7-P8 处置，非静默偏离）；②**只 1/4 张卡有行为级证据**（CARD-07 提交 `18b8134a3e42b2707f1823f029e4d593a894daf0` 在 `runtime/stage/stage-context.mjs` 新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`；CARD-03/04/05 无消费证据）；故 `prd.md:590` 未完全满足、`prd.md:591` 未触发 → 判 `unverified`。
- **成功条件②未完全满足时的处置**：成功条件②未完全满足时本用例记 `unverified`（不新增失败判据、不改写 `prd.md:591`；`prd.md:553` 明禁改写失败判据）。
- **证据**：冻结接口蓝图与各卡消费点的对照记录（`prd.md:592`）——蓝图原件 `docs/contracts/card-01-stage-material-interface.md`（历史 46 行、sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`；HEAD 已被重写为 761 字节、5 行、首行 `# 当前材料接口`、sha256 `1ab0afe45c9001e93ca95091d8bff848980c11f6f19810bd03d779214554df72`）；完整事实清单见 U-013 第 1–7 条。 **对照记录实际使用的只读命令形态（finding #13）**：`git log -S 'from "../task/task-topology.mjs"' -- runtime/stage/stage-context.mjs`、`git show d1097711:docs/contracts/card-01-stage-material-interface.md`、对 CARD-03/04/05/07 外部 `quality/` 树的关键词检索；每条须记录 exit code，output 落外置 `quality/`（ADR-011）。
- **缺口去向**：**承接方＝无；只在本卡如实记录（OPEN-006），不写母任务层面文件、不出具母 PRD 用词修正建议**（U-016／ADR-014）。本卡不改 PRD、不新增消费义务。
- **承接负责人**：CARD-10。
- **不得**：删除用例、记 N/A、恢复并发限制（ADR-001）。
- **原件定位**：已定位（原 OPEN-001、H-005 由 U-013 回答；见 `## 未决项`）。

### 用例 5：INTEG-2 make-decision 共享写面共存（`prd.md:594-597`）

- **可观察用例**：CARD-04 验收写入步契约与 CARD-07 头脑风暴平台改造在 make-decision 同一步骤共存（共享写面关系见 `prd.md:127`）。
- **成功条件**：契约一致、互不覆盖。
- **失败条件**：一方改动覆盖另一方契约，或两契约对同一步骤声明不一致（`prd.md:596`）。
- **证据**：验收写入步契约与平台改造记录的对照（`prd.md:597`）；CARD-04 外置 `quality/{decisions,oracle}`、CARD-07 外置 `quality/`。 **INTEG-2 的定向 oracle 执行（finding #11；ADR-011②、ADR-009）**：命令形态 `node --test tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（**单文件定向执行**；build-plan 可细化参数，但不得换成全量回归）；须记录 exit code 与 output 落点（落外置 `quality/tests/`，仓库不复制）；并保留 CARD-04 验收写入步契约与 CARD-07 头脑风暴改造原件的对照。
- **承接负责人**：CARD-10。

### 用例 6：INTEG-3 审查基建共享写面共存（按 ADR-001 更新判据，编号与目的保留）

- **可观察用例**：CARD-05 新审查链与 CARD-09 资源/效率改动在**同一审查基建**上共存（共享写面关系见 `prd.md:127`）——CARD-09 的孤儿回收（含解除 broker 自写只读目录）、写入量削减、provider 无固定墙钟截止/显式取消 + ownerloss 收场，不破坏 CARD-05 审查链与 SD-07 节奏点。
- **成功条件**：三审查点各有真实执行原件；资源/效率改动前后审查链仍产出可消费结果（provider 归属、原始失败、取消/清理事实保留）；回收动作不误删在途审查材料。**判据更新的授权依据（finding #5）**：INTEG-3 中「审查节奏点＝现行三审查点」这一表述的授权依据写 `prd.md:603`——该上游变化注明确把 INTEG-3 的判据更新**授权给 CARD-10 owner 在其承接 task 中裁定**；用户对「旧全 phase 结束集成审查按现行三审查点验收」的正式授权（U-010/V-017、ADR-002 第二次修订）**范围只限 E2E-2**，**不覆盖 INTEG-3**。母 PRD `:600` 字面的「全 phase 结束集成审查」按 `## 退役登记（retirement）` 已退役，INTEG-3 不机械补回；该退役对 INTEG-3 的适用性来自 `prd.md:603` 的裁定授权，不来自 ADR-002。（该读法属解释性，已列入 `## 最终确认` 待展示项，须由用户真实答复确认或改判。）（后续：该待裁状态已消解——2026-10-05 由用户以母任务 owner 身份经提问工具 `ask_user_question`（question_id `inte3-reading`）真实裁定，见 U-018／V-025，选项选择逐字 `A 认可这个读法（推荐）`；INTEG-3 审查节奏项按现行三审查点核对就此定稿，不再挂「解释性读法待裁」标记。）
- **失败条件**：资源/效率改动致应有审查点缺失、审查材料被误删、或 provider 失败被写成通过。
- **证据**：按 ADR-011③**显式标注**——INTEG-3 没有现成可跑的共存 oracle（`tests/acceptance/` 下无 CARD-05/审查链共存用例），故「可实跑部分」与「只能对照的部分」分开写：**可实跑部分**＝对 CARD-09 `quality/reviews/` 四份审查原件与 CARD-09 资源/效率验收原件做**存在性与结论对照**（写明所用的 `git grep`/`node -e` 一类只读命令形态、exit code 与 output 落点，落外置 `quality/`）；**无现成 oracle 的共存断言部分显式标 `unverified`**，并按 ADR-012 口径进入完成宣称。
- **承接负责人**：CARD-10。
- **不得**：删除用例、记 N/A、恢复并发限制（ADR-001）。
- **上游依据**：`prd.md:603`（V-002）；CARD-09 侧 `specs/archive/workflowhub-thin-core-card-09-20260919/decision-log.md:498`（D-001）、`:519`（D-022）、D-044。

### 用例 7：关键失败路径核对（SD-05 三条；`prd.md:605`）

- **可观察用例**：对 SD-05 约定的三条关键失败路径逐条留核对记录——①真实测试失败被修复并复验；②审查工具 unavailable 时独立替代或 unverified 披露；③去阻断后历史失败事实未漂白。
- **成功条件**：三条各有核对记录，且与原件对照一致。
- **失败条件**：缺任一条核对记录，整体不得声明完成（`prd.md:605`）。
- **证据**：三条核对记录 + 对应原件（①落 `quality/tests/`；②落 `quality/reviews/`，OCR 回退口径见 `workflows/build-code/SKILL.md:28-30`；③落 `quality/evidence/` 与历史失败事实对照）。**路径②的真证据取法**（Talk 第 2 轮轴二，U-006、ADR-008）：先检索 CARD-09 与规划任务已有真实不可用原件（只读引用）；本轮执行中若真实出现 provider 不可用/失败，如实记录并披露 unverified；本轮若确实未出现，如实记「本轮未出现该情形」并说明替代核对面＝CARD-09 归档原件，不冒称亲历；**禁止人为制造假失败**（排除「把 provider 指向不存在目标」这类做法）。**路径②可用的历史真实原件（F-012）**：CARD-05 共 **26 份 `OCR_DELEGATION_UNAVAILABLE`** + CARD-04 共 **2 份 `OCR_ALL_PROVIDERS_FAILED`** 可作为**历史事实**引用（代表件与字段见 F-012）。**同时必须如实写明**：**「独立替代审查真的顶班」在归档中从未发生**——全归档没有任何一份「`ocr` 命令不存在（ENOENT）或版本低于 1.12.9 → 真的执行了独立替代审查」的原件（F-012 边界事实 i），且母 PRD `:60`（SD-08）自述旧 wh-review/broker 路径**仅为只读历史证据、不是可执行 fallback**（F-012 边界事实 ii）。

> 取证形态已定稿（G-001→A，ADR-013）：历史真实原件（F-012）+ 本轮受控演练两层并用；本轮执行载体＝`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（受控故障注入，须如实标注）；「独立替代审查真的顶班」在归档中从未发生这一事实必须同时写入核对记录。
- **承接负责人**：CARD-10。

### AC 对照（AC-47..AC-50）

- **AC-47**（`prd.md:535`）：套件三部分齐备（存在性核对+抽验权、E2E-1/2/3、跨卡集成场景与关键失败路径核对），每条用例含可观察用例+所需证据+承接负责人，执行所用套件与 PRD 所载主体一致（无临时增删用例或改写失败判据），存在性核对覆盖 CARD-01..09 全部卡。**失败场景**=任一条目缺要素、临时发明/增删用例，或把逐条复核各卡 AC 内容当作整体完成条件。
- **AC-48**（`prd.md:536`）：套件内每条用例有真实入口执行记录（命令、exit、output 位置），无脚本自证冒充；各卡验收事实存在性核对记录齐备。**失败场景**=任一用例无真实执行记录。
- **AC-49**（`prd.md:537`）：注入或发现任一**套件内用例**失败时，整体不被声明完成且失败如实记录不漂白。**失败场景**=存在失败的套件内用例仍宣称整体完成。
- **AC-50**（`prd.md:538`）：完成宣称前三记录齐备（存在性核对记录、套件执行记录、关键失败路径核对记录），且展示含未验证项与风险。**失败场景**=缺任一记录即宣称完成，或展示无未验证项披露。
- **执行纪律**（`prd.md:607`）：任一套件内用例（E2E/INTEG）失败即整体不完成；第一部分存在性核对不合格同样阻断完成宣称。

### 交付物：用户抽验权通路（依据审查方第二轮 findings #8 与 `prd.md:557`）

`prd.md:557`（V-011）载「**用户抽验权**：用户可按需抽验任何卡的任何 AC 事实，CARD-10 须提供定位与原文通路」；审查方第二轮方向审查 findings #8 指出该通路此前没有可交付物，细节审查 finding #7 进一步指出**不得要求前置编制全量对照表**。故本项交付物形态＝**定位指引规则 ＋ 检索通路说明**（**不是新用例**，不增删套件用例、不改失败判据，`prd.md:547`）：

| 交付物 | 内容 | 形态 | 落点 |
| --- | --- | --- | --- |
| **用户抽验权通路** | **定位指引规则**——如何按卡定位任一 AC 的原文与结论状态：①按 `specs/archive/<card>/` 与各卡外置 `<task-dir>/<card>/quality/` 的路径规则定位该卡材料与验收结论原件；②按 `prd.md` 的 AC 行号规则（AC-47..50 见 `prd.md:535-538`）定位母 PRD 原文。**检索通路说明**——用户按需提出任一卡任一 AC，CARD-10 按上述规则给出原件路径与可回读原文；只做**定位与原文引用**，**不逐条复核 AC 内容**（`prd.md:557`、AC-47 `prd.md:535`） | 定位指引规则＋检索通路说明；**不前置编制** CARD-01..09 每个 AC 的全量对照表 | 外置任务目录 `quality/evidence/`（原始件口径，ADR-005）；本文件只登记交付物与形态 |

- **承接负责人**：CARD-10。
- **失败语义（finding #7 修正）**：按 `prd.md:557`，用户可按需抽验任何 AC，CARD-10 须提供**定位与原文通路**；通路缺失、或给出的定位无法回读原文 → 视为输入不合格，整体不得声明完成（`prd.md:557`）；抽验发现的漂白或伪造按失败事实如实处理。**「未前置编制全量对照表」本身不构成整体不完成的失败条件**（该交付物约束作为失败条件的地位已解除）。
- **关联**：R-003、R-005；`## 审查处置` `DIR-R2-T5`、`DIR-D1-T8`；AC-47/AC-50 对照。

## 成功/失败边界

- **成功边界（可声明整体完成的必要条件，全部满足）**：①真实入口联通实跑记录存在（E2E-1、E2E-2）；②套件内用例逐条有真实执行记录且无失败；③存在性核对合格（CARD-01..09 事实存在且未漂白）；④关键失败路径三条核对记录齐备；⑤完成宣称展示含未验证项与风险（`prd.md:533`、`:538`、`:605`）；⑥**INTEG-1 的 `unverified` 与缺口去向（承接方＝无，只在本卡如实记录；U-016／ADR-014）被作为显式披露项写进完成宣称**（Talk 第 5 轮轴十 U-014/V-021、ADR-012）。**INTEG-1 判 `unverified` 不阻断完成宣称**——`prd.md:607` 的阻断条件是套件内用例**失败**，而 INTEG-1 的失败判据（`prd.md:591`）未触发、可观察结果（`prd.md:590`）未完全满足；⑦**关键失败路径②同时有历史真实原件与本轮受控演练记录**（Grill 第 1 批 G-001→A、U-015/V-022、ADR-013）——F-012 的历史不可用原件与本轮亲历执行记录并列为证据，且如实标注受控演练的**受控注入**性质与「独立替代审查真的顶班在归档中从未发生」这一事实。 ⑧**accepted_risk（细节审查 DIR-D1-T10 / finding #18）被作为显式条目**：完成宣称必须逐字包含「INTEG-1 的可观察结果未完全满足、记 `unverified`」与缺口去向，并列入最终确认展示项；**不得**在任何材料中把 INTEG-1 写成 pass 或「成功条件已达成」（用户已以选项选择接受该风险，U-014/V-021、ADR-012）。
- **失败边界（明确不构成完成）**：子任务状态相加（`prd.md:526`）；代码审查通过（`prd.md:574`「以代码审查冒充功能验收」）；脚本自证（`prd.md:536`）；部分用例通过而其他用例失败（`prd.md:607`）；INTEG-3 记 N/A 或删除用例（ADR-001）；按 SD-07 旧四段判 E2E-2（ADR-002）；旧「全 phase 结束集成审查」不记 `未验证（unverified）`、或未取得用户按现行三道审查点验收的**正式授权**（ADR-002 第二次修订、U-010/V-017；此前口径 U-009/V-016 记为「用户显式确认」）；人为制造假失败冒充关键失败路径核对（ADR-008）；把执行广度扩张为全量跑 `tests/acceptance` 下所有 oracle（ADR-009）；**INTEG-1 在可观察结果（`prd.md:590`）未完全满足时被判 `passed`**，或被记 N/A/删除用例/恢复并发限制（ADR-001 修订、U-013）；**把 INTEG-1 的 `unverified` 静默当成 `passed` 而不写进完成宣称**，或反过来把它当作套件内用例失败而据此阻断完成宣称（ADR-012、U-014）；**把 INTEG-1 的可观察成功条件未满足写成 pass 或「成功条件已达成」**，或以「失败判据未触发」冒充「成功条件已满足」（ADR-012 accepted_risk、DIR-D1-T10）。
- **可如实降级**：失败/unavailable 事实按原样披露并阻断完成宣称，不做改写（`prd.md:580-582`）。
- **本卡不判**：各卡自身 AC 内容的对错（`prd.md:527`、`:557`）；产品功能实现是否新增（本卡无新实现，`prd.md:549` 第③条）。

## 范围

- **当前范围**：总体验收套件的成形（CARD-01..09 验收事实汇集与存在性核对 + 用户抽验通路）；套件执行（E2E-1/2/3 真实入口逐条执行；INTEG-1/2/3 跨卡集成场景核对；关键失败路径三条核对）；完成宣称判定与向用户展示（含未验证项与风险）。
- **落点**：仓库内只写 `specs/workflowhub-thin-core-card-10-20260919/`（`decision-log.md`、`spec.md`、`phases/`）与 verify-code 结论；原始件全部落外置任务目录 `quality/`（ADR-005）。
- **约束**：不改母 PRD（ADR-007）；不新增产品功能实现（`prd.md:549` 第③条，缺口修复交回原责任卡）；不新增套件用例或改写失败判据（`prd.md:547`）；禁止无范围全量回归（禁止全量 `vitest`/`npm test`/`test:safe`，只跑受影响针对性测试）；证据只留原始件，禁止目录快照/整树 tar/`git archive`；重活派子代理，主上下文只收摘要；`tests/` 不新增 CARD-10 驱动脚本（ADR-006）；验收执行广度只跑三个与套件直接相关的 oracle，其余各卡只做原件存在性核对 + 归档引用（ADR-009）。
- **用户流程/结果只记索引和验收影响，细节进入 spec**：E2E-1/2/3 与 INTEG-1/2/3 的真实入口、度量与证据形态已在 `## 验收面` 记录索引；具体 fixture、采样命令、环境假设与 N/A+reason 口径进本卡 `spec.md`（OPEN-002，`prd.md:547`）。

### 用户旅程、页面范围与数据状态

- **用户旅程**：①**规划旅程（E2E-1）**＝宿主真实入口 → 人工选择「规划任务」 → make-decision → build-prd（portable workflow，非第六阶段），产出 PRD 与任务地图；②**实施旅程（E2E-2）**＝同一入口 → 人工选择「实施/普通任务」 → make-decision → build-plan → build-code → verify-code；③**本卡自身的验收旅程**＝②的一个实例（CARD-10 是实施卡）。引用 `prd.md:19`/`:561-567`/`:569-575`。
- **页面范围**：本卡**无产品 UI 页面**；「界面」面＝仓库内 `specs/workflowhub-thin-core-card-10-20260919/` 材料与外置 `<task-dir>/quality/` 证据落点。写 `N/A`＋理由：本卡是验收承接卡，不新增产品界面（`prd.md:527`、`:549` 第③条）。
- **数据状态**：七值状态（`not-started`/`in-progress`/`succeeded`/`failed`/`unverified`/`blocked`/`abandoned`）与质量缺口值（`missing`/`unavailable`/`incomplete`）的用法边界——七值状态用于阶段/任务事实取值，质量缺口值用于质量事实；质量缺失保持 `unknown`/`unavailable`/`incomplete`，不能伪造通过；证据数据落外置 `quality/`、仓库不复制（ADR-005）；本阶段不写任务事实账（F-003）。

## 非目标

- 不重跑各卡内部测试（`prd.md:557`）。
- 不逐条复核各卡 AC 内容（`prd.md:557`、AC-47 失败场景）。
- 不恢复「限制单次审查并发 provider 数」或任何并发上限（ADR-001；CARD-09 `decision-log.md:498`/`:519`；`prd.md:697` A 条）。
- 不补回已退役的「全 phase 结束集成审查」（ADR-002）。
- 不改母 PRD 正文（含 SD-07 `prd.md:56`、E2E-2 `prd.md:572`、INTEG-3 `prd.md:600` 的旧表述，ADR-007）。
- 不改四个现行 workflow skill 的审查点表述（ADR-002）。
- 不新增产品功能实现、不新增 public command/stage/持久对象（`prd.md:549` 第③条）。
- 不把原始件复制进仓库、不做目录快照或整树归档（ADR-005）。
- 不把驱动脚本当 oracle、不让驱动自证结果（ADR-006、AC-48）。
- 不新增/删除套件用例，不改写失败判据（`prd.md:547`）。
- 不人为制造假失败（含「把 provider 指向不存在目标」）冒充关键失败路径核对（ADR-008）。
- 不全量跑 `tests/acceptance` 下所有 oracle，也不跑 `tests/` 下其他测试（ADR-009）。

## 决定

决定区按需求框架的方案/裁决模块分组；每组内按 `需求 → 事实/约束 → 选项 → 决定 → 功能/消费者 → 验收` 链序排列。**ADR 编号 ↔ 本轮早期草稿 D 编号对照**（供回报与交叉引用）：ADR-001↔D-001（INTEG-3 判据更新；后经 Talk 第 4 轮轴九 U-013/V-020 扩展为同时裁定 INTEG-1；**并附修订注（2026-10-05 细节审查 DIR-D1 后）：证据形态以 ADR-011 为准**）、ADR-002↔D-002（全 phase 集成审查退役）、ADR-003↔D-003（RED→GREEN 证据取法）、ADR-004↔D-004（E2E-3 失败注入）、ADR-005↔D-005（证据落点）、ADR-006↔D-007（执行载体）、ADR-007↔D-006（母 PRD 只读不改）、ADR-008↔（Talk 第 2 轮新增，无早期草稿 D 编号；审查工具不可用路径的真证据取法）、ADR-009↔（Talk 第 2 轮新增，无早期草稿 D 编号；验收执行广度）、ADR-010↔（Talk 第 4 轮新增，无早期草稿 D 编号；E2E-2 证据主体）、ADR-011↔（Talk 第 4 轮新增，无早期草稿 D 编号；E2E-1 与 INTEG-1/2/3 逐条真实入口证据映射）、ADR-012↔（Talk 第 5 轮新增，无早期草稿 D 编号；最终完成宣称口径）、ADR-013↔（Grill 第 1 批新增，无早期草稿 D 编号；关键失败路径②取证形态）、ADR-014↔（Grill 第 1 批新增，无早期草稿 D 编号；INTEG-1 缺口去向）、ADR-015↔（Grill 第 1 批新增，无早期草稿 D 编号；独立审查收口）。**ADR-001..ADR-015 均在本文件内生效，无外部 ADR 文件**（ADR-001 经 Talk 第 4 轮 U-013/V-020 修订，ADR-002 经 Talk 第 3 轮 U-009/V-016 与 Talk 第 4 轮 U-010/V-017 两次修订）。

### 模块 1：INTEG-3 判据与上游撤销承接

- 需求：R-008（跨卡集成场景核对冻结接口在跨卡边界真实成立）。
- 事实/约束：`prd.md:603` 上游变化注（V-002）明确「并发限制/并发上限」前提已不存在，是否改为「共存」由 CARD-10 owner 裁定；CARD-09 D-001/D-022 已撤销限并发（`decision-log.md:498`/`:519`）；AC-47 禁止临时增删用例（`prd.md:535`）。
- 选项：N-001（保留编号、改判据对象）／N-005（记 N/A 或删用例）／N-006（恢复并发上限并改名）。
- 决定：ADR-001。
- 功能/消费者：INTEG-3 可真实执行并产出可消费证据；consumer=用户（总体交付判定）与后续集成核对。
- 验收：`## 验收面` 用例 6；AC-47 一致性判据。

### ADR-001

- **source**：`prd.md:603`（V-002）上游变化注；CARD-09 `specs/archive/workflowhub-thin-core-card-09-20260919/decision-log.md:498`（D-001 撤销 FR-44/AC-44）、`:519`（D-022）；`prd.md:697` A 条；Talk 第 1 轮 U-002；Talk 第 4 轮（2026-10-05）轴九选项选择（U-013、V-020，INTEG-1 判据）。
- **decision**：INTEG-3 判据更新为「CARD-05 新审查链与 CARD-09 资源/效率改动在**同一审查基建**上共存」，**保留用例编号与「跨卡共存」目的**。成功条件=三审查点各有真实执行原件、资源/效率改动前后审查链仍产出可消费结果（provider 归属、原始失败、取消/清理事实保留）、回收动作不误删在途审查材料；失败条件=资源/效率改动致应有审查点缺失、审查材料被误删、或 provider 失败被写成通过；证据=CARD-09 `quality/reviews/` 原件 + 资源/效率验收原件对照记录。不得删用例、记 N/A、恢复并发限制。 **INTEG-1（Talk 第 4 轮轴九修订，U-013/V-020）**：判据终态＝**`unverified`**——保留用例编号与「跨卡消费」目的。成功条件＝①**无静默偏离**（无任何 Group 1 卡改动蓝图本体或其 owner 文件）**且**②**各卡有消费证据**（Group 1 各卡对冻结接口的消费点有对照记录）；失败条件＝①任一 Group 1 卡偏离冻结接口且无 G-1 记录（`prd.md:591` 原文；**不新增「消费证据完全为零」等失败判据**——消费证据不足只使可观察结果未完全满足，判 `unverified`）；证据＝冻结接口蓝图与各卡消费点的对照记录（`prd.md:592`）。当前事实：①成立（CARD-07 `phases/P1.md:86` 显式 DO NOT TOUCH；蓝图与 `runtime/task/task-topology.mjs` 的消失系 CARD-06 迁移表 MT-7-078 登记过的 NARROW/B7-P8 处置，非静默偏离），②只 1/4 张卡有行为级证据（CARD-07 `18b8134a` 在 `runtime/stage/stage-context.mjs` 新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`；CARD-03/04/05 无消费证据）→ 判 `unverified`。**不得删用例、记 N/A、恢复并发限制**；缺口去向＝PRD 用词与制品现实不匹配，**承接方＝无，只在本卡如实记录**（U-016／ADR-014；原文「交回母任务层面」为历史口径）。
- **rationale**：原判据的两项前提（并发限制存在、并发上限与节奏点同时成立）已由上游撤销，按原样执行只能记 N/A；而 `prd.md:603` 明确要求 owner 裁定而非删除，AC-47 又禁止临时增删用例。保留编号与「跨卡共存」目的、只替换判据对象，是唯一同时满足上游事实与 AC-47 的读法。
- **consequence**：INTEG-3 成为「资源/效率改动未破坏审查基建」的对照核对，只能证明「未被破坏」而不能证明「设计上不可能破坏」（RISK-005），该局限须在完成宣称中作为未验证项披露（AC-50）；若 CARD-09 侧原件不含取消/清理或 provider 归属事实，本用例按失败事实如实记录，不降级为 N/A。 **INTEG-1 侧**：判 `unverified` 后，该未验证项须在完成宣称中显式披露（U-014、ADR-012），不得静默当成 `passed`，也不得据此阻断完成宣称；缺口去向（PRD 用词与制品现实不匹配）**承接方＝无，只在本卡如实记录**（U-016／ADR-014；原文「交回母任务层面」为历史口径）。
- **supersedes**：`prd.md:600-602` 的 INTEG-3 可观察结果与失败判据（母 PRD 本体不改，逐字保留于 V-003 与 `## Supersedes（被替代记录）`）。
- **原始声明层**：V-002、V-003；`decision-log.md:498`/`:519`；`prd.md:697`；U-013、V-020（Talk 第 4 轮轴九选项选择，INTEG-1）；`prd.md:590`/`:591`/`:592`。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-013/V-020）→ R-008 → F-002/F-004/F-011 → ADR-001。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 1 轮（2026-10-05）用户认可承接决定 A（U-002）；无逐字原文留存（OPEN-005）+ Talk 第 4 轮（2026-10-05）轴九选项选择 A（推荐项）（U-013、V-020，INTEG-1 判 `unverified`）。后者为**选项选择**，非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 细化对照记录形态，verify-code 执行对照并留原件；INTEG-1 的 `unverified` 与缺口去向须写进完成宣称（ADR-012）。
- **修订注（2026-10-05 细节审查 DIR-D1 后）**：**证据形态以 ADR-011 为准**——ADR-001 的「原件对照」是证据的一种形态，但每一条用例的证据列都必须逐条写明可复跑的命令、exit code 与 output 落点；只写归档路径不构成 AC-48 的真实执行记录。
```text
module: integ-3-review-infra-coexistence
requirement_ids: [R-008]
derived_from: []
artifacts: [spec.md#INTEG-3, spec.md#INTEG-1, decision-log.md#用例-4, decision-log.md#用例-6]
```

- **授权边界注（2026-10-05，U-018/V-025 后）**：本 ADR 的**共存判据更新**依据＝`prd.md:603` 对 CARD-10 owner 的字面授权（「本条是否改为『CARD-05 审查链与 CARD-09 资源/效率改动共存』由 CARD-10 owner 在其承接 task 中裁定」）；本 ADR 的**审查节奏项读法**（＝现行三审查点：build-plan 合并审查、build-code 每 Phase 代码审查、verify-code 终末代码审查；原「全 phase 结束集成审查」按已退役处理）依据＝**用户以母任务 owner 身份**经提问工具 `ask_user_question`（question_id `inte3-reading`）作出的显式裁定（U-018／V-025，选项选择逐字 `A 认可这个读法（推荐）`），**不属于** `prd.md:603` 的字面授权范围——`prd.md:603` 字面只授权 CARD-10 owner 裁定「本条是否改为共存判据」，未字面授权把原可观察里的「SD-07 完整节奏点」换成现行三审查点。两者须**分开引用**：引用共存判据更新时引 `prd.md:603`；引用审查节奏项读法时引 U-018／V-025。

### 模块 2：审查节奏读法与退役登记

- 需求：R-007（E2E-2 的审查节奏度量按现行合同核对）。
- 事实/约束：四个现行 skill 一致写明三审查点、无额外全 Phase 集成审查（V-006..V-010）；母 PRD SD-07 ③（`prd.md:56`）、E2E-2（`prd.md:572`）、INTEG-3（`prd.md:600`）仍写「全 phase 结束集成审查一次」；`prd.md:57` 已有 Supersession 说明，`prd.md:692` 载「SD-07 历史表述不变」；`prd.md:549` 要求母材料只读。
- 选项：N-001（显式新旧对应表 + 按现行合同验收）／N-004（按旧四段判 E2E-2 失败）／改写 skill 以对齐 PRD 旧表述。
- 决定：ADR-002。
- 功能/消费者：E2E-2 审查节奏度量有唯一读法；consumer=用户与 verify-code 验收。
- 验收：`## 验收面` 用例 2；`## 退役登记（retirement）` 新旧对应表。

### ADR-002

- **source**：V-006..V-010（`workflows/make-decision/SKILL.md:38`、`workflows/build-plan/SKILL.md:36`、`workflows/build-code/SKILL.md:22`/`:40`、`workflows/verify-code/SKILL.md:34`）；冲突面 `prd.md:56`、`:572`、`:600`、`:191` 第⑥条；Talk 第 1 轮 U-003；Talk 第 3 轮（2026-10-05）轴五选项选择（U-009、V-016）；Talk 第 4 轮（2026-10-05）轴六选项选择（U-010、V-017，用户以母任务 owner 身份正式授权按现行三审查点验收）。
- **decision**：母 PRD 多写的「全 phase 结束集成审查」按**已退役**处理，在 `## 退役登记（retirement）` 建显式新旧对应表并声明按**现行合同**验收——①build-plan 合并审查（wh-review）保留；②build-code 每 phase 代码审查（OCR）保留；③全 phase 结束集成审查**已退役**（只记录对应关系，不机械补回）；④verify-code 终末代码审查保留（独立事实，不与功能验收共用）。E2E-2 的「审查节奏」度量按现行三审查点核对；SD-07 完整序列作为历史表述保留、不作为验收门。**本项按未验证处理**（Talk 第 3 轮轴五，U-009/V-016）：第③点在本卡记 **`未验证（unverified）`**——它在本卡验收读法下已退役、不补回、不据此判失败，但**也不得被读作「已披露即可放行」**；E2E-2 按**现行三道审查点**（①②④）验收；**放行依据是用户显式确认**（Talk 第 3 轮轴五选项选择 A（推荐项），U-009/V-016）——即用户显式确认按现行三道审查点验收，**不得仅凭「已披露差异」放行**。残余风险如实保留：母 PRD 原文（`prd.md:56`/`:572`/`:600`）仍保留该旧表述，只看 PRD 的读者可能误读为「本卡漏做了必留审查点」（RISK-008），该风险须在完成宣称中作为未验证项披露（AC-50）。PRD 本体只读不改。 **第二次修订（Talk 第 4 轮轴六，U-010/V-017）**：第③点的处置由「`未验证（unverified）` + 用户显式确认放行」**升级**为「**用户以母任务 owner 身份正式授权按现行三审查点验收**」。授权来源＝Talk 第 4 轮轴六选项选择 **B**（逐字标签见 V-017，用户以母任务 owner 身份作出）；**授权范围仅限 E2E-2 的审查节奏项**（即「全 phase 结束集成审查」这一点的验收读法），不扩及 INTEG-3 或其他判据；**不得由 CARD-10 自行改写 PRD 判据**（`prd.md:603` 的上游变化注只授权 INTEG-3 改判据，未授权 E2E-2）；PRD 原文**只读不改**（ADR-007）；残余风险不变：PRD 原文仍留旧表述，只看 PRD 的读者可能误读（RISK-008）。第③点仍记 `未验证（unverified）`；U-009 保留不删（其记载为当时口径）。
- **rationale**：四个现行 skill 是活的执行合同，四处一致且互相印证；母 PRD 旧表述已被其自身的 Supersession 说明标注（`prd.md:57`）。按旧四段判 E2E-2 会把历史表述当验收门，机械补回又会违反 SD-17/OI-012「不恢复退役门禁」；改写 skill 则越界改合同。**新增（Talk 第 3 轮）**：退役只是本卡侧的验收读法，旧表述在 PRD 原文里仍在，故该项必须记 `未验证（unverified）`，不能记成「无问题」；且放行不能由披露自动成立——披露只把差异说清楚，接受差异需要用户显式确认（U-009/V-016），否则等于把「我们解释了差异」当成「差异已被接受」。
- **consequence**：E2E-2 的审查节奏核对只认三审查点原件（CARD-09 归档四项即为对应证据）；旧第③点不再产生验收失败，但必须在退役表登记，避免后续卡重新发明该点。OCR 回退口径按 `workflows/build-code/SKILL.md:28-30`（仅 ENOENT 或 <1.12.9 回退；已安装但失败/超时/取消不回退，保留原失败/unavailable）。**本项在完成宣称中按 `未验证（unverified）` 披露，放行依据＝U-010/V-017 的用户正式授权（此前为 U-009/V-016 的用户显式确认）**；仅凭披露放行即为失败（`## 成功/失败边界`）；PRD 原文旧表述仍在（RISK-008）。
- **supersedes**：本卡验收读法下替代 SD-07 ③（`prd.md:56`）、E2E-2 审查节奏句（`prd.md:572`）、INTEG-3 旧节奏点（`prd.md:600`）；母 PRD 本体不改。
- **原始声明层**：V-006..V-010；`prd.md:57`、`:191`、`:692`；U-009、V-016（Talk 第 3 轮轴五选项选择）；U-010、V-017（Talk 第 4 轮轴六选项选择）。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-009/V-016 + U-010/V-017）→ R-007 → F-001/F-009 → ADR-002。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 1 轮（2026-10-05）用户认可承接决定 B（U-003）；无逐字原文留存（OPEN-005）+ Talk 第 3 轮（2026-10-05）轴五选项选择 A（推荐项）（U-009、V-016）+ Talk 第 4 轮（2026-10-05）轴六选项选择 **B**（U-010、V-017，**用户以母任务 owner 身份正式授权按现行三审查点验收**）。三轮均为**选项选择**（第 1 轮为认可答复），非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 在 spec 中复述该读法，verify-code 按三审查点核对并留记录；完成宣称须按 `未验证（unverified）` 披露第③点，并以 U-010/V-017 的用户正式授权为放行依据（U-009/V-016 的显式确认保留为前一版口径）。
```text
module: review-cadence-reading
requirement_ids: [R-007]
derived_from: []
artifacts: [spec.md#E2E-2, decision-log.md#退役登记]
```

### 模块 3：验收证据与执行载体

- 需求：R-002（逐条真实入口执行、无脚本自证）、R-003（存在性核对边界）、R-010（套件主体不得增删、参数细节后置）。
- 事实/约束：AC-48 禁止脚本自证冒充（`prd.md:536`）；`prd.md:530` 要求执行而非发明；仓库 `tests/acceptance/` 实存 10 个 oracle 且**无** card-04/05/06/08 oracle（F-005）；`workflows/build-code/SKILL.md:24` 点名 `node tests/acceptance/card-09-session-ledger.mjs`；证据硬规则要求每类事实只留一份原始件、禁目录快照/整树 tar/`git archive`；`prd.md:544` 载无共享写面。
- 选项：N-001（复跑现成 oracle + 引用归档原件；原始件落外置 `quality/`；最小驱动脚本不进主仓 `tests/`）／N-002（自建脚本冒充 RED→GREEN）／把原始件复制进仓库或整树归档／把驱动脚本放进 `tests/`。
- 决定：ADR-003、ADR-004、ADR-005、ADR-006。
- 功能/消费者：执行事实可核对、可抽验、不脚本自证；consumer=用户与 verify-code 验收。
- 验收：`## 验收面` 用例 0/3/7 与 AC-48 对照。

### ADR-003

- **source**：Talk 第 2 轮（2026-10-05）轴一选项选择（U-005、V-012）；Talk 第 1 轮 U-001①；SD-06 `prd.md:51`（有效 RED 判据与 G-2 豁免披露）；E2E-3 `prd.md:577-583`（ADR-004 的可失败检查）；`workflows/build-code/SKILL.md:24`（点名校验命令）；AC-48 `prd.md:536`；`prd.md:530`；`prd.md:549` 第③条。
- **decision**：E2E-2 的 RED→GREEN 取法=**如实走 G-2 豁免披露**（SD-06 `prd.md:51`），四个组成缺一不可：①**写明「本卡无行为变更，故无新 RED→GREEN」**——本卡 build-code 无新实现（`prd.md:549` 第③条），不存在由本卡实现产生的 RED→GREEN；②**补一条可失败的检查**，由 E2E-3 注入的真实测试失败充当（SD-06 的 G-2 要求；注入—记录—修复—复验口径见 ADR-004）；③**复跑仓库现成验收 oracle 取得真实执行事实**——`node tests/acceptance/card-09-session-ledger.mjs`、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` 三个（执行广度见 ADR-009）；④**引用 CARD-09 归档里的真实 RED→GREEN 原件**作为历史事实。记录必须写明界限：③是「**独立复跑既有 oracle**」，**不是**本卡新实现产生的 RED→GREEN；G-2 豁免的理由与风险须在验收中披露（SD-06）。
- **rationale**：本卡无新实现、无行为变更，按 SD-06 先写不出由本卡改动导致失败的测试，属 G-2 明列的可豁免情形（纯文档/探索性改动）；但 SD-06 不允许直接跳过，必须补一条可失败检查或写明豁免理由与风险并在验收中披露——故用 E2E-3 的真实失败注入充当可失败检查，用复跑现成 oracle 提供「既有 oracle 在当前环境仍可真实执行」的独立事实，再用 CARD-09 归档原件提供历史 RED→GREEN 事实。三者合起来才构成可核对且不脚本自证的链条；AC-48 又禁止脚本自证，故③的「独立复跑」界限必须逐字写出。
- **consequence**：G-2 豁免披露不完整（缺「本卡无行为变更，故无新 RED→GREEN」声明、缺可失败检查、缺「独立复跑」界限）即视为直接跳过或脚本自证，按 SD-06 与 AC-48 `prd.md:536` 失败。可用 oracle 集合限于 ADR-009 的三个；F-005 的 `tests/acceptance/` 10 个文件清单只用于存在性核对，card-04/05/06/08 在该目录无 oracle 不构成豁免（card-04 的真实入口证据由 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 提供）；缺 oracle 的核对项按 `prd.md:575` 的 FR-20 口径记 N/A+reason（口径留 build-plan，OPEN-002）。
- **supersedes**：N/A（本条是对 Talk 第 1 轮 U-001① 口径的**补齐**，不是替代：原「复跑现成 oracle + 引用 CARD-09 归档原件」两句仍有效，另补 G-2 豁免披露、可失败检查与「无新 RED→GREEN」声明）
- **原始声明层**：U-005、V-012（Talk 第 2 轮轴一选项选择）；U-001①；`workflows/build-code/SKILL.md:24`；`prd.md:51`、`:536`、`:549` 第③条。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-005/V-012）→ R-002 → F-005 → ADR-003。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 2 轮（2026-10-05）轴一选项选择 A（推荐项）（U-005、V-012）+ Talk 第 1 轮（2026-10-05）5 项执行口径逐项选定 A（U-001①）。两轮均为**选项选择**，非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 定采样命令集合与 G-2 豁免披露的落点，verify-code 执行三个 oracle 并留 exit/output 位置，并在完成宣称中披露 G-2 豁免理由与风险（AC-50）。
```text
module: acceptance-evidence
requirement_ids: [R-002]
derived_from: []
artifacts: [spec.md#E2E-2, decision-log.md#用例-2]
```

### ADR-004

- **source**：Talk 第 1 轮 U-001②；E2E-3 `prd.md:577-583`；SD-05 `prd.md:47`；`prd.md:605`；SD-06 `prd.md:51`。
- **decision**：E2E-3 失败注入方式=注入一次**真实测试失败** → 如实记为失败 → 修复 → 复验；一次注入同时服务两条关键失败路径（「失败不漂白」+「测试失败后修复复验」）。
- **rationale**：SD-06 明确环境故障/配置缺失/无意义断言不算有效 RED，故不能用故障伪造失败；`prd.md:605` 三条路径中①②需要各自的真实事实，用一次真实测试失败可同时覆盖，避免为凑记录制造假失败。
- **consequence**：路径②（审查工具 unavailable 时独立替代或 unverified 披露）仍需单独核对，不能用测试失败注入替代；若注入后未修复未复验，路径①缺记录，整体不得声明完成（`prd.md:605`）。
- **supersedes**：N/A
- **原始声明层**：U-001②；`prd.md:577-583`、`:605`、`:51`。
- **三级追溯**：CARD-10 story → R-004、R-006 → F-001 → ADR-004。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 1 轮（2026-10-05）5 项执行口径逐项选定 A（U-001②）。
- **owner/next_action**：CARD-10 owner；verify-code 执行注入—记录—修复—复验并留对照原件。
```text
module: failure-path-drill
requirement_ids: [R-004, R-006]
derived_from: []
artifacts: [spec.md#E2E-3, decision-log.md#用例-3]
```

### ADR-005

- **source**：Talk 第 1 轮 U-001③；证据硬规则（每类事实只留一份原始件、禁目录快照/整树 tar/`git archive`）；`prd.md:544`；`prd.md:557`；CARD-09 外置 `quality/` 现状（F-004）。
- **decision**：证据落点=原始件**全部**落外置任务目录 `<task-dir>/quality/`（`reviews/` 审查原件、`tests/` 测试执行原件、`evidence/` 其余原件，按需其下分子目录，与 CARD-09 现有 `quality/{reviews,tests,evidence}` 约定一致）；仓库内只留本卡 `specs/workflowhub-thin-core-card-10-20260919/` 的 decision-log/spec/phases 与 verify-code 结论；**仓库内不复制原始件**。存在性核对范围为「事实存在且未漂白」，**不重跑各卡内部测试、不逐条复核各卡 AC 内容**。
- **rationale**：证据硬规则要求每类事实只留一份原始件；`prd.md:544` 载本卡无共享写面；`prd.md:557` 明确存在性核对的边界，若扩张为逐条复核即触 AC-47 失败场景。
- **consequence**：仓库内 `specs/` 只承担决策与结论，抽验通路依赖外置目录的绝对路径可读性（RISK-003）；`prd.md:557` 的用户抽验权由 CARD-10 提供定位与原文通路实现，抽验发现漂白按失败事实处理。
- **supersedes**：N/A
- **原始声明层**：U-001③；`prd.md:557`（V-011）、`:544`。
- **三级追溯**：CARD-10 story → R-003、R-010 → F-004 → ADR-005。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 1 轮（2026-10-05）5 项执行口径逐项选定 A（U-001③）。
- **owner/next_action**：CARD-10 owner；build-plan 定 `quality/` 子目录与文件命名（普通文件名，日期+序号+描述，append-only）。
```text
module: evidence-placement
requirement_ids: [R-003, R-010]
derived_from: []
artifacts: [spec.md#evidence-layout, decision-log.md#用例-0]
```

### ADR-006

- **source**：Talk 第 1 轮 U-001⑤；AC-48 `prd.md:536`；`prd.md:530`。
- **decision**：执行载体=任务内**最小驱动脚本**，放本卡 `specs/workflowhub-thin-core-card-10-20260919/` 下或外置任务目录，**不进主仓 `tests/`**；执行记录必须明确标注「驱动只是发起真实入口，不构成自证」。
- **rationale**：AC-48 禁止脚本自证冒充；把驱动放进 `tests/` 会让驱动与 oracle 面混淆，使「真实入口」与「脚本产物」不可分辨。
- **consequence**：`tests/` 不新增 CARD-10 文件（可由改动范围原始件证明）；驱动脚本本身不产出结论，结论只来自真实入口执行与原件对照。
- **supersedes**：N/A
- **原始声明层**：U-001⑤；`prd.md:536`。
- **三级追溯**：CARD-10 story → R-002 → F-005 → ADR-006。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 1 轮（2026-10-05）5 项执行口径逐项选定 A（U-001⑤）。
- **owner/next_action**：CARD-10 owner；build-plan 定脚本位置与调用方式，verify-code 在记录中标注该界限。
```text
module: execution-carrier
requirement_ids: [R-002]
derived_from: []
artifacts: [spec.md#driver-script, decision-log.md#用例-2]
```

### 模块 4：母材料边界与完成宣称

- 需求：R-005（完成宣称前置与未验证项披露）、R-009（母/兄弟材料只读、无新实现）、R-011（停止规则）。
- 事实/约束：`prd.md:549` 要求母/兄弟材料只读、不触发母任务 close；`prd.md:658` 停止规则；`prd.md:603` 上游注「只注不改」；AC-50 要求展示含未验证项与风险。
- 选项：N-001（PRD 只读，差异只在 decision-log 登记）／顺手同步 PRD 旧表述／在 PRD 内加注／删除旧表述。
- 决定：ADR-007。
- 功能/消费者：母材料事实不被改写，本卡读法可追溯；consumer=用户与后续卡。
- 验收：`## 验收面` AC-50 对照；`## Supersedes（被替代记录）`。

### ADR-007

- **source**：Talk 第 1 轮 U-001④；`prd.md:549`「母/兄弟材料只读」；`prd.md:603`「只注不改」；`prd.md:658`；`prd.md:538`。
- **decision**：母 PRD **只读不改**——不改 `prd.md` 任何字节，包括 SD-07（`:56`）、E2E-2（`:572`）、INTEG-3（`:600`）的旧表述；新旧差异只在本 decision-log 的 `## 退役登记（retirement）` 与 `## Supersedes（被替代记录）` 登记。完成宣称只在真实入口联通实跑 + 成功条件达成 + 关键失败路径核对之后，且展示含未验证项与风险。CARD-10 通过后进入停止规则（`prd.md:658`）。
- **rationale**：母材料只读是 `prd.md:549` 与 `prd.md:603` 的显式约束；PRD 旧表述的 Supersession 已由其自身说明（`prd.md:57`）承载，本卡只需登记读法，不需要也不允许改字节。
- **consequence**：母 PRD 与 CARD-09 归档 decision-log 的字节不变；后续读者若只看 PRD 会看到旧表述，必须经本文件的退役表与 Supersedes 才能得到正确读法（RISK-002）。
- **supersedes**：N/A（母 PRD 本体不被替代，只被本卡读法登记）
- **原始声明层**：U-001④；`prd.md:549`、`:603`、`:658`。
- **三级追溯**：CARD-10 story → R-005、R-009、R-011 → F-001 → ADR-007。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 1 轮（2026-10-05）5 项执行口径逐项选定 A（U-001④）+ 任务类型确认（U-004）。
- **owner/next_action**：CARD-10 owner；build-plan/verify-code 全程遵守；缺口修复交回原责任卡（`prd.md:549` 第③条）。
```text
module: mother-material-boundary
requirement_ids: [R-005, R-009, R-011]
derived_from: []
artifacts: [spec.md#scope, decision-log.md#退役登记]
```

### 模块 5：关键失败路径证据取法与验收执行广度

- 需求：R-004（关键失败路径三条核对记录）、R-003（存在性核对边界，不逐条复核各卡 AC）、R-010（套件主体不得增删、参数细节后置）。
- 事实/约束：SD-05 `prd.md:47` 约定三条关键失败路径；`prd.md:605` 缺任一路径核对记录即整体不得声明完成；AC-49 `prd.md:537` 失败须如实记录不漂白；AC-47 `prd.md:535` 禁止把逐条复核各卡 AC 内容当作完成条件；`prd.md:557`（V-011）划定存在性核对边界；测试硬规则只跑受影响针对性测试、禁止无范围全量回归；`tests/acceptance/card-09-session-ledger.mjs` 由 `workflows/build-code/SKILL.md:24` 点名（F-005），`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` 实存；CARD-09 与规划任务外置目录已有真实原件（F-004、F-007）。
- 选项：N-001（关键失败路径②先检索已有真实原件、本轮真出现才记录；执行广度只跑三个直接相关 oracle）／人为制造假失败（如把 provider 指向不存在目标）／全量跑 `tests/acceptance` 下所有 oracle。
- 决定：ADR-008、ADR-009。
- 功能/消费者：关键失败路径②有真证据取法、验收执行广度有明确边界；consumer=用户（总体交付判定）与 verify-code 验收。
- 验收：`## 验收面` 用例 0、用例 2、用例 7；AC-47、AC-49 对照。

### ADR-008

- **source**：Talk 第 2 轮（2026-10-05）轴二选项选择（U-006、V-013）；SD-05 `prd.md:47`；`prd.md:605`；AC-49 `prd.md:537`；SD-06 `prd.md:51`；CARD-09 与规划任务归档原件（F-004、F-007）。
- **decision**：关键失败路径②「审查工具 unavailable 时独立替代或 unverified 披露」的**真证据取法**分三步：①**先检索** CARD-09 与规划任务已有真实不可用原件（`<task-dir>/workflowhub-thin-core-card-09-20260919/quality/reviews/`、`.../tasks/workflowhub-thin-core-rebuild-planning-20260919/quality/`，只读引用）；②本轮执行中**若真实出现** provider 不可用/失败，如实记录并披露 unverified（原件落本卡外置 `quality/reviews/`；OCR 回退口径见 `workflows/build-code/SKILL.md:28-30`）；③本轮**若确实未出现**，如实记「本轮未出现该情形」并说明替代核对面＝CARD-09 归档原件，**不冒称亲历**。**禁止人为制造假失败**——明确排除「把 provider 指向不存在目标」这类做法。
- **rationale**：SD-05 要求关键失败路径被核对，但核对的对象必须是**真实发生过的事实**；人为制造 provider 失败会把环境故障伪造成核对记录，正是 SD-06 `prd.md:51`（环境故障/配置缺失不算有效 RED）与 AC-49（失败不得改写、也不得伪造）禁止的方向。已有归档原件是可回读的历史事实，能提供替代核对面，但不等于本轮亲历，故必须把「引用历史原件」与「本轮真实发生」分开写。
- **consequence**：若本轮未出现该情形，路径②的核对记录只能是「引用 CARD-09 归档原件 + 本轮未出现该情形」，证据强度低于亲历；该局限须在完成宣称中作为未验证项披露（AC-50），不得冒称亲历。`prd.md:605` 的失败判据不变：缺路径②核对记录即整体不得声明完成；记录若不区分「引用」与「亲历」即视为伪造，按 AC-49 失败。
- **supersedes**：N/A（ADR-004 已明确路径②不能由测试失败注入替代，本条补上路径②自己的证据取法）
- **原始声明层**：U-006、V-013（Talk 第 2 轮轴二选项选择）；SD-05 `prd.md:47`；`prd.md:605`、`:537`、`:51`。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-006/V-013）→ R-004、R-006 → F-004/F-007/F-008 → ADR-008。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 2 轮（2026-10-05）轴二选项选择 A（推荐项）（U-006、V-013）。该答复为**选项选择**，非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 定检索面与记录形态，verify-code 执行检索与记录并留原件，未出现情形须在完成宣称中披露。
```text
module: critical-failure-path-evidence
requirement_ids: [R-004, R-006]
derived_from: []
artifacts: [spec.md#E2E-3, decision-log.md#用例-7]
```

### ADR-009

- **source**：Talk 第 2 轮（2026-10-05）轴三选项选择（U-007、V-014）；AC-47 `prd.md:535`；`prd.md:557`（V-011）；`prd.md:547`；测试硬规则（只跑受影响针对性测试，禁止无范围全量回归）；F-005、F-008。
- **decision**：verify-code 的实际**执行广度**＝只跑三个与套件直接相关的 oracle：`node tests/acceptance/card-09-session-ledger.mjs`（`workflows/build-code/SKILL.md:24` 点名者，对应 E2E-2 会话账本）、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（对应 INTEG-2 的 CARD-04 真实入口链）、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`（对应 E2E-2 的真实入口阶段链）。其余 CARD-01..09 只做**原件存在性核对 + 归档引用**，依据 AC-47 `prd.md:535`「不逐条复核各卡 AC 的内容」与 `prd.md:557`。**明确排除「全量跑 `tests/acceptance` 下所有 oracle」**（越界且接近无范围全量回归）。
- **rationale**：套件主体以母 PRD 为准，执行广度必须能逐条对上套件内用例；跑与套件无直接关系的 oracle 会把存在性核对扩张成逐条复核各卡 AC（AC-47 失败场景），并接近无范围全量回归（违反测试硬规则）。上述三个 oracle 各自对应套件内一条真实入口链，其余各卡的事实由归档原件承担。
- **consequence**：本卡执行记录只含这三个命令的 exit/output 与产物位置；`tests/acceptance/` 其余文件与 `tests/` 下其他测试不在本卡执行范围，不得据其成败判套件结论。用户抽验权不受影响（`prd.md:557`）：用户可要求抽验任何卡的任何 AC 事实，CARD-10 提供定位与原文通路。若某条套件内用例的对应 oracle 缺失或不可执行，按失败事实如实记录并阻断完成宣称，不因「广度受限」而降级为 N/A。
- **supersedes**：N/A
- **原始声明层**：U-007、V-014（Talk 第 2 轮轴三选项选择）；AC-47 `prd.md:535`；`prd.md:557`（V-011）、`:547`。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-007/V-014）→ R-003、R-010 → F-005/F-008 → ADR-009。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 2 轮（2026-10-05）轴三选项选择 A（推荐项）（U-007、V-014）。该答复为**选项选择**，非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 在 spec 中复述执行广度与三个命令，verify-code 逐条执行并留 exit/output 位置。
```text
module: acceptance-execution-breadth
requirement_ids: [R-003, R-010]
derived_from: []
artifacts: [spec.md#E2E-2, decision-log.md#用例-0]
```

### 模块 6：证据主体、逐条证据映射与完成宣称口径（Talk 第 4/5 轮）

- 需求：R-007（E2E-2 证据主体与审查节奏）、R-002/R-003/R-008/R-010（逐条真实入口证据映射）、R-005（完成宣称含未验证项披露）。
- 事实/约束：审查方第二轮独立指出「以本卡自身执行为 E2E-2 主证据不可行」，且 E2E-1 与用例 4/5 被降级为归档复用 + 存在性核对；CARD-09 归档实施旅程四阶段原件齐备；`prd.md:567`（E2E-1 证据句）、`prd.md:607`（第二三部分用例须有真实执行记录）、AC-48（`prd.md:536`，无脚本自证冒充）、AC-50（`prd.md:538`，完成宣称须含未验证项与风险）、`prd.md:590`/`:591`（INTEG-1 可观察结果与失败判据）。
- 选项：N-001（CARD-09 归档为主 + 本卡执行为补充；逐条真实入口证据映射；单文件定向执行 oracle；声明完成 + 显式披露未验证）／以本卡自身执行为 E2E-2 主证据／把 E2E-1 与用例 4/5 停在存在性核对／把 INTEG-1 的 `unverified` 静默当作 `passed` 或当作失败阻断。
- 决定：ADR-010、ADR-011、ADR-012。
- 功能/消费者：E2E-2 证据主体可核对、E2E-1/INTEG 逐条可回读、完成宣称如实披露；consumer=用户（总体交付判定）与 verify-code 验收。
- 验收：`## 验收面` 用例 1、用例 2、用例 4、AC-50 对照与「用户抽验权通路」交付物；`## 成功/失败边界`。

### ADR-010

- **source**：Talk 第 4 轮（2026-10-05）轴七选项选择（U-011、V-018）；第二轮方向审查 findings #3/#5/#11（E2E-2 证据主体不可行；原件 `quality/reviews/2026-10-05-014-make-decision-direction.json`）；CARD-09 归档四阶段审查原件（F-004）；`prd.md:549` 第③条。
- **decision**：E2E-2 的**证据主体**＝**CARD-09 归档的真实实施旅程为主证据**（四阶段走完，四份审查原件齐备：`quality/reviews/` 下 `2026-10-04-051-build-plan-document.json`、`2026-10-05-005-build-code-phase-p1.json`、`2026-10-05-010-build-code-phase-p2.json`、`2026-10-05-017-verify-code-document.json`）+ **本卡自身本次四阶段执行为补充活证据**。**如实标注**：本卡 build-code 无新实现、不拆 Phase（`prd.md:549` 第③条），故**不产出 phase 级代码审查原件**——这是**事实，不是缺失**。
- **rationale**：审查方三个 provider 独立指出「以本卡自身执行为 E2E-2 主证据不可行」——本卡无新实现、不拆 Phase，phase 级代码审查原件在本卡不可能产生；CARD-09 归档是同一母任务下真实走完四阶段的实施旅程，其原件是可直接回读的历史事实。把两者关系写清（主证据 vs 补充），既不虚报本卡产出了不存在的原件，也不因「本卡没有」而把 E2E-2 判失败。
- **consequence**：E2E-2 的审查节奏核对以 CARD-09 归档四项为主；本卡只提供四阶段执行事实与三个 oracle 的执行记录（ADR-009）。把「本卡无 phase 级代码审查原件」读成缺失或据此判 E2E-2 失败即为失败；本卡事实须在完成宣称中如实写明（AC-50）。
- **supersedes**：N/A（本条把 `## 验收面` 用例 2 原有的「本卡四阶段事实 + CARD-09 归档交叉核对」明确为「归档为主 + 本卡补充」，不删除既有口径）
- **原始声明层**：U-011、V-018（Talk 第 4 轮轴七选项选择）；F-004；`prd.md:549` 第③条。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-011/V-018）→ R-007 → F-004 → ADR-010。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 4 轮（2026-10-05）轴七选项选择 A（推荐项）（U-011、V-018）。该答复为**选项选择**，非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 在 spec 中复述证据主体口径，verify-code 按 CARD-09 归档四项 + 本卡执行记录核对并留原件。
```text
module: e2e-2-evidence-subject
requirement_ids: [R-007]
derived_from: []
artifacts: [spec.md#E2E-2, decision-log.md#用例-2]
```

### ADR-011

- **source**：Talk 第 4 轮（2026-10-05）轴八选项选择（U-012、V-019）；第二轮方向审查 findings #1/#2(blocking)/#7/#10（E2E-1 与用例 4/5 被降级为归档复用 + 存在性核对）；`prd.md:567`（E2E-1 证据句）、`prd.md:607`（第二三部分用例须有真实执行记录）、AC-48（`prd.md:536`）；测试硬规则（禁止无范围全量回归）；ADR-009。
- **decision**：E2E-1 与 INTEG-1/2/3 **逐条给真实入口证据映射**（命令、exit code、output 位置），取代「归档复用 + 存在性核对」的降级读法：①**E2E-1** 用母规划任务（`workflowhub-thin-core-rebuild-planning-20260919`）的**真实阶段事实 + 交互记录 + PRD 最终确认原件**（依据 `prd.md:567`）；②**INTEG-1/2/3** 用**可实跑的现成 oracle 现场跑**——**单文件定向执行，不做全量回归**（与 ADR-009 一致）——+ 真实原件对照；③**跑不了的部分如实标 `unverified`**，不冒称亲历、不以存在性核对充数。
- **rationale**：审查方 blocking 指出套件第二部分与跨卡用例被降级为「归档复用 + 存在性核对」，而 `prd.md:607` 要求第二三部分用例有真实执行记录、AC-48 禁止无真实执行记录；但执行广度又受 ADR-009（只跑三个直接相关 oracle）与测试硬规则（禁止无范围全量回归）约束，故只能逐条定向执行、跑不了的如实标 `unverified`。把「逐条真实入口证据映射」写成交付形态，既满足真实执行要求，也不越界扩张成全量回归。
- **consequence**：E2E-1 与 INTEG-1/2/3 的证据列必须逐条含命令、exit code 与 output 位置；缺失即按 AC-48 失败。INTEG-1 因「消费证据只 1/4 张卡」判 `unverified`（U-013、ADR-001 修订），该 `unverified` 是如实标注而非失败（U-014、ADR-012）。执行记录落本卡外置 `quality/tests/` 与 `quality/evidence/`（ADR-005）。
- **supersedes**：N/A（本条是对 ADR-009 执行广度的取证形态补充，不改变其广度边界）
- **原始声明层**：U-012、V-019（Talk 第 4 轮轴八选项选择）；`prd.md:567`、`:607`、`:536`。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-012/V-019）→ R-002、R-003、R-008、R-010 → F-005、F-007 → ADR-011。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 4 轮（2026-10-05）轴八选项选择 A（推荐项）（U-012、V-019）。该答复为**选项选择**，非自由文本口述。
- **owner/next_action**：CARD-10 owner；build-plan 定逐条证据映射的表形态与落点，verify-code 逐条执行并留命令/exit/output 位置。
```text
module: real-entry-evidence-mapping
requirement_ids: [R-002, R-003, R-008, R-010]
derived_from: []
artifacts: [spec.md#E2E-1, decision-log.md#用例-1]
```

### ADR-012

- **source**：Talk 第 5 轮（2026-10-05）轴十选项选择（U-014、V-021）；AC-50（`prd.md:538`）；`prd.md:607`（阻断条件是套件内用例**失败**）；`prd.md:590`/`:591`（INTEG-1 可观察结果与失败判据）；ADR-001（修订）。
- **decision**：**最终完成宣称口径**＝**声明完成**，但把 **INTEG-1 的 `unverified` 作为显式披露项**，并把**缺口去向**（PRD 用词与制品现实不匹配；**承接方＝无，只在本卡如实记录**，U-016／ADR-014）一并写进完成宣称。依据：AC-50 要求完成宣称「展示含未验证项与风险」；`prd.md:607` 的阻断条件是「套件内用例**失败**」，而 INTEG-1 判的是 **`unverified`**（`prd.md:591` 判据未触发、`prd.md:590` 可观察结果未完全满足），**不等同于失败**。
- **rationale**：把 `unverified` 静默当成 `passed` 会让完成宣称失去未验证项披露（AC-50 失败）；反过来把 `unverified` 当作套件内用例失败会触发 `prd.md:607` 的阻断，与「判据未触发」的事实不符。用户选择「声明完成 + 显式披露」正是把这一区分写进宣称：结论仍是完成，但读者能看见哪一项未验证、缺口去了哪里。
- **consequence**：完成宣称必须逐字包含 INTEG-1 的 `unverified` 与缺口去向；**风险如实写明**——该结论依赖「未验证 ≠ 失败」这一区分被读者接受。若读者不接受该区分，完成宣称可能被读作「以未验证掩盖失败」，故必须在宣称中同时给出 `prd.md:590`/`:591` 的原始判据与事实。
- **supersedes**：N/A
- **accepted_risk（细节审查 DIR-D1 finding #18）**：INTEG-1 的可观察成功条件未完全满足，记 `unverified`，**不得**在任何材料中写成 pass 或「成功条件已达成」；完成宣称必须逐字包含「INTEG-1 的可观察结果未完全满足、记 unverified」与缺口去向，并列入最终确认展示项。风险＝读者可能把「未触发失败判据」误读为「通过」；用户已以选项选择接受该风险（U-014/V-021）。
- **原始声明层**：U-014、V-021（Talk 第 5 轮轴十选项选择）；AC-50 `prd.md:538`；`prd.md:607`、`:590`、`:591`。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-014/V-021）→ R-005 → F-001 → ADR-012。
- **三档结论**：`confirmed`
- **approval_binding**：Talk 第 5 轮（2026-10-05）轴十选项选择 A（推荐项）（U-014、V-021）。该答复为**选项选择**，非自由文本口述；该轴由 Talk 第 4 轮轴六/轴九的答案重排后新增。
- **owner/next_action**：CARD-10 owner；verify-code 在完成宣称中逐条写出 INTEG-1 的 `unverified`、原始判据与缺口去向。
```text
module: completion-claim-disclosure
requirement_ids: [R-005]
derived_from: []
artifacts: [spec.md#completion-claim, decision-log.md#成功失败边界]
```

### 模块 7：Grill 第 1 批三项定稿

- 需求：R-004（用例 7 路径②取证形态）、R-008（INTEG-1 缺口去向）；make-decision 方法第 9 步（细节建议）与 `## 最终确认` 的前置条件。
- 事实/约束：Grill 第 1 批三条 frontier 问题（G-001..G-003）已由用户以**选项选择**（经**提问工具** `ask_user_question` 取得，**非自由文本口述**）作答，三处均选 A（推荐项），逐字标签 V-022..V-024，语义与处置 U-015..U-017；`prd.md:60`（SD-08）自述旧 wh-review/broker 路径仅为只读历史证据、不是可执行 fallback；`prd.md:589-592`（INTEG-1）；母 PRD 只读（ADR-007）；不新增审查点（V-006..V-010）。
- 选项：G-001＝A 历史原件 + 本轮受控演练／B 仅历史原件／C 仅本轮受控演练；G-002＝A 只在本卡如实记录，不动母任务／B 写母任务层面文件并出具用词修正建议／C 不记录；G-003＝A 补跑一次细节审查、处置完再进确认／B 不补跑直接确认／C 补跑并反复复审直至无新发现。
- 决定：ADR-013、ADR-014、ADR-015。
- 功能/消费者：`## 验收面` 用例 7 路径②取证形态（consumer＝verify-code 核对记录与用户抽验）；INTEG-1 缺口去向（consumer＝`## 未决项` 与后续跟进者）；`## 最终确认` 前置（consumer＝CARD-10 owner 与用户）。
- 验收：`## 验收面` 用例 7；`## 成功/失败边界` ⑦；`## 未决项` OPEN-006；`## grill（质询）` 三条结论引用。

### ADR-013

- **source**：Grill 第 1 批（2026-10-05）问题 G-001 选项选择 A（U-015、V-022）；`## 验收面` 用例 7 路径②（`prd.md:605`，SD-05）；F-012（历史不可用原件）；ADR-008。
- **decision**：关键失败路径②「审查工具不可用」的**取证形态＝历史真实原件 + 本轮受控演练两层并用**——①引用归档中真实存在的不可用原件作**历史事实**（CARD-05 共 26 份 `OCR_DELEGATION_UNAVAILABLE`、CARD-04 共 2 份 `OCR_ALL_PROVIDERS_FAILED`，代表件与字段见 F-012）；②**本轮**真跑现成真实入口用例 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs`，取得**本轮亲历**的不可用记录与原始字节（断言保留于 `quality/reviews/<name>.output`，精确字节 `[0xff,0x00,0x41]`）。
- **rationale**：仅引用归档会缺本轮亲历执行记录；只用本轮演练又会把证据强度押在一次受控注入上。两层并用让路径②既有可追溯的历史事实，又有本轮可复算的执行原件。三条边界必须同条写死，否则两层证据会被读成自然故障亲历：(i) 该用例是**受控故障注入**（注入 `services.runReviewRound`，`error.code:"OWNED_UNAVAILABLE"`、`message:"controlled no-model review"`），不是自然发生的工具故障；(ii) **「独立替代审查真的顶班」在整个归档中从未发生过**（该分支只以代码 `runtime/review/ocr-delegation-adapter.mjs:22` `not_installed: ENOENT`、`:33` below-1.12.9、测试与一条评审意见存在）；(iii) 本轮 `ocr` 实测在位（`open-code-review v1.12.12`，`<ocr-bin>`，高于回退阈值 1.12.9），故走受控注入路径而非真实缺失路径。
- **consequence**：`## 验收面` 用例 7 的「取证形态待定稿」占位由本 ADR 定稿替换；核对记录必须同时写明受控注入性质与「独立替代从未发生」这一事实。**风险如实写明**——受控注入的证据强度弱于自然故障，须靠如实标注补足，不得把受控注入写成自然发生的工具故障。
- **supersedes**：N/A（不废止 ADR-008 的真证据取法；仅把 `## 验收面` 用例 7 的取证形态占位定稿替换）。
- **原始声明层**：U-015、V-022（Grill 第 1 批 G-001 选项选择）；`prd.md:605`、`:60`；F-012。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-015/V-022）→ R-004 → F-012 → ADR-013。
- **三档结论**：`confirmed`
- **approval_binding**：Grill 第 1 批（2026-10-05）问题 G-001 选项选择 A（推荐项）（U-015、V-022）。该答复为**选项选择**，非自由文本口述，经**提问工具** `ask_user_question` 取得。
- **ADR 三项判据**：(1) **难以反转**——取证形态一旦写进核对记录，verify-code 与用户抽验都按它读；改口径要同时改用例 7、成功/失败边界与核对记录，且已产出的本轮原件不会随口径消失。(2) **无背景会意外**——不读 F-012 与用例源码的人会把「本轮不可用记录」当成自然故障亲历，并会以为「独立替代审查真的顶班」发生过。(3) **存在真实取舍**——在「仅历史原件（证据强度低但无需本轮执行）」「仅本轮受控演练（亲历但受控）」「两层并用（成本更高、须额外如实标注）」之间取舍。
- **owner/next_action**：CARD-10 owner；verify-code 按两层取证形态产出路径②核对记录，并写明受控注入性质与「独立替代从未发生」。
```text
module: key-failure-path2-evidence-form
requirement_ids: [R-004]
derived_from: []
artifacts: [decision-log.md#用例-7, decision-log.md#成功失败边界]
```

### ADR-014

- **source**：Grill 第 1 批（2026-10-05）问题 G-002 选项选择 A（U-016、V-023）；`prd.md:589-592`（INTEG-1）；蓝图 `docs/contracts/card-01-stage-material-interface.md`（原始 46 行、sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`）；ADR-001（修订）、ADR-007（母 PRD 只读）。
- **decision**：INTEG-1 缺口的**去向形态＝只在本卡如实记录，不动母任务**——缺口根因（母 PRD 要求 Group 1 各卡实际消费 Group 0 冻结的阶段/材料接口蓝图，而**蓝图本身从未要求后续卡显式引用或留对照记录**，其 L3 只说「本蓝图供 CARD-02 到 CARD-10 读取」）只在本卡 decision-log 如实记录；**不写母任务层面的文件、不出具「母 PRD 用词修正建议」；承接方＝无**。
- **rationale**：Group 1 四卡材料对蓝图文件名/标题/首句/sha 的消费证据几乎全为零，仅 CARD-07 有行为级消费证据——提交 `18b8134a3e42b2707f1823f029e4d593a894daf0` 在 `runtime/stage/stage-context.mjs` import 区新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`，佐证 CARD-07 `specs/archive/workflowhub-thin-core-card-07-20260919/spec.md:332` 逐字为「CARD-01 `task-topology.mjs` 是唯一 topology owner.」。要求与实际不匹配的根因在母 PRD 与蓝图一侧，而本卡受 ADR-007（母 PRD 只读）与「母材料只读」边界约束，无权改母任务；越界出具修正建议会造出本卡无法承接的承诺。
- **consequence**：本卡边界保持「母材料只读」；缺口有据可查但无承接方，`## 未决项` 新增 OPEN-006（承接方＝无，本卡不承接、仅记录）。**风险如实写明**——母 PRD 该要求会长期停在「要求与实际对不上」的状态，需后续有人主动跟进。
- **supersedes**：N/A（**口径细化**：把此前各处写的「交回母任务层面」细化为「承接方＝无，只在本卡如实记录」；不写母任务层面文件、不出具母 PRD 用词修正建议，相关表述以本项为准）。
- **原始声明层**：U-016、V-023（Grill 第 1 批 G-002 选项选择）；`prd.md:589-592`；U-013、V-020。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-016/V-023）→ R-008 → F-001 → ADR-014。
- **三档结论**：`confirmed`
- **approval_binding**：Grill 第 1 批（2026-10-05）问题 G-002 选项选择 A（推荐项）（U-016、V-023）。该答复为**选项选择**，非自由文本口述，经**提问工具** `ask_user_question` 取得。
- **ADR 三项判据**：(1) **难以反转**——「承接方＝无」写进未决项后，后续若要接手需另起记录；本卡已声明不写母任务层面文件，反向操作会破坏「母材料只读」边界。(2) **无背景会意外**——不读蓝图原文的人会以为蓝图要求过后续卡引用，从而把 Group 1 的零消费证据读成「各卡违规」而非「要求本身不匹配」。(3) **存在真实取舍**——在「只在本卡记录（不动母任务，缺口无承接方）」「写母任务层面文件并出具用词修正建议（越出本卡边界）」与「不记录（缺口不可查）」之间取舍。
- **owner/next_action**：CARD-10 owner；verify-code/后续跟进者按 OPEN-006 读取缺口，本卡不承接修复。
```text
module: integ1-gap-disposition
requirement_ids: [R-008]
derived_from: []
artifacts: [decision-log.md#未决项, decision-log.md#成功失败边界]
```

### ADR-015

- **source**：Grill 第 1 批（2026-10-05）问题 G-003 选项选择 A（U-017、V-024）；make-decision 方法第 9 步（细节建议）；`## 审查处置`（direction track 两轮已跑）；V-008（不为追空 findings 重派未变范围）。
- **decision**：本阶段独立审查的**收口方式＝补跑一次细节审查，处置完再进确认**——按方法补跑**一次** `review_track:"detail"` 审查，findings 逐条处置（fixed / rejected_invalid / accepted_risk / needs_human）完毕后才进入 `## 最终确认`。
- **rationale**：make-decision 第 4 步的方向建议已真实跑两轮（第一轮 268 秒、重跑轮 491 秒），第 9 步的**细节建议一次未跑**；缺这一步会让 `## 最终确认` 在方法上不完整（无独立细节建议）。用户约束「审查最好只进行一次」按 V-008 口径解读为「不反复追空发现、不为同一 scope 复审」，与「补跑一次」相容。
- **consequence**：本阶段共三次审查调用（方向 2 + 细节 1）；`## 最终确认` 保持 `pending`（**历史表述，已完成**：该状态已于 2026-10-05 改为 `accepted`，见 `## 最终确认` 确认原件），其前置条件增加「detail track 独立审查已跑且 findings 逐条处置」。**风险如实写明**——用户曾交代「审查最好只进行一次获得异源审查建议即可」；我方对该约束的解读＝「不反复追空发现、不为同一 scope 复审」，已在本项如实登记并由用户以选项选择确认，**不得把该解读写成用户原话**。
- **supersedes**：N/A
- **原始声明层**：U-017、V-024（Grill 第 1 批 G-003 选项选择）；`## 审查处置` direction track 两轮记录。
- **三级追溯**：CARD-10 story（`prd.md:524-549` + U-017/V-024）→ R-005 → F-006、F-009 → ADR-015。
- **三档结论**：`confirmed`
- **approval_binding**：Grill 第 1 批（2026-10-05）问题 G-003 选项选择 A（推荐项）（U-017、V-024）。该答复为**选项选择**，非自由文本口述，经**提问工具** `ask_user_question` 取得。
- **ADR 三项判据**：(1) **难以反转**——补跑一旦执行就产生独立审查原件与 findings 处置记录，不能事后改口为「未跑」；且 `## 最终确认` 的前置条件已按本项改写。(2) **无背景会意外**——只读「审查最好只进行一次」这句话的人会以为补跑违背用户约束，必须同时给出 V-008 的「不为追空 findings 重派未变范围」口径。(3) **存在真实取舍**——在「补跑一次并逐条处置（多一次调用、方法完整）」「不补跑直接确认（省调用、方法缺第 9 步）」与「补跑并反复复审（过度、违背 V-008）」之间取舍。
- **owner/next_action**：CARD-10 owner；**ADR-015 的前置已满足——detail track 已于 2026-10-05T11:46:58.038Z–11:55:40.317Z 真实执行（原件 `quality/reviews/2026-10-05-021-make-decision-detail.json`），21 条 findings 已逐条处置（20 fixed / 1 accepted_risk，见 `#### 细节审查（detail track，DIR-D1）处置`）；下一步＝进入 `## 最终确认`。**该下一步已完成（2026-10-05）：`## 最终确认` 状态已由 `pending` 置 `accepted`，确认原件＝`<task-dir>/quality/evidence/human-confirmations/2026-10-05-001-make-decision-approve-decision.json`（`reply` 逐字 `A 确认收口（推荐）`；答复形式＝选项选择，经提问工具 `ask_user_question`，question_id `final-confirmation`）。**（历史表述，已完成：原写「先补跑一次 detail track 独立审查并逐条处置 findings，之后才进入 `## 最终确认`」，其后写「下一步＝进入 `## 最终确认`」。）
```text
module: independent-review-closure
requirement_ids: [R-005]
derived_from: []
artifacts: [decision-log.md#审查处置, decision-log.md#最终确认]
```

## 动态 Talk 批次

| batch_id / OI version | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001（r0，2026-10-05 make-decision 起草轮） | 5 个执行口径选择项（RED→GREEN 取法／E2E-3 失败注入／证据落点／PRD 只读／执行载体） | 各自后果与风险见 ADR-003..ADR-006 的 consequence | 逐项选定 A（推荐项）；**无逐字原文留存**（V-001 缺口） | 新增 OI-002/OI-003/OI-005 由 open → confirmed；ADR-003..ADR-006 落定 | Talk 第 1 轮；`## 需求变更记录` U-001 |
| T-001（r0，同上） | 承接决定 A：INTEG-3 判据如何裁定 | 若记 N/A 或删用例则违反 AC-47；若恢复并发上限则违反 CARD-09 D-001/D-022 | 认可（无逐字原文留存） | OI-002 open → confirmed；ADR-001 落定 | Talk 第 1 轮；`prd.md:603`（V-002） |
| T-001（r0，同上） | 承接决定 B：旧「全 phase 结束集成审查」如何处置 | 若按旧四段判 E2E-2 则与四个现行 skill 冲突；若机械补回则恢复退役门禁 | 认可（无逐字原文留存） | OI-003 open → confirmed；ADR-002 落定；退役登记新增一行 | Talk 第 1 轮；V-006..V-010 |
| T-001（r0，同上） | 任务类型：普通任务 vs 规划任务 | 选错会改变提问粒度与产物形态 | 普通任务（实施/验收类）（无逐字原文留存） | `## 任务身份` 落定 | Talk 第 1 轮；`prd.md:549` |
| T-002（Talk 第 2 轮，2026-10-05） | 轴一：E2E-2 的 RED→GREEN 取法（选项 A 推荐项 vs 其他） | 省略 G-2 豁免披露或「本卡无行为变更故无新 RED→GREEN」的界限，记录即滑向脚本自证（AC-48 `prd.md:536`）或直接跳过（SD-06 `prd.md:51`） | 选定 A（推荐项）；选项标签逐字见 V-012（**选项选择**，非自由文本口述） | ADR-003 口径补齐（G-2 豁免 + 可失败检查 + 复跑现成 oracle + 引用 CARD-09 归档原件）；OI-005 处置补充；`## 验收面` 用例 2 更新 | Talk 第 2 轮；`## 需求变更记录` U-005 |
| T-002（同上） | 轴二：关键失败路径第 2 条「审查工具不可用」的真证据来源（选项 A 推荐项 vs 其他） | 人为制造假失败会把 provider 失败伪造成核对记录（违反 SD-05 `prd.md:47`、SD-06 `prd.md:51`、AC-49 `prd.md:537`） | 选定 A（推荐项）；选项标签逐字见 V-013（**选项选择**） | 新增 ADR-008；`## 验收面` 用例 7 证据列更新；OI-009 处置补充 | Talk 第 2 轮；U-006 |
| T-002（同上） | 轴三：verify-code 实际跑哪些 oracle（选项 A 推荐项 vs 其他） | 全量跑 `tests/acceptance` 下所有 oracle 越界且接近无范围全量回归（违反测试硬规则与 AC-47 `prd.md:535`） | 选定 A（推荐项）；选项标签逐字见 V-014（**选项选择**） | 新增 ADR-009；`## 验收面` 用例 0/2 更新；OI-010 处置补充 | Talk 第 2 轮；U-007 |
| T-003（Talk 第 3 轮，2026-10-05） | 轴四：方向审查是否重跑（选项 A 推荐项 vs 其他） | 若照第一轮材料重跑，`current_selection` 仍未装已收敛 ADR 结论，约 15 条 findings 会继续「打空」；若不重跑，方向审查结论停留在材料滞后状态，不能作为 make-decision 的收敛事实 | 选定 A（推荐项）；选项标签逐字见 V-015（**选项选择**，非自由文本口述） | 新增 U-008；`current_selection` 补入 ADR-001/002/003修订/004/008/009 的结论与依据链后**重跑一轮方向审查**；`## 审查处置` 归并登记第一轮 20 条 findings（`DIR-R1-T1`..`T6`）并留「重跑轮 findings 处置」待补行 | Talk 第 3 轮；`## 需求变更记录` U-008 |
| T-003（同上） | 轴五：旧「全 phase 集成审查」的残余风险处置（选项 A 推荐项 vs 其他） | 若把它当「已披露即可放行」，等于用披露替代用户确认，AC-50 的未验证项披露会被读成放行依据；若按旧四段判 E2E-2 失败，又与四个现行 skill 冲突（N-004）；若机械补回则恢复退役门禁 | 选定 A（推荐项）；选项标签逐字见 V-016（**选项选择**） | 新增 U-009；ADR-002 修订（第③点记 `未验证（unverified）` + 放行依据=用户显式确认按现行三道审查点验收）；`## 退役登记（retirement）` 主表与新旧对应表第③行同步；`## 成功/失败边界` 增列该失败模式 | Talk 第 3 轮；U-009 |
| T-004（Talk 第 4 轮，2026-10-05） | 轴六：E2E-2 的集成审查处置（选项 B vs 其他） | 若 CARD-10 自行改写 PRD 判据即为越权（`prd.md:603` 只授权 INTEG-3 改判据，未授权 E2E-2）；若按旧四段判 E2E-2 失败则与四个现行 skill 冲突 | 选定 B；选项标签逐字见 V-017（**选项选择**，非自由文本口述） | 新增 U-010；ADR-002 第二次修订（放行依据升级为**用户以母任务 owner 身份正式授权**按现行三审查点验收）；`## 退役登记（retirement）` ③行同步 | Talk 第 4 轮；`## 需求变更记录` U-010 |
| T-004（同上） | 轴七：E2E-2 证据主体（选项 A 推荐项 vs 其他） | 以本卡自身执行为主证据不可行（本卡无新实现、不拆 Phase，产不出 phase 级代码审查原件）；虚报则违反 AC-48 | 选定 A（推荐项）；选项标签逐字见 V-018（**选项选择**） | 新增 U-011、ADR-010；`## 验收面` 用例 2 证据主体改为「CARD-09 归档为主 + 本卡执行补充」 | Talk 第 4 轮；U-011 |
| T-004（同上） | 轴八：E2E-1 与跨卡用例取证口径（选项 A 推荐项 vs 其他） | 停在「归档复用 + 存在性核对」会触发第二轮 blocking（findings #2）并违反 `prd.md:607`/AC-48 | 选定 A（推荐项）；选项标签逐字见 V-019（**选项选择**） | 新增 U-012、ADR-011；`## 验收面` 用例 1 证据列改为逐条真实入口证据映射 | Talk 第 4 轮；U-012 |
| T-004（同上） | 轴九：INTEG-1 判什么（选项 A 推荐项 vs 其他） | 判 `passed` 与「可观察结果未完全满足」矛盾；记 N/A/删用例违反 AC-47 | 选定 A（推荐项）；选项标签逐字见 V-020（**选项选择**） | 新增 U-013；ADR-001 修订（INTEG-1 判 `unverified`）；`## 验收面` 用例 4 写全成功/失败条件与证据；缺口去向＝**承接方＝无，只在本卡如实记录**（U-016／ADR-014 细化） | Talk 第 4 轮；U-013 |
| T-005（Talk 第 5 轮，2026-10-05） | 轴十：最终完成宣称口径（选项 A 推荐项 vs 其他；**由第 4 轮轴六/轴九的答案重排后新增**） | 静默把 `unverified` 当 `passed` 会让完成宣称缺未验证项披露（AC-50 失败）；把 `unverified` 当失败则与「判据未触发」矛盾并触发 `prd.md:607` 阻断 | 选定 A（推荐项）；选项标签逐字见 V-021（**选项选择**，非自由文本口述） | 新增 U-014、ADR-012；`## 成功/失败边界` 增列完成宣称披露口径与两条失败模式 | Talk 第 5 轮；`## 需求变更记录` U-014 |
| T-006（CARD-10 make-decision 收口前，2026-10-05） | INTEG-3 中「审查节奏点＝现行三审查点」这一表述是否为对 `prd.md:603` 的解释性读法（选项 A 认可该读法 vs 改判） | 若将来有人认为这条超出 `prd.md:603` 字面授权，INTEG-3 判据会被指为越权改写——故须把「用户以母任务 owner 身份作出的裁定」与授权边界一并写死 | 选定 A（推荐项）；选项标签逐字见 V-025（**选项选择**，非自由文本口述；经提问工具 `ask_user_question`，question_id `inte3-reading`） | 新增 U-018；`### ADR-001` 末尾追加「授权边界注（2026-10-05，U-018/V-025 后）」；`## 验收面` 用例 6 判据定稿（不再挂「解释性读法待裁」标记）；`## 最终确认` 待展示项一条转为已裁定 | CARD-10 make-decision 收口前；`prd.md:603`（V-002） |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | 母 PRD CARD-10 卡正文与总体集成验收套件的结构与行号 | `prd.md:524-549` 卡正文（FR-47..50 `:530-533`、AC-47..50 `:535-538`、oracle `:539`、依赖 `:540-543`、风险 `:546`、可后置 `:547`、五阶段开工说明 `:549`）；套件 `prd.md:551-607`（第一部分 `:555-557`、E2E-1 `:561-567`、E2E-2 `:569-575`、E2E-3 `:577-583`、INTEG-1 `:589-592`、INTEG-2 `:594-597`、INTEG-3 `:599-602`、上游变化注 `:603`、关键失败路径 `:605`、执行纪律 `:607`） | 已消费 | ADR-001..ADR-012 |
| F-002 | 并行分组与共享写面（INTEG-1/2/3 的组依据） | `prd.md:126` Group 0 串行基座=CARD-01→CARD-02（阶段拓扑与材料契约=全部后续卡的接口蓝图）；`prd.md:127` Group 1=CARD-03、04、05、07（CARD-04↔CARD-07 共享 make-decision 写面、CARD-05↔CARD-09 共享审查基建）；`prd.md:128` Group 2=CARD-06→(CARD-08、CARD-09)；`prd.md:129` Group 3=CARD-10 独占 | 已消费 | ADR-001 |
| F-003 | make-decision 阶段的记录与授权边界 | make-decision **不写** `facts.jsonl`：`runtime/task/task-store.mjs:84` 是唯一 writer，唯一调用点 `tools/cli/stage-runtime.mjs:803`，只写 build-code `phase_progress` 游标；本阶段无不可逆 Git 动作、不需要 authorize | 已消费 | ADR-005；`## 质量边界` |
| F-004 | 证据落点实况 | 规划任务外置目录 `quality/confirmations/` 实存 6 份（E2E-1 证据）；CARD-09 外置 `quality/reviews/` 实存 E2E-2 证据四项且文件名逐字匹配；CARD-01..08 外置目录与 `quality/` 子目录形态已核实；CARD-10 外置目录现状=`task.json`、0 字节 `facts.jsonl`、`quality/{reviews,tests}`；CARD-09 `quality/` 子目录=`reviews`、`tests`、`evidence/{execution-inputs,human-confirmations,close,handoff,git-authorizations,sources}` | 已消费 | ADR-005、ADR-008 |
| F-005 | 仓库现成 oracle 清单 | 任务 worktree `tests/acceptance/` 实存 10 个文件：`build-prd-current.mjs`、`card-01-current.mjs`、`card-02-current.mjs`、`card-02-current.test.mjs`、`card-03-current.mjs`、`card-03-current.test.mjs`、`card-07-current.mjs`、`card-09-session-ledger.mjs`、`card-09-session-ledger.test.mjs`、`workflowhub-research-handoff-hardening.acceptance.mjs`；**无** card-04/05/06/08 oracle；`card-09-session-ledger.mjs` 即 `workflows/build-code/SKILL.md:24` 点名者 | 已消费 | ADR-003、ADR-006、ADR-009 |
| F-006 | 本机 make-decision 审查路由与成本 | `<wh-config>` 的 `wh_review.stages["make-decision"].direction` 与 `.detail` 均为 `{initial:["kimi/coding","antigravity/flash","codex/luna"], minimum_heterologous:1, mode:"single_round"}`；每轮=3 provider × 2 role = **6 次调用**；CARD-09 实测单轮约 **1752.5 s**。审查入口：`node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-10-20260919 --input=<abs {"request":{...}}>`，产物落 `<taskPath>/quality/reviews/`。确认入口：`node tools/cli/stage-runtime.mjs confirm --action=decision --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-10-20260919 --input=<abs json>`，落 `quality/evidence/human-confirmations/` | 已消费 | RISK-006；`## 审查处置`、`## 最终确认` 的入口依据 |
| F-007 | CARD-09 归档 decision-log 的骨架与关键决定 | 归档文件 `specs/archive/workflowhub-thin-core-card-09-20260919/decision-log.md`（1033 行）：D-001 `:498`（撤销限并发）、D-022 `:519`、D-031（FR-46 改验真实派发行为）、D-044（无固定墙钟截止）、D-046（真冗余=请求文件内嵌整份材料）、D-048（审查次数约束） | 已消费 | ADR-001、ADR-002、ADR-008 |
| F-008 | Talk 第 2 轮三条选项选择答复及其证据取法面 | 轴一/轴二/轴三均为**选项选择**（U-005..U-007，逐字选项标签 V-012..V-014）；轴一要求如实走 G-2 豁免披露并复跑现成 oracle + 引用 CARD-09 归档原件；轴二要求先检索 CARD-09 与规划任务已有真实不可用原件、本轮真出现才记录、不人为制造假失败；轴三限定只跑三个直接相关 oracle（`tests/acceptance/card-09-session-ledger.mjs`、`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`，后两者已只读核实在位），其余 CARD-01..09 只做原件存在性核对 + 归档引用 | 已消费 | ADR-003（修订）、ADR-008、ADR-009 |
| F-009 | 第二轮方向审查原件与 findings 主题面 | `quality/reviews/2026-10-05-014-make-decision-direction.json`（`version=wh-review-result.v1`、`status=available`、`outcome=completed`、`pair_status=complete`、`review_track=direction`、`subject_kind=document`、`started_at=2026-10-05T10:26:54.035Z`、`completed_at=2026-10-05T10:35:05.342Z`）+ 6 份 provider `.output`（`2026-10-05-008..013-make-decision-document-provider-1..6.output`）；**12 条 findings / 1 条 blocking**（findings 元素**无 id 字段**）；主题＝E2E-1 与用例 4/5 被降级为归档复用 + 存在性核对（#1、#2 blocking、#7、#10）、E2E-2 证据主体不可行（#3、#5、#11）、E2E-2 集成审查退役越权（#4、#12）、路径②证据被脱敏为占位符（#6）、缺用户抽验权通路交付物（#8）、失败注入取得方式未界定（#9）；主题归并处置见 `## 审查处置` `DIR-R2-T1`..`T7` | 已消费 | ADR-010、ADR-011、ADR-012；`## 审查处置` |
| F-010 | Talk 第 4/5 轮五条选项选择答复及其处置面 | 轴六选 **B**（用户以母任务 owner 身份正式授权按现行三审查点验收，U-010/V-017）、轴七选 A（CARD-09 归档为主 + 本卡执行补充，U-011/V-018）、轴八选 A（逐条真实入口证据映射，U-012/V-019）、轴九选 A（INTEG-1 判 `unverified`，U-013/V-020）、轴十选 A（声明完成 + 显式披露未验证项与缺口去向，U-014/V-021）；五条均为**选项选择**，非自由文本口述 | 已消费 | ADR-001（修订）、ADR-002（第二次修订）、ADR-010、ADR-011、ADR-012 |
| F-011 | INTEG-1 事实面（蓝图原件、迁移登记、消费证据、时间关系） | 蓝图 `docs/contracts/card-01-stage-material-interface.md` 历史版本 46 行 / sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`、由 `d1097711` 新增、经 `d0ca5091` 进 main；HEAD 已被重写为 761 字节 / 5 行 / 首行 `# 当前材料接口` / sha256 `1ab0afe45c9001e93ca95091d8bff848980c11f6f19810bd03d779214554df72`；`runtime/task/task-topology.mjs` 在 HEAD ABSENT；CARD-06 迁移表 MT-7-078（`migration-table.md:892`、`migration-table-part6-docs-pre-g3.md:148`）为 NARROW / B7-P8 且附回滚；CARD-07 `18b8134a` 在 `runtime/stage/stage-context.mjs` 新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`、其 `spec.md:332` 与 `phases/P1.md:86` 佐证；CARD-03/04/05 无消费证据；四卡关闭时间（CARD-03 `2026-10-01T11:27:31.082Z`、CARD-04 `2026-09-29T07:20:00.730Z`、CARD-05 `2026-09-26T05:05:37.721Z`、CARD-07 `2026-09-22T11:24:41.615Z`）全部早于 `457299b3`（2026-10-04 00:02:20 +0800）与 `7c4a2444`（2026-10-04 00:39:25 +0800） | 已消费 | ADR-001（修订）、ADR-011、U-013 |
| F-012 | 审查工具不可用的真实原件清单（关键失败路径②的取证基础） | 归档中确实存在「审查工具确实不可用、系统如实记为 unavailable」的真实原件，分两类——①**CARD-05 共 26 份 `OCR_DELEGATION_UNAVAILABLE`**，代表件 `workflowhub-thin-core-card-05-20260919/quality/reviews/attempts/789516a8-54ab-5fd7-a963-0991fc2c79ed/attempt.json`：`stage: build-code`、`phase_id: P4`、`provider_attempts: []`、`terminal_status: "unavailable"`、`dispatch_state: "blocked_before_dispatch"`，原文 `"host OCR delegation executor is unavailable; no legacy review fallback was used"`；报告侧 `status: unavailable`／`semantic_status: "unavailable"`／`coverage: "incomplete"`／`provider_results: []`／`runtime_id: "ocr-delegation"`；产出方 `runtime/review/ocr-delegation-adapter.mjs:291`，契约测试 `tests/contract/ocr-delegation-adapter.test.mjs:898,954`；②**CARD-04 共 2 份 `OCR_ALL_PROVIDERS_FAILED`**，`workflowhub-thin-core-card-04-20260919/quality/reviews/attempts/489a8486-1a56-573c-a4a9-c9ce9ec043dc/attempt.json` 与 `eb0c971f-7f5f-530a-a98d-aba82fd5d3d5/attempt.json`：`stage: verify-code`、`terminal_status: "unavailable"`、`dispatch_state: "dispatched"`、原文 `"all configured OCR host providers failed"`（逐家失败：`OCR_PROVIDER_TIMEOUT` "OCR provider exceeded 600000 ms"、`OCR_PROVIDER_EXIT_NONZERO` "Eligibility check failed…not eligible for Antigravity"、`OCR_PROVIDER_UNSUPPORTED` "Kimi direct OCR cannot enforce read-only packet isolation"）；③另有真实超时/取消组：card-01 `REVIEW_WAIT_EXCEEDED` "managed review did not reach a terminal state within 1200000 ms; the broker was NOT cancelled and may still complete" 与 `REVIEW_CANCELLED` "…produced no provider output after 13 minutes and was cancelled by the current WorkflowHub session."；card-02 `REVIEW_EXECUTION_TIMEOUT` "review round exceeded 65000 ms" 与 `REVIEW_CANCELLED` "review record interrupted by SIGINT"；card-07 7× `REVIEW_CANCELLED` / 2× `REVIEW_WAIT_EXCEEDED` / 2× `REVIEW_QUORUM_INCOMPLETE`。**必须同条写明的三条边界事实**：(i) 全归档**没有任何一份**「`ocr` 命令不存在（ENOENT）或版本低于 1.12.9 → 真的执行了独立替代审查」的原件——该分支只以代码（`runtime/review/ocr-delegation-adapter.mjs:22` `not_installed: ENOENT`、`:33` below-1.12.9）、测试与一条评审意见（card-09 `quality/reviews/2026-10-05-005-build-code-phase-p1.json` 讨论 `not_installed` 兜底分支）存在；全卡 `runtime_id` 普查从未出现 wh-review 回退运行时。(ii) 母 PRD `:60`（SD-08）自述旧 wh-review/broker 路径**仅为只读历史证据、不是可执行 fallback**，且「审查工具 unavailable 时采用一次由未参与实现者完成的独立替代审查…若独立替代也不可用，该审查事实记 unverified 并如实披露，不冒充已审」。(iii) 四个点名目录**都不是**工具不可用记录：`review-late-results/`（broker 真跑了、仅因信封 identity 不一致才记 unavailable，`INDEX.md` 原文 "This is raw preservation of independent broker-side evidence. It is NOT a review pass, NOT a quality verdict, NOT a stage completion."）、`review-protocol-repair/RED-GREEN.md`（协议缺陷修复）、`stage-quality-missing/make-decision/human_confirmation-6514a747….json`（`status: "missing"`、主体是「人确认」）、`stage-reflection-availability/`（`state: "unavailable"`、`reason_code: "executor_absent"`、主体是 stage-reflection）。另记 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs:13` 是**受控桩**（注入 `services.runReviewRound`，`code:"OWNED_UNAVAILABLE"`、`message:"controlled no-model review"`），非真实 provider 调用；`:19` 断言原始字节保留于 `quality/reviews/<name>.output`，精确字节 `[0xff,0x00,0x41]`。 | 已消费 | ADR-008、`## 验收面` 用例 7、`prd.md:60`/`:578-581`/`:605` |
| F-013 | E2E-1 证据链事实与两处必须如实披露的发现 | ①`quality/confirmations/` 共 **6 份**确认，全部 `schema_version: human-confirmation.v3`、`stage: "make-decision"`、`decision: "accepted"`，**无任何一份的 `subject_ref` 指向 `prd.md`**（4 份绑 `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md` 或 `null`，`step_slug: approve-decision`；2 份为 `authorize-delivery`，`reply_text` "可以提交、合并、推送、清理了,不用归档。后续任务我自己创建"）；**文件层面没有「确认人」字段**（字段集＝schema_version/task_id/stage/decision/subject_ref/material_revision/snapshot_tree/confirmed_at/reply_text/step_slug），host-visible 绑定＝`snapshot_tree` + `material_revision`；`human-confirmation.v3.schema.json` 不在仓库内（仓库只有 v1）。②对**最终 PRD 本体**的确认记录在 `quality/evidence/portable-workflow-outcomes/build-prd/8da4882ea75778316284cdffb4c92139e51a230f7ec94ac9eafc412f8fd8c8b4.json`，其 `reply_text` 原文含「批准为最终 PRD」、`human_approved=true`、`display_before_reply=true`、`decision_revision=revision-9ede5110…`、`prd_revision=revision-139a5017…(展示稿 hash)`，`material_refs` 含 `{"kind":"prd","path":"specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md","sha256":"f05577c30a74931f11bfea3b11d37fbf4bec602a49a92bf9bb7eb12761a9e8f9","status":"final"}`；该 JSON 正是确认 `5472fd25b1682d8dce062dddccfb84b045e62fb9c050f15550cc1e8779e881ba.json` 的 `subject_ref`。另一较旧产出 `…/build-prd/882f8a95*.json` 记 prd `sha256: 51d8764e1ee876f91d5c2850af2697b29d7d244bb86d308fd732196faac79c7f`。③**发现一（字节指纹变化，原因已定位）**：PRD 当前 sha256＝`deb2da5620e5fd97b52028d810b2ee6bcc1c6c090360d8696a7c2ede15257905`（698 行 / 140544 字节），与确认时记录的 `f05577c3…`、`51d8764e…` **均不匹配**；原因是 2026-10-04 那次「只注不改」的上游变化注（`prd.md:603` 的 INTEG-3 前提失效注）在确认之后追加；而确认绑定的 **`Decision revision: revision-9ede5110c44f2b08ae6fe31b4709eabe9a3f22daeba5772293fe2d7ae96fb0fb` 与当前 `prd.md:3` 逐字一致**；planning worktree 已删除（无法回算被绑定字节）。④**发现二（阶段序列）**：planning 的 `facts.jsonl` **恰好 1 行**，`stage` 取值全集 ＝ `{make-decision}`，`created_at` ＝ `2026-09-19T08:20:42.545Z`，`review_origin: "not_run"`、`handoff: null`（理由 "the current plan.md was not readable for this stage-end write"）；`build-plan`/`build-code`/`verify-code` **从未出现**；**`build-prd` 也从未作为 stage 行出现**，只以 `quality/evidence/portable-workflow-outcomes/build-prd/` 产出形式存在——这与接口蓝图 L21「`build-prd` 是规划任务的 portable workflow…不成为第六正式阶段」一致，故**支持** E2E-1 而非缺陷；`facts.jsonl` 内**无** PRD 最终确认行，PRD/确认事实落在 `quality/facts/`（62 文件，7 份 `kind: "confirmation"`/`subject: "human_confirmation"`/`stage: "make-decision"`，6× passed、1× missing，无一命名 PRD）。 | 已消费 | ADR-011、`## 验收面` 用例 1、`prd.md:566`/`:567`、RISK-008 同类（新增披露项） |
| F-014 | 术语事实：第一部分不是用例 | 母 PRD 逐字——`:551` `### 总体集成验收套件(PRD 级,由 CARD-10 执行而非发明)`；`:553` `…第一部分是整体完成的**输入核对**(存在性核对,不是用例);第二、三部分是**套件内用例**,任一失败即整体不完成。`；`:555` `**第一部分:各卡验收事实汇集与存在性核对(输入引用,非逐条复核)+ 用户抽验权**`；`:557` `CARD-10 汇集 CARD-01..09 的验收事实作为**输入引用**:对每卡核对其验收事实存在且结论未被漂白(存在性核对),不重跑各卡内部测试,也**不逐条复核各卡 AC 的内容**…**用户抽验权**:用户可按需抽验任何卡的任何 AC 事实,CARD-10 须提供定位与原文通路;抽验发现的漂白或伪造按失败事实如实处理(2026-09-19 加固修订 R1)。`；`:559` `**第二部分:命名端到端用例**`。 | 已消费 | ADR-005、`## 验收面` |

## 调研候选交付

本卡 make-decision 阶段**无外部研究候选**（无第三方调研报告、无厂商对比、无候选技术选型）：本卡的「调研」全部是仓库与母 PRD 的只读事实核对（F-001..F-014），事实本身即证据，直接以行号引用，不需要二次报告。CARD-05 的审查工具选型研究属 CARD-05 责任，本卡只消费其验收事实（`prd.md:527`、`:557`）。

Talk 第 2 轮的三条选项选择（U-005..U-007）同样**不产生新的外部研究候选**：其证据取法分别落在 ADR-003（修订）、ADR-008、ADR-009（F-008），仍只消费仓库与 CARD-09 归档的只读原件。

Talk 第 3 轮的两条选项选择（U-008..U-009）同样**不产生新的外部研究候选**：U-008 只改 make-decision 方向审查的材料（`current_selection` 补入已收敛 ADR 结论）与执行方式（重跑一轮，仍属同一次方向审查），U-009 只改 ADR-002 的放行口径（第③点记 `未验证（unverified）` + 放行依据=用户显式确认），两者都不新增外部研究，仍只消费仓库与 CARD-09 归档的只读原件。

Talk 第 4 轮的四条选项选择（U-010..U-013）与 Talk 第 5 轮的一条（U-014）同样**不产生新的外部研究候选**：轴六只改 ADR-002 的放行依据（升级为**用户以母任务 owner 身份正式授权**按现行三审查点验收）、轴七只改 E2E-2 证据主体（CARD-09 归档为主 + 本卡执行补充）、轴八只改取证形态（逐条真实入口证据映射，oracle 只做单文件定向执行）、轴九只定 INTEG-1 的裁决（`unverified`）、轴十只定完成宣称口径（声明完成 + 显式披露未验证项与缺口去向）；五者都不新增外部研究，仍只消费仓库、母 PRD 与 CARD-09 归档的只读原件（F-009、F-010、F-011）。

Grill 第 1 批的三条选项选择（U-015..U-017，2026-10-05）同样**不产生新的外部研究候选**：G-001 只定 `## 验收面` 用例 7 路径②的取证形态（历史真实原件 F-012 + 本轮受控演练两层）、G-002 只定 INTEG-1 缺口的去向（只在本卡如实记录，承接方＝无）、G-003 只定本阶段独立审查的收口（补跑一次 detail track），三者都只消费仓库、母 PRD、蓝图 `docs/contracts/card-01-stage-material-interface.md` 与 CARD-04/05 归档的只读原件，不新增第三方调研报告或技术选型候选。

## grill（质询）

**状态：已完成（completed）。** 本节的**覆盖矩阵**与**四项客观退出检查**已按只读事实登记，五类原始消息**已全覆盖**、四项客观退出检查**全部 pass**；**第 1 批 frontier 问题（G-001..G-003）已取得真实答复**（**选项选择**，经**提问工具** `ask_user_question` 取得，非自由文本口述），结论落 U-015..U-017／V-022..V-024／ADR-013..ADR-015。**本阶段无第二批问题**——理由＝剩余开放项均属 build-plan 才定的用例参数细节（fixture、采样命令、环境假设、N/A+reason，依母 PRD `:547`），在本阶段再提问不会改变任何本卡决定。

### 覆盖矩阵（五类原始消息）

| 类别 | 落点（R 编号 / ADR 编号 / 母 PRD 行号） | 是否需用户选择 | 不提问的事实理由 |
| --- | --- | --- | --- |
| `goal`（目标与成功意图） | 母 PRD CARD-10 卡 `prd.md:524-549`；用户开工指令 U-001..U-004 等；R-001、R-005、R-009、R-011；ADR-001、ADR-002、ADR-007、ADR-012 | 不需再问 | 已由 Talk 第 1–5 轮覆盖（U-001..U-014）；目标与成功意图已在母 PRD 卡正文与逐轮答复中定死，无未决歧义 |
| `flow_or_surface`（用户旅程与入口范围） | E2E-1 规划旅程 `prd.md:561-567`、E2E-2 实施旅程 `prd.md:569-575`；R-002、R-007；ADR-010、ADR-011 | 不需再问 | Talk 第 4 轮轴七/轴八已定（U-011/V-018、U-012/V-019）：两条真实入口、证据主体与逐条证据映射已钉死 |
| `data_or_state`（数据、状态与状态变化） | 证据落点＝外置 `quality/`、仓库不复制（U-003、ADR-005、`prd.md:544`）；七值状态与 `quality/**` 归属；本阶段不写任务事实账（F-003）；R-003、R-010；`prd.md:557` | 不需再问 | 已定：原始件全落外置 `quality/`（ADR-005）；本阶段不写任务事实账（F-003：make-decision 不写 `facts.jsonl`，唯一 writer＝`runtime/task/task-store.mjs:84`，唯一调用点＝`tools/cli/stage-runtime.mjs:803`） |
| `success_failure_acceptance`（成功失败验收边界） | AC-47..50 `prd.md:535-538`；失败不漂白 `prd.md:580-582`；INTEG-1 判 `unverified` `prd.md:589-592`；完成宣称披露口径 `prd.md:538`/`:607`；R-002、R-004、R-005、R-006、R-008；ADR-001（修订）、ADR-012 | 不需再问 | Talk 第 4/5 轮已定（U-013/V-020 判 `unverified`；U-014/V-021 完成宣称口径）；判据逐条照抄母 PRD |
| `constraint_non_goal_defer`（约束、非目标、延期） | 非目标：不改母 PRD、不改 `workflows/`、不改 `tests/`、不做新实现、不做全量回归（ADR-007、ADR-009、`prd.md:549` 第③条）；延期项留 build-plan（`prd.md:547`、OPEN-002）；R-009、R-011 | 不需再问 | 已定：约束与非目标写入 `## 非目标`；用例参数细节（fixture／采样命令／环境假设／N/A+reason）按 `prd.md:547` 明确留本卡 build-plan |

### 四项客观退出检查

| 检查项 | 结论 | 事实依据 |
| --- | --- | --- |
| 外部依赖接口已核实真实定义 | **pass** | 审查入口与产物落点已**两轮真实跑通实测**（F-006；F-009、`## 审查处置` direction track 两轮原件 `2026-10-05-007` 与 `2026-10-05-014`）；`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 与 `tests/acceptance/*` 已读实测（F-005、F-008） |
| 字段/路径命名有唯一权威定义 | **pass（含一处术语对齐）** | 旧「全 phase 结束集成审查」对现行三审查点已在 `## 退役登记（retirement）` 显式登记（ADR-002；V-006..V-010）；「第一部分不是用例」的命名冲突已按 `prd.md:553` 对齐（F-014、任务 B，见 `## 验收面` 的术语对齐段） |
| 失败路径/异常语义明确 | **pass** | `prd.md:535-538`/`:566`/`:574`/`:582`/`:591`/`:596`/`:605` 逐条照抄，并已增补 ADR 级失败条件（ADR-001、ADR-002、ADR-003、ADR-008、ADR-009、ADR-012）；关键失败路径②的真实原件清单已取得（**F-012**） |
| 范围边界「做什么/不做什么」写死、无隐性口头扩大 | **pass** | 见 `## 非目标` 与 `## 成功/失败边界`（ADR-007、ADR-009；`prd.md:547`、`:549` 第③条） |

### 第 1 批 frontier 问题（已答复：选项选择）

| 编号 | 轴 | 影响范围（一句话） | 选项数与推荐项 | 状态 | 事实依据 |
| --- | --- | --- | --- | --- | --- |
| G-001 | 关键失败路径②「审查工具不可用」的取证形态 | 决定 `## 验收面` 用例 7 路径②的核对记录写成「引用历史原件」「本轮受控演练」还是「两者并用」，直接影响该记录的证据强度与如实性口径 | **3 项**（历史原件 / 本轮受控演练 / 两者并用）；推荐项：本文件**不代为标注、不代为选定**（无已核实的推荐记录，待真实答复时由用户选定） | 已答复（选项选择） | **F-012**（真实原件清单 + 三条边界事实）；母 PRD `:60`（SD-08）、`:578-581`、`:605`；ADR-008 |
| G-002 | INTEG-1 缺口的去向形态 | 决定「PRD 用词与制品现实不匹配」是只记录不动母任务、登记为母任务未决项，还是本卡另出用词修正建议 | **3 项**（只记录不动母任务 / 登记为母任务未决项 / 本卡另出用词修正建议）；推荐项：本文件**不代为标注、不代为选定**（无已核实的推荐记录，待真实答复时由用户选定） | 已答复（选项选择） | U-013、ADR-001（修订）；`prd.md:589-592`；`## 未决项` OPEN-001 的缺口去向 |
| G-003 | 本阶段独立审查的收口方式 | 决定 detail track 是补跑一次细节审查、不跑并如实披露，还是方向与细节合并一次 | **3 项**（补跑一次细节审查 / 不跑并如实披露 / 方向与细节合并一次）；推荐项：本文件**不代为标注、不代为选定**（无已核实的推荐记录，待真实答复时由用户选定） | 已答复（选项选择） | make-decision 方法第 9 步；用户「审查最好只进行一次」约束；`## 审查处置` detail track **已执行一轮 DIR-D1**（21 条 findings 已逐条处置，处置后本行按现行状态同步） |

- **G-001 结论**：`A 历史原件 + 本轮受控演练（推荐）`（**选项选择**，经提问工具 `ask_user_question`）→ U-015／V-022／ADR-013。
- **G-002 结论**：`A 只在本卡如实记录，不动母任务（推荐）`（**选项选择**，经提问工具 `ask_user_question`）→ U-016／V-023／ADR-014。
- **G-003 结论**：`A 补跑一次细节审查，处置完再进确认（推荐）`（**选项选择**，经提问工具 `ask_user_question`）→ U-017／V-024／ADR-015。
- **答复形式说明**：三条均为**选项选择**（**非自由文本口述**）；界面标签自带「（推荐）」字样——上表「本文件不代为标注、不代为选定」指**答复前本文件不预填推荐项**，答复后按界面原文逐字登记于 V-022..V-024，两处口径不矛盾。
- **未完成事实保留（原 G-001..G-004 占位重排登记）**：原占位四行**均未产生结论**，其主题按上述三条重排后如实保留如下——原 G-001「INTEG-3 新判据在无并发上限前提下如何被真实观察（H-004）」→ 归入 `## 风险与延期交接` RISK-005（结论强度受限，须作为未验证项披露）；原 G-002「E2E-1 依赖的 6 份 confirmation 原件语义覆盖度（OPEN-003）」→ 保留于 `## 未决项` OPEN-003（另见 F-013）；原 G-003「关键失败路径①真实测试失败注入点选择（ADR-004）」→ 口径见 ADR-004 与 `## 验收面` 用例 3；原 G-004「存在性核对与『逐条复核』的边界操作化（OPEN-004）」→ 保留于 `## 未决项` OPEN-004。原占位行预期证据落点 `<taskPath>/quality/reviews/` 的口径不变。
- **本批三条问题已取得真实答复**（选项选择，经提问工具 `ask_user_question`）：答案已落 U-015..U-017／V-022..V-024／ADR-013..ADR-015；本文件不再保留「已提出、待真实答复」口径。
- **Grill 完整结论已产生**：覆盖矩阵五类原始消息全覆盖、四项客观退出检查全 pass、第 1 批三条问题已答复，故本节状态为 `completed`；答复前的选项列表与事实依据均原样保留，仅状态与结论更新，不删既有内容。

### 确认门

`## 最终确认` 仍为 `pending`（**历史表述，已完成**：该状态已于 2026-10-05 由用户真实确认后置 `accepted`，见 `## 最终确认` 确认原件）；**ADR-015 的前置已满足——detail track 已于 2026-10-05T11:46:58.038Z–11:55:40.317Z 真实执行（原件 `quality/reviews/2026-10-05-021-make-decision-detail.json`），21 条 findings 已逐条处置（20 fixed / 1 accepted_risk，见 `#### 细节审查（detail track，DIR-D1）处置`）；下一步＝进入 `## 最终确认`（**该下一步已完成（2026-10-05），见 `## 最终确认` 确认原件**）。**（历史表述，已过期：原写「下一步＝补跑一次 detail track 独立审查（ADR-015）并逐条处置 findings…之后才可进入确认」。）

## 审查处置

本 decision-log 的独立审查分两条 track，状态不同（审查入口与产物落点见 F-006；仓库内不复制原始件，ADR-005）：

- **direction track（方向审查）**：**已执行两轮**（第一轮 2026-10-05、第二轮重跑轮 2026-10-05）。原件＝`<task-dir>/quality/reviews/2026-10-05-007-make-decision-direction.json`（`version=wh-review-result.v1`、`status=available`、`outcome=completed`、`pair_status=complete`、`review_track=direction`、`subject_kind=document`、`started_at=2026-10-05T10:12:00.114Z`、`completed_at=2026-10-05T10:16:28.651Z`）＋同目录 6 份 provider `.output`（`2026-10-05-001..006-make-decision-document-provider-*.output`；6 个调用＝3 provider × red/blue，全部 `completed`）。共 **20 条 findings**，其中 **1 条 blocking（F-6）**。该轮消费的 `current_selection` 只装了 Talk 第 1 轮的 5 条执行口径、**未装已收敛的 ADR 结论**，故约 15 条 findings 属材料滞后的「打空」；处置口径见 U-008（把 ADR 结论写进 `current_selection` 后**重跑一轮**）。下表把 20 条 findings **按主题归并**登记：`finding_id` 用 `DIR-R1-T1`..`DIR-R1-T6`（**主题归并标识**，不是原件字段——原记录 findings 无 id 字段，本表 `F-1`..`F-20` 按记录内数组顺序编号）。**第二轮（重跑轮，2026-10-05）**：原件＝`<task-dir>/quality/reviews/2026-10-05-014-make-decision-direction.json`（`version=wh-review-result.v1`、`status=available`、`outcome=completed`、`pair_status=complete`、`review_track=direction`、`subject_kind=document`、`started_at=2026-10-05T10:26:54.035Z`、`completed_at=2026-10-05T10:35:05.342Z`）＋同目录 6 份 provider `.output`（`2026-10-05-008..013-make-decision-document-provider-1..6.output`）。共 **12 条 findings**，其中 **1 条 blocking**（findings 元素**无 id 字段**）。处置见下表 `DIR-R2-T1`..`T7`（**主题归并标识**，不是原件字段）。**两轮原件均保留不删除**。
- **detail track（细节审查）**：**已执行一轮**（DIR-D1，2026-10-05）。原件＝`quality/reviews/2026-10-05-021-make-decision-detail.json`（`review_track=detail`、`status=available`、`outcome=completed`、`pair_status=complete`、6 provider 全 `completed`、`discarded_facts=[]`）＋同目录 6 份 provider `.output`；共 **21 条 findings（blocking 1 / major 16 / minor 4）**，provider 分布 kimi×6、antigravity×6、codex×9。处置见下 `#### 细节审查（detail track，DIR-D1）处置`。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| DIR-R1-T1 | `current_selection` 遗漏 INTEG-3 改判结论（收敛大纲问题①-A）：F-8/F-13/F-16 major、F-5 minor | 总体验收套件第三部分（跨卡集成场景）执行口径在待审方向中缺失，违反 FR-47/AC-47 三部分齐备；改判后的 INTEG-3 判据未映射证据来源 | fixed | 证据＝U-008 重跑材料已补（ADR-001 的结论与依据链写进 `current_selection`，含 INTEG-3 证据来源口径）；重跑轮复核 | CARD-10 owner / 用户 / retain（第一轮原件保留） |
| DIR-R1-T2 | 复跑 oracle 被读成「冒充 RED→GREEN」：F-2/F-7/F-10/F-12/F-17 major | 若不写明界限，复跑当前为绿的 oracle 会被读成有效 RED，滑向脚本自证（AC-48 `prd.md:536`）或直接跳过 G-2 豁免（SD-06 `prd.md:51`） | fixed | 证据＝ADR-003 修订四要素（写明「本卡无行为变更，故无新 RED→GREEN」＋补一条可失败检查＋复跑仓库现成 oracle＋引用 CARD-09 归档原件，并写明「独立复跑既有 oracle」界限）；重跑材料已含 | CARD-10 owner / 用户 / retain |
| DIR-R1-T3 | 只覆盖 SD-05 三条关键失败路径中的一条，含唯一 blocking：F-6 **blocking**、F-3/F-11/F-14 major、F-4 minor | 缺另两条路径核对记录即触发 `prd.md:605`「缺任一路径核对记录整体不得声明完成」；失败注入的位置与清理机制亦未定义 | fixed | 证据＝ADR-004（路径①：注入一次真实测试失败→修复→复验）＋ADR-008（路径②：先检索已有真实原件、本轮真出现才记录、不人为制造）＋路径③取法（`## 验收面` 用例 7，落 `quality/evidence/` 并与历史失败事实对照） | CARD-10 owner / 用户 / retain |
| DIR-R1-T4 | 集成审查被当成不阻断的披露项：F-1/F-9/F-19 major | 未执行旧「全 phase 集成审查」仍可能被视为验收完成，把「披露」当放行 | fixed | 证据＝ADR-002 修订（第③点记 `未验证（unverified）`）＋U-009/V-016 用户显式确认按现行三道审查点验收；`## 退役登记（retirement）` 同步 | CARD-10 owner / 用户 / retain |
| DIR-R1-T5 | 其余用例与 oracle 覆盖范围无口径：F-15 minor、F-20 major | E2E-1 与其余跨卡集成场景的证据策略未定；未证明所跑 oracle 会从同一真实任务入口走完四阶段并产出逐阶段记录 | fixed | 证据＝ADR-009（执行广度只跑三个直接相关 oracle）＋E2E-1 复用归档原件口径（`## 验收面` 用例 0/1）；重跑材料已含 | CARD-10 owner / 用户 / retain |
| DIR-R1-T6 | 注入失败误挂 E2E-3 标签且与「无新实现」冲突：F-18 major | 混淆套件第二部分命名端到端用例与第三部分失败路径核对；与 build-code 无新实现、HEAD 冻结（`be393a6e` 不得提交）冲突 | fixed | 证据＝ADR-003/ADR-004 的口径澄清（注入失败服务 E2E-3「失败不漂白」路径并充当可失败检查；E2E-2 证据是本卡四阶段执行事实，不靠注入） | CARD-10 owner / 用户 / retain |

- **原件保留**：第一轮方向审查记录（`2026-10-05-007-make-decision-direction.json` 及 6 份 provider `.output`）**保留为原件不删除**；本表只登记处置，不复制原件内容（ADR-005）。

#### 第二轮（重跑轮，DIR-R2）处置

原件＝`quality/reviews/2026-10-05-014-make-decision-direction.json`（**12 条 findings / 1 条 blocking**）＋ 6 份 provider 原件 `2026-10-05-008..013-make-decision-document-provider-N.output`（**均在外部任务目录下，此处写相对路径**）。12 条 findings 按主题归并为 7 行；`finding_id` 用 `DIR-R2-T1`..`T7`（**主题归并标识**；原件 findings 无 id 字段）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| DIR-R2-T1 | E2E-1 与用例 4/5 被降级为归档复用 + 存在性核对：#2 **blocking**、#1、#7、#10 | 套件第二部分与跨卡用例无真实入口执行记录 → 违反 `prd.md:607` 与 AC-48（`prd.md:536`） | fixed | 证据＝U-012 + ADR-011（逐条真实入口证据映射：命令、exit code、output 位置；E2E-1 用母规划任务真实阶段事实 + 交互记录 + PRD 最终确认原件；INTEG-1/2/3 用现成 oracle 单文件定向执行 + 真实原件对照；跑不了如实标 `unverified`） | CARD-10 owner / 用户 / retain（第二轮原件保留） |
| DIR-R2-T2 | E2E-2 证据主体不可行：#3、#5、#11 | 以本卡自身执行为主证据不可行（本卡无新实现、不拆 Phase，产不出 phase 级代码审查原件） | fixed | 证据＝U-011 + ADR-010（CARD-09 归档四阶段为主证据 + 本卡执行为补充；本卡无 phase 级代码审查原件属事实而非缺失） | CARD-10 owner / 用户 / retain |
| DIR-R2-T3 | E2E-2 集成审查退役越权：#4、#12 | CARD-10 单方面把 PRD 必留审查点判为已退役，属越权改写 PRD 判据（`prd.md:603` 只授权 INTEG-3 改判据） | fixed（由用户授权收场） | 证据＝U-010 + ADR-002 第二次修订（**用户以母任务 owner 身份正式授权**按现行三审查点验收；授权范围仅限 E2E-2 审查节奏项）；**这不是 CARD-10 自行放行** | CARD-10 owner / 用户 / retain |
| DIR-R2-T4 | 证据来源绝对路径被脱敏为 `<host-path-redacted>`：#6 | 审查材料中的绝对路径被替换为占位符，证据无法回读定位 | fixed | 证据＝后续审查材料一律改用**任务目录相对路径**书写；结构性成因＝`runtime/review/provider-material-projection.mjs:7`（`HOST_PATH_PLACEHOLDER = "<host-path-redacted>"`）与 `:15`（`LOCAL_HOST_PATH` 正则）；**（本轮已把 decision-log 本体的宿主绝对路径全部改为占位/相对路径，使审查材料投影不再脱敏；见 `## 文档结果`）** | CARD-10 owner / 用户 / retain |
| DIR-R2-T5 | 缺用户抽验权通路交付物：#8 | `prd.md:557` 的用户抽验权无对应可交付物 | fixed | 证据＝`## 验收面` 新增「用户抽验权通路」交付物（「任一卡任一 AC → 原件定位路径 + 原文」对照表） | CARD-10 owner / 用户 / retain |
| DIR-R2-T6 | 失败注入取得方式未界定：#9（minor） | E2E-3 的失败注入如何取得、如何判「修复后复验」未写清 | fixed | 证据＝ADR-004 + ADR-008 口径澄清（注入须经真实入口让既有 oracle 真产出 `failed`；修复须改变该失败条件并复验） | CARD-10 owner / 用户 / retain |
| DIR-R2-T7 | E2E-2 前置「至少一张实施卡材料在真实入口就绪」未指明：#5（前置条件部分） | E2E-2 的就绪输入未指名，执行时可能自造材料 | fixed | 证据＝U-011（指明 CARD-09 归档材料为就绪输入） | CARD-10 owner / 用户 / retain |

- **原件保留**：第一轮（`2026-10-05-007` + `2026-10-05-001..006`）与第二轮（`2026-10-05-014` + `2026-10-05-008..013`）原件**均保留不删除**；本表只登记处置，不复制原件内容（ADR-005）。
- **无残留 blocking**：本轮主题归并后**无残留 blocking**（T1 的唯一 blocking 已 fixed）。
- **detail track 已执行并完成处置**：21 条 findings 全部有处置（20 fixed / 1 accepted_risk），无 rejected_invalid、无 needs_human、无未处置项。

#### 细节审查（detail track，DIR-D1）处置

原件＝`quality/reviews/2026-10-05-021-make-decision-detail.json`；`review_track=detail`；`status=available`；`outcome=completed`；`pair_status=complete`；6 provider 全 `completed`；`discarded_facts=[]`；findings=21（blocking 1 / major 16 / minor 4）；`started_at=2026-10-05T11:46:58.038Z`；`completed_at=2026-10-05T11:55:40.317Z`。

| 归并标识 | 主题 | 原件 finding 序号（该主题覆盖的） | 严重度 | 处置 | 处置说明与落点 |
| --- | --- | --- | --- | --- | --- |
| DIR-D1-T1 | INTEG-1/2/3 证据列须逐条含「命令 / exit code / output 位置」 | 第 1 条（blocking）、第 4 条、第 11 条、第 13 条、第 15 条 | blocking | fixed | `### ADR-001` 追加「修订注（2026-10-05 细节审查 DIR-D1 后）」并同步 `## 决定` 顶部 ADR↔D 对照表 ADR-001 行；`## 验收面` 用例 4/5/6 证据列逐条补命令形态、exit code 与 output 落点，并在三条用例后加统一「证据形态（ADR-011）」引述；口径基准＝`### ADR-011`；**该统一引述已按 PREP-1 上移至 `## 验收面` 开头，对用例 1..7 全部生效** |
| DIR-D1-T2 | INTEG-3 判据更新的授权依据写错（ADR-002 授权范围只限 E2E-2） | 第 5 条 | major | fixed | `## 验收面` 用例 6 成功条件写死两条授权来源分开：`prd.md:603` 授权 CARD-10 owner 裁定 INTEG-3 判据；U-010/V-017／ADR-002 第二次修订只覆盖 E2E-2；母 PRD `:600` 的「全 phase 结束集成审查」按退役登记已退役、不机械补回 |
| DIR-D1-T3 | 「交回母任务层面」旧措辞未全量同步 ADR-014 | 第 6 条、第 12 条、第 14 条、第 16 条、第 19 条 | major | fixed | 用例 4 缺口去向、`## 成功/失败边界` ⑥、`### ADR-001`（decision 与 consequence）、`### ADR-012`、`## 未决项` OPEN-001（状态仍 closed）、`## Supersedes（被替代记录）`、`## 动态 Talk 批次` T-004、Exit checks 两处、`### U-013` 追加交叉引用，统一改为「承接方＝无，只在本卡如实记录（U-016／ADR-014）」；`### U-014` 正文保留、末尾追加交叉引用 |
| DIR-D1-T4 | 退役登记新旧对应表第③行放行依据仍写 U-009/V-016 | 第 3 条、第 8 条、第 21 条 | major | fixed | `## 退役登记（retirement）` `### 新旧对应表：审查节奏` 第③行放行依据改为 `U-010/V-017`（Talk 第 4 轮轴六，ADR-002 第二次修订），`U-009/V-016` 标注为前一版历史口径（已被取代，保留不删） |
| DIR-D1-T5 | 用例 1（E2E-1）成功条件不可机械核验 + 锚点错 | 第 2 条、第 17 条 | major | fixed | 用例 1 成功条件改为可机械核验口径（阶段序列＝母 PRD 的 U-008，`prd.md:19`/`:240`；make-decision 为唯一 stage 行；build-prd 为 portable workflow 产出、非第六阶段；不得出现 build-plan/build-code/verify-code）；可观察用例加 F-013② 事实注；证据列补最终 PRD 确认原件 `quality/evidence/portable-workflow-outcomes/build-prd/8da4882e….json`、6 份 confirmation 无一 `subject_ref` 指向 `prd.md` 等如实披露 |
| DIR-D1-T6 | E2E-2 必须有独立的功能验收记录 | 第 9 条 | major | fixed | `## 验收面` 用例 2 成功条件补死：verify-code 功能验收记录必须与终末代码审查分开成件，缺独立记录或以代码审查冒充功能验收即失败 |
| DIR-D1-T7 | E2E-3 修复后的终态定义 | 第 10 条 | major | fixed | `## 验收面` 用例 3 成功条件补死两个事实：保留初始失败事件（不删不改写）；本用例终态＝注入失败被修复后复验通过 |
| DIR-D1-T8 | 用户抽验权通路不得要求前置全量对照表 | 第 7 条 | major | fixed | `### 交付物：用户抽验权通路` 改为「定位指引规则＋检索通路说明」，删除「为 CARD-01..09 每个 AC 前置编制含路径+原文摘录+结论状态的全量对照表」约束，并解除其作为整体不完成失败条件的地位（改按 `prd.md:557`） |
| DIR-D1-T9 | E2E-2 前置输入要绑定身份 | 第 20 条 | minor | fixed | `## 验收面` 用例 2 新增「前置」项：真实入口启动前至少一张实施卡材料已在位并记录身份——本轮取 CARD-09 归档材料 |
| DIR-D1-T10 | 完成宣称口径：「失败判据未触发」不等于「成功条件已满足」 | 第 18 条 | major | accepted_risk | `### ADR-012` 补 accepted_risk 段；`## 成功/失败边界` 增列 ⑧ 与失败模式；`## 风险与延期交接` 新增 RISK-009；`## 最终确认` 列入待展示项。风险＝完成宣称被读作「全部成功条件达成」的误读空间；用户已以选项选择接受（U-014/V-021） |

原件 findings 无 id 字段，本表标识为主题归并标识，不是原件 finding id。

21 条原件 finding 全部有处置：20 条 fixed，1 条 accepted_risk（#18，见 DIR-D1-T10）。无 rejected_invalid、无 needs_human、无未处置项。

按现行合同，findings 处置完成后不为同一 scope 复审，也不为追空 findings 重派未变范围。
#### 一致性准备（spec-analyze，PREP-1）处置

报告原件＝`<task-dir>/quality/evidence/consistency-prep/2026-10-05-card10-make-decision-consistency-prep.md`；只读一致性分析（lens-only）；被分析材料＝`decision-log.md`（1312 行，sha256 `38b67581ff33b12df17f1e7e360434734b94f7bbfef288ef341b2f436910bb43`）；发现 14 条（blocking 0 / major 8 / minor 6）。

| 归并标识 | 主题 | 原件发现编号 | 严重度 | 处置 | 落点行号 |
| --- | --- | --- | --- | --- | --- |
| PREP-1-T1 | 确认门/下一步陈述过期（detail track 已执行） | F-01 | major | fixed——`## 确认门` 与 `### ADR-015` owner/next_action 均改为「ADR-015 前置已满足…下一步＝进入 `## 最终确认`」，原句标「（历史表述，已过期）」 | `## 确认门`:1142；`### ADR-015` owner/next_action:1043 |
| PREP-1-T2 | RISK-004 前提已消失（蓝图原件已定位） | F-02 | major | fixed——RISK-004 标原表述为「已消解，保留为历史」，降级为「消费证据不足」，指向 U-013 与 ADR-001 修订 | 1258 |
| PREP-1-T3 | H-005 状态矛盾（unresolved vs 原件已定位） | F-03 | major | fixed——假设表与 JSON 的 H-005 状态改 `supported`；原 falsifier 标「（已推翻）」并补「H-005 推翻依据」一行 | 504、H-005 推翻依据:506、JSON:539 |
| PREP-1-T4 | 宿主绝对路径必须清零 | F-04 | major | fixed——decision-log 本体 13 行宿主绝对路径（`/Users` 前缀）全部改为 `<card-10-worktree>` / `<target-repo>` / `<task-dir>` / `<wh-config>` / `<ocr-bin>` 占位或相对路径；`grep -n '\/Users\/'` 0 命中；`DIR-R2-T4` 行补本轮说明 | DIR-R2-T4:1171（原 13 行宿主绝对路径分布 :12/:15/:184/:269/:271/:563/:572/:581/:801/:876/:991/:1075/:1144 已全部替换为占位/相对路径） |
| PREP-1-T5 | 用例 1 证据列缺真实入口证据映射 | F-05 | major | fixed——用例 1 证据列四条逐条补命令形态、exit code 与 output 落点（output 落本卡外置 `quality/tests/`，仓库不复制）；统一「证据形态（ADR-011）」引述上移至 `## 验收面` 开头，对用例 1..7 全部生效 | 576；统一引述上移后:559 |
| PREP-1-T6 | 用例 2 判定对象必须明示 | F-06 | major | fixed——用例 2 成功条件开头加「判定对象＝两个具名真实实例，逐实例核四阶段事实」（主实例＝CARD-09 归档实施旅程；补充实例＝CARD-10 本次实施旅程） | 583 |
| PREP-1-T7 | FR-20 证据路线全文无承接 | F-07 | major | fixed——用例 2 证据列补「测试机器产物路线（`prd.md:575` FR-20）」段；OI-011、OPEN-002、`## 文档结果` 三处 `N/A+reason` 提及加交叉引用指向 `prd.md:575` 与本项 | 585（FR-20 段）；交叉引用:469、1278、1331 |
| PREP-1-T8 | 用例 4 失败条件不得改写母 PRD | F-08 | major | fixed——删除用例 4 失败条件中新增的「或消费证据完全为零」，只留 `prd.md:591` 原文；补「成功条件②未完全满足时记 `unverified`」；ADR-001 与 Exit checks 同步去掉 INTEG-1 新增失败条件的暗示 | 602、604；ADR-001:710 |
| PREP-1-T9 | INTEG-3 解释性读法须进最终确认展示项 | F-09 | minor | fixed——`## 最终确认` 待展示项新增一条（对 `prd.md:603` 的解释性读法须由用户真实答复确认或改判）；用例 6 成功条件加同句交叉引用 | 1231；用例 6:622 |
| PREP-1-T10 | 用例 3 收窄了母 PRD 的真实入口 | F-10 | minor | fixed——用例 3 可观察用例改为与 `prd.md:578` 同宽（注入或选取一次真实失败：真实测试失败 / 审查工具不可用且无独立替代可用），并加用例 7 路径②交叉引用 | 591 |
| PREP-1-T11 | 用例 1/用例 3 缺前置 | F-11 | minor | fixed——用例 1 补前置（`prd.md:563`）；用例 3 补前置（`prd.md:579`） | 572、590 |
| PREP-1-T12 | 资料 vs 推断（attribution 与实际来源不符） | F-12 | minor | fixed——`intake.raw_requirement` 的 attribution 由 `user_verbatim` 改 `gap`（V-001）；`pain_point` 改 `upstream_document`（V-002）；两处各补 `attribution_note` 说明实际来源 | 513、514 |
| PREP-1-T13 | 用例 1 证据列编号断裂+重复 | F-13 | minor | fixed——用例 1 证据列编号重排为连续 ①②③④；「6 份确认无一 `subject_ref` 指向 `prd.md`」只保留一处（②内指向 ③）；F-013 披露块改用「发现 A / 发现 B」 | 576（同 F-05 行：编号连续 ①②③④、去重、F-013 改「发现 A/发现 B」） |
| PREP-1-T14 | 用例 0 成功条件缺可机械核验定义 | F-14 | minor | fixed——用例 0 成功条件新增「结论未被漂白」四项可机械核验定义（`facts.jsonl` 末行 `stage=close`、审查点原件存在、终态字段检索计数、定位通路可打开原文）；OPEN-004 标明「判定定义不后置」 | 564；OPEN-004:1280 |

原件发现以 F-01..F-14 编号（见报告）；本表标识为主题归并标识。14 条全部 fixed，无 accepted_risk / rejected_invalid / needs_human / 未处置。按 `skills/spec-analyze/SKILL.md:25` 只复核受影响范围。

## 最终确认

- 状态：accepted
- 确认原件（2026-10-05，机械事实，逐字登记）：命令 `node tools/cli/stage-runtime.mjs confirm --action=decision --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-10-20260919 --decision=approve-decision --reply-text="A 确认收口（推荐）" --material-ref=specs/workflowhub-thin-core-card-10-20260919/decision-log.md`；返回 `status: "recorded"`、`path: "<task-dir>/quality/evidence/human-confirmations/2026-10-05-001-make-decision-approve-decision.json"`、`stage: "make-decision"`、`decision: "approve-decision"`、`reply: "A 确认收口（推荐）"`、`material_refs: ["specs/workflowhub-thin-core-card-10-20260919/decision-log.md"]`、`head: "be393a6ef10db7df919e01f194b47f8dd856d9b4"`、`created_at: "2026-10-05T12:48:08.272Z"`。**答复形式＝选项选择**（经提问工具 `ask_user_question`，question_id `final-confirmation`），逐字标签 `A 确认收口（推荐）`；**非自由文本口述**——用户在提问前已被告知「可直接打字给一句确认语，那样原文绑定更完整」，用户仍选择选项。
- 用户原文与 host-visible 绑定：**部分缺口**——Talk 第 1 轮无逐字原文留存（V-001、OPEN-005），已知答复语义为「5 项执行口径逐项选定 A（推荐项）」与「认可承接决定 A/B」、任务类型=普通任务（U-001..U-004）；Talk 第 2 轮三条为**选项选择**，选项标签已逐字留存（V-012..V-014、U-005..U-007）；Talk 第 3 轮两条同为**选项选择**（轴四/轴五各选定 A（推荐项）），选项标签已逐字留存（V-015..V-016、U-008..U-009）；Talk 第 4 轮四条同为**选项选择**（轴六选 **B**、轴七/轴八/轴九各选 A（推荐项）），选项标签已逐字留存（V-017..V-020、U-010..U-013）；Talk 第 5 轮一条同为**选项选择**（轴十选 A（推荐项），由第 4 轮轴六/轴九的答案重排后新增），选项标签已逐字留存（V-021、U-014）。Grill 第 1 批三条同为**选项选择**（G-001..G-003 各选 A（推荐项），经提问工具 `ask_user_question` 取得），选项标签已逐字留存（V-022..V-024、U-015..U-017）。**上述各轮选项标签均非自由文本口述**。host-visible 绑定需在正式最终确认时补齐：确认入口 `node tools/cli/stage-runtime.mjs confirm --action=decision --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-10-20260919 --input=<abs json>`，落 `quality/evidence/human-confirmations/`（F-006）。CARD-10 make-decision 收口前（2026-10-05）另有一条**选项选择**（轴：INTEG-3 中「审查节奏点＝现行三审查点」这一表述是否为对 `prd.md:603` 的解释性读法；经提问工具 `ask_user_question` 取得，question_id `inte3-reading`），选项标签逐字留存（**选项选择**逐字 `A 认可这个读法（推荐）`，落 U-018／V-025）——该条同样**非自由文本口述**。**最终确认（2026-10-05）的答复形式同为选项选择**（经提问工具 `ask_user_question`，question_id `final-confirmation`），逐字标签 `A 确认收口（推荐）`，**非自由文本口述**；host-visible 绑定＝确认原件 `<task-dir>/quality/evidence/human-confirmations/2026-10-05-001-make-decision-approve-decision.json` ＋ 该原件绑定的 `head: be393a6ef10db7df919e01f194b47f8dd856d9b4`。**既有「部分缺口」表述继续有效、不被本句抹掉**——Talk 第 1 轮无逐字原文留存（V-001、OPEN-005）等缺口仍然存在；`## 未决项` OPEN-002..OPEN-006 未关闭。
- 未确认内容：本文件的全部 ADR（ADR-001..ADR-015；其中 ADR-001 经 Talk 第 4 轮轴九 U-013/V-020 修订、另经 CARD-10 make-decision 收口前 U-018/V-025 追加「授权边界注」（见 `### ADR-001`），ADR-002 经 Talk 第 3 轮轴五 U-009/V-016 与 Talk 第 4 轮轴六 U-010/V-017 两次修订；ADR-013..ADR-015 为 Grill 第 1 批新增，依据 U-015..U-017／V-022..V-024）**尚未经过正式最终确认**（历史表述，已完成：该句写于 2026-10-05 真实最终确认前；该确认已于 2026-10-05 完成，见上条确认原件）；`## grill（质询）` **已完成**（三条 frontier 问题已由用户以**选项选择**答复，经提问工具 `ask_user_question`，非自由文本口述；结论落 U-015..U-017／V-022..V-024／ADR-013..ADR-015）；INTEG-3 审查节奏项读法的待裁状态**已消解**（U-018／V-025，见 `### ADR-001` 授权边界注；对应 `## 动态 Talk 批次` T-006）；**原待办（已完成）**：用户的真实最终确认——已于 2026-10-05 完成，见上条确认原件（spec-analyze 一致性准备已于 2026-10-05 完成，报告原件＝`<task-dir>/quality/evidence/consistency-prep/2026-10-05-card10-make-decision-consistency-prep.md`，14 条发现已逐条处置为 `fixed`，见 `#### 一致性准备（spec-analyze，PREP-1）处置`）；`## 审查处置` 的 direction track **两轮均已执行并按主题归并登记**（第一轮 `DIR-R1-T1`..`T6`、第二轮 `DIR-R2-T1`..`T7`，第二轮无残留 blocking）；**detail track 已跑并完成 21 条 findings 处置（20 fixed / 1 accepted_risk）**；`## 未决项` OPEN-002..OPEN-006 未关闭（OPEN-001 已由 Talk 第 4 轮轴九 U-013 真实回答，见该节）。按 E2E-1 同源失败判据（`prd.md:566`「未经真实确认即标 final」），本文件**在真实确认前不得**被读作 final；该确认已于 2026-10-05 完成（见上条确认原件），故**状态由 `pending` 改为 `accepted`**。（历史表述，已完成：原写「本文件当前**不得**被读作 final。**状态仍为 `pending`**，不得改 accepted。」）
- **最终确认展示须包含**：INTEG-1 判 `unverified` 与其缺口去向、accepted_risk（DIR-D1-T10）、未验证项与风险清单。
- **最终确认展示须包含（新增一条）**：INTEG-3 中「审查节奏点＝现行三审查点」这一表述的依据是对 `prd.md:603` 的**解释性读法**（`prd.md:603` 字面只授权「本条是否改为『CARD-05 审查链与 CARD-09 资源/效率改动共存』」）——须由用户真实答复确认该读法，或改判。**（历史表述：该待裁状态已消解）** **已由用户真实裁定**：U-018／V-025，选项选择逐字 `A 认可这个读法（推荐）`；授权边界＝`prd.md:603` 字面只授权 CARD-10 owner 裁定『是否改为共存判据』，审查节奏项读法由用户以母任务 owner 身份显式裁定补足。（本条已由「待裁展示项」转为「已裁定事实」，不再需要用户另行答复。）

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| N-002 自建端到端场景/脚本作为本卡新产生的 RED→GREEN | 违反 AC-48「无脚本自证冒充」（`prd.md:536`）与 `prd.md:530`「执行该套件而非临时发明」；本卡无新实现（`prd.md:549` 第③条） | ADR-003、ADR-006 |
| N-003 重跑各卡内部测试、逐条复核各卡 AC | 违反 `prd.md:557`；把存在性核对变成门禁机（AC-47 失败场景） | ADR-005 |
| N-004 按 SD-07 旧四段（含全 phase 结束集成审查）判 E2E-2 | 与四个现行 workflow skill 冲突；把历史表述当验收门；机械补回等于恢复退役门禁（违反 SD-17/OI-012） | ADR-002 |
| N-005 INTEG-3 记 N/A 或删除该用例 | 违反 AC-47「无临时增删用例」；`prd.md:603` 明确要求 owner 裁定而非删除 | ADR-001 |
| N-006 恢复「限制单次审查并发 provider 数」并改名保留 | 违反 CARD-09 D-001/D-022（`decision-log.md:498`/`:519`）与 `prd.md:697` A 条 | ADR-001 |
| 把原始件复制进仓库 / 目录快照 / 整树 tar / `git archive` | 违反证据硬规则（每类事实只留一份原始件）与 `prd.md:544` 无共享写面 | ADR-005 |
| 驱动脚本进主仓 `tests/` 或让驱动自证结果 | 混淆驱动与 oracle 面，使「真实入口」与「脚本产物」不可分辨 | ADR-006 |
| 改动母 PRD 以消除旧表述冲突（同步/加注/删除旧表述） | 越界改母材料（`prd.md:549`、`prd.md:603`「只注不改」） | ADR-007 |
| 本卡做产品功能实现 | 违反 `prd.md:549` 第③条（build-code 无新实现，缺口修复交回原责任卡） | ADR-007 |
| 无范围全量回归（`vitest`/`npm test`/`test:safe`） | 违反测试硬规则（只跑受影响针对性测试） | ADR-005、ADR-006 |
| 用环境故障/配置缺失/无意义断言伪造 E2E-3 的「真实失败」 | SD-06（`prd.md:51`）明确不算有效 RED | ADR-004 |
| 人为制造 provider 不可用（如把 provider 指向不存在目标）冒充关键失败路径②核对 | SD-05（`prd.md:47`）要求核对真实发生的事实；伪造 provider 失败违反 SD-06（`prd.md:51`）与 AC-49（`prd.md:537`）不漂白/不伪造语义 | ADR-008 |
| 全量跑 `tests/acceptance` 下所有 oracle 作为「更彻底」的验收 | 越界（把存在性核对扩张为逐条复核各卡 AC，AC-47 `prd.md:535` 失败场景）且接近无范围全量回归（违反测试硬规则） | ADR-009 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 总体验收被提前宣称（与子任务状态相加混淆；母 PRD 局部风险①，`prd.md:546`） | 把「各卡已 close」当整体完成 → AC-50 失败 | verify-code + 完成宣称判定 / CARD-10 owner |
| RISK-002 | 「关键失败路径」范围不清导致核对流于形式（母 PRD 局部风险②，`prd.md:546`） | 三条路径只留空壳记录 → `prd.md:605` 缺记录即阻断 | verify-code / CARD-10 owner（ADR-004 把路径①与 E2E-3 合并到一次真实注入） |
| RISK-003 | E2E-1 依赖的 6 份 confirmation 原件语义覆盖度未逐份核对（F-004、OPEN-003） | 原件语义不足 → 按 `prd.md:557` 视为输入不合格并如实披露，不得改写结论 | build-plan/verify-code / CARD-10 owner |
| RISK-004 | **原表述（已消解，保留为历史）**：INTEG-1 的 Group 0 冻结接口蓝图原件未定位（F-002、OPEN-001、H-005）。**该前提已消失**——蓝图原件已定位（历史 46 行版本，`git show d1097711:docs/contracts/card-01-stage-material-interface.md`，sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`，见 U-013）。**RISK-004 降级为「消费证据不足」**：当前仅 1/4 张 Group 1 卡有行为级消费证据，故 INTEG-1 判 `unverified`（ADR-001 修订），须作为未验证项披露。 | 原「无法对照 → 按 `prd.md:591` 失败判据处理」已不适用；现风险＝消费证据不足致 INTEG-1 只能判 `unverified`，须在完成宣称中披露（AC-50） | build-plan 前 / CARD-10 owner（ADR-001 修订、ADR-012） |
| RISK-005 | CARD-09 资源/效率改动对审查基建的影响只能事后观察，不能证明「设计上不可能破坏」（H-004） | 结论强度受限 → 必须在完成宣称中作为未验证项披露（AC-50） | verify-code / CARD-10 owner（ADR-001） |
| RISK-006 | make-decision 审查成本与时长：每轮 6 次调用（3 provider × 2 role），CARD-09 实测单轮约 1752.5 s（F-006） | 单轮耗时约 29 分钟，超时/取消会留下 unavailable 事实，不得冒充已审 | make-decision 审查 / CARD-10 owner |
| RISK-007 | oracle 覆盖不齐：`tests/acceptance/` 无 card-04/05/06/08 oracle（F-005） | 对应核对项只能引用归档原件或记 N/A+reason；缺 oracle 不构成豁免 | build-plan/verify-code / CARD-10 owner（ADR-003、OPEN-002） |
| RISK-008 | 母 PRD 旧表述（`prd.md:56`/`:572`/`:600`）与现行合同并存，后续读者只看 PRD 会得到错误读法 | 重复发明全 phase 集成审查或误判 E2E-2 → 需经本文件退役表与 Supersedes 才能得到正确读法 | 全程 / CARD-10 owner（ADR-002、ADR-007） |
| RISK-009 | 完成宣称被读作「全部成功条件达成」的误读空间（细节审查 DIR-D1-T10 / finding #18，**accepted_risk**） | INTEG-1 的可观察成功条件未完全满足、记 `unverified`，而「失败判据未触发」不等于「成功条件已满足」，读者可能误读为通过；处置＝完成宣称必须逐字写明「INTEG-1 的可观察结果未完全满足、记 unverified」与缺口去向，并列入最终确认展示项（用户已以选项选择接受该风险，U-014/V-021、ADR-012） | verify-code + 完成宣称判定 / CARD-10 owner |
| 延期交接 | 无跨卡延期项。核对暴露的缺口按 `prd.md:549` 第③条交回原责任卡，不在本卡实现 | — | CARD-10 owner / 原责任卡 |

### 质量边界

- **质量事实**：本卡质量事实=真实入口执行记录（命令、exit、output 位置）+ 三审查点原件 + 存在性核对记录 + 关键失败路径核对记录（`prd.md:607`）；三审查点按现行合同（V-006..V-010），无额外全 Phase 集成审查（ADR-002）。审查入口与产物落点见 F-006。
- **推进资格**：本卡推进不依赖任何机器校验——revision 绑定、快照树认证、材料身份/哈希校验、回执校验均非前置；仅两道人为门（推进中的人为确认对话、不可逆 Git 授权，SD-17 `prd.md:96`）。
- **完成判据**：真实入口联通实跑 + 套件内用例逐条有真实执行记录且无失败 + 存在性核对合格 + 关键失败路径三条核对记录齐备 + 展示含未验证项与风险（`prd.md:533`、`:538`、`:605`、`:607`）；子任务状态相加、代码审查通过、脚本自证均不构成完成（`prd.md:526`、`:574`、`:536`）。
- **不可逆授权边界**：本阶段（make-decision）**无不可逆 Git 动作、不需要 authorize**（F-003）；`facts.jsonl` 在本阶段不由本卡写入（唯一 writer=`runtime/task/task-store.mjs:84`，唯一调用点=`tools/cli/stage-runtime.mjs:803`，只写 build-code `phase_progress` 游标）；任何 commit/push 属不可逆 Git 授权门，须用户显式授权。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | Group 0 冻结的阶段/材料接口蓝图原件定位（INTEG-1 证据侧） | **已由 Talk 第 4 轮轴九（U-013/V-020）真实回答**：原件＝`docs/contracts/card-01-stage-material-interface.md`（历史 46 行、sha256 `7aa596fb…`；HEAD 已被重写为 761 字节 / 5 行、sha256 `1ab0afe4…`），`runtime/task/task-topology.mjs` 在 HEAD ABSENT | **status=closed（依据 U-013）**；缺口去向＝PRD 用词与制品现实不匹配，**承接方＝无，只在本卡如实记录**（U-016／ADR-014；RISK-004） |
| OPEN-002 | 套件用例参数细节：具体 fixture、采样命令、环境假设、N/A+reason 口径 | `prd.md:547` 明确留本卡 build-plan 细化；套件主体不得增删用例或改写失败判据；**`N/A+reason` 须与 `prd.md:575`（FR-20 测试机器产物路线）建立显式锚点，见 `## 验收面` 用例 2 证据列的 FR-20 段** | CARD-10 owner，build-plan（ADR-003、ADR-005） |
| OPEN-003 | E2E-1 的 6 份 confirmation 原件语义覆盖度未逐份读取核对 | 已确认存在与数量，未核对语义 | CARD-10 owner，verify-code（RISK-003） |
| OPEN-004 | 各卡验收结论「未漂白」判定的**参数细化**（fixture / 采样命令 / 环境假设） | 需在 build-plan 写明可执行参数，避免核对形式化；**「结论未被漂白」的判定定义不后置**，按 `## 验收面` 用例 0 成功条件的可机械核验定义执行 | CARD-10 owner，build-plan（RISK-002） |
| OPEN-005 | Talk 第 1 轮无逐字原文留存（第 2 轮三条**选项选择**的选项标签已逐字留存于 V-012..V-014，但仍非自由文本口述），approval_binding 的 host-visible 绑定缺失 | 第 1 轮未留存用户逐字文本；模板禁止用改写摘要冒充引文 | CARD-10 owner，正式最终确认时补齐（`## 最终确认`） |
| OPEN-006 | 母 PRD `:589-592`（INTEG-1）要求 Group 1 各卡**实际消费** Group 0 冻结的阶段/材料接口蓝图，而蓝图 `docs/contracts/card-01-stage-material-interface.md`（原始 46 行、sha256 `7aa596fb…`）**本身从未要求后续卡显式引用或留对照记录**（其 L3 只说「本蓝图供 CARD-02 到 CARD-10 读取」）——**要求与实际不匹配** | 根因在母 PRD 与蓝图一侧；本卡受「母材料只读」（ADR-007）与 U-016 约束，不出具母 PRD 用词修正建议；Group 1 四卡消费证据几乎全为零，仅 CARD-07 有行为级消费证据 | **承接方＝无**（按 U-016／ADR-014 只在本卡如实记录，不动母任务）；**本卡不承接，仅记录** |

- **Talk 第 2 轮三条（U-005..U-007）、Talk 第 3 轮两条（U-008..U-009）、Talk 第 4 轮四条（U-010..U-013）与 Talk 第 5 轮一条（U-014）选项选择答复**：其中 **U-013 关闭了 OPEN-001**（蓝图原件已定位，见上表）；OPEN-002 的「采样命令集合」部分由 ADR-009 定（只跑三个直接相关 oracle），但 fixture、环境假设与 N/A+reason 口径仍留 build-plan；OPEN-005 的第 2/3/4/5 轮逐字选项标签缺口已由 V-012..V-021 补上，但第 1 轮 5 项与 host-visible 绑定仍缺。OPEN-003、OPEN-004 不受这些答复影响，保持原样。Talk 第 3 轮 U-008 的重跑结论**已产生**（第二轮方向审查 `2026-10-05-014`，12 条 findings / 1 条 blocking，处置见 `## 审查处置` `DIR-R2-T1`..`T7`，无残留 blocking）；U-009/U-010 改 ADR-002 的放行口径、U-011/U-012 改证据主体与取证形态、U-014 定完成宣称口径，均不新增或关闭其余未决项。**新增缺口去向**：INTEG-1 的「PRD 用词与制品现实不匹配」＝**承接方＝无，只在本卡如实记录**（U-013、ADR-001 修订、ADR-012；去向口径按 U-016／ADR-014），不在本卡实现、不改 PRD。**Grill 第 1 批三条（U-015..U-017，选项选择）**：G-001 定 `## 验收面` 用例 7 路径②的取证形态（ADR-013，不新增或关闭未决项）；G-002 定 INTEG-1 缺口的去向形态＝**承接方＝无、只在本卡如实记录**（ADR-014），据此**新增 OPEN-006**，并把上文「交回母任务层面」的口径按 U-016 的「口径细化」细化为「承接方＝无」（相关表述以 U-016 为准）；G-003 定本阶段独立审查补跑一次 detail track（ADR-015），不新增未决项。

## 退役登记（retirement）

退役是一次**决定**，不是进度。本卡涉及的退役对象：

| 日期 | 哪张（R/FR/AC/Phase/Task/材料 编号或 ID） | 为什么退役 | 谁决定 | 原来的需求编号 |
| --- | --- | --- | --- | --- |
| 2026-10-05 | 「全 phase 结束集成审查」（SD-07 序列第③点，`prd.md:56`/`:572`/`:600`） | 四个现行 workflow skill 一致取消该审查点，只保留三审查点；机械补回等于恢复退役门禁（SD-17/OI-012）。**本卡处置＝记 `未验证（unverified）`**（不当作「已披露即可放行」），放行依据＝**用户以母任务 owner 身份正式授权按现行三审查点验收**（Talk 第 4 轮轴六选项选择 **B**，U-010/V-017；此前 Talk 第 3 轮轴五 U-009/V-016 记为「未验证 + 用户显式确认」，本条**升级**为该正式授权，U-009 保留不删），不得仅凭披露放行（ADR-002 第二次修订） | CARD-10 owner（Talk 第 1 轮 U-003 认可；Talk 第 3 轮 U-009 定放行口径；**Talk 第 4 轮 U-010 以母任务 owner 身份正式授权**） | FR-23（`prd.md:363`）、OI-005、OI-014 之外的第③点；原承接口径见 `prd.md:56` ③ |
| 2026-10-05 | 「限制单次审查并发 provider 数」及 FR-44/AC-44 | 上游 CARD-09 D-001 撤销（`decision-log.md:498`）、D-022 拒绝限并发本身（`:519`）；母 PRD `prd.md:697` A 条以「已撤销」一行替代原文、编号保留不复用 | CARD-09（上游）；CARD-10 只承接不恢复 | FR-44 / AC-44（`prd.md:697`） |
| 2026-10-05 | 固定 600000 ms 审查墙钟截止 | 上游 CARD-09 D-044：不得设固定墙钟截止，靠 ownerloss guardian 与显式取消收场 | CARD-09（上游）；CARD-10 只承接不恢复 | FR-46 / AC-46 相关（`prd.md:697` B 条） |
| 2026-10-05 | 审查请求文件内嵌整份材料（「真冗余」） | 上游 CARD-09 D-046：改为按仓库内路径引用材料，保留 provider 只读隔离副本 | CARD-09（上游）；CARD-10 只承接不恢复 | FR-45 / AC-45 相关（`prd.md:697` D 条） |

### 新旧对应表：审查节奏（ADR-002 的显式登记）

| 审查点 | 母 PRD 旧表述 | 现行工作流合同 | 本卡处置 |
| --- | --- | --- | --- |
| ① build-plan 合并审查（覆盖 spec+phase 文件） | SD-07 ①（`prd.md:56`）、E2E-2（`prd.md:572`）、FR-23/FR-56（`prd.md:363`/`:369`）、OI-014（`prd.md:182`） | `workflows/build-plan/SKILL.md:36`、`workflows/make-decision/SKILL.md:38`、`workflows/build-code/SKILL.md:40`、`workflows/verify-code/SKILL.md:34` | **保留**；作为三审查点之一核对 |
| ② build-code 每 phase 代码审查（OCR） | SD-07 ②（`prd.md:56`）、E2E-2（`prd.md:572`）、FR-23（`prd.md:363`） | 同上四处 + `workflows/build-code/SKILL.md:22` | **保留**；回退口径按 `workflows/build-code/SKILL.md:28-30` |
| ③ 全 phase 结束集成审查 | SD-07 ③（`prd.md:56`）、E2E-2（`prd.md:572`）、INTEG-3（`prd.md:600`）、CARD-05 结果/流程（`prd.md:358`/`:360`） | 四个 skill 一致写明**没有**该审查点（`workflows/build-code/SKILL.md:22`「没有额外全 Phase 集成审查点」、`workflows/make-decision/SKILL.md:38`「不另建全 Phase 集成审查」、`workflows/verify-code/SKILL.md:34`「不恢复全 Phase 集成审查」） | **已退役 + `未验证（unverified）`**；只登记对应关系，不补回、不据此判失败；本项记未验证，**放行依据＝U-010/V-017（Talk 第 4 轮轴六：用户以母任务 owner 身份正式授权按现行三审查点验收，ADR-002 第二次修订）**；`U-009/V-016`＝**前一版历史口径（已被 U-010/V-017 取代，保留不删）**；**不得仅凭披露放行** |
| ④ verify-code 终末代码审查 | SD-07 ④（`prd.md:56`）、E2E-2（`prd.md:572`） | 四处现行合同（`workflows/verify-code/SKILL.md:34` 等） | **保留**；独立事实，不与功能验收共用一条记录 |

- **读法声明**：E2E-2 的「审查节奏」度量（`prd.md:572`）按**现行三审查点**核对；SD-07 完整序列（含③）作为**历史表述保留、不作为验收门**（`prd.md:57` 的 Supersession 说明已标注 D-001 L577 为旧表述 superseded；`prd.md:692` 亦载「SD-07 历史表述不变」）。
- **未验证与放行口径（ADR-002 第二次修订，Talk 第 4 轮轴六 U-010/V-017；前一版口径见 Talk 第 3 轮轴五 U-009/V-016，保留不删）**：第③点在本卡记 `未验证（unverified）`，E2E-2 按现行三道审查点（①②④）验收；**放行依据＝用户以母任务 owner 身份正式授权按现行三审查点验收**（选项标签逐字见 V-017），**不得仅凭「已披露差异」放行**；**授权范围仅限 E2E-2 的审查节奏项**，不得由 CARD-10 自行改写 PRD 判据（`prd.md:603` 的上游变化注只授权 INTEG-3 改判据）。残余风险：母 PRD 原文仍保留该旧表述，只看 PRD 的读者可能误读（RISK-008）。
- **PRD 本体不改**（ADR-007）；本表仅为本卡验收读法的显式登记。

## Supersedes（被替代记录）

- **ADR-001 替代 INTEG-3 的可观察结果与失败判据**（母 PRD `prd.md:600-602`），保留用例编号 INTEG-3 与「跨卡共存」目的。被替代文本逐字保留于 `## 逐字声明层（verbatim）` V-003，可回读；母 PRD 本体不改（ADR-007）。
- **ADR-002 声明 SD-07 序列第③点「全 phase 结束集成审查」在本卡验收读法下已退役**（母 PRD `prd.md:56` ③、E2E-2 `prd.md:572`、INTEG-3 `prd.md:600`），保留第①②④点。母 PRD 本体不改；本条为 CARD-10 侧显式读法登记，并在 `## 退役登记（retirement）` 留下新旧对应表。
- **ADR-001 的 INTEG-1 部分不替代 PRD 文本**：INTEG-1 判 `unverified`（Talk 第 4 轮轴九 U-013/V-020）是对裁决的如实标注，**不是**对 `prd.md:589-592` 的替代——`prd.md:590`/`:591` 原文继续有效（判据未触发、可观察结果未完全满足）。缺口去向（PRD 用词与制品现实不匹配）＝**承接方＝无，只在本卡如实记录**（U-016／ADR-014）。
- 本卡不改写母 PRD、CARD-09 归档 decision-log 或任何 workflow skill 本体；上列替代只在本 decision-log 生效。

## Append-only 更正（只追加）

（暂无。本节只追加更正记录，不重写已确认 ADR；每条更正须引用被替代 ADR、原因和新的 ADR。）

## 文档结果

- **CONTEXT.md**：no-change，原因：本卡是验收承接卡，不改变产品定位、术语或跨任务约定（`prd.md:527` 范围明确不含各卡自身验收）；无文件引用。
- **ADR**：created，原因和文件引用：本 decision-log 的 ADR-001..ADR-015（INTEG-3 判据更新、审查节奏退役读法、RED→GREEN 证据取法含 G-2 豁免披露、失败注入、证据落点、母材料只读、执行载体、关键失败路径证据取法、验收执行广度、E2E-2 证据主体、逐条真实入口证据映射、完成宣称披露口径、关键失败路径②取证形态、INTEG-1 缺口去向、独立审查收口）；文件引用=`specs/workflowhub-thin-core-card-10-20260919/decision-log.md`。未另建 ADR 文件。其中 **ADR-001 经 Talk 第 4 轮轴九（U-013/V-020）修订**——新增 INTEG-1 判据终态 `unverified`；**ADR-002 经 Talk 第 3 轮轴五（U-009/V-016）与 Talk 第 4 轮轴六（U-010/V-017）两次修订**——旧「全 phase 结束集成审查」记 `未验证（unverified）`，放行依据升级为**用户以母任务 owner 身份正式授权**按现行三审查点验收，不得仅凭披露放行；Talk 第 4/5 轮**新增 ADR-010、ADR-011、ADR-012**；Grill 第 1 批（2026-10-05）**新增 ADR-013、ADR-014、ADR-015**（关键失败路径②取证形态＝历史真实原件 + 本轮受控演练两层；INTEG-1 缺口去向＝只在本卡如实记录、承接方＝无；make-decision 细节审查补跑一次并处置完再进确认），依据 U-015..U-017／V-022..V-024；范围扩为 **ADR-001..ADR-015**。细节审查 DIR-D1 后新增 **ADR-001 修订注**（证据形态以 ADR-011 为准）与 **ADR-012 accepted_risk 段**（finding #18）。
- **ADR 判据**（hard to reverse / surprising without context / genuine trade-off）：
  - ADR-001 满足全部三条——它改变了母 PRD 定死的 INTEG-3 判据（难以逆转）、不知 `prd.md:603` 会以为并发限制仍在（无上下文会意外）、在「记 N/A/删用例/换判据对象」间是真实取舍。
  - ADR-002 满足全部三条——按现行合同而非 PRD 字面验收（难以逆转）、不知四个 skill 已取消第③点会误判 E2E-2（无上下文会意外）、在「补回/判失败/登记退役」间是真实取舍；Talk 第 3 轮修订（记 `未验证（unverified）` + 放行依据=用户显式确认）后仍满足 surprising + trade-off——不知 PRD 原文旧表述仍在会以为「披露即可放行」，在「记未验证并要求用户显式确认」与「披露后照常推进」间是真实取舍。
  - ADR-003/ADR-004/ADR-005/ADR-006 满足 surprising + trade-off 两条（证据取法与落点若不写会滑向脚本自证与双份事实）；ADR-007 满足 hard to reverse（改母 PRD 不可逆）+ trade-off（只读 vs 同步）。
  - ADR-008 满足 surprising + trade-off 两条——不知「本轮可能没出现该情形」会以为核对记录必然是亲历；在「引用历史原件如实披露」与「人为制造一次失败」间是真实取舍（后者会让记录更好看但违反 SD-06/AC-49）。ADR-009 满足 surprising + trade-off 两条——不知套件主体与存在性核对的边界会以为「跑得越多越彻底」；在「只跑三个直接相关 oracle」与「全量跑」间是真实取舍。ADR-010 满足 surprising + trade-off 两条——不知本卡 build-code 无新实现会以为 E2E-2 必须由本卡自身产出 phase 级代码审查原件；在「CARD-09 归档为主 + 本卡补充」与「以本卡自身执行为主证据」间是真实取舍。ADR-011 满足 surprising + trade-off 两条——不知 `prd.md:607`/AC-48 要求第二三部分用例有真实执行记录会以为存在性核对即可交差；在「逐条真实入口证据映射」与「归档复用」间是真实取舍。ADR-012 满足 hard to reverse（完成宣称一旦发出难以收回）+ surprising + trade-off——不知 `prd.md:607` 的阻断条件是「失败」而非「未验证」会以为 `unverified` 必须阻断完成；在「声明完成 + 显式披露」与「静默当 `passed`」/「当失败阻断」间是真实取舍。ADR-013 满足全部三条——取证形态写进核对记录后难以收回（hard to reverse）、不读 F-012 与用例源码会以为本轮不可用记录是自然故障亲历并以为「独立替代审查真的顶班」发生过（surprising）、在「仅历史原件」/「仅本轮受控演练」/「两层并用」间是真实取舍。ADR-014 满足全部三条——「承接方＝无」写进未决项后反向操作会破坏「母材料只读」边界（hard to reverse）、不读蓝图原文会把 Group 1 的零消费证据读成「各卡违规」而非「要求本身不匹配」（surprising）、在「只在本卡记录」/「写母任务层面文件并出具用词修正建议」/「不记录」间是真实取舍。ADR-015 满足全部三条——补跑一旦执行就产生独立审查原件与 findings 处置记录（hard to reverse）、只读「审查最好只进行一次」会以为补跑违背用户约束（surprising）、在「补跑一次并逐条处置」/「不补跑直接确认」/「补跑并反复复审」间是真实取舍。
- **术语/ADR 冲突及处理**：术语冲突一处——母 PRD SD-07 的「全 phase 结束集成审查」与现行合同的「三审查点」同名不同实，处理=在 `## 退役登记（retirement）` 新旧对应表中显式登记退役，不混用术语；**新增术语对齐一处（F-014、任务 B）**——母 PRD `:553` 明确「第一部分是整体完成的**输入核对**（存在性核对，**不是用例**）」，故 `## 验收面` 0 号行的名称与性质已按此对齐（改名 `用例 0（输入核对，非用例）` 并加性质说明：沿用 0 号仅为编号便利，不适用「套件内用例失败」判据，适用 `prd.md:557` 的「输入不合格 → 整体不得声明完成」），本卡验收面读作「输入核对（0 号）+ 套件内用例 1–7」；ADR 冲突一处——ADR-001 与母 PRD `prd.md:600-602` 冲突，处理=`## Supersedes（被替代记录）` 登记，母 PRD 本体不改。**新增**：ADR-001 的 INTEG-1 部分与母 PRD `prd.md:589-592` **不构成替代**（判 `unverified` 是如实标注，原文继续有效），处理＝在 `## Supersedes（被替代记录）` 显式写明「不替代」；ADR-002 第二次修订不改变「PRD 本体不改」的处理。
- **不复制 spec 的边界**：本文件不写套件用例的 fixture、采样命令、环境假设、N/A+reason 口径与 `quality/` 文件命名细则（OPEN-002），这些进 `spec.md`；本文件不复制母 PRD 正文，只按行号引用并把关键判据逐字留在 V 表；**`N/A+reason` 的口径须与 `prd.md:575`（FR-20 测试机器产物路线）建立显式锚点**（见 `## 验收面` 用例 2 证据列的 FR-20 段）。
- **本文件章节范围（新增/同步，2026-10-05 细节审查 DIR-D1 后）**：`## 审查处置` 增 `#### 细节审查（detail track，DIR-D1）处置`（21 条 findings 主题归并处置表）；`## 范围` 增 `### 用户旅程、页面范围与数据状态`；`## 最终确认` 增最终确认展示项；`## 风险与延期交接` 增 RISK-009。
- **本文件章节范围（新增/同步，2026-10-05 一致性准备 PREP-1 后）**：宿主绝对路径清零（13 行宿主绝对路径（`/Users` 前缀）改为占位/相对路径，`grep -n '\/Users\/'` 0 命中）；`## 验收面` 用例 0 成功条件新增「结论未被漂白」可机械核验定义；用例 1 证据列补逐条命令 / exit code / output 落点并重排连续 ①②③④、补前置行，统一「证据形态（ADR-011）」引述上移至 `## 验收面` 开头；用例 2 成功条件明示判定对象（CARD-09 归档主实例 + CARD-10 补充实例）、证据列补 FR-20 测试机器产物路线锚点；用例 3 可观察用例与 `prd.md:578` 同宽并补前置行；用例 4 失败判据回归 `prd.md:591` 原文（删除新增「消费证据完全为零」失败条件）；`## 审查处置` 增 `#### 一致性准备（spec-analyze，PREP-1）处置`（14 条主题归并处置表，PREP-1-T1..T14 ↔ F-01..F-14）；`## 最终确认` 待展示项扩充（INTEG-3 解释性读法），状态保持 `pending`；RISK-004 降级为「消费证据不足」、H-005 改 `supported`；`## 未决项` OPEN-004 标明「判定定义不后置」。
- **本文件章节范围（新增/同步，2026-10-05 U-018/V-025 后）**：`## 需求变更记录` 新增 `### U-018`（INTEG-3 审查节奏项读法＝用户以母任务 owner 身份经 `ask_user_question`（question_id `inte3-reading`）显式裁定，选项选择逐字 `A 认可这个读法（推荐）`）；`## 逐字声明层（verbatim）` 新增 V-025；`### ADR-001` 末尾追加「授权边界注（2026-10-05，U-018/V-025 后）」（区分 `prd.md:603` 对 CARD-10 owner 的字面授权与用户的显式裁定，两者分开引用）；`## 动态 Talk 批次` 新增 T-006；`## 验收面` 用例 6 判据定稿（不再挂「解释性读法待裁」标记）；`## 最终确认` 待展示项一条（INTEG-3 解释性读法）已由「待裁」转为「已由用户真实裁定」，状态行当时为 `pending`、未改动（**历史表述**：该状态行已于 2026-10-05 改为 `accepted`，见 `## 最终确认` 确认原件）。
- **本文件章节范围（新增/同步，2026-10-05 真实最终确认后）**：`## 最终确认` 状态由 `pending` 改为 `accepted`，并就地登记**确认原件**（命令逐字、原件路径 `<task-dir>/quality/evidence/human-confirmations/2026-10-05-001-make-decision-approve-decision.json`、`status: "recorded"`、`reply` 逐字 `A 确认收口（推荐）`、`material_refs: ["specs/workflowhub-thin-core-card-10-20260919/decision-log.md"]`、绑定 `head: be393a6ef10db7df919e01f194b47f8dd856d9b4`、`created_at: 2026-10-05T12:48:08.272Z`、答复形式＝**选项选择**，经提问工具 `ask_user_question`，question_id `final-confirmation`）；「未确认内容」bullet 的**原待办「用户的真实最终确认」就地更正为已完成**（原句保留为历史表述）；`### ADR-015` 的 owner/next_action 与 `### 确认门` 的「进入 `## 最终确认`」待办同步更正为已完成（原句标历史）。其余章节实质内容不变；`## 未决项` OPEN-002..OPEN-006 仍未关闭。

### Exit checks（退出检查）

- **上下文一致**：通过——`## 任务身份`（普通任务）、`## 原始需求`（R-001..R-011）、`## 需求变更记录`（U-001..U-018）、`## 逐字声明层（verbatim）`（V-001..V-025）、`## 动态 Talk 批次`（T-001..T-006）、`## 决定`（ADR-001..ADR-015）、`## 验收面`（输入核对（0 号）+ 套件内用例 1–7 + AC-47..50 + 用户抽验权通路交付物）与 `## 退役登记（retirement）` 互相引用一致；Talk 第 2 轮三条**选项选择**答复在 U-005..U-007 / V-012..V-014 / ADR-003（修订）/ ADR-008 / ADR-009 / `## 动态 Talk 批次` T-002 之间逐处对应；Talk 第 3 轮两条**选项选择**答复在 U-008..U-009 / V-015..V-016 / ADR-002（修订）/ `## 退役登记（retirement）` 主表与新旧对应表③行 / `## 审查处置` / `## 成功/失败边界` / `## 动态 Talk 批次` T-003 之间逐处对应；Talk 第 4 轮四条**选项选择**答复在 U-010..U-013 / V-017..V-020 / ADR-001（修订）/ ADR-002（第二次修订）/ ADR-010 / ADR-011 / `## 验收面` 用例 1/2/4 / `## 退役登记（retirement）` ③行 / `## 成功/失败边界` / `## 动态 Talk 批次` T-004 之间逐处对应；Talk 第 5 轮一条在 U-014 / V-021 / ADR-012 / `## 成功/失败边界` / `## 最终确认` / `## 动态 Talk 批次` T-005 之间逐处对应；Grill 第 1 批三条**选项选择**答复在 U-015..U-017 / V-022..V-024 / ADR-013..ADR-015 / `## 验收面` 用例 7 / `## 成功/失败边界` ⑦ / `## 未决项` OPEN-006 / `## grill（质询）` 结论行之间逐处对应；各轮均未把选项标签冒充自由文本口述。`## 审查处置` 已把第一轮方向审查 20 条 findings（`DIR-R1-T1`..`T6`）与第二轮 12 条 findings（`DIR-R2-T1`..`T7`）分别按主题归并登记，第二轮无残留 blocking；细节审查（detail track，DIR-D1）21 条 findings 已按主题归并为 `DIR-D1-T1`..`T10` 并逐条处置（20 fixed / 1 accepted_risk），无残留 blocking、无未处置项。唯一冲突面（母 PRD 旧表述）已用退役表 + Supersedes 显式收口，并按 U-010/V-017 记为 `未验证（unverified）` + 用户以母任务 owner 身份正式授权；INTEG-1 判 `unverified` 的缺口去向＝**承接方＝无、只在本卡如实记录**（U-016／ADR-014），并在完成宣称口径（ADR-012）中披露（见 `## 未决项` OPEN-006）。
- **owner/接口一致**：通过——所有套件用例与核对项的承接负责人均为 CARD-10（`prd.md:567`/`:575`/`:583`/`:592`/`:597`/`:602`、`prd.md:607`）；INTEG-1/2/3 的接口关系与 `prd.md:126-129` 的组定义一致（Group 0 蓝图 → Group 1/2 消费；CARD-04↔CARD-07、CARD-05↔CARD-09 共享写面）。
- **失败语义明确**：通过——失败判据逐条照抄母 PRD（`prd.md:535-538`、`:566`、`:574`、`:582`、`:591`、`:596`、`:605`），并新增 ADR-001 的 **INTEG-3** 失败条件（应有审查点缺失/材料被误删/provider 失败被写成通过；**INTEG-1 不新增失败条件**，只判 `unverified`）；失败一律如实记录并阻断完成宣称，禁止漂白、记 N/A、删用例。ADR-003 增补 G-2 豁免披露不完整（缺「本卡无行为变更，故无新 RED→GREEN」/缺可失败检查/缺「独立复跑」界限）即失败；ADR-008 增补「禁止人为制造假失败」且路径②记录必须区分「引用历史原件」与「本轮亲历」，未出现时不得冒称亲历；ADR-009 增补「执行广度受限不得使缺 oracle 的核对项降级为 N/A」；ADR-002 经 Talk 第 3 轮轴五修订后增补「旧『全 phase 结束集成审查』记 `未验证（unverified）`，放行依据必须是用户显式确认（U-009/V-016），仅凭披露不得放行」（`## 成功/失败边界` 同步列入失败模式）；经 Talk 第 4 轮轴六第二次修订后放行依据升级为**用户以母任务 owner 身份正式授权**（U-010/V-017），授权范围仅限 E2E-2 审查节奏项；ADR-001 经 Talk 第 4 轮轴九修订后增补 INTEG-1 判 `unverified`（成功条件=无静默偏离 + 各卡有消费证据；失败条件=任一卡偏离且无 G-1 记录，即 `prd.md:591` 原文、未新增判据）；ADR-012 增补「把 `unverified` 静默当 `passed`、或当作套件内用例失败而阻断完成宣称」均为失败（`## 成功/失败边界` 同步）；**ADR-013** 增补路径②核对记录必须如实标注**受控故障注入**性质与「独立替代审查真的顶班在归档中从未发生」这一事实，把受控注入写成自然发生的工具故障即失败；**ADR-014** 增补「把 Group 1 的零消费证据读成各卡违规、或越界写母任务层面文件/出具母 PRD 用词修正建议」均为失败（承接方＝无）；**ADR-015** 增补「不补跑 detail track 直接进入确认」为失败，补跑后 findings 必须逐条处置（fixed / rejected_invalid / accepted_risk / needs_human）方算收口。
- **范围与延期明确**：通过——`## 范围`/`## 非目标` 划定可写面（仓库内仅本卡 `specs/` + verify-code 结论；原始件落外置 `quality/`）与禁止项（不增删用例、不改失败判据、不改母 PRD、无新实现、不进主仓 `tests/`、不人为制造假失败、不全量跑 `tests/acceptance` 下所有 oracle）；ADR-009 把验收执行广度钉在三个与套件直接相关的 oracle 上，其余各卡只做原件存在性核对 + 归档引用；延期项集中在 `## 未决项` OPEN-001..OPEN-006（均带 owner 与解决时机；**OPEN-001 已由 Talk 第 4 轮轴九 U-013 真实回答并标 closed**；OPEN-002 的采样命令集合部分由 ADR-009 定、fixture/环境假设/N/A+reason 口径仍留 build-plan；OPEN-005 的第 2/3/4/5 轮逐字选项标签缺口由 V-012..V-021 补上但第 1 轮 5 项与 host-visible 绑定仍缺；**OPEN-006 承接方＝无**——按 U-016／ADR-014 本卡不承接、仅记录），跨卡延期=无；**新增缺口去向**＝INTEG-1 的「PRD 用词与制品现实不匹配」＝**承接方＝无，只在本卡如实记录**（U-013、ADR-012；去向口径按 U-016／ADR-014）；`## 范围` 增 `### 用户旅程、页面范围与数据状态`，`## 审查处置` 增细节审查（DIR-D1）处置表。
- **一致性准备 14 条已逐条处置**：通过——`#### 一致性准备（spec-analyze，PREP-1）处置` 表 14 行（`PREP-1-T1`..`PREP-1-T14` ↔ F-01..F-14）全部 `fixed`，无 accepted_risk / rejected_invalid / needs_human / 未处置。
- **decision-log 本体无宿主绝对路径**：通过——`grep -n '\/Users\/' decision-log.md` **0 命中**（13 行宿主绝对路径已改为 `<card-10-worktree>` / `<target-repo>` / `<task-dir>` / `<wh-config>` / `<ocr-bin>` 占位或相对路径）。
- **U-018/V-025 裁定落点（2026-10-05，CARD-10 make-decision 收口前）**：本轮新增 `## 需求变更记录` `### U-018` 与 `## 逐字声明层（verbatim）` `V-025`（选项选择逐字 `A 认可这个读法（推荐）`，经提问工具 `ask_user_question`，question_id `inte3-reading`），并在 `### ADR-001` 末尾追加「授权边界注（2026-10-05，U-018/V-025 后）」、在 `## 动态 Talk 批次` 新增 T-006；`## 最终确认` 待展示项一条（INTEG-3 解释性读法）已由「待裁」转为「已由用户真实裁定」，状态行当时为 `pending`、未改动（**历史表述**：该状态行已于 2026-10-05 改为 `accepted`，见 `## 最终确认` 确认原件）。同步后本文件计数：`## 需求变更记录` U-001..U-018、`## 逐字声明层（verbatim）` V-001..V-025、`## 决定` ADR-001..ADR-015、`## 动态 Talk 批次` T-001..T-006。（机械事实登记，不构成质量结论。）
- **真实最终确认已落定（2026-10-05）**：`## 最终确认` 状态 `pending → accepted`；确认原件＝`<task-dir>/quality/evidence/human-confirmations/2026-10-05-001-make-decision-approve-decision.json`（`status: "recorded"`、`stage: "make-decision"`、`decision: "approve-decision"`）；`reply` 逐字 `A 确认收口（推荐）`；`material_refs: ["specs/workflowhub-thin-core-card-10-20260919/decision-log.md"]`；绑定 `head: be393a6ef10db7df919e01f194b47f8dd856d9b4`；`created_at: 2026-10-05T12:48:08.272Z`；答复形式＝**选项选择**（经提问工具 `ask_user_question`，question_id `final-confirmation`），**非自由文本口述**——用户已被明确告知「可直接打字给一句确认语，那样原文绑定更完整」，仍选择选项。（机械事实登记，不构成质量结论。）

## 2026-10-06 当前授权追加：限定跨卡修复

用户答复完整原话：“授权，你去修复吧”。对应选项全文：“授权调整计划、跨卡修复：保留原强验收标准，补齐缺口；改动和审查范围会扩大。”另一选项是“保留当前阻塞：保留现有修正与失败证据，整体任务仍未完成。”唯一来源=<task-dir>/quality/evidence/2026-10-06-001-crosscard-repair-authorization.md，sha256=51c9ba28063550a227f71b9010ad43efc7cd57497f1c5b2dfe49de17e7ab41ba。解释与原话分开：当前授权允许本卡定点调整计划、跨卡修复，原验收强度不降，无需重复确认该范围。

本节只追加，此前所有字节/ADR保留。ADR006/009/010/014的无实现、无新增测试、三个oracle、不承接缺口限制仍说明原P1；本次P2/T009仅允许三个具名代码/测试路径和move-map新test登记，具体见P2。冻结oracle改变先单一TCR独立审查；不恢复risk、official handler、cohort/reflection/kernel gate，不新增stage/action/持久控制对象。

九卡末行stage=close强条件保持。CARD06例外仅用既有writeStageRow补真实已发生completed四close_action，旧三行15269B/原证据字节保真，补记时间与source原发生时间分开；101已实际补记，102/104/105是新读回，不重close。旧019/085失败保留，105exit0只证明当前输入合规。原三INTEG unverified、099/100 RED、CARD01 ARCHIVE原件均保留；新证据不补造历史，未执行/缺证不能pass。最终CARD10 close/归档/删除仍动作前停。
