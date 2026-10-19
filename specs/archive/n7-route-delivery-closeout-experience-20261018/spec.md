# 功能规格：阶段收口、人读交接、业务仓经验文件与交付说明的统一

读者：实施者、独立审查者与逐 AC 验收的读者。
读完要能：定位每条需求的原义与来源、全局实现设计的锚点、每个 Phase 的边界，以及唯一验收判据在哪一节。

这是写作指引，不是质量门；机器读取的标题与标签、被锁定文字、真实逐字声明按原样保留。

> 基于已确认的 `decision-log.md`（D-001…D-018、ADR-001/ADR-002）与原始需求 R-001…R-015。本文件承载产品行为与全局实现设计；`phases/P<n>-*.md` 只写各 Phase 增量，`phases/index.md` 只存指针。
> 叙事主干连续说明问题、目标、取舍与机制；所有可判定验收正文只在 `Appendix A`，主干只留稳定指针。

- **功能名**：阶段收口与五件各归一处（收口、交接、业务仓经验、交付说明、领域词表与工作区任务）
- **来源**：`specs/n7-route-delivery-closeout-experience-20261018/decision-log.md` 的 R-001…R-015、U-001…U-005、D-003…D-018、ADR-001、ADR-002、AC-001…AC-013
- **状态**：当前build-code材料；用户已授权实施，并明确批准下述两项最小范围补充。本次材料更新不宣实施、验证或验收成功。

本次适配基线为本地 main `df342ee0`（由 `5e6eb6e2` fast-forward 合入）；原始需求和 decision-log 仍是产品选择来源，历史原件不改。N4 的写作合同用于组织当前材料，不增加 N7 产品范围或新验收门。

材料导航（可再生、非权威）：

| 必留内容 / 状态 | 当前正文位置 | 读取时机 |
| --- | --- | --- |
| P0 目标场景与需求 `written` | 第 1–3、5 节 | 理解用户结果与异常路径时 |
| P0 全局设计与边界 `written` | 「架构边界」「实现设计」、第 10 节 | 拆任务、写入前 |
| P0 唯一验收 `written` | Appendix A | 判断每条承诺时；未执行不等于通过 |
| P0 验收表面与排除 `written` | 「验收流程」「测试标准／验收对象」 | 选检查与核覆盖上限时 |
| P0 依赖、风险与来源 `written` | 「来源与决策映射」「全局文件边界与依赖」、第 12 节 | 接手、处理缺口与回退时 |

P1 仅展开本卡真实的文件迁移、跨仓授权与机器接线；UI、服务部署、schema 变更不适用，理由见测试标准与第 10 节。P2 过程与推导沿「补充材料」到达条件读取；必做动作、失败与权限条件均留正文，删掉补充指针仍能实施。`written` 只说明内容在场，未闭环验收另按第 12 节和 Appendix A 保留缺口。

N4 的 [退役字节验收决定](../../docs/adr/0049-retire-byte-drop-acceptance-for-anonymous-blind-review.md) 取消一般文档质量的字节下降／基线核销，改由独立匿名同尺判断；不能据字节更少宣称更好。N7 另有用户在 2026-10-18 批次 7/8 的明确数值选择：被替代正文不增、新增单列，以及常驻三件净不增；它们由 `D-015`、`U-005` 承接，本次没有撤销授权，故保留 AC-012 的任务特定约束，而不推广成通用门。文档质量、方法消费与数字约束分列，互不替代。

ADR 导航须使用完整文件名：上面的 N4 `0049-retire-byte-drop-acceptance-for-anonymous-blind-review.md` 与 N7 [经验位置决定](../../docs/adr/0049-experience-file-under-specs-and-merged-with-todos.md) 同号但不是同一决定；任务内 `ADR-001/ADR-002` 仍沿 decision-log 解释，不改号、不覆盖任何一件。N4 [中文字段决定](../../docs/adr/0050-chinese-task-card-field-names-with-silent-detection-fix.md) 允许中文别名与英文并存；当前修订沿已认标签，保留 `gate_cmd/oracle/evidence_path/STOP/Done`、既有 AC ID 和本 Appendix 标题，不批量重写历史。

## 速读卡（30 秒）

- **一句话需求**：现有五条路线（领域词表、工作区与任务、人读交接、阶段收口与关闭、交付说明）的收尾一次做完整——每件只有一处正文，其余位置是指针；每个阶段真的收口；交接让用户照着就能回；业务仓留下能改变下次行动的经验；六项外部机制各自落到已有文件。
- **核心改动点**：
  - 五条路线的末步统一改为「收口」，收口内部归纳→归口→记成本→发布交接→报告；步数不变，交接不再是独立末步但仍可单独读取。
  - 业务仓经验文件唯一位置改为业务仓根下 `specs/Improvements.md`，经验与未解待办合一、按该仓模块分节、三列小表；本仓旧仓根文件迁走后删除。
  - 新建《交付与收口总纲》只做入口与边界索引，不承载第二份规则；关闭仍只挂规划收尾与终末验证两个阶段。
  - 交付说明内容合同收敛到关闭方法，补范围（含故意不做）／影响面（含已知红）／验证三段；实施阶段只留一句事实。
- **最大影响面**：`skills/` 四个方法文件、五个 `workflows/*/SKILL.md` 与 `steps.json`、`skills/catalog.yaml`、`docs/standard-workflow.md`、`AGENTS.md`/`CLAUDE.md`/`GLOSSARY.md` 三个常驻必读文件、受影响的契约与验收测试、两个业务仓的经验文件。
- **验收信号**：五阶段末步与新方法文本可由一条命令重放判定；常驻三件合计字节不高于本任务起点；业务仓文件真实存在且读完能读回；交付说明三段可读且机器字段 `Door`/`Blast Radius` 仍在。

## 来源与决策映射

本节只保存 ID 关系，不复制 decision-log 正文。没有来源的新增需求必须回到 make-decision。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `R-001` | `D-003`、`D-004`、`D-005`、`D-011`、`D-018`、`ADR-002` | `FR-CLOSE-001` / `AC-001`、`AC-010` | `current`；五件正文与指针 | 指针条件由 P3 落实 |
| `R-002`、`R-003` | `D-006`、`D-007` | `FR-CLOSE-002`、`FR-CLOSE-003` / `AC-002`、`AC-003` | `current`；五阶段末步与收口产物 | 步数由 P1 保持 |
| `R-004`、`R-005`、`R-006`、`R-013`、`R-014` | `ADR-001`、`D-010`、`D-012` | `FR-CLOSE-006` / `AC-006`、`AC-007`、`AC-008`、`AC-009` | `current`；两个业务仓经验文件 | 论文仓可写性见 `OPEN-002` |
| `R-007`、`R-012` | `D-013` | `FR-CLOSE-008` / `AC-011` | `current`；钉死测试与退役守卫 | 悬空引用范围见 `PFACT-005` 的八处原文 |
| `R-008` | `D-008` | `FR-CLOSE-004` / `AC-004` | `current`；交接动作项 | 抽样由 P1 交付 |
| `R-009` | `D-017`、`D-008`、`D-009`、`D-010`、`D-011`、`D-012`、`D-015` | `FR-CLOSE-010` / `AC-013` | `current`；六项采用 | 逐项落点见 P1–P4 |
| `R-010` | `D-015` | `FR-CLOSE-009` / `AC-012` | `current`；减法与常驻字节 | 需净减 ≥1,463 B，见 `PFACT-006` |
| `R-011` | `D-016` | 非目标（第 10 节） | `non-goal`；新四级路线 | 归 N8 |
| `R-015` | `D-014` | `FR-CLOSE-008` / `AC-011` | `current`；悬空验收引用 | 八处原文见 `PFACT-005` |
| `U-001`（标准路线、不跳阶段、两审查各一次） | `D-001`、`D-002`、`D-016` | 全部 FR | `current`；路线与执行方式 | 完整变更见外置原件 |
| `U-002`（业务仓＝本仓＋论文仓，文件放 `specs/`） | `ADR-001`、`D-010` | `FR-CLOSE-006` / `AC-006` | `current`；两个业务仓位置 | 论文仓可写性见 `OPEN-002` |
| `U-003`（可改论文仓经验相关说明文档，收敛为其规则文档一行） | `D-010`、`D-017` | `FR-CLOSE-006`、`FR-CLOSE-010` / `AC-006` | `current`；论文仓只加一行指针 | 清单外不动，越界记 `unavailable` |
| `U-004`（经验＋待办合一） | `ADR-001`、`D-010`、`D-012` | `FR-CLOSE-006` / `AC-007`、`AC-008` | `current`；单一文件与条目形状 | 条目语言由独立读者核 |
| `U-005`（三个固定叫法、不设类型列、常驻净不增） | `D-005`、`D-012`、`D-015`、`D-018` | `FR-CLOSE-001`、`FR-CLOSE-009` / `AC-012` | `current`；术语、分节与字节口径 | 抵消差额见 `OPEN-004` |

每条 FR/AC 都能回到本表；范围修订只追加受影响映射与修订说明，不另建需求账本。

## 1. 需求解释：问题与紧迫性

五条路线现在各写各的：交接的做法在五个阶段正文里各重述一遍，交付说明的写法散在实施与关闭两处，领域规则在方法正文与格式附件里各有一份，业务仓的经验与未解待办分落在两个位置且工具仓里还有一份旧清单。读者遇到的第一件事不是"怎么做"，而是"以哪一份为准"。

同时，阶段末的动作只是"可选复盘 + 单独发布一份交接"：没有问题时不写依据，失败与取消不进同一条口径，成本记录与交接发布的先后靠记忆。业务仓的经验写入在目标文件不存在时被拒绝，于是新项目永远留不下经验。

这两件事叠在一起会造成具体损失：维护者改动一处文字后无法判断是否还有第二处权威；下一个会话读到的交接说不出"哪一步只有用户能做"；一个三轮任务结束后，业务仓里没有一条能改变下次行动的记录。因此本卡把它们做成一次收尾，而不是继续按件打补丁。

## 2. 背景、目标与范围

### 背景

本节回答：哪些既有能力与决定影响本需求。

现有 `skills/stage-reflection/SKILL.md` 是"可选复盘 + 判断待办归口"，`skills/stage-handoff/SKILL.md` 是"每阶段末一份人读交接"，`skills/stage-closeout/SKILL.md` 是"提交/PR/合并/推送/归档/清理"的物理关闭方法。五条路线的 `steps.json` 末步分别叫 `stage-handoff`（make-decision 15 步、build-code 12 步、verify-code 8 步、build-prd 6 步）与 `confirm-plan-and-handoff`（build-plan 12 步），当前事实见 `PFACT-001`。

关闭只挂两个阶段：`skills/catalog.yaml` 的 `stage-closeout.used_by_stages` 为 `["build-prd","verify-code"]`，且有契约测试把这一集合钉死（`PFACT-003`）。这一现状不是遗漏，而是 ADR-002 要保住的边界。

### 目标

- 五件各有一处正文，其余位置只写"何时读、读哪一节"。
- 每个阶段的结束动作都由主会话发起收口，交接是收口内部的一步，且仍能被下游单独按路径读取。
- 交接的下一步动作只保留只有用户能决定的事，每条给推荐、理由与不答后果。
- 业务仓经验文件真实产生、可追加、可读回、可被后继任务消费，越权时记不可用。
- 交付说明有一处正文权威，含范围、影响面与验证三段。
- 重复正文合并后，常驻必读三个文件的合计字节不高于本任务起点的合计字节。

### 范围内

方法文件（`skills/stage-reflection`、`skills/stage-handoff`、`skills/stage-closeout`、`skills/grill-with-docs` 及其格式附件）、五条路线的 `SKILL.md` 与 `steps.json`、`skills/catalog.yaml`、`docs/standard-workflow.md`、新建《交付与收口总纲》、`AGENTS.md`/`CLAUDE.md`/`GLOSSARY.md`、`docs/architecture/move-map.json`、受影响的契约与验收测试、两个业务仓的经验文件，以及本任务自己的真实 PR 说明。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：阶段执行者在任一阶段末尾走完一次收口

- **角色**：当前阶段的主会话
- **前提**：该阶段的主体工作已结束，阶段成本入口可用；五项 `steps.json` 的末步已是 `closeout`
- **触发**：执行该阶段末步
- **结果**：先归纳已做／问题／经验，再分类与归口，再为本次收口记录一个未重复计量的成本窗口，再发布并读回人读交接，最后报告结果；交接出现在 `quality/evidence/handoff/`，交接内部写明收口本轮的实际产物；步数与改动前相同
- **回写**：本场景不改写；实际执行事实留在任务事实库

### SCN-002：收口遇到无发现、失败、取消、有发现未采纳

- **角色**：当前阶段的主会话
- **前提**：本次收口确实出现上述某一类情况
- **触发**：写收口产物
- **结果**：四类各自的必备要素不同且不能互相替代——无发现带具名依据；失败带原始命令与退出；取消写已发生部分与未做部分及中断原因；有发现未采纳保留原候选与理由。四类都不写"已完成"，不会互相读成"本次无问题"；每次收口的同一成本窗口只计量一次，记录结果按真实发布状态报告：未发布才写"本阶段无记录"及原因，已发布但缺报/exit1写实际账行与缺报及影响
- **回写**：本场景不改写

### SCN-003：交付读者看一次交付说明

- **角色**：PR 审阅者
- **前提**：存在一次真实交付，其 PR 正文来自关闭方法的内容合同
- **触发**：打开 PR 正文
- **结果**：能读到范围（含故意不做什么）、影响面（含与本卡相关的已知红，并明说其余不在本卡范围）、验证（每条一条真实路径与结果）；这三个意思在仓库里只有一处正文；机器校验的 `Door` 与 `Blast Radius` 两个字段仍在
- **回写**：本场景不改写

### SCN-004：业务仓维护者与后继任务读到经验条目

- **角色**：业务仓维护者、后继任务执行者
- **前提**：业务仓根下 `specs/Improvements.md` 已存在，含至少一条按模块分节的三列条目
- **触发**：后继任务遇到同类真实问题
- **结果**：能定位到具体条目，读出该条的原始来源与状态，说出它改变了下一次什么行动；读取是默认动作而不是判断题；无可用条目时给具名理由；只有用户明确确认解决后才清理
- **回写**：本场景不改写

### SCN-005：同一事实第二次出现

- **角色**：阶段主会话
- **前提**：`specs/Improvements.md` 已有同一件事的条目
- **触发**：再次落账同一事实
- **结果**：按"下次要改的那一步 + 现象"判定为同一事实，只追加一行引用，不复制正文；判重键不用来源、任务名或时间
- **回写**：本场景不改写

### SCN-006：维护者统一文字后回归

- **角色**：维护者
- **前提**：本卡的文字与接线改动已落地
- **触发**：跑受影响的针对性测试
- **结果**：被真实事实改变的断言已按新事实更新，其余断言保持原强度；没有测试被删除或因凑绿改弱；验收矩阵里没有指向不存在文件的引用；常驻三件字节合计不高于起点
- **回写**：本场景不改写

### 状态覆盖清单

- [x] **默认态**：SCN-001 的正常收口；四类产物中"无发现"的具名依据分支
- [x] **空态**：SCN-002 的"本次无问题 + 具名依据"；`specs/Improvements.md` 条目为空时写具名理由而不是空表
- [x] **错误态**：SCN-002 的失败；经验写入失败保留原始错误；收口成本未发布写"本阶段无记录"与原因；已发布但缺报/exit1保实际账行、缺报和影响，不冒无记录或全部来源通过
- [x] **加载态**：N/A — 本任务不新增异步加载视图，方法文件是静态文本
- [x] **取消态**：SCN-002 的取消；写入中途被取消保留已发生部分
- [x] **边界态**：SCN-005 的判重边界（同一事实与不同事实各一例）；AC-012 的字节边界（持平即合格）
- [x] **权限态**：业务仓不可写、工作区外写入未授权时记 `unavailable` 与原因，不回落工具仓
- [x] **竞态**：经验文件并发改动时保留双方字节并报告，不覆盖、不猜合并；`appendRecord` 按日期生成新文件，不能当追加同一文件用（见 `PFACT-019`）

## 4. 产品事实与假设（PFACT）

下列 inherited `verified` 是原开工材料的事实时点，不代表本轮重跑；受 N4 改动的旧行号只作导航。当前方法新增 WR001 前置读取，修改 P1/P4 正文时须保留该调用条件；精确接口与受保护逐字值由实施前实读核对，取不到则 unknown，不拿旧摘要证明未变。

- **PFACT-001**：五条路线 `steps.json` 当前末步与步数分别为 make-decision 15 步 `stage-handoff`、build-plan 12 步 `confirm-plan-and-handoff`、build-code 12 步 `stage-handoff`、verify-code 8 步 `stage-handoff`、build-prd 6 步 `stage-handoff`
  - **状态**：`verified`
  - **证据或来源**：`node -e` 读取 `workflows/*/steps.json`，输出末步 `step_slug` 与 `steps.length`（本 spec 写作时的实读结果）
  - **负责人、影响**：P1 保持步数、只改末步标识与正文
  - **关联**：`FR-CLOSE-002`、`AC-002`
- **PFACT-002**：`tests/integration/main-agent-cost-closeout.node-test.mjs:186` 逐字钉死四阶段步数与末步 slug，并断言末步 `completion_evidence` 恰为 `[{kind:'phase_task_facts',uri_or_path:'facts.jsonl'}]`
  - **状态**：`verified`
  - **证据或来源**：该文件第 186 行原文
  - **负责人、影响**：P1/T001 按新事实更新这一行的 slug 值，步数与 evidence 断言保持不变
  - **关联**：`FR-CLOSE-008`、`AC-011`
- **PFACT-003**：`tests/contract/stage-closeout-skill.test.mjs:21` 断言 `used_by_stages` 恰为 `['build-prd','verify-code']`
  - **状态**：`verified`
  - **证据或来源**：该文件第 21 行原文；`skills/catalog.yaml` 中 `stage-closeout.used_by_stages` 同值
  - **负责人、影响**：任何 Phase 都不得扩大关闭的阶段集合；ADR-002 由此被机器守着
  - **关联**：`FR-CLOSE-001`、`AC-001`
- **PFACT-004**：`skills/catalog.yaml` 中 `stage-reflection` 与 `stage-handoff` 的 `used_by_stages` 均为五阶段，`stage-closeout` 为两阶段且 `standalone: true`
  - **状态**：`verified`
  - **证据或来源**：`skills/catalog.yaml` 三个条目的实际字段
  - **负责人、影响**：P1 更新 `purpose`/`local_changes` 等描述字段，`used_by_stages` 保持真实接线
  - **关联**：`FR-CLOSE-002`、`AC-002`
- **PFACT-005**：`tests/contract/stage-reflection-e2e-constructed.test.mjs` 不存在（`find` 0 命中），而 `tests/acceptance/card-03-current.mjs` 在第 50、127、191、753、760 行把它当 oracle（`ORACLE-FIX-001`），同一路径又被驱动测试 `tests/acceptance/card-03-current.test.mjs` 在第 402、408、562 行硬编码
  - **状态**：`verified`
  - **证据或来源**：`ls tests/contract/stage-reflection-e2e-constructed.test.mjs` 返回 No such file；`grep -n "stage-reflection-e2e-constructed"` 在该两文件共 8 处命中
  - **负责人、影响**：P5/T009 处置这 8 处；两文件必须同批改，否则 `card-03-current.test.mjs` 的 id/fault 期望会失配
  - **关联**：`FR-CLOSE-008`、`AC-011`、`RISK-07`
- **PFACT-022**：`tests/contract/reference-audit.test.mjs` 在本任务开工时已经失败：`docs/architecture/move-map.json` 有 10 条 `role:"test"`，而该断言的允许集合只有 `production`／`test_only`／`historical_readonly`
  - **状态**：`verified`
  - **证据或来源**：实跑 `npx vitest run tests/contract/reference-audit.test.mjs` → 1 failed，`AssertionError: expected [ 'production', 'test_only', …(1) ] to include 'test'`（`reference-audit.test.mjs:6`）
  - **负责人、影响**：该 reference-audit 定向失败独立于 `npm run check`：`package.json` 的 check 首先跑 markdownlint，旧 check 原件实际止于此且未给 exit；不能把这项断言失败说成 check 的直接原因。两项合入 N4 后本轮均未复跑；本卡不修该既有红（超出 `D-016` 范围），但新增 charter 条目必须用白名单内的 role，且交付说明的影响面必须列出这条已知红
  - **关联**：`FR-CLOSE-001`、`AC-001`、`AC-010`、`RISK-11`
- **PFACT-023**：`tests/contract/stage-closeout-skill.test.mjs` 第 27–33 行把 `skills/stage-closeout/SKILL.md` 正文的技能引用集合钉死为恰三项（`knowledge-graph`、`resolving-merge-conflicts`、`spec-specify`），并与 `catalog.yaml` 的 `dependency_closure` 精确相等
  - **状态**：`verified`
  - **证据或来源**：该文件第 27–34 行原文；实测正文 `grep -o "skills/[a-z][a-z0-9-]*/SKILL\.md"` 去重后同三项
  - **负责人、影响**：P4 只能在关闭方法内改写文字，不得新增或删除技能引用
  - **关联**：`FR-CLOSE-007`、`AC-010`、`AC-011`
- **PFACT-024**（成本支持实施前的历史读数，非当前入口限制）：`build-prd` 在 runtime 里不是正式 stage（`runtime/review/stage-materials.json` 只有四键），且原末步 `observable_result` 与 `SKILL.md` 没有阶段成本句；本轮实读 `tools/cli/measure-main-agent-cost.mjs:309-310`：`parseArgs` 的 stage 允许值逐字为 make-decision、build-plan、build-code、verify-code，build-prd 被拒为 `invalid stage`
  - **状态**：`verified`
  - **证据或来源**：原开工接线读数；本轮 read 工具读取 `tools/cli/measure-main-agent-cost.mjs:309-310`（2026-10-18），没有执行该工具或伪造失败/账行
  - **负责人、影响**：P1/T001 在 build-prd 末步说明成本不可用及 `invalid stage` 来源，保“不是正式 stage”；不伪造账行、不新增 stage 支持，五阶段实际留成本的未达成保 OPEN-009
  - **关联**：`FR-CLOSE-002`、`FR-CLOSE-003`、`AC-002`、`AC-003`、`AC-011`
- **PFACT-025**：`/Users/Hugh/Hugh/Project/PaperBuilder` 已存在三个近义文件——`Experience.md`（产品体验基线、`document_kind: experience`）、`findings.md`（日期分节发现）、`progress.md`（日期进度），且该仓 `AGENTS.md` 与 `CLAUDE.md` 对三者均无引用
  - **状态**：`verified`
  - **证据或来源**：`ls` 与 `grep -n "Experience\|findings\|progress\|经验"` 在该两文件 0 命中
  - **负责人、影响**：P2/T003 新建 `specs/Improvements.md` 会成为该仓第四处经验类文本；"经验文件"在该仓另有产品体验之义，加指针时必须写明两者区别
  - **关联**：`FR-CLOSE-006`、`AC-006`、`RISK-10`
- **PFACT-026**：`graphify-out/graph.json` 的 `built_at_commit` 在原开工读数中落后当时 HEAD 52 个提交（不是合入 N4 后的当前差值），图内 `source_file` 路径已漂移，且不建模数据文件消费
  - **状态**：`verified`
  - **证据或来源**：图的 metadata 与 `git rev-list --count 68a05d9..HEAD`；四个有界查询的返回以 `specs/archive/**` 节点为主
  - **负责人、影响**：本阶段不据图判断影响面，也不更新图（无更新授权，属关闭阶段动作）；见 `OPEN-003`
  - **关联**：`FR-CLOSE-001`、`AC-001`、`OPEN-003`
- **PFACT-006**：常驻必读三件当前字节为 `AGENTS.md` 11,630、`CLAUDE.md` 2,179、`GLOSSARY.md` 24,515，合计 38,324；本任务起点（`5e6eb6e2`）三件合计 36,861，术语表已净增 1,463
  - **状态**：`verified`
  - **证据或来源**：本任务既有字节原件；本轮合入 N4 后按文件读取字节再核仍为 11,630／2,179／24,515，起点以 `5e6eb6e2` 原件为准，不能用移动后的 HEAD 替换起点
  - **负责人、影响**：P3/T007 必须把三件合计压到 ≤36,861；做不到就如实记未达标，不写已达标
  - **关联**：`FR-CLOSE-009`、`AC-012`、`RISK-01`
- **PFACT-007**：本仓仓根 `Improvements.md` 存在（554 B），`specs/Improvements.md` 不存在
  - **状态**：`verified`
  - **证据或来源**：`wc -c Improvements.md`；`ls specs/Improvements.md` 返回 No such file
  - **负责人、影响**：P2/T002 承接旧内容到新位置后删除旧文件
  - **关联**：`FR-CLOSE-006`、`AC-006`
- **PFACT-008**：`docs/architecture/move-map.json` 有 318 条 `entries`，其中 `source: "Improvements.md"` 一条状态为 `retain`；没有任何 `docs/delivery-closeout-charter.md` 条目
  - **状态**：`verified`
  - **证据或来源**：`node -e` 读取该文件并统计 entries 数量和命中项
  - **负责人、影响**：P2 把该条改成 move 到新位置，P3 新增 charter 条目；两处由依赖顺序定序
  - **关联**：`FR-CLOSE-001`、`FR-CLOSE-006`、`AC-001`、`AC-006`
- **PFACT-009**：`/Users/Hugh/Hugh/Project/PaperBuilder` 存在，含 `specs/` 目录与 `AGENTS.md`（73 行）与 `CLAUDE.md`，但仓根与 `specs/` 下都没有 `Improvements.md`（该仓近义文件见 `PFACT-025`）
  - **状态**：`verified`
  - **证据或来源**：`ls` 与 `find -maxdepth 2 -name "Improvements*"`（0 命中）
  - **负责人、影响**：P2/T003 新建 `specs/Improvements.md` 并在该仓 `AGENTS.md` 加一行指针
  - **关联**：`FR-CLOSE-006`、`AC-006`、`OPEN-002`
- **PFACT-010**：`core/task-close.mjs` 的默认 PR 正文由 `## Summary`／`## Evidence`／`## Merge Danger` 三段渲染，`validatePrDescription`（同文件第 271 行）要求正文含独立的非空 `Door` 与 `Blast Radius` 字段，缺项报 `PR_DESCRIPTION_INCOMPLETE`
  - **状态**：`verified`
  - **证据或来源**：`core/task-close.mjs` 第 254 行与第 271 行原文
  - **负责人、影响**：P4 的三段内容合同不得删除或改名这两个机器字段；不新增或修改该代码
  - **关联**：`FR-CLOSE-007`、`AC-010`、`RISK-04`
- **PFACT-011**：`skills/stage-reflection/SKILL.md:16` 是全库唯一引用 `quality/evidence/reflection/<stage>.md` 的位置
  - **状态**：`verified`
  - **证据或来源**：`grep -rn "evidence/reflection"`（非 `specs/archive`）只命中该行
  - **负责人、影响**：P1 把该路径从"每阶段必备产物"改为"只在需要单独留档时写"，不影响其它消费者
  - **关联**：`FR-CLOSE-002`、`AC-002`
- **PFACT-012**：`tests/contract/build-prd-review-contract.test.mjs` 第 19–31 行钉死 build-prd 正文的逐字字面（`report-facts-and-handoff`、`reportFactsAndHandoff`、`readReflectionForReport`、`publishCanonicalRecord`、`reflection_facts` 等），第 36–40 行在 `SKILL.md`＋`steps.json` 合并文本上要求四条正则同时成立（"不是正式stage"、"复盘/reflection 不是正式 stage"、"不…close/操作确认/approval"、"不增加第三次内容调用"）
  - **状态**：`verified`
  - **证据或来源**：该文件第 18–40 行原文
  - **负责人、影响**：P1/T001 改动 build-prd 末步时保留这些字面与四条正则的语义，否则定向测试变红
  - **关联**：`FR-CLOSE-002`、`FR-CLOSE-008`、`AC-002`、`AC-011`
- **PFACT-013**：`tests/contract/stage-runtime-reflect-entry.test.mjs:17` 钉死 `run` 的 `reflect` 动作已移除，并断言不创建 `quality/stage-reflection` 目录
  - **状态**：`verified`
  - **证据或来源**：该文件第 17 行原文
  - **负责人、影响**：收口不得新增 `run reflect` 公共动作，也不得写 `quality/stage-reflection`
  - **关联**：`FR-CLOSE-002`、`FR-CLOSE-008`、`AC-002`、`AC-011`
- **PFACT-014**：`tests/n2-skill-catalog-portability.test.mjs:16` 的 `SAMPLES` 含 `stage-reflection`，即该技能必须能单目录搬运到仓外空目录后正文引用仍可解析
  - **状态**：`verified`
  - **证据或来源**：该文件第 16 行原文
  - **负责人、影响**：P1 改写该技能时不得写入任务绝对路径或宿主专用位置
  - **关联**：`FR-CLOSE-002`、`AC-002`、`AC-011`
- **PFACT-015**：仓库不存在 `apps/` 目录，全仓 `*.tsx`/`*.vue`/`*.jsx` 计数为 0（排除 `node_modules` 与 `specs/archive`）
  - **状态**：`verified`
  - **证据或来源**：`ls -d apps`（不存在）与 `find ... | wc -l` 输出 0
  - **负责人、影响**：本任务为非 UI 项目库存事实；见「测试标准／验收对象」
  - **关联**：`FR-CLOSE-001`、`AC-001`
- **PFACT-016**：现有阶段成本入口为 `tools/cli/measure-main-agent-cost.mjs`，其集成测试钉死 27 列账行与 `start-ref` 的 fail-closed 行为
  - **状态**：`verified`
  - **证据或来源**：`tests/integration/main-agent-cost-closeout.node-test.mjs` 的 `readLedger` 与首笔记录用例
  - **负责人、影响**：收口的"记录阶段成本"一步消费该入口，除本次明确批准的build-prd成本标签与来源适配外，不改其计量/窗口/记录行为
  - **关联**：`FR-CLOSE-003`、`AC-003`
- **PFACT-017**：`skills/stage-handoff/SKILL.md` 现有 13 区块内容合同，其中"下一步动作"与"可自行判断与必须问用户的边界"两区块是 D-008 的落点
  - **状态**：`verified`
  - **证据或来源**：`skills/stage-handoff/SKILL.md` 第 22 行的区块清单原文
  - **负责人、影响**：P1/T001 在这两个区块补硬标准，不新增第 14 区块
  - **关联**：`FR-CLOSE-004`、`AC-004`
- **PFACT-018**：`skills/stage-handoff/SKILL.md` 现有"核心方案"区块是 D-009 写集说明的落点
  - **状态**：`verified`
  - **证据或来源**：同文件第 22 行区块清单与实际正文
  - **负责人、影响**：P1/T001 在该区块补一行写集说明，不新建校验器
  - **关联**：`FR-CLOSE-005`、`AC-005`
- **PFACT-019**：现有 `appendRecord` 只按 UTC 日期与当日序号生成新文件，不能用于"追加同一文件的读-改-写"
  - **状态**：`verified`
  - **证据或来源**：`skills/stage-handoff/SKILL.md` 第 16 行对该工具的说明与 `safe-write` 的既有行为；decision-log 第 34 行同结论
  - **负责人、影响**：经验文件写入必须用原子写入做读-改-写，不能调 `appendRecord`
  - **关联**：`FR-CLOSE-006`、`AC-006`
- **PFACT-020**：`workflows/build-code/SKILL.md` 第 70 行与第 77 行当前承载 PR 描述的 `Door`/`Blast Radius` 合同
  - **状态**：`verified`
  - **证据或来源**：该两行原文
  - **负责人、影响**：P4 把内容合同主体移到关闭方法，build-code 只留一句事实，并保留对 `PR_DESCRIPTION_INCOMPLETE` 的引用
  - **关联**：`FR-CLOSE-007`、`AC-010`
- **PFACT-021**：六项外部采用的本地等价物已在 `quality/evidence/decision-log-refs/research.md` 第 2 节逐条核实（13 处），落点文件均为既有文件
  - **状态**：`inferred`
  - **证据或来源**：decision-log 第 288 行的风险记述与外置原件指针；本 spec 未逐条重跑该调研
  - **负责人、影响**：P1–P4 落地时逐项对照该原件，不新增技能或文档
  - **关联**：`FR-CLOSE-010`、`AC-013`

## 5. 功能需求

### 五件各归一处与阶段收口（CLOSE）

维护者在改动一处规则前，先要能确定"正文在哪"。因此五件各自保留当前已有的方法文件作为正文位置，其余位置只写调用条件与读哪一节；《交付与收口总纲》只把入口与边界集中成索引，不承载第二份规则。阶段的结束动作统一为收口，交接从"独立末步"变成"收口内部的发布动作"，但仍能被下游按绝对路径单独读取——这两件事同时成立，才算交接既属于收口又没被收口锁死。

**五件逐件：权威、阶段消费者与成败边界**（本卡与 PRD 的口径对照：PRD 写作"领域、worktree/task、handoff、close、PR"五件，其中 `close` 与 `PR` 在本卡拆成"阶段收口与关闭"和"交付说明"两件，内容不丢；`reflection` 按 PRD 作为既有收口主体并入"阶段收口"一条。）

| 件 | 唯一正文位置 | 各阶段消费者 | 许可与边界 | 成功与失败 |
| --- | --- | --- | --- | --- |
| 领域词表 | `skills/grill-with-docs/GLOSSARY-FORMAT.md` 的格式与判据段（`skills/grill-with-docs/SKILL.md` 只留指针） | make-decision（grill 写词）、其余阶段只读 | 只收领域词、就地更新、边界变化才写；只改本仓 `GLOSSARY.md` | 成功＝词表按格式落盘并读回；失败＝出现第二份格式规则或词义冲突 |
| 工作区与任务 | `docs/standard-workflow.md` 的「工作区与任务」节 | 五个阶段（建任务、申报写集、收尾） | 不改任务创建/关闭实现；术语权威在 `GLOSSARY.md` | 成功＝任务 id、分支名与写集申报三件事各有一处文字；失败＝与实现不一致而无记录 |
| 人读交接 | `skills/stage-handoff/SKILL.md` | 五个阶段（收口内发布）；下游会话（单独读取） | 只发布、不改写历史；`appendRecord` 的 create-only 与读回保留 | 成功＝交接可复制、四类要素齐、下游能定位；失败＝交接成为门或第二进度权威 |
| 阶段收口与关闭 | 收口正文在 `skills/stage-reflection/SKILL.md`；关闭正文在 `skills/stage-closeout/SKILL.md` | 收口：五个阶段；关闭：只有 `build-prd` 与 `verify-code` | 收口不产生质量结论、不是关闭许可；关闭仍在原授权点触发 | 成功＝每阶段有收口事实或原始失败；失败＝新增门、关闭扩面、`close`/`PR` 越权 |
| 交付说明 | `skills/stage-closeout/SKILL.md` 的 PR 正文内容合同 | 只有真正执行关闭的两个阶段生成；实施阶段只读一句事实 | 机器字段 `Door`／`Blast Radius` 不动；不新增 PR 触发点 | 成功＝范围/影响面/验证三段可读且正文一处；失败＝两处并存或验证是空话 |

**PRD 旧 AC 到本卡 AC 的对照**（证明旧 T8/T10 各 AC 都在本卡整卡验收，不是只交主体）：

| PRD 旧 AC | 要求（原义） | 本卡承接 | 状态 |
| --- | --- | --- | --- |
| AC-T8-1 | 五件逐件真实可达 | `AC-001` | 承接 |
| AC-T8-2 | 各 stage 有收口事实或原始失败；handoff 已有独立 consumer 保持 | `AC-002`、`AC-003` | 承接 |
| AC-T8-3 | 钉死测试按预期调整且仍能真报失败 | `AC-011` | 承接 |
| AC-T8-4 | `npm run check` 通过 | 无（旧原件止于 markdownlint 的 22 项错误，含多个 skills 与 N2；实际退出码缺失，合入 N4 后未复跑） | **未达成**，见 `OPEN-006`；本轮不改承诺或扩范围 |
| AC-003（父任务） | 把横切事从 10 处收敛为 1 处；逐字重复处数下降 | `AC-001`、`AC-012` | 承接（处数只作事实记录，不作评分） |
| AC-T10-1 | 真实业务仓先创建再追加、旧内容保留 | `AC-006` | 承接 |
| AC-T10-2 | 无发现具名；每条最简"问题／原始来源／真实选择或未解状态" | `AC-003`（无发现）、`AC-006`／`AC-007`（条目含来源与状态） | 承接 |
| AC-T10-3 | 复用收口，未新增 stage | `AC-002` | 承接 |
| AC-T10-4 | 越界不当功能失败 | `AC-009` | 承接 |
| AC-T10-5 | 动作项形态 | `AC-004` | 承接 |
| AC-009（父任务） | 已授权业务仓跑一次完整收口；越界记 `unavailable` | `AC-006`、`AC-009` | 承接 |
| T8/T10 失败条件 | 无问题被判失败／新增门／close 或 PR 越权／删空原断言／重建退役 reflection JSON | `AC-002`、`AC-003`、`AC-009`、`AC-011` | 承接 |

- **FR-CLOSE-001**：五件（领域词表、工作区与任务、人读交接、阶段收口与关闭、交付说明）每件只有一处写明"做什么、边界、失败边界"的正文，其余位置只写何时调用与读哪一节；新建的《交付与收口总纲》只做位置、到达条件与边界指针，删掉它时各方法仍能独立工作；关闭仍只在规划收尾与终末验证两个阶段触发
  - **范围边界**：包括五件正文位置、总纲索引、适用阶段列；不包括新增阶段、门或第二套关闭流程
  - **依据**：`R-001`、`D-003`、`D-004`、`D-005`、`D-018`、`ADR-002`、`PFACT-003`、`PFACT-008`、`PFACT-015`
  - **场景**：`SCN-003`、`SCN-006`
  - **验收**：`AC-001`
- **FR-CLOSE-002**：五个阶段的结束动作都由主会话发起收口，步骤标识与正文同时改为"收口"而步数不变；交接在收口内部发布，且下游仍可按交接原件路径单独读取续接
  - **范围边界**：包括五条路线的 `SKILL.md`、`steps.json` 与 `catalog.yaml` 描述字段；不包括新增公共动作、`quality/stage-reflection` 目录或第二套末步
  - **依据**：`R-002`、`D-006`、`PFACT-001`、`PFACT-011`、`PFACT-013`、`PFACT-014`
  - **场景**：`SCN-001`
  - **验收**：`AC-002`
- **FR-CLOSE-003**：收口的四类产物各有不同且不能互相替代的必备要素，四类都不写成"已完成"；阶段成本在每次收口的同一窗口只计量一次，按真实发布状态报告：未发布才写出"本阶段无记录"与原因，已发布但缺报/exit1写实际账行、缺报与影响
  - **范围边界**：包括四类要素、顺序与成本记录位置；不包括新增状态字段或评分器
  - **依据**：`R-003`、`D-007`、`PFACT-016`
  - **场景**：`SCN-002`
  - **验收**：`AC-003`
- **FR-CLOSE-004**：交接的下一步动作只含只有用户能做的决定、需要用户给的授权、不可逆动作、只有用户能提供的信息或凭证四类；每条给推荐、理由与不答后果；不知道写 `unknown`；只链真实存在的产物；同一事实不在正文与视觉各说一次
  - **范围边界**：包括动作项形态与两类负例，以及 P3/T007 在 `AGENTS.md` 的一句治理判据/方法指针与真实 consumer 读回；不包括字数上限、视觉规格或固定框数
  - **依据**：`R-008`、`D-008`、`PFACT-017`
  - **场景**：`SCN-001`
  - **验收**：`AC-004`
- **FR-CLOSE-005**：交接的核心方案段写出本次改了什么、故意没改什么及理由、潜在风险与影响面；写集与真实 diff 不一致时以真实 diff 为准并在审查处置里写明
  - **范围边界**：包括一行写集说明与上文三段，以及 P3/T007 在 `AGENTS.md` 的一句治理判据/方法指针与真实 consumer 读回；不包括贴完整 diff 或新建校验器
  - **依据**：`R-009`、`D-009`、`PFACT-018`
  - **场景**：`SCN-001`
  - **验收**：`AC-005`
- **FR-CLOSE-006**：业务仓经验文件的唯一位置是业务仓根下 `specs/Improvements.md`；每次写入前先**核业务仓授权与现有文件**（该仓是否在已授权写集内、文件当前字节与是否已被他人改动），只有确实有可落账内容时才创建，**没有内容就不造空文件、不写虚假教训**；存在时追加且保留旧内容与他人条目；写入前读回、写完读回并报告实际路径；既有的回写方法与未解项读取规则保留，只替换"文件已有才写"和"未授权时回落工具仓"两条；同一事实按"下次要改的那一步 + 现象"判定，重复时只追加一行引用；越界或未授权记 `unavailable` 与原因，不写回工具仓
  - **范围边界**：包括位置、形状（按该仓模块分节、三列小表）、每条必须能定位原始来源（写在问题句的来源括号或状态里，缺来源写 `unknown` 而不是省略）、判重键、并发处置与读取默认动作；不包括第二份账本、机器状态或自动清理
  - **依据**：`R-004`、`R-005`、`R-006`、`R-013`、`R-014`、`ADR-001`、`D-010`、`D-012`、`PFACT-007`、`PFACT-009`、`PFACT-019`
  - **场景**：`SCN-004`、`SCN-005`
  - **验收**：`AC-006`、`AC-007`、`AC-008`、`AC-009`
- **FR-CLOSE-007**：交付说明的内容合同只有一处正文（关闭方法），含范围（必须写故意不做什么）、影响面（含与本卡相关的已知红并明说其余不在本卡范围）、验证（每条一条真实路径与结果）；实施阶段只写一句事实说明本阶段不生成交付说明；PR 创建、推送与合并仍在原授权点触发；机器校验的 `Door` 与 `Blast Radius` 字段保留
  - **范围边界**：包括三段内容与跨阶段指针；不包括提交信息格式、强制 ready 或新增 PR 触发点
  - **依据**：`R-001`、`R-009`、`D-011`、`PFACT-010`、`PFACT-020`
  - **场景**：`SCN-003`
  - **验收**：`AC-010`
- **FR-CLOSE-008**：凡因本次文字或接线变化而失败的契约与验收断言，同批更新为新的真实事实，只改被真实事实改变的那部分，其余断言保持原强度；验收矩阵中指向不存在文件的引用按"改指向真实测试／改成可核事实／标未覆盖"处置，不造只为满足引用的测试
  - **范围边界**：包括钉死断言与验收矩阵引用；不包括删除测试、改弱断言或为凑绿改行为
  - **依据**：`R-007`、`R-012`、`R-015`、`D-013`、`D-014`、`PFACT-002`、`PFACT-005`、`PFACT-012`
  - **场景**：`SCN-006`
  - **验收**：`AC-011`
- **FR-CLOSE-009**：重复正文合并到唯一位置后，被替代正文与新增文档按本任务批次 7 的明确数值选择分开记账、两份数字都给出（不是一般文档质量量尺）；被替代正文字节不增；常驻必读三个文件合计字节不高于本任务起点；每个合并段落留一条前后对照（旧位置、新位置、删了什么、保留了什么条件）
  - **范围边界**：包括字节口径与前后对照；不包括靠搬到未统计文件凑减法、删掉失败与授权条件
  - **依据**：`R-010`、`D-015`、`PFACT-006`
  - **场景**：`SCN-006`
  - **验收**：`AC-012`
- **FR-CLOSE-010**：六项外部采用按逐项落点表各自生效，声明的落点文件真实存在且行为可观察，未采用部分逐条有排除理由；不因上游有就新增检查器、机器标签、状态对象或新文档
  - **范围边界**：包括六项的可观察判据与排除项；不包括整包照抄或新增技能
  - **依据**：`R-009`、`D-017`、`PFACT-021`
  - **场景**：`SCN-001`、`SCN-003`、`SCN-004`
  - **验收**：`AC-013`

## 6. 模块划分

### 收口主体与人读交接

实施顺序：P1/T001 先交完整收口→交接→五条路线消费者闭环；P2 消费该固定方法，P3 消费 P2 的迁移登记，P4 消费 P1 的阶段正文。各单元自身判结果，不按物理文件或层拆假增量；P5 修悬空引用，P6 只聚合并补必要未闭环 case。

- **负责什么**：把阶段末的归纳、分类归口、成本记录、交接发布与结果报告串成一次动作，并规定四类产物与动作项的硬标准
- **对外提供什么**：可被下游单独读取的人读交接；四类产物的必备要素；动作项与写集说明的形态
- **依赖谁**：现有阶段成本入口、现有安全写入、五条路线的末步接线
- **测试边界**：末步标识与步数由一条契约测试重放；交接内容由真实交付的交接原件读回

### 业务仓经验文件

- **负责什么**：把一个业务仓的未解经验与待办落成一份可追加、可读回、可判重的文件
- **对外提供什么**：按模块分节的三列小表条目与状态
- **依赖谁**：业务仓自身的 `specs/` 目录与写权限
- **测试边界**：本仓文件与引用由契约测试重放；论文仓写入由真实写入原件核

### 五件索引与常驻字节

- **负责什么**：把五件的入口与边界集中成索引，并把重复正文收一处后把常驻三件字节压回起点以内
- **对外提供什么**：总纲；标准工作方法的「工作区与任务」节；领域规则唯一格式附件
- **依赖谁**：五件各自的方法正文
- **测试边界**：总纲结构、适用阶段列与常驻字节由契约测试重放

### 交付说明内容合同

- **负责什么**：把交付说明的三段内容与机器字段的关系写在一处
- **对外提供什么**：PR 正文的内容要求与实施阶段的一句事实说明
- **依赖谁**：既有 PR 正文渲染与校验（`core/task-close.mjs`）
- **测试边界**：三段字段与两个机器字段由契约测试重放；真实可读性由本任务自己的 PR 说明核

## 7. 关键实体

- **收口产物**：
  - **定义**：一次阶段收口在交接正文里留下的四类记录之一
  - **字段和约束**：类别∈无发现／有发现未采纳／失败／取消；无发现必含具名依据；失败必含原始命令与退出；取消必含已发生与未做；未采纳必含原候选与理由。四类互不替代，都不写"已完成"
  - **关系**：一次收口可以同时出现多类，但每类各自完整；阶段成本按本次收口的未重复计量窗口另记，不属四类；同阶段续测可追加非重叠窗口并保留原行
- **业务仓经验条目**：
  - **定义**：`specs/Improvements.md` 里按模块分节的三列小表的一行
  - **字段和约束**：问题／下次遇到什么情况会改变行动／状态（已落账、待用户决定、已解决（用户确认）、unknown）；不设类型列；判重键是"下次要改的那一步 + 现象"
  - **关系**：同一事实重复出现时只追加一行引用；来源写在问题句括号或状态里，不作判重键
- **交接动作项**：
  - **定义**：交接里交给用户的一件事
  - **字段和约束**：类别∈决定／授权／不可逆动作／只有用户能提供的信息或凭证；每条有推荐、理由、不答后果；不知道写 `unknown`；只链真实存在的产物
  - **关系**：代理自己还能做的事不进动作项；同一事实不与正文重复一遍

## 8. 数据和生命周期

- **数据粒度**：一次阶段收口对应一份交接原件；一个业务仓对应一份 `specs/Improvements.md`
- **数据时效**：交接是当前材料与任务事实的派生视图，每次收口 create-only 发布一份；经验文件跨任务累积
- **缺失或迟到**：交接发布失败保留原始错误与目标路径，不声称生成新件；经验文件不存在时创建而不是拒绝写入
- **预览与正式**：本任务不涉及预览态；本阶段计划确认与最终 close 的一次真实范围确认各保原职责，`confirm` 不授权 Git
- **当前与历史**：历史交接原件、历史 `Improvements.md` 内容、历史 `specs/archive/**` 只读保留；仓根旧经验文件迁走后删除且不留占位
- **归属与清理**：交接归当前 task 的证据目录；经验文件归业务仓维护者；只有用户明确确认解决后才清理条目

## 9. 兼容性预留

- **既有消费方**：`runtime/stage/stage-skill-runtime.mjs` 与 `runtime/task/portable-workflow-run.mjs` 读 `steps.json` 的 `step_id`/`step_slug` 并要求唯一非空；本次只改末步 slug 值，不改结构、不新增字段
- **命名预留**：末步标识用 `closeout`，不使用 `stage-closeout`——后者是物理关闭技能的名字，且只在两个阶段调用（`PFACT-003`），同名会让读者误以为关闭被铺到五个阶段
- **容器预留**：N/A — 不新增持久化容器或 schema
- **状态预留**：保持既有交接 13 区块与任务事实行形状；不新增状态机或第八状态
- **扩展边界**：本期只做现有五条路线的收尾；新四级路线的交付、收口与经验接线归 N8（`D-016`）

## 10. 明确不做与默认必须成立

### 明确不做

- 新四级路线及其交付、收口、经验接线；归 N8（来源 `R-011`、`D-016`）。
- 检查工具接线；归对应卡（来源 `D-016`）。
- 任何新阶段、新门、第二进度权威、新 schema 或持久对象（来源 `R-012`、`D-006`、`D-010`）。
- 复活已退役的旧 JSON 复盘产物与其守卫（来源 `R-012`、`D-013`）。
- 把关闭铺到五个阶段（来源 `ADR-002`、`PFACT-003`）。
- 把五件正文搬进《交付与收口总纲》（来源 `D-018`）。
- 把条目数量、字数上限或审查轮次当质量判据（来源 `D-012`、`D-008`）。
- 修改 `core/task-close.mjs` 的 PR 正文渲染与校验（来源 `D-016`、`PFACT-010`）。
- 修复 `tests/contract/reference-audit.test.mjs` 的既有红（10 条 `role:"test"` 与白名单冲突）；该红与本卡无关，只如实记入影响面（来源 `D-016`、`PFACT-022`）。
- 重写 `tests/acceptance/card-03-current.mjs` 整体陈旧的 50 条路径；只处置 `ORACLE-FIX-001` 的 8 处，其余交原 owner（来源 `OPEN-005`）。
- 改动 `/Users/Hugh/Hugh/Project/PaperBuilder` 的 `Experience.md`、`findings.md`、`progress.md` 或 `CLAUDE.md`（来源 `PFACT-025`）。
- 自动 prune 历史条目与全仓同步（来源 PRD 的可后置技术项段："自动prune/全仓同步不采用"；prune 只在用户明确确认已解决后执行）。
- 用"末尾六项采用汇总"替代各 consumer 的首次验收（来源 PRD 的 AC 段："不能以末尾采用汇总未做为缺项理由"）。

### 默认必须成立

- 已退役的 `run reflect` 公共动作保持移除，不创建 `quality/stage-reflection`（关联 `FR-CLOSE-002`／`AC-002`）。
- `stage-closeout.used_by_stages` 保持恰为 `["build-prd","verify-code"]`（关联 `FR-CLOSE-001`／`AC-001`）。
- `stage-reflection` 保持可单目录搬运，不写入任务绝对路径（关联 `FR-CLOSE-002`／`AC-002`）。
- PR 正文仍含独立的非空 `Door` 与 `Blast Radius` 字段（关联 `FR-CLOSE-007`／`AC-010`）。
- 历史原件不重写、已引用件不删不覆写（关联 `FR-CLOSE-008`／`AC-011`）。
- `skills/stage-closeout/SKILL.md` 正文的 `skills/*/SKILL.md` 引用集合保持恰三项（关联 `FR-CLOSE-007`／`AC-011`）。
- `build-prd` 仍被描述为"不是正式 stage"，且 `runtime/review/stage-materials.json` 保持四键（关联 `FR-CLOSE-002`／`AC-011`）。
- `docs/architecture/move-map.json` 的 `task_id` 不变、每条 `destination` 唯一、新增条目 role 取白名单值（关联 `FR-CLOSE-001`／`AC-001`）。

## 验收流程

本节只描述流程，不复制 AC 的通过或失败判据。验收作者/独立判定者先读 `docs/architecture/test-asset-governance-rules.md#验收标准可执行形式der-01der-11r-001fr-16ac-16`，按真实好坏例、同尺与非作者判断；缺匿名比较原件不冒盲评完成。

从 `decision-log.md` 的 `## 验收面` 交接索引取可观察接口与成功失败边界，再从场景入口（第 3 节）定位 FR（第 5 节）、`Appendix A` 的同号 AC、所属 Phase 的 `gate_cmd` 与可回读证据。AC 编号两处同号：decision-log 的 AC-001…AC-013 与本文件 `Appendix A` 一一对应。需要回到原件时按 decision-log 的「外置事实索引」到达条件读唯一 ref，基准目录是任务库根而不是工作区 cwd。

## 测试标准

本节声明本任务自己的测试面与不测理由；机器作者检查沿既有 `validatePostPhaseContract({spec,index,phases})` 与 `checkSkillConsistency(root)` 记录实际 errors/reports/unknown，report-only 不因退出 0 变质量通过，也不改退出或加门。精确命令留在各 Phase，`Appendix A` 只指同一 oracle 与预期证据。

| 测试面 | 适用性 | 理由与 oracle | 证据类型 | 覆盖边界 |
| --- | --- | --- | --- | --- |
| 阶段接线契约（末步 slug、步数、catalog、退役守卫） | 适用 | 末步改名是本次唯一会改变机器可读事实的改动；oracle `ORACLE-P1-CLOSEOUT-STEP` 同一条命令重放契约 RED/GREEN | 命令 + 退出 + 原始输出 | 只证明接线与文本要点，不证明执行者真的按收口走；五阶段真实读回或具名受控方法试行另存原件 |
| 业务仓经验文件契约（位置、文本形状、迁移登记） | 适用 | `ORACLE-P2-EXPERIENCE-FILE` 实读只检查位置、文本与登记 | 命令 + 退出 + 原始输出；另需方法实跑原件 | 该测试不调用 writer，不执行创建、追加、判重或并发；两仓实写与一次性 fixture 方法试行须另核 |
| 五件索引与常驻字节契约（总纲结构、适用阶段列、三件合计字节） | 适用 | 字节与表格结构是确定性事实；oracle `ORACLE-P3-CHARTER` | 命令 + 退出 + 字节读数 | 不证明总纲语义可用，语义由独立读者核 |
| 交付说明内容合同契约（三段字段、两个机器字段保留、实施阶段只留一句事实） | 适用 | 机器字段缺失会直接让 PR 创建失败，是可证伪行为；oracle `ORACLE-P4-DELIVERY-NOTE` | 命令 + 退出 + 原始输出 | 不证明真实 PR 说明可读，可读性由真实 PR 核 |
| 验收矩阵引用完整性（引用文件真实存在） | 适用 | 悬空引用是可确定性判定的；oracle `ORACLE-P5-ACCEPTANCE-MATRIX` | 命令 + 退出 + 原始输出 | 只证明文件存在，不证明引用到的用例名仍存在 |
| 钉死测试保全（node:test 集成文件） | 适用 | 步数与末步 slug 的既有断言必须随事实更新而不减弱；复用 `main-agent-cost-closeout.node-test.mjs` | 命令 + 退出 | 只覆盖该文件断言，不覆盖全部契约 |
| 方法与文档的语言质量 | 适用但不由命令判定 | 独立读者按完整正反输入核可执行性；主张改前改后质量时沿既有匿名同尺合同 | 独立读回、样本与判定原件 | 普通 findings 不冒匿名盲评；字节不证明质量，未执行比较就不宣称改善 |
| `npm run check` 整体 | 父承诺仍未达成，非本轮重跑项（`OPEN-006`） | 旧原件 `quality/tests/2026-10-18-npm-run-check-baseline.output:7-35` 显示 markdownlint 22 错误，含多个 skills 与 N2 材料；未出现后续结构检查，exit 字段仍为占位，不能声称原件有 exit 1 | 引用旧输出；本轮只做有界检查 | N4 后全量结果 unknown；不等于 reference-audit 失败，也没有豁免父 AC-T8-4 |
| 浏览器可见面 | 不适用 | 本仓无 `apps/`、无 `*.tsx`/`*.vue`/`*.jsx`（`PFACT-015` 为原库存读数，本轮未全仓再计数），本任务不产生任何页面或交互 | N/A — 具名理由同上 | 不涉及 |
| 真实 PR 创建与合并 | 需真实环境 | 只在 verify-code 的真实关闭阶段发生，依赖 `OPEN-001` 的授权范围 | 真实命令与返回 | 本阶段不执行 |

### 验收对象

非 UI 判定的三源事实：原始要求是本任务用户指令与 PRD N7 段（无页面/交互请求）；项目库存是本仓无 `apps/`、无前端框架文件（`PFACT-015`）；已接受计划与实际前端改动是本次计划不含任何前端文件。原要求与当前声明写集均不含 UI；库存项沿原开工 PFACT-015，本轮不重新作全仓计数。独立核验者须实读三源、核当前范围无冲突后才给 `ui_scope:false` 并选择 CLI 分支；此段不预填检查已执行。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n7-route-delivery-closeout-experience-20261018",
  "state": {"phase": "planning", "execution": "not_run", "description": "当前 spec 与六份独立 Phase 草稿；不含页面或运行服务"},
  "cli": {
    "command": "npx vitest run tests/contract/stage-closeout-step-contract.test.mjs",
    "entry_ref": "spec_appendix",
    "sample_ref": "raw_requirement",
    "oracle_ref": "spec_appendix"
  },
  "owner": "build-plan 主会话（计划作者）"
}
```

`entry_ref`／`sample_ref`／`oracle_ref` 指向本次调用 `context.sources` 中的同名材料键；检查只核最小字段与引用可解析，不认证来源语义、不证明环境健康或业务效果。检查执行记录（对象输入、三源引用与实际读取范围、返回、执行原件）由独立核验者保存于任务库 `quality/tests/`；本轮 spec 作者未执行对象函数，不宣称已检查。`raw_requirement` 为 PRD N7 与本次用户指令，`spec_appendix` 为本节对象/Appendix A 的实际文本；核验者还须独立提供实读 `project_inventory` 与当前计划来源，不能拿自选 non_UI 标签代替三源。

## 架构边界

产品边界：五件各自的方法正文是产品行为的唯一表述位置；总纲只是导航。
工程边界：本次改动集中在 `skills/`、`workflows/`、`docs/` 三处文本与七个机器可读文件（五个 `steps.json`、`skills/catalog.yaml`、`docs/architecture/move-map.json`），以及下列精确业务仓与测试路径；不新增运行时模块、不新增公共命令、不改 `runtime/` 下任何文件。
全局架构方案与真实消费者在下方「实现设计」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：原始需求与 decision-log 只作为来源映射，不在实现设计中创建第二份需求账本。
- **现状与目标差异**：现状是"可选复盘 + 独立末步交接 + 经验文件在仓根且目标存在才写 + 交付说明散在两处"；目标是"每阶段收口主体 + 收口内发布交接 + 经验文件在 `specs/` 且不存在则创建 + 交付说明一处正文"。
- **读取顺序**：先读 `skills/stage-reflection/SKILL.md`（收口主体），再读 `skills/stage-handoff/SKILL.md`（发布与内容合同），再读 `workflows/*/steps.json` 与 `skills/catalog.yaml`（接线），最后读 `skills/stage-closeout/SKILL.md` 与 `workflows/build-code/SKILL.md`（交付说明）。
- **代码锚点**：
  - `skills/stage-reflection/SKILL.md`：现有 `## 方法`（1–4）、`## 用户选择后的归口`、`## 判断词表与完成检查`、`## 固定来源、本地偏离与更新入口` 与 `## 同仓方法依赖`。
  - `skills/stage-handoff/SKILL.md`：现有 `## 方法`（1–7）、`## 信息来源`（13 区块表）、`## 回读结果`、`## 结束条件与边界`。
  - `skills/stage-closeout/SKILL.md`：现有 `## 4. 提交、推送任务分支与PR` 的正文要求段落。
  - `workflows/*/steps.json`：末步对象的 `step_id`／`step_slug`／`observable_result`／`completion_evidence`。
  - `skills/catalog.yaml`：`stage-reflection`、`stage-handoff`、`stage-closeout` 三条的 `purpose`／`design_idea`／`local_changes`／`used_by_stages`／`dependency_closure`。
  - `core/task-close.mjs`：`buildDefaultPrDescription` 的 `render` 与 `validatePrDescription`（只读锚点，禁止改动）。
  - `runtime/task/portable-workflow-run.mjs`：读 `steps.json` 时要求 `step_slug` 唯一非空（只读锚点）。
- **运行条件**：Node v24.14.0（实测）；vitest 2.1.9（由 `package-lock.json` 安装后实测通过）；`node:test` 用于 `*.node-test.mjs`；Git 2.39.5。

### 接口与失败语义

- **选择的架构方案**：按 simplicity-guard P1/P2 复用现有 owner 与普通原子写；spec/Phase 分权独占，P2→P3 和 P1→P4 的共享路径由依赖定序。无须新协调账本、writer、reader、validator 或永久恢复状态。重复经验用现有条目引用承接，中断保真实发生部分；并发无法确认归属就保双方并报告，不声称既有原子写已给无丢失保证。复用现有三个方法文件与五条路线文件，只改文本与既有字段值；经验文件复用既有原子写入，不新增读写器；交付说明复用既有 PR 正文渲染。放弃"新建一份总纲承载规则"的方案，因为那会长出第二份权威（`RISK-08`）。
- **模块职责**：`stage-reflection` 消费阶段事实产出收口结论与归口；`stage-handoff` 消费收口结论产出人读交接；`stage-closeout` 消费授权与真实交付产出 PR 正文与物理收尾；`steps.json`/`catalog.yaml` 只描述接线，不承载行为。
- **接口与数据流**：阶段事实 → 收口（归纳→归口→记成本）→ 交接正文 → `appendRecord` 发布 → 读回路径；业务仓问题 → 归口判断 → `specs/Improvements.md` 读-改-写 → 读回；授权 → 关闭方法 → PR 正文（含 `Door`/`Blast Radius`）→ 推送。
- **失败语义**：末步 slug 与测试期望不一致 → 保定向非零原件、回该 Phase 同任务修复，不把检查变成继续修复许可证；交接发布失败 → 保留原始错误与目标路径，不声称生成；经验文件写入失败 → 保留原始错误，成功场景记未完成；业务仓不可写 → 记 `unavailable` 与原因，不回落工具仓；PR 正文缺 `Door`/`Blast Radius` → `PR_DESCRIPTION_INCOMPLETE`，回描述 producer 补齐；字节未达线 → 记未达标，不写已达标。
- **宿主审查接线限制**：真实 `tools/cli/stage-runtime.mjs:540-560,1171-1185` 只接私有宿主 `services.resolveReviewReadScope`，材料/request 不能自授 roots/authority。当前未取得 N7 对应真实宿主 callback/config；普通 single-repo 默认路径不能接纳论文仓两路径和任务库七个绝对写路径，013 的 default 错误保留。直接向 validator 传精确 scope 只是结构诊断，不是宿主授权或生产接线已完成；跨仓审查条件 unavailable 见 OPEN-010，不能写默认合同通过。
- **新增控制面**：N/A — 无新增公共命令、schema、持久对象或环境变量。

### 本阶段已定下的三处口径（来源与理由）

决策日志给了方向，但有三处会直接改变实施结果，本阶段按已确认材料定下并在此写明依据：

- **末步标识取 `closeout`**：`stage-closeout` 已是物理关闭技能名且只在两个阶段调用（`PFACT-003`），同名会让读者把关闭误读成铺到五阶段（`ADR-002`、`RISK-03`）；`closeout` 只在本 workflow 内定位该步骤，生产读者只做唯一性校验（`PFACT-004`）。
- **`quality/evidence/reflection/<stage>.md` 从"每阶段必备产物"降为"需要单独留档时写"**：`OI-002` 定"本次无问题的依据只写在交接正文一处"，若每阶段仍强制写一份复盘件，同一事实就有两处（`PFACT-011` 显示该路径无其它消费者）。收口结论的落点因此统一为交接正文，写失败与未写仍按既有口径披露。
- **`build-prd` 成本缺口显式化**：`D-006` 的顺序保留；PFACT-024仅记实施前四标签限制。当前CLI已接受build-prd成本标签，复用唯一旧账本，正式stage仍只有四个，不新增runtime支持。build-prd材料缺权威机器引用时为 `unavailable:build_prd_material_refs_not_supplied`，无正式stage审查事实为 `not_reported:no_stage_fact`；exit1也可能已发布缺报行，按读回区分已发布/未发布。五路线各一次具名真实方法试行与成本入口/窗口验证分别核；当前实际stage末才由主会话record并核from/until/来源，未发生的其它stage不造行。缺试行、实际当前stage成本或来源时逐项保OPEN-009对应incomplete，不要求本任务重走五次正式阶段结束。

### 全局文件边界与依赖

- **新增**：
  - `docs/delivery-closeout-charter.md`
  - `specs/Improvements.md`
  - `/Users/Hugh/Hugh/Project/PaperBuilder/specs/Improvements.md`（工作区外，需该仓可写）
  - `tests/contract/stage-closeout-step-contract.test.mjs`
  - `tests/contract/business-repo-experience-file.test.mjs`
  - `tests/contract/delivery-closeout-charter-contract.test.mjs`
  - `tests/contract/delivery-note-contract.test.mjs`
  - `tests/contract/acceptance-matrix-references.test.mjs`
- **修改**：
  - `skills/stage-reflection/SKILL.md`、`skills/stage-handoff/SKILL.md`、`skills/stage-closeout/SKILL.md`
  - `skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/GLOSSARY-FORMAT.md`
  - `workflows/make-decision/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/build-prd/SKILL.md`
  - `workflows/make-decision/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/verify-code/steps.json`、`workflows/build-prd/steps.json`
  - `skills/catalog.yaml`、`docs/architecture/move-map.json`
  - `docs/standard-workflow.md`
  - `AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md`
  - `tools/cli/measure-main-agent-cost.mjs`、`tests/contract/measure-main-agent-cost.node-test.mjs`（本次用户明确批准的成本最小增量）
  - `tests/integration/main-agent-cost-closeout.node-test.mjs`、`tests/contract/build-prd-review-contract.test.mjs`、`tests/acceptance/card-03-current.mjs`、`tests/acceptance/card-03-current.test.mjs`
  - `/Users/Hugh/Hugh/Project/PaperBuilder/AGENTS.md`（工作区外，一行指针）
- **删除**：`Improvements.md`（本仓仓根，内容先迁入 `specs/Improvements.md`）
- **禁止改动**：五份预写目标测试在实施阶段均为只读输入（本轮也不改）；确需纠正 oracle 走原 TCR 与独立审查，不能改断言求绿。`runtime/**`（含 `runtime/task/portable-workflow-run.mjs`、`runtime/stage/stage-skill-runtime.mjs`）、`core/**`（含 `core/task-close.mjs`）、`tools/cli/**`（仅下述批准的 `measure-main-agent-cost.mjs` 除外）、`skills/catalog.yaml` 的 `used_by_stages` 值、`specs/archive/**`、`docs/archive/**` 与任何历史交接/审查/测试原件。理由：本卡是文本与接线改造（`D-016`），改运行时或机器校验会超出授权范围并改变既有保护。
- **全局依赖**：P1 → P2（经验写入方法在 P1 定，P2 按该形状真实落地）；P2 → P3（`move-map.json` 的先写者是 P2，后写者是 P3，依据是 P3 新增 charter 条目而 P2 改 `Improvements.md` 条目）；P1 → P4（`workflows/build-code/SKILL.md` 的先写者是 P1 改末步，后写者是 P4 改交付说明指针）；`docs/standard-workflow.md` 的工作区、关闭与交付说明指针均由 P3/T005 独写，P4/T008 只改关闭方法与 build-code，故不新增 P3→P4 边；P5 依赖 P1；P6 依赖 P1–P5 全部。
- **文件归属**：同一 Phase 内每路径只有一个写主；跨 Phase 同一路径按上条依赖边定序，先写者在自己的 Phase 交回该路径已核实状态（字节数与关键节存在性），后写者据此改。
- **基线时点**：原受影响正文合计 211,944 B 是 N7 开工历史读数，N4 已修改其中方法；实施前读当前候选字节并与固定起点分列，不能把旧总数冒当前读数、改分母或用这次合入制造 N7 减法收益。
- **回滚与恢复**：任一 Phase 失败只回退该 Phase 的 hunk；不做整目录 checkout；历史原件不重写。

### 需求到任务追踪

| 来源 / 决定（decision-log ID） | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 |
| --- | --- | --- | --- | --- |
| R-001 / D-003、D-018、ADR-002 | 五件每件一处正文、条件指针；总纲只导航、删去仍独立，关闭仅两阶段 | FR-CLOSE-001 / AC-001 | P3/T004 | ORACLE-P3-CHARTER；总纲五件行/适用阶段及删总纲独立读回；负例为关闭扩到第三阶段。T004只核本增量，中间whole gate可partial，T007后核整Phase，AC-001最终P6判 |
| R-001、R-010 / D-003、D-005、D-011、D-015 | 工作区与任务有唯一文字权威，关闭和交付说明保条件指针；保失败与授权条件 | FR-CLOSE-001、FR-CLOSE-007、FR-CLOSE-009 / AC-001、AC-010、AC-012 | P3/T005 | ORACLE-P3-CHARTER；真实创建/关闭入口只读对照与指针读回；负例为两份正文或漏授权。文本检查不代真实PR |
| R-001、R-010 / D-004、D-015 | 领域规则只在格式附件；语义相等才删复述，不改技能登记 | FR-CLOSE-001、FR-CLOSE-009 / AC-001、AC-012 | P3/T006 | ORACLE-P3-CHARTER；领域词写者按指针找到格式与失败边界；负例为非领域词被收或必要条件遗失 |
| R-002 / D-006 | 每阶段主会话收口，交接内部发布且下游独读，步数15/12/12/8/6 | FR-CLOSE-002 / AC-002 | P1/T001 | ORACLE-P1-CLOSEOUT-STEP；五末步slug与步数、方法输入→交接consumer读回；负例为仍可选或多出末步。结构不冒五阶段实际执行 |
| R-003 / D-007 | 四类要素互不替代；本次收口同计量窗口不重复，成本失败/不支持披露 | FR-CLOSE-003 / AC-003 | P1/T001 | ORACLE-P1-CLOSEOUT-STEP；文本要素加P1后产物与实际record/from/until；负例为无发现写完成、取消丢未落账或重复计同窗口 |
| R-008 / D-008 | 动作项只留用户能做的四类事，有推荐/理由/不答后果与真实链接 | FR-CLOSE-004 / AC-004 | P1/T001 | ORACLE-P1-CLOSEOUT-STEP；P1后交接逐条读回与链接可达；负例为代理自己能做的事推用户或沉默当同意 |
| R-009 / D-009 | 交接说明改了什么、故意没改及理由、潜在风险与影响，真实diff优先 | FR-CLOSE-005 / AC-005 | P1/T001 | ORACLE-P1-CLOSEOUT-STEP；P1后交接核心方案与真实diff独立对照；负例为只有改动清单或diff不符未处置 |
| R-004、R-005、R-006、R-013、R-014、R-007 / ADR-001、D-010、D-012、D-013 | 本仓specs经验迁移、保旧追加/判重/后继读取/来源状态；无发现不凑、未授权不回落、保护不减 | FR-CLOSE-006、FR-CLOSE-008 / AC-006、AC-007、AC-008、AC-009、AC-011 | P2/T002 | ORACLE-P2-EXPERIENCE-FILE；位置/登记文本另列，写入判重/冲突/取消及后继行动需方法实跑；负例为复制正文、覆盖他人或无来源。根路径拒绝不冒用户授权策略 |
| R-013、R-014、U-002、U-003、U-004 / ADR-001、D-010、D-012 | 论文仓同相对位置、按自身模块三列合一，规则一行指针；创建/追加/读回及授权边界 | FR-CLOSE-006 / AC-006、AC-007、AC-008、AC-009 | P2/T003 | ORACLE-P2-EXPERIENCE-FILE；真实论文仓来源/状态/后继消费原件与获授权fixture根边界/授权语义分列；负例为只工具仓有文件、无权强写或把Experience产品基线当未解经验 |
| R-001、R-009、R-007 / D-011、D-013、D-017 | 关闭方法唯一交付说明三段，实施一句事实，保Door/Blast Radius与原交付授权 | FR-CLOSE-007、FR-CLOSE-008、FR-CLOSE-010 / AC-010、AC-011、AC-013 | P4/T008 | ORACLE-P4-DELIVERY-NOTE；首次消费真实范围/已知红/真验证，负例为build-code第二正文或机器字段丢失；实际PR前该子条件incomplete |
| R-007、R-012 / D-013 | 钉死断言只改被事实改变部分，退役JSON/入口仍退役、保护不减 | FR-CLOSE-008 / AC-011 | P1/T001 | ORACLE-P1-CLOSEOUT-STEP；定向测试与逐条保护对照；负例为删测试或恰两阶段改包含 |
| R-015、R-007、R-012 / D-014、D-013 | 八处悬空引用优先真实等价目标，否则可核事实或明确未覆盖；不造假测试 | FR-CLOSE-008 / AC-011 | P5/T009 | ORACLE-P5-ACCEPTANCE-MATRIX；矩阵+驱动同批读回，负例为仍指不存在目标或用文件存在冒行为 |
| R-010、U-005 / D-015 | N7明确数值保全：被替代正文不增、新增单列、常驻≤36,861且抵扣1,463；逐段条件对照 | FR-CLOSE-009 / AC-012 | P3/T007 | ORACLE-P3-CHARTER；固定起点/当前候选分列且完整gate在本增量后核，独立读者核保全/声明；负例为搬分母、删授权或数字冒质量 |
| R-008、R-009 / D-008、D-009、D-017 | AGENTS治理处只给动作项判据与写集说明各一句，指向唯一方法；六项相关治理consumer实际读回 | FR-CLOSE-004、FR-CLOSE-005、FR-CLOSE-010 / AC-004、AC-005、AC-013 | P3/T007 | ORACLE-P3-CHARTER；治理consumer按一句指针到P1方法并核动作项/真实diff；负例为治理句缺失、与方法冲突或复制第二份规则 |
| R-009 / D-017 | 六项各既有consumer首次验适用采用与排除，不用末尾汇总代首次 | FR-CLOSE-010 / AC-013 | P1/T001 | ORACLE-P1-CLOSEOUT-STEP；五项在收口/交接 consumer 的适用行为逐项首验，①/③的AGENTS治理consumer另由P3/T007首验，P1不冒其全部落点已完成；负例为只写已采用或搬明确排除项 |
| R-001、R-002、R-003、R-004、R-005、R-006、R-007、R-008、R-009、R-010、R-012、R-013、R-014、R-015、U-001、U-002、U-003、U-004、U-005 / D-003至D-018、ADR-001、ADR-002 | 逐AC消费上游原件并执行必要未闭环case；不是新实现或替首次采用；PR/成本/权限缺口各保真实时点 | FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-CLOSE-005、FR-CLOSE-006、FR-CLOSE-007、FR-CLOSE-008、FR-CLOSE-009、FR-CLOSE-010 / AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013 | P6/T010 | ORACLE-P6-ALL-AC；全部适用条件逐条读回，缺输入或只有文本/路径拒绝不得冒整体pass；负例为缺证据通过、普通findings冒盲评或真实PR前AC010全过 |
| R-011 / D-016 | 四级路线及新增consumer归N8，持续非目标；不扩大本卡写集 | 非目标 / 非目标 | 全部Phase | 逐Phase核写集，无本卡新增FR/AC/oracle，不伪装成实现行 |

### 全局验证策略

- **验证策略**：五个 Phase 各有自己的契约测试文件与一条可执行命令；末验收 Phase 一次消费前五个 Phase 的原件并补必要未闭环 case，不重复执行已闭环的命令；build-code 时真实 PR 尚未产生，AC-010 的真实 PR 子条件保持 incomplete，由 verify-code 在实际授权交付后消费同一 P6 和新原件更新结论，不新增 Phase 或循环等待依赖。
- **RED/GREEN 设计**：既有五份预写契约测试沿旧 RED 原件读取，不因 N4 合入把旧 RED 说成新快照实测；本轮不改测试、不新造 RED。build-code 前由执行 owner 分清目标失败、夹具/环境失败、本来通过，缺原件就记 unavailable；纯方法试行不制造仪式性 RED；build-code 用同一命令取得 GREEN。同一 `ORACLE-…` 编号在 RED 与 GREEN 两侧不变。测试文件在 Phase 卡中声明为 `DO NOT TOUCH`。
- **最终聚合**：P6 逐条消费 AC-001…AC-013，并按 AC 的判定方式（机器可判／只能人读／需真实环境）分别给证据；非 `pass` 项写具体原因与所需条件，不用计数替代逐条。
- **不能证明的内容**：本阶段不证明五个阶段真的按收口执行过（契约测试只核文本与接线）；不证明论文仓写权限；不证明真实 PR 可读；不证明字节抵消在语义等价前提下完成（那是实施与审查的事实）；不修也不掩盖 `reference-audit.test.mjs` 的既有红（`PFACT-022`），`npm run check` 本轮不重跑，父 AC-T8-4 的未达成不因有界检查而消失。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-001**：五件逐件只有一个正文位置，其余位置只写指针与调用条件；《交付与收口总纲》能指到五件、写清何时读哪一节与边界在哪，删掉总纲后各方法仍能独立工作
验证：P3 实施者提供总纲、`AGENTS.md`/`CLAUDE.md` 指针与 `docs/standard-workflow.md` 新节，独立读者在本次任务内先按总纲逐件定位正文，再在内存副本中删去总纲逐件复核可读性；`ORACLE-P3-CHARTER` 核总纲含五件行与「适用阶段」列、关闭行恰为 `build-prd` 与 `verify-code` 两阶段、`docs/architecture/move-map.json` 有该文件的 owner／consumer／删除条件条目。判定方式：`只能人读`；执行 owner 为独立读者，P3 完成后执行。
通过：五件逐件能在正文位置找到"做什么、边界、失败边界"；总纲每行给出唯一正文位置、到达条件与边界指针；删掉总纲后五件各自仍可独立按指针完成；关闭列只有两个阶段；move-map 条目含 owner、consumer 与删除条件
失败：任一事实出现两处正文；指针缺到达条件；总纲复制了规则正文；删掉总纲后某件失联；关闭列出现第三个阶段或记成五阶段
证据：独立读者对完整原件的逐件读回结论与删总纲反证记录，存当前 task 的 `quality/tests/`

- [ ] **AC-002**：五个阶段结束动作都由主会话发起收口，交接在收口内部发布且仍可被下游单独读取；步数不变
验证：P1 实施者改 `workflows/*/steps.json`、五个 `SKILL.md`、`skills/catalog.yaml` 与两个方法文件，`ORACLE-P1-CLOSEOUT-STEP` 由独立执行者在本次任务内运行 `npx vitest run tests/contract/stage-closeout-step-contract.test.mjs`，读实际 `steps.json` 与两份方法正文；`node --test tests/integration/main-agent-cost-closeout.node-test.mjs` 复核步数与末步 slug 断言。结构判定方式：`机器可判`；执行 owner 为 P1 实施者（GREEN）与 P6 复核者。整体收口还由独立执行者在P1后对五条路线各作一次具名真实方法试行：可用明确标识的受控stage输入，必须实际调用新方法、发布并读回新handoff、由独立consumer读取，逐路保输入/调用/产物原件；只有文字样本、静态GREEN或旧交接不算试行，缺某路线保对应incomplete。该分母是五路线行为覆盖，不要求本任务重走五次正式阶段结束，不回填正式stage历史。来源：talk批次2题5及原PRD:423/427/434。
通过：五个 `steps.json` 末步 `step_slug` 均为 `closeout`、步数分别为 15/12/12/8/6、`step_id` 连续；`stage-reflection` 正文声明收口是每阶段主体并给出五步顺序；`stage-handoff` 正文声明交接是收口内部一步且可按原件路径单独读取；`catalog.yaml` 三条 `used_by_stages` 与改动前一致；五个末步 `observable_result` 都交代成本步骤；五路线具名试行均有真实新方法调用、新handoff发布/读回与独立consumer；各成本标签入口及窗口行为用明确受控输入验证，build-prd只作成本标签、不新增正式stage。当前真实stage整个阶段末由主会话按真实身份/from/until记录并读回一次，未发生其它stage不造账行；材料缺源unavailable与review的no_stage_fact如实披露，已发布缺报/exit1不写无记录，未发布才写本阶段无记录；受控记录不冒当前主会话实际留账或正式阶段历史；不出现 `run reflect` 与 `quality/stage-reflection`
失败：任一路线仍写"可选"或末步仍是独立交接；步数变化；交接只能通过收口读到；`used_by_stages` 被改；新增公共动作或退役目录被复活
证据：`ORACLE-P1-CLOSEOUT-STEP` 的真实 RED/GREEN 与该 node:test 输出，另列五路线具名试行的明确输入类型、真实新方法调用、新handoff发布/读回与独立consumer原件，成本标签受控验证与当前stage末实际record原件分列；缺试行只报结构已检查，不报整体已执行

- [ ] **AC-003**：无发现带具名依据；失败带原始命令与退出；取消带已发生与未做以及未落账项；有发现未采纳保留原候选与理由；现入口支持的阶段按每次收口的同一计量窗口记录一次、不重复计费，续测保留历史非重叠窗口；未发布或未触发时写真实原因与影响，不冒成本已记录；已发布但缺报/exit1保实际账行、缺报和影响，不冒无记录或全部来源通过
验证：P1 在 `skills/stage-reflection/SKILL.md` 与 `skills/stage-handoff/SKILL.md` 写出四类必备要素与固定顺序，`ORACLE-P1-CLOSEOUT-STEP` 断言之；判据对象必须是 P1 落地**之后**才产生的收口产物——即 build-code 阶段自己的收口交接原件，或执行者按新方法做的受控试写交接；build-plan 阶段的交接早于 P1，只能作历史基线，不能作新规则读回对象。独立读者按新方法对无发现、有发现未采纳、失败、取消四类各作具名试行，真实受控失败、真实取消各至少一次且原件齐全；逐类核对必备要素，缺任一类或原件则对应子条件 incomplete，并将各成本标签受控入口/窗口验证与当前真实stage末主会话实际record分列；核实际record对应的 `from/until`、来源边界、读回原件及旧字节前缀：同一计量窗口不重复计费，续测按已有记录的实际 until 接续非重叠窗口，不能要求同 stage 永久只有一行或删除旧行；build-prd成本标签现已支持，材料缺权威引用按unavailable、无正式stage审查事实按no_stage_fact逐项读回；exit1按实际发布/读回区分已发布缺报行与未发布，未发布才写无记录；PFACT-024只作实施前历史基线，不作当前拒绝理由，不造账行或拒绝日志，真实失败另留原件。判定方式：`只能人读`；执行 owner 为 P1 之后的独立读者。
通过：四类要素在方法正文各自完整且互不替代；P1 之后按新方法产生的四类具名试行交接要素各自齐全，真实受控失败、真实取消各至少一次且原件齐全；缺任一类则对应子条件 incomplete；现入口支持 stage 的本次实际 record 有真实来源、指定 from/until 且同一窗口不重复计费；同阶段续测的非重叠窗口与历史行均保留；各成本标签受控入口/窗口验证与当前真实stage末主会话实际record分列；实际record须有真实from/until、来源、账行和读回，未发生其它stage不造行，不要求本任务五次正式阶段结束。材料unavailable/review no_stage_fact及其它缺报逐项披露，已发布缺报行不冒全部来源通过；缺五路线真实方法试行、当前实际stage成本或来源仍保OPEN-009对应incomplete，不能用CLI夹具补当前实际成本
失败：无发现写成"已完成"；失败无原始命令或退出；取消当没发生或漏写未落账项；未采纳的发现被静默丢弃；同一成本窗口重复计费或漏记且不写原因；删旧行把续测伪装成阶段永久唯一一行；用 P1 之前的历史交接充当新规则证据
证据：P1 之后按新方法产生的四类具名试行收口交接原件及逐类读回结论（含真实受控失败、真实取消各至少一次的事件、命令/退出或中断原件），以及本次实际 record 的命令、指定 from/until、账行/旧字节保留读回与缺报说明；build-plan 交接原件只列为历史基线

- [ ] **AC-004**：动作项只含决定、授权、不可逆动作、只有用户能提供的信息或凭证；每条有推荐、理由、不答后果；只链真实产物
验证：P1 在 `skills/stage-handoff/SKILL.md` 写出四类与五条形态，独立读者抽样 P1 落地**之后**产生的交接（build-code 阶段或受控试写）逐条核对类别、推荐、理由、不答后果与链接可达性，并以成对输入核对“该问用户的必须出现、不该问的不出现”（两类各至少一例），同时核漏问与多问；空动作项列表不能代替通过；build-plan 阶段的交接早于 P1，只作历史基线。判定方式：`只能人读`；执行 owner 为独立读者。
通过：成对输入中该问用户的均出现、不该问的均不出现，空列表不代通过；抽样每条都在四类之内且四要素齐全，P3/T007 治理入口的一句判据与唯一方法同义且真实 consumer 能按指针读到；链接指向的文件真实存在且可读；正文与视觉不重复同一事实
失败：漏掉必须问用户的事项，或出现代理自己能做的事；缺推荐或没写不答后果；链接指向不存在的产物；把用户未答当采纳或同意；用 P1 之前的交接充当证据
证据：P1 之后产生的成对输入、预期该问/不该问事项与交接动作项逐条读回结论（分别核漏问、多问），以及链接可达性检查输出

- [ ] **AC-005**：独立读者能说出改了什么、故意没改什么、潜在风险
验证：P1 在交接「核心方案」段写出三段，独立读者只读 P1 落地**之后**产生的交接原件，复述三段内容并与该阶段的真实 diff（`git diff --name-only` 与 `git status --porcelain`）对照；build-plan 阶段的交接只作历史基线。判定方式：`只能人读`；执行 owner 为独立读者。
通过：读者能分别说出改了什么、故意没改什么及理由、潜在风险与影响面；P3/T007 的治理一句判据与唯一方法一致、consumer 能到达；与真实 diff 无矛盾
失败：只有"改了什么"；与真实 diff 矛盾；写集说明缺失或与审查比对结论不一致而未在处置里写明；用 P1 之前的交接充当证据
证据：独立读者的三段复述与该阶段真实 diff 路径清单对照记录

- [ ] **AC-006**：两个业务仓各写一次；文件不存在时创建成功；存在时追加且旧内容完整；写完读回成功；遇到并发改动时保留双方并报告
验证：P2/T002 在本仓承接旧内容迁到 `specs/Improvements.md`，P2/T003 在已授权的 `PaperBuilder` 同位置创建；各由实施者按新方法做一次真实追加、读回并留原始来源。`ORACLE-P2-EXPERIENCE-FILE` 只核本仓位置、文本形状、活跃引用与登记，不执行 writer，也不证明创建/追加/判重/并发。并发与中断用例在明确授权的一次性副本由独立执行者消费 P1 完整方法：读完后、写前注入他人字节，核不覆盖、保留双方并报告；中断保已发生与未落账项，不动真实历史。零引用只针对当前权威文件 `AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md`、`skills/stage-reflection/SKILL.md`、`docs/standard-workflow.md`；历史、研究、图、两份完整命名的 0049 ADR、本任务迁移说明与 move-map 是来源/迁移记录，不作活跃规则扫描。判定方式：`需真实环境+用户在场`；P2 实施者在实施授权后执行，用户在最终结果中看到真实写入范围；未取得方法实跑或两仓成功证据时保 incomplete/unavailable，不以文本通过补齐。
通过：两仓相对位置相同且文件真实存在；追加后旧内容字节完整；受控并发用例下双方字节都保留并给出报告；写完读回报告实际路径；当前权威文件范围内对仓根旧路径 0 命中
失败：只在工具仓有文件；覆盖旧内容；写入未读回；并发改动被单方覆盖；论文仓记为已写但实际不存在；把排除清单扩到当前权威文件以凑 0 命中
证据：两仓写入与读回原件（命令、退出、路径、读回字节）、受控并发用例前后对照、当前权威文件范围的扫描输出；论文仓不可写时记 `unavailable` 与原因

- [ ] **AC-007**：以「下次要改的那一步 + 现象」判定，重复时只追加一行引用，不复制正文；连写两次只多一行引用
验证：P2/T002 的执行者在明确授权的一次性副本上按 P1 新方法连写两次同一事实，另用同来源而不同“下一步＋现象”的事实作不应合并负例；独立读者核原条目与只增加一行引用的实际差异。现有契约测试不做这两次写入，不以它的绿色声称判重行为通过。真实业务仓只落本任务确有原始来源、能改变后继行动的条目；核不到来源写 unknown，若本次确无可落账内容则给具名依据、保留真实条目与后继消费的缺口，不编教训。判定方式：`只能人读`（方法执行与判重语义，字节变化可机器辅助）；执行 owner 为 P2 实施者及独立读者。
通过：同一事实第二次出现后只多一行引用、条目正文不重复；判重键为"下一步 + 现象"而非来源、任务名或时间；真实条目至少一条且带可回读来源
失败：同一事实被记成两条完整条目；判重键换成来源、任务名或时间；正文被复制；文件里零条目却声称 AC-007/AC-008 已验
证据：同一判据下具名方法试行的两次写入前后差异、不同事实负例、真实条目的来源与选择状态；文本契约输出单列覆盖上限，不冒写入执行原件

- [ ] **AC-008**：后继能定位相关条目、读出原始来源与选择状态、说出它改变了下一次什么行动；只有用户明确确认已解决后才清理，未确认的条目保留
验证：P1 在 `stage-reflection` 写出后继读取为默认动作、P2 落真实条目（见 AC-007）；独立后继读者在本次任务内按真实问题（例如"下一次要 inline 审查材料时）检索 `specs/Improvements.md`，复述条目改变的下一次行动，并核对未确认条目的去留。判定方式：`只能人读`；执行 owner 为独立后继读者。
通过：能指到具体条目并读出原始来源与选择状态；能说出它改变了下一次什么行动；无可用条目时给具名理由；未确认条目保留
失败：找不到相关条目；读不出来源或选择状态；条目无法说明行动改变；未确认就清理；把未答当已解决
证据：独立后继读者的检索与复述记录

- [ ] **AC-009**：越权场景记 `unavailable` 与原因，不写回工具仓
验证：P2/T003 的执行者在其完整获授权的一次性 fixture 中建 inner 根与 sibling 目标，二者创建/读写/清理均在测试授权内；沿现有 `writeFileAtomic(root, relPath, bytes)`，以 inner 为 root 调 `../sibling/target.md`，应报 PATH_ESCAPE、目标不变；同一 inner 下合法相对路径应写入且读回。入口依据为 `runtime/interface/safe-write.mjs:90-113,222-224` 的实读：它保护文件身份与根内路径，不校验用户授权、无 policy 参数。该反例仅证明路径根边界，不能证明用户未授权策略拒绝；“授权不覆盖时记 unavailable、具名原因、不回落工具仓”的语义另由独立执行者按新收口方法消费完整正反授权材料并读回实际处置，不能用 PATH_ESCAPE 自动判该子条件通过。绝不尝试写真实 `specs/archive/**`、历史证据或任何真实未授权位置。判定方式：`机器可判`（根边界）加 `只能人读`（授权语义）；owner 为 P2 实施者与独立读者，缺真实方法处置时保相应子条件 incomplete/unknown。
通过：受控根边界反例真实报 PATH_ESCAPE、合法根内对照写入并读回，且目标与范围外文件未变；授权语义独立读回确实记 unavailable 与具体原因、无工具仓回落。两部分分别给原件，只有根边界成立不能代整体通过
失败：真实未授权强写或工具仓回落；把普通 ENOENT、PATH_ESCAPE 冒用户授权策略拒绝；把安全 I/O 当用户授权执行器；漏掉授权语义读回却报整体通过；探到真实历史或清单外位置
证据：fixture 全范围授权、writeFileAtomic 的真实入口/输入/输出/错误代码、合法对照、目标未变与清理原件；授权正反材料、独立方法执行与 unavailable/无回落读回另列，不建立历史路径写入原件

- [ ] **AC-010**：范围含故意不做；影响面列出与本卡相关的已知红并说明其余不在范围；验证每条真跑；正文只在一处出现；`Door` 与 `Blast Radius` 字段仍在
验证：P4/T008 在关闭方法保 N4 WR001 读取触发并补三段合同，build-code 留一句事实；标准方法的对应指针由 P3/T005 独写；`ORACLE-P4-DELIVERY-NOTE` 只核结构与机器字段。真实可读性由独立读者在 verify-code 消费本任务实际授权产生的 PR 正文、真实验证原件与 diff；build-code 的 P6/T010 此时尚无 PR 时，AC-010 的真实 PR 子条件保持 incomplete，不能以样本或契约绿色代替；verify-code再消费同一P6和实际PR，不新增Phase；预PR的该子条件incomplete不阻止build-code收口及接续verify-code，必要验证/Git交付按现AGENTS持续授权核实际范围/HEAD执行，不新增日常阶段授权，最终close仍一次确认。判定方式：`只能人读`；结构由 P4 命令辅助。
通过：三段在关闭方法各有一处正文；范围含故意不做；影响面含与本卡相关的已知红且明说其余不在范围；验证每条有真实路径与结果；`Door`/`Blast Radius` 字段名与语义保留
失败：缺任一段；验证是空话；正文两处并存；删掉或改名两个机器字段
证据：`ORACLE-P4-DELIVERY-NOTE` 的 RED 与 GREEN 输出，以及本任务真实 PR 正文原件的读回

- [ ] **AC-011**：只改被真实事实改变的部分，其余断言原强度保留；受影响测试更新后通过，原保护逐条仍在；旧路径在 AC-006 声明的五个当前权威文件中搜索 0 命中；验收矩阵的 `ORACLE-FIX-001` 不再指向不存在的文件
验证：P1/T001 与 P5/T009 实施者按逐条前后对照更新受控测试与验收矩阵；`ORACLE-P5-ACCEPTANCE-MATRIX` 运行 `npx vitest run tests/contract/acceptance-matrix-references.test.mjs` 核 `ORACLE-FIX-001` 的引用目标真实存在，`node --test tests/integration/main-agent-cost-closeout.node-test.mjs` 核步数与末步断言，`npx vitest run tests/contract/build-prd-review-contract.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/n2-skill-catalog-portability.test.mjs tests/contract/stage-runtime-reflect-entry.test.mjs` 核既有保护仍在；旧路径检索用**按仓根锚定的模式**而不是裸 basename：`grep -rnE '(^|[^/[:alnum:]_.-])Improvements\.md'`（在 `AGENTS.md`、`CLAUDE.md`、`GLOSSARY.md`、`skills/stage-reflection/SKILL.md`、`docs/standard-workflow.md` 这五个当前权威文件上执行，应 0 命中），排除清单固定为 `specs/archive/`、`docs/research/`、`graphify-out/`、`docs/adr/0049-*`、本任务材料目录与 `docs/architecture/move-map.json`。判定方式：`机器可判`；执行 owner 为 P1/P5 实施者与 P6 复核者。
通过：受控断言都按新事实通过；逐条前后对照可读且保护强度未降；按仓根锚定的模式在当前权威文件上 0 命中；`ORACLE-FIX-001` 的 8 处引用（`card-03-current.mjs:50,127,191,753,760` 与 `card-03-current.test.mjs:402,408,562`）都指向真实存在且真正验证收口行为的目标，或已改成可核事实/明确未覆盖
失败：删测试；断言改弱（如把"恰为两个阶段"改成"包含"）；为凑绿改行为；旧路径仍有命中；用裸 basename 检索导致把 `specs/Improvements.md` 也算命中、或反过来漏掉真正的仓根引用；仍未处置的悬空引用；把 `reference-audit.test.mjs` 的既有红算成本卡未通过或顺手改白名单掩盖
证据：各定向命令的退出与输出、逐条前后对照、按仓根锚定的检索命令与输出，以及对 `reference-audit.test.mjs` 既有红的独立复现原件

- [ ] **AC-012**：保留 N7 批次 7/8 明确选择的被替代正文不增、新增总纲与经验说明单列并报总数、常驻三件净不增并抵扣 +1,463；每个合并段落留前后对照。G1 的删除/合并/降档声明按真实 diff 记事实，不把每个 Phase 必须删字或声明在场当质量门；一般字节质量轴已被 N4 退役，任务特定数字不证明文档更好。
验证：P3/T007 按本任务固定起点读取常驻三件与被替代正文前后字节，`ORACLE-P3-CHARTER` 辅助核三件上限 36,861；新增文档单列，重复处数只作事实。独立读者逐段核旧条件在唯一新 owner 是否保全、真实 diff 与 G1 声明是否相符；声称质量改善时先沿 `docs/architecture/test-asset-governance-rules.md` 固定同题输入与标准，由非作者匿名同尺判定，不用字节量或普通 findings 代替盲评，未比较则质量改善 unknown。N1 的四组成本与字节分开，完整 N1 对照未消费前不宣 G1 成本全验（见 OPEN-008）。判定方式：`机器可判`（N7 明确数字）加 `只能人读`（保全、声明与质量）；owner 为 P3 实施者、P6 独立复核者。
通过：N7 指定三件合计不高于 36,861，被替代正文持平或下降、新增文档单列；各合并段落有旧位置、新位置、删了什么、保留什么条件，且独立读者确认必要含义保全；G1 声明诚实。数字结论不替代语言质量和完整 N1 成本证据；后两者缺失分别记 unknown/incomplete
失败：任一条线字节增加；未抵扣 +1,463 却写达标；搬到未统计文件；没有前后对照；只报总数不报口径
证据：N7 指定数字的前后逐文件读数、合计与逐段对照，独立保全读回；若做质量比较则另引用匿名同尺原件与不可判定项，N1 成本引用唯一原件，不复制或从字节估 token

- [ ] **AC-013**：六项按逐项采用表的可观察判据各自成立，声明的落点文件真实生效，未采用部分逐条有排除理由；且每一项都在其真实 consumer 的首次验收（P1、P3/T007 或 P4 的对应 consumer Done）就核过，不用 P6 的末尾汇总替代（PRD AC 段原文：不能以末尾采用汇总未做为缺项理由）
验证：各项在真实 consumer 的首次验收就核——①`git-workflow-and-versioning`：交接核心三段由 P1/T001 首次核，AGENTS 写集说明治理一句由 P3/T007 首次核；两 consumer 都有实际原件才算本项全部落点完成，P1 不提前冒治理 consumer 已交；②`no-comments` 的归口与删除边界由 P1/T001 核；③`ketchup`：交接动作项五条形态由 P1/T001 首次核，AGENTS 动作项治理一句由 P3/T007 首次核，不能由一个 consumer 的记录替另一个；④`reflect` 的结构优先筛选器与批准/落账分开由 P1/T001 核；⑤`recall` 的读取为默认动作与状态用文字由 P1/T001 核；⑥`opening-a-pr` 的 Scope／Blast Radius／Verification 由 P4/T008 核。P3/T007 的两句治理入口是①/③在治理 consumer 的落点，不新增第七项；其真实 consumer 读回随 T007 首次验收。P6 只核六项各自已有首次验收记录且落点文件真实，不重复判定语义。判定方式：`只能人读`；执行 owner 为 P1/P4 实施者、P3/T007 治理 consumer 读回者与 P6 复核者。
通过：六项各自能在声明的落点找到真实行为或负例；明确不做的部分未被搬入；六项中没有一项缺失落点
失败：只写"已采用"无可观察行为；搬了明确不做的部分；六项中任一项未落点；某几项只在末尾汇总里出现而无首次验收记录
证据：六项逐项读回记录（每项一条真实行为或负例）与落点文件路径

## 12. 风险、未决与交接

- **OPEN-010**：跨仓/任务库绝对路径的真实审查宿主 scope 尚未接通；来源为 `tools/cli/stage-runtime.mjs` 的 `trustedReviewReadScope` 与 `recordTaskReview` 实读、013 default 原始错误，影响 P2/P6 跨仓审查及其支持的 AC-006/009/011 结论。owner 为真实 host adapter 的维护者；下一动作是核已有宿主 callback/config 能否按真实用户授权、认证主仓与论文仓的精确路径及任务 evidence 提供短时 scope，实际调用后留原件。在此之前跨仓审查保持 unavailable/unknown；直接精确 scope 诊断不冒真实接线或授权通过。本 N7 不新增运行时控制面/CLI、不改 checker 或材料伪造授权，也不因缺 scope 冻结其余安全工作。
- **OPEN-009**：build-prd成本标签支持已落地，正式stage仍为四个；实施/定向验证与正式成本审查051见P1，旧PFACT-024的invalid stage及unavailable原件保留为历史。剩余影响AC-002/003的是五路线具名真实方法试行是否齐全、当前真实stage末主会话record/from/until及来源读回；受控stage输入须明标且实际新方法调用/新handoff发布读回/独立consumer均有原件，未发生其它stage不造行，不以五次正式阶段结束作为本任务分母；build-prd材料机器引用缺源unavailable、review no_stage_fact仍如实保留。exit1可能已发布缺报行，按读回记发布事实，不冒全部来源通过；P6保持各缺项incomplete，不据标签支持或051审查关闭本项。
- **OPEN-007**：P2 文本测试未覆盖实际创建/追加、判重、并发、中断或授权语义处置；AC-009 已定位 safe-write 根路径边界夹具，但其 PATH_ESCAPE 不验证用户授权。P2 owner 在实施授权后提供方法试行、获授权 fixture 原件与独立授权语义读回，P6 分别消费；未取得保持 AC-006/007/009 对应子条件 incomplete/unknown，不改 frozen 测试或试写真实历史补绿。
- **OPEN-008**：PRD G1 的完整 N1 同条件成本对照本轮未读取/执行；P6 owner 在整卡最终成本验收消费完整 N1，分列 wall_s、input/output/cacheRead、steps/turns、subagent/bash 与 unavailable/not_reported，次数/波动保原件。该缺口不阻塞范围明确的规划/实施，但不能宣成本改善或整卡全验，字节不能代替。

- **RISK-01**：常驻三件字节未压回起点
  - **受影响 ID**：`PFACT-006`、`FR-CLOSE-009`、`AC-012`
  - **触发条件**：P3 只加指针不做合并，或合并时保留了等价重复段落
  - **后果**：N7 特定数字约束未达标，当前任务如实保留差额并继续范围内修复，不借一般字节验收退役声称已抵扣
  - **缓解或停止**：先做 `CLAUDE.md` 与 `AGENTS.md` 的重复正文合并（两文件对同一规则各写一份），逐段留前后对照；压不到 36,861 就在交接与 `Done` 写具体差额与未达原因，不写已达标
  - **处理阶段**：build-code（P3），复核在 verify-code
  - **验证**：改动前后 `wc -c` 与合计计算
- **RISK-02**：钉死测试更新时被顺手放松
  - **受影响 ID**：`PFACT-002`、`PFACT-003`、`PFACT-012`、`FR-CLOSE-008`、`AC-011`
  - **触发条件**：把"恰为两个阶段"改成"包含"，或删除断言
  - **后果**：关闭扩面与退役目录复活失去机器保护
  - **缓解或停止**：每条改动在 Phase 卡里写清原断言保护的是什么；P5 的契约测试核关键断言仍在
  - **处理阶段**：build-code（P1、P5）
  - **验证**：逐条前后对照与定向测试输出
- **RISK-03**：末步名与物理关闭技能混名
  - **受影响 ID**：`FR-CLOSE-002`、`AC-002`、`ADR-002`
  - **触发条件**：末步 slug 取成 `stage-closeout`
  - **后果**：读者以为关闭被铺到五个阶段，与 ADR-002 冲突
  - **缓解或停止**：末步 slug 固定为 `closeout`；总纲的适用阶段列写明关闭只挂两阶段；P1 契约测试断言 `catalog.yaml` 的 `stage-closeout.used_by_stages` 不变
  - **处理阶段**：build-code（P1）
  - **验证**：契约测试与总纲读回
- **RISK-04**：三段内容合同与机器字段冲突
  - **受影响 ID**：`PFACT-010`、`PFACT-020`、`FR-CLOSE-007`、`AC-010`
  - **触发条件**：为了让"范围/影响面/验证"三段整齐而删掉或改名 `Door`／`Blast Radius`
  - **后果**：`validatePrDescription` 直接抛 `PR_DESCRIPTION_INCOMPLETE`，PR 无法创建
  - **缓解或停止**：三段是内容要求，两个字段是机器要求，两者并存；`ORACLE-P4-DELIVERY-NOTE` 断言两个字段名仍在
  - **处理阶段**：build-code（P4）
  - **验证**：契约测试与真实 PR 创建
- **RISK-05**：经验条目变流水账
  - **受影响 ID**：`FR-CLOSE-006`、`AC-008`
  - **触发条件**：只记"发生了什么"而不写"下次什么情况会改变行动"
  - **后果**：文件变长但不改变后继行动
  - **缓解或停止**：条目判据要求"说不清下次怎么改变行动就不收"；无发现时写具名依据
  - **处理阶段**：build-code（P2）
  - **验证**：独立后继读者能否说出行动改变
- **RISK-06**：论文仓不可写
  - **受影响 ID**：`PFACT-009`、`OPEN-002`、`AC-006`
  - **触发条件**：该仓权限或约定不足
  - **后果**：真实成功场景无法完成
  - **缓解或停止**：记 `unavailable` 与原因，不回落工具仓，不写已达标
  - **处理阶段**：build-code（P2）
  - **验证**：真实写入尝试的命令与错误原文
- **RISK-07**：位置迁移漏改引用
  - **受影响 ID**：`PFACT-007`、`PFACT-008`、`FR-CLOSE-006`、`AC-006`
  - **触发条件**：当前权威文件仍指向已迁出的仓根旧位置，或迁移登记未准确承接；历史 ADR、原件及图内旧引用不是活跃规则
  - **后果**：出现两处"经验文件在这里"
  - **缓解或停止**：迁移前后按 AC-006/AC-011 声明的五个当前权威文件范围，以仓根锚定模式检索并确认活跃旧引用 0 命中；历史 ADR、研究、任务原件与迁移登记保留真实旧路径，不能为凑零改写；图内机器引用按知识方法处理，不手改或据其旧值判活跃规则失败
  - **处理阶段**：build-code（P2）
  - **验证**：迁移前后五个当前权威文件的检索输出与迁移登记读回，历史/图/原件不纳入零命中分母
- **RISK-08**：总纲变成第二份正文
  - **受影响 ID**：`FR-CLOSE-001`、`AC-001`
  - **触发条件**：写规则而不写位置与到达条件
  - **后果**：出现两处权威，读者不知以哪份为准
  - **缓解或停止**：总纲每行只写位置、到达条件、边界指针；用"删掉总纲后各方法仍能独立工作"反证
  - **处理阶段**：build-code（P3）
  - **验证**：删总纲反证记录
- **RISK-10**：论文仓"经验文件"命名撞车
  - **受影响 ID**：`PFACT-025`、`FR-CLOSE-006`、`AC-006`
  - **触发条件**：在该仓只加一行指向 `specs/Improvements.md` 的指针，而未说明它与既有 `Experience.md` 的分工
  - **后果**：该仓出现第四处近义文本，读者按"经验"找不到该看哪份
  - **缓解或停止**：指针那一行同时写明"未解经验与待办在 `specs/Improvements.md`；产品体验基线仍在 `Experience.md`"；不改动该仓既有三份文件
  - **处理阶段**：build-code（P2）
  - **验证**：该仓指针行读回
- **RISK-11**：拿 `npm run check` 全绿当完成判据
  - **受影响 ID**：`PFACT-022`、`AC-010`、`AC-011`
  - **触发条件**：把 把 `npm run check` 未重跑或旧输出的缺 exit 写成已通过，或把它与 reference-audit 定向失败混为一件事
  - **后果**：无法区分本卡回归与历史/其它 owner 问题，或诱使实施者改历史材料和白名单掩盖已知缺口
  - **缓解或停止**：本卡只跑受影响针对性测试；check 旧 lint 与 reference-audit 定向失败分列来源、时点、范围与缺 exit，当前结果未重跑写 unknown；父 AC-T8-4 未达成保 `OPEN-006`
  - **处理阶段**：全部 Phase 的完成判据设计
  - **验证**：各 Phase 的 `gate_cmd` 只含受影响测试；交付说明影响面含该条
- **RISK-09**：交付说明出现两处正文
  - **受影响 ID**：`PFACT-020`、`FR-CLOSE-007`、`AC-010`
  - **触发条件**：只改关闭方法而不收 build-code 的现有正文
  - **后果**：实施阶段仍能读到第二份内容要求
  - **缓解或停止**：`ORACLE-P4-DELIVERY-NOTE` 断言 build-code 只剩一句事实说明
  - **处理阶段**：build-code（P4）
  - **验证**：契约测试

- **OPEN-001**：本任务自己的真实 PR 的动作前授权范围未定
  - **受影响 ID**：`AC-010`、`FR-CLOSE-007`
  - **负责人**：主会话在动作前展示范围，用户决定
  - **影响**：verify-code 的真实 PR 说明可能无法产生，交付说明的真实可读性只能记未验证
  - **处理阶段**：verify-code
  - **关闭条件或停止**：用户给出覆盖 push 与 PR 的真实授权范围，且主会话在动作前展示实际范围
- **OPEN-002**：`/Users/Hugh/Hugh/Project/PaperBuilder` 的写权限与约定未实测
  - **受影响 ID**：`PFACT-009`、`AC-006`
  - **负责人**：P2 实施者在写入前实测
  - **影响**：论文仓那一半真实成功场景可能只能记 `unavailable`
  - **处理阶段**：build-code（P2）
  - **关闭条件或停止**：真实写入成功并读回，或如实记 `unavailable` 与原因
- **OPEN-003**：知识图未更新授权
  - **受影响 ID**：`AC-012`、`AC-013`
  - **负责人**：主会话在关闭阶段按知识方法处理
  - **影响**：`graphify-out` 内的旧路径引用保持旧值，图与文件不一致
  - **处理阶段**：verify-code
  - **关闭条件或停止**：取得图更新授权并真实更新，或如实说明未更新
- **OPEN-004**：减法抵消的具体合并清单取决于实施时的语义等价判断
  - **受影响 ID**：`AC-012`、`RISK-01`
  - **负责人**：P3 实施者
  - **影响**：可能压不到 36,861，需要记未达标
  - **处理阶段**：build-code（P3）
  - **关闭条件或停止**：三件合计 ≤ 36,861 并留逐段对照，或写具体差额与未达原因
- **OPEN-006**：父 PRD 的 AC-T8-4 要求 `npm run check` 通过；旧输出有 22 个 markdownlint 错误（多个 skills 与 N2），没有实际退出码尾行，本轮未重跑合入 N4 后全量 check，不能宣称已达成或已豁免
  - **受影响 ID**：`FR-CLOSE-008`、`AC-011`、`RISK-11`
  - **负责人**：本卡主会话披露当前缺口；问题按实际文件 owner 归属，只有范围确需改变时才向用户提出选择
  - **影响**：本卡无法宣称 AC-T8-4 达成；若要求本卡顺带修，范围就扩到另一任务的材料（需另一次真实授权）
  - **处理阶段**：本卡计划确认与交接展示；本轮只更新材料，不授权 build-code 或额外全量回归
  - **关闭条件或停止**：取得当前适用检查证据或用户真实变更承诺后如实更新；在此之前保未达成与 owner，缺口不冻结其它范围明确的安全工作
- **OPEN-005**：`tests/acceptance/card-03-current.mjs` 整体陈旧：全文 66 条被引用路径中有 50 条不存在
  - **受影响 ID**：`PFACT-005`、`AC-011`
  - **负责人**：该验收脚本的原 owner（不在本卡）
  - **影响**：本卡只处置 `ORACLE-FIX-001` 的 8 处引用；其余 49 条陈旧路径保持现状并如实记录，不由本卡顺带重写
  - **处理阶段**：本卡只记事实；修复交原 owner
  - **关闭条件或停止**：交接写明该事实与原 owner，本卡不声称该脚本整体已可跑

### 本次用户授权补充（两项最小范围）

来源为本会话用户最新明确答复：批准P5两现有验收文件适配现行公共接口、保13原判据与未覆盖；批准build-prd成本由原owner先补最小方案再实施定向验证。该答复只替换此前“需范围决定”的待决状态，不改历史决定/失败原件、不证明实施成功。

- P5写集仍仅 `tests/acceptance/card-03-current.mjs`、`tests/acceptance/card-03-current.test.mjs`。适配退役kernel/validator的真实现行公共consumer；13原AC的输入、assertion_ids、期望方向、scope、失败与未知条件逐项承接，原未覆盖保持incomplete。不恢复退役runtime、不新增生产文件/兼容桥，不顺带修其余陈旧引用。
- P1新增允许修改 `tools/cli/measure-main-agent-cost.mjs`、`tests/contract/measure-main-agent-cost.node-test.mjs`；复用已声明集成测试与build-prd两方法路径。CLI只接受build-prd成本标签并适配其真实材料/审查来源；原window/session计量、唯一 `main-agent-cost.md`、锁/原子写/读回及缺报语义保持。不得新增正式stage、schema、账本或runtime桥。
- Docker不是本任务的验收要求或独立性的必要实现。不得启动daemon、安装或配置Docker；不得把N4其它任务的物理隔离AC机械移为N7新门。N7保原匿名同题、独立judge、生成前固定输入/标准与候选不得读标准的要求；实际权限/读取边界如实记录，未建立物理隔离不宣已建立，不因不用Docker阻止范围内工作。

## 13. 业务影响与回归范围

### 五条路线的末步与接线

- **既有行为**：五条路线的 `steps.json` 末步分别叫 `stage-handoff` 与 `confirm-plan-and-handoff`，步数 15/12/12/8/6；`catalog.yaml` 三个技能的 `used_by_stages` 如上
- **本需求影响**：只改末步 `step_slug` 与正文措辞，步数、`step_id` 连续性与 `completion_evidence` 不变
- **回归路径**：`node --test tests/integration/main-agent-cost-closeout.node-test.mjs` 与 `npx vitest run tests/contract/stage-closeout-step-contract.test.mjs`
- **验收**：AC-002、AC-011

### 退役守卫与端口搬运

- **既有行为**：`run reflect` 已移除且不创建 `quality/stage-reflection`；`stage-reflection` 必须可单目录搬运
- **本需求影响**：收口方法改写后这两条保护必须仍然成立
- **回归路径**：`npx vitest run tests/contract/stage-runtime-reflect-entry.test.mjs tests/n2-skill-catalog-portability.test.mjs`
- **验收**：AC-002、AC-011

- **可能受冲击的业务规则**：`stage-closeout.used_by_stages` 恰为两阶段；PR 正文的 `Door`／`Blast Radius` 必填；五个 `steps.json` 的 `step_slug` 唯一非空
- **明确无影响**：`runtime/**`、`core/**`、`tools/cli/**` 不改；不新增公共命令或 schema；历史原件、`specs/archive/**`、`docs/archive/**` 只读

## 补充材料

- `specs/n7-route-delivery-closeout-experience-20261018/decision-log.md`（R/U/D/ADR/AC 与未决项原件）
- 任务库 `quality/evidence/decision-log-refs/`：`raw-requirement.md`、`requirement-index.md`、`requirement-change-log.md`、`talk-batches.md`、`coverage-matrix-5d.md`、`open-item-outline.md`、`divergent-candidates.md`、`research.md`、`review-dispositions.md`
- 任务库 `quality/evidence/baseline-bytes-2026-10-18.md`、`quality/evidence/baseline-affected-bytes-2026-10-18.md`
- 任务库 `quality/reviews/2026-10-18-007-make-decision-direction.json`、`2026-10-18-011-make-decision-detail.json`
- `skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/templates/index-template.md`
