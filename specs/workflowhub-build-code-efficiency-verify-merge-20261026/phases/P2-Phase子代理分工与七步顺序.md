# Phase P2 — 每 Phase 三个子代理与七步顺序

读者：本 Phase 的实施者、独立审查者，以及 P3 自动恢复作者、P4 证据作者与每个 Phase 的主会话。
读完要能：不看实现者解释，就能用一条命令判断「谁写、谁审、谁测、按什么顺序、什么时候提交」是否成立。

- **全局规格**：`spec.md#实现设计全局权威`；FR-PHASE-001、FR-PHASE-002 与 Appendix A 的 AC-PHASE-001、AC-PHASE-002 是唯一权威，本卡只写增量。
- **写入集**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/wh-review/SKILL.md`；`skills/stage-handoff/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/phase-team.test.mjs`
- **依赖**：`P1`
- **消费者**：P3 自动恢复作者、P4 证据作者与每个 Phase 的主会话
- **gate_cmd**：`npx vitest run tests/contract/phase-team.test.mjs`
- **oracle**：ORACLE-PHASE-TEAM
- **evidence_path**：`quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P2-phase-team.json`
- **STOP**：正文与 `tests/contract/phase-team.test.mjs` 的七步/角色字面不一致，或写入集里 `tests/contract/phase-team.test.mjs` 开工时读不到：停该处，回 build-code 主会话与 build-plan 主写主核对写入集；不改第三方路径、不复制旧套件、不改断言求绿，其余不依赖该处的正文与断言继续。
- **覆盖 AC**：AC-PHASE-001、AC-PHASE-002
- **Done**：两条 AC 都只由 `npx vitest run tests/contract/phase-team.test.mjs` 重放判定；build-plan 阶段两条都只能记 unavailable，RED 与 GREEN 原件由 build-code 补。要诚实下结论还需：五份正文改动齐、受控夹具五项证明与普通/迟到 finding 两类往返各有原 ref、一份独立审查、`evidence_path` 一份清单；缺一不得记 pass。

## 工作包声明

- **读集**：`spec.md` 的「实现设计（全局权威）」与 Appendix A；`skills/spec-plan/templates/phase-template.md`；`runtime/stage/stage-content-contracts.mjs` 的 Phase 结构与 Tnnn 字段段；`workflows/build-code/SKILL.md` 第 8–9 步与「人为门与审查点」；`AGENTS.md`「派发与回传」；`skills/wh-review/SKILL.md`「输入与方法」「输出和失败边界」；`skills/stage-handoff/SKILL.md`「信息来源」「回读结果」；`docs/architecture/move-map.json`；受控夹具先例 `tests/contract/card05-author-material-consumer.test.mjs`。
- **定序写主**：本 Phase 7 个路径只有一个写主（T002 开发子代理）。其中 `workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`AGENTS.md`、`skills/wh-review/SKILL.md`、`skills/stage-handoff/SKILL.md`、`docs/architecture/move-map.json` 也出现在其它 Phase；全局链P1→P2→…→P12串行，本 Phase 开工先读回当前字节，后写者 P3 起继承本 Phase 已核状态。
- **接口符号清单**：无 runtime 导出符号。共享面是五份正文的节标题与测试 helper 名；N/A — 本 Phase 不改公共接口。
- **合并责任**：T002 开发子代理负责提交与冲突协调；冲突回该子代理；换执行者须重做并保留原失败。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡

- **本 Phase 结果**：复杂任务的每个 build-code Phase 固定 1 开发、1 审查、1 测试子代理；开发是唯一 writer；七步顺序、每 Phase 审后一次提交、普通与迟到 finding 的走法写进五份正文，并由受控 Phase 夹具重放证明。
- **非目标**：不改 P1 的审查执行者选择与 OCR 口径；不实现 P3 自动恢复、P4 证据格式、驾驶舱；不改 push/merge/PR/归档/清理（仍归 stage-close）；不新增运行时状态、公共命令或 schema；不改小改动与普通任务。
- **改动前**：build-code 第 8–9 步只写「主会话发起一次独立代码审查」与「finding 回原实施会话」；「人为门与审查点」只写「Phase 全部完成后提交一次」；没有三角色、唯一 writer、七步顺序、测试子代理只读界定和迟到 finding 重开同 Phase 的规则。
- **改动后**：开发完成并明确回报后，主会话才派审查与测试；审查与测试只读、不改代码/测试/材料；普通 finding 直回开发，只复验受影响面；开发最后确认无待改项；主会话只核四项；每 Phase 审后由开发提交一次；迟到 finding 重开同一 Phase，交同一开发修。
- **与相邻 Phase 的边界**：P1 决定谁来审（低风险独立子代理、高风险或说不清走外部 OCR、终末整卡外部全审）；P2 只决定谁做什么、按什么顺序、什么时候提交。P3 消费第 ③–⑦ 步的恢复时机；P4 消费角色记录、finding 往返与提交次数。交给下游的是固定角色、七步事件序列与每轮一次提交的事实。
- **主要风险**：正文与测试各写一套七步措辞，测试只认字面而正文语义漂移。若因此返工，改法是从 build-code 方法正文解析七步编号作唯一来源，测试只断言正文与夹具一致，不另立第二份顺序表。
- **下一步**：T002 收口后，P3 写自动恢复（消费七步第 ③–⑦ 步），P4 写证据清单（消费角色记录与 finding 往返原 ref）。
- **动手前必读**：`workflows/build-code/SKILL.md:38-39`（第 8–9 步现状）、`workflows/build-code/SKILL.md:73`（当前提交点）、`AGENTS.md:31-37`（派发与回传）、`docs/standard-workflow.md:11`（现有审后提交句）、`docs/standard-workflow.md:43`（专业质量段）、`skills/wh-review/SKILL.md:24-25`（provider 只读与 finding 处置）、`skills/stage-handoff/SKILL.md:22`（信息来源表）、`runtime/stage/stage-content-contracts.mjs:447` 与 `:508-514` 与 `:572-611`（Phase 与卡片字段硬校验）、`tests/contract/card05-author-material-consumer.test.mjs:32-48`（受控任务夹具先例）。
- **未决事实**：写入集声明 `tests/contract/phase-team.test.mjs`，当前工作树同名左移套件在 声明路径是否由上游 Phase 迁入 `tests/contract/` 未核实。影响：P2 追加断言可能落不到声明路径。处理：T002 开工先读回声明路径，缺失即按 STOP 回 build-plan 主写主核对写入集与依赖 Phase，不复制旧套件、不改旧路径。

## 本 Phase 材料导航

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#需求到任务追踪` 的 P2/T002 行 | 核对来源、FR/AC 与 oracle 的绑定 | T002 写卡前 |
| `runtime/stage/stage-content-contracts.mjs:572-611` | 核对任务卡 17 个必填字段与 RED/GREEN 解析口径 | 写卡与写测试前 |
| `tests/contract/card05-author-material-consumer.test.mjs:32-48` | 复用临时任务目录 + `task.json` + `facts.jsonl` 夹具形状 | 写夹具前 |
| `workflows/build-code/SKILL.md:38-39`、`:73` | 定位要改的方法文本与提交点 | 改第一处正文前 |
| `docs/standard-workflow.md:43` | 在「专业质量」相邻处落 Phase 三角色与提交点 | 改正文前 |
| `skills/wh-review/SKILL.md:34` | 在「输出和失败边界」写审查只读与 finding 回开发 | 改正文前 |
| `skills/stage-handoff/SKILL.md:22` | 在「信息来源」表加角色与 finding 往返行 | 改正文前 |

## L0 — 结果与变更

复杂任务的一个 Phase 现在只规定「做什么」，没有规定「谁写、谁审、谁测、按什么顺序、什么时候提交」。本 Phase 把 U-018、U-019 与 F4 落成五份正文的可核规则，并用一个受控 Phase 夹具把规则跑成事件序列。

- **结果**：每个复杂任务 Phase 的契约正文给出三角色、唯一 writer、七步顺序、每 Phase 审后一次提交与两类 finding 走法；一条具名 vitest 命令能重放这五项事实。
- **非目标**：不改审查执行者选择（P1）、不改自动恢复策略（P3）、不定义证据清单格式（P4）、不碰 Git 交付范围（stage-close）。
- **与其它 Phase 的区别**：P1 决定「谁来审」；P2 决定「谁做什么、按什么顺序、什么时候提交」。P3/P4 只消费 P2 的角色记录与顺序事实。

## L1 — 可执行契约

### 文件边界

- **新增**：`tests/contract/phase-team.test.mjs`（受控 Phase 夹具与 ORACLE-PHASE-TEAM 断言）。
- **修改**：`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`AGENTS.md`、`skills/wh-review/SKILL.md`、`skills/stage-handoff/SKILL.md`（角色、七步、提交点与 finding 往返）；`docs/architecture/move-map.json`（登记新测试的职责与消费者）（追加正文左移断言）。
- **禁止改动**：`spec.md` 与 `AC-PHASE-001`、`AC-PHASE-002` 原文（判定权威，改它等于改承诺）；其它 `phases/P*.md` 与 `phases/index.md`（各自 owner）；`runtime/**`、`tools/**`、`package.json`（本 Phase 只改方法与测试，不加运行时机制）；`docs/adr/**`、`docs/archive/**`、`specs/archive/**` 与现 `tests/left-shift/` 套件（历史或别处原件，只读）。

### 任务顺序

只有 T002 一个 Task，依赖 P1；P1 交付审查执行者选择后本 Phase 才开工。本 Phase 内没有并行写同一路径的任务；五份正文、move-map与一份phase-team测试文件由同一写主串行完成。

### 七步顺序（U-019 逐字）

1. 主会话备 Phase packet。
2. 开发实施、写测试、跑目标测试到通过后通知。
3. 主会话再派审查与测试；两者可并行，不得早于开发完成。
4. 普通 finding 回开发；开发修完只复验受影响面。
5. 开发最后确认无待改项，再通知。
6. 主会话只核对四项：无 open finding、无未解释测试失败、Phase Done 与 AC 齐。
7. 只有改 AC 或方向、用户独占阻塞资源、必须有人承担严重风险，才回主会话。

### 测试策略

本 Phase 承接两条 AC，都用同一判定器 `ORACLE-PHASE-TEAM`。开工前四要素逐条如下：

1. **AC-PHASE-001（三角色、唯一 writer、审查与测试不改文件）**：受控夹具层；`npx vitest run tests/contract/phase-team.test.mjs`；预期退出 0；失败条件：角色记录出现两个 writer、审查或测试前后声明写集字节变化、测试子代理改了代码/测试/材料。
2. **AC-PHASE-002（七步顺序、开发完成前不启动审查与测试、普通 finding 回开发、每 Phase 审后一次提交、迟到 finding 重开同一 Phase）**：同一夹具层与同一命令；预期退出 0；失败条件：第 ③ 步派发不晚于第 ② 步完成回报、普通 finding 承接地不是开发、同一轮出现第二次提交、迟到 finding 被丢或只带到期终审。
3. **正文结构（五份文件）**：静态断言层，同一命令读取真实字节；预期五份文件的角色、七步指针、提交点与 finding 走法可定位；失败条件：任一锚点缺失或仍留旧表述。
4. **不测**：真实 provider/OCR 调用（P1 的范围）、真实 Git push/merge/PR（stage-close 的范围）、真实子代理调度（本 Phase 不新增调度器，用 `run` 替身记录事件）。这三项写进覆盖边界，不用 mock 冒充真实效果。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 三角色、唯一 writer、七步与提交点可重放 | T002 | RED | `npx vitest run tests/contract/phase-team.test.mjs` / nonzero | ORACLE-PHASE-TEAM / unavailable — build-plan 不实施，由 build-code 补真实 RED |
| 同一目标转绿 | T002 | GREEN | `npx vitest run tests/contract/phase-team.test.mjs` / 0 | ORACLE-PHASE-TEAM / `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P2-phase-team.json` |

### 受控 Phase 夹具与两类 finding

夹具在 `tests/contract/phase-team.test.mjs` 内自建，跑完即删，不触真实网络、真实 provider 或真实子代理：

- **临时任务目录**：`mkdtempSync(tmpdir())` 下建 `repo/`、`worktree/` 与任务目录；任务目录写 `task.json`（`project_name`、`task_id`、`target_repo_root`、`record_model: vnext-single-write`、`activation_cohort: post`、`workspace_mode: existing`、`workspace_root`）、空 `facts.jsonl`、`quality/tests/`、`quality/reviews/`。
- **当前材料**：`worktree/specs/p8-phase-team-fixture/spec.md` 写最小实现设计与 AC 判据；同目录 `phases/index.md` 写一行 Execution Index（写集 + 依赖 → 消费者）；同目录 `phases/P7-夹具.md` 写一张最小 Task 卡。落盘后 `git add` 并提交一次，保证读取的是真实字节。
- **真实 task handle**：`runtime/task/task-handle.mjs:81` 的 `openTask` 打开临时任务，测试回执走既有 capture，不手写 evidence。
- **`run` 替身**：主会话替身只调用夹具注入的 `run` 记录器，记录 `role`、`step`、`at`、`paths`、`commit_count`；不调真实 CLI、不启动 provider、不发起网络请求。
- **角色替身**：开发只写声明写集；审查与测试只读；测试用已有 capture 存回执，回执落 `quality/tests/`，不算修改代码、测试或材料。

它证明五件事，每条都配一个负面注入：

1. **顺序不可颠倒**：第 ③ 步派发时间晚于第 ② 步「开发完成并通知」；把审查派发挪到通知之前，首个顺序断言失败。
2. **唯一 writer**：`git diff --name-only` 只出现开发替身写过的声明写集路径，角色记录里 writer 恰好 1 个；让审查替身写一个文件即失败。
3. **审查与测试不改文件**：在审查与测试前后对声明写集与材料树取字节比较，字节相同；让审查或测试替身改任一文件即失败。
4. **开发最后确认**：第 ⑤ 步必须先有开发「无待改项」确认，主会话才推进；缺该确认就推进即失败。
5. **主会话只推进四项**：主会话事件里只出现无 open finding、无未解释测试失败、Phase Done、AC 齐四项，不写文件、不跑测试、不查细节 bug；任一步越界即失败。

**普通 finding 直回开发**：在第 ④ 步注入一条 finding，断言承接地是同一开发会话；审查与测试不拿修复；开发修完只跑受影响 file/case，集合小于本 Phase 全量，且不出现第二次全 Phase 审查；把 finding 交给审查或测试即失败。

**迟到 finding 重开同一 Phase**：Phase 审后提交完成后再注入一条 finding，断言 Phase 编号不变、轮次标记为重开、开发会话与上一轮相同；审查与测试只复验受影响面，修完追加一次审后提交；把该 finding 丢给终末审或直接关闭即失败。

### 覆盖边界

- **覆盖上限**：受控夹具只能确立「正文规定的角色、顺序、写权、提交次数与 finding 往返在本地替身下可重放」；不证明真实子代理调度、真实 provider/OCR、真实 Git 交付或真实耗时下降。
- **显式不覆盖**：P1 的审查执行者选择与三维证据；P3 的自动恢复触发与分诊；P4 的证据清单格式；stage-close 的 push/merge/PR/归档/清理。

### 停止

出现以下任一即停该处并回原 owner，不静默改绿：夹具出现第二个 writer、审查或测试改动了声明写集字节、审查派发早于开发完成回报、同一轮出现第二次提交、迟到 finding 被丢或只带到期终审。正文与测试字面冲突时，以 build-code 方法正文为唯一来源，两处一起改并保留原失败；声明路径 `tests/contract/phase-team.test.mjs` 读不到时停该文件，回 build-plan 主写主核对写入集。负责修复的是 T002 开发子代理；换执行者须重做并保留原失败。

### 完成

两条 AC 各按 `spec.md` Appendix A 原判据判定，且都只由 `npx vitest run tests/contract/phase-team.test.mjs` 重放：AC-PHASE-001 需要三角色、唯一 writer、审查与测试字节不变三项断言通过；AC-PHASE-002 需要七步顺序、每轮审后一次提交、普通 finding 回开发、迟到 finding 重开同一 Phase 四项断言通过。还要有受控夹具五项证明与两类 finding 往返的原件、五份正文的真实 diff、一份独立审查、`evidence_path` 清单。缺一项记 unavailable 或 incomplete，写清 owner 与取得条件，不记 pass。

### 风险与回滚

- **风险**：正文与测试各写一套七步措辞；测试只认字面时，改一句正文就要改测试，反过来测试可能掩盖语义漂移。
- **影响**：后续 Phase 按错误顺序或错误提交点执行，AC-PHASE-002 出现假绿。
- **缓解**：七步只在 build-code 方法正文写一份完整文本；其余四份只写角色、写权、提交点并指向它；测试从正文抓七步编号，不另立第二份顺序表。
- **回滚**：只回退本 Phase 的 8 个路径改动，保留 P7–P1 已有提交；回退后重跑 `npx vitest run tests/contract/phase-team.test.mjs`，失败原件保留。
- **触发条件**：同一断言在正文未变时反复失败，或夹具为了通过开始 mock 真实调度或网络；出现即停并回 build-plan 主写主改契约。

### 交接知识

- `runtime/stage/stage-content-contracts.mjs:572-611` 要求每张 Task 卡 17 个字段具体；`:508-514` 要求 Phase 文件有 H1 与 `L0`、`L1`、`L2`。本卡按这两处写。
- `tests/contract/card05-author-material-consumer.test.mjs:32-48` 是可复用的临时任务夹具：`task.json` 的 post 字段组合、空 `facts.jsonl`、`openTask` 读取与 finally 清理。
- `workflows/build-code/SKILL.md:38-39` 是第 8–9 步现状，`:73` 是当前提交点；P3/P4 会消费本 Phase 改后的同一位置，读回时按实际字节，不按行号。
- `skills/stage-handoff/SKILL.md:22` 的信息来源表是本 Phase 交接记录形状的消费点；P4 的证据作者按该表读角色、七步位置与 finding 往返，不新建第二份记录。

### T002 — 三角色、唯一 writer 与七步顺序

- **来源 / FR / AC**：`U-018`（复杂任务每个 Phase 配 1 开发、1 审查、1 测试子代理；开发是唯一 writer；审查与测试不改代码、测试或材料）、`U-019`（七步顺序已定）、`F4`（每 Phase 审后提交一次；迟到 finding 重开同一 Phase）；`FR-PHASE-001`、`FR-PHASE-002`；`AC-PHASE-001`、`AC-PHASE-002`。
- **输入**：`spec.md` 的「实现设计（全局权威）」与 Appendix A；P1 已交付的审查执行者选择；现状 `workflows/build-code/SKILL.md:38-39`、`:73`；`AGENTS.md:31-37`；`skills/wh-review/SKILL.md:20-34`；`skills/stage-handoff/SKILL.md:22`；`runtime/stage/stage-content-contracts.mjs:508-514`、`:572-611`；受控夹具先例 `tests/contract/card05-author-material-consumer.test.mjs:32-48`。
- **文件 / 符号**：`workflows/build-code/SKILL.md`（符号：「方法」第 8–9 步与「人为门与审查点」的提交点段）；`docs/standard-workflow.md`（符号：「build-code 测试与质量」下新增「Phase 三角色与提交点」小节）；`AGENTS.md`（符号：「派发与回传」新增三角色与唯一 writer 段）；`skills/wh-review/SKILL.md`（符号：「输入与方法」「输出和失败边界」的 Phase 审查段）；`skills/stage-handoff/SKILL.md`（符号：「信息来源」表新行与「回读结果」段）；`docs/architecture/move-map.json`（符号：`entries` 数组新增 `tests/contract/phase-team.test.mjs` 条目）；`tests/contract/phase-team.test.mjs`（符号：`ORACLE-PHASE-TEAM` describe、`buildControlledPhase()`、`playSevenSteps()`、`injectFinding()`、`reopenLateFinding()`）（符号：P2 正文左移断言块）。
- **动作**：① 在 build-code 方法正文写唯一一份完整七步、三角色、开发唯一 writer、F4 提交点与普通/迟到 finding 走法；F4 提交点逐字写「开发完成、审查与测试回报无进一步 finding、目标测试与证据齐后，由开发子代理在本 Phase 提交一次；最终 Phase 的最终提交在终末审查与修复之后；push/merge/PR/归档/清理归 stage-close」；F4 迟到 finding 逐字写「重开同一 Phase，回同一开发子代理修，审查与测试只复验受影响面；不得丢弃，也不得只带到期终审」。② 在 standard-workflow 写复杂任务的角色、写权、提交点并指向 build-code 的七步，不复写第二份顺序表。③ 在 AGENTS 派发段写三角色 brief、唯一 writer、测试子代理「不改代码、测试、材料；只读执行并用既有 capture 保存回执，这不属于修改」与主会话四项核对。④ 在 wh-review 写审查只在开发完成并明确回报后启动、只读、普通 finding 回开发、迟到 finding 重开同一 Phase。⑤ 在 stage-handoff 的信息来源表加入角色、七步位置、finding 往返与提交次数。⑥ 在 move-map 登记新测试的职责、owner、consumer 与删除条件。⑦ 写 `tests/contract/phase-team.test.mjs`：先落受控夹具与五项证明，再写普通与迟到 finding 两条往返及全部负面注入。⑧ 在同一 `tests/contract/phase-team.test.mjs` 追加正文存在/缺失断言；`tests/left-shift/` 保持只读。⑨ 跑 gate_cmd，保存实际输出与退出码。
- **输出 / 失败**：可观察结果是 `npx vitest run tests/contract/phase-team.test.mjs` 退出 0，测试报告逐条列出五项证明与两类 finding；失败信号是第二个 writer、审查或测试改动字节、审查早于开发完成、同一轮第二次提交、迟到 finding 被丢；非法输入如缺写集或夹具材料不合形状时显式失败，不 skip；临时目录在 finally 清理。
- **边界 / 禁止改动**：`spec.md` 与两条 AC 原文不改（判定权威）；其它 `phases/P*.md`、`phases/index.md` 不改（各自 owner）；`runtime/**`、`tools/**`、`package.json` 不改（本 Phase 不新增运行时机制或公共入口）；`docs/adr/**`、`docs/archive/**`、`specs/archive/**` 与现 `tests/left-shift/` 套件只读。
- **依赖**：`P1`（审查执行者选择已落地，本 Task 只消费）；无同路径并行写。
- **测试层级 / 技能**：静态正文断言 + 受控夹具 + 负面注入；主技能 `skills/backend-testing/SKILL.md` 的「行为测试与证伪」「执行事实」；UI、数据库、网络不涉及，原因本 Phase 只改方法与测试。
- **场景 / 夹具或服务**：正常用例是三角色按七步走完一轮、普通 finding 回开发修完复验、迟到 finding 重开同一 Phase 再提交；反向用例是审查先于开发完成、第二个 writer、审查或测试写文件、主会话跑测试、普通 finding 交给审查、迟到 finding 只带到期终审；夹具是本地临时任务目录，无外部服务，finally 清理。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/phase-team.test.mjs`
- **预期退出码**：RED nonzero；GREEN 0
- **RED 目标失败**：ORACLE-PHASE-TEAM 断言：改动前正文没有三角色、七步与提交点字面，夹具组不出第 ② 步到第 ③ 步的先后边，首个顺序断言失败；setup 或导入失败不算目标 RED。
- **RED 证据**：unavailable — build-plan 不实施，由 build-code 补真实 RED
- **GREEN 判定器**：ORACLE-PHASE-TEAM 同一命令退出 0：五份正文锚点可读，受控夹具五项证明与普通/迟到 finding 两类往返全部通过；具名反向行为是审查早于开发完成、第二个 writer、审查或测试改动字节、主会话跑测试、finding 错投或迟到项被丢，任一出现即非零。
- **证据**：`quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P2-phase-team.json`；计划 RED 为 unavailable，GREEN 原件由 build-code 保存；本卡不声称执行。
- **覆盖上限**：不证明真实子代理调度、真实 provider/OCR、真实 Git 交付与真实耗时；不证明 P1 的审查执行者选择。
- **停止 / 恢复**：正文与测试字面不一致 → 以 build-code 方法正文为唯一来源，两处一起改并保留原失败；夹具需要真实网络或 provider → 停该夹具改纯本地替身；声明路径 `tests/contract/phase-team.test.mjs` 读不到 → 停该文件，回 build-plan 主写主核对写入集；不得静默回退或改断言求绿。
- **完成**：AC-PHASE-001 由三角色、唯一 writer、审查与测试字节不变三项断言通过证明；AC-PHASE-002 由七步顺序、每轮审后一次提交、普通 finding 回开发、迟到 finding 重开同一 Phase 四项断言通过证明；加上 gate_cmd 退出 0、独立审查与 `evidence_path` 清单，才可记 pass；缺项记 unavailable/incomplete 并写 owner。

#### 附加条款（T002） 的审查与测试回报接缝

七步原文保留 U-019；第 ③–⑤ 步之间必须收到审查、测试两方各自明确回报。审查回报列 finding 与未解决项；测试回报列命令、退出码、失败归因与覆盖限制。开发确认仅表示写主无待改项，不能替代两方回报；任一未回、仍有 open finding 或未解释测试失败，主会话继续等该回报/回原开发修复，不提交本轮。`playSevenSteps()` 增加两方报告事件及汇合条件，普通/迟到 finding 修复后要求受影响方重新明确回报。命令 `npx vitest run tests/contract/phase-team.test.mjs`，期望正常与修复往返退出 0；审查缺回报、测试缺回报、开发单方宣告通过、复验未回报就提交四个负例均非零。

## L2 — 可删除参考

夹具事件记录的参考形状（实现可改字段名；删除本节不改变 L0/L1）：

```json
{"role":"dev","step":"dev_done","at":"2026-01-01T00:00:00.000Z","paths":["src/owned.mjs"],"commit_count":0}
```

删除条件：`tests/contract/phase-team.test.mjs` 落地后，其断言、正文锚点与证据清单足以复现本节信息。
