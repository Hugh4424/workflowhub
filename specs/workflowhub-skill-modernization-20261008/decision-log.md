# 决策日志（decision-log）— workflowhub-skill-modernization-20261008

## 任务身份

- **任务类型**：普通任务
- **任务说明**：在 workflowhub 仓库内实现技能与流程改造；本任务自身走 post 五阶段路线。
- **任务 id**：`workflowhub-skill-modernization-20261008`
- **认证工作区**：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008`，分支 `task/workflowhub/workflowhub-skill-modernization-20261008`，baseline `7ad39ae852cb7ee4ce4630c54d7502b8e2cf4e59`。
- **材料位置**：post cohort；本阶段材料为 `specs/workflowhub-skill-modernization-20261008/decision-log.md`。

完成判据：本节恰一次声明任务类型为普通任务，与用户真实声明一致（用户要求"按标准 WorkflowHub 开始这个任务"，未声明规划任务）。

## 大纲地图

- 任务身份
- 原始需求
- 需求变更记录
- 工作包 ① — 引入方式与外部技能取舍
- 工作包 ② — make-decision 阶段改造
- 工作包 ③ — build-plan 阶段改造（含 ticket 与 phase 之争）
- 工作包 ④ — build-code 阶段改造
- 工作包 ⑤ — verify-code 阶段改造
- 工作包 ⑥ — 复盘沉淀（Improvements.md）与技能互引
- 工作包 ⑦ — 技能与步骤的合并/简化
- 要改哪些文件
- 范围与非目标
- 验收面
- 未决项
- 风险与延期交接
- 外部调研事实索引
- 外置事实索引

补充（收口时同步）：初稿之后按真实问答与审查结论追加了若干顶层节——`## 第二轮补充决策（深度 B 分相执行）`、`## 第三轮补充决策（指标纠正与执行顺序）`、`## 第四轮补充决策（规模、深度与内容保全）`、`## 需要在进入 build-plan 前确认的三个风险`、`## 第五轮补充决策（张力闭合）与相序推导`、`## 细节审查处置（detail-advice 回执与逐条处置）`、`## 相序更正（F5/F3 处置）与规模重估`、`## 需要用户裁决的范围问题`、`## 需求闭环表（R → AC/ADR 落点）`、`## 用户用例索引（UC-001..UC-008）`、`## 决策链条条目`、`## 总览决策索引（D-001..D-063）`。这些节按追加顺序排在 `## 外置事实索引` 之后，**不在初稿地图内**；本补充说明即为其目录。

完成判据：目录每行对应一个正文顶层节，按正文顺序排列；大纲地图自身省略。

## 原始需求

逐字原文外置为 V-001：任务库根 `quality/evidence/decision-log-refs/raw-user-requirement.md`（sha256 `e63baa673b0b21f76d4f4fb40845ffe48e95de3c29b1dfec6ebb7f3cb75d5266`）。下表为该原件的需求索引，不复制正文。

| source_id | 原始需求/约束 | 来源引用 | 关联 ADR/处理状态 |
| --- | --- | --- | --- |
| R-001 | 使用 mattpocock/skills 的 engineering 技能优化 workflowhub 各技能与流程 | V-001.1 首段 | ADR-001 / 已收敛 |
| R-031 | **用户原话限定（覆盖核查补记）**：用户"给出"的这批技能只是**建议**（原话：「以上只是我自己的一些简单想法」），需求本体是"**看看有哪些适合放在 workflowhub 中使用的**"⇒ **引入与否由调研判定，不预设采用**。R-002..R-014 各条中的"用 X 优化 Y"因此按"候选落点"读，不按"已定采用"读 | V-001.1 第 6 段首句「以上只是我自己的一些简单想法……看看有哪些适合放在workflowhub中使用的？」 | ADR-001、AC-015；调研报告 §8.3 逐技能判定表 |
| R-002 | make-decision 用 `wayfinder` 更好找到当前任务解决方案 | V-001.1 第 1 条 | ADR-002 / 待定 |
| R-003 | 普通任务用 `pr` 帮助创建当前任务的 PR 与 PR 描述；现状"所有任务都是 commit，从来没用过 pr" | V-001.1 第 1 条 | ADR-003 / 待定 |
| R-004 | 用 `domain-modeling` 建立并搜索项目上下文与领域知识，帮助 make-decision 收敛 | V-001.1 第 1 条 | ADR-002 / 待定 |
| R-005 | 用 `research` 做更好的内部相关知识搜索 | V-001.1 第 1 条 | ADR-002 / 待定 |
| R-006 | 用 `to-spec` 优化 `spec-specify` 技能 | V-001.1 第 2 条 | ADR-004 / 待定 |
| R-007 | 用 `to-tickets` 优化 `spec-plan` 技能 | V-001.1 第 2 条 | ADR-004 / 待定 |
| R-008 | 不再创建 phase 文件，改成创建 ticket 文件 | V-001.1 第 2 条 | ADR-005 / 待定（与现行治理冲突，见 OI-001） |
| R-009 | 用 `codebase-design` 更好设计执行方案与开发计划 | V-001.1 第 2 条 | ADR-004 / 待定 |
| R-010 | 用 `tdd` 提前进行 TDD 设计（build-plan）并在 build-code 做 TDD 开发 | V-001.1 第 2、3 条 | ADR-006 / 待定 |
| R-011 | build-code 用 `implement-spec` 更好实现各 ticket 任务 | V-001.1 第 3 条 | ADR-007 / 待定 |
| R-012 | build-code 在 OCR 之外，额外做一次子代理代码审查（`code-review`） | V-001.1 第 3 条 | ADR-007 / 待定（与"三审查点"及证据唯一性有张力，见 OI-004） |
| R-013 | 用 `diagnosing-bugs` 进行 bug 复现与处理 | V-001.1 第 3 条 | ADR-007 / 待定 |
| R-014 | verify-code 用 `improve-codebase-architecture` 评估并优化整个代码实现 | V-001.1 第 4 条 | ADR-008 / 待定（与"验证阶段不改代码"有张力，见 OI-005） |
| R-015 | stage 出问题时用 `retro` 审查会话过程、沉淀改进建议 | V-001.1 第 5 条 | ADR-009 / 待定 |
| R-016 | 改进建议写进每个项目根目录的 `Improvements.md`，结构化整理、精简、方便下次调用 | V-001.1 第 5 条 | ADR-009 / 待定 |
| R-017 | 每个任务都可以更新 `Improvements.md`，保证内容高质量 | V-001.1 第 5 条 | ADR-009 / 待定 |
| R-018 | 不要一直留存已解决的问题（清理机制） | V-001.1 第 5 条 | ADR-009 / 待定 |
| R-019 | 派子代理研究 workflowhub 与该开源项目；判断哪些适合引入 | V-001.1 第 6 段 | ADR-001 / 本阶段已执行调研 |
| R-020 | 明确优化方式：改造已有 skill / 直接内置调用 / 删改已有 skill 提质 | V-001.1 第 6 段 | ADR-001 / 待定 |
| R-021 | 保证 workflowhub 已有的执行质量不下降 | V-001.1 第 6 段 | ADR-001 / 待定（全局约束） |
| R-022 | 调研是否有更好用的其它开源项目（例如 backnotprop/pstack） | V-001.1 第 6 段 | ADR-001 / 本阶段已执行调研 |
| R-023 | 技能若参考了其它技能，在技能内部标明，便于上游更新时同步 | V-001.1 第 6 段 | ADR-010 / 待定 |
| R-024 | 检查现有技能与步骤是否太多，是否需要合并或简化 | V-001.1 第 6 段 | ADR-011、ADR-012 / 已收敛；**范围含 workflowhub 自身与所有使用 workflowhub 的目标项目**（与 D-017 的范围一致） |
| R-025 | 流程约束：按标准 WorkflowHub 执行，先建 worktree，从 make-decision 开始，不跳阶段 | V-001.2 | 已执行（task-bootstrap + 本阶段） |
| R-026 | 流程约束：make-decision 中与用户一起梳理完整需求大纲、细节、扩散想法、实现方案、验收标准 | V-001.2 | 本阶段执行方式 |
| R-027 | 流程约束：Talk 与 grill 用大白话说明选项、后果、风险 | V-001.2 | 本阶段执行方式（沟通纪律） |
| R-028 | 流程约束：主会话不做大量阅读与调研，保证上下文控制与执行质量 | V-001.2 | 已执行（调研全部外派子代理） |
| R-029 | 流程约束：方向审查与细节审查各自只做一次，取得异源（独立上下文）审查建议 | V-001.2 | 本阶段执行方式 |
| R-030 | 流程约束：Talk/Grill 不跳阶段、不代替用户决断 | V-001.2 + 宪法 | 全局约束 |

完成判据：每条真实需求有来源与决定落点；缺来源逐项写明，逐字原文和索引明细引用外置原件。

## 需求变更记录

### U-001 — 需求消息与流程指令分开登记

- 原文锚点：V-001.1、V-001.2。
- 变更与处置：用户分两条消息给出内容需求与执行方式，本日志按"内容需求 R-001..R-024"与"流程约束 R-025..R-030"分开登记，避免把执行方式当成方向承诺。
- 影响：ADR-001..ADR-011 只需覆盖内容需求；流程约束按现行 make-decision 方法执行并如实记录。

### U-002 — 本任务范围经三次裁决变更

- 原文锚点：V-001.2（用户后续轮次的真实答复；逐字原文见任务库 `quality/evidence/human-confirmations/`）。
- 变更与处置：范围先被裁决为"切法甲＝拆三个任务"（D-062），随后用户明确更正为"**切法丙＝不拆，全部在本任务内串行**"（D-064）；D-039 的"不拆"因此重新生效，D-062 作废但保留原文。
- 影响：相序保持 R → A1 → A2′ → A3 → B1..B4 → B6；本任务不再切成三个任务。规模与"一个任务内完成"的实测冲突按 D-064 记为**用户已知悉并接受**，未隐去。

### U-003 — 用户的报告技能清单被澄清为"建议"而非"需求"

- 原文锚点：V-001.1 第 6 段首句。
- 变更与处置：覆盖核查时发现 R-001 把用户所提技能当成已定采用；补 R-031 明确"**适合性由调研判定，不预设采用**"，R-002..R-014 的"用 X 优化 Y"按候选落点读。
- 影响：ADR-001 的判定表（调研报告 §8.3）成为该批技能去向的唯一依据，四种去向（adopted/adapted/absorbed/rejected）逐条有判据。

完成判据：每次真实变更独立记录 U 编号、原文指针、处置和受影响决定；没有变更时写无。

## 工作包 ① — 引入方式与外部技能取舍

### 要交付什么

给出"外部机制的引入方式"结论并落地：每项外部机制在 workflowhub 里的**去向**（吸收进现有技能 / 新建薄技能 / 明确拒绝）与**落点文件**。同时把上游基线固定为 `b0618bc`，并把 `CONTEXT.md` → `GLOSSARY.md` 的改名连同跨项目格式约定做完。覆盖 R-001、R-019..R-023。

### 决定

#### ADR-001 — 吸收式改造 + 拒绝整目录搬运

- 决定：外部技能**不整目录搬运**，只吸收其规则与判据；确需独立职责时新建**薄技能**；每项引入都必须有真实消费者与触发点，否则标 `watch`。上游基线固定为 `b0618bc436ad893b3c5e84e55fba86586d34a404`，三处（`catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`reuse-registry.md`）保持一致；每个引用上游的技能正文写明来源技能、固定 version/commit 与本地偏离。
- 为什么：五个外部技能一致暴露三类本仓无法满足的宿主硬依赖（Claude Code Skill 工具、`/setup-matt-pocock-skills` 斜杠命令、外置 issue tracker + `ready-for-agent` 标签 + `.scratch/` 目录约定），原样搬运会产出不可运行技能；且用户已怀疑技能过多（R-024），而本仓真实接线只有约 24 个技能。
- 否掉了什么：整目录搬运（X-01）、外置 tracker 与第二套工件根（X-02）、pstack 的编排器与模型路由表（X-03）、外部术语体系原样写入（X-04）、新增 stage/gate/第二套进度权威（X-05）、向量记忆与 marketplace 分发层（X-06）。
- 后果与风险：吸收不彻底会变成"说了但没做"，因此**每条引入必须有可执行 oracle**（见 AC-011/AC-012）；上游已从 `CONTEXT.md` 改名为 `GLOSSARY.md`，本仓沿用旧名的部分必须先统一，否则"同步上游"永远无法核对。
- 影响面：`skills/catalog.yaml`、`skills/reuse-registry.md`、`THIRD_PARTY_NOTICES.md`、各技能正文的来源标注节、`CONTEXT.md` → `GLOSSARY.md` 及其 51 处引用（约 20 个文件，含 6 份 ADR —— **用户在 D-018 明确批准改写历史 ADR，这是仓库「历史原件不重写」纪律的具名例外，须显式披露，本地原文以 git 历史为唯一溯源**）。

#### ADR-002 — 领域知识格式跨项目统一

- 决定：领域知识格式统一为 `GLOSSARY.md`（单上下文）或 `GLOSSARY-MAP.md` + 各上下文自己的 `GLOSSARY.md`（多上下文），决策记录在 `docs/adr/`；**该约定对 workflowhub 自身与所有使用 workflowhub 开发的项目同时生效**，避免多种格式冲突。
- 为什么：用户明确要求统一（D-017）；本仓已有 `CONTEXT.md` 与 `skills/grill-with-docs/CONTEXT-FORMAT.md`，上游对应 `GLOSSARY.md` 与 `GLOSSARY-FORMAT.md`，两者必须同口径，否则"按上游更新自己的技能"这件事没有可对齐的基线。
- 否掉了什么：只改 workflowhub 自己（范围不足）；同时保留 `CONTEXT.md` 与 `GLOSSARY.md` 两份术语真相（违反单一来源）。
- 后果与风险：`docs/adr/` 的 6 份历史决议被改写，读者可能误以为原文从未变过——**必须在决策日志与交付说明显式标注**（OI-016）。跨项目侧需要一个**唯一载体**承担"目标项目该建什么文件"的约定，不得新增第二套术语真相（OI-015 未决）。
- 影响面：仓库根 `GLOSSARY.md`、`skills/grill-with-docs/CONTEXT-FORMAT.md` → `GLOSSARY-FORMAT.md`、`skills/decision-log/SKILL.md`、`skills/simplicity-guard/SKILL.md`、`tools/cli/verify-structure.mjs`、`workflows/build-code/case-selection.mjs`、`tests/contract/card06-migration-ledger.test.mjs`、`docs/architecture/move-map.json`、`docs/adr/`（6 份）、`AGENTS.md`、`CLAUDE.md`、`README.md`、`CONTEXT.md`；跨项目侧载体待定（OI-015）。

### 失败了怎么退

改名是可回退的纯文本改动（git 历史保留原文）；上游基线升级若发现新版技能内容与旧版语义不同，保留旧版行文并写明偏离，不强行追平。跨项目格式若无法找到唯一载体，则只在本仓落地并把该缺口如实标 open，不硬造第二套约定。

完成判据：每个工作包有结果、消费者、来源、五字段决定与具名失败恢复路径；实际确认可从指针回读。

## 工作包 ② — make-decision 阶段改造

### 要交付什么

让 make-decision 真正用得上：① `wayfinder` 的"地图 + fog 记账"信息结构；② `domain-modeling` 的懒创建与 ADR 三重门槛；③ 恢复 `anysearch` 的对外检索接线，使 `deep-research` 的"工具路由"表所述能力真实可用。覆盖 R-002、R-004、R-005。

### 决定

#### ADR-003 — 只吸收信息结构，不引入 GitHub 原生机制

- 决定：吸收 `wayfinder` 的 map 五段结构（Destination / Notes / Decisions so far / Not yet specified / Out of scope）与三条纪律（`Plan, don't do`、每会话最多解一个 ticket、**fog 不得预先切成 ticket 大小**、**HITL 问题不得 agent 自答自问**）；**拒绝**其 GitHub label、sub-issue、issue dependencies API 与 `research/*` 分支约定。吸收 `domain-modeling` 的懒创建（第一个术语定了才建文件）与 ADR 三重门槛（难逆转 / 无上下文会让人惊讶 / 真实权衡取舍，任一缺失直接跳过）。
- 为什么：三条信息结构能直接解决"方向收敛靠什么记账"的问题且零宿主依赖；`wayfinder` 的原生机制深绑 GitHub 与 Skill 工具，搬进来就跑不起来。`anysearch` 的断线是历史误删（`c8596006`），且 `deep-research` 的工具路由表本来就写着用它，是"技能调用未接线技能"的实际缺陷。
- 否掉了什么：整目录搬运 `wayfinder`；用外置 tracker 承载 map（本仓已有 `specs/<task>/` 本地落点）；为 make-decision 新增阶段或门。
- 后果与风险：map 结构与现有 decision-log 的"大纲地图"可能有职责重叠，须明确**谁记什么**，否则形成第二处记账；恢复 `anysearch` 后须保留"用户批准才外发"的约束与失败/跳过的真实原因。
- 影响面：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/deep-research/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/anysearch/**`。

### 失败了怎么退

接线恢复后若 `anysearch` 真实不可用（缺凭证、网络失败），如实记 unavailable 并继续，不伪造来源；map 结构若与 decision-log 冲突，回退为只保留"未明确/越界"两段，其余并入既有大纲地图。

完成判据：同上。

## 工作包 ③ — build-plan 阶段改造（含 ticket 与 phase 之争）

### 要交付什么

① 用 `to-spec` 的骨架优化 `spec-specify`；② 用 `to-tickets` 的方法优化 `spec-plan`；③ 把 TDD 设计前置；④ 让 `spec-tasks`、`spec-research` 的职责并入更大技能。覆盖 R-006、R-007、R-009、R-010（设计部分）、以及 D-013。

### 决定

#### ADR-004 — ticket 只装方法，不换形态

- 决定：保留 `specs/<task>/phases/P<n>.md` + 纯指针 `phases/index.md` 的现有形态；把 ticket 的**拆解方法**装进 Phase 内的 Task 卡：纵向切片（一张卡切穿 schema/API/UI/tests）、可独立演示或验证、大小以"一个新会话能装下"为准、prefactor（先做让改动变简单的准备）排最前、**显式声明阻塞边**（无阻塞 = 可立即开始）、宽重构走 expand–contract（先并存扩展 → 按 blast radius 分批迁移 → 最后收缩删除），并明确"**票是 task graph 不是步骤表**"。`spec-tasks`（12 行，只渲染指针索引）并入 `spec-plan`；`spec-research`（25 行）并入 `deep-research`。
- 为什么：用户 D-002 选择保留形态。宪法 F3 与 `runtime/task/material-workspace.mjs` 的 `CURRENT_MATERIAL_FILES`/`PHASE_FILE` 把 `phases/P<n>.md` 连续有序定为当前材料形态，改形态会波及运行时、治理文档与大量契约测试，且触"不新建第二套进度权威"边界；而用户真正想要的是**拆解质量**，那完全可以在现有形态内实现。
- 否掉了什么：`tickets/T<n>.md` 新形态（S-E）；一票一文件且绝不合并的 tracker 约定；`to-tickets` 的外置 tracker 与 `ready-for-agent` 标签依赖。
- 后果与风险：文件名仍叫 Phase，用户下次可能还会问"为什么不是 ticket"——须在技能正文写明这一取舍与理由；Task 卡新增字段（阻塞边、切片类型）须与既有 `templates/phase-template.md` 及读它的测试保持一致。
- 影响面：`skills/spec-plan/**`、`skills/spec-specify/**`、`skills/spec-tasks/**`（并入后删除）、`skills/spec-research/**`（并入后删除）、`skills/deep-research/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`templates` 相关测试。

#### ADR-005 — TDD 接缝纪律前置到设计阶段

- 决定：在 build-plan 的实现设计段前置 TDD 设计，写入 `tdd` 的三条硬判据：**`No test is written at an unconfirmed seam`**（写测试前必须先写下被测接缝并与用户确认）、每个候选接缝一行说明"能抓到什么/漏掉什么"、期望值必须来自独立真相源（禁 tautological）、禁 horizontal slicing、**refactor 不属于 red-green 循环、归 review 阶段**。
- 为什么：用户 R-010 要求提前做 TDD 设计；这三条正好把"测试写在哪个接缝"从实现期的临场决定变成设计期的可审查决定。
- 否掉了什么：把 TDD 设计留给 build-code 现场决定；引入 `tdd` 的技能文件本体（其宿主硬依赖是 Skill 工具）。
- 后果与风险：接缝确认需要用户参与，可能增加一次交互——须与"零问题合法"的既有原则一致，确实无歧义时允许不提问。
- 影响面：`skills/spec-plan/**`、`workflows/build-plan/SKILL.md`（+ 可能的 `skills/test-routing-advisor/**` 衔接）。

### 失败了怎么退

Task 卡字段扩展若被现有测试判为非法，先保留原字段并只在正文补语义说明，不强行改模板；接缝确认若成为负担，降级为"只在接口形状存疑时确认"。

完成判据：同上。

## 工作包 ④ — build-code 阶段改造

### 要交付什么

① 用 `implement-spec` 的纪律优化各 ticket 的实现；② build-code 每个 Phase 增加第二个并列的独立代码审查轴（融合 Matt `code-review` 双轴），并修正 OCR 缺失时的回退目标；③ `diagnosing-bugs` 接上真实消费者；④ PR 能力落地。覆盖 R-011、R-010（TDD 开发部分）、R-012、R-013、R-003。

### 决定

#### ADR-006 — 同源补充轴 + 独立的修宪改动

- 决定：build-code 每个 Phase 在 OCR 之外增加一条子代理审查，**如实命名为「同源补充轴」**，按仓库已有 `review_origin: same_source_degraded` 记账，**不声称异源、不计入异源 quorum**；真正的异源审查仍然是 OCR。两轴发现**并排展示、不合并、不重排名**（吸收 Matt `code-review` 的 `Do not merge or rerank findings`、`The repo overrides.`、`skip anything tooling already enforces`）；该轴**不自己写文件**，结论引用已有证据原件。**把 OCR 不可用时的回退目标改为代码审查技能这件事，单独拆成一批只改文本、可单独回退的修宪改动**（`CONSTITUTION.md:172` + 6 处治理文本），引用用户真实答复作依据，与技能改动分开验收。
- 为什么：用户 D-025/D-026 确认。仓库的身份契约（`runtime/review/canonical-review-result.mjs:302-308` 要求 `minimum_heterologous >= 1`、`requireIdentity`、`requireSourceId`）使得同宿主子代理拿不到异源身份；而 OCR 路线是**明文禁止子代理**的（`ocr-delegation-adapter.mjs:14/:193/:284`、`:688`、`stage-runtime.mjs:345`）。若强行把子代理称为"独立审查轴"，要么伪造 provider 身份、要么新增事实种类，两者都触碰 F4/F5/F8。
- 否掉了什么：把子代理称为异源独立审查（名实不符）；把两轴合并或跨轴排名；用该轴取代 OCR（等于取消异源审查，违反 F4）；把审查结果另存一份文件镜像（违反"每类事实只留一份原始件"）；由实施者静默改宪。
- 后果与风险：`CONSTITUTION.md:172` 与 6 处治理文本会短暂与技能文字不一致（修宪批次未落地前）——须按 D-026 的批次顺序处理并把不一致窗口如实记录；`architect-code-review` 正文自述的 `AC-REVIEW-011` 在当前仓库**已不存在**（悬空引用，须处理）；`runtime/review/canonical-review-result.mjs:22` 的 `dsh-code-review → architect-code-review` provider 别名映射会被牵动。
- 影响面：`skills/architect-code-review/**`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`skills/wh-review/**`（回退描述）、`CONSTITUTION.md`、`CONTEXT.md`/`GLOSSARY.md`、`README.md`、`docs/standard-workflow.md`、`AGENTS.md`、`runtime/review/canonical-review-result.mjs`。

#### ADR-007 — 被误删的接线恢复，PR 作为**按环境自适应**的交付形态

- 决定：① `diagnosing-bugs` 接上 build-code 真实消费者（其硬判据 `No red-capable command, no Phase 2.` —— 先有一条已跑过、能变红、秒级、确定、agent 可跑的复现命令才准进假设；以及 `If no correct seam exists, that itself is the finding.`）；② `implement-spec` 的"票是 task graph、沟通走 context pointer、`Don't duplicate information already available via pointers`"吸收进 build-code；③ **PR 改为按当前环境与项目能力自适应**：环境与项目支持时默认开 PR，否则退回 commit 并写明原因（不是所有任务、所有项目都默认 PR）；④ PR 描述采用 Matt `pr` 三段模板（Summary 挑**最小**视图 / Evidence **必须 before-after** / Merge Danger 的 `Door:` 与 `Blast Radius:`）。
- 为什么：用户 D-021/D-011/D-012。`diagnosing-bugs` 已含三个外部来源的合并成果却零消费者，接上是白捡收益。
- **真实代价（对抗性审查实测，已推翻"只需扩两处白名单"的初判）**：① `core/task-close.mjs:384` **只推 main**（`git push <remote> <target_branch>:<target_branch>`），`:401` 是 **删除远端任务分支**（`git push --delete <task_branch>`）——全仓**没有任何推送任务分支的代码**，而 `gh pr create` 需要 head 分支在远端且 ahead of base；② `core/task-close.mjs:166` 的 steps 把 **`merge` 排在 `push` 之前**，PR 必须在这之前；③ 需改 **≥5 处代码**：`tools/cli/stage-runtime.mjs:1003`、`runtime/interface/git-authorize.mjs:423`、`runtime/task/task-store.mjs:13`、`core/task-close.mjs:13`、`runtime/stage/current-close-projection.mjs:24`；④ **≥3 处冻结测试**：`tests/close/close-contract.test.mjs:34`（标题即「preserves **exactly five actions**」）、`tests/contract/four-domain-close-status.test.mjs:10`、`tests/contract/current-close-projection-readback.test.mjs:4`；⑤ `core/task-close.mjs:166` 用 `same(plan.steps, expected)` 做硬不变量断言。⇒ **这是收口流程重构，不是白名单加词。**
- 否掉了什么：只产出 PR 描述文本而不真建 PR；绕过 authorize 建 PR；把 PR 做成新的 stage 或 gate；把 PR 设为所有任务所有项目的无条件默认。
- 后果与风险：PR 涉及远端状态，不可逆性高于本地 commit，须有真实失败路径（无 commits ahead、base 不存在、推送失败、无权限、`gh` 未装或未登录）；`CLOSE_ACTIONS`、授权动作集合与 `current-close-projection` 的扩展会影响读取旧记录的逻辑；须真实跑通一次 `gh pr create` 才算验证。
- 影响面：`tools/cli/stage-runtime.mjs`、`runtime/task/task-store.mjs`、`runtime/interface/git-authorize.mjs`、`core/task-close.mjs`、`runtime/stage/current-close-projection.mjs`、`tests/close/**`、`tests/contract/{four-domain-close-status,current-close-projection-readback}.test.mjs`、`workflows/build-code/**`、`workflows/verify-code/**`、`skills/diagnosing-bugs/**`、`docs/standard-workflow.md`、`CONTEXT.md`/`GLOSSARY.md`、`README.md`。

### 失败了怎么退

若 `gh pr create` 在真实环境持续失败，保留真实错误并降级为"产出 PR 描述 + 手工建 PR 的明确指令"，不伪造链接；审查轴若在真实任务里被证明只增加噪声，可降级为只在最后 Phase 跑（保留 skill-deps 的触发条件可改），不删除其内容。

完成判据：同上。

## 工作包 ⑤ — verify-code 阶段改造

### 要交付什么

在 verify-code 内落地 `improve-codebase-architecture` 的评估与优化能力，并保证**每任务最多一次**、不成无限循环。覆盖 R-014。

### 决定

#### ADR-008 — 一次性评估，硬规则 + 材料可查

- 决定：verify-code 内可评估并优化实现，但**每任务上限一次**；写成技能正文的硬规则，并把"已评估"这件事做成材料里可查的事实；第二次触发时**引用已有报告**而不重跑。吸收其"`Do NOT propose interfaces yet.`"（先只报机会、用户选中后才进设计）与术语纪律（module/interface/depth/seam/adapter/leverage/locality；**禁** component/service/API/signature/boundary/layer/wrapper）与 deletion test。
- 为什么：用户 D-006 明确"只跑一次，不要变成无限循环"；且该技能本身的秩序就是"先报告、后设计"，与"验证阶段不无限改代码"天然一致。
- 否掉了什么：允许在同一任务内反复评估（会变成无限循环）；新增机器拦截状态对象（宪法禁止新增持久对象与第二套账本）；独立第五入口（用户未选）。
- 后果与风险：本项**确实改变了 verify-code 的职责**（从"只核对"扩到"可评估并优化"），因此必须保证"优化动作"不改变"被验证对象"的可追溯性——**改完必须重新验证受影响部分**，否则验证结论失去意义。
- 影响面：`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、新建或改造的架构评估技能、`runtime/task/material-workspace.mjs`（若需要材料事实，须先证明无第二套账本）。

### 失败了怎么退

若"改完必须重验"导致成本失控，降级为"评估报告只读 + 优化动作前移到下一个任务的 build-plan"，并把该降级如实记录。

完成判据：同上。

## 工作包 ⑥ — 复盘沉淀与技能互引

### 要交付什么

① 复盘闭环：候选 → 用户挑 → 优先转成确定性检查 → `Improvements.md` 只留未解决项；② 技能内部标明参考来源与固定版本；③ 上游基线可核对。覆盖 R-015..R-018、R-023。

### 决定

#### ADR-009 — 复盘只提案，规则优先落成检查

- 决定：复用现有 `skills/stage-reflection` 作为单一路径（**不新建第二套账本**），把它的产出链改成：复盘产出候选 → 用户挑选 → **机械性违规一律转成确定性检查**（`Default to building the check over writing the rule`）→ 只有真正需要人判断的才写进项目根 `Improvements.md`，且**只保留未解决项**（解决掉就删，`Drop a rule once its mistake can't happen`）。同时吸收 pstack `correct` 的层级纪律：**`Eliminate it with architecture → types → test → Write docs or agent rules last`**，以及"一个错误类发生过两次才算一类"与"每条新检查必须能在真实的历史错误上失败"。
- 为什么：用户 D-004 选择 A。这是一条链而不是一个新机制：外部三个来源（Matt `retro`、pstack `correct`、pstack `principle-encode-lessons-in-structure`）对"防膨胀"给出的答案完全一致——**把 prose 规则转成机器检查**，且都明确指出"文档是最后一层，因为 agent 跳过它不会有任何东西失败"。
- 否掉了什么：把 `Improvements.md` 当主要沉淀载体（那正是膨胀的来源）；新建机器可读的规则账本；自动清理机制（外部也没有自动清理，须由人 prune）。
- 后果与风险：`Improvements.md` 若真的长期只有未解决项，它的价值在于"待办清单"而非"知识库"——须在文件头写明这一点，避免下次被当成规范文档读；机械性/判断性的分类是人的判断，须给出判据而不是让 agent 自行归类。
- 影响面：`skills/stage-reflection/SKILL.md`、`workflows/*/SKILL.md`（五个阶段的收尾）、可能的 `tools/cli/**`（新增检查脚本）、项目根 `Improvements.md`（新建）。

#### ADR-010 — 技能互引的写法

- 决定：每个引用了外部或其它技能的技能，在其正文设固定一节，写明：来源技能名、仓库 URL、**固定 commit 或 version**、引用的具体子文件、**本地偏离**（改了什么、为什么）、以及"上游更新时该看哪里"。这与 pstack README 的做法同形（`These skills don't call other pstack skills, so each one works alone` + 一张 `| Skill | Also install |` 组合表），因此**不新造机制**——把已有 `skill-deps.yaml` 补成可读组合表即可。
- 为什么：用户 R-023；且 F-5 已证明"没有固定基线与偏离说明"会让同步变成不可能。三层登记（catalog / reuse-registry / 技能正文）各有读者，本决定只要求**技能正文层**新增可读的来源标注，不新增第四份机器清单。
- 否掉了什么：新增 frontmatter 字段当第四份机器登记；把来源只写在 `reuse-registry.md`（技能单独搬运后会丢失）。
- 后果与风险：必须避免与前两层的版本号写岔——ADR-001 已要求三处基线一致，正文层同批核对。
- 影响面：所有引用外部来源的技能正文；`skills/reuse-registry.md`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`（三处基线同步）。

### 失败了怎么退

若"机械性违规"判据在实践中无法稳定区分，退为"用户逐条决定归口"，并把这条不确定性如实记录；来源标注若与上游版本号冲突，以真实存在的 commit 为准并标注核对日期。

完成判据：同上。

## 工作包 ⑦ — 技能与步骤的合并/简化

### 要交付什么

① 三份清单收敛为一个真相并加一致性检查；② 清除 `build-spec` 死阶段名；③ 处理零消费者技能；④ 合并薄技能；⑤ 检查 53 个阶段步骤是否可简化。覆盖 R-024、R-021。

### 决定

#### ADR-011 — 以实际接线为唯一真相

- 决定：唯一真相 = 各阶段 `workflows/*/skill-deps.yaml` + `skills/wh-review/{manifest.json,stage-skill-plan.json}`（因为它们是被代码真实读取的）；`skills/catalog.yaml` 保留为**带上游来源与许可信息**的登记（不再是消费者真相）；`repo-skills.manifest.json`（44 条，其中 6 条指向不存在的文件）**删除**（删除前须有具名 consumer 扫描证据）；新增一个一致性检查脚本，并在"故意制造不一致"时**真的报失败**。`build-spec` 死阶段名在 catalog / manifest / runtime schema 四处全部清除（清除前须扫描旧任务与旧工件是否真的出现过该值）。
- 为什么：用户 D-009/D-007。事实是四份口径（catalog 66 / manifest 44 / 磁盘 40 / 真实接线约 24）互不相同且**没有任何测试在检查**，这正是"技能是否太多"这一困惑的真正来源；把假数据当权威（选 catalog）只会把错误固化。
- 否掉了什么：以 `catalog.yaml` 为唯一权威；只加报警不设权威；不动 `build-spec`。
- 后果与风险：删除清单与修改 schema enum 都可能影响历史数据读取，`ADR-0030` 要求每个被删对象附具名 consumer 扫描证据（命令 + 计数 + 命中文件清单）；一致性检查脚本本身是新增机制，须登记职责、真实 consumer、owner 与删除条件。
- 影响面：`repo-skills.manifest.json`（删）、`skills/catalog.yaml`、`runtime/schemas/risk-acceptance.v1.json`、`runtime/schemas/human-confirmation.v1.schema.json`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/review-packet-identity.mjs`、新增检查脚本、`tools/cli/verify-structure.mjs`、相关测试。

#### ADR-012 — 零消费者技能逐个定性，不做一刀切

- 决定：`debate` 删除（0 skill-deps / 0 wh-review 清单，仅自测与一份 ADR 反例引用）；`anysearch` **恢复接线**（不是删除，见 ADR-003）；`architect-code-review` **融合后接回 verify-code**（不是删除，见 ADR-006）；`diagnosing-bugs` **接上 build-code 真实消费者**（不是删除，见 ADR-007）。每项删除都附真实引用扫描证据，旧材料不重写。
- 为什么：清点结论是"零真实消费者"，但用户的设计意图证明其中三项是被两次"简化"提交误删的接线；把"没人调用"直接等同于"没用"会删掉仍在设计内的能力。
- 否掉了什么：一刀切删除全部零消费者技能；全部保留只做标记。
- 后果与风险：恢复接线后必须验证它们**真的被触发**（不是只加一行声明）——这正是 AC-011 要证伪的点。
- 影响面：`skills/debate/**`（删）、`skills/anysearch/**`、`skills/architect-code-review/**`、`skills/diagnosing-bugs/**`、对应 `skill-deps.yaml` 与 `catalog.yaml` 登记、`tests/` 相关契约测试。

### 失败了怎么退

若一致性检查脚本在真实使用中产生大量误报，降级为"只在变更清单相关文件时运行"；若恢复接线的技能在真实任务里未被触发，如实记为未接线并把原因写清，不为了凑 AC 而伪造触发。

完成判据：同上。

## 要改哪些文件

待 `research-and-diverge` 与方向 Talk 收敛后填写；当前唯一确定事实是范围落在 workflowhub 仓库的 `skills/`、`workflows/`、可能的 `runtime/`、`docs/`（治理文档）与 `CONSTITUTION.md` 边界内。

## 范围与非目标

### 目标

把 R-001..R-024 收敛成一组可实现的技能/流程改动，并在实现后保持或提升现有执行质量（R-021）。

### 范围

- workflowhub 仓库内的技能文件、阶段步骤、必要的治理文档同步。
- 允许删改现有技能，但每项退役须保留理由、决定人、来源与去向。
- 允许引入外部开放技能内容，但引入方式由 ADR-001 决定。

### 非目标

- 不改动历史任务材料、旧审查原件与 `specs/archive/**`。
- 不新建 stage、gate、第二套进度权威（宪法硬约束）。
- 不为了堆技能数量而引入无真实消费者的技能。
- 不自动执行不可逆 Git 动作；PR/推送/合并按现有 authorize 通道取得真实授权。

### Supersedes

无：本任务尚无被替代的已确认决定。

完成判据：目标可观察，范围具体，非目标有理由与去向；被替代主张逐条可定位，历史事实保留。

## 验收面

本节是 make-decision 到 build-plan 的交接索引；完整判据的唯一权威在 spec 的 `## Appendix A`，两处 AC 编号同号。每条 AC 都写成**可执行、可证伪**的形式；"证据"列在未执行前如实写 unavailable。

| AC 编号 | 可观察用例 | 成功条件 | 失败条件 | 证据 | 承接负责人 | 对应 UC |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 | 用户可以在一个真实任务的收尾处拿到一份 PR 描述并据此建成 PR | 收尾产物含 PR 标题、描述（摘要/证据前后对比/风险两字段）、以及实际创建的 PR 链接或真实失败原因 | 只产出 commit 而无 PR 描述；或声称建了 PR 但无链接、无 `gh` 实际输出 | 实际 `gh` 命令输出与 PR URL；失败时保留原始错误 | build-code 实施，verify-code 独立核对 | UC-001 无法建 PR |
| AC-002 | PR 能力落地，且收口流程的动作集与顺序被真实修改并验证 | `core/task-close.mjs` 能真实推送任务分支；`pr` 动作在授权面与 `CLOSE_ACTIONS` 中**且发生在 merge 之前**；未授权时拒绝执行；**≥5 处代码与 ≥3 处冻结测试同批更新**；真实跑通一次 `gh pr create`（或保留真实失败原因） | 只改白名单而未动收口顺序；任务分支从未被推送；`tests/close/**` 未跑就声称通过 | ≥5 处代码 diff + `npm run test:close` 实际退出码 + `gh pr create` 真实输出或错误 | build-code | UC-001 |
| AC-003 | 一个真实 stage 出问题后，复盘产出候选清单并优先转成确定性检查 | 复盘产出候选 + 每条候选标注归口（检查/文档/无操作）；机械性违规有对应的可执行检查；`Improvements.md` 只含未解决项；每条新检查**能在真实历史错误上失败** | 把机械性规则只写进文档、无可执行检查；新检查在真实历史错误上仍通过；或 `Improvements.md` 含已解决项 | 检查脚本的实际运行输出（含"对历史错误真的变红"）+ `Improvements.md` 内容 | build-code | UC-002 经验不留存 |
| AC-004 | build-code 每个 Phase 有一条**同源补充轴**与 OCR 并列 | 每 Phase 留下 OCR 与补充轴两份事实；补充轴按 `same_source_degraded` 记账、**不声称异源**、不计入异源 quorum；两轴并排不合并不排名；补充轴不自己写文件 | 补充轴被声称为"独立/异源"审查；两轴被合并或排名；新增了文件镜像或新事实种类 | 两份审查原件路径 + `review_origin` 实际取值 + 回退路径真实执行输出 | build-code | UC-003 |
| AC-005 | verify-code 内的架构评估每任务最多一次，**且不声称可机器拦截** | 技能正文写明上限；材料里可读到"已评估"事实；第二次触发时引用已有报告而不重跑 | 同一任务内重跑两次且无新依据；或声称有机器拦截但无对应字段 | 技能正文 + 材料内的实际记录 | build-code | UC-004 |
| AC-006 | 三份清单收敛为一个真相，且不一致会被发现 | 唯一真相 = 各阶段 `skill-deps.yaml` + `skills/wh-review/` 两份清单；`repo-skills.manifest.json` 的 44 条 `owner_stage`/provenance **已先迁到真实被读处**、`move-map.json` 的 38 条登记**已清**、一致性检查确认 **0 悬空**后才删除文件；新增检查在**故意制造不一致时真的报失败** | 直接删文件而未迁数据；删后 move-map 留悬空登记；检查在制造不一致时仍报通过 | 迁移前后扫描（命令+计数+命中清单）+ move-map 悬空检查输出 + 检查脚本 RED/GREEN 双态 | build-code | UC-005 |
| AC-007 | `build-spec` 死阶段名**分两批**清除且历史读取结果不变 | 第一批清 catalog/manifest/文档；第二批处理 3 个 runtime 模块与 3 个 schema，且必须有一条**回归夹具证明历史 `upstream_omission:build-spec` 的归因结果不变**（不得从 `attributed` 静默变成 `unknown`）；`RETIRED_STAGES` 常量承担 `ocr-delegation-route.test.mjs:230` 的退役身份哨兵 | 一次全删导致历史归因静默变化；删掉哨兵使"退役身份被拒"不再被验证；无扫描证据 | 3 个 runtime 模块的实际 diff + 归因回归夹具输出 + 哨兵测试退出码 | build-code | UC-005 |
| AC-008 | 上游基线可核对，**全仓无残留旧 commit** | 全仓 `grep -rn 66898f6` 为 **0**，或残留项显式列在历史区；`skills/grill-with-docs/SKILL.md:217` 那段"因此不升级"的结论已重写；每个引用上游的技能正文写明来源技能、固定 commit、本地偏离 | 只在 catalog/notices/reuse-registry 三处改新值而留下其它 5 处旧值；或留下自相矛盾的"不升级"结论 | 全仓 grep 结果 + 各技能正文的来源标注节 | build-code | UC-006 |
| AC-009 | 领域知识格式统一：本仓改名 + 目标项目侧唯一载体 | 改名只落在**当前有效面**（实测 44 处 / 16 个文件；`specs/`、`.planning/` 历史不改）；`tools/cli/verify-structure.mjs:94` 同批改（**漏改会 FAIL 而非静默**）；静默坏点逐一处理：`workflows/build-code/case-selection.mjs:29` 的文件名清单、5 个技能/治理正文、`move-map.json:1675/3097/3895` 的 `named_data_readers`、`docs/archive/repository-inventory.tsv`；格式按 D-020 合并；目标项目侧有**唯一、可创建**的领域知识文件约定；不存在第二套术语真相 | 漏改静默坏点（选材不再覆盖术语表且零报错）；出现两份术语文件；目标项目侧无载体 | 16 个文件的实际 diff + `node tools/cli/verify-structure.mjs` 退出码 + 静默坏点逐项核对 + 目标项目约定文件 | build-code | UC-006 |
| AC-010 | 薄技能合并后职责与调用点都真实跟随 | `spec-tasks` 已并入 `spec-plan`、`spec-research` 已并入 `deep-research`；原调用点全部改接；无悬空引用 | 只删文件未改调用点；或留下悬空引用 | 引用扫描（改前/改后计数）+ 受影响测试退出码 | build-code | UC-005 |
| AC-011 | 被误删的接线恢复，且不再有"登记存在但零消费者"的当前有效技能 | `anysearch` 在 make-decision 真实接线且 `deep-research` 能真实调用（其工具路由表本已写 `外部发现 → anysearch`）；`architect-code-review` 按 D-025 接回；`diagnosing-bugs` 接上 build-code；`debate` 已删并留理由与消费者扫描证据 | 恢复后仍零消费者（只加一行声明而无触发）；或删除无扫描证据；或出现新的死技能 | 每个技能的引用计数证据（改前/改后）+ 相关测试退出码 + 至少一次真实触发记录 | build-code | UC-005 |
| AC-012 | 已有执行质量不下降，且**既有红灯被如实记录** | 结构检查通过；受影响的 `tests/contract/**` **加 `tests/close/**` 与 `tests/integration/**`** 子集实际执行并列出具体文件清单与退出码；**执行前先采集既有红灯基线**（`tests/contract/runtime-facade.test.mjs` 当前即 2 failed / 6 passed），既有红灯与本次引入的失败分开报告 | 出现失败未记录；把既有红灯算成本次引入；或未跑就声称通过 | 实际命令+退出码+输出原件 + 红灯基线 | build-code 实施，verify-code 独立核对 | R-021 |
| AC-013 | ticket 拆解方法真的装进了现有 Phase 形态 | Phase 内的 Task 卡含纵向切片、显式阻塞边、prefactor 优先与 expand–contract 处置；文件形态仍是 `phases/P<n>.md`；TDD 设计段的接缝纪律可观察 | 只改了措辞而无上述可观察字段；或改了文件形态 | Phase 模板与一个真实 Phase 文件的实际内容 | build-code | UC-007 |
| AC-014 | 修宪改动独立、可见、可单独回退 | `CONSTITUTION.md:172` 与连带 6 处治理文本同批更新；改动理由引用用户真实答复；与技能改动**分开**验收；未落地前的不一致窗口如实记录 | 由实施者静默改宪；或只改技能文字而宪法与治理文本仍写旧回退链 | 7 处文件的实际 diff + 用户答复原件引用 + 一致性核对输出 | build-code | R-021 |
| AC-015 | **技能质量核心被真实吸收**（用户第二轮批评的核心） | 新增本仓"技能写作规范"层（判据来源＝上游 `writing-for-agents`，清单见 `WR-001`）；对选定技能逐份产出**逐段对照表**（原文段落 / 改写 / 处理 / 依据判据 / 是否可能改变行为），**静默丢失语义 = 失败**；否定式表达逐条过"能否改成正面目标"；能塌缩的重复描述改为单一引领词；**逐句过 no-op 测试，未通过者删整句而非修词**；**每条字面锚点（`tests/acceptance/card-03-current.mjs` 的 21 条中命中本文件的）逐字保留** | **以"行数下降"作为通过依据**（已实测可被合法刷高：3 份改写全过 −40% 线，但 2 份字符几乎不变、其中 1 份均句长反而恶化 51.7%）；有语义丢失未披露；只删不补 | `npm run check` 全绿 + 受影响 contract 测试实际退出码 + **真跑一遍被改技能**（行为等价性） + 对照表 + `WR-001` 的 Q-01..Q-12 逐条核对 + **字符预算与平均句长预算（行数只作观察值）** | build-code 实施，verify-code 独立核对 | UC-008 技能臃肿 |
| AC-016 | **登记表宣称"已吸收"但实际缺失的三条被补回** | ① `skills/review/SKILL.md` 补双轴结构 + Fowler 12 条坏味道基线（当前仅 31 行、零命中）；② `blocked_by`/tracer bullet 规则补进 `spec-plan`（当前全仓现行面零命中）；③ User Stories 纪律补进 `spec-prd`（当前现行面零命中）。三条均有改前/改后 grep 证据 | 只在登记表里改措辞而无实际落地；或补了但没有真实消费者 | grep 改前/改后计数 + 相关 contract 测试退出码 | build-code | UC-005 |
| AC-017 | **上游基线升级与"版本 vs 最新"账目被如实处理** | 固定 commit 升到 `b0618bc`；**三名被点名技能（`pr`/`retro`/`implement-spec`）在旧固定版本不存在的实测事实被记录**（用户所贴链接指向 `main`）；升基线后全仓 `grep -rn 66898f6` 为 0 或显式列在历史区；`skills/grill-with-docs/SKILL.md:217` 那段"因此不升级"的结论已重写 | 只改版本号而无"版本 vs 最新"的事实说明；或留下自相矛盾的旧结论 | 两个 commit 的目录对比证据 + 全仓 grep 结果 + 各技能正文来源标注节 | build-code | UC-006 |
| AC-018 | **A/B 夹具可靠性先被证明，再用于判质量** | P1 用最便宜的技能（`diagnosing-bugs`）做试跑，必须拿到三项证据：① 改前/改后两份输出**确实不同**（若几乎相同 ⇒ 夹具测不出差别，整套 A/B 设计须重做）；② **噪声基线**（同一版本连跑两次的波动幅度）；③ 客观量（工件齐全度、硬约束违反数、输出 token、耗时、人重问次数）能稳定采集。三项都通过才进 P2 | 未做噪声基线就下"改写有效/无效"结论；或夹具测不出差别仍继续跑完 6 个 Phase | 试跑的两份输出 + 同版连跑的两次输出 + 三项客观量的采集记录 | build-code（P1） | R-021 + D-037 |

## 用户用例索引（UC-001..UC-008）

用途：`## 验收面` 的「对应 UC」列引用这些编号；每条 UC 是用户在真实使用中会遇到的**具体场景**，并注明对应原始需求。
本表只做索引，不新增对象、不设通过条件。

| UC | 用户场景 | 对应需求 | 主要承接 AC |
| --- | --- | --- | --- |
| UC-001 | 我用 workflowhub 跑完一个任务，**从来只拿到 commit、没用过 PR**，想让流程帮我产 PR 与 PR 描述 | R-003 | AC-001, AC-002 |
| UC-002 | 某个 stage 执行出了问题，我希望能**沉淀经验**而不是每次重踩 | R-015..R-018 | AC-003 |
| UC-003 | 我要求 OCR 之外**再加一道子代理代码审查**，并希望它如实标注自己是不是异源 | R-012 | AC-004 |
| UC-004 | 我想在 verify-code 用架构评估**优化实现**，但不要变成一轮一轮的无限循环 | R-014 | AC-005 |
| UC-005 | 我怀疑 **workflowhub 的技能和步骤太多**、登记与实际不一致、有技能没人用 | R-024 | AC-006, AC-007, AC-010, AC-011, AC-016 |
| UC-006 | 我**不知道某个技能参考了谁**，上游更新时没法同步；领域知识格式在不同项目里还不一样 | R-023, R-004 | AC-008, AC-009, AC-017 |
| UC-007 | 我希望任务拆解像 ticket 那样（纵向切片、阻塞边），但**不想改掉现有 phase 文件形态** | R-007, R-008 | AC-013 |
| UC-008 | 我觉得现有技能**又长又啰嗦**，比 Matt 的技能质量差很多，要求真的把质量核心吸收进来 | R-001, R-031 | AC-015, AC-018 |

## 用户对本次展示材料的最终确认（approve-decision 凭据）

**展示对象**：本决策日志的全部内容（31 条需求闭环、18 条 AC、8 条 UC、12 条 ADR、29 条 OI、65+ 条决策、相序 R → A1 → A2′ → A3 → B1..B4 → B6，以及三条不许粉饰的限制）。

**用户过程要求**（逐字）："请你先检查所有原始需求，是否都记录覆盖了，如果没问题就同意收口make-decision了，不要急着进入build-plan"

**覆盖核查结果**（已执行，见 `## 需求闭环表` 与上文）：31/31 有落点、无遗漏、无孤儿；核查中发现的两处缺口已补（R-031 的"建议非预设"、R-024 的范围扩为含目标项目）。

**用户最终确认**（逐字选项）：「**同意收口 make-decision，先 commit 保存（推荐）**」

**确认覆盖的范围**：结束 make-decision 阶段；把当前材料 commit 到任务分支保存。
**确认不覆盖**：进入 build-plan（用户明说"不要急着进入"）、push、merge、archive、cleanup、建 PR —— 这些需要新的真实授权。

**证据原件**：任务库根 `quality/evidence/human-confirmations/2026-10-08-001-make-decision-close-commit.txt`（sha256 `5dff70e2349b797a3fb78123438a176269a081703d2997fa79883163e7c3ed05`）；授权记录任务库根 `quality/evidence/git-authorizations/2026-10-08-001-authorize-commit.json` 与已消费的 `2026-10-08-002-consumed-commit.json`。

### U-005 — 收口后二次补正（交接更正件 + 五条 POST 发现）

- 原文锚点：无新用户消息；来源为 `stage-handoff` 子代理与交接更正件子代理**如实报出的不一致**，以及本会话自查。
- 变更与处置（五条，全部已修，均在 `facts.jsonl` 记为 POST-1..POST-5）：
  1. POST-1 两份审查报告缺唯一原件 → 已落盘 `quality/evidence/reviews/`（对抗性方向检查 sha256 `7ff88ae5…`、细节一致性审查 `ec72ada8…`）。
  2. POST-2 写件前检查无独立原件 → 已落盘 `quality/tests/2026-10-08-001-make-decision-close-prewrite-check.json`（sha256 `6455eb78…`）。
  3. POST-3 子代理派发清单缺锚点且**自报 total=12 与 dispatches 13 条自相矛盾** → 已在原位更正为 **13**（更正后 sha256 `a194cf47…`），并在 `honest_limits` 保留该自相矛盾事实。
  4. POST-4 **我误将"797 行"记为原交接的错误** → 实测原交接写的是 812 行（其写件时点真实读数），797 出自我自己的日志；已由独立复核澄清并在本文件更正。
  5. POST-5 "3 次独立审查"未写口径 → 已澄清为方向盲审 / 对抗性方向检查 / 细节一致性审查三者，分组口径不同而**数量一致**。
- **交接**：原交接为不可变原件（`quality/evidence/handoff/2026-10-08-001-make-decision-handoff.md`，sha256 `985cddc4…`，26641 字节），**一字未改**；更正件为新写的第二份：`quality/evidence/handoff/2026-10-08-002-make-decision-handoff-correction.md`（sha256 `be73d368dcf9dd980a378652d75109e70102a47b205a8e8e82aaee9e970c0aef`，10975 字节）。

### U-004 — 收口后自查补正三处（原件与数字）

- 原文锚点：无新用户消息；来源为 `stage-handoff` 子代理在交接时如实报出的 6 处不一致，以及本会话的自查。
- 变更与处置：
  1. **补上两份审查的唯一原件**：`quality/evidence/reviews/2026-10-08-001-adversarial-direction-check.md`（对抗性方向检查，sha256 `7ff88ae5ea3690cbcdf0b634294509eae572874e91e30fcf44e33bd5d289008b`）与 `quality/evidence/reviews/2026-10-08-002-detail-consistency-review.md`（细节一致性审查，sha256 `ec72ada8e58fbe99fb3a7ba5ad7abf5f345c3472bdde1d34e7f726b1073346e9`）。**此前 `facts.jsonl` 与本文的处置表引用了这两份报告，但它们当时没有原件** —— 即"引用了不存在的原件"，现补正。
  2. **补上写件前检查的唯一原件**：`quality/tests/2026-10-08-001-make-decision-close-prewrite-check.json`（含 HEAD、worktree 干净度、决策日志 sha256、四项检查的实际退出码）。此前交接正文如实记为 unavailable。
  3. **补上子代理派发清单**：`quality/evidence/2026-10-08-001-make-decision-subagent-dispatch.json`。
- **数字更正**：此前的材料写"12 个子代理"。实际派发 **13 次**（5 个首轮调研 + 2 个独立审查 + 3 个第二轮补缺口 + 1 个细节审查 + 1 个交接撰写；另有 1 条为批次记法遗留不构成独立派发）。以子代理清单为准。
- **数字更正（含一处自我纠正）**：决策日志行数随提交变化，**逐 commit 实测**：`4219ed7d`=783 → `5de5a7d8`=797 → `50baf515`=813 → `cf047cd6`=812 → `16414dfb`=823（当前）。**注意**：我起初把"797 行"记为"原交接写错"，实测**原交接第 8 节写的是 812 行 / 111120 字节（其写件时点的真实读数）**，真正写 797 的是**本文件自己**在修正之前的读数。该主张系我的误读，已在 `quality/evidence/handoff/2026-10-08-002-make-decision-handoff-correction.md` 中由独立复核澄清。
- **数字更正（提交数）**：make-decision 在本分支实际有 **5 笔提交**（`4219ed7d` → `5de5a7d8` → `50baf515` → `cf047cd6` → `16414dfb`，当前 HEAD = `16414dfbe7747fb8cb53bf108855f9df7c045c53`）。此前写的"4 笔 / 当前 HEAD=cf047cd6"已过期。
- **口径澄清（独立审查计数）**：本阶段共 **3 个独立上下文审查**——方向盲审（`ad02a925`，questions-only 投影）、对抗性方向检查（`5a801c7c`）、细节一致性审查（`61741b31`）。此前的分组写法"2 独立审查 + 1 细节审查"与"3 次独立审查"只是分组口径不同，**数量一致**；此前因未写口径而使方向盲审看起来不落在任何一类。
- **目录创建说明**：`quality/evidence/handoff/`、`quality/evidence/reviews/` 为写入前不存在、由本次创建的真实目录；`appendRecord` 要求父目录真实存在且不自建。

## 未决项

| OI 编号 | 问题与来源 | 状态与处置 | 解决者与下一步 |
| --- | --- | --- | --- |
| OI-001 | ~~R-008 要求"不再创建 phase 文件，改成 ticket 文件"，与现行材料形态冲突~~ | **已关闭（用户 2026-10-08 第二轮选择 A）**：保留 `phases/P<n>.md` 文件名与形态，把 ticket 的拆解方法（纵向切片、显式阻塞边、tracer bullet、prefactor 优先、expand–contract）装进现有 Phase 内的 Task 卡。不新增第二套进度权威。 | 关闭；落地见工作包 ③ |
| OI-002 | ~~PR 能力在仓库中不存在~~ | **已关闭（用户选择 B：真的执行建 PR）**。硬前提核查通过：`gh` 2.96.0 已装、已登录 `Hugh4424`、token 含 `repo` scope、远端 `github.com/Hugh4424/workflowhub.git`。**代价定位**：需扩展两处白名单 —— `tools/cli/stage-runtime.mjs:1002` 与 `:1151` 的授权动作集合（现为 `commit/push/merge/archive/cleanup`），以及 `runtime/task/task-store.mjs:13` 的 `CLOSE_ACTIONS`（现为 `delivery_committed/archive/merge/push/worktree_cleanup`）。 | 关闭；落地见工作包 ④ 与工作包 ① |
| OI-003 | `Improvements.md` 与 `skills/stage-reflection` 的关系 | **已关闭（用户选择 A）**：合并成一条链 —— 复盘产出候选 → 用户挑 → **优先转成确定性检查** → 文档只留未解决项。不新建第二套账本。 | 关闭；落地见工作包 ⑥ |
| OI-004 | ~~新增子代理代码审查涉及审查点数量与证据唯一性~~ | **已关闭（用户选择 A）**：新增为 build-code **每个 Phase** 的第二个独立审查轴，与 OCR 并列；两轴结果并排、不合并不排名；该审查不自己写文件，结论引用已有证据原件。 | 关闭；落地见工作包 ④ |
| OI-005 | ~~verify-code 里用 improve-codebase-architecture 评估并优化实现~~ | **已关闭（用户答复：B，但只允许跑一次，不要变成无限循环）**：verify-code 内可评估并优化，但**每个任务最多一次**；重复跑必须引用已存在的评估报告，不再重跑。 | 关闭；落地见工作包 ⑤ |
| OI-006 | 本任务最终交付形态 | **已关闭（用户选择 B）**：真的改仓库，按阶段分批；不跳阶段。 | 关闭 |
| OI-007 | R-021"保证已有执行质量"缺少可观察判据 | open；候选 oracle：`npm run check` 类型结构检查、`tests/contract/**` 受影响子集、`tools/cli/verify-structure.mjs`、以及本次要新增的"登记一致性检查" | build-plan 前必须给出具体命令清单并与用户确认 |
| OI-008 | R-023 的"技能内部标明参考来源"缺少统一写法 | **已关闭（用户选择 A 形态）**：新写法 = 每个技能正文写「参考了谁 + 固定 commit + 本地偏离 + 与本地上游文件的差异」；三份清单收敛见 ADR-011。 | 关闭；落地见工作包 ⑥ |
| OI-009 | `build-spec` 死阶段名残留 | **已关闭（用户选择 B：连 schema 一起清）**：`catalog.yaml` 12 处、`repo-skills.manifest.json` 5 处、runtime schema 4 处（`risk-acceptance.v1.json:33`、`human-confirmation.v1.schema.json:8`、`attempt.schema.json:23`、`review-packet-identity.mjs:9`）全部处理。**删除前必须单独扫描旧任务/旧工件是否真实出现过 `build-spec` 值**，并给出具名 consumer 扫描证据（ADR-0030 纪律）。 | 关闭方向；执行前补扫描证据 |
| OI-010 | `CONTEXT.md` → `GLOSSARY.md` 改名的**仓库内**范围 | **已关闭（用户选择 B）**：连 6 份 ADR 一起改。实测 51 处引用、约 20 个文件。用户批准此为「历史原件不重写」纪律的**具名例外**，须在决策日志与交付说明如实标注，不得隐去。 | 关闭；执行见工作包 ① |
| OI-011 | 三份清单收敛后 `repo-skills.manifest.json` 的删除条件 | **已实测关闭**：`tools/cli/repo-skills-manifest.mjs`（生成器）、`tests/skill-provenance-strict.test.mjs`、`tests/contract/repo-skills-manifest.test.mjs` **三者全部不存在**；`runtime/`、`core/`、`scripts/`、`tools/` 下**零生产消费者**；全仓 108 处命中里唯一的"消费者"是 `docs/architecture/move-map.json` 自己的 38 条**自指登记行**。结论：它是彻底孤儿（生成器/测试/消费者三样全无），可删；删除时须同批清掉 move-map 的对应登记。**注意**：本条推翻了我在调研中的一次初步推断（我曾担心它有 Runner 发布清单消费者），实测不成立，以本行为准。 | 关闭；执行见 ADR-011 |
| OI-012 | `anysearch` 为什么没接上 | **已关闭（D-016）**：根因是 `c8596006` 删除依赖声明。**且 `deep-research` 的「工具路由」表本来就写 `外部发现 → anysearch`**，所以是技能调用了一个未接线技能。处置＝恢复接线，不需融合。 | 关闭 |
| OI-013 | `architect-code-review` 为什么没接上 | **已关闭（D-015）**：根因是 `77de3608` 移除了 verify-code 的依赖声明；其正文自述的 `AC-REVIEW-011` 在当前仓库已不存在（悬空引用，须处理）；且"OCR 缺失回退 wh-review"是错配，改为回退本技能。 | 关闭 |
| OI-014 | 上游基线固定值 | **已确认事实**：上游当前 HEAD `b0618bc436ad893b3c5e84e55fba86586d34a404`（2026-10-08），技能总数 38；workflowhub 现固定 `66898f6`。用户选 C：升到新版并跟随术语改名。 | 待执行；与 OI-010 同一批 |
| OI-015 | D-017 的落地形态：**跨项目**统一领域知识格式需要什么载体 | open；待查清：`skills/ui-project-init`、`skills/domain-modeling` 是否承担"在目标项目里建领域知识文件"的职责；仓库级契约（`contracts/`）是否是合适载体；是否需要新增一个能被所有目标项目消费的约定文件。**不得新增第二套术语真相**，须明确唯一 owner 与删除条件。 | build-plan 前必须给出载体结论 |
| OI-016 | D-018 的 ADR 改名与仓库纪律冲突需显式披露 | open；形式待定（决策日志、交付说明、或两处都要）。要求：不得让读者以为 ADR 原文从未改动。 | build-plan 收敛 |
| OI-017 | **口径校正（独立方向审查发现，已实测复核）** | 已关闭：① 磁盘技能数由 40 更正为 **39**（我曾把 5 个 `workflows/*/SKILL.md` 混算）；② `CONTEXT.md` 改名影响面分三档实测 —— **全仓 842 处 / 195 个文件**（含 `specs/`、`.planning/`）、**排除 `specs/` 与 `.planning/` 后 44 处 / 16 个文件**、其中 `docs/adr/` 6 份。我先前写的"51 处 / 约 20 个文件"是 active 面的近似且未标口径，**作废，以上表实测为准**。凡以 39/44/66/53 为基线的 AC 判据，必须先对齐口径。 | 关闭；AC-006/AC-009 按新口径 |
| OI-018 | **本次任务自身的交付形态（独立方向审查发现的自举递归）** | **待用户决定**：本任务收尾时走 PR 还是 commit？扩白名单（把 PR 加进授权动作集合与 `CLOSE_ACTIONS`）这个动作**本身只能先走现有 commit 路径**，存在先后依赖。这条决定本任务自身的验收面与顺序。 | 用户答复；影响 build-plan 的依赖图 |
| OI-019 | **阶段顺序：登记面对账是否先行** | **待用户决定**：独立方向审查建议"A 先只做登记面对账（不碰技能内容）→ 拿到真实数字 → 再改内容"，理由是当前 39/44/66 + `build-spec` 仍在 3 个生产文件 + 零一致性测试，在漂移地基上叠新东西会让对账更难。另一选择是按已定方向一次做完（更符合用户 R-021 与"分批但连续"的期望）。 | 用户答复；影响 build-plan 的 Phase 顺序 |
| OI-020 | **命名格式的结构差异（不是纯改名）** | 已实测并**升级口径**：① 上游 `b0618bc` 的 `GLOSSARY-FORMAT.md` 位于 `skills/engineering/domain-modeling/`（60 行），**上游 `grill-with-docs/GLOSSARY-FORMAT.md` 与 `.../grill-with-docs/CONTEXT-FORMAT.md` 均 HTTP 404**；② 上游 `grill-with-docs/SKILL.md` 只剩 **7 行 shim**（"Call the Skill tool twice, for \"grilling\" and \"domain-modeling\""），全文零 CONTEXT/GLOSSARY 引用，而本地该文件是 **222 行三技能融合体**；③ 本地格式 `## Rules` 7 条 vs 上游 4 条（上游删掉了 `Flag conflicts explicitly.` 与 `Write an example dialogue.`），多上下文载体从 `CONTEXT-MAP.md`/`# Context Map` 改为 `GLOSSARY-MAP.md`/`# Glossary Map`，定义长度从「One sentence max」改为「One or two sentences max」。⇒ **改名在上游是语义重写，且换了所属技能**。用户选择 A（本地为主 + 补上游 `## Rules` 与 `## Single vs multi-context repos` 两节），已记入 D-020。 | 关闭；AC-009 按此口径 |
| OI-021 | **D-005 需要修宪，此前无人登记** | **已确认冲突**：`CONSTITUTION.md:172` 字面写「代码由 OCR，**只有 OCR 未安装才回退 wh-review**」，而 D-005 要求回退目标改为 `architect-code-review`。连带需同步 **7 处**：`CONSTITUTION.md:172`、`CONTEXT.md:22`、`README.md:27`、`docs/standard-workflow.md:15`、`AGENTS.md`、`workflows/build-code/SKILL.md:44`、`workflows/verify-code/SKILL.md:34`。**这不是技能层改动，是宪法文本改动**，须单独走一次真实人确认（见 OI-022）。 | 用户决定；**不得由实施者静默改宪** |
| OI-022 | **同宿主子代理不构成异源审查** | **已确认硬约束**：`runtime/review/canonical-review-result.mjs:302-308` 要求 `minimum_heterologous >= 1`、`requireIdentity: true`、`requireSourceId: true`；同宿主子代理没有独立 `source_id`/`config_id`，唯一能落的 `review_origin` 是 `runtime/task/task-store.mjs:12` 的 **`same_source_degraded`（字面即"同源降级"）**。反向证据：OCR 路线**明文禁止**子代理（`runtime/review/ocr-delegation-adapter.mjs:14/:193/:284` "prompt must prohibit Agent/subagent tools"、`:688`、`tools/cli/stage-runtime.mjs:345`）。⇒ 把同宿主子代理称为"**独立**审查轴"会触碰宪法 F4「禁止自审自判」，且若强行发布要么伪造 provider 身份、要么新增事实种类＝新控制面（触 F5/F8）。 | 用户决定命名与记账口径；见 OI-023 |
| OI-023 | **PR 的真实代价：不是"扩两处白名单"，是收口流程重构** | **已确认**：① `core/task-close.mjs:384` 只 `git push <remote> <target_branch>:<target_branch>`（**只推 main**），`:401` 是 `git push --delete <task_branch>`（**删远端任务分支**）——全仓**没有任何推送任务分支的代码**，而 `gh pr create` 需要 head 分支在远端且 ahead of base；② `core/task-close.mjs:166` 的 steps 把 **`merge` 排在 `push` 之前**，而 PR 必须在 merge **之前**；③ 需改动的是 **≥5 处代码**：`tools/cli/stage-runtime.mjs:1003`、`runtime/interface/git-authorize.mjs:423`、`runtime/task/task-store.mjs:13`、`core/task-close.mjs:13`、`runtime/stage/current-close-projection.mjs:24`；④ **≥3 处冻结测试**：`tests/close/close-contract.test.mjs:34`（标题即「preserves **exactly five actions**」，断言 `toEqual(["commit","merge","archive","push","cleanup"])`）、`tests/contract/four-domain-close-status.test.mjs:10`、`tests/contract/current-close-projection-readback.test.mjs:4`；⑤ `core/task-close.mjs:166` 用 `same(plan.steps, expected)` 做硬不变量断言，不符即抛 `CLOSE_PLAN_ACTIONS`；⑥ **验收口径漏洞**：`npm run check` 只跑 markdownlint + `verify-structure.mjs` + `run-checks.mjs`，**不跑 vitest**，`tests/close/**` 需 `npm run test:close`——原 AC 写的"tests/contract 子集"会**漏掉自己打破的测试**。 | 已并入 AC-002/AC-012 与 ADR-007；实施前须真实跑通一次 `gh pr create` |
| OI-024 | **删除 `repo-skills.manifest.json` 会丢独有数据** | **已确认**：它确实**零代码消费者**（`grep` 八个目录 0 命中），但 `skills/catalog.yaml` 的 `owner_stage` 与 `origin_path` **各 0 个**，而 manifest 各 **44 个**——它不是 catalog 镜像，**独家承载"技能归属哪个 stage"与上游 provenance**；另 `docs/architecture/move-map.json` 有 **38 条**登记指向它，而 `tests/contract/reference-audit.test.mjs:6` **只校验 `destination` 唯一与字段非空，不校验 `named_data_readers` 指向真实文件** ⇒ 删文件会**静默留下 38 条悬空登记并丢掉 44 条归属/provenance**。 | 用户决定「先迁数据再删」或「降级只读观察一个周期」；见 OI-025 |
| OI-025 | **`build-spec` 引用数与影响面被系统性低估** | **已确认**：不是 12/5/4 —— 实测 `skills/catalog.yaml` **23 处**、`repo-skills.manifest.json` **18 行 / 20 次**、runtime schema **3 处**；**另有 3 个未列出的 runtime 模块**：`runtime/evidence/workflow-evolution.mjs:6` 与 `:59`、`runtime/evidence/research-report.mjs:6`、`runtime/review/review-packet-identity.mjs:9`。历史值**大量存在**：`grep '"build-spec"' specs/` → **104 个文件**（含 39 处 stage 值）；外置任务库 → **8090 个文件**，含 **17 个 `facts.jsonl`** 与 **1 个 `task.json` 的 `current_stage`**。**语义后果**：`workflow-evolution.mjs:6` 的 `STAGES` 是**有序表**，`:59` 用正则解析 `upstream_omission:<stage>`，删掉后历史值从 `{status:"attributed"}` **静默变成** `{status:"unknown", reason:"invalid_attribution"}`——读旧事实的结果变了却不报错。另 `build-spec` 还是**负例 oracle**：`tests/contract/ocr-delegation-route.test.mjs:230` 用它作退役身份哨兵，`:810-811`、`:828-829` 断言必须抛 `/current five-stage/` 与 `/unknown review stage/`。 | 已降级为分两批；见 ADR-011 修订 |
| OI-026 | **`AC-008`（上游基线）检查面过窄** | **已确认**：`66898f6` 出现在 **≥8 个文件** —— `skills/catalog.yaml`（多处）、`THIRD_PARTY_NOTICES.md:8`、`skills/reuse-registry.md:61/82`、`skills/grill-with-docs/skill-bundle.json`（3 处）、`skills/diagnosing-bugs/skill-bundle.json:13`、`skills/grill-with-docs/SKILL.md:209/210/211`，以及 **`:217` 一段明文结论写「bytes 分别完全一致，因此不升级」**。按原 AC「三处一致」验收会**绿着留下 5 处旧值**，且 `SKILL.md:217` 自相矛盾。 | 已改为「全仓 `grep -rn 66898f6` 必须为 0 或显式列在历史区」并须重写 `:217` |
| OI-027 | **既有红灯基线未记录** | **已确认**：`tests/contract/runtime-facade.test.mjs` **现在就是红的**（`npx vitest run` → 2 failed \| 6 passed）。失败① `:58-59` 无守卫读 `workflows/build-spec/SKILL.md` → ENOENT；失败② `:83` runner contract 断言未抛错。⇒ 把 tests/contract 子集当验收基线前，**必须先记录哪些本来就是红的**，否则会误判或掩盖既有红灯。 | 已并入 AC-012；执行前先采集既有红灯基线 |
| OI-028 | **`D-006`（架构评估每任务最多一次）缺承载字段** | **已确认**：`runtime/task/task-store.mjs` 的 facts 无对应字段，AGENTS.md 禁止新增持久对象与第二套进度权威 ⇒ 该规则只能写成**人读纪律**，不得声称可机器核对。 | 已改口径：AC-005 只验"技能正文写明 + 材料里可读"，不验机器拦截 |
| OI-029 | **改名的两处假设被实测推翻** | ① `tests/contract/card06-migration-ledger.test.mjs:161` 虽列了 `'CONTEXT.md'`，但其 `ROWS` 解析自**静态归档附件**（`:13`）⇒ **重命名不会让它变红**，不构成静默坏点。② `docs/adr/0031` 引用 `CONTEXT.md:282-283`、`:285-286`、`:383-384`，而当前 `CONTEXT.md` **只有 27 行** ⇒ **行号锚点本来就是坏的**；重写这 6 份 ADR 会把"改名字"变成"改历史记录"并把错误行号一起搬走。**建议改为：ADR 只在文首加一条改名批注，不动正文与锚点**（与 D-018 的"连 ADR 一起改"相比更小且更安全）。 | **待用户确认是否采纳该更小做法**（OI-030） |

## 已确认决策（本轮用户真实答复）

| 决策号 | 内容 | 用户答复 | 来源 |
| --- | --- | --- | --- |
| D-001 | 交付形态 = 真的改仓库，按阶段分批，不跳阶段 | B | 第二轮 Talk 答复 |
| D-002 | ticket 只吸收方法，保留 phase 文件形态 | A | 第二轮 Talk 答复 |
| D-003 | PR = 让 workflowhub 真的执行建 PR | B | 第二轮 Talk 答复 |
| D-004 | 复盘链 = 候选 → 用户挑 → 优先转确定性检查 → 文档只留未解决 | A | 第二轮 Talk 答复 |
| D-005 | 子代理双轴代码审查 = build-code 每个 Phase 的第二个独立审查轴 | A | 第三轮 Talk 答复 |
| D-006 | verify-code 内可评估并优化，但每任务最多一次（只跑一次，不成环） | B（自定义） | 第三轮 Talk 答复 |
| D-007 | 死阶段名 build-spec = 连 runtime schema 一起清 | B | 第三轮 Talk 答复 |
| D-008 | 上游基线 = 升到新版（`b0618bc`）并跟随把 `CONTEXT.md` 改名 `GLOSSARY.md` | C | 第三轮 Talk 答复 |
| D-009 | 三份清单 = 以实际接线为唯一真相，删掉 `repo-skills.manifest.json` | A | 第四轮 Talk 答复 |
| D-010 | `debate` 可直接删 | 自定义答复 | 第四轮 Talk 答复 |
| D-011 | `architect-code-review` 需检查并与 Matt 的 `code-review` 融合后放回 verify-code | 自定义答复 | 第四轮 Talk 答复 |
| D-012 | `anysearch` 应服务 make-decision 外部调研，需查清为何没接上 | 自定义答复 | 第四轮 Talk 答复 |
| D-013 | 薄技能合并 = `spec-tasks` 并入 `spec-plan`、`spec-research` 并入 `deep-research` | A | 第四轮 Talk 答复 |
| D-014 | 架构评估一次性 = 写成硬规则 + 材料里可查 | A | 第四轮 Talk 答复 |
| D-015 | 两个代码审查通道并列：OCR + 融合 Matt 双轴的 `architect-code-review` 每个 Phase 各一次，两轴发现并排不合并不排名；**OCR 不可用时回退给 `architect-code-review`，不再回退 `wh-review`**（修掉现有错配） | A | 第五轮 Talk 答复 |
| D-016 | `anysearch` 融入 `deep-research`。**实测结论：不需要融合，只需接回断线** —— `skills/deep-research/SKILL.md` 的「工具路由」表本来就写着 `外部发现 → anysearch`、`外部原文 → web_fetch`，是 `c8596006` 把依赖声明删了，导致技能调用一个未接线的技能。处置：恢复 `workflows/make-decision/skill-deps.yaml` 的 `anysearch` 条目，并在 `deep-research` 正文明确它消费 `anysearch`（外置能力）与 `anysearch`（技能）的分工，消除同名两义。 | A（自定义：融入 deep-research） | 第五轮 Talk 答复 |
| D-017 | 领域知识格式统一：**不只改 workflowhub 自己，所有使用 workflowhub 开发的项目都统一用同一套领域知识格式**（`GLOSSARY.md` + 可选 `GLOSSARY-MAP.md` + `docs/adr/`），避免多种格式冲突。范围因此包括仓库级契约与技能对目标项目的写入约定。 | B（自定义，扩大范围） | 第五轮 Talk 答复 |
| D-018 | `CONTEXT.md` → `GLOSSARY.md` 改名**连 docs/adr/ 的 6 份历史决议一起改**（与仓库「历史原件不重写」纪律冲突，属用户明确批准的例外，须在决策日志与交付说明中如实标注） | B（自定义） | 第五轮 Talk 答复 |
| D-019 | 质量验收 oracle = `tools/cli/verify-structure.mjs` 结构检查 + 受影响的 `tests/contract/**` 子集 + 新增的三份清单一致性检查 + 删除项的真实引用扫描证据，每条留实际退出码 | A | 第五轮 Talk 答复 |
| D-020 | 命名格式合并口径 = **本地为主**（保留 `## Relationships` / `## Example dialogue` / `## Flagged ambiguities`）**+ 补上游的 `## Rules` 与 `## Single vs multi-context repos`**，并改名 `GLOSSARY-FORMAT.md` | A（自定义说明） | 第六轮 Talk 答复 |
| D-021 | 本任务自身交付 = **先走 commit 做出 PR 能力，再用它给自己开一次真 PR 做验收**；且 **PR 不是所有任务/项目默认**，须按当前环境与项目是否支持决定，支持才默认开 PR | A（自定义：按环境/项目自适应） | 第六轮 Talk 答复 |
| D-022 | 阶段顺序 = **登记面对账作为第一个 Phase，先做**，拿到真实数字后再改技能内容 | A | 第六轮 Talk 答复 |
| D-023 | 改名范围 = **只改当前有效文件**；`specs/` 与 `.planning/` 的历史记录不改 | A | 第六轮 Talk 答复 |
| D-024 | 验收范围扩容（对抗性审查 D5/B2 结论）：受影响子集必须显式包含 **`tests/close/**` 与 `tests/integration/**`**，并先采集既有红灯基线 | 由审查结论采纳 | 对抗性检查 |
| D-025 | **子代理审查轴如实命名为「同源补充轴」**，按仓库已有 `same_source_degraded` 记账；**不声称异源、不计入异源 quorum**；真正的异源审查仍然是 OCR。不新建事实种类、不伪造 provider 身份。 | A | 第七轮 Talk 答复 |
| D-026 | **修宪拆成独立、可单独回退的小改动**：`CONSTITUTION.md:172` 与连带 6 处治理文本单独一批，引用用户真实答复作依据，与技能改动分开验收。**不得由实施者静默改宪。** | A | 第七轮 Talk 答复 |
| D-027 | **`repo-skills.manifest.json` 先迁数据再删**：44 条 `owner_stage` 与上游 provenance 先迁到真实被读处（各阶段 `skill-deps.yaml` 或 `catalog.yaml`），同步清掉 `move-map.json` 的 38 条登记，一致性检查确认 0 悬空后才删文件。 | A | 第七轮 Talk 答复 |
| D-028 | **6 份 ADR 只在文首加一条改名批注**（写明"原引用 `CONTEXT.md`，已于某日改名，原行号锚点已失效"），**正文与行号一字不动**。这修正了 D-018 原来的"连正文一起改"。 | A | 第七轮 Talk 答复 |
| D-029 | **`build-spec` 分两批清**：先清 catalog / manifest / 文档；`runtime/evidence/workflow-evolution.mjs`、`runtime/evidence/research-report.mjs`、`runtime/review/review-packet-identity.mjs` 与 3 个 runtime schema 改为「保留旧值 + 注释 + **加一条"历史值归因不变"的回归夹具**」，观察一个任务周期确认无历史事实被改写后再删枚举。同时保留一个显式 `RETIRED_STAGES` 常量承担 `tests/contract/ocr-delegation-route.test.mjs:230` 的退役身份哨兵职责。 | 由审查结论采纳 | 对抗性检查 A2/A3 |

完成判据：未决项在一张表中一条一行，逐项有问题、来源、真实状态、处置或下一步及解决者；零问题写无。

## 风险与延期交接

| 内容 | 触发与后果 | 处理阶段与 owner | 来源 |
| --- | --- | --- | --- |
| 引入外部技能导致技能总数继续膨胀 | 与 R-024"是否太多"相反，技能越多越难维护 | 工作包 ⑦；make-decision 决定引入方式时一并处理 | R-024 |
| 改动治理文档与运行时材料形态 | 若只改技能不改 runtime/治理，会出现文档与 `material-workspace.mjs` 实际行为不一致（假声明） | build-plan 必须要求同步核对；独立审查按 `git diff --name-only` 与声明写集比对 | OI-001 |
| 外部技能内容是外部数据 | 引入时若照抄其宿主假设（如 Claude Code slash command），会造成不可搬运技能 | 工作包 ①；每个引入项必须给出可搬运性结论 | V-001.1 |
| 主会话上下文耗尽 | 本任务调研量大，若主会话自己读会失去执行质量 | 已按 R-028 全部外派；后续阶段继续外派 | R-028 |

### 质量边界

材料、实施、测试、独立审查与物理交付分别报告；未执行保留具体缺口，用户确认引用外置原件。当前尚未确立 `high_risk_user_visible` 事实，实际日志省略该事实行。

完成判据：每项风险或延期列触发、后果、阶段、owner 与来源；质量缺口逐项可见，高风险分类与不可逆授权分别有真实依据。

## 外部调研事实索引

唯一 canonical report：任务库根 `quality/evidence/decision-log-refs/research-report-make-decision.md`（含 20 条候选 C-01..C-18 与 6 条明确拒绝 X-01..X-06）。原始抓取件（外部技能全文、pstack 51 个 SKILL.md、用户逐字原文）同目录保存，逐字引用以原件为准。粗粒度大纲假设态与待推翻清单见同目录 `outline-hypothesis-v1.md`。

| research_id | 主题 | 报告位置 | 取用条件 |
| --- | --- | --- | --- |
| RES-001 | mattpocock/skills `wayfinder`、`pr`、`domain-modeling`、`research` | canonical report §三 | 已回收 |
| RES-002 | mattpocock/skills `to-spec`、`to-tickets`、`codebase-design`、`tdd` | canonical report §一 | 已回收 |
| RES-003 | mattpocock/skills `implement-spec`、`code-review`、`diagnosing-bugs`、`improve-codebase-architecture`、`retro` | canonical report §一 | 已回收 |
| RES-004 | pstack 本体事实与 11 个竞品横向对比 | canonical report §四、§六 | 已回收 |
| RES-005 | workflowhub 现有技能清点、重叠与登记一致性 | canonical report §五 | 已回收 |

## 外置事实索引

- 逐字原文与需求索引明细：任务库根 `quality/evidence/decision-log-refs/raw-user-requirement.md`（V-001）。
- Talk 批次与 grill 记录：任务库根 `quality/evidence/decision-log-refs/`；按 batch_id 与问题编号定位。
- 调研与审查处置：任务库根 `quality/evidence/decision-log-refs/`；引用唯一报告原件，已在其它 quality 目录保存的原件使用原路径。
- 用户确认：任务库根 `quality/evidence/human-confirmations/`；本阶段尚未产生。
- 标杆：仓库根 `specs/archive/workflowhub-acceptance-flow-hardening-20261006/decision-log.md`（历史判据只作背景）。

完成判据：每条指针说明基准目录、原件定位和取用条件；每类事实只留一份原始件，缺失逐项说明。

## 第二轮补充决策（深度 B 分相执行）

| 决策号 | 内容 | 用户答复 | 来源 |
| --- | --- | --- | --- |
| D-030 | **技能质量改造取深度 B（全量吸收质量核心），但拆成 6 个 Phase 串行执行**；顺序：**P1 规范层与 A/B 夹具 → P2 叶子技能 → P3 规划类 → P4 审查类 → P5 阶段编排（workflows/*）→ P6 登记面与源头对齐** | A | 第八轮 Talk 答复 |
| D-031 | **每一相必须带"同一任务修改前后对比"作为质量证据**。判定方式：**量化客观量为主 + 独立盲评子代理为参考**。客观量枚举：① 必须产出的工件是否齐全 ② 硬约束是否被违反 ③ 输出 token 数 ④ 耗时 ⑤ 人重问次数。**盲评只作参考，不得作为验收通过依据**（避免模型自审自判，触宪法 F4） | B | 第八轮 Talk 答复 |
| D-032 | A/B 的输入**用本任务已产生的真实材料**（decision-log、research report、逐字需求、AC 表），不另建测试项目 | A | 第八轮 Talk 答复 |
| D-033 | 自举边界：**本任务自己不走改写后的技能**；改写的技能从下一个任务起生效。本任务的交付质量由现行流程 + 独立审查保证 | 由自举事实推出 | 本阶段 |

## 第三轮补充决策（指标纠正与执行顺序）

| 决策号 | 内容 | 依据 | 来源 |
| --- | --- | --- | --- |
| D-034 | **验收指标纠正：不许用"行数下降"当通过依据。** 真实证据：三份实测改写全部达到行数 −40% 以上，但只有 `spec-plan` 是真压缩（字符 −54.9%、均句长 92.9→45.9）；`diagnosing-bugs`（字符 −0.5%）与 `spec-analyze`（字符 −3.1%，**均句长反而 +51.7%**）只是排版压缩。而 Matt 自己的 `diagnosing-bugs` 是 **138 行**，本仓版只有 **43 行**——按上游标准本仓版原本不臃肿。⇒ 改用 **D1–D10 臃肿判据 + 字符预算 + 平均句长预算**；**行数只作为观察值记录，不作通过依据** | 真实改写对照实测（`spec-plan`/`diagnosing-bugs`/`spec-analyze` 三份，原件见任务库 `quality/evidence/decision-log-refs/*.final.md`） | 第九轮子代理实测 |
| D-035 | **真实臃肿指纹 = 长句 + 导航句 + 复述环境 + 同义重复**，不是行数。实测：`spec-plan` 均句长 92.9 字符、最长句 340 字符、5 处"本节回答"导航句、多处复述；上游 16 份技能**均句长中位数 ≈13 词（英文）、最长句 55 词、表格 0 个、`because` 几乎不出现** | 同上 + 上游 1226 行统计 | 第九轮子代理实测 |
| D-036 | **字面锚点禁区列表已建立**：`tests/acceptance/card-03-current.mjs` 有 **21 条** `"anchor"` 字面断言钉在技能正文上（含 `One Task is one user-perceivable delivery increment`、`A superseded full-text body does not stay in this file either`、`run the same self-check with \`simplicity-guard\`'s core questions` 等）。**每份改写前必须先扫该文件并逐字保留命中项** | `grep -rn '"anchor"' tests/` 实测 21 条 | 本阶段实测 |
| D-037 | 执行顺序确认：**P1 先做夹具可靠性试跑（含噪声基线），通过后才进 P2 改写**。夹具不通过则先修夹具，不在测不出差别的夹具上跑完 6 个 Phase | 用户确认 | 第十轮 Talk 答复 |
| D-047 | **D-036 的红线清单不完整，已补正**：`"anchor"` 字段断言只有 21 条，但**另有 14 个测试文件直接读 `SKILL.md` 正文做 150 处 `toContain`/`toMatch`/`expectBytes` 断言**（`ocr-review-contract-bundle` 34、`debate/skill-contract` 18、`build-prd-review-contract` 17、`card03-review-orchestration` 17、`verify-architect-acceptance` 9、`isolated-browser-qa/skill-contract` 9 等）。**合计 171 条字面断言，anchor 只占 12%。** 完整清单与提取命令存任务库 `quality/tests/2026-10-08-skill-text-assertion-surface.txt`。⇒ **每份改写前必须先跑该提取命令并把命中项逐条抄进禁区**；P1 规范层须固化"技能正文的字面断言必须在改写前被提取并逐条保留"这条规则 | 本会话实测 | 本阶段 |
| D-038 | A/B 输入确认：**P4 审查类用本任务的一个真实 diff**；**P5 阶段编排类用本任务已定稿材料** | 用户确认 | 第十轮 Talk 答复 |

## 第四轮补充决策（规模、深度与内容保全）

| 决策号 | 内容 | 用户答复 | 来源 |
| --- | --- | --- | --- |
| D-039 | **不拆成两个任务；在本任务内增加 Phase 数量，按串行高质量交付**，每个 Phase 都要有开发、测试、审查质量 | C（自定义） | 第十一轮 Talk |
| D-040 | **先把 build-code 相关优化做完，再用优化后的 build-code 技能开发后面的 Phase**，目标是"一个任务内所有 Phase 都能高质量交付" | 自定义 | 第十一轮 Talk |
| D-041 | **改写深度取完整 B**：删冗余 **+ 重排版（长段落拆成条件句与判据条目）+ 否定转正面 + 引入引领词** | A | 第十一轮 Talk |
| D-042 | **内容不丢失是第一硬约束**（用户原话要点）："原本的技能核心质量和步骤不要丢失……这些是来回优化了好几个月的结果，千万不能为了改写把原本的核心内容和步骤丢失"。⇒ 每份改写的验收必须包含**逐条核心内容与步骤的保全核对**，不只是"未静默丢失"，而是**显式列明原版每一条约束/步骤在新版的落点**；对不上的一律视为失败 | 自定义 | 第十一轮 Talk |

## 需要在进入 build-plan 前确认的三个风险（由 D-039/D-040 推出的真实张力）

| 编号 | 张力 | 事实依据 | 可选处置 |
| --- | --- | --- | --- |
| T-001 | **"本任务内用上优化后的 build-code"与自举边界冲突** | 宪法治理边界：技能/流程改动从下一个任务起生效；且主会话在 make-decision 开始时已装入流程，改文件不会自动重装 | ① 弱做法：后续 Phase 显式重读改写后的 `workflows/build-code/SKILL.md`（能生效，但同一任务上下文同时装新旧两版流程，与"主上下文控制"要求冲突）；② 强做法：技能重写只做 build-code 相关几份，做完收口本任务，**下一个任务**用新 build-code 开发其余 Phase |
| T-002 | **build-code 的输入质量上限在 `spec-plan`/`spec-specify`** | build-code 消费的是 Phase 卡（`phases/P<n>.md`），由 `spec-plan` 产出；只优化 build-code 而不优化上游，Phase 卡质量不变，收货端改善被输入上限卡住 | 把 `spec-plan`/`spec-specify` 与 build-code 相关技能放在**同一批或紧邻批**改；若分期，明确标注中间态的"输入上限"限制 |
| T-003 | **改后的 build-code 在本任务内被使用前，无法先通过它自己的 A/B 验证** | D-030 的 P1 是先做 A/B 夹具、逐相验证；但 D-040 要求 build-code 优化后**立即**用于后续 Phase | 接受"先用后验"（改成在后续 Phase 中记录真实使用事实，A/B 验证在其后补做并如实标注时序），或改为"先验后用"（把 build-code 的 A/B 提到使用之前，代价是更多一次真实跑） |

## 第五轮补充决策（张力闭合）与相序推导

| 决策号 | 内容 | 用户答复 | 来源 |
| --- | --- | --- | --- |
| D-043 | T-001 处置：**本任务内后续 Phase 显式重读改写后的技能文件再干活**（弱做法）。已接受其代价：同一任务上下文同时装新旧两版流程，且新版若有缺陷会被后续 Phase 继承 | A | 第十二轮 Talk |
| D-044 | T-003 处置：**先验后用**。build-code 相关技能改写完成后，**必须先通过它自己的 A/B 验证（含噪声基线）**，通过后才用于开发后续 Phase | B | 第十二轮 Talk |
| D-045 | 内容保全的证明方式：**逐条保全表 + 真实前后跑对比**（两者都要）。保全表须把原版每一条硬约束/步骤列出，逐条注明在新版的落点与处置（逐字保留 / 改写但语义等价 / 合并 / 删除+理由）；**对不上的一律失败** | C | 第十二轮 Talk |
| D-046 | T-002 处置：`spec-plan`/`spec-specify` 与 build-code 相关技能**放在同一批或紧邻批**改写，避免"收货端改善被上游输入上限卡住" | 由 D-040 推出 | 本阶段 |

### 由 D-043 + D-044 推出的相序（存在一个验证闸口）

**A 组（先做，改完即验证）：**

- A1 — P1 规范层 + A/B 夹具（含噪声基线）+ 夹具可靠性试跑
- A2 — build-code 相关技能改写：`workflows/build-code/SKILL.md`、`skills/diagnosing-bugs`、`skills/test-routing-advisor`、`skills/backend-testing`、`skills/frontend-testing`、`skills/fullstack-slice-testing`、`skills/isolated-browser-qa`、`skills/frontend-component-quality`，**并含 T-002 要求的上游 `skills/spec-plan`、`skills/spec-specify`**（保全表 + 对照表）
- A3 — **A/B 验证 + 保全核对（闸口）**：A2 的技能必须先通过自身的 A/B（含噪声基线）与逐条保全表核对

**B 组（A3 闸口通过后才能开工）：** 其余 Phase 的技能改写，内部继续串行，**每个 Phase 开工前显式重读当前技能文件**（D-043）。

- B1 — 审查类：`skills/wh-review`、`skills/review`（补回双轴 + Fowler 12 条坏味道）、`skills/architect-code-review`、`skills/simplicity-guard`、`skills/plan-eng-review`
- B2 — 其余规划类：`skills/decision-log`、`skills/spec-prd`、`skills/spec-analyze`、`skills/spec-clarify`
- B3 — 交互类：`skills/talk-with-zhipeng`、`skills/grill-with-docs`、`skills/debate`（D-010 待删）
- B4 — 阶段编排：`workflows/make-decision|build-plan|verify-code|build-prd` 的 `SKILL.md`
- B5 — 登记面与源头对齐（原工作包 ①⑥⑦）：三份清单收敛、`build-spec` 分两批清、改名、基线升级、manifest 迁数据后删、接线恢复（`anysearch`/`architect-code-review`/`diagnosing-bugs`）
- B6 — PR 收口重构（原工作包 ④ 的 PR 部分，含 ≥5 处代码 + ≥3 处冻结测试 + 修宪独立性）

**A3 是硬闸口**：不通过则 B 组不开工，先修。若 A/B 显示改写引入新的故障，必须先修好再继续，不得带着缺陷往下走。

### 需要提前说明的真实规模（不许事后才说）

| 项 | 数量 |
| --- | --- |
| 真实任务执行次数（A/B：每技能 2 次 + 噪声基线 2 次） | **至少 24 次**（尚未计入 A3 闸口因不通过而返工的次数） |
| 需要改写的技能/流程文件 | **约 39 个技能 + 5 个 workflow SKILL.md** |
| 明确红线（必须逐字保留） | `tests/acceptance/card-03-current.mjs` 的 **21 条** `"anchor"` 断言 + `tests/contract/verify-architect-acceptance.test.mjs` 的 17 处逐字 + `workflows/verify-code/SKILL.md` 的 13 处等（约 12% 的行是硬强制） |
| 既有红灯（改造前即存在，必须与本次引入分开报告） | 6 个测试文件 / 13 个用例（基线已存任务库 `quality/tests/2026-10-08-baseline-red-before-skill-modernization.txt`） |
| 跨会话 | **必然**（至少 A1–A3 一个会话做不完） |

## 需求闭环表（R → AC/ADR 落点）

共 31 条（R-001..R-031；R-031 为覆盖核查时补记的用户原话限定）。每条的正文见上文 `## 原始需求` 表。

| R | 落点 | R | 落点 |
| --- | --- | --- | --- |
| `R-001` | ADR-001, ADR-002, AC-015..AC-017 | `R-017` | ADR-009, AC-003 |
| `R-002` | ADR-003, AC-013 | `R-018` | ADR-009, AC-003 |
| `R-003` | ADR-007, AC-001, AC-002 | `R-019` | 本阶段已执行（五方向 + 第二轮四项调研） |
| `R-004` | ADR-002, ADR-003, AC-009 | `R-020` | ADR-001, AC-015, AC-016；调研报告 §8.3 判定表 |
| `R-005` | ADR-003, AC-011（`anysearch` 接线） | `R-021` | AC-012（含既有红灯基线）、AC-018、D-019/D-024 |
| `R-006` | ADR-004, AC-016 | `R-022` | 调研报告 §六 + §8.4（5 个新项目） |
| `R-007` | ADR-004, AC-013, AC-016 | `R-023` | ADR-010, AC-017 |
| `R-008` | ADR-004, AC-013（保留形态装方法） | `R-024` | ADR-011, ADR-012, AC-006, AC-010, AC-011（范围含目标项目，见 D-017） |
| `R-009` | ADR-004（设计段） | `R-025` | 本阶段执行方式（本任务 15 步全走） |
| `R-010` | ADR-005, AC-013 | `R-026` | 本阶段执行方式（十二轮真实问答 + 逐条闭环核对） |
| `R-011` | ADR-007, AC-004 | `R-027` | 本阶段执行方式（每问写明代价与风险）；D-063 |
| `R-012` | ADR-006, AC-004 | `R-028` | 本阶段执行方式（调研全部外派 12 个子代理） |
| `R-013` | ADR-007, AC-011 | `R-029` | 本阶段已执行（方向盲审 1 + 对抗性 1 + 细节审查 1） |
| `R-014` | ADR-008, AC-005 | `R-030` | 本阶段执行方式（全部由用户真实作答） |
| `R-015` | ADR-009, AC-003 | `R-031` | ADR-001；调研报告 §8.3（四种去向全部有判定与判据） |
| `R-016` | ADR-009, AC-003 | — | — |

## 自举边界与执行纪律（本次特有）

1. **本任务自己不走改写后的技能**（直到 D-043 约定的显式重读点为止）。改写的技能从下一个任务起正式生效。
2. **A3 是硬闸口**：不过则 B 组不开工。这不是新增 stage 或机器 gate，而是本任务的**内部交付顺序**：它不写入 runtime、不产生持久对象、不改变公共七类入口。此判断须由独立细节审查复核（见 `detail-advice` 结论）。
3. **每个 Phase 开工前显式重读当前技能文件**（D-043 的弱做法）。已知代价：同一任务上下文可能同时装新旧两版流程；每相结束时如实记录这一事实。
4. **既有红灯必须与本次引入的失败分开报告**。A2/A3 阶段跑测试时，根因是 `build-spec` 死阶段名的 3 盏红灯会持续亮，须在客观量采集时显式扣除并注明。
5. **改写纪律**：不许用"行数下降"当通过依据（D-034）；每份改写必须有逐条保全表（D-045）；有分歧**跑一遍**而不是争论（上游要求）。

## 细节审查处置（detail-advice 回执与逐条处置）

独立细节审查结论：**有条件可以，但不是现在**；方向、ADR 五字段、失败恢复路径合格，问题集中在**验收面可执行性**与**"红线的另一半"从未被清点**。以下逐条处置，**未处置完不进入 build-plan**。

| # | 审查发现（含证据） | 处置 | 决策 |
| --- | --- | --- | --- |
| F1 | **红线清单只覆盖 12%**：`"anchor"` 21 条正确，但另有 **20 行中文 `toContain` 字面断言**（`debate/skill-contract` 8 条、`diagnosing-bugs/skill-contract` 3 条、`verify-architect-acceptance` 22 串、`test-routing-advisor` 的 `"禁止执行测试"` 等）与**反引号路径类**（`runtime/evidence/skill-static-deps.mjs:22` 定义，`:60` 校验，经 `run-checks.mjs:127-129` 进入 `npm run check`），后者从未进过任何清单 | **接受。** 列为 build-plan 前**阻塞级**事项：产出一份**可机读禁区文件**（合并 21 锚点全表 + 22 串 + 20 行中文断言 + 反引号路径类）。D-047 的清单须按此升级 | D-048 |
| F2 | **D-041（否定转正面）与 D-042（内容不丢失）字面互斥**，且有具名实例：`debate/skill-contract:17` 的「不得用 `debate` 的子代理去生成审查发现本身」、`test-routing-advisor/skill-contract:15` 的「禁止执行测试」、`diagnosing-bugs/skill-contract:9` 的「没有根因证据，不改代码」——**三条都是否定式且被逐字钉死** | **接受。** 限定适用范围：**"否定转正面"只适用于禁区清单之外**；清单内的否定串逐字保留。这与 WR-001 §五的务实校准一致（硬护栏可保留否定，但宜同时给正面目标） | D-049 |
| F3 | **成本算术错误（本决策日志自误）**：写"至少 24 次真实执行"，但其算法（4 次/技能）对应 6 个技能，而 A2 列了 **10 个文件** ⇒ 40 次；再加 A1–B6 九相，**真实规模 100+ 次**。原数字自相矛盾 | **接受并更正。** 见 D-050 的规模重估与切分建议 | D-050 |
| F4 | **判据与被测对象同体**：`tests/acceptance/card-03-current.mjs:215-337` 的 21 条锚点逐字钉死 `workflows/build-code`、`skills/spec-plan`、`skills/spec-specify`——正是 A2 要改的三个 | **接受。** 这是"红线撞车"，不是时序问题。处置见 D-051 的范围收缩 | D-051 |
| F5 | **相序自相矛盾**：D-022/OI-019 已选"登记面对账先做"，但 A 组相序把 B5（登记面）排在 B 组末尾 | **接受。** 以 D-022 为准：**登记面对账必须最先**（且它零行为风险）。相序表据此重排 | D-052 |
| F6 | **AC 面的三处问题**：① AC-008 与 AC-017 逐字重合三句，实为同一条；② AC-001 与 AC-002 的 `gh pr create` 证据重复；③ **AC-011 要求"至少一次真实触发记录"，但按 D-033 本任务不走改写技能 ⇒ 该证据在本任务内不可取得** | **接受。** ① 合并；② 去重；③ 改口径为"引用计数 + contract 测试 + 下一任务待验项" | D-053 |
| F7 | **`templates/phase-template.md` 路径不存在**：仓库根 `templates/` 为空；真实路径是 `skills/spec-plan/templates/phase-template.md`（ADR-004 与 AC-013 指向了不存在的位置） | **接受。** 更正为真实路径 | D-054 |
| F8 | **AC-006 不可判定**：D-027 说 manifest 的 44 条要迁到 "skill-deps.yaml **或** catalog.yaml"，二选一未定 | **接受。** 必须二选一后才可判定；列入 build-plan 前事项 | D-055 |
| F9 | **既有红灯应记为"失败用例 ID 集合"而非文件/用例数**：B5 会让 `runtime-facade`、`host-independence`、`thin-core-residue` 的 3 盏灯变绿，数字比较会失真 | **接受。** 基线口径改为**具名失败用例 ID 集合** | D-056 |
| F10 | **A/B 基线冻结方式未写清**：A 侧必须绑定"改写前的技能文件快照"，否则 A2 一改基線即消失 | **接受。** A 侧绑定 `git show <baseline>:<path>` 的快照字节，B 侧绑定改写后文件；快照载体用现有 git，不新增对象 | D-057 |
| F11 | **"约 12% 的硬强制"是样本口径（399 行）被当成全仓口径（3063 行）** | **接受并更正。** 样本 399 行 = 全仓 **13.0%**；结论方向不变，但**不得把它当作全仓统计**引用 | D-058 |
| F12 | R-023 无 AC 直接验证；R-019/R-022 无 AC；孤儿 AC（AC-012/AC-014 挂 R-021，其余挂未定义的 UC-001..UC-008） | **接受。** AC-008 扩为对 R-023 的具名核对（与 F6① 同批）；补 UC-001..UC-008 索引；R-025..R-030 显式写作"不纳入 ADR，按现行方法执行" | D-059 |
| F13 | **A3 硬闸口在"用词与治理边界"上与"不新增 gate"冲突**（但审查明确：不新增持久对象、无 reader、不入 runtime，**不构成第二套进度权威**） | **接受。** 措辞改为"A3 是 B 组的**前置证据条件**，不新增 gate 对象；阻断只由本任务 Phase 顺序体现，不入 runtime"；非目标显式加一条具名例外 | D-060 |
| F14 | 审查认可的正面结论：A2 的 10 个技能文件**全部存在**；21 条锚点 / 17 处逐字 / 2 failed 6 passed 三个数字**实测正确**；`workflows/verify-code` 实为 **12** 处不同串（不是 13） | **接受更正**：13 → **12** | D-061 |

## 相序更正（F5/F3 处置）与规模重估

### D-052 相序以 D-022 为准重排（原相序表作废）

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-024]
- derived_from: []
- artifacts: [quality/evidence/decision-log-refs/research-report-make-decision.md]

原相序把 B5（登记面对账）排在 B 组末尾，**与 D-022「登记面对账作为第一个 Phase 先做」直接矛盾**。更正后：

| 顺序 | 相 | 内容 | 行为风险 |
| --- | --- | --- | --- |
| **0** | **R（登记面对账）** | 三份清单逐条对账 + `build-spec` 扫描 + 红线全量清单（已交付初版）+ **既有红灯改为具名失败用例 ID 集合**（D-056）+ manifest 的 44 条归属迁到**二选一后的唯一处**（D-055） | **零**（不改技能正文） |
| **1** | **A1** | 规范层 + A/B 夹具 + 夹具可靠性试跑（含噪声基线） | 零（不改技能正文） |
| **2** | **A2′** | **范围收缩后的改写**（见 D-051） | 中（改 build-code 相关） |
| **3** | **A3** | **前置证据条件**（非 gate 对象，见 D-060）：A2′ 的技能先过自身 A/B + 逐条保全表 | 零（只跑与核） |
| **4** | **B1..B4** | 审查类 → 其余规划类 → 交互类 → 阶段编排；每相开工前显式重读当前技能文件（D-043） | 中 |
| **5** | **B6** | PR 收口重构（≥5 处代码 + ≥3 处冻结测试）+ 独立修宪 | **高** |

### D-050 规模重估（更正算术错误）

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021]
- derived_from: []
- artifacts: [quality/tests/2026-10-08-baseline-red-before-skill-modernization.txt]

| 项 | 此前写法 | **实测更正** |
| --- | --- | --- |
| A/B 真实执行次数 | "至少 24 次" | **算术自相矛盾**：4 次/技能 × A2 的 10 个文件 = **40 次**；再加九相逐相 A/B ⇒ **100+ 量级** |
| 硬强制占比 | "约 12% 的行" | 样本 399 行 = **12.03%✅**，但 399 行只占全仓 **3063 行的 13.0%** ⇒ 此前把**样本口径写成了全仓口径**，不得再这样引用 |
| `workflows/verify-code` 逐字串 | 13 处 | **12 处**（第 13 处实为同一串的另一种断言写法） |
| 被 21 条锚点钉死的文件 | "3 个示例" | **10 个文件全表已产出**；其中 **`workflows/build-code/SKILL.md` 被钉 6 条，是全仓最死的文件** |

### D-051 A2′ 范围收缩

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-006, R-007, R-011]
- derived_from: []
- artifacts: [quality/tests/2026-10-08-skill-text-assertion-surface.md]

- A2′ 只改 **3 个文件**：`workflows/build-code/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-specify/SKILL.md`（即 21 条锚点覆盖、且有 `*.final.md` 实测样本的三份）。A/B 从 **40 次降到 12 次**，红线撞车面积缩到已知。
- 其余 7 个（`diagnosing-bugs`、`test-routing-advisor`、`backend/frontend/fullstack-slice-testing`、`isolated-browser-qa`、`frontend-component-quality`）**移入后续相**，不在 A2′ 动。
- B6（PR 收口重构 + 修宪）**保持独立**：它是 ≥5 处代码 + ≥3 处冻结测试 + 7 处治理文本，与技能改写正交；混在一起会让两个高风险面互相掩盖。

### D-060 A3 措辞更正（前置证据条件，非 gate）

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021]
- derived_from: []
- artifacts: []

**A3 是 B 组的前置证据条件，不是 gate 对象**：它不新增持久对象、不写 runtime、不产生 reader、不改变公共七类入口；其阻断**只由本任务的 Phase 顺序体现**。非目标节显式登记这一具名例外。

## 需要用户裁决的范围问题（诚实撤回一次先前的同意）

**用户 D-039 选了"不拆成两个任务，在本任务内增加 Phase 串行做完"。** 但独立细节审查实测后指出：**"一个任务内完成"这个前提不成立**——A/B 真实规模 100+ 次执行、约 39 技能 + 5 workflow SKILL.md、且跨会话必然。

**我此前顺着用户选择记录为"C"，没有把规模算术做对。现撤回该同意，并给出实测依据由用户重新裁决。** 三个可选切法：

| 切法 | 任务一 | 任务二 | 任务三 |
| --- | --- | --- | --- |
| **切法甲（审查建议，推荐）** | **R（登记面对账）+ 红线全量清单 + 失败用例 ID 集合**——不改任何技能正文，零行为风险 | **A1 夹具三项证据**——仍不改技能，只证明夹具能测出差别 | **A2′（3 文件）+ A3 + B1..B4 + B6** |
| **切法乙** | R + A1 + A2′ + A3（即"改 build-code 相关并验证"闭环） | B1..B4（其余技能改写） | B6（PR 收口重构 + 修宪） |
| **切法丙** | 维持不拆（已知与"一个任务内完成"的实测前提冲突） | — | — |

**本决策日志在用户裁决前**：保持"不跳阶段、按 R → A1 → A2′ → A3 → B1..B4 → B6 串行"的相序；**切法由用户定**。

### D-062 范围切分最终裁决（切法甲）

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021, R-024]
- derived_from: []
- artifacts: [quality/evidence/decision-log-refs/skill-quality-proposal-PROP-001.md]

用户裁决 **甲**。据此：

- **任务一（本任务续做）**：**R 登记面对账 + 红线全量清单 + 既有红灯改具名失败用例 ID 集合**。**不改任何技能正文**，零行为风险；含 D-055（manifest 44 条归属迁往何处，二选一）与 D-056（红灯口径）。
- **任务二**：**A1 夹具三项证据**（改前/改后确实不同、同版连跑噪声基线、客观量可稳定采集）。仍不改技能正文。
- **任务三**：**A2′（3 文件：`workflows/build-code/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-specify/SKILL.md`）+ A3 + B1..B4 + B6**。

**本任务（`workflowhub-skill-modernization-20261008`）的交付范围据此收缩为"任务一"**：R 与红线清单，不改技能正文。A1/A2′/A3/B1..B4/B6 作为后续任务的输入交接，不在本任务内实施。

### D-063 沟通规则（用提问工具）

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-027]
- derived_from: []
- artifacts: []

**所有需要用户裁决的地方一律使用提问工具（`ask_user_question`），不用纯文本提问。**

## 决策链条条目（仓库机器契约要求的 H3 形状）

说明：仓库的 `tools/cli/check-decision-log-chain.mjs` 只把 `### D-xxx` 形状的 **H3 小节**识别为决策条目，并要求
`module` / `requirement_ids` / `derived_from` / `artifacts` 四个字段（`module` 为字符串，后三者为 `[...]` 方括号列表）。
本日志正文的 63 条决策以**表格行**记录（便于阅读），因此 web 该 checker 只认出下列显式条目。
**处置**：为**有链式追溯价值**的决策补 H3 形状条目；其余决策的追溯关系见文末《全量决策索引》表。
该 checker 的警告为 advisory、非阻塞（`exit 0`），本日志如实保留该事实。

**关于 `derived_from` 的处置**：checker 只认本文件内的 H3 决策条目作为可解析的链节点，而本日志 63 条决策主要以**表格行**记录。
为避免产生指向不存在节点的悬空链，**下列 H3 条目的 `derived_from` 置空**，其真实来源改由该条目正文「内容」一句说明；
便于读者回查的完整追溯关系以文末《全量决策索引》表为准。

## 全量决策索引（D-001..D-063）

| 决策 | 主题 | 关联需求 | 主要工件/落点 |
| --- | --- | --- | --- |
| D-001 | 交付形态＝真的改仓库、按阶段分批 | R-001 | 本日志 `## 范围与非目标` |
| D-002 | ticket 只装方法不变形态 | R-008 | ADR-004 |
| D-003 | PR＝真的执行建 PR（后被 D-021 修正为按环境自适应） | R-003 | ADR-007 |
| D-004 | 复盘链＝候选→挑→优先转检查→只留未解决 | R-015..R-018 | ADR-009 |
| D-005 | 子代理审查＝build-code 每 Phase 第二轴（后被 D-025 修正命名） | R-012 | ADR-006 |
| D-006 | verify-code 内架构评估每任务一次 | R-014 | ADR-008 |
| D-007 | 死阶段名 build-spec 连 schema 一起清（后被 D-029 改为分两批） | R-024 | ADR-011 |
| D-008 | 上游基线升到 `b0618bc` 并跟随改名 | R-023 | ADR-001、ADR-002 |
| D-009 | 三份清单以实际接线为唯一真相、删 manifest（后被 D-027 改为先迁数据） | R-024 | ADR-011 |
| D-010 | `debate` 可删 | R-024 | ADR-012 |
| D-011 | `architect-code-review` 融合后放回 verify-code | R-012 | ADR-006 |
| D-012 | `anysearch` 应服务 make-decision 外部调研 | R-005 | ADR-003 |
| D-013 | 薄技能合并（`spec-tasks`→`spec-plan`、`spec-research`→`deep-research`） | R-024 | ADR-004 |
| D-014 | 架构评估一次性＝硬规则 + 材料可查 | R-014 | ADR-008 |
| D-015 | 两审查通道并列 + 回退改目标（后被 D-026 拆分） | R-012 | ADR-006 |
| D-016 | `anysearch` 融入 deep-research（实为接回断线） | R-005 | ADR-003、AC-011 |
| D-017 | 领域知识格式跨项目统一 | R-004、R-023 | ADR-002 |
| D-018 | 改名连 ADR 一起改（后被 D-028 改为只加批注） | R-023 | ADR-002 |
| D-019 | 质量 oracle 清单 | R-021 | AC-012 |
| D-020 | 命名格式＝本地为主 + 补上游两节 | R-004 | ADR-002、AC-009 |
| D-021 | 本任务自身先 commit 做能力、再用它开 PR；PR 按环境自适应 | R-003 | ADR-007 |
| D-022 | 登记面对账作为第一个 Phase | R-024 | D-052 相序 |
| D-023 | 改名只改当前有效面 | R-023 | AC-009 |
| D-024 | 验收范围纳入 `tests/close/**`、`tests/integration/**` | R-021 | AC-012 |
| D-025 | 子代理轴如实命名"同源补充轴" | R-012 | ADR-006、AC-004 |
| D-026 | 修宪拆成独立可回退小改动 | R-021 | AC-014 |
| D-027 | manifest 先迁数据再删 | R-024 | ADR-011、AC-006 |
| D-028 | ADR 只加改名批注 | R-023 | OI-029 |
| D-029 | `build-spec` 分两批清 + 保留 `RETIRED_STAGES` 哨兵 | R-024 | AC-007 |
| D-030 | 深度 B 拆 6 相串行 | R-021 | D-051 相序 |
| D-031 | 每相带前后对比（客观量为主 + 盲评参考） | R-021 | AC-018 |
| D-032 | A/B 输入用本任务真实材料 | R-021 | AC-018 |
| D-033 | 自举边界：本任务不走改写技能 | R-021 | `## 自举边界与执行纪律` |
| D-034 | 不许用行数下降当通过依据 | R-021 | AC-015、WR-001 |
| D-035 | 真实臃肿指纹＝长句+导航句+复述+同义重复 | R-021 | WR-001、PROP-001 |
| D-036 | 字面锚点禁区清单（后被 D-047 补正） | R-021 | 禁区清单文件 |
| D-037 | P1 先做夹具可靠性试跑＋噪声基线 | R-021 | AC-018 |
| D-038 | A/B 输入：P4 用真实 diff、P5 用已定稿材料 | R-021 | AC-018 |
| D-039 | 不拆任务、本任务内串行（后被 D-062 改为切法甲） | R-021 | D-062 |
| D-040 | 先优化 build-code 再用它开发后续 Phase | R-011 | D-051 |
| D-041 | 深度 B 完整版：删+重排版+否定转正面+引领词 | R-021 | WR-001、AC-015 |
| D-042 | 内容不丢失是第一硬约束 | R-021 | AC-015、D-045 |
| D-043 | 后续 Phase 显式重读改写后技能（弱做法） | R-021 | `## 自举边界与执行纪律` |
| D-044 | 先验后用 | R-021 | AC-018 |
| D-045 | 内容保全＝逐条保全表 + 真实前后跑 | R-021 | AC-015 |
| D-046 | `spec-plan`/`spec-specify` 与 build-code 同批改 | R-006、R-007 | D-051 |
| D-047 | 红线清单补正（anchor 只占 12%，实为 171 条断言） | R-021 | 禁区清单文件 |
| D-048 | 产出可机读禁区文件（阻塞级） | R-021 | `quality/tests/2026-10-08-skill-text-assertion-surface.md` |
| D-049 | 否定转正面只适用于禁区清单之外 | R-021 | 禁区清单文件 |
| D-050 | 规模重估（更正算术错误） | R-021 | 见上 H3 条目 |
| D-051 | A2′ 范围收缩到 3 文件 | R-006、R-007、R-011 | 见上 H3 条目 |
| D-052 | 相序以 D-022 为准重排 | R-024 | 见上 H3 条目 |
| D-053 | AC 面三处更正（合并/去重/改口径） | R-021 | AC-008、AC-011 |
| D-054 | `templates/phase-template.md` 路径更正 | R-007 | AC-013 |
| D-055 | manifest 归属迁往何处必须二选一 | R-024 | AC-006 |
| D-056 | 既有红灯改为具名失败用例 ID 集合 | R-021 | AC-012 |
| D-057 | A/B 基线冻结方式（A 侧用 git 快照） | R-021 | AC-018 |
| D-058 | "约 12%" 是样本口径非全仓口径 | R-021 | 见上 H3 条目（D-050） |
| D-059 | 需求闭环补正（R-023 扩 AC-008、补 UC 索引） | R-019、R-022、R-023 | `## 需求闭环表` |
| D-060 | A3 措辞更正（前置证据条件，非 gate） | R-021 | 见上 H3 条目 |
| D-061 | `verify-code` 逐字串 13→12 | R-021 | 见上 H3 条目（D-050） |
| D-062 | 范围切分裁决＝切法甲 | R-021、R-024 | 见上 H3 条目 |
| D-063 | 沟通规则＝用提问工具 | R-027 | 见上 H3 条目 |

### D-064 范围切分最终裁决更正：**切法丙（不拆，全部在本任务内串行）**

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021, R-024]
- derived_from: []
- artifacts: []
- 内容：用户明确要求**不拆成多个任务**，全案在本任务 `workflowhub-skill-modernization-20261008` 内按
  **R 登记面对账 → A1 夹具 → A2′ 改写 → A3 前置证据条件 → B1..B4 → B6** 串行完成。**D-062 的切法甲作废**，D-039「不拆」重新生效。

**已知前提冲突与用户接受（必须如实保留，不得隐去）**：独立细节审查实测确认"一个任务内完成"与三项事实冲突——
① A/B 真实执行量级 100+ 次；② 改写面约 39 技能 + 5 workflow SKILL.md；③ 跨会话必然。
用户在看到该实测依据后**明确选择维持不拆**。处置纪律如下：

1. **不因此降低任何验收标准**（AC-001..AC-018 全部照旧，含 D-034 的行数不作判据、D-045 的逐条保全表、D-044 的先验后用）。
2. **分会话推进**：本任务会跨多个会话；每相结束时按 `skills/stage-handoff/SKILL.md` 写交接，下一相**开工前显式重读当前技能文件**（D-043）。
3. **不得因体量而跳过相序**：R 与 A1 都不改技能正文，必须真实完成（D-022 与 D-037 的前提）。
4. **若中途出现无法修复或无法验证的部分**：按宪法保持 incomplete 并如实交接，**不得以"任务太大"为由声称完成**。

### D-065 `npm run check` 既有红灯口径

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021]
- derived_from: []
- artifacts: [quality/tests/2026-10-08-baseline-red-before-skill-modernization.txt]
- 内容：`npm run check` 在**主仓未改动状态**即为 **exit=1**，11 个 markdownlint 报错文件全部为既有；
  认证 worktree 为**同一批 11 个、零新增**。其中 3 个在技能层（`skills/decision-log/templates/decision-log-template.md`、
  `skills/plan-eng-review/SKILL.md`、`skills/spec-specify/templates/spec-template.md`），**本身即"技能质量不达标"的既有实例**。
  ⇒ **AC-012 的口径固定为**：`verify-structure.mjs` 单独跑 PASS；`npm run check` 整体 exit=1 且**与基线一致（零新增）**；
  **不得声称 `npm run check` 通过**。

### D-066 最新用户纠正：取消token用量要求

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021]
- derived_from: [D-031, D-037]
- 来源：本轮用户直接纠正原话，由当前主会话转交原计划作者：**“我没有token用量的要求，请彻底去掉。比较仍不能可靠区分两版方法的效果的解决办法是什么？”**
- 生效范围与优先级：本任务当前规划、后续实施比较、验收和阶段收口中，输出token／用量不再是要求，不采集、不估算、不延期，不作预算、通过条件、unknown缺量或收口阻塞。此最新纠正覆盖D-031及原AC-018等历史来源中的该一项；历史原文保留只作出处，不继续约束当前。
- 当前有效客观量仅四项：工件齐全度、硬约束违反数、耗时、真人重问次数。其它要求未取消；字符／句长独立写作约束不因本条消失，CSS／设计token及语法token术语不属用量，不误删。
- D-037版本差异必须可靠可辨／同版噪声要求未被取消；用户问解决办法不等于已选新方案、接受风险或接受当前修订计划。真实试跑失败／真人重问未观测不因取消用量自动通过。
- 原测试、gold、输出、review、交接原件不覆写；旧scorer中用量未知／零捏造条件为历史事实，不再控制当前。需要新的测试合同，由独立测试owner经具体test change request处置；本作者不改冻结源码／断言。

### D-067 用户接受并执行分型比较判据

- module: workflowhub-skill-modernization-20261008
- requirement_ids: [R-021]
- derived_from: [D-031, D-037, D-044, D-045, D-066]
- 用户真实原话：**“按这个方案修正比较判据并执行”**；正式recordConfirmation：[amend-comparison](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/human-confirmations/2026-10-08-002-build-plan-amend-comparison.json)（只此比较修正，不是完整计划/Git接受）；实际接受原件：[059](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-08-059-build-plan-comparison-amendment-accepted.json)，sha256 971d4a19493e8aa97214e4894075386ea98bc2cd8c7fe1eaaaa5cdd1065602c3；所接受方案：[058](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-08-058-build-plan-method-comparison-proposal.json)。058原件发布时仍proposal不覆历史，059记录本次真实接受。
- 当前生效优先：保原D-037/AC-018历史正文，仅其比较解释及当前spec/Phase按本条更新。先判真实改动类型：行为改动以对应用户可观察结果与真实约束测效果；表达整理以每项核心步骤/条件/保护逐条保全，加有限无回归证据验证，不强求某版赢家或输出必须不同。混合改动逐项分型，新增行为不能靠文字保全免验。
- 比较器先用具来源正确输出及已知错误对照校准，按实际证据分别返回正确／错误／未观测；缺证据不自动失败，输出相似不自动说明夹具坏；未观测不当已测通过，不宣统计等价或改善。根因符号/合理行范围可定位，不强制单行数字/JSON字段数/假设数或字节长。
- 输入不提前规定方法步骤，实际source/must_steps在结果前锁定，真实许可/route及计时范围照实。现八fresh真实输出可按接受后的新合同重评，不仪式重跑；仅真正新增行为未覆盖case追加针对性试跑，不跑全39。新oracle使用前由独立测试owner具体test change request及独立来源审查；旧九codefreeze/oldscorer/输入/gold/raw/review均DNT。
- 四项客观量继续具真实scope：工件齐全度、硬约束违反数、耗时、真人问答质量／重问。无人case明确not_observed/no participant，不填0；该不适用/不可观测本身不作所有方法case必须真人重演的阻塞，涉及真实问答的新行为才测该对应场景。
- D-066取消输出token／用量要求继续完全有效，不重新加入。只授权规划/证据/比较合同修正与有限执行，不授权生产/Git、不代替完整修订计划接受、不自动stage succeeded；既定相序与先验后用不变。
