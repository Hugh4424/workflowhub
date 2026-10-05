# 功能规格：CARD-10 总体集成验收收口

> 本文件是 CARD-10 build-plan 阶段的唯一功能规格与全局实现设计。产品目标与方向权威是母 PRD 与本卡 `decision-log.md`；本文件承载已接受的需求翻译、全局工程决策与其来源绑定。
>
> AC 的唯一定义在 `Appendix A`。叙事各节可以指向 AC，但不复制 AC 正文。`spec.md` 拥有产品行为与全局实现设计；`phases/P<n>.md` 拥有各 Phase 实现增量；`phases/index.md` 是纯指针。

- **功能名**：CARD-10 总体集成验收收口（执行既定套件、不发明套件）
- **来源**：母 PRD CARD-10 卡正文 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:524-549`；总体集成验收套件 `prd.md:551-607`；本卡 `specs/workflowhub-thin-core-card-10-20260919/decision-log.md`（唯一权威，含 R-001..R-011、U-001..U-018、ADR-001..ADR-015、T-001..T-006）
- **状态**：build-plan 起草完成，待独立审查与最终确认

## 材料导航

| 要找什么 | 去哪里 | 什么时候读 |
| --- | --- | --- |
| 本卡唯一权威决定（ADR、验收面、退役登记、Supersedes） | `specs/workflowhub-thin-core-card-10-20260919/decision-log.md` | 开工前全读 |
| CARD-10 卡正文与套件主体 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:524-607` | 写用例与 AC 前 |
| 九卡验收事实与结论原件 | `specs/archive/workflowhub-thin-core-card-0X-20260919/` 与 `<TASKS_ROOT>/workflowhub-thin-core-card-0X-20260919/quality/` | 存在性核对时 |
| 规划任务阶段事实、确认原件、交互聚合 | `<TASKS_ROOT>/workflowhub-thin-core-rebuild-planning-20260919/` | E2E-1 执行时 |
| 现行三审查点执行合同 | `workflows/make-decision/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md` | 审查节奏核对时 |
| 现成可跑 oracle | `tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`tests/acceptance/card-09-session-ledger.mjs`、`tests/acceptance/card-09-session-ledger.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` | 套件执行时 |
| 本卡执行证据落点 | `<TASK_DIR>/quality/tests/`、`<TASK_DIR>/quality/reviews/`、`<TASK_DIR>/quality/evidence/` | 每次执行后立即 |
| 冻结/退役判读依据 | `decision-log.md` 的 `## 退役登记（retirement）` 与 `## Supersedes（被替代记录）` | 遇到母 PRD 旧表述时 |
| 本卡 build-plan 取证事实 | 本卡 build-plan 阶段取证报告（562 行，含 `[实跑]`/`[实读]`/`[推断]` 标注） | 核对 PFACT 时 |

> `<TASKS_ROOT>` 指外置任务目录根（各卡子目录所在）；`<TASK_DIR>` 指本卡外置任务目录。本卡所有原始执行证据落 `<TASK_DIR>/quality/`，不复制进仓库。本表行号于 2026-10-05 实读核对。没列进本表的材料不凭印象引用。

## 速读卡（30 秒）

- **一句话需求**：执行母 PRD 已定稿的总体集成验收套件，逐条留下真实入口执行记录，并据此判定整体是否可声明完成——不发明用例、不改写失败判据、不做产品实现。
- **核心改动点**：
  - 产出物是记录与判定，不是功能：逐条执行记录、CARD-01..09 存在性核对记录、缺口登记、完成宣称判定。
  - 仓库内只新增 `specs/workflowhub-thin-core-card-10-20260919/spec.md` 与 `phases/**`；全部原始证据落外置 `<TASK_DIR>/quality/`。
- **最大影响面**：整体交付能否被声明完成（用户侧总体验收结论）；对产品运行时零改动。
- **验收信号**：套件 8 项逐条有命令、exit code 与 output 落点；三条 INTEG 未验证项逐条写进完成宣称；失败事实原文可查且未被改写成通过。

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001 | ADR-007、ADR-010 | FR-C10-001、AC-C10-001 | current / 套件成形 | 无 |
| R-002 | ADR-011、ADR-013 | FR-C10-004..006、FR-C10-011、AC-C10-004..006、AC-C10-011 | current / 套件执行 | OPEN-C10-001 |
| R-003 | ADR-011 | FR-C10-002、FR-C10-003、AC-C10-002、AC-C10-003 | current / 输入核对与抽验 | OPEN-C10-002 |
| R-004 | ADR-008、ADR-013 | FR-C10-010、AC-C10-010 | current / 关键失败路径 | OPEN-C10-005 |
| R-005 | ADR-012 | FR-C10-014、FR-C10-015、AC-C10-014、AC-C10-015 | current / 完成宣称 | OPEN-C10-004 |
| R-006 | ADR-004、ADR-008 | FR-C10-006、AC-C10-006 | current / 失败不漂白 | 无 |
| R-007 | ADR-002、ADR-003 | FR-C10-005、AC-C10-005 | current / 审查节奏与 G-2 | 无 |
| R-008 | ADR-001、ADR-014 | FR-C10-007..009、AC-C10-007..009 | current / 跨卡集成 | OPEN-C10-003、OPEN-C10-006 |
| R-009 | ADR-005、ADR-006、ADR-007 | FR-C10-012、FR-C10-013、AC-C10-012、AC-C10-013 | current / 边界与落点 | 无 |
| R-010 | ADR-009、ADR-011 | FR-C10-011、FR-C10-012、AC-C10-011、AC-C10-012 | current / 执行广度 | 无 |
| R-011 | ADR-007 | FR-C10-014、AC-C10-014 | current / 停止规则 | 无 |

母 PRD 正文：CARD-10 卡 `prd.md:524-549`（FR-47..FR-50 见 `:530-533`，AC-47..AC-50 见 `:535-538`）；总体集成验收套件 `prd.md:551-607`。

## 1. 需求解释：问题与紧迫性

母 PRD 把「具体重构验收标准」做成一个命名可检查交付项（SD-13①），并把它的执行落在一张独占收口卡上：CARD-01..CARD-09 各自完成了自身验收，但没有任何一张卡负责回答「整体是否真的跑通了」。缺少这一层，九张卡的状态相加会被当成整体完成——母 PRD `prd.md:526` 明确写死「子任务状态相加≠整体完成」。

本卡的紧迫性来自三个已经发生的事实，而不是假设的风险：

1. 母 PRD 的套件主体已经定稿，但其中三条跨卡集成用例（INTEG-1/2/3）的可观察结果在 HEAD 现实里无法完整闭合；若不在收口卡里如实判定并披露，它们会以「已列在 PRD 里」的形式被默认当成通过。
2. 套件中被点名的两个 oracle 在 HEAD 已经失效或确定性失败（五阶段 e2e 3/3 失败；`tests/acceptance/card-01-current.mjs` 23/23 missing）。若不显式区分「套件内用例的失败判据」与「被点名 oracle 自身的失败事实」，这两种失败会被混为一谈。
3. 母 PRD 多写了一个已经退役的审查节奏点（全 phase 结束集成审查），而四个现行 workflow 合同一致写明没有该审查点。只看 PRD 会得到错误读法。

因此本卡要交付的不是新能力，而是一份**可核对的执行记录与判定**：套件成形 → 逐条真实入口执行 → 失败如实记录 → 关键失败路径核对 → 完成宣称判定与披露。

## 2. 背景、目标与范围

### 背景

CARD-10 在任务地图里被指定为 Group 3 独占收口卡（`prd.md:129`、`:543`）：不与任何卡并行、无共享写面（`prd.md:544`）。`ui_applicability=non_ui`（`prd.md:545`），无设计稿。母 PRD 的开工说明 `prd.md:549` 把五个阶段摊开写清：make-decision 只读引用输入；build-plan 细化套件用例参数细节并产出 `spec.md`；build-code 无新实现（仅缺口修复交回原责任卡）；verify-code 真实入口逐条执行套件内用例并完成存在性核对、记录留档。

本卡 make-decision 阶段已经收敛了全部方向性决定：`decision-log.md` 载有 R-001..R-011、U-001..U-018、V-001..V-025、ADR-001..ADR-015、F-001..F-014、RISK-001..RISK-009、OPEN-001..OPEN-006，并在 2026-10-05 完成真实最终确认（`<TASK_DIR>/quality/evidence/human-confirmations/2026-10-05-001-make-decision-approve-decision.json`）。本文件不重述那些散文，只把已接受的决定翻译成可执行的需求、场景与判据。

### 目标

- 把母 PRD 已定稿的套件**执行**出来：三部分齐备、逐条经真实入口执行、结果如实记录（FR-47/FR-48）。
- 把 CARD-01..09 的验收事实作**输入引用**做存在性核对：事实存在且结论未被漂白；不重跑各卡内部测试、不逐条复核各卡 AC 内容（`prd.md:555-557`）。
- 对 SD-05 约定的三条关键失败路径逐条留核对记录（FR-49）。
- 在真实入口联通实跑、成功条件达成、关键失败路径被核对之后才做完成宣称，并把未验证项与风险写进展示（FR-50）。
- 三条 INTEG 用例判 `unverified` 时，照 ADR-012 既定口径声明完成，但把三条未验证逐条写进完成宣称，含缺口去向与承接方。

### 范围内

- 套件成形：CARD-01..09 验收事实汇集与存在性核对；用户抽验权通路。
- 套件执行：E2E-1、E2E-2、E2E-3、INTEG-1、INTEG-2、INTEG-3、关键失败路径三条核对。
- 完成宣称判定与展示；缺口登记与交回。
- 仓库内写入面：`specs/workflowhub-thin-core-card-10-20260919/`（`spec.md`、`phases/**`）与 verify-code 结论。
- 原始执行证据落点：外置 `<TASK_DIR>/quality/`。

> 非目标只在第 10 节维护，避免两份真相。

## 澄清（spec-clarify）

第 1 批澄清共 4 个独立轴，均为 2026-10-05 用户经选项选择作出的裁定（非自由文本口述）。

| 轴 | 问题 | 裁定 | 落地位置 |
| --- | --- | --- | --- |
| CL-1 | INTEG-1/2/3 三条都判 `unverified` 时如何收口 | 照 ADR-012 既定口径声明完成，三条未验证逐条写进完成宣称（含缺口去向与承接方） | FR-C10-014、AC-C10-014、`### 全局验证策略` |
| CL-2 | 被点名 oracle 在 HEAD 确定性失败如何处置 | 如实记为真实失败事实，但不作为套件内用例的失败判据；缺口交回责任卡（推断 CARD-06，需对方确认） | FR-C10-011、AC-C10-011、RISK-C10-010、OPEN-C10-005 |
| CL-3 | E2E-1 入口面如何判 | 判「旅程可证、入口未验证」并披露 | FR-C10-004、AC-C10-004、PFACT-009、PFACT-024 |
| CL-4 | CARD-01 自己的验收 oracle 已失效如何处置 | 只核原件存在性与结论未漂白；oracle 失效如实登记为缺口交回 CARD-06 | FR-C10-002、AC-C10-002、RISK-C10-011、OPEN-C10-006 |

四条裁定都不改变套件主体：不新增用例、不删除用例、不改写任何失败判据。

## 3. 用户场景与状态覆盖

### SCN-001：owner 执行既定套件并收口

- **角色**：CARD-10 owner（总体集成验收承接者）
- **前提**：CARD-01..09 全部已归档或已关闭；母 PRD 套件主体已定稿；本卡最终确认已落定
- **触发**：进入 verify-code 阶段，开始逐条执行套件内用例
- **结果**：8 项条目（0 号输入核对 + 7 项用例）各有命令、exit code 与 output 落点；完成宣称只在前置齐备后作出

### SCN-002：用户按需抽验任一卡的任一 AC 事实

- **角色**：用户（总体交付判定者）
- **前提**：存在性核对记录已落 `<TASK_DIR>/quality/`
- **触发**：用户点名某卡某条 AC，要求看原件
- **结果**：抽验通路能给出定位规则与检索通路，并实际打开原文；不逐条复核 AC 内容

### SCN-003：套件内用例失败时的如实处置

- **角色**：CARD-10 owner
- **前提**：执行中出现真实失败
- **触发**：某条套件内用例的失败判据被触发
- **结果**：失败记为 `failed`/`unverified`/`unavailable`，原文保留可查，整体完成宣称被阻断；不漂白

### SCN-004：审查工具 unavailable 时的核对

- **角色**：CARD-10 owner
- **前提**：E2E-2 同类环境可用
- **触发**：出现或引用一次审查工具不可用事实
- **结果**：先检索已有真实不可用原件；本轮真出现才记录并披露 `unverified`；本轮未出现则如实记「本轮未出现该情形」并说明替代核对面；不冒称亲历、不人为制造假失败

### SCN-005：完成宣称判定与展示

- **角色**：CARD-10 owner → 用户
- **前提**：套件执行记录、存在性核对记录、关键失败路径核对记录三者齐备
- **触发**：准备声明整体完成
- **结果**：展示含实际改动、验证结果、未验证项与风险；三条 INTEG 的 `unverified` 与缺口去向逐条在列；accepted_risk 在列

### SCN-006：缺口登记与交回责任卡

- **角色**：CARD-10 owner → 责任卡
- **前提**：核对中发现缺口
- **触发**：缺口被确认（oracle 失效、材料未交付、契约无代码实现）
- **结果**：缺口在本卡如实登记，承接方写明；本卡不做产品修复、不改母 PRD

### 状态覆盖清单

- [ ] **默认态** — 套件 8 项全部具备可执行入口且环境就绪时的正常执行路径（SCN-001）
- [ ] **空态** — 某条用例在原件层面无任何可用证据时记为 `unverified` 并进入完成宣称披露，不伪造替代（SCN-003）
- [ ] **错误态** — 某条套件内用例的失败判据被触发时整体不完成（SCN-003）
- [ ] **加载态** — N/A — 理由：本卡无产品 UI 与异步加载面（`ui_applicability=non_ui`，`prd.md:545`）
- [ ] **取消态** — 审查请求被取消/超时的历史事实必须原样保留，不得因取消而删除原件（SCN-004）
- [ ] **边界态** — 被点名 oracle 在 HEAD 失效或确定性失败时，如实记为真实失败事实但不作为套件内用例失败判据（SCN-003）
- [ ] **权限态** — N/A — 理由：本卡无产品权限面；只有「用户抽验权」这一读取通路（SCN-002）
- [ ] **竞态** — N/A — 理由：本卡独占运行、不与任何卡并行（`prd.md:543`），无并发写面（`prd.md:544`）

## 4. 产品事实与假设（PFACT）

- PFACT-001 verified：`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 可用，`npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 实跑 `Tests 5 passed (5)`、exit 0（9143 ms；自建 tmp git repo、注入 tmp HOME/XDG_CONFIG_HOME/WORKFLOWHUB_TASK_DIR，无网络无 provider）。（本卡 build-plan 取证报告 `[实跑]`）关联 FR-C10-008、AC-C10-008。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-002 verified：同一文件用 `node --test tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 实跑 exit 1（该文件 `import { describe, expect, it } from "vitest"`）。（取证报告 `[实跑]`）关联 FR-C10-011、AC-C10-011。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-003 verified：`node tests/acceptance/card-09-session-ledger.mjs` 裸跑 exit 1（缺 `--session`）；补 `--session <真实 session.jsonl|.zstd> [--since ms] [--until ms]` 后输出合法 JSON；退出码语义是自检通过，不是 AC 通过。真实 DSH session 日志在 `~/.dsh/sessions/<project>/`。（`decision-log.md` ADR-009 与取证报告 `[实跑]`）关联 FR-C10-011、AC-C10-011。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-004 verified：`npx vitest run tests/acceptance/card-09-session-ledger.test.mjs` 实跑 21 passed。（取证报告 `[实跑]`）关联 FR-C10-005、AC-C10-005。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-005 verified：`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` 在 HEAD 确定性失败，`npx vitest run` 连跑 3 次结果一致（3/3）：`Test Files 1 failed (1) Tests 1 failed | 11 passed (12)`，失败用例 `routes review:risk before task lookup`，`Received: "{\"error\":\"unknown public runtime action\"…}"`；归因提交 `9350607c`（2026-10-02 19:44:31 +0800 `refactor: route public entries through narrow tools`）移除了 `review:risk` 路由。测试文件全文不含字符串 `review:risk`（实际为 `behavior="review"` + `--action=risk`）。（取证报告 `[实跑]`/`[实读]`）关联 FR-C10-011、AC-C10-011。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-006 verified：`tests/acceptance/` 下从未有过 card-04/05/06/08 的 oracle（`grep` 空 + `git log --diff-filter=D` 空）；HEAD 实存 10 个文件：`build-prd-current.mjs`、`card-01-current.mjs`、`card-02-current.mjs`、`card-02-current.test.mjs`、`card-03-current.mjs`、`card-03-current.test.mjs`、`card-07-current.mjs`、`card-09-session-ledger.mjs`、`card-09-session-ledger.test.mjs`、`workflowhub-research-handoff-hardening.acceptance.mjs`。（`decision-log.md` F-005、RISK-007；取证报告 `[实读]`）关联 FR-C10-002、FR-C10-012、AC-C10-002、AC-C10-012。
- PFACT-007 verified：九卡外置 `quality/` 子目录形态不一——card-01/02/03/05/07 ＝ `authorizations confirmations evidence facts reviews stage-reflection tests`；card-04 多 `decisions` + `oracle`；card-06 无 `authorizations`；card-08 只 4 个；card-09 只 3 个（`evidence reviews tests`）。存在性核对必须逐卡实核，不得按统一目录清单套用。（`decision-log.md` F-004；取证报告 `[实读]`）关联 FR-C10-002、AC-C10-002。
- PFACT-008 verified：规划任务 `facts.jsonl` 恰好 1 行且 `stage="make-decision"`，`quality/facts/` 62 份全为 `make-decision`，**无 build-prd 阶段事实行**；`build-prd` 是 portable workflow、本就不成为第六正式阶段，故这是符合而非缺陷。（`decision-log.md` F-013；取证报告 `[实读]`）关联 FR-C10-004、AC-C10-004。
- PFACT-009 verified：E2E-1 的入口面**无任何原件**——唯一线索是 agent 自写决策日志的回读（`readTaskTypeFromDecisionLog readback=规划任务`，自指）；`identity/executions/bootstrap-*.json` 无人工选择字段；交互聚合无 host entry 事件；`.agenthub/handoff/handoff-make-decision.md` 自述非正式 stage completion。（取证报告 `[实读]`）关联 FR-C10-004、AC-C10-004。
- PFACT-010 verified：PRD 真实最终确认原件在 `<TASKS_ROOT>/workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/portable-workflow-outcomes/build-prd/8da4882ea75778316284cdffb4c92139e51a230f7ec94ac9eafc412f8fd8c8b4.json`（`human_approved:true`、`display_before_reply:true`、`reply_text` 含「批准为最终 PRD」、`material_refs` 含 `prd.md` `status:"final"`）。（`decision-log.md` F-013；取证报告 `[实读]`）关联 FR-C10-004、AC-C10-004。
- PFACT-011 verified：PRD 当前 sha256 ＝ `deb2da5620e5fd97b52028d810b2ee6bcc1c6c090360d8696a7c2ede15257905`（698 行 / 140544 字节），与确认时记录的 `f05577c3…`、`51d8764e…` 均不匹配；原因是 2026-10-04「只注不改」上游变化注（`prd.md:603`）在确认之后追加。确认绑定的 `Decision revision: revision-9ede5110c44f2b08ae6fe31b4709eabe9a3f22daeba5772293fe2d7ae96fb0fb` 与当前 `prd.md:3` 逐字一致。（`decision-log.md` F-013；取证报告 `[实读]`）关联 FR-C10-004、AC-C10-004。
- PFACT-012 verified：CARD-04 的「验收写入步」在 `workflows/make-decision/steps.json` 的 **12 步**（`load-context`、`triage-scope`、`research-and-diverge`、`direction-advice`、`outline-talk`、`grill-with-docs`、`module-convergence`、`write-decision-draft`、`detail-advice`、`approve-decision`、`stage-end-spec-analyze`、`stage-handoff`；末两步即第 11、12 步）里**不存在**；CARD-04 侧也无任何 step 绑定，其冻结的三处接口面都不是 make-decision 步骤。（取证报告 `[实读]`）关联 FR-C10-008、AC-C10-008。
- PFACT-013 verified：`buildPostAcceptanceChainRows` 与 `stage-end-report-facts` 在 HEAD 已无 `.mjs` 实现（`grep --include=*.mjs` 无输出；只命中 `.md`/`.json`）；CARD-04 主验收测试资产 `tests/contract/acceptance-execution-tier.test.mjs`（`34b968c3` 新增 2098 行）在 HEAD 已完全不存在。（取证报告 `[实读]`）关联 FR-C10-008、AC-C10-008。
- PFACT-014 verified：CARD-07 自陈「需向 CARD-10 注入改造清单 + 冻结接口符号」的材料**从未交付**（`grep -rln "写面改造清单\|冻结接口符号"` 只命中 CARD-07 `research/coverage-matrix.md:213`/`:852` 的自陈行，无交付件）；唯一被指名 oracle 全文不含 CARD-07/头脑风暴/验收写入/共享写面字样。（取证报告 `[实读]`）关联 FR-C10-008、AC-C10-008。
- PFACT-015 verified：INTEG-3 三审查点四份原件齐备且 `outcome=completed`——`2026-10-04-051-build-plan-document.json`（5 providers 5/5，findings 32）、`2026-10-05-005-build-code-phase-p1.json`（2/2，findings 5）、`2026-10-05-010-build-code-phase-p2.json`（2/2，findings 3）、`2026-10-05-017-verify-code-document.json`（3/3，findings 2）；同时存在 `2026-10-05-018-build-plan-document.json` 与 `2026-10-04-028-make-decision-detail.json` 的 `unavailable` 事实，未被漂白成 `completed`。（取证报告 `[实读]`）关联 FR-C10-009、AC-C10-009。
- PFACT-016 verified：CARD-09 自己的终末结论写 `"resource_benefit": "inconclusive"`、配对基线 `work` 目录 `status:"unavailable"`（`reason:"same task/work absent; no retained provider work/<key>/bundle/materials original available for paired statistic"`）、`OPEN002:"open"`；`quality/evidence/execution-inputs` 从 16 文件/1000559 字节（before）→ 19/1031558（P1 after）→ 37/1220640（终末），证据量增长而非下降。（取证报告 `[实读]`）关联 FR-C10-009、AC-C10-009。
- PFACT-017 verified：HEAD 版 `docs/contracts/card-01-stage-material-interface.md` 已被重写为 5 行 761 字节（sha256 `1ab0afe45c9001e93ca95091d8bff848980c11f6f19810bd03d779214554df72`）；46 行旧蓝图可经 `git show 7c4a2444^:docs/contracts/card-01-stage-material-interface.md` 取得（sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`）；`runtime/task/task-topology.mjs` 在 HEAD ABSENT。**核实事实（build-plan 修订期实跑）：`git show d1097711:docs/contracts/card-01-stage-material-interface.md` 与 `git show 7c4a2444^:docs/contracts/card-01-stage-material-interface.md` 产出完全相同的 blob——都是 46 行、sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`，两条命令不互斥、可互换。**（`decision-log.md` F-011；取证报告 `[实读]`/`[实跑]`）关联 FR-C10-007、AC-C10-007。
- PFACT-018 verified：CARD-07 唯一行为级消费证据（提交 `18b8134a3e42b2707f1823f029e4d593a894daf0` 在 `runtime/stage/stage-context.mjs` 新增 `+import { readActivationCohort } from "../task/task-topology.mjs";`）在 HEAD 已被 `457299b3` 移除；CARD-03/04/05 无消费证据。取证必须走历史只读通路并显式标注「引用 CARD-06 之前的制品版本，非 HEAD 现状」。（`decision-log.md` F-011、U-013；取证报告 `[实读]`）关联 FR-C10-007、AC-C10-007。
- PFACT-019 verified：E2E-3 的受控注入方案已实跑成功（独立 demo exit 0），四步证明链成立：真失败 `exit_code:3` + 原始 stdout/stderr 含 `RED-STDOUT-MARKER`/`RED-STDERR-MARKER` 原样落盘 → 修复复验 `exit 0` 写新文件不覆盖 → 重读旧件字节未变 → `facts.jsonl` 0 行且未把失败 slug 写成 `"passed"`；两种注入形态取自 `card-04-real-entry-chain-e2e.test.mjs`：`verify execute` 传 `argv:[process.execPath,"-e",'…process.exit(3);']`；`services.runReviewRound` 返回 `{status:"unavailable", error:{code:"OWNED_UNAVAILABLE", message:"controlled no-model review"}}`，原始字节 `Buffer.from([0xff,0x00,0x41])` 保留。（取证报告 `[实跑]`）关联 FR-C10-006、AC-C10-006。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-020 verified：`node tests/acceptance/card-01-current.mjs` 实跑 exit 1，23 条 entry 全部 `expected:{status:"passed"}` / `actual:{status:"missing"}`；5 个依赖测试已被 CARD-06 退役删除（`a9a173f2` 删 4 个、`457299b3` 删 1 个）；CARD-06 迁移表把该 oracle 判为 `ARCHIVE` 且未登记这 5 个连带依赖。（取证报告 `[实跑]`/`[实读]`）关联 FR-C10-002、AC-C10-002。（**执行者**＝本卡 build-plan 取证子代理 `[实跑]`；**原始 output 落点**＝本卡 build-plan 取证报告，**未落** `<TASK_DIR>/quality/tests/`；故本条不是 verify-code 的亲跑记录，与 `## 测试路线` 的「本阶段未运行任何新测试」不冲突。）
- PFACT-021 verified：make-decision 不写 `facts.jsonl`——唯一 writer 是 `runtime/task/task-store.mjs:84`，唯一调用点 `tools/cli/stage-runtime.mjs:803`，只写 build-code 的 `phase_progress` 游标。（`decision-log.md` F-003）关联 FR-C10-013、AC-C10-013。
- PFACT-022 inferred：五阶段 e2e 的失败由 CARD-06 引入。依据＝改动面（`runtime/interface/runtime-facade.mjs` + `tools/cli/stage-runtime.mjs`）正是 CARD-06 窄工具化写面、早于 CARD-06 主退役序列 `b31d202e`、同批提交均属 CARD-06；**限制**：`9350607c` 提交 body 为空、未自证，需 CARD-06 侧确认。（取证报告 `[推断]`）关联 FR-C10-011、AC-C10-011。
- PFACT-023 inferred：`tests/acceptance/card-01-current.mjs` 的失效由 CARD-06 的退役删除造成，且迁移表 SURVIVOR 行（`MT-6-071`）依赖清单不完整。依据＝5 个缺失文件全部由 `a9a173f2`/`457299b3` 删除、迁移表对它们判 `DELETE` 正确但未登记连带破坏；**限制**：未读两个提交的完整 body、未核 `package.json` 是否引用该 oracle。（取证报告 `[推断]`）关联 FR-C10-002、AC-C10-002。
- PFACT-024 unknown：宿主侧（DSH GUI/会话日志）是否存在「人工选择规划任务」的界面事件原件——仓库与外置任务树内均无此原件，需查宿主会话侧记录。负责人：CARD-10 owner（verify-code）；影响：E2E-1 入口面只能判 `unverified`。关联 FR-C10-004、AC-C10-004、RISK-C10-003。
- PFACT-025 verified：本卡 build-code **无新实现、不拆 Phase、不产 phase 级代码审查原件**（ADR-010，依据 `prd.md:549` 第③条）；这是事实不是缺失。（`decision-log.md` ADR-010）关联 FR-C10-005、AC-C10-005。
- PFACT-026 verified：本卡无新增 `tests/` 脚本（ADR-006），故 Phase 无新增预写测试文件、走 G-2 通道；执行载体是任务内最小驱动脚本，不进主仓 `tests/`。（`decision-log.md` ADR-006、ADR-009）关联 FR-C10-012、AC-C10-012。
- PFACT-027 verified：母 PRD 多写的「全 phase 结束集成审查」（SD-07 第③点，`prd.md:56`/`:572`/`:600`）已按退役处理；四个现行 workflow 合同一致写明没有该审查点（`workflows/make-decision/SKILL.md:38`、`workflows/build-plan/SKILL.md:36`、`workflows/build-code/SKILL.md:22`、`workflows/verify-code/SKILL.md:34`）。（`decision-log.md` ADR-002、`## 退役登记`）关联 FR-C10-005、AC-C10-005。
- PFACT-028 not_applicable：本卡不适用产品 UI 页面。不适用理由：`ui_applicability=non_ui`（`prd.md:545`），无设计稿，无用户可见界面面。关联 FR-C10-001、AC-C10-001。

## 5. 功能需求

### 套件成形与输入核对（C10-I）

- **FR-C10-001**：总体集成验收套件以母 PRD 所载三部分主体成形，每条用例含可观察用例、所需证据、承接负责人；执行所用套件与 PRD 主体一致，无临时增删用例、无改写失败判据。范围边界：只做条目成形与逐字对照，不做产品实现。依据：R-001、R-010、ADR-007、PFACT-028。场景：SCN-001。验收：AC-C10-001。
- **FR-C10-002**：对 CARD-01..09 逐卡做验收事实存在性核对，判定「事实存在且结论未被漂白」；四判据可机械核验——①该卡外置 `facts.jsonl` 末行为 `stage=close` 记录 ②该卡外置 `quality/` 下审查点原件存在（按该卡实际审查点数）③该卡 `quality/` 与 `facts.jsonl` 中不存在把 `failed`/`unavailable`/`missing`/`unverified` 记为 `passed`/`succeeded` 的记录（逐卡给出计数与命中清单）④用户抽验时定位通路能实际打开原文。范围边界：不重跑各卡内部测试、不逐条复核各卡 AC 内容。依据：R-003、PFACT-006、PFACT-007、PFACT-020、PFACT-023。场景：SCN-002、SCN-006。验收：AC-C10-002。
- **FR-C10-003**：提供用户抽验权通路——形态是「定位指引规则 + 检索通路说明」，不是新用例；只做定位与原文引用，不逐条复核 AC 内容，不前置编制全量对照表。范围边界：通路缺失或定位无法回读原文时计输入不合格，阻断完成宣称；「未前置编制全量对照表」本身不构成失败条件。依据：R-003、ADR-011。场景：SCN-002。验收：AC-C10-003。

### 套件执行（C10-E）

- **FR-C10-004**：执行 E2E-1（规划旅程端到端）。真实入口＝宿主 AI 助手的真实任务发起入口（人工选择「规划任务」）；逐条给出真实入口证据映射（命令、exit code、output 落点）：①规划任务 `facts.jsonl` ②`quality/confirmations/` 6 份原件 ③`build-prd/8da4882e….json` 的 `reply_text`/`human_approved`/`display_before_reply` ④`prd.md:3` 与 `shasum -a 256`。范围边界：判「旅程可证、入口未验证」并披露；不冒称亲历、不把 `unverified` 写成通过。依据：R-002、R-008、PFACT-008..PFACT-011、PFACT-024。场景：SCN-001。验收：AC-C10-004。
- **FR-C10-005**：执行 E2E-2（实施旅程端到端）。主证据＝CARD-09 归档四份审查原件（`2026-10-04-051-build-plan-document.json`、`2026-10-05-005-build-code-phase-p1.json`、`2026-10-05-010-build-code-phase-p2.json`、`2026-10-05-017-verify-code-document.json`）；补充活证据＝本卡自身四阶段执行。审查节奏按现行三审查点核对（build-plan 合并审查、每 phase 代码审查、verify-code 终末代码审查），verify-code 功能验收记录必须与终末代码审查分开成件。RED→GREEN 按 G-2 豁免如实披露（四组成缺一不可：写明「本卡无行为变更，故无新 RED→GREEN」、补一条可失败检查、复跑现成 oracle、引用 CARD-09 归档真实 RED→GREEN 原件）。范围边界：不得以代码审查冒充功能验收；不得因本卡无 phase 级代码审查原件而判 E2E-2 失败（那是事实不是缺失）。依据：R-002、R-007、PFACT-004、PFACT-025、PFACT-027、ADR-002、ADR-003、ADR-010。**授权依据（必须分开引用）**：审查节奏项的读法依据＝**U-018 / V-025**（用户以母任务 owner 身份正式授权，范围**只限 E2E-2 该项**）；共存判据的依据＝**`prd.md:603`**（该上游变化注把 INTEG-3 判据更新授权给 CARD-10 owner）。ADR-002 明说「不得仅凭披露放行」，故两个 ID 必须真的写出、可定位。场景：SCN-001。验收：AC-C10-005。
- **FR-C10-006**：执行 E2E-3（失败不漂白路径）。在同类环境中注入一次真实测试失败（ADR-004 选定注入真实测试失败，非「审查工具不可用」分支），如实记为失败 → 修复 → 复验。区分两个事实：①被保留的初始失败事件（原始 failed 原件不删除不改写）②本用例终态＝注入的失败被修复后复验通过。范围边界：不得因「曾出现失败」判本用例失败，也不得因复验通过而删除或漂白初始失败事实；禁止人为制造假失败。依据：R-006、PFACT-019、ADR-004、ADR-008。场景：SCN-003。验收：AC-C10-006。
- **FR-C10-007**：执行 INTEG-1（接口蓝图跨卡消费）。取证只走只读历史通路（`git log -S 'from "../task/task-topology.mjs"' -- runtime/stage/stage-context.mjs`、`git show d1097711:docs/contracts/card-01-stage-material-interface.md`、对 CARD-03/04/05/07 外置 `quality/` 树的关键词检索），每条记录 exit code 与 output 落点；显式标注「引用 CARD-06 之前的制品版本，非 HEAD 现状」。**INTEG-1 没有具名 oracle，其取证只有上述只读历史通路，不得用其它用例的 oracle 充当本用例取证。** 判据终态 `unverified`：成功条件①无静默偏离成立、②各卡有消费证据只 1/4 张卡有行为级证据；不新增失败判据、不改写 `prd.md:591`。范围边界：不得删用例、不得记 `N/A`、不得恢复并发限制。依据：R-008、PFACT-017、PFACT-018、ADR-001、ADR-014。场景：SCN-006。验收：AC-C10-007。
- **FR-C10-008**：执行 INTEG-2（make-decision 共享写面共存）。定向 oracle 执行形态＝`npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（单文件定向执行；build-plan 可细化参数但不得换成全量回归），记录 exit code 与 output 落点；并做两侧原件对照（CARD-04 外置 `quality/{decisions,oracle}`、CARD-07 外置 `quality/`）。判据终态 `unverified`：两侧唯一共同点是阶段名而非步骤；CARD-04 冻结接口面②③在 HEAD 已无 `.mjs` 实现；CARD-07 自陈需注入的材料从未交付；唯一 oracle 不覆盖 CARD-07 侧。范围边界：当前证据下终态判 `unverified`；若触发 `prd.md:596` 的失败判据（一方改动覆盖另一方契约、或两契约对同一步骤声明不一致）则如实判 `failed` 并阻断完成宣称；不得判 `passed`。依据：R-008、PFACT-012..PFACT-014、ADR-001、ADR-011。场景：SCN-006。验收：AC-C10-008。
- **FR-C10-009**：执行 INTEG-3（审查基建共享写面共存）。可实跑部分＝对 CARD-09 `quality/reviews/` 四份审查原件与资源/效率验收原件做存在性与结论对照（写明 `git grep`/`node -e` 一类只读命令形态、exit code 与 output 落点）；无现成 oracle 的共存断言部分显式标 `unverified` 并按 ADR-012 进入完成宣称。分项裁决：三审查点原件 → 可证；前后审查链仍产出可消费结果 → 可证；回收不误删在途材料 → 可证；资源/效率改动本身有可对照的前后改善 → 无对照（CARD-09 自己记 `inconclusive`）。合并终态 `unverified`。范围边界：当前证据下终态判 `unverified`；不得判 `passed`、不得记 `N/A`、不得删用例；若共存断言被证伪则如实判 `failed` 并阻断完成宣称。依据：R-008、PFACT-015、PFACT-016、ADR-001、ADR-011。场景：SCN-006。验收：AC-C10-009。

### 关键失败路径与执行纪律（C10-F）

- **FR-C10-010**：对 SD-05 约定的三条关键失败路径逐条留核对记录——①真实测试失败被修复并复验（落 `<TASK_DIR>/quality/tests/`）②审查工具 unavailable 时独立替代或 `unverified` 披露（落 `<TASK_DIR>/quality/reviews/`，OCR 回退口径按 `workflows/build-code/SKILL.md:28-30`）③去阻断后历史失败事实未漂白（落 `<TASK_DIR>/quality/evidence/`）。路径②取证形态＝历史真实原件（CARD-05 26 份 `OCR_DELEGATION_UNAVAILABLE`、CARD-04 2 份 `OCR_ALL_PROVIDERS_FAILED`）+ 本轮受控演练两层并用，并同条写死三条边界：该演练是受控故障注入、不是自然故障；「独立替代审查真的顶班」在整个归档中从未发生过；本轮 `ocr` 实测在位（`open-code-review v1.12.12`，高于回退阈值 1.12.9）。**核对记录字段集（每条一份，AC-C10-010 的 `证据：` 据此）**：命令、exit code、output 落点、判定值，以及「引用 / 亲历」标注（写成 `引用-亲历: 引用` 或 `引用-亲历: 亲历`；缺该字段即视为不区分引用与亲历）。范围边界：缺任一路径核对记录整体不得声明完成；不冒称亲历；不人为制造假失败。依据：R-004、ADR-008、ADR-013。场景：SCN-004。验收：AC-C10-010。
- **FR-C10-011**：修正并写死两处命令形态，使执行记录可复跑。范围边界：只改执行命令形态，不改任何断言、不改失败判据、不改 `tests/` 文件。依据：R-002、R-010、PFACT-002、PFACT-003、PFACT-005、PFACT-022。**命令形态口径**：本卡统一为 `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 与 `node tests/acceptance/card-09-session-ledger.mjs --session <真实日志> --since <ms> --until <ms>`；上游 `decision-log.md:628` 仍写 `node --test …`（错的，实跑 exit 1）——**`decision-log.md:628` 为被修正形态，以此处为准**。场景：SCN-003。验收：AC-C10-011。
- **FR-C10-012**：执行广度只跑三个与套件直接相关的 oracle 单元——①`tests/acceptance/card-09-session-ledger.mjs`（会话账本 CLI）②`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` ③`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`；其余 CARD-01..09 只做原件存在性核对 + 归档引用。**三个 oracle 单元；`tests/acceptance/card-09-session-ledger.test.mjs` 是 ① 的 vitest 包装，若两者都执行只算同一个 oracle 单元，不是第四个 oracle。** 范围边界：不跑 `tests/acceptance` 下全部 oracle、不跑 `tests/` 下其他测试、不做无范围全量回归；某条用例的对应 oracle 缺失或不可执行时按失败事实如实记录并阻断完成宣称，不因广度受限降级为 `N/A`。依据：R-010、PFACT-006、PFACT-026、ADR-009。场景：SCN-001。验收：AC-C10-012。
- **FR-C10-013**：原始证据全部落外置 `<TASK_DIR>/quality/`（`reviews/` 审查原件、`tests/` 测试执行原件、`evidence/` 其余原件），按日期+序号+描述命名、append-only；仓库内不复制任何原始件、不做目录快照或整树归档。范围边界：仓库内只留本卡 `specs/workflowhub-thin-core-card-10-20260919/` 的 `spec.md`/`phases/**` 与 verify-code 结论。依据：R-009、PFACT-021、ADR-005、ADR-006。场景：SCN-001。验收：AC-C10-013。

### 完成宣称与缺口（C10-C）

- **FR-C10-014**：完成宣称只发生在真实入口联通实跑记录、约定成功条件达成记录、关键失败路径核对记录三者齐备之后；宣称与展示必须逐条包含三条 INTEG 的 `unverified` 结论与各自缺口去向/承接方、accepted_risk（DIR-D1-T10/finding #18）、未验证项与风险清单。范围边界：任一未验证项不得写成 pass 或「成功条件已达成」；三条 `unverified` 不阻断完成宣称（`prd.md:607` 的阻断条件是套件内用例**失败**），但必须显式披露；子任务状态相加不得充当整体完成。依据：R-005、R-011、ADR-012。场景：SCN-005。验收：AC-C10-014。
- **FR-C10-015**：缺口在本卡如实登记并写明承接方；缺口修复交回原责任卡，本卡不做产品修复、不改母 PRD、不动母任务。范围边界：INTEG-1 缺口的承接方＝无（只在本卡记录）；五阶段 e2e oracle 缺口与 `card-01-current.mjs` oracle 缺口交回 CARD-06（推断，需对方确认）；INTEG-2 缺口交回 CARD-04/CARD-07 两侧。依据：R-005、R-009、ADR-014。场景：SCN-006。验收：AC-C10-015。

## 6. 模块划分

- **套件条目模块**
  - **负责什么**：持有 8 项条目（0 号输入核对 + 7 项用例）的可观察用例、成功条件、失败条件、证据类型、承接负责人，并与 `prd.md:551-607` 逐字对照。
  - **对外提供什么**：条目表与对照结论，供执行模块与完成宣称模块引用。
  - **依赖谁**：母 PRD 套件主体、本卡 `decision-log.md` `## 验收面`。
  - **测试边界**：条目齐备性与逐字一致性可核对；不测试任何产品行为。
- **执行记录模块**
  - **负责什么**：为每条用例记录命令、exit code、output 落点与结果判定；区分「脚本自证」与「真实入口执行」。
  - **对外提供什么**：逐条执行记录，落 `<TASK_DIR>/quality/tests/` 与 `quality/evidence/`。
  - **依赖谁**：仓库现成 oracle、外置任务目录原件、任务内最小驱动脚本。
  - **测试边界**：命令可复跑性可核对；不重跑各卡内部测试。
- **存在性核对模块**
  - **负责什么**：对 CARD-01..09 逐卡核四判据（末行 `stage=close`、审查点原件存在、无漂白记录、定位可回读），产出逐卡计数与命中清单。
  - **对外提供什么**：存在性核对记录与用户抽验通路说明，落 `<TASK_DIR>/quality/evidence/`。
  - **依赖谁**：九卡外置 `quality/` 与 `facts.jsonl`、仓库归档 `specs/archive/workflowhub-thin-core-card-0X-20260919/`。
  - **测试边界**：不逐条复核各卡 AC 内容；不重跑各卡测试。
- **完成宣称模块**
  - **负责什么**：判定三条前置记录是否齐备；组装含未验证项与风险的完成宣称与展示。
  - **对外提供什么**：完成宣称判定与展示清单。
  - **依赖谁**：执行记录模块、存在性核对模块、关键失败路径核对记录。
  - **测试边界**：判定可核对（前置齐备性 + 披露项逐条在列）；不测试产品功能。
- **缺口登记模块**
  - **负责什么**：登记缺口根因、承接方、交回动作；区分「本卡承接」与「承接方＝无」。
  - **对外提供什么**：缺口清单，落 `<TASK_DIR>/quality/evidence/`。
  - **依赖谁**：存在性核对记录、执行记录。
  - **测试边界**：不修复缺口、不改母 PRD、不动母任务。

## 7. 关键实体

- **套件条目**
  - **定义**：母 PRD 总体集成验收套件的一项，含六项：①编号 ②可观察用例 ③成功条件 ④失败条件 ⑤证据类型 ⑥承接负责人。**「五要素」是本规格 `### 套件条目与执行映射` 与 AC-C10-001 的核对用词，其唯一定义＝六项中的前五项**（①编号 ②可观察用例 ③成功条件 ④失败条件 ⑤承接负责人）；第六项「证据类型」不单列为要素，归入条目表的「证据落点」列与逐条清单的证据行。
  - **字段和约束**：条目编号 `0..7`；0 号是输入核对（非用例）；1..6 号是套件内用例（E2E-1/2/3、INTEG-1/2/3）；7 号是关键失败路径核对；失败判据逐字来自 `prd.md`，不可改写。
  - **关系**：条目 → FR/AC 一一对应；条目 0 → 存在性核对记录；条目 1..6 → 执行记录。
- **执行记录**
  - **定义**：一次真实入口执行的原始留档。
  - **字段和约束**：命令、exit code、output 落点、判定结果（`passed`/`failed`/`unverified`/`unavailable`）；必须标注「驱动只是发起真实入口，不构成自证」。
  - **关系**：执行记录 → 套件条目（多对一）；执行记录 → 缺口条目（失败/未验证时）。
- **存在性核对记录**
  - **定义**：对一张卡「事实存在且结论未漂白」的判定记录。
  - **字段和约束**：卡号、四判据逐条结果、计数与命中清单、定位通路；覆盖 CARD-01..09 全部 9 张，缺一即输入不合格。
  - **关系**：存在性核对记录 → 用户抽验通路；存在性核对记录 → 完成宣称前置。
- **缺口条目**
  - **定义**：核对或执行中发现的、本卡不修复的缺口。
  - **字段和约束**：根因、证据引用、承接方（具名卡或「无」）、交回动作、是否需要对方确认。
  - **关系**：缺口条目 → 责任卡；缺口条目 → 完成宣称披露项。
- **完成宣称**
  - **定义**：整体交付是否可声明完成的判定与其展示内容。
  - **字段和约束**：三前置记录齐备性、三条 INTEG `unverified` 逐条、accepted_risk、未验证项与风险清单、停止规则引用。
  - **关系**：完成宣称 → 执行记录 + 存在性核对记录 + 关键失败路径核对记录。

## 8. 数据和生命周期

- **数据粒度**：一条执行记录对应一次真实入口执行（一条套件条目）；一条存在性核对记录对应一张卡；一条缺口条目对应一个已确认缺口。
- **数据时效**：执行记录与核对记录在产生时即刻落盘（append-only，日期+序号+描述命名）；不做汇总快照，不保留派生副本。
- **缺失或迟到**：原件缺失或读取不到时如实记 `missing`/`unavailable`/`incomplete`，保持 `unknown`，不得伪造通过；缺失项进入缺口登记。
- **预览与正式**：本卡不产预览态数据；`spec.md` 与 `phases/**` 是正式制品，`<TASK_DIR>/quality/` 下原件是正式证据。
- **当前与历史**：HEAD 现状与 CARD-06 之前的制品版本必须分开标注——引用旧版本时显式写「引用 CARD-06 之前的制品版本，非 HEAD 现状」；历史失败事实（如 `unavailable` 审查轮次）原样保留，不因后续成功而删除。
- **归属与清理**：执行证据归 `<TASK_DIR>/quality/`，由本卡 append-only 维护，不清理、不覆盖、不复制进仓库；仓库内写入面仅 `specs/workflowhub-thin-core-card-10-20260919/**`。

## 9. 兼容性预留

- **既有消费方**：母 PRD 的「具体重构验收标准」(SD-13①) 消费本卡的完成宣称；用户消费抽验通路；verify-code 消费 `phases/**`。三者读法必须一致。
- **命名预留**：本卡自铸 `PFACT-{NNN}`、`FR-C10-{NNN}`、`AC-C10-{NNN}`；母 PRD 的 `FR-47..50`/`AC-47..50` 只作来源 ID 出现在 `## 来源与决策映射` 与 `### 需求到任务追踪`，不占本卡编号空间。
- **容器预留**：`<TASK_DIR>/quality/{tests,reviews,evidence}` 三个子目录沿用 CARD-09 既有约定；新增子目录时才建，不预先铺空目录。
- **状态预留**：七值任务状态（`not-started`/`in-progress`/`succeeded`/`failed`/`unverified`/`blocked`/`abandoned`）与质量缺口值（`missing`/`unavailable`/`incomplete`）沿用既有语义；`unverified` 与 `failed` 必须区分，不得互换。
- **扩展边界**：后续若有人要补做「全 phase 结束集成审查」或恢复并发限制，必须在母任务层面重新决策；本卡不预留该扩展位，也不在 `spec.md` 里为它留钩子。SD-07 第③点的退役处理**不是按本卡自定口径**：**审查节奏项的读法依据＝U-018 / V-025**（用户以母任务 owner 身份正式授权，范围只限 E2E-2 该项）；**共存判据的依据＝`prd.md:603`**（该上游变化注把 INTEG-3 判据更新授权给 CARD-10 owner）。ADR-002 明说「不得仅凭披露放行」，故两者必须分开引用、可定位。

## 10. 明确不做与默认必须成立

### 明确不做

- 不改产品代码：不动 `runtime/**`、`core/**`、`tools/**`、`skills/**`、`workflows/**`、`config/**`、`contracts/**`。
- 不改 `tests/**`：不新增、不修改、不删除任何测试脚本或断言；执行载体是任务内最小驱动脚本，不进主仓 `tests/`。
- 不改 `workflows/**`：四个现行 workflow 合同的审查点表述逐字保留。
- 不改母 PRD：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 只读，不改任何字节（包括 SD-07 `:56`、E2E-2 `:572`、INTEG-3 `:600` 的旧表述）；新旧差异只在 `decision-log.md` 的退役登记与 Supersedes 登记。
- 不改已归档卡的任何材料：`specs/archive/**` 只读保留。
- 不新增套件用例、不删除套件用例、不改写任何失败判据。
- 不重跑各卡内部测试；不逐条复核各卡 AC 内容；不把逐条复核各卡 AC 内容当作整体完成条件。
- 不恢复「限制单次审查并发 provider 数」；不补回已退役的全 phase 结束集成审查。
- 不新增产品功能实现、public command、stage 或持久对象。
- 不把原始件复制进仓库；不做目录快照或整树归档；不把驱动脚本当 oracle。
- 不人为制造假失败；不把环境故障、配置缺失或无意义断言当作有效 RED。
- 不做无范围全量回归：不跑 `tests/acceptance` 下所有 oracle，不跑 `tests/` 下其他测试。
- 不修复缺口：缺口交回原责任卡；本卡不承接产品修复。

### 默认必须成立

- 每条套件内用例的证据必须含命令、exit code 与 output 落点；只写归档路径不构成真实执行记录。
- `unverified`/`unavailable`/`incomplete` 一律如实记录，不得写成 `passed`/`succeeded`。
- 任一卡验收事实缺失或存在漂白即计输入不合格，整体不得声明完成。
- 任一套件内用例（E2E/INTEG）失败即整体不完成。
- 三条 INTEG 判 `unverified` 不阻断完成宣称，但必须逐条写进完成宣称与展示。
- 本卡 build-code 无新实现、不拆 Phase、不产 phase 级代码审查原件；`phases/**` 的实际消费者是 verify-code 执行者（`prd.md:549` 第④步）。
- 本卡无新增 `tests/` 脚本，Phase 无新增预写测试文件，走 G-2 通道（ADR-006）。
- 推进与审查派发不被任何机器校验（revision 绑定、快照树认证、材料身份/哈希校验、回执校验）阻断（SD-17）。

## 验收流程

1. 套件成形：按 `prd.md:551-607` 建立 8 项条目表，逐字对照失败判据（AC-C10-001）。
2. 输入核对：对 CARD-01..09 逐卡核四判据，产出逐卡计数与命中清单；建立用户抽验通路（AC-C10-002、AC-C10-003）。
3. 套件执行：按 E2E-1 → E2E-2 → E2E-3 → INTEG-1/2/3 顺序逐条执行，每条记录命令、exit code、output 落点（AC-C10-004..009）。
4. 关键失败路径核对：三条逐条留记录（AC-C10-010）。
5. 执行纪律核对：命令形态、执行广度、证据落点逐条核对（AC-C10-011..013）。
6. 完成宣称判定：三前置记录齐备性 + 披露项逐条在列（AC-C10-014）。
7. 缺口登记与交回（AC-C10-015）。

判定器编号统一为 `ORACLE-C10-<主题>`，在 `phases/P1.md` 逐 Task 卡内具名。

## 测试标准

- 本卡**不新增任何测试脚本**（ADR-006）。执行载体是任务内最小驱动脚本，放本卡 `specs/workflowhub-thin-core-card-10-20260919/` 下或外置任务目录，**不进主仓 `tests/`**；执行记录必须明确标注「驱动只是发起真实入口，不构成自证」。
- 仓库内 `tests/` 无新增文件这一事实，由改动范围原始件证明（`git status --porcelain tests/` 输出为空）。
- RED→GREEN：本卡无行为变更，故无新 RED→GREEN，走 G-2 豁免披露（四组成见 FR-C10-005）；RED 证据在 Phase 卡内按 G-2 声明写为 `N/A — 理由：本卡无行为变更`，并给出风险与客观替代。
- 测试机器产物路线（`prd.md:575` FR-20）：硬要求＝真实命令/exit code/output 落点/对应 oracle 证据；trace/JUnit/跳过计数路线**适用时为必需，不适用时记 `N/A` + `reason`**。`N/A` + `reason` 口径锚定 `prd.md:575`：`reason` 必须写明该路线不适用是因为「本卡无新增行为与无新增测试脚本（ADR-006）」，并写明客观替代（复跑既有 oracle + 引用归档原件），不得只写裸 `N/A`。
- 测试层级判定（`test-routing-advisor`）：本卡改动面全为 `.md` 与仓库外证据，无接口/数据/权限/构建链变化 → `routing_tier: "simple"`；`routing_rationale` 引用实际 changed files（`specs/workflowhub-thin-core-card-10-20260919/spec.md`、`phases/**`）与仓库外证据边界；`result: "pass"`。若 build-code 出现任何代码路径，按实际改动重判。
- 三个 oracle 的命令形态：

```bash
npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs
npx vitest run tests/acceptance/card-09-session-ledger.test.mjs
npx vitest run tests/e2e/stage-runtime-five-stage-e2e.test.mjs
node tests/acceptance/card-09-session-ledger.mjs --session <真实 session.jsonl|.zstd> --since <ms> --until <ms>
```

- 反例（不得使用）：`node --test tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（exit 1，该文件是 vitest 文件）；`node tests/acceptance/card-09-session-ledger.mjs` 裸跑（exit 1，缺 `--session`）。

## 架构边界

- 本卡不新增、不修改任何运行时模块；`## 6. 模块划分` 的五个模块都是**记录与判定职责**，不是运行时代码模块。
- 与产品架构的唯一接触面是「读取既有产物」：仓库现成 oracle、九卡外置 `quality/`、母 PRD、四个 workflow 合同、`specs/archive/**`。全部只读。
- 仓库写入面边界：`specs/workflowhub-thin-core-card-10-20260919/spec.md`、`specs/workflowhub-thin-core-card-10-20260919/phases/P1.md`、`specs/workflowhub-thin-core-card-10-20260919/phases/index.md`。仓库外写入面：`<TASK_DIR>/quality/**`。
- 不做目录级或 glob 写入集；每个写入路径全任务只有一个所有者。
- 机器校验不是前置：推进与审查派发不依赖 revision 绑定、快照树认证、材料身份/哈希校验或回执校验（SD-17）。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：产品目标权威＝母 PRD `prd.md:524-607` 与 `decision-log.md`（R-001..R-011、ADR-001..ADR-015）。本文件只承载已接受的翻译与全局工程决策，不新增产品目标。
- **现状与目标差异**：现状＝九卡各自验收完毕、无整体收口记录；母 PRD 套件已定稿但三条 INTEG 的可观察结果在 HEAD 无法完整闭合；两个被点名 oracle 失效或确定性失败。目标＝产出可核对的执行记录、存在性核对记录、关键失败路径核对记录与完成宣称判定。差异不在产品代码，而在「记录与判定是否存在」。
- **读取顺序**：①`decision-log.md` 全读 ②`prd.md:524-607` ③本卡 build-plan 取证报告（核对 PFACT）④`workflows/*/SKILL.md` 的审查点段落 ⑤三个 oracle 源文件 ⑥九卡外置 `quality/` 目录形态 ⑦`specs/archive/**` 中 CARD-04/05/06/07/09 的关键材料。
- **代码锚点**：
  - `tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（8071 B，5 个 `it()`）：INTEG-2 定向 oracle，也是 E2E-3 受控注入的载体（内含 `verify execute` 的 `argv:[process.execPath,"-e",…]` 注入形态与 `services.runReviewRound` 的 `{status:"unavailable", error:{code:"OWNED_UNAVAILABLE"}}` 形态）。
  - `tests/acceptance/card-09-session-ledger.mjs`：会话账本 CLI，需 `--session <path> [--since ms] [--until ms]`；退出码语义是自检通过，不是 AC 通过。
  - `tests/acceptance/card-09-session-ledger.test.mjs`：21 passed。
  - `tests/e2e/stage-runtime-five-stage-e2e.test.mjs`（42 行）：HEAD 确定性失败（3/3），失败用例 `routes review:risk before task lookup`。
  - `workflows/make-decision/steps.json`：**12 步**（第 11＝`stage-end-spec-analyze`、第 12＝`stage-handoff`），无「验收写入步」。
  - `runtime/task/task-store.mjs:84`：`facts.jsonl` 唯一 writer；唯一调用点 `tools/cli/stage-runtime.mjs:803`。
  - `docs/contracts/card-01-stage-material-interface.md`：HEAD 5 行 761 字节；46 行旧蓝图经 `git show 7c4a2444^:docs/contracts/card-01-stage-material-interface.md` 取得。
  - `skills/third-review/test/card09-orphan-reclaim.test.mjs`：回收不误删在途审查材料的对照原件。
- **运行条件**：仓库 worktree 在基线 commit `be393a6ef10db7df919e01f194b47f8dd856d9b4` 之上；`node` 与 `npx vitest` 可用；无网络、无 provider 依赖（`card-04-real-entry-chain-e2e.test.mjs` 自建 tmp git repo 并注入 tmp HOME/XDG_CONFIG_HOME/WORKFLOWHUB_TASK_DIR）；`ocr` 实测在位（`open-code-review v1.12.12`）。

### 接口与失败语义

- **选择的架构方案**：复用（P1 阶梯）——复用既有 oracle、既有公共 CLI（`tools/cli/stage-runtime.mjs`）、外置 `quality/` 原件约定；不新建第二套流程、证据或状态系统（simplicity-guard 结论：无新增能力赢得位置，见 `## 10` 与本节末）。不新增代码。
- **模块职责**：见 `## 6. 模块划分`；五个模块均为记录/判定职责，无运行时接口。
- **接口与数据流**：读取面＝母 PRD、`decision-log.md`、四个 workflow 合同、三个 oracle、九卡外置 `quality/`、`specs/archive/**`（全只读）。产出面＝`spec.md`、`phases/P1.md`、`phases/index.md`（仓库内）与 `<TASK_DIR>/quality/{tests,reviews,evidence}/**`（仓库外）。数据流：套件条目 → 执行记录 → 完成宣称判定 → 展示；核对记录 → 完成宣称前置；缺口 → 交回责任卡。
- **失败语义**：套件内用例失败 → 整体不完成（`prd.md:607`）；输入核对不合格（某卡事实缺失或漂白）→ 整体不完成；三条 INTEG `unverified` → **不阻断**完成宣称，但必须逐条披露；被点名 oracle 自身失效/失败 → 记为真实失败事实，不作为套件内用例失败判据，登记为缺口交回责任卡；原件缺失 → 记 `missing`/`unavailable`，保持 `unknown`，不得伪造通过。
- **新增控制面**：无。不新增 public command、stage、持久对象或门禁；`spec.md`/`phases/**` 是文档制品，`<TASK_DIR>/quality/**` 是证据制品，均不构成运行控制面。
- **simplicity-guard 自检结论**：P0＝本卡所需能力（执行既定套件并留记录）直接对应母 PRD FR-47..FR-50 与 AC-47..AC-50，必要性成立，不能跳过。P1＝仓库已有现成 oracle、公共 CLI 与外置证据约定，直接复用，禁止重写。P2＝需要改造的只是命令形态（两处，见 FR-C10-011），属手术式修正，不新增脚本。P3＝无新增。结论：**已读，无可删内容**；不新增任何文件、字段、模板或第二套记录。本结论写在既有文本字段（本节与 `## 10`），不新建产物。

### 全局文件边界与依赖

- **新增**：`specs/workflowhub-thin-core-card-10-20260919/spec.md`；`specs/workflowhub-thin-core-card-10-20260919/phases/P1.md`；`specs/workflowhub-thin-core-card-10-20260919/phases/index.md`；`<TASK_DIR>/quality/**`（仓库外，按需子目录）。
- **修改**：无仓库内既有文件被修改。`specs/workflowhub-thin-core-card-10-20260919/decision-log.md` 只读不改。
- **禁止改动**：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（母 PRD 只读，含 SD-07 `:56`、E2E-2 `:572`、INTEG-3 `:600` 旧表述）；`tests/**`（无新增、无修改、无删除；ADR-006）；`workflows/**`（四个现行合同逐字保留）；`runtime/**`、`core/**`、`tools/**`、`skills/**`、`config/**`、`contracts/**`、`docs/**`（本卡无产品实现）；`specs/archive/**`（已归档卡只读保留）。理由：本卡是纯验收收口，任何产品面改动都会把「验收」变成「实现」，并破坏 AC-47 的「执行套件而非发明」。
- **全局依赖**：`node` 与 `npx vitest`（oracle 执行）；`git`（历史只读取证）；外置任务目录可读（抽验通路依赖它）；CARD-01..09 的归档与验收事实齐备（准备依赖，`prd.md:540`）。
- **文件归属**：`spec.md`、`phases/P1.md`、`phases/index.md` 归本卡 build-plan/verify-code；`<TASK_DIR>/quality/**` 归本卡 verify-code，append-only；所有只读材料归属其原卡。
- **回滚与恢复**：本卡不产生产品代码，回滚只需删除 `specs/workflowhub-thin-core-card-10-20260919/spec.md` 与 `phases/**`；`<TASK_DIR>/quality/**` 为 append-only 证据，不随回滚删除。触发条件＝本卡被判定越界改动产品面时，立即停止并交回母任务重新决策。

### 套件条目与执行映射

| 条目 | 用例 | 真实入口 | 证据落点 | 承接负责人 |
| --- | --- | --- | --- | --- |
| 0 | 输入核对（非用例） | 九卡外置 `facts.jsonl` 与 `quality/` 只读检索 | `<TASK_DIR>/quality/evidence/input-check/` | CARD-10 |
| 1 | E2E-1 规划旅程 | 规划任务阶段事实 + 确认原件 + `prd.md:3`（**入口面 `unverified`：宿主真实任务发起入口无原件**，见 AC-C10-004） | 命令输出落 `<TASK_DIR>/quality/tests/`；披露说明落 `<TASK_DIR>/quality/evidence/e2e-1/` | CARD-10 |
| 2 | E2E-2 实施旅程 | CARD-09 归档四份审查原件 + 本卡四阶段 | `<TASK_DIR>/quality/tests/`、`quality/evidence/` | CARD-10 |
| 3 | E2E-3 失败不漂白 | 受控注入真实测试失败（`card-04-…e2e.test.mjs` 载体） | `<TASK_DIR>/quality/tests/`、`quality/evidence/` | CARD-10 |
| 4 | INTEG-1 蓝图消费 | 历史只读通路 + 各卡消费点检索 | `<TASK_DIR>/quality/evidence/integ-1/` | CARD-10 |
| 5 | INTEG-2 共享写面 | `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs` + 两侧原件对照 | `<TASK_DIR>/quality/tests/`、`quality/evidence/integ-2/` | CARD-10 |
| 6 | INTEG-3 审查基建 | CARD-09 四份审查原件 + 资源/效率原件只读对照 | `<TASK_DIR>/quality/evidence/integ-3/` | CARD-10 |
| 7 | 关键失败路径核对 | 三条路径逐条核对（含 OCR 回退口径） | `quality/tests/`、`quality/reviews/`、`quality/evidence/` | CARD-10 |

#### 条目逐条成功/失败条件（逐字引 `prd.md` 行号；上表不增列）

「五要素」在本节的唯一定义＝①编号 ②可观察用例（`prd.md` 的「可观察结果」）③成功条件 ④失败条件 ⑤承接负责人；第六项「证据类型」不单列为要素，归入上表「证据落点」列与本清单的证据行。

| 条目 | 成功条件（逐字，含 `prd.md` 行号） | 失败条件（逐字，含 `prd.md` 行号） |
| --- | --- | --- |
| 0 输入核对（非用例） | 对每卡核对其验收事实存在且结论未被漂白；用户可按需抽验任何卡的任何 AC 事实，CARD-10 须提供定位与原文通路（`prd.md:557`） | 任一卡验收事实缺失或存在漂白，计输入不合格，整体不得声明完成（`prd.md:557`） |
| 1 E2E-1 规划旅程 | 任务只经 make-decision→build-prd 两阶段完成，产出 PRD 与任务地图，无第三阶段；阶段序列逐字等于 U-008 规划拓扑；PRD 经真实最终确认（非自称）（`prd.md:564-565`） | 出现 build-plan/build-code/verify-code 任一阶段，或 PRD 未经真实确认即标 final，即失败（`prd.md:566`） |
| 2 E2E-2 实施旅程 | 任务走完 make-decision→build-plan→build-code→verify-code 四阶段；四阶段齐备且顺序正确；每阶段有真实执行事实（命令、exit、output 位置或交互记录）（`prd.md:572-573`） | 缺任一阶段或真实执行事实；以代码审查冒充功能验收；整体完成宣称先于真实入口联通实跑，即失败（`prd.md:574`） |
| 3 E2E-3 失败不漂白 | 失败如实记为 failed/unverified/unavailable，不被改写为通过；失败事实原文保留可查；完成宣称被阻断或如实降级（`prd.md:580-581`） | 任一失败事实被漂白、删除或改写为通过，即失败（`prd.md:582`） |
| 4 INTEG-1 蓝图消费 | Group 0 冻结的阶段/材料接口蓝图被 Group 1 各卡实际消费，无静默偏离；若发生偏离，存在 G-1 收场记录（停并行、重排、作废批次登记）（`prd.md:590`） | 任一 Group 1 卡偏离冻结接口且无 G-1 记录，即失败（`prd.md:591`） |
| 5 INTEG-2 共享写面 | CARD-04 验收写入步契约与 CARD-07 头脑风暴平台改造在 make-decision 同一步骤共存，契约一致、互不覆盖（`prd.md:595`） | 一方改动覆盖另一方契约，或两契约对同一步骤声明不一致，即失败（`prd.md:596`） |
| 6 INTEG-3 审查基建 | CARD-05 新审查链与 CARD-09 并发限制在同一审查基建上共存，SD-07 完整节奏点与并发上限同时成立（`prd.md:600`）；共存判据的更新授权依据＝`prd.md:603`（该上游变化注把 INTEG-3 判据更新授权给 CARD-10 owner） | 并发限制使应有审查节奏点缺失，或新审查链绕过并发限制，即失败（`prd.md:601`） |
| 7 关键失败路径核对 | 对 SD-05 约定的关键失败路径（真实测试失败被修复并复验、审查工具 unavailable 时独立替代或 unverified 披露、去阻断后历史失败事实未漂白）逐条留核对记录（`prd.md:605`） | 缺任一路径核对记录，整体不得声明完成（`prd.md:605`） |

证据类型（第六项，不单列为要素）＝各条目的证据行：`prd.md:567`、`:575`、`:583`、`:592`、`:597`、`:602`、`:605`；落点见上表「证据落点」列。

### 需求到任务追踪

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / oracle / 依赖 |
| --- | --- | --- | --- | --- |
| CARD-10 / R-001、R-003、R-010 / `prd.md:530`、`:547`、`:555-557` / ADR-005、ADR-007、ADR-011 | 套件三部分齐备、执行而非发明；九卡事实存在且未漂白；原始件全落外置 `quality/` | FR-C10-001 / AC-C10-001；FR-C10-002 / AC-C10-002；FR-C10-013 / AC-C10-013 | P1/T001 | 正例＝8 项条目齐备 + 九卡四判据逐卡计数 + 漂白计数 0；负例＝出现 PRD 未载用例、某卡末行非 `close`、或把 `unavailable` 记为 `passed`；oracle＝ORACLE-C10-INPUT-CHECK；依赖＝无 |
| CARD-10 / R-003 / `prd.md:557` / ADR-011 | 用户可按需抽验任何 AC 事实；提供定位与原文通路 | FR-C10-003 / AC-C10-003 | P1/T002 | 正例＝抽验一条 AC 能打开原文且两类定位规则在列；负例＝通路无法回读原文或前置编制全量对照表；oracle＝ORACLE-C10-TRACEABILITY；依赖＝T001 |
| CARD-10 / R-002、R-008、R-010 / `prd.md:561-567` / CL-3、ADR-009、ADR-011 | 只经 make-decision→build-prd 两阶段；PRD 经真实最终确认；两处命令形态可复跑 | FR-C10-004 / AC-C10-004；FR-C10-011 / AC-C10-011；FR-C10-012 / AC-C10-012 | P1/T003 | 正例＝1 行 `stage=make-decision` + 确认原件 + 带 `--session` 合法 JSON；负例＝出现第三阶段、或仍用 `node --test` 形态；oracle＝ORACLE-C10-E2E1；依赖＝T001；**归属**：FR-C10-011/012 与对应 AC 的主责是 T004，本行只依赖 T004 的记录 |
| CARD-10 / R-002、R-007、R-010 / `prd.md:569-575`、`:56` / ADR-002、ADR-003、ADR-010 | 四阶段齐备；三审查点各有真实记录；G-2 豁免披露；功能验收独立成件；启动前已有材料在位 | FR-C10-005 / AC-C10-005；FR-C10-011 / AC-C10-011；FR-C10-012 / AC-C10-012 | P1/T004（主责 FR-C10-011/012） | 正例＝四份归档原件 + 启动前已在位记录 + 三个 oracle 单元记录 + 两条反例记录；负例＝以代码审查冒充功能验收、或把三个 oracle 单元写成四个；oracle＝ORACLE-C10-E2E2；依赖＝T001；**归属**：本行是 FR-C10-011/AC-C10-011 与 FR-C10-012/AC-C10-012 的主责 Task（唯一执行者） |
| CARD-10 / R-006 / `prd.md:577-583` / ADR-004、ADR-008 | 失败如实记为 failed/unverified/unavailable，不被改写为通过 | FR-C10-006 / AC-C10-006 | P1/T005 | 正例＝失败原件原文保留 + 复验新文件不覆盖 + 旧件字节未变；负例＝失败 slug 被写成 `passed`；oracle＝ORACLE-C10-E2E3；依赖＝T004 |
| CARD-10 / R-008、R-010 / `prd.md:589-592`、`:594-597`、`:599-603` / ADR-001、ADR-009、ADR-011、ADR-014、CL-1 | 三条共存断言逐条分项裁决；执行广度限于三个 oracle 单元 | FR-C10-007 / AC-C10-007；FR-C10-008 / AC-C10-008；FR-C10-009 / AC-C10-009；FR-C10-011 / AC-C10-011；FR-C10-012 / AC-C10-012 | P1/T006 | 正例＝三条终态 `unverified` 各带缺口去向与承接方 + 历史只读通路取到 46 行蓝图；负例＝任一条判 `passed` 或记 `N/A`；oracle＝ORACLE-C10-INTEG；依赖＝T001；**归属**：FR-C10-011/012 的主责是 T004，本行只引用 T004 的记录、不重复执行 |
| CARD-10 / R-004 / `prd.md:605` / ADR-008、ADR-013 | 三条关键失败路径各有核对记录；三条边界同条写死 | FR-C10-010 / AC-C10-010 | P1/T007 | 正例＝历史原件 + 受控演练两层并写死三条边界 + OCR 回退口径；负例＝缺任一条记录或把替代审查写成已顶班；oracle＝ORACLE-C10-FAILPATH；依赖＝T004、T005 |
| CARD-10 / R-005、R-009、R-011 / `prd.md:533`、`:538`、`:549` 第③条、`:659`（真停机规则；`:658` 是「规划完成…Status=`final`」，属错引；本卡 `decision-log.md` 的 R-011 引用同源、亦写 `:658`，本卡以 `:659` 为准） / ADR-005、ADR-012、ADR-014 | 三前置齐备才宣称完成；展示含未验证项与风险；缺口交回原责任卡 | FR-C10-013 / AC-C10-013；FR-C10-014 / AC-C10-014；FR-C10-015 / AC-C10-015 | P1/T008 | 正例＝三条 INTEG `unverified` 逐条在列 + accepted_risk + 缺口具名承接方；负例＝缺任一前置、或把 `unverified` 写成 pass；oracle＝ORACLE-C10-CLOSURE；依赖＝T001..T007 |

### 全局验证策略

- **验证策略**：每条 AC 由 verify-code 用真实入口执行或只读核对验证；三个 oracle 单元单文件定向执行，主命令形态为 `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`、`node tests/acceptance/card-09-session-ledger.mjs --session "$HOME/.dsh/sessions/$CARD10_PROJECT/session.jsonl" --since "$CARD10_SINCE_MS" --until "$CARD10_UNTIL_MS"`（先把 `CARD10_PROJECT` 设为真实项目目录名，并把 `CARD10_SINCE_MS` / `CARD10_UNTIL_MS` 设为具体真实毫秒窗口；等价替代＝换成真实会话日志字面路径与两个数值边界）、`npx vitest run tests/e2e/stage-runtime-five-stage-e2e.test.mjs`；其余只做原件存在性核对与归档引用。执行记录必须含命令、exit code、output 落点。
- **RED/GREEN 设计**：本卡无产品行为变更，无新 RED→GREEN，走 G-2 豁免披露（ADR-003）：①写明「本卡无行为变更，故无新 RED→GREEN」②补一条可失败检查 ③复跑仓库现成 oracle ④引用 CARD-09 归档里的真实 RED→GREEN 原件作为历史事实。记录必须写明③是「独立复跑既有 oracle」，不是本卡新实现产生的 RED→GREEN。本卡**每个 Task 的门禁本身就是一条可失败的内联断言**（不新增 `tests/` 脚本、不在仓库内新增文件），其 RED＝该 Task 交付物错误时门禁非 0、GREEN＝交付物正确时门禁退出 0；该门禁是 G-2 的客观替代载体，不构成产品行为层的 RED→GREEN。
- **最终聚合**：最终聚合是一次普通 Phase 任务（P1 / T008），不是新门禁；它把三条前置记录齐备性与披露项逐条在列作为判定对象。
- **四条既有内联断言的限定加强**：T001（AC-C10-002）核九卡唯一明细/四判据与019具名source计数，并要求每卡末行stage=close；当前CARD-06末行verify-code须如实输入不足，独立Git动作不代替该判据；T005（AC-C10-006）按040 rename map与050独立字节核对校验单份合并raw的stdout/stderr标记、原失败字节、真实exit3与复验exit0；T006/T008（AC-C10-007..009、014）逐INTEG ID唯一合法终态，T008对三类已命名记录（T003/T004、T001/T006、T005/T007）及实际来源更正核引用、存在、非空与命令/退出字段。此为现有交付物测试断言，不新增oracle、产品测试、schema、控制面或stage许可；unverified、已批准failed处置及G-2覆盖限制不变。具体可执行唯一命令正文仍在P1，Task重复处逐字一致；源hash只核单原件测试参数，不做全树或跨Phase绑定。
- **不能证明的内容**：①INTEG-1 的「各卡实际消费冻结蓝图」只能证到 1/4 张卡有行为级消费证据，其余三卡无消费证据；②INTEG-2 的「契约一致、互不覆盖」无共同步骤标识可对照，CARD-04 冻结接口②③在 HEAD 已无代码实现；③INTEG-3 的资源效率前后改善无对照基线（CARD-09 自记 `inconclusive`）；④E2E-1 的「宿主真实任务发起入口」入口面无原件；⑤被点名 oracle 的失效本身不能证明产品功能失败。以上五项都必须作为未验证项或缺口披露，不得写成通过。

## Appendix A — 验收判据（唯一权威）

本节是已接受决定的 AC 条件、可测通过判据、失败条件与预期证据的唯一权威，不覆盖或放宽 `decision-log.md` 已 accepted 的强输入定义。叙事各节可指向 AC，但不复制本节正文。`证据：` 只声明预期证据类型或制品；执行事实由 verify-code 提供。本卡 AC 编号自铸 `AC-C10-{NNN}`；母 PRD 的 `AC-47..AC-50`（`prd.md:535-538`）只作来源 ID。

- [ ] **AC-C10-001**：总体集成验收套件以母 PRD 所载三部分主体成形，8 项条目齐备，每条含可观察用例、所需证据、承接负责人，无临时增删用例、无改写失败判据；关联 FR-C10-001；来源 FR-47、AC-47。
验证：把本卡套件条目表与 `### 套件条目与执行映射` 下的逐条成功/失败条件清单，与 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:551-607` 逐条对照，核对三部分齐备、每条五要素齐全、失败判据逐字一致。「五要素」在此处定义＝①编号 ②可观察用例（`prd.md` 的「可观察结果」）③成功条件 ④失败条件 ⑤承接负责人；第六项「证据类型」归入条目表的「证据落点」列与逐条清单的证据行，不单独计入五要素。
通过：三部分齐备；条目数＝8（0 号输入核对 + 7 项）；每条五要素齐全（逐项点名核对：①编号 ②可观察用例 ③成功条件 ④失败条件 ⑤承接负责人；第六项证据类型按上一句归入证据落点）；失败判据与 `prd.md:561-605` 逐字一致；无 PRD 未载用例。
失败：任一条目缺要素；出现 PRD 未载的用例；任一失败判据被改写或删除。
证据：套件条目对照表 + `prd.md:551-607` 原文引用，落 `<TASK_DIR>/quality/evidence/input-check/`。

- [ ] **AC-C10-002**：CARD-01..09 全部 9 张卡的验收事实存在性核对记录齐备，每卡四判据逐条给出结果、计数与命中清单，且无任何把 `failed`/`unavailable`/`missing`/`unverified` 记为 `passed`/`succeeded` 的记录；关联 FR-C10-002；来源 `prd.md:555-557`、AC-47。
验证：对每卡核 ①外置 `facts.jsonl` 末行是否 `stage=close` ②外置 `quality/` 下审查点原件是否存在（按该卡实际审查点数）③`quality/` 与 `facts.jsonl` 的终态字段检索与计数（逐卡给计数与命中清单）④定位通路能否实际打开原文；四判据均用只读命令，记录 exit code 与 output 落点。
通过：9 张卡全部有核对记录；四判据逐条给出结果，且每卡外置 `facts.jsonl` 末行均为 `stage=close`（已确认决定的强输入条件，`decision-log.md:576`、`:1236`、`:1243`/`:1245`；与 FR-C10-002 和需求追踪负例一致）；漂白检索计数为 0 且命中清单为空；抽验通路可回读原文。
失败：任一卡末行非 `stage=close`（输入资格不足，问句结果仍须如实记录，不能以记录了 false 代替资格为 true）；任一卡事实缺失或存在漂白；核对记录缺任一卡；四判据有未执行项而无 `unavailable` 标注。
证据：逐卡核对记录 + 漂白检索计数与命中清单 + 定位通路说明，落 `<TASK_DIR>/quality/evidence/input-check/`。

- [ ] **AC-C10-003**：用户抽验权通路存在且可用——能按路径规则定位任一卡的任一 AC 事实并回读原文，且不逐条复核 AC 内容；关联 FR-C10-003；来源 `prd.md:557`。
验证：按通路说明实际抽验至少一条 AC 事实（任选一卡），记录所用命令与回读到的原文片段。
通过：通路给出①按 `specs/archive/<card>/` 与各卡外置 `<TASKS_ROOT>/<card>/quality/` 的定位规则 ②按 `prd.md` AC 行号的母 PRD 定位规则；抽验能打开原文。
失败：通路缺失；或定位规则无法回读原文；或通路把逐条复核 AC 内容当作要求。
证据：通路说明 + 一次抽验的命令与原文回读记录，落 `<TASK_DIR>/quality/evidence/input-check/`。

- [ ] **AC-C10-004**：E2E-1 有归档原件核对记录（artifact inspection），判「旅程可证、入口未验证」并披露；阶段序列＝规划拓扑（`stage` 取值全集 `{make-decision}`，无 build-plan/build-code/verify-code），PRD 经真实最终确认（非自称）；真实入口判据显式保持 `unverified`，除非另有真实入口事件证据；关联 FR-C10-004；来源 `prd.md:561-567`。
验证：①读规划任务 `facts.jsonl` ②列 `quality/confirmations/` 并核对 `subject_ref` ③读 `build-prd/8da4882e….json` 的 `reply_text`/`human_approved`/`display_before_reply` ④读 `prd.md:3` 的 Decision revision 并跑 `shasum -a 256` 比对；四条各记命令与 exit code。四条都是回顾性的**归档原件核对记录（artifact inspection）**，不是真实入口执行记录；真实入口判据只由宿主侧入口事件证据满足，本卡无该证据故保持 `unverified`。
通过：四条证据齐备；阶段序列符合规划拓扑；PRD 确认绑定 revision 与 `prd.md:3` 逐字一致；两处披露（字节指纹变化、阶段序列）如实写入记录；入口面判 `unverified` 并披露；四条记录已标注为归档原件核对记录而非真实入口执行记录。
失败：出现 build-plan/build-code/verify-code 任一阶段；PRD 未经真实确认即标 final；入口面 `unverified` 未披露；把 `unverified` 写成通过；把归档原件核对记录写成真实入口执行记录。
证据：四条归档原件核对记录的命令输出（含 exit code）落 `<TASK_DIR>/quality/tests/`；两处披露说明与入口面 `unverified` 说明落 `<TASK_DIR>/quality/evidence/e2e-1/`。

- [ ] **AC-C10-005**：E2E-2 有真实执行记录，四阶段齐备且顺序正确，现行三审查点各有真实执行原件，verify-code 功能验收记录与终末代码审查分开成件，G-2 豁免披露四组成齐全，且真实入口启动前至少一张实施卡材料已在位并记录其身份；关联 FR-C10-005；来源 `prd.md:569-575`、AC-48。
验证：①对 CARD-09 归档四份审查原件（`2026-10-04-051`、`2026-10-05-005`、`2026-10-05-010`、`2026-10-05-017`）做存在性与 `outcome` 核对 ②复跑三个现成 oracle 单元（`card-09-session-ledger.mjs` 及其 vitest 包装、`card-04-real-entry-chain-e2e.test.mjs`、`stage-runtime-five-stage-e2e.test.mjs`）并记录 exit code ③检查本卡自身四阶段执行记录（来源、命令或交互记录、顺序核对、output 落点），并与归档审查证据**分开**记录 ④核 G-2 披露四组成是否逐条存在 ⑤核对功能验收记录是否独立成件 ⑥核对「真实入口启动前，至少一张实施卡材料已在位并记录其身份，且记录写明启动前已在位」⑦对 FR-20 的机器产物路线（trace/JUnit/跳过计数）做本轮适用判定，并把 `N/A`+`reason` 记录显式锚定 `prd.md:575`。
通过：四阶段齐备且顺序正确（顺序核对在列）；三个审查点各有真实原件；功能验收独立成件；G-2 四组成齐全且写明「独立复跑既有 oracle，非本卡新实现产生的 RED→GREEN」；如实标注本卡无 phase 级代码审查原件（事实不是缺失）；启动前已在位的实施卡材料身份在列且写明启动前已在位；四阶段证据与归档审查证据分开记录；FR-20 机器产物路线的本轮适用判定与 `N/A`+`reason` 记录在列。
失败：缺任一阶段或真实执行事实；以代码审查冒充功能验收；完成宣称先于真实入口联通实跑；G-2 披露不完整或被直接跳过；因本卡无 phase 级代码审查原件而判 E2E-2 失败；四阶段证据与归档审查证据混记；启动前已在位记录缺失；把审查节奏项的读法依据写成自授权，或与共存判据的依据混用（审查节奏项依据＝U-018 / V-025，用户以母任务 owner 身份授权、范围只限 E2E-2 该项；共存判据依据＝`prd.md:603`）。
证据：四份归档原件引用 + 三个 oracle 执行记录 + 本卡四阶段记录（含顺序核对）+ 启动前已在位材料身份记录 + FR-20 机器产物路线适用判定与 `N/A`+`reason` 记录 + G-2 披露说明，落 `<TASK_DIR>/quality/tests/` 与 `quality/evidence/e2e-2/`。

- [ ] **AC-C10-006**：E2E-3 有一次真实失败被如实记录、修复并复验，失败事实原文保留可查，未被漂白；关联 FR-C10-006；来源 `prd.md:577-583`、AC-49。
验证：在 E2E-2 同类环境注入一次真实测试失败（ADR-004），记录失败原件 → 修复 → 复验写新文件 → 重读旧件字节比对 → 检索 `facts.jsonl` 是否把失败 slug 写成 `"passed"`。
通过：真失败 `exit_code` 非 0 且原始 stdout/stderr 原样落盘；修复复验 exit 0 且写新文件不覆盖；重读旧件字节未变；不存在把失败 slug 写成 `"passed"` 的记录；失败记录与完成宣称记录对同一事实表述一致。
失败：任一失败事实被漂白、删除或改写为通过；用复验通过删除或改写初始失败事实；人为制造假失败。
证据：失败原件 + 复验记录 + 字节比对 + `facts.jsonl` 检索结果，落 `<TASK_DIR>/quality/tests/` 与 `quality/evidence/`。

- [ ] **AC-C10-007**：INTEG-1 有真实入口证据映射（命令、exit code、output 落点）与原件对照记录，终态如实判 `unverified` 并写明缺口去向（承接方＝无）；关联 FR-C10-007；来源 `prd.md:589-592`、AC-47。
验证：跑只读历史通路（`git log -S 'from "../task/task-topology.mjs"' -- runtime/stage/stage-context.mjs`、`git show d1097711:docs/contracts/card-01-stage-material-interface.md`、对 CARD-03/04/05/07 外置 `quality/` 树的关键词检索），每条记 exit code 与 output 落点；显式标注「引用 CARD-06 之前的制品版本，非 HEAD 现状」。
通过：成功条件①无静默偏离成立、②消费证据 1/4 张卡有行为级证据的事实如实记录；终态判 `unverified`；缺口去向写明「承接方＝无，只在本卡如实记录」；历史版本引用有显式标注。
失败：判 `passed`；记 `N/A`；删用例；恢复并发限制；不标注历史版本；把 `unverified` 静默当 `passed`。
证据：只读命令执行记录（含 exit code 与 output 落点）+ 蓝图历史版本 sha256 + 各卡消费点检索结果 + 缺口去向说明，落 `<TASK_DIR>/quality/evidence/integ-1/`。

- [ ] **AC-C10-008**：INTEG-2 有定向 oracle 执行记录与两侧原件对照记录，终态在当前已记录证据下如实判 `unverified`（成功条件未满足、失败判据未触发，不是预设锁死的终态）并写明缺口去向；关联 FR-C10-008；来源 `prd.md:594-597`。
验证：跑 `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 并记 exit code 与 output 落点；对 CARD-04 外置 `quality/{decisions,oracle}` 与 CARD-07 外置 `quality/` 做原件对照；核 `workflows/make-decision/steps.json` **12 步**（第 11＝`stage-end-spec-analyze`、第 12＝`stage-handoff`）与两侧冻结接口符号在 HEAD 的存在性。**触发判定（谁、依据哪条记录）**：由 verify-code 执行者在两侧原件对照中逐条比对，只有在出现**具名条目**「一方改动覆盖另一方契约」或**具名条目**「两契约对同一步骤声明不一致」时才触发 → 判 `failed` 并阻断完成宣称；未出现这两个具名条目即不触发，终态如实判 `unverified`。判定记录必须写出被比对的具名条目与其 `原件: ` 路径，并与命令、exit code、output 落点同列。
通过：oracle 执行记录含命令、exit code、output 落点；两侧原件对照记录齐备；如实记录「两侧唯一共同点是阶段名而非步骤」「CARD-04 冻结接口②③在 HEAD 已无 `.mjs` 实现」「CARD-07 自陈需注入的材料从未交付」；终态在当前证据下判 `unverified`；缺口去向写明交回 CARD-04/CARD-07。
失败：一方改动覆盖另一方契约，或两契约对同一步骤声明不一致（母 PRD `prd.md:596` 原文判据）；把 `unverified` 写成 `passed` 或写成完成；用全量回归替代单文件定向执行；不记录 `steps.json` 12 步（末两步 `stage-end-spec-analyze`、`stage-handoff`）核对。
证据：oracle 执行记录 + 两侧原件对照 + `steps.json` 核对 + 缺口去向说明，落 `<TASK_DIR>/quality/tests/` 与 `quality/evidence/integ-2/`。

- [ ] **AC-C10-009**：INTEG-3 有可实跑部分的只读核对记录与分项裁决，终态如实判 `unverified`，并写明资源效率前后改善无对照；关联 FR-C10-009；来源 `prd.md:599-603`。
验证：对 CARD-09 `quality/reviews/` 四份审查原件与资源/效率验收原件做存在性与结论对照（`git grep`/`node -e` 一类只读命令，记 exit code 与 output 落点）；核 CARD-09 终末记录里的 `resource_benefit`、`work.status`、`OPEN002`。
通过：分项裁决逐条给出——三审查点原件可证、前后审查链仍产出可消费结果可证、回收不误删在途材料可证、资源/效率改动本身有可对照的前后改善无对照；`unavailable` 轮次未被漂白成 `completed`；终态判 `unverified`；无现成 oracle 的共存断言部分显式标 `unverified`。
失败：判 `passed`；记 `N/A`；删用例；把 `inconclusive` 写成改善；把 `unverified` 写成完成。
证据：四份审查原件引用 + 资源/效率原件对照 + 分项裁决记录，落 `<TASK_DIR>/quality/evidence/integ-3/`。

- [ ] **AC-C10-010**：SD-05 三条关键失败路径各有核对记录，路径②同时具备历史真实原件与本轮受控演练记录，三条边界同条写死；关联 FR-C10-010；来源 `prd.md:605`、FR-49。
验证：①路径①核对真实测试失败被修复并复验 ②路径②先检索已有真实不可用原件（CARD-05 26 份 `OCR_DELEGATION_UNAVAILABLE`、CARD-04 2 份 `OCR_ALL_PROVIDERS_FAILED`）再跑本轮受控演练（`tests/e2e/card-04-real-entry-chain-e2e.test.mjs`）③路径③核对去阻断后历史失败事实未漂白；三条各记命令与落点。
通过：三条核对记录齐备；路径②同时含历史原件引用与受控演练记录；同条写死三条边界（受控注入非自然故障、「独立替代审查真的顶班」在归档中从未发生、本轮 `ocr` 在位）；OCR 回退口径按 `workflows/build-code/SKILL.md:28-30`。
失败：缺任一条核对记录；不区分「引用」与「亲历」（判定方式＝每条记录必须带 `引用-亲历:` 标注字段，缺字段即视为不区分）；人为制造假失败；把「独立替代审查真的顶班」写成已发生。
证据：三条核对记录（每条含命令、exit code、output 落点、判定值与 `引用-亲历:` 标注）+ 历史不可用原件引用 + 受控演练原始字节，落 `<TASK_DIR>/quality/tests/`、`quality/reviews/`、`quality/evidence/`。

- [ ] **AC-C10-011**：两处命令形态已被修正并写死，使执行记录可复跑，且未改任何断言或失败判据；关联 FR-C10-011；来源 `decision-log.md:628`（**该行为被修正形态：`decision-log.md:628` 写 `node --test …`，实跑 exit 1；以 `## 测试标准` 的 `npx vitest run …` 为准**）、ADR-009。
验证：对本卡规格内两条命令形态逐条实跑——`npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 与 `node tests/acceptance/card-09-session-ledger.mjs --session <真实 session.jsonl|.zstd> --since <ms> --until <ms>`；同时实跑两条反例形态确认其失败。
通过：正例实跑 `Tests 5 passed (5)` exit 0 与合法 JSON；反例 `node --test …` exit 1、裸跑 `card-09-session-ledger.mjs` exit 1；`tests/` 无任何文件被改动。
失败：仍使用 `node --test` 形态作为执行命令；仍裸跑会话账本 CLI；改动了任何断言或失败判据；改动了 `tests/` 文件。
证据：正例与反例的执行记录（命令 + exit code + output 落点）+ `git status --porcelain tests/` 空输出，落 `<TASK_DIR>/quality/tests/`。

- [ ] **AC-C10-012**：执行广度限于三个与套件直接相关的 oracle 单元（①`tests/acceptance/card-09-session-ledger.mjs` ②`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` ③`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`），其余卡只做原件存在性核对与归档引用；**三个 oracle 单元；`tests/acceptance/card-09-session-ledger.test.mjs` 是 ① 的 vitest 包装，若两者都执行只算同一个 oracle 单元，不是第四个 oracle**；关联 FR-C10-012；来源 ADR-009。
验证：核对执行记录集合——是否只含三个 oracle 单元（`card-09-session-ledger.mjs` 与其 vitest 包装同属一个单元、`card-04-real-entry-chain-e2e.test.mjs`、`stage-runtime-five-stage-e2e.test.mjs`）；核对是否存在全量回归记录。
通过：执行记录只含三个 oracle 单元；其余卡只出现存在性核对与归档引用；无全量 `vitest`/`npm test`/`test:safe` 记录；某条用例对应 oracle 缺失或不可执行时按失败事实如实记录并阻断完成宣称。
失败：执行广度扩张为全量跑 `tests/acceptance` 下所有 oracle；跑了 `tests/` 下其他测试；把广度受限降级为 `N/A`。
证据：执行记录清单 + 命令清单，落 `<TASK_DIR>/quality/tests/`。

- [ ] **AC-C10-013**：全部原始证据落外置 `<TASK_DIR>/quality/`，仓库内无原始件副本、无目录快照、无整树归档；关联 FR-C10-013；来源 ADR-005、ADR-006。
验证：核对仓库改动范围（`git status --porcelain`）是否只含 `specs/workflowhub-thin-core-card-10-20260919/**`；核对外置证据目录文件数与命名是否按日期+序号+描述且 append-only。
通过：仓库改动只含本卡 spec 目录；`tests/` 无新增；外置 `quality/` 下每类事实只有一份原始件；无目录快照或整树归档产物。
失败：仓库内出现原始件副本；出现目录快照或整树 tar/`git archive` 产物；`tests/` 出现 CARD-10 文件。
证据：仓库改动范围输出 + 外置证据目录清单，落 `<TASK_DIR>/quality/evidence/`。

- [ ] **AC-C10-014**：完成宣称只发生在三前置记录齐备之后，且宣称与展示逐条包含三条 INTEG 的 `unverified` 结论与各自缺口去向/承接方、accepted_risk、未验证项与风险清单；关联 FR-C10-014；来源 `prd.md:533`、`:538`、`:659`（真停机规则；`:658` 为错引，同源说明见 `### 需求到任务追踪` T008 行）、ADR-012、AC-50。
验证：核对三前置记录（真实入口联通实跑记录、约定成功条件达成记录、关键失败路径核对记录）是否齐备；逐条核对宣称文本是否含 INTEG-1/2/3 的 `unverified`、缺口去向与承接方、accepted_risk（DIR-D1-T10/finding #18）、未验证项与风险清单。
通过：三前置齐备；三条 `unverified` 逐条在列且各带缺口去向与承接方；accepted_risk 在列；未验证项与风险清单在列；未把任何 `unverified` 写成 pass 或「成功条件已达成」；未用子任务状态相加充当整体完成。
失败：缺任一前置记录即宣称完成；任一条 `unverified` 未披露或被写成 pass；展示无未验证项披露；子任务状态相加被当成整体完成。
证据：完成宣称文本 + 三前置记录引用 + 披露项清单，落 `<TASK_DIR>/quality/evidence/close/`。

- [ ] **AC-C10-015**：缺口在本卡如实登记并写明承接方，缺口修复交回原责任卡，本卡未做产品修复、未改母 PRD、未动母任务；关联 FR-C10-015；来源 `prd.md:549` 第③条、ADR-014。
验证：核对缺口清单是否逐条含根因、证据引用、承接方、交回动作与是否需对方确认；核对仓库改动范围是否不含 `prd.md` 与产品面路径。
通过：缺口清单逐条含上述字段；INTEG-1 缺口承接方写明「无」；五阶段 e2e oracle 缺口与 `card-01-current.mjs` oracle 缺口交回 CARD-06 并标注「推断，需对方确认」；INTEG-2 缺口交回 CARD-04/CARD-07；母 PRD 与产品面零改动。
失败：缺口无承接方；本卡自行修复产品代码；改动母 PRD 或母任务层面文件；把推断写成已确认。
证据：缺口清单 + 仓库改动范围输出 + 母 PRD 哈希未变证明，落 `<TASK_DIR>/quality/evidence/close/`。

## 测试蓝图（testing-system-blueprint）

| Task | 风险维度 | 层级 / 执行者 | Oracle | 覆盖限制 |
| --- | --- | --- | --- | --- |
| T001 套件成形与存在性核对 | 状态/数据流、可观测性/来源 | `simple` / verify-code | ORACLE-C10-INPUT-CHECK | 不证明各卡 AC 内容对错 |
| T002 用户抽验通路 | 可观测性/来源 | `simple` / verify-code | ORACLE-C10-TRACEABILITY | 不前置编制全量对照表 |
| T003 E2E-1 规划旅程 | 状态/数据流、可观测性/来源 | `simple` / verify-code | ORACLE-C10-E2E1 | 入口面只能证到 `unverified` |
| T004 E2E-2 实施旅程 | 状态/数据流、错误/取消/恢复 | `simple` / verify-code | ORACLE-C10-E2E2 | 本卡无 phase 级代码审查原件 |
| T005 E2E-3 失败不漂白 | 错误/取消/恢复 | `simple` / verify-code | ORACLE-C10-E2E3 | 受控注入，非自然故障 |
| T006 INTEG-1/2/3 跨卡共存 | 跨模块 seam、可观测性/来源 | `simple` / verify-code | ORACLE-C10-INTEG | 三条共存断言均只能证到 `unverified` |
| T007 关键失败路径核对 | 错误/取消/恢复、权限/安全 | `simple` / verify-code | ORACLE-C10-FAILPATH | 路径②亲历强度弱于自然故障 |
| T008 完成宣称与缺口 | 可观测性/来源 | `simple` / verify-code | ORACLE-C10-CLOSURE | 不证明产品功能是否新增 |

维度说明：**行为结果** 不适用（`N/A — 理由：本卡无产品行为变更，见 ADR-010`）；**权限/安全** 仅涉及只读取证与 `tests/` 零改动；**并发/原子性** 不适用（`N/A — 理由：本卡独占运行、无共享写面，见 prd.md:543 与 prd.md:544`）；**UI 加载/空/错误/边界与可访问性** 不适用（`N/A — 理由：ui_applicability=non_ui，见 prd.md:545`）。

## 测试路线（test-routing-advisor）

- `simple`（判定结果）：本卡改动面全为 `.md` 与仓库外证据，无接口、数据、权限、构建链变化；`routing_rationale` 引用实际 changed files＝`specs/workflowhub-thin-core-card-10-20260919/spec.md`、`phases/P1.md`、`phases/index.md`；`result: "pass"`。
- `feature`（不选）：本卡无功能域内的行为变化，只有记录与判定职责。
- `fullstack`（不选）：本卡不跨前后端、无 API/协议、无数据库迁移、无认证授权、无部署配置、无并发事务。
- 本阶段未运行任何新测试；所有 Task 的 RED 证据当前为 `unavailable — 尚未取得真实 RED`，不称 RED。三个 oracle 的执行记录由 verify-code 提供。

## UI readiness

不适用。理由：`ui_applicability=non_ui`（`prd.md:545`），本卡无产品 UI 页面、无设计稿、无用户可见界面面；`## 3` 的页面范围面已在状态覆盖清单里对「加载态」「权限态」逐条写 `N/A — 理由`。

## 12. 风险、未决与交接

### 风险

- **RISK-C10-001**（总体验收被提前宣称）：受影响 ID＝AC-C10-014；触发条件＝用子任务状态相加代替整体完成判定；后果＝整体交付在真实入口未联通时被宣称完成；缓解或停止＝完成宣称前置三记录齐备性硬核对，缺一即停止；处理阶段＝`verify-code`；验证＝完成宣称文本与三前置记录对照。
- **RISK-C10-002**（关键失败路径范围不清）：受影响 ID＝AC-C10-010；触发条件＝三条路径核对流于形式；后果＝FR-49 名义满足而实际无记录；缓解或停止＝逐条列出命令与落点，缺一即停止；处理阶段＝`build-plan`；验证＝三条核对记录逐条可回放。
- **RISK-C10-003**（E2E-1 入口面无原件）：受影响 ID＝AC-C10-004、PFACT-024；触发条件＝宿主会话侧也无「人工选择规划任务」事件；后果＝E2E-1 入口面永久停在 `unverified`；缓解或停止＝如实披露并写明承接方与下次核实动作；处理阶段＝`verify-code`；验证＝披露项在完成宣称中在列。
- **RISK-C10-004**（INTEG-1 消费证据不足）：受影响 ID＝AC-C10-007；触发条件＝其余三卡始终无行为级消费证据；后果＝INTEG-1 长期停在 `unverified`；缓解或停止＝只在本卡如实记录，缺口去向承接方＝无；处理阶段＝`verify-code`；验证＝缺口去向写明。
- **RISK-C10-005**（资源/效率改动只能事后观察）：受影响 ID＝AC-C10-009；触发条件＝对照基线 `work/<key>/bundle/materials` 原件不可得；后果＝INTEG-3 只能证「未被破坏」，不能证「设计上不可能破坏」；缓解或停止＝作为未验证项披露；处理阶段＝`verify-code`；验证＝披露项在列。
- **RISK-C10-006**（审查成本与时长）：受影响 ID＝本卡 build-plan 阶段推进；触发条件＝make-decision 审查每轮 6 次 provider 调用、单轮约 1752.5 s；后果＝阶段推进时间远超预期；缓解或停止＝已按 ADR-015 收敛为方向 2 轮 + 细节 1 轮后进确认；处理阶段＝`make-decision`（已发生）；验证＝`decision-log.md` 的 `## 审查处置` 计数。
- **RISK-C10-007**（oracle 覆盖不齐）：受影响 ID＝AC-C10-012、PFACT-006；触发条件＝`tests/acceptance/` 无 card-04/05/06/08 oracle；后果＝这几条用例的对应 oracle 缺失；缓解或停止＝用单文件定向执行的可用 oracle + 原件存在性核对替代；**`N/A` + `reason` 只适用 FR-20 的机器产物路线（trace/JUnit/跳过计数）不适用时；oracle 缺失或不可执行一律按失败事实如实记录并阻断完成宣称，不得降级为 `N/A`**（与 FR-C10-012、AC-C10-012、`phases/P1.md` 的 STOP 一致）；处理阶段＝`build-plan`；验证＝执行记录清单。
- **RISK-C10-008**（母 PRD 旧表述与现行合同并存）：受影响 ID＝AC-C10-005；触发条件＝读者只看母 PRD 不看 `decision-log.md` 退役登记；后果＝得到错误读法（以为存在全 phase 结束集成审查）；缓解或停止＝在 `decision-log.md` 退役登记与 Supersedes 显式登记新旧对应，本卡不改母 PRD；处理阶段＝`make-decision`（已发生）；验证＝退役登记四行与 Supersedes 四条存在。
- **RISK-C10-009**（完成宣称被读作「全部成功条件达成」）：受影响 ID＝AC-C10-014；触发条件＝读者把「失败判据未触发」读成「成功条件已满足」；后果＝三条 INTEG 的 `unverified` 被静默当通过；缓解或停止＝accepted_risk（DIR-D1-T10/finding #18）作为显式条目，完成宣称必须逐字包含 INTEG-1 的可观察结果未完全满足与缺口去向，同时给出 `prd.md:590`/`:591` 原始判据与事实；处理阶段＝`verify-code`；验证＝宣称文本逐字包含。
- **RISK-C10-010**（被点名 oracle 在 HEAD 确定性失败）：受影响 ID＝AC-C10-011、PFACT-005、PFACT-022；触发条件＝`tests/e2e/stage-runtime-five-stage-e2e.test.mjs` 的 `review:risk` 路由被移除且未修；后果＝该 oracle 无法作为通过证据；缓解或停止＝如实记为真实失败事实，但不作为套件内用例的失败判据；缺口交回责任卡（推断 CARD-06，需对方确认）；处理阶段＝`verify-code`；验证＝3/3 复现记录 + 缺口条目。
- **RISK-C10-011**（CARD-01 自己的验收 oracle 已失效）：受影响 ID＝AC-C10-002、PFACT-020、PFACT-023；触发条件＝5 个依赖测试被 CARD-06 退役删除且未修；后果＝`tests/acceptance/card-01-current.mjs` 23/23 missing，不能作为通过证据；缓解或停止＝只核原件存在性与结论未漂白，oracle 失效如实登记为缺口交回 CARD-06；处理阶段＝`verify-code`；验证＝23/23 missing 记录 + 缺口条目。

### 未决

- **OPEN-C10-001**（宿主侧入口事件原件是否存在）：受影响 ID＝AC-C10-004、PFACT-024；负责人＝CARD-10 owner（verify-code）；影响＝E2E-1 入口面只能判 `unverified`；处理阶段＝`verify-code`；关闭条件或停止＝查到宿主会话侧存在该事件原件则升级为 `verified`；确认不存在则永久记为缺口并披露。
- **OPEN-C10-002**（E2E-1 六份 confirmation 原件的语义覆盖度）：受影响 ID＝AC-C10-004、RISK-C10-003；负责人＝CARD-10 owner（verify-code）；影响＝抽验时可能发现某份确认的语义不覆盖 `prd.md`；处理阶段＝`verify-code`；关闭条件或停止＝逐份读取六份原件并核对 `subject_ref` 与语义；发现不覆盖则按失败事实如实处理。
- **OPEN-C10-003**（INTEG-2 缺口承接与权威冲突）：受影响 ID＝AC-C10-008、PFACT-014；负责人＝CARD-04/CARD-07 责任卡；影响＝「验收写入步」契约无共同步骤标识，无法完成「互不覆盖」对照；处理阶段＝`verify-code`；关闭条件或停止＝两侧任一交付 CARD-07 自陈的改造清单与冻结接口符号，或母层面重新指派 owner。
- **OPEN-C10-004**（INTEG-1 缺口承接方）：受影响 ID＝AC-C10-007、ADR-014；负责人＝无（只在本卡如实记录）；影响＝母 PRD 的该要求长期停在「要求与实际对不上」的状态；处理阶段＝`verify-code`；关闭条件或停止＝后续有人主动跟进母任务层面；本卡不承接。
- **OPEN-C10-005**（五阶段 e2e oracle 缺口承接）：受影响 ID＝AC-C10-011、RISK-C10-010；负责人＝CARD-06（推断，需对方确认）；影响＝该 oracle 长期失败；处理阶段＝`verify-code`；关闭条件或停止＝CARD-06 确认归因并修复 `review:risk` 路由或登记退役。
- **OPEN-C10-006**（`card-01-current.mjs` oracle 缺口承接）：受影响 ID＝AC-C10-002、RISK-C10-011；负责人＝CARD-06（推断，需对方确认）；影响＝CARD-01 的验收 oracle 无法重放；处理阶段＝`verify-code`；关闭条件或停止＝CARD-06 确认并补登连带依赖，或登记该 oracle 退役。

### 交接

- 交给 verify-code：`phases/P1.md` 的逐 Task 执行卡；`<TASK_DIR>/quality/` 三个子目录约定；三个 oracle 的正确命令形态；三条 INTEG 的终态判定（均 `unverified`）。
- 交给责任卡：OPEN-C10-003（CARD-04/CARD-07）、OPEN-C10-005 与 OPEN-C10-006（CARD-06，均待确认）。**交回动作＝缺口清单写具名承接方 + `待确认` 状态；本卡不代对方确认，也不把推断写成已确认**（承接方为「无」的 OPEN-C10-004 无需交回动作，只在本卡如实记录）。
- 交回母任务：无（ADR-014 已把 INTEG-1 缺口承接方定为「无」）。
- 跨卡延期项：无。

## 13. 业务影响与回归范围

- **既有行为**：CARD-01..09 各自的验收结论与归档材料不变；母 PRD、`workflows/**`、`tests/**`、`runtime/**` 零改动。
- **本需求影响**：本卡对仓库的写入面只有 `specs/workflowhub-thin-core-card-10-20260919/**`（`spec.md`、`phases/P1.md`、`phases/index.md`）；原始执行证据全落仓库外 `<TASK_DIR>/quality/**`。产品运行时零影响。
- **回归路径**：不适用——本卡无产品代码改动，无需回归；`git status --porcelain tests/` 输出为空即证明 `tests/` 未被触碰。
- **验收**：AC-C10-001..AC-C10-015。
- **可能受冲击的业务规则**：无产品业务规则受影响；唯一可能被冲击的是「整体交付能否声明完成」这一判定口径——本卡通过把三条 INTEG 的 `unverified` 写进完成宣称来避免误读。
- **明确无影响**：运行时行为、公共 CLI 命令面、stage 定义、持久对象 schema、`tests/` 测试资产、四个 workflow 合同的审查点表述、已归档卡材料。

## 审查处置

> 本节记录 **2026-10-05 对冻结版 build-plan 材料的那一次异源合并审查**的原文事实、逐条处置，以及处置后三份材料的版本。审查**只做一次**（用户口径）；本次修订**不重跑**审查，也不生成 replacement review——因此本节记录的是「对冻结材料那一版的异源建议及其处置」，不是修订后材料的复审结论。本节另含 `### 一致性准备（spec-analyze）处置`：那是 build-plan 第 11 步一致性准备的发现处置，**同样不是第二次审查**。

### 审查原件与所审材料

- 审查原件：`<TASK_DIR>/quality/reviews/2026-10-05-027-build-plan-document.json`，**30737 字节**，sha256 `52d4c1baf29e8f69008381e4c87e43141611171ac52a76d65fbe1495404fe761`；`status=available`、`outcome=completed`。
- 逐 provider 原始输出：同目录 `2026-10-05-022..026-build-plan-document-provider-{1..5}.output`（只读原件，未改动）。
- 所审冻结材料：`<TASK_DIR>/quality/evidence/execution-inputs/2026-10-05-004-card10-build-plan-merged-review-request.json`，**213148 字节**，sha256 `0a08502099c3a5d692cc649f3a6882b99ea5ff637c65a1645bae382e88b67b59`；其中各材料字符数：`raw_requirement` 26610、`draft_spec` 52145、`acceptance_criteria` 8769、`phase_authorities.phases/P1.md` 32052、`phase_index` 670。

### 审查时点与聚合结果

- 时点：`started_at 2026-10-05T14:14:49.943Z`；`completed_at 2026-10-05T14:24:06.029Z`。
- 5 providers：`kimi/coding`、`pi/v4flash`、`antigravity/flash`、`antigravity/opus`、`codex/luna`，**全部记 `status=completed`、`error=null`**。
- 聚合：`status=available`、`outcome=completed`、**18 findings**（blocking 2 / major 8 / minor 8）、`discarded_facts=[]`（没有事实被丢弃）。

### 18 条 finding 的逐条处置

| # | provider / 严重度 | 位置 | 处置 | 处置后落点 |
| --- | --- | --- | --- | --- |
| 1 | kimi/coding / major | spec RISK-C10-007 | fixed | `spec.md` `### 风险` RISK-C10-007 缓解口径改写：`N/A` + `reason` 只适用 FR-20 的机器产物路线（trace/JUnit/跳过计数）不适用时；oracle 缺失或不可执行一律按失败事实如实记录并阻断完成宣称。与 FR-C10-012、AC-C10-012、`phases/P1.md` `### 停止` 一致 |
| 2 | kimi/coding / minor | spec FR-C10-007 | fixed | `spec.md` `## 5` FR-C10-007：删去「用可实跑现成 oracle 现场跑（单文件定向执行，不做全量回归）」，改为与 AC-C10-007 一致的只读历史通路取证（`git log -S`、`git show`、关键词检索），并写明 INTEG-1 没有具名 oracle |
| 3 | kimi/coding / minor | P1 T004:198 | fixed | `phases/P1.md` T004：与 #5 一起统一为「三个 oracle 单元」计数口径 |
| 4 | kimi/coding / minor | P1 T003:179 / T004:203 | fixed | `phases/P1.md` T003、T004 场景引用改为 `SCN-001`；T005 改 `SCN-003`、T006 改 `SCN-006`（与其 FR 对齐），不再指向 `SCN-003`/`SCN-004` |
| 5 | pi/v4flash / major | P1 T004:198 | fixed | 全卡统一「三个 oracle」单元，严格照 decision-log ADR-009（`:913`）枚举：①`tests/acceptance/card-09-session-ledger.mjs` ②`tests/e2e/card-04-real-entry-chain-e2e.test.mjs` ③`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`。`tests/acceptance/card-09-session-ledger.test.mjs` 已从 FR-C10-012、AC-C10-012 枚举、T004「复跑四个现成 oracle」、契约头 gate_cmd 预期通过命令中一律移除；AC-C10-012 附近写明「三个 oracle 单元；card-09 会话账本 CLI 与其 vitest 包装若都执行，只算同一个 oracle 单元」 |
| 6 | pi/v4flash / major | P1 T004:199 | fixed | `phases/P1.md` T004 动作③新增产出「真实入口启动前，至少一张实施卡材料已在位并记录其身份」前置记录（本轮取 CARD-09 归档材料，记录写明「启动前已在位」），并写入 T004 的动作 / 输出 / 完成；`spec.md` AC-C10-005 证据清单同步列入 |
| 7 | pi/v4flash / minor | spec FR-C10-007 | fixed | 同 #2 |
| 8 | pi/v4flash / minor | P1 T006:246 / PFACT-017 | rejected_invalid（作为对本卡材料的缺陷）＋核实事实已登记 | 不改命令。`spec.md` PFACT-017 与 `phases/P1.md` `### 交接知识` 补入核实事实：`git show d1097711:docs/contracts/card-01-stage-material-interface.md` 与 `git show 7c4a2444^:docs/contracts/card-01-stage-material-interface.md` 两个 ref 均已实跑，产出完全相同的 blob（46 行 / sha256 `7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`），故两者可互换、不互斥 |
| 9 | pi/v4flash / minor | spec AC-C10-004:457 | fixed | E2E-1 证据落点分工写进 `spec.md` AC-C10-004、`### 套件条目与执行映射` 第 1 行与 `phases/P1.md` T003 三处：**命令输出落 `<TASK_DIR>/quality/tests/`**（decision-log 用例 1 原文）、**披露说明落 `<TASK_DIR>/quality/evidence/e2e-1/`**；不是整体挪到 `evidence/` |
| 10 | pi/v4flash / minor | spec :334 | fixed | FR-20 机器产物路线的本轮适用判定与 `N/A` + `reason` 记录，列入 `spec.md` AC-C10-005 的证据清单与 `phases/P1.md` T004 动作⑦输出（落 `<TASK_DIR>/quality/tests/`，显式锚定 `prd.md:575`），使其有明确产出主体 |
| 11 | antigravity/flash / blocking | P1 gate_cmd:9 | fixed | `phases/P1.md` 契约头 `gate_cmd` 改为可直接粘贴执行的纯 ASCII 命令串：只用 ASCII 标点（无全角 `；`/`。`）、无 `<` `>` 尖括号占位符；只放预期通过的命令；需要真实会话日志路径的 `card-09-session-ledger.mjs --session …` 从 gate_cmd 移出，改由 T004 动作承载（写成 `"$HOME/.dsh/sessions/$CARD10_PROJECT/session.jsonl"` 形态，用环境变量而非尖括号占位符） |
| 12 | antigravity/flash / major | P1 测试策略:75 起 | fixed | `phases/P1.md` `### 测试策略` 8 行全部换成**各 Task 自己的**内联可执行门禁断言（不再机械复用 card-04 测试或 `ls`/`git status`），并同步进 8 张 T 卡的 `RED/GREEN 门禁命令` 字段；`CARD10_TASK_DIR` 的设定方式与「整体替换为字面路径」的等价替代在表前写明 |
| 13 | antigravity/flash / major | spec AC-C10-008:480 | fixed | `spec.md` AC-C10-008：删掉 `失败：` 里的「判 `failed`」反向门禁，改为母 PRD `prd.md:596` 原文判据（一方改动覆盖另一方契约、或两契约对同一步骤声明不一致）＋「把 `unverified` 写成 `passed` 或写成完成」；AC 正文注明 `unverified` 只是当前证据下的结论（成功条件未满足、失败判据未触发），不是预设锁死的终态 |
| 14 | antigravity/opus / blocking | manifest.json | rejected_invalid（作为对本卡材料的缺陷）＋必须如实登记为真实基础设施事实 | 见下「#14 基础设施事实」。不在本卡写入面；不改写套件用例判据 |
| 15 | codex/luna / major | P1 T003:175 | fixed | `phases/P1.md` T003 的动作⑥ / 输出 / 边界改标为「**归档原件核对记录（artifact inspection）**」，明确不是真实入口执行记录；真实入口判据**显式保持 `unverified`**，除非另有真实入口事件证据。`spec.md` AC-C10-004 同步 |
| 16 | codex/luna / major | P1 T004:198 | fixed | `phases/P1.md` T004 动作④新增：检查本次旅程的阶段证据（来源、命令或交互记录、**顺序核对**、output 落点），并与归档审查证据**分开**记录；`spec.md` AC-C10-005 证据清单同步 |
| 17 | codex/luna / major | P1 T006:248 | fixed | `phases/P1.md` T006 `停止 / 恢复` 与 `GREEN 判定器` 改写：`unverified` 只是**当前已记录证据下的预期结论**；一旦母 PRD 的失败判据被触发（真发生覆盖 / 声明不一致），必须记 `failed` 并阻断完成宣称；GREEN 判据同步放宽为「`unverified` 或（触发失败判据时）`failed`，不得是 `passed`」；边界删去「不判 `failed`」。`spec.md` FR-C10-008 / AC-C10-008 同步 |
| 18 | codex/luna / minor | P1 T004:198 | fixed | `phases/P1.md` T004 动作⑧执行 AC-C10-011 要求的**两条反例命令形态**并各记 exit code 与 output：①`node --test tests/e2e/card-04-real-entry-chain-e2e.test.mjs`（实跑 exit 1、`pass 0 / fail 1`——它是 vitest 文件，`node --test` 跑不通）②裸跑 `node tests/acceptance/card-09-session-ledger.mjs`（实跑 exit 1、`--session required`） |

### #14 基础设施事实（如实登记，不「修」、不改写判据）

- provider `antigravity/opus` 的原始输出（`<TASK_DIR>/quality/reviews/2026-10-05-025-build-plan-document-provider-4.output`）报告：`bundle/review-instructions.md` 与 `bundle/manifest.json` 读不到，其工作区路径出现**字面 `%2F`**（`antigravity%2Fopus`），因此**它没有审到任何提交材料**；它把「空 findings 列表会被误读为 bundle 已通过」作为 issue 报出。
- 聚合结果仍记该 provider `status=completed`、`error=null`，整体 `status=available`、`outcome=completed`——即**审查工具部分不可用却被记为 completed**。这是审查基建侧的路径编码缺陷。
- 该缺陷**不在本卡写入面**：本卡不试图修复它，也不据此改写套件用例的判据；本条 finding 按 `rejected_invalid`（作为对本卡材料的缺陷）处置，基础设施事实本身在此如实登记。
- 它与本卡「关键失败路径②：审查工具不可用」相关，但只作为该路径的真实事例引用，不改变其判据。

### 审查只做一次

- 用户口径：审查只做一次。本次修订**不重跑**审查，也不生成 replacement review 或任何后续审查对象。
- 因此本节记录的是「对冻结材料那一版的异源建议及其处置」；处置是否生效由修订后三份材料本身与仓库契约校验器验证，不由第二次审查背书。
- 18 条 finding 的 provider / severity / 位置顺序与原件一致；`discarded_facts=[]`。

### 一致性准备（spec-analyze）处置

> **本轮性质**＝build-plan 第 11 步**一致性准备（spec-analyze）**的发现处置，**不是**第二次 wh-review。build-plan 的合并审查（`2026-10-05-027-build-plan-document.json`）**已经跑过且只跑一次**；本轮**不重跑审查、不生成 replacement review**，也不新增任何审查对象。下列处置是对三份材料的**定点修订**，其生效由修订后材料本身与仓库契约校验器（`runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract`）验证，不由第二次审查背书。

本轮共 **17 条**一致性准备发现，逐条处置如下。**17 条全部 `fixed`，没有 `rejected_invalid`**（因此不涉及「仅凭披露放过」；ADR-002 的披露不替代定位依据的要求，已按第 6 条在文本里写出可定位 ID）。

| # | 位置 | 处置 | 改了什么 |
| --- | --- | --- | --- |
| 1 | `phases/P1.md` T006 门禁（`### 测试策略` 表与 T006 卡，同一命令两处） | fixed | 反向断言 `grep -q -- "终态: failed" && exit 1` 改为「出现 `终态: failed` 时，交付物必须同时出现『完成宣称被阻断』或『未宣称完成』字面标记，否则非 0」——即**允许合法的 failed、只禁「记了 failed 却仍宣称完成」**。两个方向均已实证（见回报 B 表第 11、12 行） |
| 2 | `spec.md` 需求到任务追踪 T008 行、`spec.md` AC-C10-014 来源行、`phases/P1.md` 速读卡下一步、`phases/P1.md` T008 来源行、`phases/P1.md` T008 可观察接缝行 | fixed | 五处 `prd.md:658` → `prd.md:659`（真停机规则；`:658` 是「规划完成…Status=`final`」），并注明 `decision-log.md` 的 R-011 引用同源（亦写 `:658`），本卡以 `:659` 为准。**实际修 5 处而非发现所列 3 处**：多出的 2 处是 `spec.md` AC-C10-014 的来源行，以及 `phases/P1.md` T008 可观察接缝行的 `prd.md:658 是停止规则`（后者首轮漏改，第 2 轮补修） |
| 3 | `spec.md` PFACT-012、`spec.md` 代码锚点 `steps.json` 行、`spec.md` AC-C10-008 验证、`spec.md` AC-C10-008 失败；`phases/P1.md` 交接知识、T006 输入、T006 动作②、T006 可观察接缝 | fixed | 统一改为「**12 步**（第 11＝`stage-end-spec-analyze`、第 12＝`stage-handoff`）」，不只改数字而写清口径（实测 `workflows/make-decision/steps.json` 的 `step_id` 为 1..12） |
| 4 | `spec.md` FR-C10-011 依据行、`spec.md` AC-C10-011 来源行 | fixed | 注明上游 `decision-log.md:628` 的 `node --test …` 为**被修正形态**（实跑 exit 1），本卡统一 `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`，以此处为准 |
| 5 | `phases/P1.md` 工作包声明「禁止写入面」、`phases/P1.md` L1 文件边界「禁止改动」、`phases/index.md` | fixed | 三处零改动面清单补入本卡 `specs/workflowhub-thin-core-card-10-20260919/decision-log.md`（只读不改），与 `spec.md` 全局文件边界一致。**实际补 3 处而非发现所列 2 处**：多出的 1 处是 `phases/P1.md` L1 文件边界 |
| 6 | `spec.md` FR-C10-005 依据、`spec.md` AC-C10-005 失败、`spec.md` 第 9 节扩展边界 | fixed | 分开落点：**审查节奏项的读法依据＝U-018 / V-025**（用户以母任务 owner 身份正式授权，范围**只限 E2E-2 该项**）；**共存判据的依据＝`prd.md:603``**。两个 ID 真的写出（不是 `U-001..U-018` 范围），并写明 ADR-002「不得仅凭披露放行」 |
| 7 | `spec.md` 第 7 节「套件条目」定义、条目表下方新增逐条清单、`spec.md` AC-C10-001 验证与通过 | fixed | 「五要素」当场定义＝①编号 ②可观察用例 ③成功条件 ④失败条件 ⑤承接负责人；第六项「证据类型」归入条目表「证据落点」列与逐条清单证据行。**不给条目表加列**（保持 5 列），改为表下新增 3 列逐条清单，逐条给出成功/失败条件并逐字引 `prd.md` 行号（`:557`、`:564-566`、`:572-574`、`:580-582`、`:590-591`、`:595-596`、`:600-601`、`:605`） |
| 8 | `spec.md` AC-C10-008 验证 | fixed | 写明触发判定＝由 verify-code 执行者在两侧原件对照中逐条比对，只有出现具名条目「一方改动覆盖另一方契约」或「两契约对同一步骤声明不一致」才触发并判 `failed`；未出现则不触发、终态 `unverified`；判定记录须写出被比对的具名条目与其 `原件: ` 路径 |
| 9 | `spec.md` FR-C10-010、`spec.md` AC-C10-010 失败与证据 | fixed | 写明核对记录字段集＝命令、exit code、output 落点、判定值、`引用-亲历:` 标注；缺该字段即视为不区分「引用」与「亲历」 |
| 10 | `phases/P1.md` `### 测试策略` 记录字段契约段、`phases/P1.md` `### 停止` | fixed | 补「任一 Task 门禁非 0 时该 Task 记 `failed`、**不得进入下一 Task**，并在阶段交接注明阻断点与残留证据（非 0 门禁命令、exit code、残留证据路径）」，填空「预期退出码」只覆盖 RED 目标失败的缺口 |
| 11 | `phases/P1.md` 速读卡「未决事实」 | fixed | 补 **OPEN-C10-004**（承接方＝无，只在本卡如实记录；它是 AC-C10-007 与 AC-C10-014 的强制项） |
| 12 | `phases/P1.md` T008 动作③、`spec.md` 第 12 节交接「交给责任卡」 | fixed | 补交回动作落点＝缺口清单写**具名承接方 + `待确认` 状态**；本卡不代对方确认、不把推断写成已确认（承接方＝无的 OPEN-C10-004 无需交回动作） |
| 13 | `spec.md` 需求到任务追踪 T003/T004/T006 行；`phases/P1.md` T003/T004/T006 来源行 | fixed | 标主责：FR-C10-011/AC-C10-011 与 FR-C10-012/AC-C10-012 主责 **T004（唯一执行者）**；T003 与 T006 改为「依赖 T004 的记录」，并写清执行记录落点＝T004 的 `quality/tests/` 原件，避免重复执行 |
| 14 | `spec.md` PFACT-001..005、PFACT-019、PFACT-020；`spec.md` 条目表第 1 行「真实入口」列 | fixed | 每条 PFACT 标「执行者＝本卡 build-plan 取证子代理；原始 output 落点＝build-plan 取证报告，未落 `<TASK_DIR>/quality/tests/`，不是 verify-code 亲跑记录」；条目 1 真实入口列注明「入口面 `unverified`：宿主真实任务发起入口无原件」，避免与 AC-C10-004 的「入口未验证」并列时被读成入口已联通 |
| 15 | `phases/P1.md` T001 与 T003 门禁（各两处：测试策略表 + Task 卡） | fixed | 补结构 + 内容断言：`test -s`、逐字段 `grep -q`（T001 增 `CARD-01..CARD-09` 与 `判据-1..判据-4`；T003 增 `stage: make-decision`、`Decision revision:`）、要求出现 `命令: ` 与 `exit code: ` 行、要求所有 `原件: ` 行所引路径 `test -f` 实际存在 |
| 16 | `phases/P1.md` T008 门禁（两处） | fixed | `grep -c -- "unverified"` 计行改为锚定计数 `n=$(grep -c -E -- "^INTEG-[123].*unverified" "$f"); test "$n" -eq 3`，要求 INTEG-1/2/3 **三行各含** `unverified`（三条同处一行即非 0） |
| 17 | `phases/P1.md` T004 与 T007 门禁（各两处），同型加固一并覆盖 T002、T005 | fixed | 与第 15 条同一方向加固（结构 + 内容 + 被引原件存在性）：8 个门禁统一补 `test -s`、`命令: `、`exit code: `、`原件: ` + `test -f`；T004 另增 `outcome=completed`、`G-2 披露`；T005 另增 `exit_code: 3`、`RED-STDOUT-MARKER`、`失败slug检索: 未检出`（并禁 `失败slug检索: 已检出`）；T007 另增 `判定:`、`引用-亲历:`；T002 另增 `抽验卡号:` |

> **位置列的行号口径**：上表「位置」列引用的 `spec.md:N`、`phases/P1.md:N` 是**发现时**的行号（以本轮修订前的冻结件为准）。本轮修订后两文件行号已整体位移（`phases/P1.md` 因 `### 测试策略` 表后新增 ```bash 代码块与记录字段契约段而由 327 行变为 357 行），**行号不作为长期定位手段**；复算定位请用该行列出的关键词、小标题名或门禁标识（`GATE-T00n`）检索。

**母任务 owner 事后裁定（共 4 条，已全部落实）**：①「门禁全 ASCII」口径确认为——结构标点必须 ASCII、无全角非 CJK 标点、无尖括号占位符、无裸 `|`、单行可直接粘贴；`grep` 字面量中的中文（`终态`、`原件: `、`入口面: unverified` 等）**合规**，不需替换。②每个门禁中的 1 个 `<` 来自 `done < "$f"` 重定向，属正常 shell 重定向、不是占位符，保留。③`### 需求到任务追踪` 表原为 6 列，超出 `skills/spec-specify/SKILL.md:112-115` 的「表格最多 5 列」硬约束；基线同为 6 列不构成豁免——已把 `FR` 与 `AC` 两列按逐条 1:1 配对合并为 `FR / AC` 列（8 行全覆盖，零信息丢失），`T004` 行并把主责写进 `Phase / Task` 列作 `P1/T004（主责 FR-C10-011/012）`。③补记：`phases/P1.md` 的 `### 测试策略` 表原把整条门禁命令塞进单元格，而命令内含未转义 `|`（`test -s "$f" || exit 1`、`"$((n+m))"`），实测这些行按 `|` 切分是 17–21 列、表头只有 5 列，任何 GFM 渲染器都会把表拆烂——已把第 4 列改为只写门禁标识与预期退出码（`GATE-T001` … `GATE-T008`），表后新增 ```bash 代码块逐条给出 8 条命令全文（每条以 `# GATE-T00n` 注释标识、独占一行、可直接复制粘贴）；表保持 5 列、单元格内不再出现任何 `|`；代码块里的命令与各 Task 卡 `**RED/GREEN 门禁命令**` 逐字一致（脚本断言 byte-identical），且与 16 次双跑 + 8 次补跑的实证所跑命令逐字一致。④`phases/P1.md` T001 的 `- **依赖**: none。` 去掉句末「。」，使 `validatePostPhaseContract` 的 `errors.length` 由 1 降为 0（原残留成因是该校验器的 `WITHOUT_PREDECESSOR` 正则不接受句末标点），本卡不再保留这一已知可修错误。

### 处置后三份材料的版本

> 下列数字是**本轮（build-plan 第 11 步一致性准备 spec-analyze，17 条处置）落盘后**的值。`phases/P1.md` 与 `phases/index.md` 在本轮修订后不再变动，故其哈希是最终值；`spec.md` 因本小节自指，只能记追加前实测值，最终值由读取方现算。

- `phases/P1.md`：**357 行 / 77115 字节 / sha256 `0396d8b4b878c29d025b0910109b3aea0821e89edabd391109609ee62737999b`**。
- `phases/index.md`：**17 行 / 1679 字节 / sha256 `1ead1488041bf3fb26960dbd866de157c33c8aee9d407bad6ff4758c230fae56`**。
- `spec.md`：**本小节（含 `### 一致性准备（spec-analyze）处置`）使 `spec.md` 的 sha256 自指**——正文无法写入自身最终的 sha256。可精确自洽给出的是**行数 690 行 / 字节数 124127 字节**（本小节内的数字替换已收敛到该值）；sha256 由读取方在读取时现算（`shasum -a 256 specs/workflowhub-thin-core-card-10-20260919/spec.md`），并已记录在本次修订的交付回报中。
